import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
);

async function verifySession(): Promise<boolean> {
  const cookieStore = await cookies();
  const token = cookieStore.get('iec_admin_token')?.value;
  const email = cookieStore.get('iec_admin_email')?.value;
  if (!token || !email) return false;
  const { data } = await supabaseAdmin.rpc('verify_admin_session', {
    p_token: token, p_email: email,
  });
  return data?.valid === true;
}

export async function GET(_req: NextRequest) {
  if (!(await verifySession())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const [votersRes, candidatesRes, partiesRes] = await Promise.all([
    supabaseAdmin.from('voters').select('verification_status, voter_approved'),
    supabaseAdmin.from('candidates').select('status'),
    supabaseAdmin.from('political_parties').select('status'),
  ]);

  const voters     = votersRes.data     || [];
  const candidates = candidatesRes.data || [];
  const parties    = partiesRes.data    || [];

  return NextResponse.json({
    voters: {
      total:            voters.length,
      pending:          voters.filter(v => v.verification_status === 'pending').length,
      approved:         voters.filter(v => v.verification_status === 'approved').length,
      rejected:         voters.filter(v => v.verification_status === 'rejected').length,
      needs_correction: voters.filter(v => v.verification_status === 'needs_correction').length,
    },
    candidates: {
      total:    candidates.length,
      pending:  candidates.filter(c => c.status === 'pending').length,
      approved: candidates.filter(c => c.status === 'approved').length,
      rejected: candidates.filter(c => c.status === 'rejected').length,
    },
    parties: {
      total:    parties.length,
      pending:  parties.filter(p => p.status === 'pending').length,
      approved: parties.filter(p => p.status === 'approved').length,
      rejected: parties.filter(p => p.status === 'rejected').length,
    },
  });
}
