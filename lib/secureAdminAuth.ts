"use client";

// ================================================================
// IEC Admin Portal — Secure Authentication Library
// All auth goes through /api/admin/* routes — ZERO direct Supabase
// calls from the browser. The anon key cannot touch admin data.
// ================================================================

export interface AdminUser {
  id: string;
  email: string;
  full_name: string;
  role: string;
  permissions: Record<string, boolean>;
}

export interface LoginResult {
  success: boolean;
  error?: string;
  locked?: boolean;
  admin?: AdminUser;
}

export interface SessionResult {
  valid: boolean;
  admin?: AdminUser;
  error?: string;
}

// ── 1. LOGIN ────────────────────────────────────────────────────
// Calls /api/admin/login — server sets httpOnly cookie on success.
// sessionStorage is NEVER written with admin data.
export async function secureAdminLogin(
  email: string,
  password: string
): Promise<LoginResult> {
  try {
    // Clear all legacy storage before attempting login
    clearAllStorage();

    const res = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",           // sends + receives cookies
      body: JSON.stringify({
        email: email.trim().toLowerCase(),
        password,
      }),
    });

    const data = await res.json();

    if (!res.ok || !data.success) {
      return {
        success: false,
        error: data.error || "Invalid credentials. Access denied.",
        locked: data.locked === true,
      };
    }

    return { success: true, admin: data.admin };
  } catch {
    return { success: false, error: "Network error. Check your connection." };
  }
}

// ── 2. SESSION VERIFY ───────────────────────────────────────────
// Called on every protected page load. Reads httpOnly cookie server-side.
// A console-injected sessionStorage value cannot pass this check.
export async function verifyAdminSession(): Promise<SessionResult> {
  try {
    const res = await fetch("/api/admin/session", {
      method: "GET",
      credentials: "include",
      cache: "no-store",
    });

    if (res.status === 401) {
      return { valid: false, error: "Session expired or invalid." };
    }

    if (!res.ok) {
      return { valid: false, error: "Session check failed." };
    }

    const data = await res.json();
    return data.valid
      ? { valid: true, admin: data.admin }
      : { valid: false, error: data.error || "Unauthorised." };
  } catch {
    return { valid: false, error: "Network error during session check." };
  }
}

// ── 3. LOGOUT ───────────────────────────────────────────────────
// Server invalidates DB session + clears httpOnly cookie.
export async function adminLogout(): Promise<void> {
  try {
    await fetch("/api/admin/logout", {
      method: "POST",
      credentials: "include",
    });
  } finally {
    clearAllStorage();
    window.location.replace("/iec-portal-2026");
  }
}

// ── 4. CLEAR LEGACY STORAGE ─────────────────────────────────────
// Wipes every storage key the old (insecure) implementation used.
export function clearAllStorage(): void {
  if (typeof window === "undefined") return;

  const legacyKeys = [
    "iec_admin",
    "iec_token",
    "iec_email",
    "admin_session",
    "admin_token",
    "adminUser",
    "iec_admin_session",
    "admin_user",
    "admin_role",
  ];

  legacyKeys.forEach((key) => {
    try { sessionStorage.removeItem(key); } catch {}
    try { localStorage.removeItem(key); } catch {}
  });
}

// ── 5. CONSOLE INJECTION DETECTOR ───────────────────────────────
// Detects if a hacker has placed auth data in storage manually.
// Returns the suspicious value found (truthy) or null.
export function detectConsoleInjection(): string | null {
  if (typeof window === "undefined") return null;

  const watchKeys = [
    "iec_admin",
    "iec_token",
    "iec_email",
    "admin_session",
    "admin_token",
    "adminUser",
    "iec_admin_session",
  ];

  for (const key of watchKeys) {
    let val: string | null = null;
    try { val = sessionStorage.getItem(key); } catch {}
    if (!val) {
      try { val = localStorage.getItem(key); } catch {}
    }
    if (val) {
      // Wipe it immediately
      try { sessionStorage.removeItem(key); } catch {}
      try { localStorage.removeItem(key); } catch {}
      return key; // return which key was suspicious
    }
  }

  return null;
}

// ── 6. SECURITY MONITORING ──────────────────────────────────────
// Watches storage for injection attempts while admin is logged in.
let monitorInterval: ReturnType<typeof setInterval> | null = null;

export function initSecurityMonitoring(): void {
  if (typeof window === "undefined") return;
  if (monitorInterval) return; // already running

  monitorInterval = setInterval(() => {
    const found = detectConsoleInjection();
    if (found) {
      console.error(`[IEC SECURITY] Injection attempt cleared: ${found}`);
    }
  }, 3000); // check every 3 seconds
}

export function stopSecurityMonitoring(): void {
  if (monitorInterval) {
    clearInterval(monitorInterval);
    monitorInterval = null;
  }
}

// ── 7. SESSION TIMER ────────────────────────────────────────────
// Auto-logout after 2 hours of inactivity.
export const sessionManager = {
  timer: null as ReturnType<typeof setTimeout> | null,
  TIMEOUT_MS: 2 * 60 * 60 * 1000, // 2 hours

  startSessionTimer() {
    this.resetTimer();
    ["click", "keydown", "mousemove", "touchstart"].forEach((evt) => {
      window.addEventListener(evt, () => this.resetTimer(), { passive: true });
    });
  },

  resetTimer() {
    if (this.timer) clearTimeout(this.timer);
    this.timer = setTimeout(async () => {
      await adminLogout();
    }, this.TIMEOUT_MS);
  },

  clearTimer() {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
  },
};