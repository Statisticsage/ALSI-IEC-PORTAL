import { NextRequest, NextResponse } from "next/server";

// Routes that bypass maintenance mode (admin always accessible)
const BYPASS_ROUTES = [
  "/iec-portal-2026",
  "/admin",
  "/admin/login",
  "/admin/dashboard",
  "/admin/candidates",
  "/admin/voters",
  "/admin/parties",
  "/admin/export",
  "/admin/audit",
  "/maintenance",
  "/_next",
  "/favicon.ico",
];

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Always allow admin and static routes through
  const isBypassed = BYPASS_ROUTES.some(route => pathname.startsWith(route));
  if (isBypassed) return NextResponse.next();

  // Check maintenance mode from DB via Supabase REST
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

    const res = await fetch(
      `${supabaseUrl}/rest/v1/system_config?key=eq.maintenance_mode&select=value`,
      {
        headers: {
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
        },
        cache: "no-store",
      }
    );

    if (res.ok) {
      const data = await res.json();
      const isMaintenanceMode = data?.[0]?.value === "true";

      if (isMaintenanceMode) {
        const url = request.nextUrl.clone();
        url.pathname = "/maintenance";
        return NextResponse.rewrite(url);
      }
    }
  } catch {
    // If DB check fails, allow through — never block on error
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};