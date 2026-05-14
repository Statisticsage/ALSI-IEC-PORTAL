/**
 * lib/supabaseServer.ts — SERVER ONLY. Never import in "use client" files.
 * Uses the service role key for full DB access bypassing RLS.
 */
import { createClient, SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl      = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRoleKey   = process.env.SUPABASE_SERVICE_ROLE_KEY!;

let _adminClient: SupabaseClient | null = null;

export function getServerClient(): SupabaseClient {
  if (!_adminClient) {
    _adminClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
  }
  return _adminClient;
}

// All naming conventions supported
export const supabaseAdmin  = getServerClient();
export const createServerClient = getServerClient;
export const getSupabaseAdmin   = getServerClient;