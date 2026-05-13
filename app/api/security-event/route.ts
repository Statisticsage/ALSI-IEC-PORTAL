import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Service role client for security event logging
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
);

export async function POST(req: NextRequest) {
  try {
    const event = await req.json();
    
    // Validate required fields
    if (!event.type || !event.severity || !event.timestamp) {
      return NextResponse.json(
        { error: 'Invalid security event format' },
        { status: 400 }
      );
    }

    // Get client IP for additional context
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
              req.headers.get('x-real-ip') ||
              'unknown';

    // Log to security_events table
    const { error } = await supabaseAdmin
      .from('security_events')
      .insert({
        event_type: event.type,
        severity: event.severity,
        details: event.details || {},
        ip_address: ip,
        user_agent: req.headers.get('user-agent') || 'unknown',
        timestamp: event.timestamp,
        created_at: new Date().toISOString()
      });

    if (error) {
      console.error('[security-event] Failed to log:', error);
      return NextResponse.json(
        { error: 'Failed to log security event' },
        { status: 500 }
      );
    }

    // For critical events, trigger immediate alert
    if (event.severity === 'critical') {
      await triggerSecurityAlert(event, ip);
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

async function triggerSecurityAlert(event: any, ip: string) {
  try {
    // Log to audit_logs for immediate visibility
    await supabaseAdmin
      .from('audit_logs')
      .insert({
        actor_name: 'Security System',
        actor_role: 'system',
        action_type: 'security_alert',
        target_type: 'system',
        target_id: 'security_monitor',
        description: `CRITICAL: ${event.type} detected from IP ${ip}`,
        ip_address: ip,
        timestamp: new Date().toISOString()
      });

    // Send email alert if configured
    if (process.env.RESEND_API_KEY) {
      await fetch('/api/security-alert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          security_event: event,
          ip,
          timestamp: new Date().toISOString(),
        }),
      });
    }

  } catch (err) {
    console.error('[security-event] Failed to trigger alert:', err);
  }
}
