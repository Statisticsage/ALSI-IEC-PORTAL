/**
 * app/api/admin/verify-session/route.ts
 */
import { NextRequest, NextResponse } from "next/server";
import { getServerClient } from "@/lib/supabaseServer";

const COOKIE_TOKEN = "iec_admin_token";

export async function POST(req: NextRequest) {
  try {
    let body: { token?: string } = {};
    try { body = await req.json(); } catch { /* no body */ }

    const token =
      req.cookies.get(COOKIE_TOKEN)?.value ??
      body?.token;

    if (!token || typeof token !== "string" || token.length !== 64) {
      return NextResponse.json({ valid: false, reason: "no_token" }, { status: 401 });
    }

    const db = getServerClient();
    const { data, error } = await db.rpc("verify_admin_session", { p_token: token });

    if (error) {
      console.error("[VERIFY-SESSION]", error.message);
      return NextResponse.json({ valid: false, reason: "service_error" }, { status: 503 });
    }

    if (!data?.valid) {
      return NextResponse.json({ valid: false, reason: data?.reason ?? "invalid" }, { status: 401 });
    }

    return NextResponse.json({
      valid: true,
      admin: { id: data.id, email: data.email, role: data.role, name: data.full_name },
    });
  } catch (err) {
    console.error("[VERIFY-SESSION] Unhandled:", err);
    return NextResponse.json({ valid: false, reason: "internal_error" }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ error: "Method not allowed." }, { status: 405 });
}