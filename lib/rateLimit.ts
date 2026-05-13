/**
 * lib/rateLimit.ts
 * IEC Admin Portal — Edge-compatible in-memory rate limiter
 *
 * Used by middleware.ts to throttle:
 *  - Admin login attempts
 *  - Registration form submissions
 *  - API routes generally
 *
 * NOTE: For multi-instance deployments (Vercel Edge), swap the in-memory
 * store for Upstash Redis. The interface is identical — only the store changes.
 */

import { NextRequest, NextResponse } from "next/server";

interface RateLimitConfig {
  windowMs: number;   // sliding window in milliseconds
  maxRequests: number; // max hits per window
  message?: string;
}

interface HitRecord {
  count: number;
  resetAt: number;
}

// In-memory store — scoped per Edge worker instance
// Replace with: import { Redis } from "@upstash/redis" for multi-instance
const store = new Map<string, HitRecord>();

// Cleanup old entries every 5 minutes to prevent memory leak
let cleanupScheduled = false;
function scheduleCleanup() {
  if (cleanupScheduled) return;
  cleanupScheduled = true;
  setInterval(() => {
    const now = Date.now();
    store.forEach((record, key) => {
      if (record.resetAt < now) store.delete(key);
    });
  }, 5 * 60 * 1000);
}

/**
 * getRateLimitConfig
 * Returns the appropriate rate limit config for a given path.
 * Strictest limits on auth routes, looser on public API.
 */
export function getRateLimitConfig(pathname: string): RateLimitConfig {
  // Admin login — strictest: 5 attempts per 15 minutes per IP
  if (pathname === "/api/admin/login") {
    return {
      windowMs: 15 * 60 * 1000,
      maxRequests: 5,
      message: "Too many login attempts. Try again in 15 minutes.",
    };
  }

  // Nonce endpoint — 20 per minute (prevents nonce harvesting)
  if (pathname === "/api/admin/nonce") {
    return {
      windowMs: 60 * 1000,
      maxRequests: 20,
      message: "Too many requests.",
    };
  }

  // Registration endpoints — 3 submissions per hour per IP
  if (
    pathname.startsWith("/api/register") ||
    pathname.startsWith("/register")
  ) {
    return {
      windowMs: 60 * 60 * 1000,
      maxRequests: 3,
      message: "Too many registration attempts. Try again in 1 hour.",
    };
  }

  // All other admin API routes — 60 per minute
  if (pathname.startsWith("/api/admin")) {
    return {
      windowMs: 60 * 1000,
      maxRequests: 60,
      message: "Rate limit exceeded.",
    };
  }

  // General API — 120 per minute
  return {
    windowMs: 60 * 1000,
    maxRequests: 120,
    message: "Rate limit exceeded.",
  };
}

/**
 * rateLimit
 * Returns a middleware function that enforces the given config.
 * Returns null (pass-through) or a 429 NextResponse.
 */
export function rateLimit(
  config: RateLimitConfig
): (req: NextRequest) => NextResponse | null {
  scheduleCleanup();

  return (req: NextRequest): NextResponse | null => {
    // Key = IP + pathname for per-route per-IP limiting
    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      req.headers.get("x-real-ip") ??
      "unknown";

    const key = `${ip}:${req.nextUrl.pathname}`;
    const now = Date.now();

    const existing = store.get(key);

    if (!existing || existing.resetAt < now) {
      // Fresh window
      store.set(key, { count: 1, resetAt: now + config.windowMs });
      return null;
    }

    if (existing.count >= config.maxRequests) {
      const retryAfterSec = Math.ceil((existing.resetAt - now) / 1000);
      return new NextResponse(
        JSON.stringify({ error: config.message ?? "Rate limit exceeded." }),
        {
          status: 429,
          headers: {
            "Content-Type": "application/json",
            "Retry-After": retryAfterSec.toString(),
            "X-RateLimit-Limit": config.maxRequests.toString(),
            "X-RateLimit-Remaining": "0",
            "X-RateLimit-Reset": existing.resetAt.toString(),
          },
        }
      );
    }

    // Increment within window
    existing.count++;
    return null;
  };
}