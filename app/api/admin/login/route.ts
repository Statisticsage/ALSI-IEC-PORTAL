/**
 * app/api/admin/login/route.ts
 * IEC Admin Portal — Authentication endpoint
 *
 * POST /api/admin/login
 * Verifies admin credentials, enforces rate limiting, and issues an
 * httpOnly session cookie valid for 8 hours.
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

// ---------------------------------------------------------------------------
// Client factories — instantiated per request, never at module load time.
// Cloudflare Pages injects env vars at runtime, not during Next.js build.
// ---------------------------------------------------------------------------
function getAnonClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    throw new Error("[IEC Login] Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY.");
  }
  return createClient(url, key);
}

function getAdminClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error("[IEC Login] Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.");
  }
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

// ---------------------------------------------------------------------------
// IP extraction — validated format, safe for DB insertion
// ---------------------------------------------------------------------------
function getClientIp(req: NextRequest): string | null {
  const cf  = req.headers.get("cf-connecting-ip");
  if (cf  && /^[0-9a-fA-F.:]{1,45}$/.test(cf.trim()))  return cf.trim();

  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) {
    const ip = fwd.split(",")[0].trim();
    if (/^[0-9a-fA-F.:]{1,45}$/.test(ip)) return ip;
  }

  const real = req.headers.get("x-real-ip");
  if (real && /^[0-9a-fA-F.:]{1,45}$/.test(real.trim())) return real.trim();

  return null; // DB function handles NULL gracefully
}

// ---------------------------------------------------------------------------
// POST /api/admin/login
// ---------------------------------------------------------------------------
export async function POST(req: NextRequest) {
  let anonClient:  SupabaseClient;
  let adminClient: SupabaseClient;

  try {
    anonClient  = getAnonClient();
    adminClient = getAdminClient();
  } catch (err) {
    console.error("[IEC Login] Client init failed:", err);
    return NextResponse.json(
      { success: false, error: "Server configuration error." },
      { status: 500 }
    );
  }

  const ip = getClientIp(req);
  let email = "";

  try {
    const body     = await req.json();
    email          = (body.email    ?? "").toLowerCase().trim();
    const password = (body.password ?? "") as string;

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: "Email and password are required." },
        { status: 400 }
      );
    }

    // ------------------------------------------------------------------
    // Rate limit — check failed attempts before touching auth
    // ------------------------------------------------------------------
    const { data: failCount } = await anonClient.rpc("count_failed_attempts", {
      input_email: email,
      input_ip:    ip ?? "0.0.0.0",
    });

    if (typeof failCount === "number" && failCount >= 5) {
      return NextResponse.json(
        {
          success: false,
          error:   "Too many failed attempts. Access suspended for 30 minutes.",
          locked:  true,
        },
        { status: 429 }
      );
    }

    // ------------------------------------------------------------------
    // Password verification
    // ------------------------------------------------------------------
    const { data: authResult, error: authError } = await anonClient.rpc(
      "verify_admin_password",
      {
        input_email:    email,
        input_password: password,
        input_ip:       ip ?? null,
      }
    );

    if (authError || !authResult?.valid) {
      return NextResponse.json(
        { success: false, error: "Invalid email or password." },
        { status: 401 }
      );
    }

    // ------------------------------------------------------------------
    // Session creation — service role only
    // ------------------------------------------------------------------
    const { data: sessionResult, error: sessionError } = await adminClient.rpc(
      "create_admin_session",
      {
        p_admin_id:    authResult.id,
        p_admin_email: authResult.email,
        p_admin_role:  authResult.role,
        p_ip_address:  ip ?? null,
      }
    );

    if (sessionError || !sessionResult?.success) {
      console.error("[IEC Login] create_admin_session failed:", sessionError, sessionResult);
      return NextResponse.json(
        { success: false, error: "Session creation failed. Please try again." },
        { status: 500 }
      );
    }

    // ------------------------------------------------------------------
    // Issue httpOnly cookies — 8-hour session
    // ------------------------------------------------------------------
    const isProd      = process.env.NODE_ENV === "production";
    const cookieOpts  = {
      httpOnly: true,
      secure:   isProd,
      sameSite: "strict" as const,
      path:     "/",
      maxAge:   60 * 60 * 8, // 8 hours
    };

    const res = NextResponse.json({
      success: true,
      admin: {
        id:          authResult.id,
        email:       authResult.email,
        full_name:   authResult.full_name,
        role:        authResult.role,
        permissions: authResult.permissions,
      },
    });

    res.cookies.set("iec_admin_token", sessionResult.token, cookieOpts);
    res.cookies.set("iec_admin_email", authResult.email,    cookieOpts);

    return res;

  } catch (err) {
    console.error("[IEC Login] Unexpected error:", err);
    return NextResponse.json(
      { success: false, error: "An unexpected error occurred." },
      { status: 500 }
    );
  }
}