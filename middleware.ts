/**
 * middleware.ts  (place at project root, same level as /app)
 *
 * Production-grade middleware with:
 * - Admin route protection
 * - Rate limiting
 * - Security headers
 * - Session verification
 */

import { NextRequest, NextResponse } from 'next/server';
import { rateLimit, getRateLimitConfig } from '@/lib/rateLimit';

export const config = {
  matcher: [
    '/admin/:path*',
    '/api/:path*',
    '/register/:path*',
    '/iec-portal-2026',
  ],
};

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Apply rate limiting first
  const rateLimitConfig = getRateLimitConfig(pathname);
  const rateLimitResponse = rateLimit(rateLimitConfig)(req);
  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  // Add security headers to all responses
  const response = NextResponse.next({
    request: {
      headers: req.headers,
    },
  });

  // Security headers
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  
  // Remove server info
  response.headers.set('Server', '');
  response.headers.set('X-Powered-By', '');

  // Handle admin routes
  if (pathname.startsWith('/admin')) {
    // Allow login page through
    if (pathname === '/admin/login') {
      return response;
    }

    const token = req.cookies.get('iec_admin_token')?.value;
    const email = req.cookies.get('iec_admin_email')?.value;

    // No cookie → redirect to login immediately
    if (!token || !email) {
      return NextResponse.redirect(new URL('/admin/login', req.url));
    }

    // Validate token format (64-char hex) — reject obviously forged tokens fast
    if (!/^[a-f0-9]{64}$/.test(token)) {
      const res = NextResponse.redirect(new URL('/admin/login', req.url));
      res.cookies.set('iec_admin_token', '', { maxAge: 0, path: '/admin' });
      res.cookies.set('iec_admin_email', '', { maxAge: 0, path: '/admin' });
      return res;
    }

    // Verify session against DB via internal API route
    try {
      const verifyUrl = new URL('/api/admin/session', req.url);
      const verifyRes = await fetch(verifyUrl.toString(), {
        headers: {
          cookie: req.headers.get('cookie') || '',
        },
      });

      if (!verifyRes.ok) {
        const res = NextResponse.redirect(new URL('/admin/login', req.url));
        res.cookies.set('iec_admin_token', '', { maxAge: 0, path: '/admin' });
        res.cookies.set('iec_admin_email', '', { maxAge: 0, path: '/admin' });
        return res;
      }

      // Inject admin identity into request headers for downstream use
      const data = await verifyRes.json();
      const requestHeaders = new Headers(req.headers);
      requestHeaders.set('x-admin-id', data.admin?.id || '');
      requestHeaders.set('x-admin-email', data.admin?.email || '');
      requestHeaders.set('x-admin-role', data.admin?.role || '');
      requestHeaders.set('x-admin-name', data.admin?.full_name || '');

      return NextResponse.next({ request: { headers: requestHeaders } });

    } catch {
      return NextResponse.redirect(new URL('/admin/login', req.url));
    }
  }

  // Handle API routes
  if (pathname.startsWith('/api/')) {
    // Add CORS headers for API routes
    const origin = req.headers.get('origin');
    const allowedOrigins = [
      process.env.NODE_ENV === 'production' 
        ? 'https://iec.alsi-election-org.workers.dev' 
        : 'http://localhost:3000',
      'http://localhost:3001',
    ];

    if (allowedOrigins.includes(origin || '')) {
      response.headers.set('Access-Control-Allow-Origin', origin || '');
    }
    
    response.headers.set('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    response.headers.set('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization, Cookie');
    response.headers.set('Access-Control-Allow-Credentials', 'true');
    response.headers.set('Access-Control-Max-Age', '86400');
  }

  return response;
}