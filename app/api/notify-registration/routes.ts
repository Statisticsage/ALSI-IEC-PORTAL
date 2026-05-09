import { NextRequest, NextResponse } from "next/server";

export const runtime = "edge";

const IEC_EMAIL = "alsiiec048@gmail.com";

type RegType = "candidate" | "voter" | "party";

function buildBody(type: RegType, data: Record<string, string>): { subject: string; text: string } {
  const time = new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" });

  if (type === "candidate") {
    return {
      subject: `📋 New Candidate Registration — ${data.full_name} (${data.position_applied})`,
      text: `
INDEPENDENT ELECTIONS COMMISSION (IEC)
New Candidate Registration Received
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

APPLICATION DETAILS:
Application ID  : ${data.application_id}
Full Name       : ${data.full_name}
Position        : ${data.position_applied}
University      : ${data.university}
GPA             : ${data.gpa}
Email           : ${data.email}
WhatsApp        : ${data.whatsapp}
Submitted At    : ${time} IST
Status          : PENDING IEC REVIEW

ACTION REQUIRED:
Log in to the IEC Admin Portal to review this application.
Portal: https://iec.alsi-election-org.workers.dev/iec-portal-2026

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
IEC Digital Registration Portal — ALSI 2026/2027
      `.trim(),
    };
  }

  if (type === "voter") {
    return {
      subject: `🗳️ New Voter Registration — ${data.full_name}`,
      text: `
INDEPENDENT ELECTIONS COMMISSION (IEC)
New Voter Registration Received
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

VOTER DETAILS:
Full Name       : ${data.full_name}
University      : ${data.university}
Student ID      : ${data.student_id}
Passport No.    : ${data.passport_number}
ALSI Status     : ${data.alsi_member_status}
Email           : ${data.email}
Submitted At    : ${time} IST
Status          : PENDING VERIFICATION

ACTION REQUIRED:
Log in to the IEC Admin Portal to verify this voter.
Portal: https://iec.alsi-election-org.workers.dev/iec-portal-2026

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
IEC Digital Registration Portal — ALSI 2026/2027
      `.trim(),
    };
  }

  // party
  return {
    subject: `🏛️ New Political Party Registration — ${data.party_name} (${data.acronym})`,
    text: `
INDEPENDENT ELECTIONS COMMISSION (IEC)
New Political Party Registration Received
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

PARTY DETAILS:
Party Name      : ${data.party_name}
Acronym         : ${data.acronym}
Chairperson     : ${data.chairperson_name}
Secretary Gen.  : ${data.secretary_general_name}
Contact Email   : ${data.contact_email}
WhatsApp        : ${data.whatsapp}
Submitted At    : ${time} IST
Status          : PENDING IEC REVIEW

ACTION REQUIRED:
Log in to the IEC Admin Portal to review this party registration.
Portal: https://iec.alsi-election-org.workers.dev/iec-portal-2026

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
IEC Digital Registration Portal — ALSI 2026/2027
    `.trim(),
  };
}

export async function POST(req: NextRequest) {
  try {
    const { type, data } = await req.json() as { type: RegType; data: Record<string, string> };

    const RESEND_KEY = process.env.RESEND_API_KEY;
    if (!RESEND_KEY) {
      return NextResponse.json({ ok: true, method: "no_email_key" });
    }

    const { subject, text } = buildBody(type, data);

    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "IEC Registration Portal <onboarding@resend.dev>",
        to: [IEC_EMAIL],
        subject,
        text,
      }),
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Registration notification failed:", err);
    return NextResponse.json({ ok: false });
  }
}