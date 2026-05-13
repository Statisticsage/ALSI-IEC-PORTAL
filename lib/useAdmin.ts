"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { verifyAdminSession, adminLogout, clearLegacyStorage, detectConsoleInjection } from "@/lib/adminAuth";

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
    // Clear any legacy storage first
    clearLegacyStorage();
    
    // Server-side logout via API route
    await adminLogout();
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function verifySession() {
      // Security: Detect console injection attempts
      if (detectConsoleInjection()) {
        console.warn('[SECURITY] Console injection detected - clearing storage');
        if (!cancelled) {
          setAdmin(null);
          setLoading(false);
          router.replace("/admin/login");
        }
        return;
      }

      // Verify session via secure API route (httpOnly cookies)
      const result = await verifyAdminSession();

      if (cancelled) return;

      if (!result.valid || !result.admin) {
        // Session invalid - redirect to login
        setAdmin(null);
        setLoading(false);
        router.replace("/admin/login");
        return;
      }

      // Valid session - set admin from server response
      setAdmin(result.admin);
      setLoading(false);
    }

    verifySession();
    return () => { cancelled = true; };
  }, [router]);

  return { admin, loading, logout };
}