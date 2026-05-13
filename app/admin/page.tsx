"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { verifyAdminSession, clearLegacyStorage } from "@/lib/adminAuth";

// /admin silently redirects logged-in admins to dashboard
// and sends everyone else to a 404-looking page
export default function AdminRoot() {
  const router = useRouter();

  useEffect(() => {
    async function checkAuth() {
      // Clear any legacy storage first
      clearLegacyStorage();
      
      // Verify session via secure API route
      const result = await verifyAdminSession();
      
      if (result.valid && result.admin) {
        router.replace("/admin/dashboard");
      } else {
        // Not logged in — show nothing, redirect to 404
        router.replace("/not-found");
      }
    }
    
    checkAuth();
  }, [router]);

  return null;
}