// SAVE AS: app/register/candidate/page.tsx
// Replaces the wrong admin page that was accidentally placed here

import CandidateRegistrationForm from "@/components/forms/CandidateRegistrationForm";

export const metadata = {
  title: "Candidate Registration — IEC ALSI 2026",
  description: "Official candidacy registration for the 2026/2027 ALSI General Election.",
};

export default function CandidateRegistrationPage() {
  return (
    <main className="min-h-screen bg-slate-50 py-12">
      <div className="mx-auto max-w-6xl px-6">
        <div className="mb-10">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#0B1F3A]">
            IEC Candidate Portal
          </p>
          <h1 className="mt-3 text-4xl font-bold tracking-tight text-[#0B1F3A]">
            Candidate Registration
          </h1>
          <p className="mt-4 max-w-3xl text-lg leading-8 text-slate-600">
            Official candidacy submission portal for the 2026 ALSI General Election
            under the Independent Elections Commission (IEC).
          </p>
        </div>
        <CandidateRegistrationForm />
      </div>
    </main>
  );
}