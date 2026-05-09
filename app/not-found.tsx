import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-6 text-center">
      <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#153E75]">404 — Page Not Found</p>
      <h1 className="mt-4 text-5xl font-bold text-[#0B1F3A]">Page Not Found</h1>
      <p className="mt-6 max-w-md text-lg text-slate-500">
        The page you are looking for does not exist or has been moved.
      </p>
      <div className="mt-10 flex gap-4">
        <Link href="/" className="rounded-xl bg-[#0B1F3A] px-6 py-3 text-sm font-semibold text-white hover:bg-[#153E75]">
          Return to Homepage
        </Link>
        <Link href="/status" className="rounded-xl border border-slate-300 px-6 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-100">
          Check Application Status
        </Link>
      </div>
    </main>
  );
}