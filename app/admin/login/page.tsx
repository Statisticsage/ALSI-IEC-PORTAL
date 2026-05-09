"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // Fetch admin user by email
      const { data: admin, error: fetchErr } = await supabase
        .from("admin_users")
        .select("id, full_name, role, email, password_hash, is_active")
        .eq("email", email.trim())
        .eq("is_active", true)
        .maybeSingle();

      if (fetchErr || !admin) {
        setError("Invalid credentials. Access denied.");
        return;
      }

      // Verify password using pgcrypto crypt() via RPC
      const { data: valid, error: rpcErr } = await supabase.rpc(
        "verify_admin_password",
        { input_email: email.trim(), input_password: password }
      );

      if (rpcErr || !valid) {
        setError("Invalid credentials. Access denied.");
        return;
      }

      // Store session in sessionStorage
      sessionStorage.setItem(
        "iec_admin",
        JSON.stringify({
          id: admin.id,
          full_name: admin.full_name,
          role: admin.role,
          email: admin.email,
        })
      );

      // Update last_login
      await supabase
        .from("admin_users")
        .update({ last_login: new Date().toISOString() })
        .eq("id", admin.id);

      router.push("/admin/dashboard");
    } catch {
      setError("System error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 flex items-center justify-center px-6">
      <div className="w-full max-w-md">

        {/* HEADER */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#0B1F3A]">
            <svg className="h-7 w-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-[#0B1F3A]">IEC Admin Portal</h1>
          <p className="mt-1 text-sm text-slate-500">Independent Elections Commission — Restricted Access</p>
        </div>

        {/* FORM */}
        <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
          <form onSubmit={handleLogin} className="grid gap-5">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Official Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                autoComplete="email"
                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-[#0B1F3A] focus:ring-2 focus:ring-[#0B1F3A]/10"
                placeholder="your@email.com"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-[#0B1F3A] focus:ring-2 focus:ring-[#0B1F3A]/10"
                placeholder="••••••••"
              />
            </div>

            {error && (
              <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-700">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-[#0B1F3A] py-3.5 text-sm font-semibold text-white transition hover:bg-[#153E75] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Verifying..." : "Access Admin Portal"}
            </button>
          </form>
        </div>

        <p className="mt-6 text-center text-xs text-slate-400">
          This system is restricted to authorised IEC personnel only.<br />
          All access attempts are logged and monitored.
        </p>
      </div>
    </main>
  );
}