"use client";

import { useEffect, useState } from "react";
import AdminShell from "@/components/layout/AdminShell";
import { supabase } from "@/lib/supabase";
import { Voter, ApplicationStatus } from "@/types";
import { APPLICATION_STATUSES } from "@/lib/constants";
import { useAdmin } from "@/lib/useAdmin";

// Only secretary_general has full access — approve, reject, view docs, review modal
const FULL_ACCESS_ROLE = "secretary_general";

export default function AdminVotersPage() {
  const { admin } = useAdmin();
  const [voters, setVoters] = useState<Voter[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("all");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Voter | null>(null);
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState("");

  const canAct = admin?.role === FULL_ACCESS_ROLE;

  useEffect(() => { fetchVoters(); }, []);

  async function fetchVoters() {
    setLoading(true);
    const { data, error } = await supabase
      .from("voters")
      .select("*")
      .order("submitted_at", { ascending: false });
    if (error) console.error("Fetch voters error:", error.message);
    setVoters((data as Voter[]) ?? []);
    setLoading(false);
  }

  async function updateVoter(id: string, status: ApplicationStatus, approved: boolean) {
    if (!admin || !canAct) return;
    setSaving(true);
    setSaveMsg("");

    const { error } = await supabase.from("voters").update({
      verification_status: status,
      voter_approved: approved,
      admin_notes: notes,
      updated_at: new Date().toISOString(),
    }).eq("id", id);

    if (error) {
      setSaveMsg("Save failed: " + error.message);
      setSaving(false);
      return;
    }

    await supabase.from("audit_logs").insert([{
      actor_name: admin.full_name,
      actor_role: admin.role,
      action_type: approved ? "approve_voter" : status === "rejected" ? "reject_voter" : "request_correction",
      target_type: "voter",
      target_id: id,
      description: `Voter ${approved ? "approved — Voter ID assigned" : "status → " + status}. Notes: ${notes || "none"}`,
    }]);

    await fetchVoters();
    setSelected(null);
    setNotes("");
    setSaving(false);
  }

  const filtered = voters.filter(v => {
    const matchStatus = filterStatus === "all" || v.verification_status === filterStatus;
    const q = search.toLowerCase();
    const matchSearch = !q ||
      v.full_name?.toLowerCase().includes(q) ||
      v.passport_number?.toLowerCase().includes(q) ||
      v.student_id?.toLowerCase().includes(q) ||
      v.email?.toLowerCase().includes(q);
    return matchStatus && matchSearch;
  });

  const inp = "rounded-xl border border-slate-300 px-4 py-2 text-sm outline-none focus:border-[#0B1F3A]";

  return (
    <AdminShell>
      {/* HEADER */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#0B1F3A]">Voter Verification</h1>
          <p className="mt-1 text-sm text-slate-500">
            {loading ? "Loading..." : `${filtered.length} of ${voters.length} voter${voters.length !== 1 ? "s" : ""}`}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {!canAct && (
            <span className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-700">
              Read Only Access
            </span>
          )}
          <button onClick={fetchVoters}
            className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100">
            ↻ Refresh
          </button>
        </div>
      </div>

      {/* FILTERS */}
      <div className="mb-5 flex flex-wrap gap-3">
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search by name, passport, student ID, or email..."
          className={`w-72 ${inp}`} />
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className={inp}>
          <option value="all">All Statuses</option>
          {APPLICATION_STATUSES.map(s => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
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
        <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center shadow-sm">
          <p className="text-slate-500">No voters found.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-slate-200 bg-slate-50">
                <tr>
                  {[
                    "Voter ID", "Full Name", "University",
                    "ALSI Status", "Verification", "Approved", "Submitted",
                    ...(canAct ? ["Actions"] : []),
                  ].map(h => (
                    <th key={h} className="whitespace-nowrap px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map(v => {
                  const sc = APPLICATION_STATUSES.find(s => s.value === v.verification_status);
                  return (
                    <tr key={v.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 font-mono text-xs text-slate-500">
                        {v.voter_id_number ?? (
                          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-400">Pending</span>
                        )}
                      </td>
                      <td className="px-4 py-3 font-semibold text-[#0B1F3A]">{v.full_name}</td>
                      <td className="max-w-[160px] truncate px-4 py-3 text-slate-600">{v.university}</td>
                      <td className="px-4 py-3">
                        <span className={`rounded-full px-2.5 py-1 text-xs font-bold uppercase ${
                          v.alsi_member_status === "active" ? "bg-green-100 text-green-700" :
                          v.alsi_member_status === "inactive" ? "bg-red-100 text-red-700" :
                          "bg-slate-100 text-slate-500"
                        }`}>{v.alsi_member_status}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`rounded-full border px-2.5 py-1 text-xs font-bold uppercase ${sc?.color ?? "bg-slate-100 text-slate-500 border-slate-200"}`}>
                          {sc?.label ?? v.verification_status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${
                          v.voter_approved ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-400"
                        }`}>
                          {v.voter_approved ? "YES" : "NO"}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-xs text-slate-400">
                        {formatDate(v.submitted_at)}
                      </td>
                      {/* Actions column — ONLY for secretary_general */}
                      {canAct && (
                        <td className="px-4 py-3">
                          <button
                            onClick={() => { setSelected(v); setNotes(v.admin_notes ?? ""); setSaveMsg(""); }}
                            className="rounded-lg bg-[#0B1F3A] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#153E75]">
                            Review
                          </button>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* REVIEW MODAL — only rendered for secretary_general */}
      {canAct && selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-2xl bg-white p-8 shadow-2xl">

            {/* HEADER */}
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <p className="font-mono text-xs text-slate-400">
                  {selected.voter_id_number ?? "Voter ID — Pending Approval"}
                </p>
                <h2 className="mt-1 text-xl font-bold text-[#0B1F3A]">{selected.full_name}</h2>
                <p className="text-sm text-slate-500">{selected.university} — {selected.current_state}</p>
              </div>
              <button onClick={() => setSelected(null)} className="rounded-lg p-2 hover:bg-slate-100" aria-label="Close">
                <svg className="h-5 w-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* DETAILS */}
            <div className="mb-6 grid gap-3 rounded-xl bg-slate-50 p-4 text-sm md:grid-cols-2">
              {[
                ["Email", selected.email],
                ["WhatsApp", selected.whatsapp],
                ["University", selected.university],
                ["Student ID", selected.student_id],
                ["Passport No.", selected.passport_number],
                ["Current State", selected.current_state],
                ["ALSI Status", selected.alsi_member_status],
                ["Submitted", formatDate(selected.submitted_at)],
              ].map(([l, val]) => (
                <div key={l}>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{l}</p>
                  <p className="mt-0.5 font-medium text-slate-700">{val}</p>
                </div>
              ))}
            </div>

            {/* DOCUMENTS */}
            <div className="mb-6">
              <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-slate-500">Verification Documents</p>
              <div className="grid gap-2 md:grid-cols-2">
                {[
                  { label: "Passport Copy", url: selected.passport_url },
                  { label: "Student ID Card", url: selected.student_id_url },
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

            {/* REVIEW NOTES */}
            <div className="mb-6">
              <label className="mb-2 block text-sm font-medium text-slate-700">
                IEC Review Notes
                <span className="ml-2 text-xs font-normal text-slate-400">
                  (sent to applicant when requesting correction)
                </span>
              </label>
              <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3}
                placeholder="Describe what needs to be corrected or the reason for this decision..."
                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-[#0B1F3A] focus:ring-2 focus:ring-[#0B1F3A]/10" />
            </div>

            {saveMsg && (
              <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-700">
                {saveMsg}
              </div>
            )}

            {/* ACTIONS */}
            <div className="grid grid-cols-2 gap-3">
              <button onClick={() => updateVoter(selected.id, "approved", true)}
                disabled={saving || selected.voter_approved}
                className="rounded-xl bg-green-600 py-3 text-sm font-semibold text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50">
                {saving ? "Saving..." : selected.voter_approved ? "Already Approved" : "✓ Approve Voter"}
              </button>
              <button onClick={() => updateVoter(selected.id, "rejected", false)} disabled={saving}
                className="rounded-xl bg-red-600 py-3 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50">
                ✗ Reject
              </button>
              <button onClick={() => updateVoter(selected.id, "needs_correction", false)} disabled={saving}
                className="rounded-xl bg-orange-500 py-3 text-sm font-semibold text-white hover:bg-orange-600 disabled:opacity-50">
                Request Correction
              </button>
              <button onClick={() => updateVoter(selected.id, "under_review", false)} disabled={saving}
                className="rounded-xl border border-slate-300 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-100 disabled:opacity-50">
                Mark Under Review
              </button>
            </div>

          </div>
        </div>
      )}
    </AdminShell>
  );
}

function formatDate(iso: string) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}