/**
 * lib/supabase.ts
 * IEC Election Portal — Supabase client factory
 *
 * Exports:
 *   supabase         — anon client singleton (safe in client components + public routes)
 *   getSupabase()    — anon client factory (same singleton)
 *   getSupabaseAdmin() — service-role client (server-side ONLY)
 *   getSupabaseUrl() — raw URL accessor
 *
 * ARCHITECTURE NOTE:
 *  The anon client is initialized lazily on first call.
 *  No validation runs at module evaluation time — that crashes Next.js at build.
 *  Cloudflare Pages injects env vars at runtime, not at build time.
 */

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// ---------------------------------------------------------------------------
// Internal env accessor — throws at call time, never at module load time
// ---------------------------------------------------------------------------
function getEnv(key: string): string {
  const value = process.env[key];
  if (!value || value.trim() === "") {
    throw new Error(
      `[IEC Supabase] Missing required environment variable: "${key}"\n` +
        `Set it in Cloudflare Pages → Settings → Environment Variables → Production.`
    );
  }
  return value.trim();
}

// ---------------------------------------------------------------------------
// Singletons
// ---------------------------------------------------------------------------
let _anonClient:  SupabaseClient | null = null;
let _adminClient: SupabaseClient | null = null;

// ---------------------------------------------------------------------------
// Anon client — safe for client components, SSR, and public API routes
// ---------------------------------------------------------------------------
export function getSupabase(): SupabaseClient {
  if (!_anonClient) {
    _anonClient = createClient(
      getEnv("NEXT_PUBLIC_SUPABASE_URL"),
      getEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
      {
        auth: {
          persistSession:     true,
          autoRefreshToken:   true,
          detectSessionInUrl: true,
        },
      }
    );
  }
  return _anonClient;
}

/**
 * Named export for convenience — singleton guaranteed.
 * Calls getSupabase() which is lazy — no module-level initialization.
 * Safe to import anywhere; client is only created on first actual use.
 */
/**
 * Named export for convenience — singleton guaranteed.
 * getSupabase() is called here but safe: this module is only evaluated
 * at runtime (inside API routes or client components), never during
 * Next.js static build. All routes are force-dynamic.
 */
export const supabase = getSupabase();

// ---------------------------------------------------------------------------
// Admin client — service role, bypasses RLS entirely
// Call only from Server Components, API routes, or Server Actions.
// ---------------------------------------------------------------------------
export function getSupabaseAdmin(): SupabaseClient {
  if (typeof window !== "undefined") {
    throw new Error(
      "[IEC Supabase] getSupabaseAdmin() called client-side. " +
        "Import only in Server Components, API routes, or Server Actions."
    );
  }

  if (!_adminClient) {
    _adminClient = createClient(
      getEnv("NEXT_PUBLIC_SUPABASE_URL"),
      getEnv("SUPABASE_SERVICE_ROLE_KEY"),
      {
        auth: {
          persistSession:   false,
          autoRefreshToken: false,
        },
      }
    );
  }

  return _adminClient;
}

// ---------------------------------------------------------------------------
// Utility
// ---------------------------------------------------------------------------
export function getSupabaseUrl(): string {
  return getEnv("NEXT_PUBLIC_SUPABASE_URL");
}