import { NextRequest, NextResponse } from "next/server";
import { getServerClient } from "@/lib/getServerClient()";
import { cookies } from "next/headers";

async function verifySession(): Promise<boolean> {
  const cookieStore = await cookies();

  const token = cookieStore.get("iec_admin_token")?.value;
  const email = cookieStore.get("iec_admin_email")?.value;

  if (!token || !email) return false;

  const { data } = await getServerClient().rpc(
    "verify_admin_session",
    {
      p_token: token,
      p_email: email,
    }
  );

  return data?.valid === true;
}

export async function GET(req: NextRequest) {
  if (!(await verifySession())) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  const db = getServerClient();

  const { searchParams } = new URL(req.url);

  const page     = parseInt(searchParams.get("page") ?? "0");
  const pageSize = parseInt(searchParams.get("size") ?? "25");

  const action = searchParams.get("action") ?? "all";
  const target = searchParams.get("target") ?? "all";

  let q = db
    .from("audit_logs")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(
      page * pageSize,
      (page + 1) * pageSize - 1
    );

  if (action !== "all") {
    q = q.eq("action_type", action);
  }

  if (target !== "all") {
    q = q.eq("target_type", target);
  }

  const { data, count, error } = await q;

  if (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }

  const since24h = new Date(
    Date.now() - 86400000
  ).toISOString();

  const { count: failedCount } = await db
    .from("login_attempts")
    .select("*", {
      count: "exact",
      head: true,
    })
    .eq("success", false)
    .gte("attempted_at", since24h);

  return NextResponse.json({
    logs: data ?? [],
    total: count ?? 0,
    failedLogins: failedCount ?? 0,
  });
}

export async function POST(req: NextRequest) {
  if (!(await verifySession())) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  const { error } = await getServerClient()
    .from("audit_logs")
    .insert(await req.json());

  if (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true });
}


