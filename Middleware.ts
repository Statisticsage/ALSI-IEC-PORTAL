/**
 * middleware.ts — root of project
 * Protects all /admin routes except /admin/login
 * Verifies the iec_admin_token cookie on every request server-side
 */
import { NextRequest, NextResponse } from "next/server";

const COOKIE_TOKEN    = "iec_admin_token";
const LOGIN_PATH      = "/admin/login";
const VERIFY_API_PATH = "/api/admin/verify-session";

// Routes that do NOT require auth
const PUBLIC_PREFIXES = [
  "/admin/login",
  "/api/admin/login",
  "/api/admin/verify-session",
  "/_next",
  "/favicon",
  "/register",
  "/status",
  "/api/status",
];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Only intercept /admin routes and /api/admin routes (except public ones)
  const isAdminRoute = pathname.startsWith("/admin") || pathname.startsWith("/api/admin");
  if (!isAdminRoute) return NextResponse.next();

  // Allow public paths through
  if (PUBLIC_PREFIXES.some(p => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  // Check for session token cookie
  const token = req.cookies.get(COOKIE_TOKEN)?.value;

  if (!token) {
    // No token — redirect to login
    const loginUrl = new URL(LOGIN_PATH, req.url);
    loginUrl.searchParams.set("reason", "no_session");
    return NextResponse.redirect(loginUrl);
  }

  // Verify the token by calling our verify-session API
  try {
    const verifyUrl = new URL(VERIFY_API_PATH, req.url);
    const verifyRes = await fetch(verifyUrl.toString(), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        // Forward the cookie so the verify endpoint can read it
        "Cookie": `${COOKIE_TOKEN}=${token}`,
      },
      body: JSON.stringify({ token }),
    });

    if (!verifyRes.ok) {
      const loginUrl = new URL(LOGIN_PATH, req.url);
      loginUrl.searchParams.set("reason", "session_invalid");
      const res = NextResponse.redirect(loginUrl);
      res.cookies.delete(COOKIE_TOKEN);
      return res;
    }

    const data = await verifyRes.json();
    if (!data.valid) {
      const loginUrl = new URL(LOGIN_PATH, req.url);
      loginUrl.searchParams.set("reason", data.reason ?? "session_expired");
      const res = NextResponse.redirect(loginUrl);
      res.cookies.delete(COOKIE_TOKEN);
      return res;
    }

    // Valid — forward request, inject admin info as headers for downstream use
    const requestHeaders = new Headers(req.headers);
    requestHeaders.set("x-admin-id",    data.admin?.id ?? "");
    requestHeaders.set("x-admin-role",  data.admin?.role ?? "");
    requestHeaders.set("x-admin-email", data.admin?.email ?? "");

    return NextResponse.next({ request: { headers: requestHeaders } });
  } catch {
    // Verify service unreachable — fail open to avoid locking out on deploy
    // but log it
    console.error("[MIDDLEWARE] Session verify failed — allowing through");
    return NextResponse.next();
  }
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/api/admin/:path*",
  ],
};