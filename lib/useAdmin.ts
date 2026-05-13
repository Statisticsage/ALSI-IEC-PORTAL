"use client";

import { useEffect, useState, useCallback } from "react";
import {
  verifyAdminSession,
  adminLogout,
  initSecurityMonitoring,
  sessionManager,
  type AdminUser,
} from "@/lib/secureAdminAuth";

interface UseAdminReturn {
  admin: AdminUser | null;
  loading: boolean;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
}

// FIXED: Added roleLabel export that AdminShell.tsx needs
export function roleLabel(role: string): string {
  const labels: Record<string, string> = {
    chairperson:       "Chairperson",
    secretary_general: "Secretary General",
    treasurer:         "Treasurer",
    electoral_officer: "Electoral Officer",
    observer:          "Observer",
  };
  return labels[role] ?? role;
}

export function useAdmin(): UseAdminReturn {
  const [admin, setAdmin] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const result = await verifyAdminSession();
      if (result.valid && result.admin) {
        setAdmin(result.admin);
      } else {
        setAdmin(null);
        window.location.href = "/admin/login?reason=session_expired";
      }
    } catch {
      setAdmin(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh().then(() => {
      initSecurityMonitoring();
      sessionManager.startSessionTimer();
    });
    return () => {
      sessionManager.stopSessionTimer();
    };
  }, [refresh]);

  const logout = useCallback(async () => {
    sessionManager.stopSessionTimer();
    await adminLogout();
  }, []);

  return { admin, loading, logout, refresh };
}