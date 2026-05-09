import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { attempted_email, ip, timestamp, alert_recipients } = await req.json();

    const subject = `🚨 IEC SECURITY ALERT — Unauthorised Access Attempt`;

    const body = `
INDEPENDENT ELECTIONS COMMISSION (IEC)
ALSI General Election 2026/2027

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SECURITY ALERT — ADMIN PORTAL ACCESS BLOCKED
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Multiple failed login attempts have been detected on the IEC Admin Portal.
The account has been automatically suspended for 30 minutes.

INCIDENT DETAILS:
─────────────────
Attempted Email : ${attempted_email}
IP Address      : ${ip}
Date & Time     : ${new Date(timestamp).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })} IST
Attempts Made   : 3 (Maximum reached)
Portal URL      : /iec-portal-2026
Action Taken    : Account locked for 30 minutes

WHAT THIS MEANS:
─────────────────
Someone attempted to access the IEC Admin Portal 3 times with incorrect credentials.
This may indicate:
  • A forgotten password by an IEC member
  • An unauthorised third party attempting to gain access

RECOMMENDED ACTION:
─────────────────
1. Verify with your IEC team if any member was attempting to log in
2. If this was NOT an IEC member, treat this as a security incident
3. Consider changing admin passwords if suspicious
4. Review the audit logs in the admin portal

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
This is an automated security notification from the IEC Digital Portal.
Do not reply to this message.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    `.trim();

    // Send via Resend (recommended) or any email API
    // Install: npm install resend
    // Add RESEND_API_KEY to .env.local
    const RESEND_API_KEY = process.env.RESEND_API_KEY;

    if (!RESEND_API_KEY) {
      // If no email API configured, just log — alert is still in audit_logs
      console.warn("RESEND_API_KEY not set — security alert logged to audit_logs only.");
      return NextResponse.json({ ok: true, method: "audit_log_only" });
    }

    const emailResults = await Promise.all(
      alert_recipients.map((to: string) =>
        fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${RESEND_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: "IEC Security System <alsiiec048@gmail.com>",
            to,
            subject,
            text: body,
          }),
        })
      )
    );

    return NextResponse.json({ ok: true, sent: emailResults.length });
  } catch (err) {
    console.error("Security alert failed:", err);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}