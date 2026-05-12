import { NextRequest, NextResponse } from "next/server";

// ALL admin and bypass routes — must be exhaustive
const BYPASS_PREFIXES = [
  "/iec-portal-2026",
  "/admin",
  "/maintenance",
  "/_next",
  "/favicon",
  "/api",
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Always bypass admin and system routes
  const isBypassed = BYPASS_PREFIXES.some(prefix => pathname.startsWith(prefix));
  if (isBypassed) return NextResponse.next();

  // Check maintenance mode from Supabase
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

    const res = await fetch(
      `${supabaseUrl}/rest/v1/system_config?key=eq.maintenance_mode&select=value`,
      {
        headers: {
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
          "Cache-Control": "no-cache",
        },
      }
    );

    if (res.ok) {
      const data = await res.json();
      const isDown = data?.[0]?.value === "true";

      if (isDown && pathname !== "/maintenance") {
        // Use redirect (not rewrite) — works correctly on Cloudflare edge
        const url = request.nextUrl.clone();
        url.pathname = "/maintenance";
        return NextResponse.redirect(url, { status: 302 });
      }
    }
  } catch (e) {
    // Never block on DB error — fail open
    console.error("Maintenance check failed:", e);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};