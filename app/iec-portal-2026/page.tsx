"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { adminLogin, clearLegacyStorage } from "@/lib/adminAuth";

const MAX_ATTEMPTS = 3;
const LOCKOUT_MS = 30 * 60 * 1000; // 30 minutes

export default function IECSecureLogin() {
  const router = useRouter();
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");
  const [locked, setLocked]     = useState(false);
  const [attempts, setAttempts] = useState(0);

  useEffect(() => {
    // Clear any legacy storage and check if already logged in
    clearLegacyStorage();
    
    // Check existing lockout
    try {
      const lockUntil = localStorage.getItem("iec_lock_until");
      if (lockUntil && Date.now() < parseInt(lockUntil)) {
        setLocked(true);
        return;
      }
    } catch { /* ignore */ }
  }, []);

  async function getIP(): Promise<string> {
    try {
      const r = await fetch("https://api.ipify.org?format=json");
      const d = await r.json();
      return d.ip ?? "unknown";
    } catch { return "unknown"; }
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    if (locked) return;
    setError("");
    setLoading(true);

    // Clear any legacy storage first
    clearLegacyStorage();

    try {
      // Use secure API route for authentication
      const result = await adminLogin(email, password);
      
      if (result.locked) {
        setLocked(true);
        return;
      }
      
      if (result.success && result.admin) {
        // Clear lockout on successful login
        localStorage.removeItem("iec_lock_until");
        router.push("/admin/dashboard");
      } else {
        setError(result.error || "Invalid credentials. Access denied.");
        const newAttempts = attempts + 1;
        setAttempts(newAttempts);
        
        if (newAttempts >= MAX_ATTEMPTS) {
          localStorage.setItem("iec_lock_until", String(Date.now() + LOCKOUT_MS));
          setLocked(true);
        }
      }
    } catch (err) {
      console.error(err);
      setError("Network error. Please check your connection.");
    } finally {
      setLoading(false);
    }
  }

  const attemptsLeft = MAX_ATTEMPTS - attempts;

  // ── LOCKED SCREEN ──────────────────────────────────────
  if (locked) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-900 px-6">
        <div className="w-full max-w-md text-center">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-red-500/20">
            <svg className="h-8 w-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-white">Access Suspended</h1>
          <p className="mt-3 text-sm text-slate-400">
            Too many failed attempts. This portal has been suspended for 30 minutes.
          </p>
          <p className="mt-4 text-sm font-semibold text-red-400">
            The IEC has been automatically notified at alsiiec048@gmail.com
          </p>
          <p className="mt-6 text-xs text-slate-600">
            All access attempts are logged with IP address and timestamp.
          </p>
        </div>
      </main>
    );
  }

  // ── LOGIN FORM ─────────────────────────────────────────
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-900 px-6">
      <div className="w-full max-w-md">

        {/* HEADER */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#0B1F3A] ring-2 ring-slate-700">
            <svg className="h-7 w-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-white">IEC Secure Portal</h1>
          <p className="mt-1 text-sm text-slate-400">
            Independent Elections Commission<br />Authorised Personnel Only
          </p>
        </div>

        {/* WARNING */}
        <div className="mb-6 rounded-xl border border-red-800/40 bg-red-950/30 px-5 py-4 text-center">
          <p className="text-xs font-semibold uppercase tracking-widest text-red-400">
            ⚠ Restricted Access
          </p>
          <p className="mt-1.5 text-xs text-slate-400">
            This system is exclusively for authorised IEC administrators.
            All login attempts are logged with IP address and timestamp.
            Unauthorised access violates ALSI election regulations.
          </p>
        </div>

        {/* ATTEMPTS INDICATOR */}
        {attempts > 0 && (
          <div className="mb-4 rounded-xl border border-orange-700/40 bg-orange-950/30 px-5 py-3 text-center">
            <p className="text-sm font-semibold text-orange-400">
              {attemptsLeft} attempt{attemptsLeft !== 1 ? "s" : ""} remaining before lockout
            </p>
            <div className="mt-2 flex justify-center gap-1.5">
              {Array.from({ length: MAX_ATTEMPTS }).map((_, i) => (
                <div key={i} className={`h-1.5 w-8 rounded-full ${i < attemptsLeft ? "bg-orange-500" : "bg-slate-700"}`} />
              ))}
            </div>
          </div>
        )}

        {/* FORM */}
        <div className="rounded-2xl border border-slate-700 bg-slate-800 p-8 shadow-2xl">
          <form onSubmit={handleLogin} className="grid gap-5">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-300">
                Official IEC Email
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                autoComplete="off"
                placeholder="Enter your official email"
                className="w-full rounded-xl border border-slate-600 bg-slate-900 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-300">
                Secure Password
              </label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                autoComplete="new-password"
                placeholder="••••••••••••"
                className="w-full rounded-xl border border-slate-600 bg-slate-900 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
              />
            </div>

            {error && (
              <div className="rounded-xl border border-red-700/50 bg-red-950/50 p-3 text-center text-sm font-medium text-red-400">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-[#0B1F3A] py-3.5 text-sm font-semibold text-white transition hover:bg-[#153E75] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? "Verifying identity..." : "Access Secure Portal"}
            </button>
          </form>
        </div>

        <p className="mt-6 text-center text-xs text-slate-600">
          Session expires after 2 hours of inactivity.<br />
          Issues? Contact alsiiec048@gmail.com
        </p>
      </div>
    </main>
  );
}