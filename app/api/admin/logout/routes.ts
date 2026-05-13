/**
 * /app/api/admin/logout/route.ts
 * Invalidates DB session and clears httpOnly cookies.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

const supabaseService = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
);

export async function POST(_req: NextRequest) {
  const cookieStore = await cookies();
  const token = cookieStore.get('iec_admin_token')?.value;
  const email = cookieStore.get('iec_admin_email')?.value;

  // Invalidate the DB session
  if (token && email) {
    await supabaseService
      .from('admin_sessions')
      .update({ invalidated: true })
      .eq('token', token)
      .eq('admin_email', email.toLowerCase());
  }

  const res = NextResponse.json({ success: true });
  res.cookies.set('iec_admin_token', '', { maxAge: 0, path: '/admin' });
  res.cookies.set('iec_admin_email', '', { maxAge: 0, path: '/admin' });
  return res;
}