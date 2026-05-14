import { NextRequest, NextResponse } from "next/server";
import { getServerClient } from "@/lib/getServerClient()"; // FIXED: was getServerClient()

const COOKIE_NAME  = "iec_admin_token";
const COOKIE_EMAIL = "iec_admin_email";

export async function POST(req: NextRequest) {
  try {
    const token = req.cookies.get(COOKIE_NAME)?.value;
    const email = req.cookies.get(COOKIE_EMAIL)?.value;
    const supabase = getServerClient(); // FIXED: call the function

    if (token) {
      await supabase
        .from("admin_sessions")
        .update({ invalidated: true, invalidated_at: new Date().toISOString() })
        .eq("token", token);
    }

    if (email) {
      const ip =
        req.headers.get("cf-connecting-ip") ||
        req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
        "unknown";

      await supabase.from("audit_logs").insert({
        actor_name:  email,
        actor_email: email,
        actor_role:  "admin",
        action_type: "logout",
        target_type: "admin_session",
        description: `Admin logout from IP ${ip}`,
        ip_address:  ip,
        visible_to:  "secretary_general",
        timestamp:   new Date().toISOString(),
      });
    }

    const res = NextResponse.json({ success: true });
    const clearOptions = {
      maxAge:   0,
      path:     "/",
      httpOnly: true,
      secure:   process.env.NODE_ENV === "production",
      sameSite: "strict" as const,
    };
    res.cookies.set(COOKIE_NAME,  "", clearOptions);
    res.cookies.set(COOKIE_EMAIL, "", { ...clearOptions, httpOnly: false });
    return res;
  } catch (err) {
    console.error("[LOGOUT] Error:", err);
    const res = NextResponse.json({ success: true });
    res.cookies.set(COOKIE_NAME,  "", { maxAge: 0, path: "/" });
    res.cookies.set(COOKIE_EMAIL, "", { maxAge: 0, path: "/" });
    return res;
  }
}

