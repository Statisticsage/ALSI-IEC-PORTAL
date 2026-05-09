import Link from "next/link";

const timeline = [
  {
    date: "May 8",
    title: "Official Election Announcement",
  },
  {
    date: "May 9 – May 12",
    title: "Candidate & Voter Registration",
  },
  {
    date: "May 10 – May 15",
    title: "Verification & Screening",
  },
  {
    date: "May 23",
    title: "Voting Day",
  },
];

const services = [
  {
    title: "Candidate Registration",
    description:
      "Submit official candidacy applications, upload verification documents, and complete IEC eligibility screening.",
  },
  {
    title: "Voter Verification",
    description:
      "Verify voter eligibility and register securely for participation in the ALSI General Election.",
  },
  {
    title: "Political Party Registration",
    description:
      "Register political parties, upload constitutions, and submit official candidate lists for IEC review.",
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
              Independent Elections Commission (IEC)
            </div>

            <h1 className="mt-8 text-5xl font-bold leading-tight tracking-tight text-[#0B1F3A] md:text-6xl">
              ALSI 2026/2027 Election Registration Portal
            </h1>

            <p className="mt-8 max-w-3xl text-lg leading-8 text-slate-600">
              Official digital election infrastructure for
              candidate registration, political party
              submissions, voter verification, compliance
              screening, and election administration under
              the Association of Liberian Students in India
              (ALSI).
            </p>

            <div className="mt-10 flex flex-wrap gap-4">
              <Link
                href="/register"
                className="inline-flex items-center justify-center rounded-xl bg-[#0B1F3A] px-7 py-4 text-sm font-semibold text-white transition hover:bg-[#153E75]"
              >
                Begin Registration
              </Link>

              <Link
                href="/status"
                className="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-7 py-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
              >
                Check Application Status
              </Link>
            </div>

            <div className="mt-14 grid gap-6 md:grid-cols-3">
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <p className="text-3xl font-bold text-[#0B1F3A]">
                  3
                </p>

                <p className="mt-2 text-sm text-slate-600">
                  Registration Categories
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <p className="text-3xl font-bold text-[#0B1F3A]">
                  Secure
                </p>

                <p className="mt-2 text-sm text-slate-600">
                  Document Verification System
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <p className="text-3xl font-bold text-[#0B1F3A]">
                  24/7
                </p>

                <p className="mt-2 text-sm text-slate-600">
                  Digital Submission Access
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SERVICES */}

      <section className="border-b border-slate-200 bg-slate-50">
        <div className="mx-auto max-w-7xl px-6 py-20">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#153E75]">
              Election Services
            </p>

            <h2 className="mt-4 text-4xl font-bold tracking-tight text-[#0B1F3A]">
              Official IEC Registration Modules
            </h2>

            <p className="mt-6 text-lg leading-8 text-slate-600">
              Access all official election registration
              services through the centralized IEC digital
              platform.
            </p>
          </div>

          <div className="mt-14 grid gap-8 lg:grid-cols-3">
            {services.map((service) => (
              <div
                key={service.title}
                className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
              >
                <h3 className="text-2xl font-bold text-[#0B1F3A]">
                  {service.title}
                </h3>

                <p className="mt-5 text-sm leading-7 text-slate-600">
                  {service.description}
                </p>

                <Link
                  href="/register"
                  className="mt-10 inline-flex items-center text-sm font-semibold text-[#153E75]"
                >
                  Access Module →
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
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#153E75]">
              Election Timeline
            </p>

            <h2 className="mt-4 text-4xl font-bold tracking-tight text-[#0B1F3A]">
              2026 ALSI General Election Schedule
            </h2>
          </div>

          <div className="mt-14 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {timeline.map((item) => (
              <div
                key={item.title}
                className="rounded-2xl border border-slate-200 bg-slate-50 p-6"
              >
                <p className="text-sm font-semibold uppercase tracking-wide text-[#153E75]">
                  {item.date}
                </p>

                <h3 className="mt-4 text-lg font-bold text-[#0B1F3A]">
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
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-amber-700">
                Official IEC Notice
              </p>

              <h2 className="mt-4 text-3xl font-bold tracking-tight text-[#0B1F3A]">
                Compliance & Verification Requirements
              </h2>

              <p className="mt-6 text-lg leading-8 text-slate-700">
                All applicants must provide valid and
                accurate information during registration.
                Fraudulent submissions, fake payment
                confirmations, duplicate applications, or
                falsified documents may result in immediate
                disqualification and further IEC action.
              </p>

              <div className="mt-8 flex flex-wrap gap-4">
                <Link
                  href="/register"
                  className="rounded-xl bg-[#0B1F3A] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#153E75]"
                >
                  Proceed to Registration
                </Link>

                <Link
                  href="/status"
                  className="rounded-xl border border-slate-300 bg-white px-6 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
                >
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