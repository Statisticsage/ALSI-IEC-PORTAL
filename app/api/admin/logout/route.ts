import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";

const COOKIE_NAME = "iec_admin_token";
const COOKIE_EMAIL = "iec_admin_email";

export async function POST(req: NextRequest) {
  try {
    const token = req.cookies.get(COOKIE_NAME)?.value;
    const email = req.cookies.get(COOKIE_EMAIL)?.value;

    // Invalidate the session in the DB
    if (token) {
      await supabaseServer.rpc("invalidate_admin_session", { p_token: token });
    }

    // Log the logout
    if (email) {
      const ip =
        req.headers.get("cf-connecting-ip") ||
        req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
        "unknown";

      await supabaseServer.from("audit_logs").insert({
        actor_name: email,
        actor_email: email,
        actor_role: "admin",
        action_type: "LOGOUT",
        target_type: "system",
        target_id: null,
        description: `Admin logout from IP ${ip}`,
        ip_address: ip,
        visible_to: "secretary_general",
      });
    }

    const res = NextResponse.json({ success: true });

    // Clear both cookies
    const clearOptions = {
      maxAge: 0,
      path: "/",
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict" as const,
    };

    res.cookies.set(COOKIE_NAME, "", clearOptions);
    res.cookies.set(COOKIE_EMAIL, "", { ...clearOptions, httpOnly: false });

    return res;
  } catch (err) {
    console.error("[LOGOUT] Error:", err);
    // Still clear cookies even on error
    const res = NextResponse.json({ success: true });
    res.cookies.set(COOKIE_NAME, "", { maxAge: 0, path: "/" });
    res.cookies.set(COOKIE_EMAIL, "", { maxAge: 0, path: "/" });
    return res;
  }
}

