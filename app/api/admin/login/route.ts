/**
 * app/api/admin/login/route.ts
 */
import { NextRequest, NextResponse } from "next/server";
import { getServerClient } from "@/lib/supabaseServer";

const COOKIE_TOKEN   = "iec_admin_token";
const COOKIE_EMAIL   = "iec_admin_email";
const COOKIE_MAX_AGE = 8 * 60 * 60;

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";

  try {
    let body: { email?: string; password?: string };
    try { body = await req.json(); }
    catch { return NextResponse.json({ error: "Invalid request." }, { status: 400 }); }

    const email    = (body.email ?? "").toLowerCase().trim();
    const password = body.password ?? "";

    if (!email || !password)
      return NextResponse.json({ error: "Email and password are required." }, { status: 422 });

    if (!/^[^@]+@[^@]+\.[^@]+$/.test(email))
      return NextResponse.json({ error: "Invalid email format." }, { status: 422 });

    const supabase = getServerClient();

    // Step 1: verify password — returns jsonb { valid, id, email, full_name, role, permissions, reason }
    const { data: auth, error: authErr } = await supabase.rpc("verify_admin_password", {
      input_email:    email,
      input_password: password,
      input_ip:       ip,
    });

    if (authErr) {
      console.error("[LOGIN] verify_admin_password error:", authErr.message);
      return NextResponse.json({ error: "Authentication service unavailable." }, { status: 503 });
    }

    if (!auth?.valid) {
      const reason   = auth?.reason ?? "Invalid credentials. Access denied.";
      const isLocked = reason.toLowerCase().includes("lock") || reason.toLowerCase().includes("denied");
      return NextResponse.json({ success: false, error: reason, locked: isLocked },
        { status: isLocked ? 429 : 401 });
    }

    // Step 2: create session — returns TEXT (raw 64-char hex token)
    const { data: token, error: sessErr } = await supabase.rpc("create_admin_session", {
      p_admin_id:    auth.id,
      p_admin_email: auth.email,
      p_admin_role:  auth.role,
      p_ip_address:  ip,
    });

    if (sessErr || !token) {
      console.error("[LOGIN] create_admin_session error:", sessErr?.message);
      return NextResponse.json({ error: "Failed to create session. Please try again." }, { status: 500 });
    }

    const isProd = process.env.NODE_ENV === "production";
    const res    = NextResponse.json({
      success: true,
      admin: {
        id:          auth.id,
        email:       auth.email,
        full_name:   auth.full_name,
        role:        auth.role,
        permissions: auth.permissions,
      },
    }, { status: 200 });

    res.cookies.set(COOKIE_TOKEN, token as string, {
      httpOnly: true,  secure: isProd, sameSite: "strict", maxAge: COOKIE_MAX_AGE, path: "/",
    });
    res.cookies.set(COOKIE_EMAIL, auth.email as string, {
      httpOnly: false, secure: isProd, sameSite: "strict", maxAge: COOKIE_MAX_AGE, path: "/",
    });

    return res;

  } catch (err) {
    console.error("[LOGIN] Unhandled:", err);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ error: "Method not allowed." }, { status: 405 });
}