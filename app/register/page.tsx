import Link from "next/link";

const registrationModules = [
  {
    title: "Candidate Registration",
    description: "Submit official candidacy applications for elective positions in the 2026 ALSI General Election.",
    href: "/register/candidate",
    status: "Open",
    badgeColor: "border-green-200 bg-green-50 text-green-700",
  },
  {
    title: "Voter Registration",
    description: "Verify voter eligibility and register for participation in the 2026 ALSI General Election.",
    href: "/register/voter",
    status: "Open",
    badgeColor: "border-green-200 bg-green-50 text-green-700",
  },
  {
    title: "Political Party Registration",
    description: "Register political parties, upload constitutions, and submit official party documentation for IEC approval.",
    href: "/register/party",
    status: "Open",
    badgeColor: "border-green-200 bg-green-50 text-green-700",
  },
];

export default function RegisterPage() {
  return (
    <main className="min-h-screen bg-slate-50">

      {/* HERO */}
      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-6 py-20">
          <div className="max-w-4xl">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#0B1F3A]">
              IEC Registration Portal
            </p>
            <h1 className="mt-5 text-5xl font-bold tracking-tight text-[#0B1F3A]">
              Election Registration Center
            </h1>
            <p className="mt-6 text-lg leading-8 text-slate-600">
              Official digital registration gateway for candidates, voters, and political parties
              participating in the 2026 ALSI General Election supervised by the Independent Elections Commission (IEC).
            </p>
            <div className="mt-10 flex flex-wrap gap-4">
              <Link href="/status" className="rounded-xl border border-slate-300 bg-white px-6 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100">
                Check Application Status
              </Link>
              <Link href="/" className="rounded-xl bg-[#0B1F3A] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#153E75]">
                Return Home
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* REGISTRATION MODULES */}
      <section className="mx-auto max-w-7xl px-6 py-20">
        <div className="mb-12">
          <h2 className="text-3xl font-bold tracking-tight text-[#0B1F3A]">Registration Modules</h2>
          <p className="mt-4 max-w-3xl text-base leading-7 text-slate-600">
            Select the appropriate registration category below to begin your official IEC election application process.
          </p>
        </div>
        <div className="grid gap-8 lg:grid-cols-3">
          {registrationModules.map(module => (
            <div key={module.title} className="group flex flex-col justify-between rounded-3xl border border-slate-200 bg-white p-8 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-lg">
              <div>
                <div className={`inline-flex rounded-full border px-4 py-1 text-xs font-semibold uppercase tracking-wide ${module.badgeColor}`}>
                  {module.status}
                </div>
                <h3 className="mt-6 text-2xl font-bold text-[#0B1F3A]">{module.title}</h3>
                <p className="mt-4 text-sm leading-7 text-slate-600">{module.description}</p>
              </div>
              <Link href={module.href} className="mt-10 inline-flex items-center justify-center rounded-xl bg-[#0B1F3A] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#153E75]">
                Continue Registration
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* IMPORTANT NOTICE */}
      <section className="pb-20">
        <div className="mx-auto max-w-7xl px-6">
          <div className="rounded-3xl border border-slate-200 bg-white p-10 shadow-sm">
            <div className="max-w-3xl">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#0B1F3A]">Official IEC Notice</p>
              <h2 className="mt-4 text-3xl font-bold tracking-tight text-[#0B1F3A]">Registration Compliance & Verification Policy</h2>
              <p className="mt-5 text-base leading-7 text-slate-600">
                All election applications are subject to IEC verification, document review, and compliance screening before approval.
              </p>
            </div>
            <div className="mt-10 grid gap-6 md:grid-cols-2">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6">
                <h3 className="text-sm font-semibold uppercase tracking-wide text-[#0B1F3A]">Document Requirements</h3>
                <ul className="mt-5 space-y-3 text-sm leading-6 text-slate-600">
                  <li>• PDF, PNG, or JPG formats accepted</li>
                  <li>• Maximum upload size: 20MB per document</li>
                  <li>• Blurry or incomplete documents may result in rejection</li>
                  <li>• Duplicate submissions are prohibited</li>
                  <li>• Fraudulent submissions may lead to permanent disqualification</li>
                </ul>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6">
                <h3 className="text-sm font-semibold uppercase tracking-wide text-[#0B1F3A]">IEC Verification Workflow</h3>
                <ul className="mt-5 space-y-3 text-sm leading-6 text-slate-600">
                  <li>• Submission received</li>
                  <li>• IEC compliance review</li>
                  <li>• Eligibility validation</li>
                  <li>• Approval or correction request</li>
                  <li>• Final election clearance</li>
                </ul>
              </div>
            </div>
            <div className="mt-10 rounded-2xl border border-amber-200 bg-amber-50 p-5">
              <p className="text-sm leading-6 text-amber-800">
                IEC reserves the right to request additional verification documents or reject submissions that do not satisfy electoral requirements and compliance regulations.
              </p>
            </div>
          </div>
        </div>
      </section>

    </main>
  );
}