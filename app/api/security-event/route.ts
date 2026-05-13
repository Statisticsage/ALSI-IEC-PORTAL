import { NextRequest, NextResponse } from 'next/server';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

// ---------------------------------------------------------------------------
// Admin client factory — instantiated per-request, never at module load time
// ---------------------------------------------------------------------------
function getAdminClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error(
      '[security-event] Missing Supabase env vars. ' +
      'Ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set ' +
      'in Cloudflare Pages → Settings → Environment Variables → Production.'
    );
  }

  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface SecurityEvent {
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  timestamp: string;
  details?: Record<string, unknown>;
}

// ---------------------------------------------------------------------------
// POST /api/security-event
// ---------------------------------------------------------------------------
export async function POST(req: NextRequest) {
  let adminClient: SupabaseClient;

  try {
    adminClient = getAdminClient();
  } catch (err) {
    console.error('[security-event] Client init failed:', err);
    return NextResponse.json(
      { error: 'Server configuration error' },
      { status: 500 }
    );
  }

  try {
    const event: SecurityEvent = await req.json();

    // Validate required fields
    if (!event.type || !event.severity || !event.timestamp) {
      return NextResponse.json(
        { error: 'Invalid security event format' },
        { status: 400 }
      );
    }

    // Extract client IP
    const ip =
      req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      req.headers.get('x-real-ip') ||
      'unknown';

    // Log to security_events table
    const { error } = await adminClient
      .from('security_events')
      .insert({
        event_type:  event.type,
        severity:    event.severity,
        details:     event.details ?? {},
        ip_address:  ip,
        user_agent:  req.headers.get('user-agent') ?? 'unknown',
        timestamp:   event.timestamp,
        created_at:  new Date().toISOString(),
      });

    if (error) {
      console.error('[security-event] Failed to log:', error);
      return NextResponse.json(
        { error: 'Failed to log security event' },
        { status: 500 }
      );
    }

    // Trigger immediate alert for critical events
    if (event.severity === 'critical') {
      await triggerSecurityAlert(adminClient, event, ip, req);
    }

    return NextResponse.json({ success: true });

  } catch (err) {
    console.error('[security-event] Unexpected error:', err);
    return NextResponse.json(
      { error: 'Security event logging failed' },
      { status: 500 }
    );
  }
}

// ---------------------------------------------------------------------------
// Critical event handler
// ---------------------------------------------------------------------------
async function triggerSecurityAlert(
  adminClient: SupabaseClient,
  event: SecurityEvent,
  ip: string,
  req: NextRequest
): Promise<void> {
  try {
    // Write to audit_logs for immediate dashboard visibility
    await adminClient.from('audit_logs').insert({
      actor_name:  'Security System',
      actor_role:  'system',
      action_type: 'security_alert',
      target_type: 'system',
      target_id:   'security_monitor',
      description: `CRITICAL: ${event.type} detected from IP ${ip}`,
      ip_address:  ip,
      timestamp:   new Date().toISOString(),
    });

    // Send email alert via internal route — use absolute URL (required server-side)
    if (process.env.RESEND_API_KEY) {
      const host   = req.headers.get('host') ?? 'localhost:3000';
      const proto  = host.startsWith('localhost') ? 'http' : 'https';
      const origin = `${proto}://${host}`;

      await fetch(`${origin}/api/security-alert`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          security_event: event,
          ip,
          timestamp: new Date().toISOString(),
        }),
      });
    }
  } catch (err) {
    // Non-fatal — event is already logged; alert failure must not break the response
    console.error('[security-event] Failed to trigger alert:', err);
  }
}