import { NextRequest, NextResponse } from "next/server";
import { getServerClient } from "@/lib/getServerClient()";
import { cookies } from "next/headers";

async function verifySession(): Promise<{
  valid: boolean;
  name?: string;
  role?: string;
}> {
  const cookieStore = await cookies();

  const token = cookieStore.get("iec_admin_token")?.value;
  const email = cookieStore.get("iec_admin_email")?.value;

  if (!token || !email) {
    return { valid: false };
  }

  const { data } = await getServerClient().rpc(
    "verify_admin_session",
    {
      p_token: token,
      p_email: email,
    }
  );

  if (!data?.valid) {
    return { valid: false };
  }

  return {
    valid: true,
    name: data.full_name,
    role: data.role,
  };
}

export async function GET(req: NextRequest) {
  const session = await verifySession();

  if (!session.valid) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  const db = getServerClient();

  const type =
    new URL(req.url)
      .searchParams
      .get("type") ?? "full";

  const [c, v, p] = await Promise.all([
    db.from("candidates")
      .select("*")
      .order("submitted_at", {
        ascending: false,
      }),

    db.from("voters")
      .select("*")
      .order("submitted_at", {
        ascending: false,
      }),

    db.from("political_parties")
      .select("*")
      .order("submitted_at", {
        ascending: false,
      }),
  ]);

  await db.from("audit_logs").insert({
    actor_name: session.name,
    actor_role: session.role,
    action_type: "export",
    target_type: "system",
    target_id: type,
    description: `Excel export "${type}" by ${session.name}`,
  });

  return NextResponse.json({
    candidates: c.data ?? [],
    voters: v.data ?? [],
    parties: p.data ?? [],
  });
}


