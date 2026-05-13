"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { secureAdminLogin, clearAllStorage, detectConsoleInjection, initSecurityMonitoring, sessionManager } from "@/lib/secureAdminAuth";

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

    // Detect console injection attempts first
    const injectionAttempt = detectConsoleInjection();
    if (injectionAttempt) {
      setError(" Security violation detected. Access denied.");
      // Log security event
      console.error('[SECURITY] Console injection attempt detected:', injectionAttempt);
      setLoading(false);
      return;
    }

    // Clear all storage to prevent session hijacking
    clearAllStorage();

    try {
      // Enhanced login with client fingerprinting
      const result = await secureAdminLogin(email, password);
      
      if (result.success) {
        // Initialize security monitoring after successful login
        initSecurityMonitoring();
        sessionManager.startSessionTimer();
        router.push("/admin/dashboard");
      } else if (result.locked) {
        setError(" Account locked due to too many failed attempts. IEC security team notified.");
      } else {
        setError(result.error || "Invalid credentials. Access denied.");
      }
    } catch (err) {
      console.error('[LOGIN] Unexpected error:', err);
      setError("Network error. Please check your connection and try again.");
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
                Official IEC Email
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
                Secure Password
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