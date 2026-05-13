/**
 * lib/supabaseServer.ts
 * IEC Admin Portal — Server-only Supabase client
 *
 * RULES:
 *  - NEVER import this from a "use client" component
 *  - SUPABASE_SERVICE_ROLE_KEY is NOT prefixed with NEXT_PUBLIC_
 *  - Only used in: API routes, Server Actions, middleware helpers
 *
 * ARCHITECTURE NOTE:
 *  All validation is deferred to call time (getServerClient / createServerClient).
 *  Nothing throws at module evaluation — that would crash Next.js at build time
 *  before Cloudflare has injected environment variables.
 */

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// ---------------------------------------------------------------------------
// Internal factory — validates env vars at call time, not import time
// ---------------------------------------------------------------------------
function buildClient(): SupabaseClient {
  // Runtime guard — crash loudly if accidentally called client-side
  if (typeof window !== "undefined") {
    throw new Error(
      "[IEC SECURITY] supabaseServer.ts used on the client side. " +
        "This would expose the service role key. " +
        "Import from lib/supabase.ts instead."
    );
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error(
      "[IEC] Missing environment variables: NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.\n" +
        "Set both in Cloudflare Pages → Settings → Environment Variables → Production."
    );
  }

  return createClient(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession:   false,
    },
  });
}

// ---------------------------------------------------------------------------
// createServerClient — new instance per call (use for isolated operations)
// ---------------------------------------------------------------------------
export function createServerClient(): SupabaseClient {
  return buildClient();
}

// ---------------------------------------------------------------------------
// getServerClient — singleton (use for standard server-to-server calls)
// Singleton is safe here because Next.js API routes run in a persistent
// Node.js process on Cloudflare Workers / Pages Functions.
// ---------------------------------------------------------------------------
let _serverClient: SupabaseClient | null = null;

export function getServerClient(): SupabaseClient {
  if (!_serverClient) {
    _serverClient = buildClient();
  }
  return _serverClient;
}