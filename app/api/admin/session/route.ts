import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

// Service role client - for verify_admin_session only (server-side)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
);

export async function GET(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('iec_admin_token')?.value;
    const email = cookieStore.get('iec_admin_email')?.value;

    // No session cookie
    if (!token || !email) {
      return NextResponse.json(
        { valid: false, error: 'No session found.' },
        { status: 401 }
      );
    }

    // Validate token format
    if (!/^[a-f0-9]{64}$/.test(token)) {
      // Clear invalid cookies
      const res = NextResponse.json(
        { valid: false, error: 'Invalid session format.' },
        { status: 401 }
      );
      cookieStore.set('iec_admin_token', '', { maxAge: 0, path: '/admin' });
      cookieStore.set('iec_admin_email', '', { maxAge: 0, path: '/admin' });
      return res;
    }

    // Verify session in database
    const { data: result, error } = await supabaseAdmin.rpc(
      'verify_admin_session',
      { p_token: token, p_email: email }
    );

    if (error || !result?.valid) {
      // Clear invalid session cookies
      const res = NextResponse.json(
        { valid: false, error: 'Session expired or invalid.' },
        { status: 401 }
      );
      cookieStore.set('iec_admin_token', '', { maxAge: 0, path: '/admin' });
      cookieStore.set('iec_admin_email', '', { maxAge: 0, path: '/admin' });
      return res;
    }

    // Valid session - return admin data
    return NextResponse.json({
      valid: true,
      admin: {
        id: result.id,
        email: result.email,
        full_name: result.full_name,
        role: result.role,
        permissions: result.permissions || {},
      },
    });

  } catch (err) {
    console.error('[session] Unexpected error:', err);
    return NextResponse.json(
      { valid: false, error: 'Session verification failed.' },
      { status: 500 }
    );
  }
}
