/**
 * /app/api/admin/session/route.ts
 * 
 * Verifies the admin session from the httpOnly cookie.
 * Called on every admin page load via middleware or layout.
 * Token never touches client-side JavaScript.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

const supabaseService = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
);

export async function GET(_req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('iec_admin_token')?.value;
    const email = cookieStore.get('iec_admin_email')?.value;

    if (!token || !email) {
      return NextResponse.json({ valid: false, error: 'No session found.' }, { status: 401 });
    }

    const { data, error } = await supabaseService
      .rpc('verify_admin_session', { p_token: token, p_email: email });

    if (error || !data?.valid) {
      // Clear stale cookies
      const res = NextResponse.json(
        { valid: false, error: data?.reason || 'Session invalid.' },
        { status: 401 }
      );
      res.cookies.delete('iec_admin_token');
      res.cookies.delete('iec_admin_email');
      return res;
    }

    return NextResponse.json({ valid: true, admin: data });

  } catch (err) {
    console.error('[admin/session] Error:', err);
    return NextResponse.json({ valid: false, error: 'Session check failed.' }, { status: 500 });
  }
}