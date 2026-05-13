import { createClient, type SupabaseClient } from "@supabase/supabase-js";

function getEnv(key: string): string {
  const value = process.env[key];

  if (!value || value.trim() === "") {
    throw new Error(`[IEC] Missing env var: "${key}"`);
  }

  return value.trim();
}

let _anonClient: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient {
  if (!_anonClient) {
    _anonClient = createClient(
      getEnv("NEXT_PUBLIC_SUPABASE_URL"),
      getEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
          detectSessionInUrl: false,
        },
      }
    );
  }

  return _anonClient;
}

export function getSupabaseAdmin(): SupabaseClient {
  if (typeof window !== "undefined") {
    throw new Error("[IEC] getSupabaseAdmin() is server-side only.");
  }

  return createClient(
    getEnv("NEXT_PUBLIC_SUPABASE_URL"),
    getEnv("SUPABASE_SERVICE_ROLE_KEY"),
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    }
  );
}

export function getSupabaseUrl(): string {
  return getEnv("NEXT_PUBLIC_SUPABASE_URL");
}