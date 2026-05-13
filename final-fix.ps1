# ============================================================
# FINAL FIX - Paste this entire block into PowerShell
# Run from D:\iec-election-portal\
# ============================================================

Set-Location "D:\iec-election-portal"
Write-Host "Applying final fixes..." -ForegroundColor Cyan

# ── Fix 1: Update login route to pass IP to verify_admin_password ──
# The DB function has 3rd param input_ip — we must pass a real IP
# 'unknown' was failing the IP format constraint

@'
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

const supabaseAnon = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
);

function getClientIp(req: NextRequest): string | null {
  const fwd = req.headers.get('x-forwarded-for');
  if (fwd) {
    const ip = fwd.split(',')[0].trim();
    if (/^[0-9a-fA-F.:]{1,45}$/.test(ip)) return ip;
  }
  const real = req.headers.get('x-real-ip');
  if (real && /^[0-9a-fA-F.:]{1,45}$/.test(real)) return real;
  return null; // null is safe — DB function handles NULL gracefully
}

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  let email = '';

  try {
    const body     = await req.json();
    email          = (body.email    || '').toLowerCase().trim();
    const password = (body.password || '') as string;

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: 'Email and password are required.' },
        { status: 400 }
      );
    }

    // Rate limit check
    const { data: failCount } = await supabaseAnon.rpc('count_failed_attempts', {
      input_email: email,
      input_ip:    ip ?? '0.0.0.0',
    });
    if (typeof failCount === 'number' && failCount >= 5) {
      return NextResponse.json(
        { success: false, error: 'Too many failed attempts. Access suspended for 30 minutes.', locked: true },
        { status: 429 }
      );
    }

    // Verify password — pass IP so DB can log it correctly
    const { data: authResult, error: authError } = await supabaseAnon.rpc(
      'verify_admin_password',
      {
        input_email:    email,
        input_password: password,
        input_ip:       ip ?? null,
      }
    );

    if (authError || !authResult?.valid) {
      return NextResponse.json(
        { success: false, error: 'Invalid email or password.' },
        { status: 401 }
      );
    }

    // Create session via SERVICE ROLE only
    const { data: sessionResult, error: sessionError } = await supabaseAdmin.rpc(
      'create_admin_session',
      {
        p_admin_id:    authResult.id,
        p_admin_email: authResult.email,
        p_admin_role:  authResult.role,
        p_ip_address:  ip ?? null,
      }
    );

    if (sessionError || !sessionResult?.success) {
      console.error('[login] create_admin_session failed:', sessionError, sessionResult);
      return NextResponse.json(
        { success: false, error: 'Session creation failed. Please try again.' },
        { status: 500 }
      );
    }

    // httpOnly cookie — cannot be read or injected via browser console
    const cookieStore = await cookies();
    cookieStore.set('iec_admin_token', sessionResult.token, {
      httpOnly: true,
      secure:   process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path:     '/admin',
      maxAge:   60 * 60 * 8,
    });
    cookieStore.set('iec_admin_email', authResult.email, {
      httpOnly: true,
      secure:   process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path:     '/admin',
      maxAge:   60 * 60 * 8,
    });

    return NextResponse.json({
      success: true,
      admin: {
        id:          authResult.id,
        email:       authResult.email,
        full_name:   authResult.full_name,
        role:        authResult.role,
        permissions: authResult.permissions,
      },
    });

  } catch (err) {
    console.error('[login] Unexpected error:', err);
    return NextResponse.json(
      { success: false, error: 'An unexpected error occurred.' },
      { status: 500 }
    );
  }
}
'@ | Set-Content "app\api\admin\login\route.ts" -Encoding UTF8
Write-Host "  [WRITTEN] app\api\admin\login\route.ts (IP handling fixed)" -ForegroundColor Green

# ── Fix 2: Rename middleware.ts → proxy.ts (Next.js 16 canary requirement) ──
$middlewareContent = @'
import { NextRequest, NextResponse } from 'next/server';

export const config = {
  matcher: ['/admin/:path*'],
};

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (pathname === '/admin/login') {
    return NextResponse.next();
  }

  const token = req.cookies.get('iec_admin_token')?.value;
  const email = req.cookies.get('iec_admin_email')?.value;

  if (!token || !email) {
    return NextResponse.redirect(new URL('/admin/login', req.url));
  }

  if (!/^[a-f0-9]{64}$/.test(token)) {
    const res = NextResponse.redirect(new URL('/admin/login', req.url));
    res.cookies.set('iec_admin_token', '', { maxAge: 0, path: '/admin' });
    res.cookies.set('iec_admin_email', '', { maxAge: 0, path: '/admin' });
    return res;
  }

  try {
    const verifyUrl = new URL('/api/admin/session', req.url);
    const verifyRes = await fetch(verifyUrl.toString(), {
      headers: { cookie: req.headers.get('cookie') || '' },
    });

    if (!verifyRes.ok) {
      const res = NextResponse.redirect(new URL('/admin/login', req.url));
      res.cookies.set('iec_admin_token', '', { maxAge: 0, path: '/admin' });
      res.cookies.set('iec_admin_email', '', { maxAge: 0, path: '/admin' });
      return res;
    }

    const data = await verifyRes.json();
    const headers = new Headers(req.headers);
    headers.set('x-admin-id',    data.admin?.id         || '');
    headers.set('x-admin-email', data.admin?.email      || '');
    headers.set('x-admin-role',  data.admin?.role       || '');
    headers.set('x-admin-name',  data.admin?.full_name  || '');

    return NextResponse.next({ request: { headers } });
  } catch {
    return NextResponse.redirect(new URL('/admin/login', req.url));
  }
}
'@

# Write as proxy.ts (Next.js 16 canary convention)
$middlewareContent | Set-Content "proxy.ts" -Encoding UTF8
Write-Host "  [WRITTEN] proxy.ts (Next.js 16 canary middleware)" -ForegroundColor Green

# Keep middleware.ts too in case Next.js version gets pinned back
$middlewareContent | Set-Content "middleware.ts" -Encoding UTF8
Write-Host "  [WRITTEN] middleware.ts (kept for compatibility)" -ForegroundColor Green

# ── Kill old server and restart clean ──────────────────────────
Write-Host ""
Write-Host "Killing old server and restarting..." -ForegroundColor Cyan
Get-Process -Name "node" -ErrorAction SilentlyContinue | ForEach-Object {
  $cmd = (Get-CimInstance Win32_Process -Filter "ProcessId=$($_.Id)" -ErrorAction SilentlyContinue).CommandLine
  if ($cmd -like "*next*") {
    Stop-Process -Id $_.Id -Force -ErrorAction SilentlyContinue
  }
}
Start-Sleep -Seconds 2
Remove-Item -Recurse -Force ".next" -ErrorAction SilentlyContinue

Write-Host ""
Write-Host "============================================" -ForegroundColor Green
Write-Host "  All fixes applied. Starting server..." -ForegroundColor Green
Write-Host "  Login: http://localhost:3000/admin/login" -ForegroundColor White
Write-Host "  Email   : jameshbaysah013@gmail.com" -ForegroundColor White
Write-Host "  Password: IEC/ALSI@2026" -ForegroundColor White
Write-Host "============================================" -ForegroundColor Green
Write-Host ""

npm run dev
