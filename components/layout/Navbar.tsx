"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_LINKS = [
  { label: "Home", href: "/" },
  { label: "Candidate Registration", href: "/register/candidate" },
  { label: "Voter Registration", href: "/register/voters" },
  { label: "Party Registration", href: "/register/party" },
  { label: "Check Status", href: "/status" },
];

export default function Navbar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const isAdmin = pathname.startsWith("/admin");

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white shadow-sm">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">

        {/* LOGO */}
        <Link href="/" className="flex flex-col leading-tight">
          <span className="text-base font-bold text-[#0B1F3A]">IEC Digital Portal</span>
          <span className="text-xs text-slate-500">Independent Elections Commission · ALSI 2026</span>
        </Link>

        {/* DESKTOP NAV */}
        <nav className="hidden items-center gap-1 md:flex">
          {NAV_LINKS.map(link => (
            <Link
              key={link.href}
              href={link.href}
              className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
                pathname === link.href
                  ? "bg-[#0B1F3A] text-white"
                  : "text-slate-600 hover:bg-slate-100 hover:text-[#0B1F3A]"
              }`}
            >
              {link.label}
            </Link>
          ))}
          <Link
            href="/admin"
            className={`ml-2 rounded-lg border px-4 py-2 text-sm font-semibold transition ${
              isAdmin
                ? "border-[#0B1F3A] bg-[#0B1F3A] text-white"
                : "border-slate-300 text-slate-700 hover:border-[#0B1F3A] hover:text-[#0B1F3A]"
            }`}
          >
            IEC Admin
          </Link>
        </nav>

        {/* MOBILE HAMBURGER */}
        <button
          onClick={() => setOpen(o => !o)}
          className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 md:hidden"
          aria-label="Toggle menu"
        >
          <svg className="h-5 w-5 text-slate-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            {open
              ? <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              : <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />}
          </svg>
        </button>
      </div>

      {/* MOBILE MENU */}
      {open && (
        <div className="border-t border-slate-200 bg-white px-6 pb-4 md:hidden">
          <nav className="flex flex-col gap-1 pt-3">
            {NAV_LINKS.map(link => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className={`rounded-lg px-4 py-3 text-sm font-medium transition ${
                  pathname === link.href
                    ? "bg-[#0B1F3A] text-white"
                    : "text-slate-700 hover:bg-slate-100"
                }`}
              >
                {link.label}
              </Link>
            ))}
            <Link
              href="/admin"
              onClick={() => setOpen(false)}
              className="mt-2 rounded-lg border border-slate-300 px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-100"
            >
              IEC Admin Dashboard
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}