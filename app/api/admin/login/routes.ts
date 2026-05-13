/**
 * /app/api/admin/login/route.ts
 * 
 * SERVER-SIDE ONLY. The SERVICE_ROLE key lives here, never in client code.
 * Flow:
 *   1. Rate-check via count_failed_attempts (anon key, public function)
 *   2. Verify password via verify_admin_password (anon key, public function)
 *   3. Create session via create_admin_session (SERVICE_ROLE key, restricted function)
 *   4. Set httpOnly + Secure + SameSite=Strict cookie
 *   5. Log attempt to login_attempts
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

// Public client — for rate checking and password verify (these are anon-callable)
const supabasePublic = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Service role client — for session creation ONLY, never exposed to browser
const supabaseService = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!, // Server-only env var (no NEXT_PUBLIC_ prefix)
  { auth: { persistSession: false } }
);

const MAX_ATTEMPTS = 5;
const LOCKOUT_MINUTES = 30;

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
           || req.headers.get('x-real-ip')
           || 'unknown';

  let email = '';

  try {
    const body = await req.json();
    email = (body.email || '').toLowerCase().trim();
    const password: string = body.password || '';

    if (!email || !password) {
      return NextResponse.json({ success: false, error: 'Email and password are required.' }, { status: 400 });
    }

    // ── Step 1: Rate limit check ─────────────────────────────────
    const { data: attemptData, error: attemptError } = await supabasePublic
      .rpc('count_failed_attempts', { input_email: email, input_ip: ip });

    if (attemptError) {
      console.error('[admin/login] count_failed_attempts error:', attemptError);
    }

    const failedCount = typeof attemptData === 'number' ? attemptData : 0;

    if (failedCount >= MAX_ATTEMPTS) {
      await logAttempt(email, ip, false);
      return NextResponse.json(
        {
          success: false,
          error: `Too many failed attempts. Access suspended for ${LOCKOUT_MINUTES} minutes.`,
          locked: true,
        },
        { status: 429 }
      );
    }

    // ── Step 2: Verify password ──────────────────────────────────
    const { data: authData, error: authError } = await supabasePublic
      .rpc('verify_admin_password', { input_email: email, input_password: password });

    if (authError || !authData?.valid) {
      await logAttempt(email, ip, false);
      return NextResponse.json(
        { success: false, error: 'Invalid email or password.' },
        { status: 401 }
      );
    }

    const admin = authData;

    // ── Step 3: Create session (service_role only) ───────────────
    const { data: sessionData, error: sessionError } = await supabaseService
      .rpc('create_admin_session', {
        p_admin_id:    admin.id,
        p_admin_email: admin.email,
        p_admin_role:  admin.role,
        p_ip_address:  ip,
      });

    if (sessionError || !sessionData?.success) {
      console.error('[admin/login] create_admin_session error:', sessionError, sessionData);
      return NextResponse.json(
        { success: false, error: 'Session creation failed. Please try again.' },
        { status: 500 }
      );
    }

    await logAttempt(email, ip, true);

    // ── Step 4: Set httpOnly cookie ──────────────────────────────
    const cookieStore = await cookies();
    cookieStore.set('iec_admin_token', sessionData.token, {
      httpOnly: true,          // JS cannot read this — blocks console injection
      secure: process.env.NODE_ENV === 'production', // HTTPS only in prod
      sameSite: 'strict',      // CSRF protection
      path: '/admin',          // Only sent on /admin routes
      maxAge: 60 * 60 * 8,    // 8 hours
    });

    cookieStore.set('iec_admin_email', admin.email, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/admin',
      maxAge: 60 * 60 * 8,
    });

    // Return admin profile (no token — it's in httpOnly cookie)
    return NextResponse.json({
      success: true,
      admin: {
        id:          admin.id,
        email:       admin.email,
        full_name:   admin.full_name,
        role:        admin.role,
        permissions: admin.permissions,
      },
    });

  } catch (err) {
    console.error('[admin/login] Unexpected error:', err);
    if (email) await logAttempt(email, ip, false);
    return NextResponse.json(
      { success: false, error: 'An unexpected error occurred.' },
      { status: 500 }
    );
  }
}

async function logAttempt(email: string, ip: string, success: boolean) {
  try {
    await supabaseService
      .from('login_attempts')
      .insert({ email, ip_address: ip, success });
  } catch (err) {
    console.error('[admin/login] Failed to log attempt:', err);
  }
}