"use client";

// World-class government-level security implementation
// IEC Admin Portal - Secure Authentication Library
// NO direct Supabase calls from client-side - all via secure API routes

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

// Call /api/admin/login - never calls Supabase directly from browser
export async function adminLogin(
  email: string,
  password: string
): Promise<LoginResult> {
  try {
    const res = await fetch('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      return { success: false, error: data.error || 'Login failed.', locked: data.locked };
    }
    return { success: true, admin: data.admin };
  } catch {
    return { success: false, error: 'Network error. Check your connection.' };
  }
}

// Verify session from server (reads httpOnly cookie server-side)
export async function verifyAdminSession(): Promise<SessionResult> {
  try {
    const res = await fetch('/api/admin/session', {
      method: 'GET',
      credentials: 'include',
    });
    if (res.status === 401) {
      return { valid: false, error: 'Session expired.' };
    }
    const data = await res.json();
    return data.valid
      ? { valid: true, admin: data.admin }
      : { valid: false, error: data.error };
  } catch {
    return { valid: false, error: 'Session check failed.' };
  }
}

// Logout - clears cookie and invalidates DB session
export async function adminLogout(): Promise<void> {
  try {
    await fetch('/api/admin/logout', { method: 'POST', credentials: 'include' });
  } finally {
    window.location.href = '/iec-portal-2026';
  }
}

// Remove any legacy sessionStorage/localStorage keys from old implementation
export function clearLegacyStorage(): void {
  if (typeof window === 'undefined') return;
  ['iec_admin', 'admin_session', 'admin_token', 'adminUser', 'iec_admin_session', 'iec_token', 'iec_email'].forEach(k => {
    try { sessionStorage.removeItem(k); } catch {}
    try { localStorage.removeItem(k); } catch {}
  });
}

// Security: Check for console injection attempts
export function detectConsoleInjection(): boolean {
  if (typeof window === 'undefined') return false;
  
  const suspiciousKeys = ['iec_admin', 'admin_session', 'admin_token', 'iec_token'];
  let injectionDetected = false;
  
  suspiciousKeys.forEach(key => {
    try {
      const sessionValue = sessionStorage.getItem(key);
      const localValue = localStorage.getItem(key);
      
      // If any auth data exists in storage, it's suspicious
      if (sessionValue || localValue) {
        injectionDetected = true;
        // Clear suspicious data
        sessionStorage.removeItem(key);
        localStorage.removeItem(key);
      }
    } catch {}
  });
  
  return injectionDetected;
}

