/**
 * app/api/notify-registration/route.ts
 * IEC Election Portal — Registration notification emails
 *
 * POST /api/notify-registration
 * Sends an email to the IEC team when a new candidate, voter, or party
 * submits a registration. Non-blocking — failures are logged, not thrown.
 *
 * NOTE: File must be named route.ts (singular).
 * Next.js App Router ignores routes.ts (plural) entirely.
 */

import { NextRequest, NextResponse } from "next/server";

export const runtime = "edge";
export const dynamic = "force-dynamic";

const IEC_EMAIL = "alsiiec048@gmail.com";

type RegType = "candidate" | "voter" | "party";

// ---------------------------------------------------------------------------
// Email body builders
// ---------------------------------------------------------------------------
function buildBody(
  type: RegType,
  data: Record<string, string>
): { subject: string; text: string } {
  const time = new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" });
  const divider = "─".repeat(38);

  if (type === "candidate") {
    return {
      subject: `New Candidate Registration — ${data.full_name} (${data.position_applied})`,
      text: [
        "INDEPENDENT ELECTIONS COMMISSION (IEC)",
        "New Candidate Registration Received",
        divider,
        "",
        "APPLICATION DETAILS:",
        `Application ID  : ${data.application_id}`,
        `Full Name       : ${data.full_name}`,
        `Position        : ${data.position_applied}`,
        `University      : ${data.university}`,
        `GPA             : ${data.gpa}`,
        `Email           : ${data.email}`,
        `WhatsApp        : ${data.whatsapp}`,
        `Submitted At    : ${time} IST`,
        `Status          : PENDING IEC REVIEW`,
        "",
        "ACTION REQUIRED:",
        "Log in to the IEC Admin Portal to review this application.",
        "Portal: https://iec.alsi-election-org.workers.dev/iec-portal-2026",
        "",
        divider,
        "IEC Digital Registration Portal — ALSI 2026/2027",
      ].join("\n"),
    };
  }

  if (type === "voter") {
    return {
      subject: `New Voter Registration — ${data.full_name}`,
      text: [
        "INDEPENDENT ELECTIONS COMMISSION (IEC)",
        "New Voter Registration Received",
        divider,
        "",
        "VOTER DETAILS:",
        `Full Name       : ${data.full_name}`,
        `University      : ${data.university}`,
        `Student ID      : ${data.student_id}`,
        `Passport No.    : ${data.passport_number}`,
        `ALSI Status     : ${data.alsi_member_status}`,
        `Email           : ${data.email}`,
        `Submitted At    : ${time} IST`,
        `Status          : PENDING VERIFICATION`,
        "",
        "ACTION REQUIRED:",
        "Log in to the IEC Admin Portal to verify this voter.",
        "Portal: https://iec.alsi-election-org.workers.dev/iec-portal-2026",
        "",
        divider,
        "IEC Digital Registration Portal — ALSI 2026/2027",
      ].join("\n"),
    };
  }

  // party
  return {
    subject: `New Political Party Registration — ${data.party_name} (${data.acronym})`,
    text: [
      "INDEPENDENT ELECTIONS COMMISSION (IEC)",
      "New Political Party Registration Received",
      divider,
      "",
      "PARTY DETAILS:",
      `Party Name      : ${data.party_name}`,
      `Acronym         : ${data.acronym}`,
      `Chairperson     : ${data.chairperson_name}`,
      `Secretary Gen.  : ${data.secretary_general_name}`,
      `Contact Email   : ${data.contact_email}`,
      `WhatsApp        : ${data.whatsapp}`,
      `Submitted At    : ${time} IST`,
      `Status          : PENDING IEC REVIEW`,
      "",
      "ACTION REQUIRED:",
      "Log in to the IEC Admin Portal to review this party registration.",
      "Portal: https://iec.alsi-election-org.workers.dev/iec-portal-2026",
      "",
      divider,
      "IEC Digital Registration Portal — ALSI 2026/2027",
    ].join("\n"),
  };
}

// ---------------------------------------------------------------------------
// POST /api/notify-registration
// ---------------------------------------------------------------------------
export async function POST(req: NextRequest) {
  try {
    const { type, data } = (await req.json()) as {
      type: RegType;
      data: Record<string, string>;
    };

    if (!type || !data) {
      return NextResponse.json(
        { ok: false, error: "Missing type or data." },
        { status: 400 }
      );
    }

    const RESEND_KEY = process.env.RESEND_API_KEY;
    if (!RESEND_KEY) {
      // Non-fatal — registration is already saved in DB
      console.warn("[notify-registration] RESEND_API_KEY not set — email skipped.");
      return NextResponse.json({ ok: true, method: "no_email_key" });
    }

    const { subject, text } = buildBody(type, data);

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization:  `Bearer ${RESEND_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from:    "IEC Registration Portal <onboarding@resend.dev>",
        to:      [IEC_EMAIL],
        subject,
        text,
      }),
    });

    if (!res.ok) {
      const detail = await res.text();
      console.error("[notify-registration] Resend error:", detail);
      return NextResponse.json({ ok: false, error: "Email delivery failed." }, { status: 502 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[notify-registration] Unexpected error:", err);
    return NextResponse.json({ ok: false, error: "Notification failed." }, { status: 500 });
  }
}