import { NextRequest, NextResponse } from 'next/server';

export const config = {
  matcher: ['/admin/:path*', '/iec-portal-2026/admin/:path*'],
};

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (pathname.endsWith('/admin/login') || pathname === '/admin/login') {
    return NextResponse.next();
  }

  const token = req.cookies.get('iec_admin_token')?.value;
  const email = req.cookies.get('iec_admin_email')?.value;

  if (!token || !email) {
    return NextResponse.redirect(new URL('/admin/login', req.url));
  }

  if (!/^[a-f0-9]{64}$/.test(token)) {
    const res = NextResponse.redirect(new URL('/admin/login', req.url));
    res.cookies.delete('iec_admin_token');
    res.cookies.delete('iec_admin_email');
    return res;
  }

  try {
    const verifyRes = await fetch(new URL('/api/admin/session', req.url).toString(), {
      headers: { cookie: req.headers.get('cookie') || '' },
    });

    if (!verifyRes.ok) {
      const res = NextResponse.redirect(new URL('/admin/login', req.url));
      res.cookies.delete('iec_admin_token');
      res.cookies.delete('iec_admin_email');
      return res;
    }

    const data = await verifyRes.json();
    const headers = new Headers(req.headers);
    headers.set('x-admin-id',    data.admin?.id        || '');
    headers.set('x-admin-email', data.admin?.email     || '');
    headers.set('x-admin-role',  data.admin?.role      || '');
    headers.set('x-admin-name',  data.admin?.full_name || '');
    return NextResponse.next({ request: { headers } });

  } catch {
    return NextResponse.redirect(new URL('/admin/login', req.url));
  }
}
