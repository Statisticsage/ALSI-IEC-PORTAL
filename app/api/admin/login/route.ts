import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";

const COOKIE_NAME = "iec_admin_token";
const COOKIE_EMAIL = "iec_admin_email";
const MAX_ATTEMPTS = 5;
const LOCKOUT_MINUTES = 15;

export async function POST(req: NextRequest) {
  try {
    const ip =
      req.headers.get("cf-connecting-ip") ||
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      "unknown";

    let body: { email?: string; password?: string };
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ success: false, error: "Invalid request." }, { status: 400 });
    }

    const { email, password } = body;
    if (!email || !password) {
      return NextResponse.json({ success: false, error: "Email and password required." }, { status: 400 });
    }

    const cleanEmail = email.trim().toLowerCase();

    // Check IP blocklist
    const { data: blocked } = await supabaseServer
      .from("ip_blocklist")
      .select("ip_address")
      .eq("ip_address", ip)
      .maybeSingle();

    if (blocked) {
      return NextResponse.json({ success: false, error: "Access denied from this network." }, { status: 403 });
    }

    // Check lockout
    const lockoutWindow = new Date(Date.now() - LOCKOUT_MINUTES * 60 * 1000).toISOString();
    const { count: recentAttempts } = await supabaseServer
      .from("login_attempts")
      .select("*", { count: "exact", head: true })
      .eq("email", cleanEmail)
      .eq("success", false)
      .gte("created_at", lockoutWindow);

    if ((recentAttempts ?? 0) >= MAX_ATTEMPTS) {
      return NextResponse.json(
        { success: false, locked: true, error: `Account locked. Try again in ${LOCKOUT_MINUTES} minutes.` },
        { status: 429 }
      );
    }

    // Verify credentials
    const { data: result, error: rpcErr } = await supabaseServer.rpc(
      "verify_admin_password",
      { input_email: cleanEmail, input_password: password }
    );

    if (rpcErr || !result?.valid) {
      await supabaseServer.from("login_attempts").insert({
        email: cleanEmail, ip_address: ip, success: false,
        created_at: new Date().toISOString(),
      });
      const remaining = Math.max(0, MAX_ATTEMPTS - ((recentAttempts ?? 0) + 1));
      return NextResponse.json(
        {
          success: false,
          error: remaining > 0
            ? `Invalid credentials. ${remaining} attempt${remaining === 1 ? "" : "s"} remaining.`
            : `Account locked. Try again in ${LOCKOUT_MINUTES} minutes.`,
          locked: remaining === 0,
        },
        { status: 401 }
      );
    }

    const admin = result;

    // Kill all existing sessions
    await supabaseServer.from("admin_sessions").delete().neq("id", "00000000-0000-0000-0000-000000000000");

    // Create new session
    const { data: token, error: sessionErr } = await supabaseServer.rpc("create_admin_session", {
      p_admin_id: admin.id,
      p_admin_email: admin.email,
      p_admin_role: admin.role,
      p_ip_address: ip,
    });

    const sessionToken = token?.token ?? token;
    if (sessionErr || !sessionToken) {
      return NextResponse.json({ success: false, error: "Session creation failed." }, { status: 500 });
    }

    // Log success
    await supabaseServer.from("login_attempts").insert({
      email: cleanEmail, ip_address: ip, success: true,
      created_at: new Date().toISOString(),
    });

    // Set httpOnly cookie
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict" as const,
      path: "/",
      maxAge: 8 * 60 * 60,
    };

    const response = NextResponse.json({
      success: true,
      admin: {
        id: admin.id,
        email: admin.email,
        full_name: admin.full_name,
        role: admin.role,
        permissions: admin.permissions,
      },
    });

    response.cookies.set(COOKIE_NAME, sessionToken, cookieOptions);
    response.cookies.set(COOKIE_EMAIL, admin.email, { ...cookieOptions, httpOnly: false });

    return response;
  } catch (err) {
    console.error("[LOGIN]", err);
    return NextResponse.json({ success: false, error: "Unexpected server error." }, { status: 500 });
  }
}

