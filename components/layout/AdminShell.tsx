"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAdmin, roleLabel } from "@/lib/useAdmin";

const NAV = [
  { label: "Dashboard", href: "/admin/dashboard", icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" },
  { label: "Candidates", href: "/admin/candidates", icon: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" },
  { label: "Voters", href: "/admin/voters", icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" },
  { label: "Political Parties", href: "/admin/parties", icon: "M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" },
  { label: "Export Center", href: "/admin/export", icon: "M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" },
  { label: "Audit Logs", href: "/admin/audit", icon: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" },
];

export default function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { admin, loading, logout } = useAdmin();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#0B1F3A] border-t-transparent" />
      </div>
    );
  }

  if (!admin) return null;

  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* SIDEBAR */}
      <aside className="hidden w-64 shrink-0 flex-col border-r border-slate-200 bg-white lg:flex">
        {/* BRAND */}
        <div className="border-b border-slate-200 px-6 py-5">
          <p className="text-sm font-bold text-[#0B1F3A]">IEC Admin Portal</p>
          <p className="text-xs text-slate-500">ALSI General Election 2026</p>
        </div>

        {/* NAV */}
        <nav className="flex-1 overflow-y-auto px-3 py-4">
          {NAV.map(item => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`mb-1 flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium transition ${
                  active
                    ? "bg-[#0B1F3A] text-white"
                    : "text-slate-600 hover:bg-slate-100 hover:text-[#0B1F3A]"
                }`}
              >
                <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d={item.icon} />
                </svg>
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* USER */}
        <div className="border-t border-slate-200 px-4 py-4">
          <div className="mb-3 rounded-xl bg-slate-50 px-4 py-3">
            <p className="text-sm font-semibold text-[#0B1F3A] truncate">{admin.full_name}</p>
            <p className="text-xs text-slate-500">{roleLabel(admin.role)}</p>
          </div>
          <button
            onClick={logout}
            className="w-full rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600"
          >
            Sign Out
          </button>
        </div>
      </aside>

      {/* MAIN */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* TOPBAR */}
        <header className="border-b border-slate-200 bg-white px-6 py-4 lg:hidden">
          <div className="flex items-center justify-between">
            <p className="text-sm font-bold text-[#0B1F3A]">IEC Admin Portal</p>
            <button onClick={logout} className="text-xs font-medium text-red-600">Sign Out</button>
          </div>
          {/* Mobile nav */}
          <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
            {NAV.map(item => (
              <Link
                key={item.href}
                href={item.href}
                className={`shrink-0 rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                  pathname === item.href
                    ? "bg-[#0B1F3A] text-white"
                    : "bg-slate-100 text-slate-600"
                }`}
              >
                {item.label}
              </Link>
            ))}
          </div>
        </header>

        {/* PAGE CONTENT */}
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}