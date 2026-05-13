/**
 * app/api/admin/session/route.ts
 * FIXED: verify_admin_session(p_token, p_email, p_ip) returns jsonb
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerClient } from "@/lib/supabaseServer";

const COOKIE_TOKEN = "iec_admin_token";
const COOKIE_EMAIL = "iec_admin_email";

export async function GET(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";

  try {
    const token = req.cookies.get(COOKIE_TOKEN)?.value;
    const email = req.cookies.get(COOKIE_EMAIL)?.value;

    if (!token || !email)
      return NextResponse.json({ valid: false, error: "No session." }, { status: 401 });

    if (!/^[a-f0-9]{64}$/.test(token))
      return _clearAndReject("Malformed session token.");

    if (!/^[^@]+@[^@]+\.[^@]+$/.test(email))
      return _clearAndReject("Invalid session identity.");

    const supabase = getServerClient();

    // verify_admin_session(p_token, p_email, p_ip) -> jsonb
    const { data, error } = await supabase.rpc("verify_admin_session", {
      p_token: token,
      p_email: email,
      p_ip:    ip,
    });

    if (error) {
      console.error("[SESSION] RPC error:", error.message);
      return NextResponse.json({ valid: false, error: "Session service unavailable." }, { status: 503 });
    }

    if (!data?.valid)
      return _clearAndReject(data?.reason ?? "Session invalid.");

    return NextResponse.json({
      valid: true,
      admin: {
        id:          data.id,
        email:       data.email,
        full_name:   data.full_name,
        role:        data.role,
        permissions: data.permissions,
      },
    }, { status: 200 });

  } catch (err) {
    console.error("[SESSION] Unhandled:", err);
    return NextResponse.json({ valid: false, error: "Internal error." }, { status: 500 });
  }
}

function _clearAndReject(reason: string): NextResponse {
  const isProd = process.env.NODE_ENV === "production";
  const res = NextResponse.json({ valid: false, error: reason }, { status: 401 });
  res.cookies.set(COOKIE_TOKEN, "", { httpOnly: true,  secure: isProd, sameSite: "strict", maxAge: 0, path: "/" });
  res.cookies.set(COOKIE_EMAIL, "", { httpOnly: false, secure: isProd, sameSite: "strict", maxAge: 0, path: "/" });
  return res;
}

export async function POST() {
  return NextResponse.json({ error: "Method not allowed." }, { status: 405 });
}