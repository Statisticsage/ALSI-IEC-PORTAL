import { NextRequest, NextResponse } from "next/server";
import { getServerClient } from "@/lib/getServerClient()";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const q = new URL(req.url)
    .searchParams
    .get("q")
    ?.trim()
    .toUpperCase();

  if (!q || q.length < 3) {
    return NextResponse.json(
      { error: "Query too short." },
      { status: 400 }
    );
  }

  const db = getServerClient();

  const { data: cand } = await db
    .from("candidates")
    .select("application_id, full_name, status, submitted_at, updated_at")
    .or(`passport_number.eq.${q},application_id.eq.${q}`)
    .maybeSingle();

  if (cand) {
    return NextResponse.json({
      type: "candidate",
      name: cand.full_name,
      id: cand.application_id,
      status: cand.status,
      submitted_at: cand.submitted_at,
      updated_at: cand.updated_at,
    });
  }

  const { data: voter } = await db
    .from("voters")
    .select("voter_id_number, full_name, verification_status, submitted_at, updated_at")
    .or(`passport_number.eq.${q},voter_id_number.eq.${q}`)
    .maybeSingle();

  if (voter) {
    return NextResponse.json({
      type: "voter",
      name: voter.full_name,
      id: voter.voter_id_number ?? "Pending assignment",
      status: voter.verification_status,
      submitted_at: voter.submitted_at,
      updated_at: voter.updated_at,
    });
  }

  const { data: party } = await db
    .from("political_parties")
    .select("party_name, acronym, status, submitted_at, updated_at")
    .or(`party_name.ilike.%${q}%,acronym.eq.${q}`)
    .maybeSingle();

  if (party) {
    return NextResponse.json({
      type: "party",
      name: party.party_name,
      id: party.acronym,
      status: party.status,
      submitted_at: party.submitted_at,
      updated_at: party.updated_at,
    });
  }

  return NextResponse.json(
    { notFound: true },
    { status: 404 }
  );
}



