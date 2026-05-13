import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

const supabaseAnon = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
);

function getClientIp(req: NextRequest): string | null {
  const fwd = req.headers.get('x-forwarded-for');
  if (fwd) {
    const ip = fwd.split(',')[0].trim();
    if (/^[0-9a-fA-F.:]{1,45}$/.test(ip)) return ip;
  }
  const real = req.headers.get('x-real-ip');
  if (real && /^[0-9a-fA-F.:]{1,45}$/.test(real)) return real;
  return null; // null is safe â€” DB function handles NULL gracefully
}

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  let email = '';

  try {
    const body     = await req.json();
    email          = (body.email    || '').toLowerCase().trim();
    const password = (body.password || '') as string;

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: 'Email and password are required.' },
        { status: 400 }
      );
    }

    // Rate limit check
    const { data: failCount } = await supabaseAnon.rpc('count_failed_attempts', {
      input_email: email,
      input_ip:    ip ?? '0.0.0.0',
    });
    if (typeof failCount === 'number' && failCount >= 5) {
      return NextResponse.json(
        { success: false, error: 'Too many failed attempts. Access suspended for 30 minutes.', locked: true },
        { status: 429 }
      );
    }

    // Verify password â€” pass IP so DB can log it correctly
    const { data: authResult, error: authError } = await supabaseAnon.rpc(
      'verify_admin_password',
      {
        input_email:    email,
        input_password: password,
        input_ip:       ip ?? null,
      }
    );

    if (authError || !authResult?.valid) {
      return NextResponse.json(
        { success: false, error: 'Invalid email or password.' },
        { status: 401 }
      );
    }

    // Create session via SERVICE ROLE only
    const { data: sessionResult, error: sessionError } = await supabaseAdmin.rpc(
      'create_admin_session',
      {
        p_admin_id:    authResult.id,
        p_admin_email: authResult.email,
        p_admin_role:  authResult.role,
        p_ip_address:  ip ?? null,
      }
    );

    if (sessionError || !sessionResult?.success) {
      console.error('[login] create_admin_session failed:', sessionError, sessionResult);
      return NextResponse.json(
        { success: false, error: 'Session creation failed. Please try again.' },
        { status: 500 }
      );
    }

    // httpOnly cookie â€” cannot be read or injected via browser console
    const cookieStore = await cookies();
    cookieStore.set('iec_admin_token', sessionResult.token, {
      httpOnly: true,
      secure:   process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
      maxAge:   60 * 60 * 8,
    });
    cookieStore.set('iec_admin_email', authResult.email, {
      httpOnly: true,
      secure:   process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
      maxAge:   60 * 60 * 8,
    });

    return NextResponse.json({
      success: true,
      admin: {
        id:          authResult.id,
        email:       authResult.email,
        full_name:   authResult.full_name,
        role:        authResult.role,
        permissions: authResult.permissions,
      },
    });

  } catch (err) {
    console.error('[login] Unexpected error:', err);
    return NextResponse.json(
      { success: false, error: 'An unexpected error occurred.' },
      { status: 500 }
    );
  }
}

