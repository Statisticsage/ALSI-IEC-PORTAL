/**
 * lib/supabaseServer.ts
 * IEC Admin Portal — Server-only Supabase client
 *
 * RULES:
 *  - This file must NEVER be imported from a "use client" component
 *  - SERVICE_ROLE key is NOT prefixed with NEXT_PUBLIC_
 *  - Only used in: API routes, server actions, middleware helpers
 */

import { createClient, SupabaseClient } from "@supabase/supabase-js";

// Runtime guard — crash loudly if accidentally imported client-side
if (typeof window !== "undefined") {
  throw new Error(
    "[IEC SECURITY] supabaseServer.ts imported on the client side. " +
      "This exposes the service role key. Import from lib/supabaseClient.ts instead."
  );
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error(
    "[IEC] Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY env vars."
  );
}

/**
 * createServerClient
 * Returns a service-role Supabase client.
 * Bypasses RLS — use only when you've already validated the caller is an IEC admin.
 */
export function createServerClient(): SupabaseClient {
  return createClient(supabaseUrl!, serviceRoleKey!, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

// Singleton for server-to-server calls
let _serverClient: SupabaseClient | null = null;

export function getServerClient(): SupabaseClient {
  if (!_serverClient) {
    _serverClient = createServerClient();
  }
  return _serverClient;
}