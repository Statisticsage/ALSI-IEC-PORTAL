import { NextRequest, NextResponse } from "next/server";

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const store = new Map<string, RateLimitEntry>();

export interface RateLimitConfig {
  limit: number;
  windowMs: number;
  message?: string;
}

export function getRateLimitConfig(pathname: string): RateLimitConfig {
  if (pathname === "/api/admin/login" || pathname === "/iec-portal-2026") {
    return { limit: 5, windowMs: 10 * 60 * 1000, message: "Too many login attempts. Try again in 10 minutes." };
  }
  if (pathname.startsWith("/api/register") || pathname.startsWith("/register")) {
    return { limit: 10, windowMs: 5 * 60 * 1000, message: "Too many submissions. Please wait before trying again." };
  }
  if (pathname.startsWith("/api/status") || pathname === "/status") {
    return { limit: 30, windowMs: 60 * 1000 };
  }
  if (pathname.startsWith("/api/admin")) {
    return { limit: 120, windowMs: 60 * 1000 };
  }
  return { limit: 200, windowMs: 60 * 1000 };
}

// Single function — call directly in middleware
export function checkRateLimit(
  req: NextRequest,
  config: RateLimitConfig
): NextResponse | null {
  const ip =
    req.headers.get("cf-connecting-ip") ||
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "unknown";

  const key = `${ip}:${req.nextUrl.pathname}`;
  const now = Date.now();
  const entry = store.get(key);

  if (!entry || now > entry.resetAt) {
    store.set(key, { count: 1, resetAt: now + config.windowMs });
    return null;
  }

  entry.count += 1;

  if (entry.count > config.limit) {
    const retryAfter = Math.ceil((entry.resetAt - now) / 1000);
    return new NextResponse(
      JSON.stringify({
        error: config.message || "Rate limit exceeded.",
        retryAfter,
      }),
      {
        status: 429,
        headers: {
          "Content-Type": "application/json",
          "Retry-After": String(retryAfter),
        },
      }
    );
  }

  return null;
}