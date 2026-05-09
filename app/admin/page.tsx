"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

// /admin silently redirects logged-in admins to dashboard
// and sends everyone else to a 404-looking page
export default function AdminRoot() {
  const router = useRouter();

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem("iec_admin");
      if (raw) {
        const s = JSON.parse(raw);
        if (s.expires_at && Date.now() < s.expires_at) {
          router.replace("/admin/dashboard");
          return;
        }
      }
    } catch { /* ignore */ }
    // Not logged in — show nothing, redirect to 404
    router.replace("/not-found");
  }, [router]);

  return null;
}