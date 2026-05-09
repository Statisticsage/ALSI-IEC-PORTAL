"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

const MAX_ATTEMPTS = 3;
const LOCKOUT_MINUTES = 30;
// IEC alert recipients
const ALERT_EMAILS = ["samwuor86@gmail.com", "Baysahjames518@gmail.com"];

export default function IECSecureLogin() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [locked, setLocked] = useState(false);
  const [attemptsLeft, setAttemptsLeft] = useState(MAX_ATTEMPTS);

  // Check if already locked on mount
  useEffect(() => {
    const lockUntil = localStorage.getItem("iec_lock_until");
    if (lockUntil && Date.now() < parseInt(lockUntil)) {
      setLocked(true);
    }
    // Check if already logged in
    const session = sessionStorage.getItem("iec_admin");
    if (session) router.replace("/admin/dashboard");
  }, [router]);

  async function sendAlertEmail(attemptedEmail: string, ip: string) {
    // Fire alert via Supabase edge function or email API
    // We log to audit_logs as a security alert — IEC checks this
    await supabase.from("audit_logs").insert([{
      actor_name: attemptedEmail,
      actor_role: "unknown",
      action_type: "login",
      target_type: "system",
      target_id: "admin_portal",
      description: `🚨 SECURITY ALERT: ${MAX_ATTEMPTS} failed login attempts detected from email "${attemptedEmail}" at IP ${ip}. Account access blocked for ${LOCKOUT_MINUTES} minutes. Immediate IEC review required.`,
      ip_address: ip,
    }]);

    // Also call a serverless route that sends email
    await fetch("/api/security-alert", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        attempted_email: attemptedEmail,
        ip,
        timestamp: new Date().toISOString(),
        alert_recipients: ALERT_EMAILS,
      }),
    }).catch(() => {}); // non-blocking
  }

  async function getClientIP(): Promise<string> {
    try {
      const res = await fetch("https://api.ipify.org?format=json");
      const data = await res.json();
      return data.ip ?? "unknown";
    } catch {
      return "unknown";
    }
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    if (locked) return;

    setError("");
    setLoading(true);

    try {
      const ip = await getClientIP();

      // Check failed attempts in DB
      const { data: failCount } = await supabase.rpc("count_failed_attempts", {
        input_email: email.trim(),
        input_ip: ip,
      });

      if ((failCount ?? 0) >= MAX_ATTEMPTS) {
        const lockUntil = Date.now() + LOCKOUT_MINUTES * 60 * 1000;
        localStorage.setItem("iec_lock_until", String(lockUntil));
        setLocked(true);
        await sendAlertEmail(email.trim(), ip);
        return;
      }

      // Verify password
      const { data: valid, error: rpcErr } = await supabase.rpc(
        "verify_admin_password",
        { input_email: email.trim(), input_password: password }
      );

      if (rpcErr || !valid) {
        // Log failed attempt
        await supabase.from("login_attempts").insert([{
          email: email.trim(),
          ip_address: ip,
          success: false,
        }]);

        const remaining = MAX_ATTEMPTS - ((failCount ?? 0) + 1);
        setAttemptsLeft(Math.max(0, remaining));

        if (remaining <= 0) {
          const lockUntil = Date.now() + LOCKOUT_MINUTES * 60 * 1000;
          localStorage.setItem("iec_lock_until", String(lockUntil));
          setLocked(true);
          await sendAlertEmail(email.trim(), ip);
          return;
        }

        setError(
          remaining === 1
            ? "Incorrect credentials. This is your final attempt before access is locked and IEC is alerted."
            : `Incorrect credentials. ${remaining} attempt${remaining !== 1 ? "s" : ""} remaining.`
        );
        return;
      }

      // SUCCESS — fetch admin profile
      const { data: admin } = await supabase
        .from("admin_users")
        .select("id, full_name, role, email, is_active")
        .eq("email", email.trim())
        .eq("is_active", true)
        .maybeSingle();

      if (!admin) {
        setError("Account is inactive. Contact the IEC Chairperson.");
        return;
      }

      // Log successful attempt
      await supabase.from("login_attempts").insert([{
        email: email.trim(),
        ip_address: ip,
        success: true,
      }]);

      // Update last_login
      await supabase.from("admin_users")
        .update({ last_login: new Date().toISOString() })
        .eq("id", admin.id);

      // Log to audit
      await supabase.from("audit_logs").insert([{
        actor_name: admin.full_name,
        actor_role: admin.role,
        action_type: "login",
        target_type: "system",
        target_id: "admin_portal",
        description: `Admin login successful from IP ${ip}`,
        ip_address: ip,
      }]);

      // Store session with expiry (2 hours)
      const session = {
        id: admin.id,
        full_name: admin.full_name,
        role: admin.role,
        email: admin.email,
        expires_at: Date.now() + 2 * 60 * 60 * 1000,
      };
      sessionStorage.setItem("iec_admin", JSON.stringify(session));

      // Clear any lockout state
      localStorage.removeItem("iec_lock_until");

      router.push("/admin/dashboard");
    } catch {
      setError("System error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  // LOCKED STATE
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
            Too many failed login attempts have been detected. This access point has been temporarily suspended for {LOCKOUT_MINUTES} minutes.
          </p>
          <p className="mt-4 text-sm font-semibold text-red-400">
            The IEC security team has been automatically notified.
          </p>
          <p className="mt-6 text-xs text-slate-600">
            All unauthorised access attempts are logged with IP address and timestamp.
            Persistent attempts may result in further action under ALSI election regulations.
          </p>
        </div>
      </main>
    );
  }

  // LOGIN FORM
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
            Independent Elections Commission<br />
            Authorised Personnel Only
          </p>
        </div>

        {/* WARNING BANNER */}
        <div className="mb-6 rounded-xl border border-red-800/40 bg-red-950/30 px-5 py-4 text-center">
          <p className="text-xs font-semibold uppercase tracking-widest text-red-400">
            ⚠ Restricted Access
          </p>
          <p className="mt-1.5 text-xs text-slate-400">
            This system is exclusively for authorised IEC administrators.
            All login attempts — successful or not — are logged with IP address and timestamp.
            Unauthorised access is a violation of ALSI election regulations.
          </p>
        </div>

        {/* ATTEMPTS INDICATOR */}
        {attemptsLeft < MAX_ATTEMPTS && (
          <div className="mb-4 rounded-xl border border-orange-700/40 bg-orange-950/30 px-5 py-3 text-center">
            <p className="text-sm font-semibold text-orange-400">
              {attemptsLeft} attempt{attemptsLeft !== 1 ? "s" : ""} remaining before lockout
            </p>
            <div className="mt-2 flex justify-center gap-1.5">
              {Array.from({ length: MAX_ATTEMPTS }).map((_, i) => (
                <div
                  key={i}
                  className={`h-1.5 w-8 rounded-full ${i < attemptsLeft ? "bg-orange-500" : "bg-slate-700"}`}
                />
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
                className="w-full rounded-xl border border-slate-600 bg-slate-900 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                placeholder="official@iec.alsi"
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
                className="w-full rounded-xl border border-slate-600 bg-slate-900 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                placeholder="••••••••••••"
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
          Locked out? Contact the IEC Chairperson directly.
        </p>
      </div>
    </main>
  );
}