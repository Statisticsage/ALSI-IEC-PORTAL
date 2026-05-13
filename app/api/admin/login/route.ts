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
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
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
      .rpc('count_failed_attempts', {
        input_email: email,
        input_ip: ip,
      });

    if (attemptError) {
      console.error('[admin/login] count_failed_attempts error:', attemptError);
    }

    const failedCount = typeof attemptData === 'number' ? attemptData : 0;

    if (failedCount >= MAX_ATTEMPTS) {
      await logAttempt(email, ip, false);
      return NextResponse.json(
        { 
          success: false, 
          error: 'Too many failed attempts. Access suspended for 30 minutes.', 
          locked: true 
        },
        { status: 429 }
      );
    }

    // ── Step 2: Verify password (anon-callable RPC) ──────────────────
    const { data: authData, error: authError } = await supabasePublic
      .rpc('verify_admin_password', {
        input_email: email,
        input_password: password,
      });

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
      
      // Try to create session manually if RPC doesn't exist
      try {
        const sessionToken = generateSecureToken();
        const expiresAt = new Date(Date.now() + 8 * 60 * 60 * 1000); // 8 hours
        
        // Insert session manually
        const { error: insertError } = await supabaseService
          .from('admin_sessions')
          .insert({
            admin_id: admin.id,
            admin_email: admin.email,
            admin_role: admin.role,
            session_token: sessionToken,
            ip_address: ip,
            expires_at: expiresAt.toISOString(),
            created_at: new Date().toISOString()
          });

        if (insertError) {
          console.error('[admin/login] manual session insert error:', insertError);
          return NextResponse.json(
            { success: false, error: 'Session creation failed. Please try again.' },
            { status: 500 }
          );
        }

        // Use manually created session
        await setSessionCookies(sessionToken, admin.email);
        await logAttempt(email, ip, true);

        return NextResponse.json({
          success: true,
          admin: {
            id:          admin.id,
            email:       admin.email,
            full_name:   admin.full_name,
            role:        admin.role,
            permissions: admin.permissions || {},
          },
        });

      } catch (manualError) {
        console.error('[admin/login] Manual session creation failed:', manualError);
        return NextResponse.json(
          { success: false, error: 'Session creation failed. Please try again.' },
          { status: 500 }
        );
      }
    }

    await logAttempt(email, ip, true);

    // ── Step 4: Set httpOnly cookie ──────────────────────────────
    await setSessionCookies(sessionData.token, admin.email);

    // Return admin profile (no token — it's in httpOnly cookie)
    return NextResponse.json({
      success: true,
      admin: {
        id:          admin.id,
        email:       admin.email,
        full_name:   admin.full_name,
        role:        admin.role,
        permissions: admin.permissions || {},
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

async function setSessionCookies(token: string, email: string) {
  const cookieStore = await cookies();
  
  cookieStore.set('iec_admin_token', token, {
    httpOnly: true,          // JS cannot read this — blocks console injection
    secure: process.env.NODE_ENV === 'production', // HTTPS only in prod
    sameSite: 'strict',      // CSRF protection
    path: '/admin',          // Only sent on /admin routes
    maxAge: 60 * 60 * 8,    // 8 hours
  });

  cookieStore.set('iec_admin_email', email, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/admin',
    maxAge: 60 * 60 * 8,
  });
}

async function logAttempt(email: string, ip: string, success: boolean) {
  try {
    await supabaseService
      .from('login_attempts')
      .insert({ 
        email, 
        ip_address: ip, 
        success,
        created_at: new Date().toISOString()
      });
  } catch (err) {
    console.error('[admin/login] Failed to log attempt:', err);
  }
}

function generateSecureToken(): string {
  const chars = '0123456789abcdef';
  let token = '';
  for (let i = 0; i < 64; i++) {
    token += chars[Math.floor(Math.random() * chars.length)];
  }
  return token;
}
