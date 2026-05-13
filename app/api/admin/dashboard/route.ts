import { NextRequest, NextResponse } from 'next/server';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

// Force dynamic — this route must never be statically evaluated at build time
export const dynamic = 'force-dynamic';

// ---------------------------------------------------------------------------
// Admin client factory — called at request time, NOT module load time.
// Env vars are available at runtime but NOT during Next.js static build phase.
// ---------------------------------------------------------------------------
function getAdminClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error(
      '[Dashboard] Missing Supabase env vars. ' +
      'Ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set ' +
      'in Cloudflare Pages → Settings → Environment Variables → Production.'
    );
  }

  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

// ---------------------------------------------------------------------------
// Session verification
// ---------------------------------------------------------------------------
async function verifySession(client: SupabaseClient): Promise<boolean> {
  const cookieStore = await cookies();
  const token = cookieStore.get('iec_admin_token')?.value;
  const email = cookieStore.get('iec_admin_email')?.value;

  if (!token || !email) return false;

  const { data } = await client.rpc('verify_admin_session', {
    p_token: token,
    p_email: email,
  });

  return data?.valid === true;
}

// ---------------------------------------------------------------------------
// GET /api/admin/dashboard
// ---------------------------------------------------------------------------
export async function GET(_req: NextRequest) {
  let adminClient: SupabaseClient;

  try {
    adminClient = getAdminClient();
  } catch (err) {
    console.error('[Dashboard] Client init failed:', err);
    return NextResponse.json(
      { error: 'Server configuration error' },
      { status: 500 }
    );
  }

  if (!(await verifySession(adminClient))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const [votersRes, candidatesRes, partiesRes] = await Promise.all([
    adminClient.from('voters').select('verification_status, voter_approved'),
    adminClient.from('candidates').select('status'),
    adminClient.from('political_parties').select('status'),
  ]);

  const voters     = votersRes.data     ?? [];
  const candidates = candidatesRes.data ?? [];
  const parties    = partiesRes.data    ?? [];

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