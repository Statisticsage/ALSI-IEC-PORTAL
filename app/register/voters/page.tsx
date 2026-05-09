"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { UNIVERSITIES, INDIAN_STATES } from "@/lib/constants";
import FileUploadField from "@/components/forms/FileUploadField";
import { notifyRegistration } from "@/lib/notify";
import { VoterFormData } from "@/types";

const INITIAL: VoterFormData = {
  full_name: "", email: "", whatsapp: "",
  university: "", student_id: "",
  passport_number: "", current_state: "",
  alsi_member_status: "active",
  passport_url: "", student_id_url: "",
};

export default function VoterRegistrationPage() {
  const [form, setForm] = useState<VoterFormData>(INITIAL);
  const [msg, setMsg] = useState<{ type: "error" | "success"; text: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function set(field: keyof VoterFormData, value: string) {
    setForm(p => ({ ...p, [field]: value }));
  }

  function validate(): string | null {
    if (!form.passport_url) return "Passport copy upload is required.";
    if (!form.student_id_url) return "Student ID upload is required.";
    return null;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    const err = validate();
    if (err) { setMsg({ type: "error", text: err }); return; }
 
    try {
      setSubmitting(true);
      const { error } = await supabase.from("voters").insert([{
        ...form,
        voter_approved: false,
        verification_status: "pending",
      }]);
 
      if (error) {
        console.error("Voter insert error:", error);
        if (error.message.includes("passport_number"))
          return setMsg({ type: "error", text: "This passport number is already registered." });
        if (error.message.includes("email"))
          return setMsg({ type: "error", text: "This email address is already registered." });
        if (error.message.includes("student_id"))
          return setMsg({ type: "error", text: "This student ID is already registered." });
        return setMsg({ type: "error", text: `Registration failed: ${error.message}` });
      }
 
      setMsg({ type: "success", text: "Voter registration submitted successfully. The IEC will verify your eligibility and notify you via email." });
 
      // Fire-and-forget
      try {
        notifyRegistration("voter", {
          full_name: form.full_name,
          university: form.university,
          student_id: form.student_id,
          passport_number: form.passport_number,
          alsi_member_status: form.alsi_member_status,
          email: form.email,
        });
      } catch (notifyErr) {
        console.warn("Notification failed (non-critical):", notifyErr);
      }
 
      setForm(INITIAL);
    } catch (err) {
      console.error("Unexpected error:", err);
      setMsg({ type: "error", text: `Unexpected system error: ${err instanceof Error ? err.message : String(err)}` });
    } finally {
      setSubmitting(false);
    }
  }
 
  return (
    <main className="min-h-screen bg-slate-50 py-12">
      <div className="mx-auto max-w-4xl px-6">
        <div className="mb-10">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#153E75]">
            IEC Voter Portal
          </p>
          <h1 className="mt-3 text-4xl font-bold tracking-tight text-[#0B1F3A]">
            Voter Registration
          </h1>
          <p className="mt-4 max-w-3xl text-lg leading-8 text-slate-600">
            Official voter eligibility registration for the 2026/2027 ALSI General Election.
            Only verified ALSI members will be approved to vote.
          </p>
        </div>

        {/* ELIGIBILITY NOTICE */}
        <div className="mb-8 rounded-2xl border border-blue-200 bg-blue-50 p-5">
          <p className="text-sm font-semibold text-[#0B1F3A]">Voter Eligibility Requirements</p>
          <ul className="mt-3 grid gap-1 text-sm text-slate-700 md:grid-cols-2">
            <li>✓ Must be a verified ALSI member in good standing</li>
            <li>✓ Must be a currently enrolled student in India</li>
            <li>✓ Valid passport required for identity verification</li>
            <li>✓ Valid student ID required for enrollment verification</li>
            <li>✓ Only one registration per person — duplicates will be rejected</li>
            <li>✓ IEC verification and approval required before voting</li>
          </ul>
        </div>

        <form onSubmit={handleSubmit} className="grid gap-8">

          {/* PERSONAL INFO */}
          <Section title="Personal Information" subtitle="Enter your details exactly as they appear on your passport.">
            <div className="grid gap-6 md:grid-cols-2">
              <Field label="Full Name" required>
                <input value={form.full_name} onChange={e => set("full_name", e.target.value)} required className={inp} />
              </Field>
              <Field label="Email Address" required>
                <input type="email" value={form.email} onChange={e => set("email", e.target.value)} required className={inp} />
              </Field>
              <Field label="WhatsApp Number" required>
                <input type="tel" value={form.whatsapp} onChange={e => set("whatsapp", e.target.value)} required className={inp} placeholder="+91..." />
              </Field>
              <Field label="Passport Number" required>
                <input value={form.passport_number} onChange={e => set("passport_number", e.target.value.toUpperCase())} required className={inp} />
              </Field>
            </div>
          </Section>

          {/* ACADEMIC INFO */}
          <Section title="Academic Information" subtitle="Your current enrollment details in India.">
            <div className="grid gap-6 md:grid-cols-2">
              <Field label="University" required>
                <select value={form.university} onChange={e => set("university", e.target.value)} required className={inp}>
                  <option value="">Select university</option>
                  {UNIVERSITIES.map(u => <option key={u}>{u}</option>)}
                  <option value="Other">Other</option>
                </select>
              </Field>
              <Field label="Student ID Number" required>
                <input value={form.student_id} onChange={e => set("student_id", e.target.value)} required className={inp} />
              </Field>
              <Field label="Current State in India" required>
                <select value={form.current_state} onChange={e => set("current_state", e.target.value)} required className={inp}>
                  <option value="">Select state</option>
                  {INDIAN_STATES.map(s => <option key={s}>{s}</option>)}
                </select>
              </Field>
              <Field label="ALSI Membership Status" required>
                <select value={form.alsi_member_status} onChange={e => set("alsi_member_status", e.target.value as VoterFormData["alsi_member_status"])} required className={inp}>
                  <option value="active">Active Member</option>
                  <option value="inactive">Inactive Member</option>
                  <option value="unknown">Not Sure</option>
                </select>
              </Field>
            </div>
          </Section>

          {/* DOCUMENTS */}
          <Section title="Verification Documents" subtitle="Both documents required. PDF, PNG, JPG accepted — max 5MB each.">
            <div className="grid gap-6 md:grid-cols-2">
              <FileUploadField
                label="Passport Copy"
                bucket="voter-documents"
                folder="passports"
                onUpload={url => set("passport_url", url)}
              />
              <FileUploadField
                label="Student ID Card"
                bucket="voter-documents"
                folder="student-ids"
                onUpload={url => set("student_id_url", url)}
              />
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
              <strong>Declaration:</strong> By submitting this form, I confirm that I am a legitimate ALSI member, currently enrolled in an academic institution in India, and that all information and documents provided are accurate and genuine. I understand that false declarations will result in disqualification.
            </p>
          </div>

          <div className="flex justify-end">
            <button type="submit" disabled={submitting} className="rounded-xl bg-[#0B1F3A] px-10 py-4 text-sm font-semibold text-white transition hover:bg-[#153E75] disabled:cursor-not-allowed disabled:opacity-60">
              {submitting ? "Submitting Registration..." : "Submit Voter Registration"}
            </button>
          </div>

        </form>
      </div>
    </main>
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