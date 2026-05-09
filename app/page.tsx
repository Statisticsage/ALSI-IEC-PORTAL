import Link from "next/link";

const timeline = [
  { date: "May 8, 2026",       title: "Official Election Announcement" },
  { date: "May 9 – May 18",    title: "Candidate, Voter & Party Registration" },
  { date: "May 10 – May 20",   title: "Verification & Screening" },
  { date: "May 19",            title: "Provisional Voter List Published" },
  { date: "May 21",            title: "Final Approved Candidate List" },
  { date: "May 22 – May 28",   title: "Official Campaign Period" },
  { date: "May 30",            title: "VOTING DAY" },
  { date: "May 31",            title: "Official Results Declaration" },
];

const services = [
  {
    title: "Candidate Registration",
    description: "Submit official candidacy applications, upload verification documents, and complete IEC eligibility screening.",
    href: "/register/candidate",
  },
  {
    title: "Voter Registration",
    description: "Verify voter eligibility and register securely for participation in the ALSI 2026/2027 General Election.",
    href: "/register/voters",
  },
  {
    title: "Political Party Registration",
    description: "Register political parties, upload required documents, and submit official details for IEC review.",
    href: "/register/party",
  },
];

export default function HomePage() {
  return (
    <main className="min-h-screen bg-slate-50">

      {/* HERO */}
      <section className="relative overflow-hidden border-b border-slate-200 bg-white">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,#dbeafe,transparent_35%)]" />
        <div className="relative mx-auto max-w-7xl px-6 py-24">
          <div className="max-w-4xl">
            <div className="inline-flex items-center rounded-full border border-blue-200 bg-blue-50 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-[#153E75]">
              Independent Elections Commission (IEC) — ALSI 2026/2027
            </div>
            <h1 className="mt-8 text-5xl font-bold leading-tight tracking-tight text-[#0B1F3A] md:text-6xl">
              Official Election Registration Portal
            </h1>
            <p className="mt-8 max-w-3xl text-lg leading-8 text-slate-600">
              Official digital election infrastructure for candidate registration, political party submissions,
              voter verification, compliance screening, and election administration under the
              Association of Liberian Students in India (ALSI).
            </p>
            <div className="mt-6 inline-flex items-center rounded-xl border border-green-200 bg-green-50 px-5 py-3">
              <span className="mr-2 h-2 w-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-sm font-semibold text-green-700">Registration Open — Closes May 18, 2026</span>
            </div>
            <div className="mt-8 flex flex-wrap gap-4">
              <Link href="/register/candidate"
                className="inline-flex items-center justify-center rounded-xl bg-[#0B1F3A] px-7 py-4 text-sm font-semibold text-white transition hover:bg-[#153E75]">
                Register as Candidate
              </Link>
              <Link href="/register/voters"
                className="inline-flex items-center justify-center rounded-xl border border-[#0B1F3A] bg-white px-7 py-4 text-sm font-semibold text-[#0B1F3A] transition hover:bg-slate-100">
                Register as Voter
              </Link>
              <Link href="/status"
                className="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-7 py-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-100">
                Check Application Status
              </Link>
            </div>
            <div className="mt-14 grid gap-6 md:grid-cols-3">
              {[
                { val: "3", label: "Registration Categories" },
                { val: "Secure", label: "Document Verification System" },
                { val: "24/7", label: "Digital Submission Access" },
              ].map(s => (
                <div key={s.label} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                  <p className="text-3xl font-bold text-[#0B1F3A]">{s.val}</p>
                  <p className="mt-2 text-sm text-slate-600">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* SERVICES */}
      <section className="border-b border-slate-200 bg-slate-50">
        <div className="mx-auto max-w-7xl px-6 py-20">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#153E75]">Election Services</p>
            <h2 className="mt-4 text-4xl font-bold tracking-tight text-[#0B1F3A]">Official IEC Registration Modules</h2>
            <p className="mt-6 text-lg leading-8 text-slate-600">
              Access all official election registration services through the centralized IEC digital platform.
              Registration closes <strong>May 18, 2026</strong>.
            </p>
          </div>
          <div className="mt-14 grid gap-8 lg:grid-cols-3">
            {services.map(s => (
              <div key={s.title} className="flex flex-col rounded-3xl border border-slate-200 bg-white p-8 shadow-sm transition hover:-translate-y-1 hover:shadow-md">
                <h3 className="text-2xl font-bold text-[#0B1F3A]">{s.title}</h3>
                <p className="mt-5 flex-1 text-sm leading-7 text-slate-600">{s.description}</p>
                <Link href={s.href}
                  className="mt-8 inline-flex items-center justify-center rounded-xl bg-[#0B1F3A] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#153E75]">
                  Register Now →
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* TIMELINE */}
      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-6 py-20">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#153E75]">Election Timeline</p>
            <h2 className="mt-4 text-4xl font-bold tracking-tight text-[#0B1F3A]">2026/2027 ALSI General Election Schedule</h2>
            <p className="mt-4 text-sm text-slate-500">Ref: IEC/ANN/2026-001 — All dates are mandatory. Late submissions will not be accepted.</p>
          </div>
          <div className="mt-14 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {timeline.map((item, i) => (
              <div key={item.title} className={`rounded-2xl border p-6 ${item.title === "VOTING DAY" ? "border-[#0B1F3A] bg-[#0B1F3A] text-white" : "border-slate-200 bg-slate-50"}`}>
                <p className={`text-xs font-semibold uppercase tracking-wide ${item.title === "VOTING DAY" ? "text-blue-300" : "text-[#153E75]"}`}>
                  {String(i + 1).padStart(2, "0")} — {item.date}
                </p>
                <h3 className={`mt-4 text-base font-bold ${item.title === "VOTING DAY" ? "text-white" : "text-[#0B1F3A]"}`}>
                  {item.title}
                </h3>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* NOTICE */}
      <section className="bg-slate-50">
        <div className="mx-auto max-w-7xl px-6 py-20">
          <div className="rounded-3xl border border-amber-200 bg-amber-50 p-10">
            <div className="max-w-4xl">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-700">Official IEC Notice — Ref: IEC/ANN/2026-001</p>
              <h2 className="mt-4 text-3xl font-bold tracking-tight text-[#0B1F3A]">Compliance & Verification Requirements</h2>
              <p className="mt-6 text-lg leading-8 text-slate-700">
                All applicants must provide valid and accurate information during registration.
                Fraudulent submissions, fake payment confirmations, duplicate applications, or falsified documents
                may result in immediate disqualification and further IEC action under the Electoral Compliance Framework
                (Ref: IEC/CPF/2026-003).
              </p>
              <div className="mt-6 text-sm text-slate-600">
                <p>📧 Official IEC Email: <strong>alsiiec048@gmail.com</strong></p>
                <p className="mt-1">🌐 Portal: <strong>https://iec.alsi-election-org.workers.dev</strong></p>
              </div>
              <div className="mt-8 flex flex-wrap gap-4">
                <Link href="/register/candidate"
                  className="rounded-xl bg-[#0B1F3A] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#153E75]">
                  Candidate Registration
                </Link>
                <Link href="/register/voters"
                  className="rounded-xl border border-[#0B1F3A] bg-white px-6 py-3 text-sm font-semibold text-[#0B1F3A] transition hover:bg-slate-100">
                  Voter Registration
                </Link>
                <Link href="/status"
                  className="rounded-xl border border-slate-300 bg-white px-6 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100">
                  Track Application
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

    </main>
  );
}