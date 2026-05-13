"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  verifyAdminSession,
  adminLogout,
  clearAllStorage,
  initSecurityMonitoring,
  stopSecurityMonitoring,
  sessionManager,
} from "@/lib/secureAdminAuth";

export interface AdminUser {
  id: string;
  email: string;
  full_name: string;
  role: string;
  permissions: Record<string, boolean>;
}

export function roleLabel(role: string): string {
  const labels: Record<string, string> = {
    secretary_general: "Secretary General",
    chairperson: "IEC Chairperson",
    commissioner: "IEC Commissioner",
  };
  return labels[role] ?? role;
}

export function useAdmin() {
  const router = useRouter();
  const [admin, setAdmin] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);

  const logout = useCallback(async () => {
    stopSecurityMonitoring();
    sessionManager.clearTimer();
    clearAllStorage();
    await adminLogout();
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function checkSession() {
      setLoading(true);

      // Verify session against the server — httpOnly cookie sent automatically.
      // No sessionStorage read. A console-injected value cannot pass this.
      const result = await verifyAdminSession();

      if (cancelled) return;

      if (!result.valid || !result.admin) {
        clearAllStorage();
        setAdmin(null);
        setLoading(false);
        router.replace("/iec-portal-2026");
        return;
      }

      // Admin data comes from the server, not from storage
      setAdmin(result.admin as AdminUser);
      setLoading(false);

      // Start security monitoring and session timer
      initSecurityMonitoring();
      sessionManager.startSessionTimer();
    }

    checkSession();

    return () => {
      cancelled = true;
    };
  }, [router]);

  return { admin, loading, logout };
}