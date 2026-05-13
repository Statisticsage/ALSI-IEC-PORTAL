"use client";

import { useEffect, useState } from "react";
import AdminShell from "@/components/layout/AdminShell";
import { supabase } from "@/lib/supabase";
import { PoliticalParty, ApplicationStatus } from "@/types";
import { APPLICATION_STATUSES } from "@/lib/constants";
import { useAdmin } from "@/lib/useAdmin";

export default function AdminPartiesPage() {
  const { admin } = useAdmin();
  const [parties, setParties] = useState<PoliticalParty[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("all");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<PoliticalParty | null>(null);
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  useEffect(() => { fetchParties(); }, []);

  async function fetchParties() {
    setLoading(true);
    const { data } = await supabase
      .from("political_parties")
      .select("*")
      .order("submitted_at", { ascending: false });
    setParties((data as PoliticalParty[]) ?? []);
    setLoading(false);
  }

  async function updateStatus(id: string, status: ApplicationStatus) {
    if (!admin) return;
    setSaving(true);
    await supabase.from("political_parties")
      .update({ status, admin_notes: notes, updated_at: new Date().toISOString() })
      .eq("id", id);
    await supabase.from("audit_logs").insert([{
      actor_name: admin.full_name,
      actor_role: admin.role,
      action_type: status === "approved" ? "approve" : status === "rejected" ? "reject" : "request_info",
      target_type: "political_party",
      target_id: id,
      description: `Political party status updated to ${status}. Notes: ${notes || "none"}`,
    }]);
    await fetchParties();
    setSelected(null);
    setNotes("");
    setSaving(false);
  }

  const filtered = parties.filter(p => {
    const matchStatus = filterStatus === "all" || p.status === filterStatus;
    const matchSearch = !search ||
      p.party_name.toLowerCase().includes(search.toLowerCase()) ||
      p.acronym.toLowerCase().includes(search.toLowerCase()) ||
      p.chairperson_name.toLowerCase().includes(search.toLowerCase());
    return matchStatus && matchSearch;
  });

  return (
    <AdminShell>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#0B1F3A]">Political Parties</h1>
          <p className="mt-1 text-sm text-slate-500">{filtered.length} part{filtered.length !== 1 ? "ies" : "y"} shown</p>
        </div>
        <button onClick={fetchParties} className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100">Refresh</button>
      </div>

      {/* FILTERS */}
      <div className="mb-5 flex flex-wrap gap-3">
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search by party name, acronym, or chairperson..."
          className="w-72 rounded-xl border border-slate-300 px-4 py-2 text-sm outline-none focus:border-[#0B1F3A]" />
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
          className="rounded-xl border border-slate-300 px-4 py-2 text-sm outline-none focus:border-[#0B1F3A]">
          <option value="all">All Statuses</option>
          {APPLICATION_STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>
      </div>

      {/* TABLE */}
      {loading ? (
        <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-14 animate-pulse rounded-xl bg-slate-200" />)}</div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center shadow-sm">
          <p className="text-slate-500">No political parties found.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-slate-200 bg-slate-50">
                <tr>
                  {["Party Name", "Acronym", "Chairperson", "Secretary General", "Contact", "Status", "Submitted", "Actions"].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map(p => {
                  const sc = APPLICATION_STATUSES.find(s => s.value === p.status);
                  return (
                    <tr key={p.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 font-semibold text-[#0B1F3A]">{p.party_name}</td>
                      <td className="px-4 py-3 font-mono text-xs font-bold text-slate-600">{p.acronym}</td>
                      <td className="px-4 py-3 text-slate-600">{p.chairperson_name}</td>
                      <td className="px-4 py-3 text-slate-600">{p.secretary_general_name}</td>
                      <td className="px-4 py-3 text-xs text-slate-500">{p.contact_email}</td>
                      <td className="px-4 py-3">
                        <span className={`rounded-full border px-2.5 py-1 text-xs font-bold uppercase ${sc?.color}`}>
                          {sc?.label ?? p.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-500 whitespace-nowrap">{formatDate(p.submitted_at)}</td>
                      <td className="px-4 py-3">
                        <button onClick={() => { setSelected(p); setNotes(p.admin_notes ?? ""); }}
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
                <h2 className="text-xl font-bold text-[#0B1F3A]">{selected.party_name}</h2>
                <p className="font-mono text-sm font-bold text-slate-500">{selected.acronym}</p>
              </div>
              <button onClick={() => setSelected(null)} className="rounded-lg p-2 hover:bg-slate-100">
                <svg className="h-5 w-5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="mb-6 grid gap-3 rounded-xl bg-slate-50 p-5 text-sm md:grid-cols-2">
              {[
                ["Motto", selected.motto || "â€”"],
                ["Chairperson", selected.chairperson_name],
                ["Secretary General", selected.secretary_general_name],
                ["Contact Email", selected.contact_email],
                ["WhatsApp", selected.whatsapp],
              ].map(([l, v]) => (
                <div key={l}>
                  <p className="text-xs font-semibold text-slate-400">{l}</p>
                  <p className="mt-0.5 font-medium text-slate-700">{v}</p>
                </div>
              ))}
              {selected.description && (
                <div className="md:col-span-2">
                  <p className="text-xs font-semibold text-slate-400">Description</p>
                  <p className="mt-0.5 text-slate-700">{selected.description}</p>
                </div>
              )}
            </div>

            {/* DOCUMENTS */}
            <div className="mb-6 grid gap-2 md:grid-cols-2">
              {[
                { label: "Party Symbol / Logo", url: selected.symbol_url },
                { label: "Payment Proof", url: selected.payment_proof_url },
              ].map(d => (
                <a key={d.label} href={d.url || "#"} target="_blank" rel="noopener noreferrer"
                  className={`flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium transition ${
                    d.url ? "border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100" : "border-slate-200 bg-slate-50 text-slate-400 cursor-not-allowed"
                  }`}>
                  ðŸ“Ž {d.label} {!d.url && "(missing)"}
                </a>
              ))}
            </div>

            <div className="mb-6">
              <label className="mb-2 block text-sm font-medium text-slate-700">IEC Review Notes</label>
              <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3}
                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-[#0B1F3A]" />
            </div>

            <div className="flex flex-wrap gap-3">
              <button onClick={() => updateStatus(selected.id, "approved")} disabled={saving}
                className="flex-1 rounded-xl bg-green-600 py-3 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-60">
                {saving ? "Saving..." : "âœ“ Approve Party"}
              </button>
              <button onClick={() => updateStatus(selected.id, "rejected")} disabled={saving}
                className="flex-1 rounded-xl bg-red-600 py-3 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60">
                âœ— Reject
              </button>
              <button onClick={() => updateStatus(selected.id, "needs_correction")} disabled={saving}
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


