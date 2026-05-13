/**
 * lib/supabase.ts
 *
 * Supabase client factory with strict environment validation.
 * Fails fast at module load time — never silently during a request.
 *
 * Exports:
 *   supabase         — anon client (safe in client components and public API routes)
 *   getSupabaseAdmin — service-role client (server-side ONLY — never expose to browser)
 *   getSupabaseUrl   — raw URL accessor for edge cases
 *
 * NOTE: To enable full type safety, run:
 *   npx supabase gen types typescript --project-id <your-project-id> > types/database.ts
 * Then import Database from "@/types/database" and replace `any` generics.
 */

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// ---------------------------------------------------------------------------
// Environment validation
// Fails at import time — not mid-request, not mid-render.
// ---------------------------------------------------------------------------

function requireEnv(key: string): string {
  const value = process.env[key];
  if (!value || value.trim() === "") {
    throw new Error(
      `[Supabase] Missing required environment variable: "${key}"\n` +
        `Ensure it is set in Cloudflare Pages → Settings → Environment Variables → Production.`
    );
  }
  return value.trim();
}

const SUPABASE_URL = requireEnv("NEXT_PUBLIC_SUPABASE_URL");
const SUPABASE_ANON_KEY = requireEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY");

// Service role key is server-only — intentionally NOT prefixed with NEXT_PUBLIC_
// Will be undefined in client-side bundles. That is correct behavior.
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

// ---------------------------------------------------------------------------
// Singletons — prevents multiple GoTrue instances + connection pool exhaustion
// ---------------------------------------------------------------------------

let _supabaseAnon: SupabaseClient | null = null;
let _supabaseAdmin: SupabaseClient | null = null;

// ---------------------------------------------------------------------------
// Anon client — safe for client components, SSR, and public API routes
// ---------------------------------------------------------------------------

export function getSupabase(): SupabaseClient {
  if (!_supabaseAnon) {
    _supabaseAnon = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    });
  }
  return _supabaseAnon;
}

/**
 * Default named export for convenience — singleton guaranteed.
 * Use this in client components and public-facing server code.
 */
export const supabase = getSupabase();

// ---------------------------------------------------------------------------
// Admin client — service role, bypasses RLS entirely
// Import ONLY in Server Components, API routes, or Server Actions.
// NEVER in client components — this key has full database access.
// ---------------------------------------------------------------------------

export function getSupabaseAdmin(): SupabaseClient {
  if (typeof window !== "undefined") {
    throw new Error(
      "[Supabase] getSupabaseAdmin() must not be called in client-side code.\n" +
        "Import it only in Server Components, API routes, or Server Actions."
    );
  }

  if (!SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error(
      "[Supabase] Missing environment variable: SUPABASE_SERVICE_ROLE_KEY\n" +
        "Required for admin operations that bypass RLS.\n" +
        "Set it in Cloudflare Pages → Settings → Environment Variables → Production."
    );
  }

  if (!_supabaseAdmin) {
    _supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: {
        persistSession: false,   // stateless — no session storage on the server
        autoRefreshToken: false,
      },
    });
  }

  return _supabaseAdmin;
}

// ---------------------------------------------------------------------------
// Utility
// ---------------------------------------------------------------------------

export function getSupabaseUrl(): string {
  return SUPABASE_URL;
}