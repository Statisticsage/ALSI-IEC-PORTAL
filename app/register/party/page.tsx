import PartyRegistrationForm from "@/components/forms/PartyRegistrationForm";

export default function PartyRegistrationPage() {
  return (
    <main className="min-h-screen bg-slate-50 py-12">
      <div className="mx-auto max-w-4xl px-6">
        <div className="mb-10">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#153E75]">
            IEC Political Party Portal
          </p>
          <h1 className="mt-3 text-4xl font-bold tracking-tight text-[#0B1F3A]">
            Political Party Registration
          </h1>
          <p className="mt-4 max-w-3xl text-lg leading-8 text-slate-600">
            Official registration portal for political parties participating in the
            2026/2027 ALSI General Election supervised by the Independent Elections Commission.
          </p>
        </div>

        {/* COMPLIANCE NOTICE */}
        <div className="mb-8 rounded-2xl border border-blue-200 bg-blue-50 p-5">
          <p className="text-sm font-semibold text-[#0B1F3A]">IEC Compliance Requirements</p>
          <ul className="mt-3 grid gap-1 text-sm text-slate-700 md:grid-cols-2">
            <li>✓ Party name must be unique and not duplicate any existing party</li>
            <li>✓ Registration fee of INR 2,200 must be paid before submission</li>
            <li>✓ Party symbol must be original and not infringe on any copyright</li>
            <li>✓ Leadership names must match official identification documents</li>
            <li>✓ Only approved parties may field candidates or campaign</li>
            <li>✓ IEC review and approval is mandatory before participation</li>
          </ul>
        </div>

        <PartyRegistrationForm />
      </div>
    </main>
  );
}