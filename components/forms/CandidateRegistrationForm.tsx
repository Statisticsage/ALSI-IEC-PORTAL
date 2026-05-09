"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import {
  POSITION_FEES,
  POSITION_GPA_REQUIREMENTS,
  POSITIONS,
  UNIVERSITIES,
  DEGREE_LEVELS,
  SEMESTERS,
} from "@/lib/constants";
import FileUploadField from "@/components/forms/FileUploadField";
import { notifyRegistration } from "@/lib/notify";
import type { CandidateFormData, CandidatePosition } from "@/types";

const INITIAL: CandidateFormData = {
  full_name: "", gender: "", date_of_birth: "",
  email: "", whatsapp: "", passport_number: "",
  residential_address: "", university: "",
  degree_level: "", course_of_study: "", semester: "",
  gpa: 0, years_in_india: 0,
  position_applied: "President",
  political_party: "", running_mate: "",
  passport_url: "", transcript_url: "", photo_url: "",
  signature_url: "", payment_url: "", letter_of_intent_url: "",
};

const inp = "w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-[#0B1F3A] focus:ring-2 focus:ring-[#0B1F3A]/10";

function Section({ title, subtitle, children }: {
  title: string; subtitle?: string; children: React.ReactNode;
}) {
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

function Field({ label, required, className, children }: {
  label: string; required?: boolean; className?: string; children: React.ReactNode;
}) {
  return (
    <div className={className}>
      <label className="mb-2 block text-sm font-medium text-slate-700">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {children}
    </div>
  );
}

export default function CandidateRegistrationForm() {
  const [form, setForm] = useState<CandidateFormData>(INITIAL);
  const [msg, setMsg] = useState<{ type: "error" | "success"; text: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const pos = form.position_applied as CandidatePosition;
  const fee = POSITION_FEES[pos] ?? 0;
  const minGPA = POSITION_GPA_REQUIREMENTS[pos] ?? 0;
  const gpaOk = form.gpa > 0 && form.gpa >= minGPA;

  function set<K extends keyof CandidateFormData>(field: K, value: CandidateFormData[K]) {
    setForm((p: CandidateFormData) => ({ ...p, [field]: value }));
  }

  function validate(): string | null {
    if (form.gpa < minGPA)
      return `Minimum GPA for ${form.position_applied} is ${minGPA.toFixed(1)}. Your GPA: ${form.gpa}`;
    if (form.position_applied === "President" && form.years_in_india < 1)
      return "Presidential candidates must have resided in India for at least 1 year.";
    if (!form.passport_url)          return "Passport copy upload is required.";
    if (!form.transcript_url)        return "Academic transcript upload is required.";
    if (!form.photo_url)             return "Passport photo upload is required.";
    if (!form.signature_url)         return "Signature upload is required.";
    if (!form.payment_url)           return "Payment proof upload is required.";
    if (!form.letter_of_intent_url)  return "Letter of Intent upload is required.";
    return null;
  }

 async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    const err = validate();
    if (err) { setMsg({ type: "error", text: err }); return; }
 
    try {
      setSubmitting(true);
      const { error } = await supabase.from("candidates").insert([{
        ...form,
        status: "pending",
      }]);
 
      if (error) {
        console.error("Candidate insert error:", error);
        if (error.message.includes("passport_number"))
          return setMsg({ type: "error", text: "This passport number is already registered." });
        if (error.message.includes("email"))
          return setMsg({ type: "error", text: "This email address is already registered." });
        return setMsg({ type: "error", text: `Submission failed: ${error.message}` });
      }
 
      setMsg({ type: "success", text: "Application submitted successfully. The IEC will review your submission and notify you via email." });
      
      // Fire-and-forget — never block or crash the form
      try {
        notifyRegistration("candidate", {
          full_name: form.full_name,
          position_applied: form.position_applied,
          university: form.university,
          gpa: String(form.gpa),
          email: form.email,
          whatsapp: form.whatsapp,
          application_id: "Auto-assigned by system",
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
    <form onSubmit={handleSubmit} className="grid gap-8">

      {/* SECTION 1 — PERSONAL */}
      <Section title="Personal Information" subtitle="Provide your accurate personal identification details.">
        <div className="grid gap-6 md:grid-cols-2">
          <Field label="Full Name" required>
            <input value={form.full_name} onChange={e => set("full_name", e.target.value)} required className={inp} />
          </Field>
          <Field label="Gender" required>
            <select value={form.gender} onChange={e => set("gender", e.target.value)} required className={inp}>
              <option value="">Select gender</option>
              <option>Male</option>
              <option>Female</option>
            </select>
          </Field>
          <Field label="Date of Birth" required>
            <input type="date" value={form.date_of_birth} onChange={e => set("date_of_birth", e.target.value)} required className={inp} />
          </Field>
          <Field label="Passport Number" required>
            <input value={form.passport_number} onChange={e => set("passport_number", e.target.value.toUpperCase())} required className={inp} />
          </Field>
          <Field label="Email Address" required>
            <input type="email" value={form.email} onChange={e => set("email", e.target.value)} required className={inp} />
          </Field>
          <Field label="WhatsApp Number" required>
            <input type="tel" value={form.whatsapp} onChange={e => set("whatsapp", e.target.value)} required className={inp} />
          </Field>
          <Field label="Residential Address in India" required className="md:col-span-2">
            <textarea value={form.residential_address} onChange={e => set("residential_address", e.target.value)} required rows={2} className={inp} />
          </Field>
        </div>
      </Section>

      {/* SECTION 2 — ACADEMIC */}
      <Section title="Academic Information" subtitle="Provide your current academic details.">
        <div className="grid gap-6 md:grid-cols-2">
          <Field label="University" required>
            <select value={form.university} onChange={e => set("university", e.target.value)} required className={inp}>
              <option value="">Select university</option>
              {UNIVERSITIES.map(u => <option key={u}>{u}</option>)}
              <option value="Other">Other</option>
            </select>
          </Field>
          <Field label="Degree Level" required>
            <select value={form.degree_level} onChange={e => set("degree_level", e.target.value)} required className={inp}>
              <option value="">Select level</option>
              {DEGREE_LEVELS.map(d => <option key={d}>{d}</option>)}
            </select>
          </Field>
          <Field label="Course of Study" required>
            <input value={form.course_of_study} onChange={e => set("course_of_study", e.target.value)} required className={inp} />
          </Field>
          <Field label="Current Semester" required>
            <select value={form.semester} onChange={e => set("semester", e.target.value)} required className={inp}>
              <option value="">Select semester</option>
              {SEMESTERS.map(s => <option key={s}>{s}</option>)}
            </select>
          </Field>
          <Field label="Current GPA" required>
            <input type="number" step="0.01" min="0" max="10"
              value={form.gpa || ""}
              onChange={e => set("gpa", parseFloat(e.target.value) || 0)}
              required className={inp} />
          </Field>
          <Field label="Years Residing in India" required>
            <input type="number" step="0.5" min="0"
              value={form.years_in_india || ""}
              onChange={e => set("years_in_india", parseFloat(e.target.value) || 0)}
              required className={inp} />
          </Field>
        </div>
      </Section>

      {/* SECTION 3 — ELECTORAL */}
      <Section title="Electoral Details" subtitle="Select the position you are contesting.">
        <div className="grid gap-6 md:grid-cols-2">
          <Field label="Position Applied For" required>
            <select
              value={form.position_applied}
              onChange={e => set("position_applied", e.target.value as CandidatePosition)}
              required className={inp}
            >
              {POSITIONS.map(p => <option key={p}>{p}</option>)}
            </select>
          </Field>
          <Field label="Political Party (if any)">
            <input value={form.political_party} onChange={e => set("political_party", e.target.value)}
              placeholder="Leave blank if independent" className={inp} />
          </Field>
          <Field label="Running Mate (if applicable)">
            <input value={form.running_mate} onChange={e => set("running_mate", e.target.value)}
              placeholder="Full name of running mate" className={inp} />
          </Field>
        </div>

        {/* FEE + GPA PANEL */}
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">Registration Fee</p>
            <p className="mt-2 text-3xl font-bold text-[#0B1F3A]">INR {fee.toLocaleString()}</p>
          </div>
          <div className={`rounded-2xl border p-5 ${gpaOk ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}`}>
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">GPA Requirement</p>
            <p className={`mt-2 text-3xl font-bold ${gpaOk ? "text-green-700" : "text-red-600"}`}>
              Min {minGPA.toFixed(1)}{form.gpa > 0 ? ` — Yours: ${form.gpa}` : ""}
            </p>
            <p className={`mt-1 text-xs font-medium ${gpaOk ? "text-green-600" : "text-red-500"}`}>
              {form.gpa === 0 ? "Enter your GPA above" : gpaOk ? "✓ GPA requirement met" : "✗ GPA below minimum"}
            </p>
          </div>
        </div>
      </Section>

      {/* SECTION 4 — DOCUMENTS */}
      <Section title="Verification Documents" subtitle="All documents required. PDF, PNG, JPG accepted — max 5MB each.">
        <div className="grid gap-6 md:grid-cols-2">
          <FileUploadField label="Passport Copy" bucket="candidate-documents" folder="passports"
            onUpload={(url: string) => set("passport_url", url)} />
          <FileUploadField label="Academic Transcript / Grade Sheet" bucket="candidate-documents" folder="transcripts"
            onUpload={(url: string) => set("transcript_url", url)} />
          <FileUploadField label="Passport Photo (recent)" bucket="candidate-documents" folder="photos"
            onUpload={(url: string) => set("photo_url", url)} />
          <FileUploadField label="Signature" bucket="candidate-documents" folder="signatures"
            onUpload={(url: string) => set("signature_url", url)} />
          <FileUploadField label={`Payment Proof (INR ${fee.toLocaleString()})`} bucket="candidate-documents" folder="payments"
            onUpload={(url: string) => set("payment_url", url)} />
          <FileUploadField label="Letter of Intent" bucket="candidate-documents" folder="letters"
            onUpload={(url: string) => set("letter_of_intent_url", url)} />
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
          <strong>Declaration:</strong> By submitting this form, I confirm that all information and
          documents provided are accurate and genuine. I understand that false declarations,
          fraudulent documents, or incomplete submissions will result in immediate disqualification
          and further IEC disciplinary action.
        </p>
      </div>

      <div className="flex justify-end">
        <button type="submit" disabled={submitting}
          className="rounded-xl bg-[#0B1F3A] px-10 py-4 text-sm font-semibold text-white transition hover:bg-[#153E75] disabled:cursor-not-allowed disabled:opacity-60">
          {submitting ? "Submitting Application..." : "Submit Official Application"}
        </button>
      </div>

    </form>
  );
}