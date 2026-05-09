"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AdminRole } from "@/types";

export interface AdminSession {
  id: string;
  full_name: string;
  role: AdminRole;
  email: string;
}

export function useAdmin() {
  const router = useRouter();
  const [admin, setAdmin] = useState<AdminSession | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const raw = sessionStorage.getItem("iec_admin");
    if (!raw) {
      router.replace("/iec-portal-2026");
      return;
    }
    try {
      const session = JSON.parse(raw);
      // Enforce 2-hour session expiry
      if (session.expires_at && Date.now() > session.expires_at) {
        sessionStorage.removeItem("iec_admin");
        router.replace("/iec-portal-2026");
        return;
      }
      setAdmin(session);
    } catch {
      router.replace("/iec-portal-2026");
    } finally {
      setLoading(false);
    }
  }, [router]);

  function logout() {
    sessionStorage.removeItem("iec_admin");
    router.replace("/iec-portal-2026");
  }

  return { admin, loading, logout };
}

export function roleLabel(role: AdminRole): string {
  const map: Record<AdminRole, string> = {
    chairperson: "Chairperson",
    co_chairperson: "Co-Chairperson",
    secretary_general: "Secretary General",
    pro: "Public Relations Officer",
    iec_member: "IEC Member",
  };
  return map[role] ?? role;
}