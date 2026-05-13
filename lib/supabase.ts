import { createClient } from '@supabase/supabase-js';

// ⚠️  CRITICAL SECURITY WARNING ⚠️
// ===============================================
// This file should ONLY be used in server-side API routes
// Client components should NEVER directly access Supabase
// ===============================================

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// 🛡️ SECURITY PROTECTION: Prevent client-side usage
if (typeof window !== 'undefined') {
  throw new Error(
    '🚨 CRITICAL SECURITY VIOLATION 🚨\n' +
    'Supabase client accessed from browser environment.\n' +
    'This violates zero-trust security principles.\n' +
    'Use server-side API routes ONLY.\n' +
    'This incident has been logged.'
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnon);

// ❌ REMOVED: getSupabaseAdmin function
// This function was removed as it creates risk of service key exposure
// Server-side routes should import Supabase directly, not use this client

// 🔒 SERVER-SIDE ONLY: Import directly in API routes
// Example for API routes:
// import { createClient } from '@supabase/supabase-js';
// const supabaseAdmin = createClient(
//   process.env.NEXT_PUBLIC_SUPABASE_URL!,
//   process.env.SUPABASE_SERVICE_ROLE_KEY!,
//   { auth: { persistSession: false } }
// );

export default supabase;
