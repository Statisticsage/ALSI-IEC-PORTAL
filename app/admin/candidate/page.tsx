"use client";

import { useEffect, useState } from "react";
import AdminShell from "@/components/layout/AdminShell";
import { supabase } from "@/lib/supabase";
import { Candidate, ApplicationStatus } from "@/types";
import { APPLICATION_STATUSES, POSITIONS } from "@/lib/constants";
import { useAdmin } from "@/lib/useAdmin";

export default function AdminCandidatesPage() {
  const { admin } = useAdmin();
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterPosition, setFilterPosition] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Candidate | null>(null);
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => { fetchCandidates(); }, []);

  async function fetchCandidates() {
    setLoading(true);
    const { data } = await supabase
      .from("candidates")
      .select("*")
      .order("submitted_at", { ascending: false });
    setCandidates((data as Candidate[]) ?? []);
    setLoading(false);
  }

  async function updateStatus(id: string, status: ApplicationStatus) {
    if (!admin) return;
    setSaving(true);
    await supabase.from("candidates").update({ status, admin_notes: notes, updated_at: new Date().toISOString() }).eq("id", id);
    await supabase.from("audit_logs").insert([{
      actor_name: admin.full_name,
      actor_role: admin.role,
      action_type: status === "approved" ? "approve" : status === "rejected" ? "reject" : "request_info",
      target_type: "candidate",
      target_id: id,
      description: `Candidate status updated to ${status}. Notes: ${notes || "none"}`,
    }]);
    await fetchCandidates();
    setSelected(null);
    setNotes("");
    setSaving(false);
  }

  const filtered = candidates.filter(c => {
    const matchStatus = filterStatus === "all" || c.status === filterStatus;
    const matchPos = filterPosition === "all" || c.position_applied === filterPosition;
    const matchSearch = !search || c.full_name.toLowerCase().includes(search.toLowerCase()) ||
      c.passport_number.toLowerCase().includes(search.toLowerCase()) ||
      c.application_id?.toLowerCase().includes(search.toLowerCase());
    return matchStatus && matchPos && matchSearch;
  });

  return (
    <AdminShell>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#0B1F3A]">Candidate Applications</h1>
          <p className="mt-1 text-sm text-slate-500">{filtered.length} record{filtered.length !== 1 ? "s" : ""} shown</p>
        </div>
        <button onClick={fetchCandidates} className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100">
          Refresh
        </button>
      </div>

      {/* FILTERS */}
      <div className="mb-5 flex flex-wrap gap-3">
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by name, passport, or ID..."
          className="rounded-xl border border-slate-300 px-4 py-2 text-sm outline-none focus:border-[#0B1F3A] w-64"
        />
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="rounded-xl border border-slate-300 px-4 py-2 text-sm outline-none focus:border-[#0B1F3A]">
          <option value="all">All Statuses</option>
          {APPLICATION_STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>
        <select value={filterPosition} onChange={e => setFilterPosition(e.target.value)} className="rounded-xl border border-slate-300 px-4 py-2 text-sm outline-none focus:border-[#0B1F3A]">
          <option value="all">All Positions</option>
          {POSITIONS.map(p => <option key={p}>{p}</option>)}
        </select>
      </div>

      {/* TABLE */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-14 animate-pulse rounded-xl bg-slate-200" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center">
          <p className="text-slate-500">No candidates found matching your filters.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-slate-200 bg-slate-50">
                <tr>
                  {["Application ID", "Full Name", "Position", "University", "GPA", "Status", "Submitted", "Actions"].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map(c => {
                  const sc = APPLICATION_STATUSES.find(s => s.value === c.status);
                  return (
                    <tr key={c.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 font-mono text-xs text-slate-500">{c.application_id}</td>
                      <td className="px-4 py-3 font-medium text-[#0B1F3A]">{c.full_name}</td>
                      <td className="px-4 py-3 text-slate-600">{c.position_applied}</td>
                      <td className="px-4 py-3 text-slate-600">{c.university}</td>
                      <td className="px-4 py-3 font-semibold text-slate-700">{c.gpa}</td>
                      <td className="px-4 py-3">
                        <span className={`rounded-full border px-2.5 py-1 text-xs font-bold uppercase ${sc?.color}`}>
                          {sc?.label ?? c.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-500">{formatDate(c.submitted_at)}</td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => { setSelected(c); setNotes(c.admin_notes ?? ""); }}
                          className="rounded-lg bg-[#0B1F3A] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#153E75]"
                        >
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-8 shadow-2xl">
            <div className="mb-6 flex items-start justify-between">
              <div>
                <h2 className="text-xl font-bold text-[#0B1F3A]">{selected.full_name}</h2>
                <p className="font-mono text-sm text-slate-500">{selected.application_id}</p>
              </div>
              <button onClick={() => setSelected(null)} className="rounded-lg p-2 hover:bg-slate-100">
                <svg className="h-5 w-5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* CANDIDATE DETAILS */}
            <div className="mb-6 grid gap-3 rounded-xl bg-slate-50 p-4 text-sm md:grid-cols-2">
              <Detail label="Position" value={selected.position_applied} />
              <Detail label="GPA" value={String(selected.gpa)} />
              <Detail label="University" value={selected.university} />
              <Detail label="Degree Level" value={selected.degree_level} />
              <Detail label="Email" value={selected.email} />
              <Detail label="WhatsApp" value={selected.whatsapp} />
              <Detail label="Passport No." value={selected.passport_number} />
              <Detail label="Political Party" value={selected.political_party || "Independent"} />
            </div>

            {/* DOCUMENT LINKS */}
            <div className="mb-6">
              <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-slate-500">Uploaded Documents</p>
              <div className="grid gap-2 md:grid-cols-2">
                {[
                  { label: "Passport", url: selected.passport_url },
                  { label: "Transcript", url: selected.transcript_url },
                  { label: "Photo", url: selected.photo_url },
                  { label: "Signature", url: selected.signature_url },
                  { label: "Payment Proof", url: selected.payment_url },
                  { label: "Letter of Intent", url: selected.letter_of_intent_url },
                ].map(d => (
                  <a
                    key={d.label}
                    href={d.url || "#"}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium transition ${
                      d.url ? "border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100" : "border-slate-200 bg-slate-50 text-slate-400 cursor-not-allowed"
                    }`}
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                    </svg>
                    {d.label} {!d.url && "(missing)"}
                  </a>
                ))}
              </div>
            </div>

            {/* NOTES */}
            <div className="mb-6">
              <label className="mb-2 block text-sm font-medium text-slate-700">IEC Review Notes</label>
              <textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                rows={3}
                placeholder="Add internal notes visible to the applicant..."
                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-[#0B1F3A] focus:ring-2 focus:ring-[#0B1F3A]/10"
              />
            </div>

            {/* ACTION BUTTONS */}
            <div className="flex flex-wrap gap-3">
              <button onClick={() => updateStatus(selected.id, "approved")} disabled={saving}
                className="flex-1 rounded-xl bg-green-600 py-3 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-60">
                {saving ? "Saving..." : "✓ Approve"}
              </button>
              <button onClick={() => updateStatus(selected.id, "rejected")} disabled={saving}
                className="flex-1 rounded-xl bg-red-600 py-3 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60">
                ✗ Reject
              </button>
              <button onClick={() => updateStatus(selected.id, "needs_correction")} disabled={saving}
                className="flex-1 rounded-xl bg-orange-500 py-3 text-sm font-semibold text-white hover:bg-orange-600 disabled:opacity-60">
                Request Correction
              </button>
              <button onClick={() => updateStatus(selected.id, "under_review")} disabled={saving}
                className="flex-1 rounded-xl border border-slate-300 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-100 disabled:opacity-60">
                Mark Under Review
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminShell>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-semibold text-slate-400">{label}</p>
      <p className="mt-0.5 font-medium text-slate-700">{value}</p>
    </div>
  );
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}