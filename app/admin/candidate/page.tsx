"use client";

// SAVE AS: app/admin/candidates/page.tsx  (NEW folder — plural)
// The old app/admin/candidate/page.tsx can be deleted after this is confirmed working

import { useEffect, useState } from "react";
import AdminShell from "@/components/layout/AdminShell";
import { supabase } from "@/lib/supabase";
import type { Candidate, ApplicationStatus } from "@/types";
import { APPLICATION_STATUSES, POSITIONS } from "@/lib/constants";
import { useAdmin } from "@/lib/useAdmin";

export default function AdminCandidatesPage() {
  const { admin } = useAdmin();
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterPosition, setFilterPosition] = useState("all");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Candidate | null>(null);
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState("");

  useEffect(() => { fetchCandidates(); }, []);

  async function fetchCandidates() {
    setLoading(true);
    const { data, error } = await supabase
      .from("candidates")
      .select("*")
      .order("submitted_at", { ascending: false });
    if (error) console.error("Fetch candidates error:", error.message);
    setCandidates((data as Candidate[]) ?? []);
    setLoading(false);
  }

  async function updateStatus(id: string, status: ApplicationStatus) {
    if (!admin) return;
    setSaving(true);
    setSaveMsg("");

    const { error } = await supabase
      .from("candidates")
      .update({ status, admin_notes: notes, updated_at: new Date().toISOString() })
      .eq("id", id);

    if (error) {
      setSaveMsg("Save failed: " + error.message);
      setSaving(false);
      return;
    }

    await supabase.from("audit_logs").insert([{
      actor_name: admin.full_name,
      actor_role: admin.role,
      action_type: status === "approved" ? "approve_candidate"
        : status === "rejected" ? "reject_candidate"
        : "request_correction",
      target_type: "candidate",
      target_id: id,
      description: `Candidate status → ${status}. Notes: ${notes || "none"}`,
    }]);

    await fetchCandidates();
    setSelected(null);
    setNotes("");
    setSaving(false);
  }

  const filtered = candidates.filter(c => {
    const matchStatus = filterStatus === "all" || c.status === filterStatus;
    const matchPos = filterPosition === "all" || c.position_applied === filterPosition;
    const q = search.toLowerCase();
    const matchSearch = !q ||
      c.full_name?.toLowerCase().includes(q) ||
      c.passport_number?.toLowerCase().includes(q) ||
      c.application_id?.toLowerCase().includes(q) ||
      c.email?.toLowerCase().includes(q);
    return matchStatus && matchPos && matchSearch;
  });

  const inp = "rounded-xl border border-slate-300 px-4 py-2 text-sm outline-none focus:border-[#0B1F3A]";

  return (
    <AdminShell>
      {/* HEADER */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#0B1F3A]">Candidate Applications</h1>
          <p className="mt-1 text-sm text-slate-500">
            {loading ? "Loading..." : `${filtered.length} of ${candidates.length} record${candidates.length !== 1 ? "s" : ""}`}
          </p>
        </div>
        <button onClick={fetchCandidates}
          className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100">
          ↻ Refresh
        </button>
      </div>

      {/* FILTERS */}
      <div className="mb-5 flex flex-wrap gap-3">
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search name, passport, email, or ID..."
          className={`w-72 ${inp}`} />
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className={inp}>
          <option value="all">All Statuses</option>
          {APPLICATION_STATUSES.map(s => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </select>
        <select value={filterPosition} onChange={e => setFilterPosition(e.target.value)} className={inp}>
          <option value="all">All Positions</option>
          {POSITIONS.map(p => <option key={p}>{p}</option>)}
        </select>
      </div>

      {/* TABLE */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-14 animate-pulse rounded-xl bg-slate-200" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-16 text-center shadow-sm">
          <p className="text-lg font-semibold text-slate-400">No candidates found</p>
          <p className="mt-2 text-sm text-slate-400">
            {candidates.length === 0
              ? "No registrations have been submitted yet."
              : "Try adjusting your search or filters."}
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-slate-200 bg-slate-50">
                <tr>
                  {["App ID", "Full Name", "Position", "University", "GPA", "Status", "Submitted", "Action"].map(h => (
                    <th key={h} className="whitespace-nowrap px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map(c => {
                  const sc = APPLICATION_STATUSES.find(s => s.value === c.status);
                  return (
                    <tr key={c.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 font-mono text-xs text-slate-400">{c.application_id ?? "—"}</td>
                      <td className="px-4 py-3 font-semibold text-[#0B1F3A]">{c.full_name}</td>
                      <td className="px-4 py-3 text-slate-600">{c.position_applied}</td>
                      <td className="max-w-[160px] truncate px-4 py-3 text-slate-600">{c.university}</td>
                      <td className="px-4 py-3 font-bold text-slate-700">{c.gpa}</td>
                      <td className="px-4 py-3">
                        <span className={`rounded-full border px-2.5 py-1 text-xs font-bold uppercase ${sc?.color ?? "bg-slate-100 text-slate-600 border-slate-200"}`}>
                          {sc?.label ?? c.status}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-xs text-slate-400">
                        {fmtDate(c.submitted_at)}
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => { setSelected(c); setNotes(c.admin_notes ?? ""); setSaveMsg(""); }}
                          className="rounded-lg bg-[#0B1F3A] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#153E75]">
                          Review
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* REVIEW MODAL */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-8 shadow-2xl">

            {/* MODAL HEADER */}
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <p className="font-mono text-xs text-slate-400">{selected.application_id}</p>
                <h2 className="mt-1 text-xl font-bold text-[#0B1F3A]">{selected.full_name}</h2>
                <p className="text-sm text-slate-500">{selected.position_applied} — {selected.university}</p>
              </div>
              <button onClick={() => setSelected(null)}
                className="rounded-lg p-2 hover:bg-slate-100" aria-label="Close">
                <svg className="h-5 w-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* DETAILS */}
            <div className="mb-6 grid gap-3 rounded-xl bg-slate-50 p-5 text-sm md:grid-cols-2">
              {[
                ["Email", selected.email],
                ["WhatsApp", selected.whatsapp],
                ["Passport No.", selected.passport_number],
                ["Date of Birth", selected.date_of_birth],
                ["GPA", String(selected.gpa)],
                ["Years in India", String(selected.years_in_india)],
                ["Degree Level", selected.degree_level],
                ["Course", selected.course_of_study],
                ["Semester", selected.semester],
                ["Political Party", selected.political_party || "Independent"],
                ["Running Mate", selected.running_mate || "N/A"],
                ["Submitted", fmtDate(selected.submitted_at)],
              ].map(([l, v]) => (
                <div key={l}>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{l}</p>
                  <p className="mt-0.5 font-medium text-slate-700">{v}</p>
                </div>
              ))}
            </div>

            {/* DOCUMENTS */}
            <div className="mb-6">
              <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-slate-500">
                Uploaded Documents
              </p>
              <div className="grid gap-2 md:grid-cols-2">
                {[
                  { label: "Passport Copy", url: selected.passport_url },
                  { label: "Academic Transcript", url: selected.transcript_url },
                  { label: "Passport Photo", url: selected.photo_url },
                  { label: "Signature", url: selected.signature_url },
                  { label: "Payment Proof", url: selected.payment_url },
                  { label: "Letter of Intent", url: selected.letter_of_intent_url },
                ].map(d => (
                  d.url ? (
                    <a key={d.label} href={d.url} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-4 py-2.5 text-sm font-medium text-blue-700 transition hover:bg-blue-100">
                      📎 {d.label}
                    </a>
                  ) : (
                    <div key={d.label}
                      className="flex items-center gap-2 rounded-xl border border-red-100 bg-red-50 px-4 py-2.5 text-sm font-medium text-red-400">
                      ⚠ {d.label} — Missing
                    </div>
                  )
                ))}
              </div>
            </div>

            {/* NOTES */}
            <div className="mb-6">
              <label className="mb-2 block text-sm font-medium text-slate-700">
                IEC Review Notes
              </label>
              <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3}
                placeholder="Add review notes here..."
                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-[#0B1F3A] focus:ring-2 focus:ring-[#0B1F3A]/10" />
            </div>

            {saveMsg && (
              <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-700">
                {saveMsg}
              </div>
            )}

            {/* ACTION BUTTONS */}
            <div className="grid grid-cols-2 gap-3">
              <button onClick={() => updateStatus(selected.id, "approved")} disabled={saving}
                className="rounded-xl bg-green-600 py-3 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-60">
                {saving ? "Saving..." : "✓ Approve"}
              </button>
              <button onClick={() => updateStatus(selected.id, "rejected")} disabled={saving}
                className="rounded-xl bg-red-600 py-3 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60">
                ✗ Reject
              </button>
              <button onClick={() => updateStatus(selected.id, "needs_correction")} disabled={saving}
                className="rounded-xl bg-orange-500 py-3 text-sm font-semibold text-white hover:bg-orange-600 disabled:opacity-60">
                Request Correction
              </button>
              <button onClick={() => updateStatus(selected.id, "under_review")} disabled={saving}
                className="rounded-xl border border-slate-300 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-100 disabled:opacity-60">
                Mark Under Review
              </button>
            </div>

          </div>
        </div>
      )}
    </AdminShell>
  );
}

function fmtDate(iso: string) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "2-digit", month: "short", year: "numeric",
  });
}