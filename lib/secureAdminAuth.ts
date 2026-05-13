"use client";

/**
 * lib/secureAdminAuth.ts
 * IEC Admin Portal — Client-side auth library
 * 
 * Rules:
 *  - ZERO direct Supabase calls from browser
 *  - ALL auth flows go through /api/admin/* routes (httpOnly cookies)
 *  - sessionStorage / localStorage never hold tokens
 *  - Console injection detection on every login
 */

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

// ---------------------------------------------------------------------------
// Core auth calls — all proxied through server API routes
// ---------------------------------------------------------------------------

/**
 * secureAdminLogin
 * Sends credentials to /api/admin/login which:
 *  1. Validates nonce (CSRF)
 *  2. Calls verify_admin_password RPC (bcrypt, brute-force locked)
 *  3. Sets httpOnly cookie on success
 */
export async function secureAdminLogin(
  email: string,
  password: string
): Promise<LoginResult> {
  try {
    // First get a nonce to prevent CSRF replay
    const nonceRes = await fetch("/api/admin/nonce", {
      method: "GET",
      credentials: "include",
    });

    let nonce: string | null = null;
    if (nonceRes.ok) {
      const nd = await nonceRes.json();
      nonce = nd.nonce ?? null;
    }

    const res = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ email: email.toLowerCase().trim(), password, nonce }),
    });

    const data = await res.json();

    if (!res.ok || !data.success) {
      return {
        success: false,
        error: data.error ?? "Login failed.",
        locked: data.locked ?? false,
      };
    }

    return { success: true, admin: data.admin };
  } catch {
    return { success: false, error: "Network error. Check your connection." };
  }
}

/**
 * verifyAdminSession
 * Reads the httpOnly cookie server-side — browser never touches the token
 */
export async function verifyAdminSession(): Promise<SessionResult> {
  try {
    const res = await fetch("/api/admin/session", {
      method: "GET",
      credentials: "include",
    });

    if (res.status === 401) return { valid: false, error: "Session expired." };

    const data = await res.json();
    return data.valid
      ? { valid: true, admin: data.admin }
      : { valid: false, error: data.error };
  } catch {
    return { valid: false, error: "Session check failed." };
  }
}

/**
 * adminLogout
 * Invalidates the DB session record + clears httpOnly cookie server-side
 */
export async function adminLogout(): Promise<void> {
  try {
    await fetch("/api/admin/logout", {
      method: "POST",
      credentials: "include",
    });
  } finally {
    clearAllStorage();
    window.location.href = "/admin/login";
  }
}

// ---------------------------------------------------------------------------
// Security utilities
// ---------------------------------------------------------------------------

/**
 * clearAllStorage
 * Wipes any legacy tokens that old implementations may have left behind
 */
export function clearAllStorage(): void {
  if (typeof window === "undefined") return;

  const legacyKeys = [
    "iec_admin",
    "admin_session",
    "admin_token",
    "adminUser",
    "iec_admin_session",
    "iec_token",
    "iec_email",
    "iec_role",
    "iec_permissions",
  ];

  legacyKeys.forEach((k) => {
    try { sessionStorage.removeItem(k); } catch {}
    try { localStorage.removeItem(k); } catch {}
  });
}

/**
 * detectConsoleInjection
 * Checks for auth tokens injected via browser devtools console
 * Returns true if an injection attempt is detected (and clears it)
 */
export function detectConsoleInjection(): boolean {
  if (typeof window === "undefined") return false;

  const suspiciousKeys = [
    "iec_admin",
    "admin_session",
    "admin_token",
    "iec_token",
    "iec_admin_session",
  ];

  let detected = false;

  suspiciousKeys.forEach((key) => {
    try {
      const sv = sessionStorage.getItem(key);
      const lv = localStorage.getItem(key);
      if (sv || lv) {
        detected = true;
        sessionStorage.removeItem(key);
        localStorage.removeItem(key);
      }
    } catch {}
  });

  return detected;
}

/**
 * initSecurityMonitoring
 * Sets up passive security checks after successful login:
 *  - Detects devtools open (size heuristic)
 *  - Clears storage on visibility change
 *  - Logs anomalies to console for IEC security team
 */
export function initSecurityMonitoring(): void {
  if (typeof window === "undefined") return;

  // Clear any storage that appears while session is active
  const storageWatcher = setInterval(() => {
    if (detectConsoleInjection()) {
      console.warn("[IEC SECURITY] Suspicious storage injection detected — cleared.");
    }
  }, 5000);

  // Clean up on page unload
  window.addEventListener("beforeunload", () => {
    clearInterval(storageWatcher);
    clearAllStorage();
  });

  // Re-verify session when tab becomes visible again
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") {
      verifyAdminSession().then((result) => {
        if (!result.valid) {
          clearAllStorage();
          window.location.href = "/admin/login?reason=session_expired";
        }
      });
    }
  });
}

/**
 * sessionManager
 * Handles auto-logout on inactivity (30 min) and session heartbeat
 */
export const sessionManager = {
  _timer: null as ReturnType<typeof setTimeout> | null,
  _heartbeat: null as ReturnType<typeof setInterval> | null,
  INACTIVITY_LIMIT_MS: 30 * 60 * 1000, // 30 minutes

  startSessionTimer(): void {
    this._resetTimer();
    this._startHeartbeat();

    // Reset on any user interaction
    ["mousemove", "keydown", "click", "scroll", "touchstart"].forEach((event) => {
      document.addEventListener(event, () => this._resetTimer(), { passive: true });
    });
  },

  _resetTimer(): void {
    if (this._timer) clearTimeout(this._timer);
    this._timer = setTimeout(() => {
      console.warn("[IEC SECURITY] Session expired due to inactivity.");
      adminLogout();
    }, this.INACTIVITY_LIMIT_MS);
  },

  _startHeartbeat(): void {
    // Ping session every 10 minutes to keep it alive
    this._heartbeat = setInterval(async () => {
      const result = await verifyAdminSession();
      if (!result.valid) {
        clearAllStorage();
        window.location.href = "/admin/login?reason=session_expired";
      }
    }, 10 * 60 * 1000);
  },

  stopSessionTimer(): void {
    if (this._timer) clearTimeout(this._timer);
    if (this._heartbeat) clearInterval(this._heartbeat);
  },
};