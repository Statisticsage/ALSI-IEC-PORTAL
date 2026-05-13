/**
 * app/api/security-alert/route.ts
 * IEC Election Portal — Security alert email dispatch
 *
 * POST /api/security-alert
 * Called internally by /api/security-event when a critical event is detected.
 * Sends email alerts to configured IEC recipients via Resend.
 *
 * NOTE: File must be named route.ts (singular).
 * Next.js App Router ignores routes.ts (plural) entirely.
 */

import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// ---------------------------------------------------------------------------
// POST /api/security-alert
// ---------------------------------------------------------------------------
export async function POST(req: NextRequest) {
  try {
    const { attempted_email, ip, timestamp, alert_recipients } =
      (await req.json()) as {
        attempted_email:   string;
        ip:                string;
        timestamp:         string;
        alert_recipients:  string[];
      };

    if (!alert_recipients?.length) {
      return NextResponse.json(
        { ok: false, error: "No alert recipients specified." },
        { status: 400 }
      );
    }

    const RESEND_API_KEY = process.env.RESEND_API_KEY;
    if (!RESEND_API_KEY) {
      // Non-fatal — event is already in audit_logs
      console.warn("[security-alert] RESEND_API_KEY not set — alert logged to audit_logs only.");
      return NextResponse.json({ ok: true, method: "audit_log_only" });
    }

    const divider = "─".repeat(38);
    const eventTime = new Date(timestamp).toLocaleString("en-IN", {
      timeZone: "Asia/Kolkata",
    });

    const subject = "IEC SECURITY ALERT — Unauthorised Access Attempt";

    const text = [
      "INDEPENDENT ELECTIONS COMMISSION (IEC)",
      "ALSI General Election 2026/2027",
      "",
      divider,
      "SECURITY ALERT — ADMIN PORTAL ACCESS BLOCKED",
      divider,
      "",
      "Multiple failed login attempts have been detected on the IEC Admin Portal.",
      "The account has been automatically suspended for 30 minutes.",
      "",
      "INCIDENT DETAILS:",
      `Attempted Email : ${attempted_email}`,
      `IP Address      : ${ip}`,
      `Date & Time     : ${eventTime} IST`,
      `Attempts Made   : 5 (Maximum reached)`,
      `Portal URL      : /iec-portal-2026`,
      `Action Taken    : Account locked for 30 minutes`,
      "",
      "WHAT THIS MEANS:",
      "Someone attempted to access the IEC Admin Portal with incorrect credentials.",
      "This may indicate:",
      "  • A forgotten password by an IEC member",
      "  • An unauthorised third party attempting to gain access",
      "",
      "RECOMMENDED ACTION:",
      "1. Verify with your IEC team if any member was attempting to log in",
      "2. If this was NOT an IEC member, treat this as a security incident",
      "3. Consider changing admin passwords if suspicious",
      "4. Review the audit logs in the admin portal",
      "",
      divider,
      "This is an automated security notification from the IEC Digital Portal.",
      "Do not reply to this message.",
      divider,
    ].join("\n");

    // Send to all recipients in parallel
    const results = await Promise.allSettled(
      alert_recipients.map((to: string) =>
        fetch("https://api.resend.com/emails", {
          method:  "POST",
          headers: {
            Authorization:  `Bearer ${RESEND_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from:    "IEC Security System <onboarding@resend.dev>",
            to,
            subject,
            text,
          }),
        })
      )
    );

    const failed = results.filter((r) => r.status === "rejected").length;
    if (failed > 0) {
      console.error(`[security-alert] ${failed}/${results.length} emails failed.`);
    }

    return NextResponse.json({
      ok:     true,
      sent:   results.length - failed,
      failed,
    });
  } catch (err) {
    console.error("[security-alert] Unexpected error:", err);
    return NextResponse.json({ ok: false, error: "Alert dispatch failed." }, { status: 500 });
  }
}