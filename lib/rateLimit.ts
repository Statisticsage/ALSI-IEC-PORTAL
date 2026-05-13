// ============================================================
// IEC ELECTION PORTAL - PRODUCTION RATE LIMITING
// Protects against brute force attacks and API abuse
// ============================================================

import { NextRequest, NextResponse } from 'next/server';

// Rate limit configurations for different endpoints
const RATE_LIMITS = {
  // Login endpoints - very strict
  login: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // 5 attempts per window
    skipSuccessfulRequests: false,
  },
  // Registration endpoints - moderate
  registration: {
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 3, // 3 registrations per hour per IP
    skipSuccessfulRequests: false,
  },
  // General API endpoints - lenient
  api: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // 100 requests per window
    skipSuccessfulRequests: true,
  },
  // Export endpoints - very strict
  export: {
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 10, // 10 exports per hour
    skipSuccessfulRequests: false,
  },
};

// In-memory store for rate limits (in production, use Redis)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

// Cleanup old entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of rateLimitStore.entries()) {
    if (now > value.resetTime) {
      rateLimitStore.delete(key);
    }
  }
}, 5 * 60 * 1000); // Cleanup every 5 minutes

function getClientIdentifier(request: NextRequest): string {
  // Try to get a unique identifier from multiple sources
  const forwardedFor = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');
  const cfConnectingIp = request.headers.get('cf-connecting-ip'); // Cloudflare
  
  // Use the most reliable IP source
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim();
  }
  if (realIp) {
    return realIp;
  }
  if (cfConnectingIp) {
    return cfConnectingIp;
  }
  
  // Fallback to a combination of headers for identification
  const userAgent = request.headers.get('user-agent') || '';
  const accept = request.headers.get('accept') || '';
  return `unknown-${userAgent.slice(0, 20)}-${accept.slice(0, 20)}`;
}

function isRateLimited(
  identifier: string,
  config: typeof RATE_LIMITS[keyof typeof RATE_LIMITS]
): boolean {
  const key = `${identifier}-${Date.now() - (Date.now() % config.windowMs)}`;
  const now = Date.now();
  
  const record = rateLimitStore.get(key);
  
  if (!record) {
    rateLimitStore.set(key, {
      count: 1,
      resetTime: now + config.windowMs,
    });
    return false;
  }
  
  if (record.count >= config.max) {
    return true;
  }
  
  record.count++;
  return false;
}

export function rateLimit(config: keyof typeof RATE_LIMITS) {
  return function(request: NextRequest): NextResponse | null {
    const identifier = getClientIdentifier(request);
    const rateLimitConfig = RATE_LIMITS[config];
    
    if (isRateLimited(identifier, rateLimitConfig)) {
      return NextResponse.json(
        {
          error: 'Too many requests',
          message: `Rate limit exceeded. Try again in ${Math.ceil(rateLimitConfig.windowMs / 60000)} minutes.`,
          retryAfter: Math.ceil(rateLimitConfig.windowMs / 1000),
        },
        {
          status: 429,
          headers: {
            'X-RateLimit-Limit': rateLimitConfig.max.toString(),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': new Date(Date.now() + rateLimitConfig.windowMs).toISOString(),
            'Retry-After': Math.ceil(rateLimitConfig.windowMs / 1000).toString(),
          },
        }
      );
    }
    
    return null; // Not rate limited
  };
}

// Helper function to determine rate limit config based on path
export function getRateLimitConfig(pathname: string): keyof typeof RATE_LIMITS {
  if (pathname.includes('/login') || pathname.includes('/admin/login')) {
    return 'login';
  }
  if (pathname.includes('/register') || pathname.includes('/api/notify-registration')) {
    return 'registration';
  }
  if (pathname.includes('/export') || pathname.includes('/admin/export')) {
    return 'export';
  }
  if (pathname.startsWith('/api/')) {
    return 'api';
  }
  return 'api'; // Default to API limits
}
