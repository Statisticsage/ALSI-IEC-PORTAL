/**
 * lib/supabaseServer.ts — server only, never import in "use client" files
 */
import { createClient } from "@supabase/supabase-js";

const supabaseUrl      = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRoleKey   = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Single shared instance — server only
export const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// Also export as getServerClient so both naming conventions work
export function getServerClient() {
  return supabaseAdmin;
}

export function createServerClient() {
  return supabaseAdmin;
}