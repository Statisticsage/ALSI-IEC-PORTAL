"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export interface AdminUser {
  id:          string;
  email:       string;
  full_name:   string;
  role:        string;
  permissions: Record<string, boolean>;
}

export function roleLabel(role: string): string {
  const labels: Record<string, string> = {
    secretary_general: "Secretary General",
    chairperson:       "IEC Chairperson",
    commissioner:      "IEC Commissioner",
  };
  return labels[role] ?? role;
}

export function useAdmin() {
  const router  = useRouter();
  const [admin,   setAdmin]   = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);

  const logout = useCallback(async () => {
    const token = sessionStorage.getItem("iec_token");

    // Invalidate token server-side
    if (token) {
      await supabase.rpc("invalidate_admin_session", { p_token: token });
    }

    // Wipe ALL storage — no trace left for console injection
    sessionStorage.clear();
    localStorage.clear();

    setAdmin(null);
    router.replace("/admin/login");
  }, [router]);

  useEffect(() => {
    let cancelled = false;

    async function verifySession() {
      // ── Pull token + email from sessionStorage ──────────────────
      const token = sessionStorage.getItem("iec_token");
      const email = sessionStorage.getItem("iec_email");

      // Nothing in storage → not logged in
      if (!token || !email) {
        if (!cancelled) {
          setAdmin(null);
          setLoading(false);
          router.replace("/admin/login");
        }
        return;
      }

      // ── Verify token against DB every single page load ──────────
      // A console-injected sessionStorage entry will have a token
      // that doesn't exist in admin_sessions → rejected here.
      const { data: result, error } = await supabase.rpc(
        "verify_admin_session",
        { p_token: token, p_email: email }
      );

      if (cancelled) return;

      if (error || !result?.valid) {
        // Token invalid, expired, or tampered — force logout
        sessionStorage.clear();
        localStorage.clear();
        setAdmin(null);
        setLoading(false);
        router.replace("/admin/login");
        return;
      }

      // ── Valid — set admin from server response, not from storage ─
      setAdmin({
        id:          result.id,
        email:       result.email,
        full_name:   result.full_name,
        role:        result.role,
        permissions: result.permissions ?? {},
      });
      setLoading(false);
    }

    verifySession();
    return () => { cancelled = true; };
  }, [router]);

  return { admin, loading, logout };
}