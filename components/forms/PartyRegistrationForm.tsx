"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { PARTY_FEE } from "@/lib/constants";
import FileUploadField from "./FileUploadField";
import { PartyFormData } from "@/types";

const INITIAL: PartyFormData = {
  party_name: "", acronym: "", motto: "",
  chairperson_name: "", secretary_general_name: "",
  contact_email: "", whatsapp: "", description: "",
  symbol_url: "", payment_proof_url: "",
};

export default function PartyRegistrationForm() {
  const [form, setForm] = useState<PartyFormData>(INITIAL);
  const [msg, setMsg] = useState<{ type: "error" | "success"; text: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function set(field: keyof PartyFormData, value: string) {
    setForm(p => ({ ...p, [field]: value }));
  }

  function validate(): string | null {
    if (!form.symbol_url) return "Party symbol/logo upload is required.";
    if (!form.payment_proof_url) return "Payment proof upload is required.";
    if (form.acronym.length > 10) return "Acronym must not exceed 10 characters.";
    return null;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);

    const err = validate();
    if (err) { setMsg({ type: "error", text: err }); return; }

    try {
      setSubmitting(true);
      const { error } = await supabase.from("political_parties").insert([{
        ...form,
        status: "pending",
      }]);

      if (error) {
        if (error.message.includes("party_name"))
          return setMsg({ type: "error", text: "A party with this name is already registered." });
        if (error.message.includes("contact_email"))
          return setMsg({ type: "error", text: "This email address is already registered." });
        return setMsg({ type: "error", text: "Submission failed. Please try again." });
      }

      setMsg({ type: "success", text: "Political party registration submitted successfully. The IEC will review and notify your party via email." });
      setForm(INITIAL);
    } catch {
      setMsg({ type: "error", text: "Unexpected system error. Please try again." });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-8">

      {/* SECTION 1: PARTY IDENTITY */}
      <Section title="Party Identity" subtitle="Official party name, acronym and motto as it will appear on the ballot.">
        <div className="grid gap-6 md:grid-cols-2">
          <Field label="Official Party Name" required>
            <input value={form.party_name} onChange={e => set("party_name", e.target.value)} required className={inp} placeholder="e.g. Alliance for Student Progress" />
          </Field>
          <Field label="Party Acronym" required>
            <input value={form.acronym} onChange={e => set("acronym", e.target.value.toUpperCase())} required maxLength={10} className={inp} placeholder="e.g. ASP" />
          </Field>
          <Field label="Party Motto" className="md:col-span-2">
            <input value={form.motto} onChange={e => set("motto", e.target.value)} className={inp} placeholder="e.g. Unity, Progress, Excellence" />
          </Field>
          <Field label="Party Description" className="md:col-span-2">
            <textarea value={form.description} onChange={e => set("description", e.target.value)} rows={3} className={inp} placeholder="Brief description of the party's vision and objectives..." />
          </Field>
        </div>
      </Section>

      {/* SECTION 2: PARTY LEADERSHIP */}
      <Section title="Party Leadership" subtitle="Names of the party's registered executive leadership.">
        <div className="grid gap-6 md:grid-cols-2">
          <Field label="Chairperson Full Name" required>
            <input value={form.chairperson_name} onChange={e => set("chairperson_name", e.target.value)} required className={inp} />
          </Field>
          <Field label="Secretary General Full Name" required>
            <input value={form.secretary_general_name} onChange={e => set("secretary_general_name", e.target.value)} required className={inp} />
          </Field>
        </div>
      </Section>

      {/* SECTION 3: CONTACT */}
      <Section title="Contact Information" subtitle="Official party contact details for IEC correspondence.">
        <div className="grid gap-6 md:grid-cols-2">
          <Field label="Official Party Email" required>
            <input type="email" value={form.contact_email} onChange={e => set("contact_email", e.target.value)} required className={inp} />
          </Field>
          <Field label="WhatsApp Number" required>
            <input type="tel" value={form.whatsapp} onChange={e => set("whatsapp", e.target.value)} required className={inp} placeholder="+91..." />
          </Field>
        </div>
      </Section>

      {/* SECTION 4: DOCUMENTS */}
      <Section title="Official Documents" subtitle="All uploads required. PDF, PNG, JPG accepted — max 5MB each.">
        <div className="grid gap-6 md:grid-cols-2">
          <FileUploadField
            label="Party Symbol / Official Logo"
            bucket="party-documents"
            folder="symbols"
            onUpload={url => set("symbol_url", url)}
          />
          <FileUploadField
            label={`Payment Proof (INR ${PARTY_FEE.toLocaleString()})`}
            bucket="party-documents"
            folder="payments"
            onUpload={url => set("payment_proof_url", url)}
          />
        </div>

        {/* FEE NOTICE */}
        <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-5">
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">Party Registration Fee</p>
          <p className="mt-2 text-3xl font-bold text-[#0B1F3A]">INR {PARTY_FEE.toLocaleString()}</p>
          <p className="mt-1 text-xs text-slate-500">Payment must be made before submission. Upload proof above.</p>
        </div>
      </Section>

      {/* MESSAGE */}
      {msg && (
        <div className={`rounded-xl border p-4 text-sm font-medium ${
          msg.type === "success"
            ? "border-green-200 bg-green-50 text-green-800"
            : "border-red-200 bg-red-50 text-red-700"
        }`}>
          {msg.text}
        </div>
      )}

      {/* DECLARATION */}
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6">
        <p className="text-sm leading-7 text-amber-900">
          <strong>Declaration:</strong> By submitting this form, the party leadership confirms that all information provided is accurate and complete. Fraudulent submissions, duplicate registrations, or falsified documents will result in immediate disqualification and further IEC disciplinary action under ALSI election regulations.
        </p>
      </div>

      <div className="flex justify-end">
        <button type="submit" disabled={submitting} className="rounded-xl bg-[#0B1F3A] px-10 py-4 text-sm font-semibold text-white transition hover:bg-[#153E75] disabled:cursor-not-allowed disabled:opacity-60">
          {submitting ? "Submitting Registration..." : "Submit Party Registration"}
        </button>
      </div>

    </form>
  );
}

const inp = "w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-[#0B1F3A] focus:ring-2 focus:ring-[#0B1F3A]/10";

function Section({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-6 border-b border-slate-100 pb-4">
        <h3 className="text-lg font-bold text-[#0B1F3A]">{title}</h3>
        {subtitle && <p className="mt-1 text-sm text-slate-500">{subtitle}</p>}
      </div>
      {children}
    </section>
  );
}

function Field({ label, required, className, children }: { label: string; required?: boolean; className?: string; children: React.ReactNode }) {
  return (
    <div className={className}>
      <label className="mb-2 block text-sm font-medium text-slate-700">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {children}
    </div>
  );
}