import { NextResponse } from "next/server";
import { getServerClient } from "@/lib/getServerClient()";

export async function GET() {
  try {
    const hasUrl = !!process.env.NEXT_PUBLIC_SUPABASE_URL;
    const hasKey = !!process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!hasUrl || !hasKey) {
      return NextResponse.json({ error: "Missing env vars", hasUrl, hasKey });
    }
    const { data, error } = await getServerClient().rpc("verify_admin_password", {
      input_email: "jameshbaysah013@gmail.com",
      input_password: "AILSIEC@2021"
    });
    return NextResponse.json({ success: true, data, error, hasUrl, hasKey });
  } catch (err: any) {
    return NextResponse.json({ crashed: true, message: err.message });
  }
}

