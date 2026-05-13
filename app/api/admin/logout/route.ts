import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

// Service role client - for invalidate_admin_session only (server-side)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
);

export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('iec_admin_token')?.value;

    // Invalidate session in database if token exists
    if (token) {
      await supabaseAdmin.rpc('invalidate_admin_session', { p_token: token });
    }

    // Clear all admin cookies
    const res = NextResponse.json({ success: true });
    cookieStore.set('iec_admin_token', '', { maxAge: 0, path: '/admin' });
    cookieStore.set('iec_admin_email', '', { maxAge: 0, path: '/admin' });

    return res;

  } catch (err) {
    console.error('[logout] Error:', err);
    // Still clear cookies even if DB call fails
    const cookieStore = await cookies();
    const res = NextResponse.json({ success: true });
    cookieStore.set('iec_admin_token', '', { maxAge: 0, path: '/admin' });
    cookieStore.set('iec_admin_email', '', { maxAge: 0, path: '/admin' });
    return res;
  }
}
