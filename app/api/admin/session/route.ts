import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer"; // FIXED: was supabaseServer

const COOKIE_NAME  = "iec_admin_token";
const COOKIE_EMAIL = "iec_admin_email";

export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get(COOKIE_NAME)?.value;
    const email = req.cookies.get(COOKIE_EMAIL)?.value;

    if (!token || !email) {
      return NextResponse.json(
        { valid: false, error: "No session found." },
        { status: 401 }
      );
    }

    // Validate token format â€” 64 hex chars
    if (!/^[a-f0-9]{64}$/.test(token)) {
      const res = NextResponse.json(
        { valid: false, error: "Invalid session format." },
        { status: 401 }
      );
      res.cookies.set(COOKIE_NAME,  "", { maxAge: 0, path: "/" });
      res.cookies.set(COOKIE_EMAIL, "", { maxAge: 0, path: "/" });
      return res;
    }

    const ip =
      req.headers.get("cf-connecting-ip") ||
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      "unknown";

    const supabase = supabaseServer; // FIXED: call the function

    // FIXED: correct 3-argument signature matching the DB function
    const { data: result, error } = await supabase.rpc(
      "verify_admin_session",
      { p_token: token, p_email: email, p_ip: ip }
    );

    if (error || !result?.valid) {
      const res = NextResponse.json(
        { valid: false, error: result?.reason || "Session expired." },
        { status: 401 }
      );
      res.cookies.set(COOKIE_NAME,  "", { maxAge: 0, path: "/" });
      res.cookies.set(COOKIE_EMAIL, "", { maxAge: 0, path: "/" });
      return res;
    }

    return NextResponse.json({
      valid: true,
      admin: {
        id:          result.id,
        email:       result.email,
        full_name:   result.full_name,
        role:        result.role,
        permissions: result.permissions,
      },
    });
  } catch (err) {
    console.error("[SESSION] Error:", err);
    return NextResponse.json(
      { valid: false, error: "Session verification failed." },
      { status: 500 }
    );
  }
}
