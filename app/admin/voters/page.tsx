"use client";

import { useEffect, useState } from "react";
import AdminShell from "@/components/layout/AdminShell";
import { supabase } from "@/lib/supabase";
import { Voter, ApplicationStatus } from "@/types";
import { APPLICATION_STATUSES } from "@/lib/constants";
import { useAdmin } from "@/lib/useAdmin";

export default function AdminVotersPage() {
  const { admin } = useAdmin();
  const [voters, setVoters] = useState<Voter[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("all");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Voter | null>(null);
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => { fetchVoters(); }, []);

  async function fetchVoters() {
    setLoading(true);
    const { data } = await supabase.from("voters").select("*").order("submitted_at", { ascending: false });
    setVoters((data as Voter[]) ?? []);
    setLoading(false);
  }

  async function updateVoter(id: string, status: ApplicationStatus, approved: boolean) {
    if (!admin) return;
    setSaving(true);
    await supabase.from("voters").update({
      verification_status: status,
      voter_approved: approved,
      admin_notes: notes,
      updated_at: new Date().toISOString(),
    }).eq("id", id);
    await supabase.from("audit_logs").insert([{
      actor_name: admin.full_name,
      actor_role: admin.role,
      action_type: approved ? "approve" : status === "rejected" ? "reject" : "request_info",
      target_type: "voter",
      target_id: id,
      description: `Voter ${approved ? "approved" : "status set to " + status}. Notes: ${notes || "none"}`,
    }]);
    await fetchVoters();
    setSelected(null);
    setNotes("");
    setSaving(false);
  }

  const filtered = voters.filter(v => {
    const matchStatus = filterStatus === "all" || v.verification_status === filterStatus;
    const matchSearch = !search ||
      v.full_name.toLowerCase().includes(search.toLowerCase()) ||
      v.passport_number.toLowerCase().includes(search.toLowerCase()) ||
      v.student_id.toLowerCase().includes(search.toLowerCase());
    return matchStatus && matchSearch;
  });

  return (
    <AdminShell>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#0B1F3A]">Voter Verification</h1>
          <p className="mt-1 text-sm text-slate-500">{filtered.length} voter{filtered.length !== 1 ? "s" : ""} shown</p>
        </div>
        <button onClick={fetchVoters} className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100">Refresh</button>
      </div>

      {/* FILTERS */}
      <div className="mb-5 flex flex-wrap gap-3">
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search by name, passport, or student ID..."
          className="w-72 rounded-xl border border-slate-300 px-4 py-2 text-sm outline-none focus:border-[#0B1F3A]" />
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
          className="rounded-xl border border-slate-300 px-4 py-2 text-sm outline-none focus:border-[#0B1F3A]">
          <option value="all">All Statuses</option>
          {APPLICATION_STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>
      </div>

      {/* TABLE */}
      {loading ? (
        <div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-14 animate-pulse rounded-xl bg-slate-200" />)}</div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center">
          <p className="text-slate-500">No voters found.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-slate-200 bg-slate-50">
                <tr>
                  {["Voter ID", "Full Name", "University", "ALSI Status", "Verification", "Approved", "Submitted", "Actions"].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map(v => {
                  const sc = APPLICATION_STATUSES.find(s => s.value === v.verification_status);
                  return (
                    <tr key={v.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 font-mono text-xs text-slate-500">{v.voter_id_number ?? "Pending"}</td>
                      <td className="px-4 py-3 font-medium text-[#0B1F3A]">{v.full_name}</td>
                      <td className="px-4 py-3 text-slate-600">{v.university}</td>
                      <td className="px-4 py-3">
                        <span className={`rounded-full px-2 py-1 text-xs font-bold uppercase ${
                          v.alsi_member_status === "active" ? "bg-green-100 text-green-700" :
                          v.alsi_member_status === "inactive" ? "bg-red-100 text-red-700" :
                          "bg-slate-100 text-slate-600"
                        }`}>{v.alsi_member_status}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`rounded-full border px-2.5 py-1 text-xs font-bold uppercase ${sc?.color}`}>
                          {sc?.label ?? v.verification_status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${v.voter_approved ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-500"}`}>
                          {v.voter_approved ? "YES" : "NO"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-500">{formatDate(v.submitted_at)}</td>
                      <td className="px-4 py-3">
                        <button onClick={() => { setSelected(v); setNotes(v.admin_notes ?? ""); }}
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-2xl bg-white p-8 shadow-2xl">
            <div className="mb-6 flex items-start justify-between">
              <div>
                <h2 className="text-xl font-bold text-[#0B1F3A]">{selected.full_name}</h2>
                <p className="font-mono text-sm text-slate-500">{selected.voter_id_number ?? "ID Pending"}</p>
              </div>
              <button onClick={() => setSelected(null)} className="rounded-lg p-2 hover:bg-slate-100">
                <svg className="h-5 w-5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="mb-6 grid gap-3 rounded-xl bg-slate-50 p-4 text-sm md:grid-cols-2">
              {[
                ["Email", selected.email], ["WhatsApp", selected.whatsapp],
                ["University", selected.university], ["Student ID", selected.student_id],
                ["Passport No.", selected.passport_number], ["Current State", selected.current_state],
                ["ALSI Status", selected.alsi_member_status],
              ].map(([l, v]) => (
                <div key={l}>
                  <p className="text-xs font-semibold text-slate-400">{l}</p>
                  <p className="mt-0.5 font-medium text-slate-700">{v}</p>
                </div>
              ))}
            </div>

            {/* DOCUMENTS */}
            <div className="mb-6 grid gap-2 md:grid-cols-2">
              {[
                { label: "Passport Copy", url: selected.passport_url },
                { label: "Student ID Card", url: selected.student_id_url },
              ].map(d => (
                <a key={d.label} href={d.url || "#"} target="_blank" rel="noopener noreferrer"
                  className={`flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium transition ${
                    d.url ? "border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100" : "border-slate-200 bg-slate-50 text-slate-400 cursor-not-allowed"
                  }`}>
                  📎 {d.label} {!d.url && "(missing)"}
                </a>
              ))}
            </div>

            <div className="mb-6">
              <label className="mb-2 block text-sm font-medium text-slate-700">IEC Review Notes</label>
              <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3}
                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-[#0B1F3A]" />
            </div>

            <div className="flex flex-wrap gap-3">
              <button onClick={() => updateVoter(selected.id, "approved", true)} disabled={saving}
                className="flex-1 rounded-xl bg-green-600 py-3 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-60">
                {saving ? "Saving..." : "✓ Approve Voter"}
              </button>
              <button onClick={() => updateVoter(selected.id, "rejected", false)} disabled={saving}
                className="flex-1 rounded-xl bg-red-600 py-3 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60">
                ✗ Reject
              </button>
              <button onClick={() => updateVoter(selected.id, "needs_correction", false)} disabled={saving}
                className="flex-1 rounded-xl bg-orange-500 py-3 text-sm font-semibold text-white hover:bg-orange-600 disabled:opacity-60">
                Request Correction
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminShell>
  );
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}