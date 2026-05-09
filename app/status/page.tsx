"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { APPLICATION_STATUSES } from "@/lib/constants";

type RecordType = "candidate" | "voter" | "party";

interface StatusResult {
  type: RecordType;
  name: string;
  id: string;
  status: string;
  submitted_at: string;
  updated_at: string;
  admin_notes?: string | null;
}

export default function StatusPage() {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<StatusResult | null>(null);
  const [notFound, setNotFound] = useState(false);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setResult(null);
    setNotFound(false);

    const q = query.trim().toUpperCase();

    try {
      // 1. Search candidates by passport_number or application_id
      const { data: cand } = await supabase
        .from("candidates")
        .select("application_id, full_name, status, submitted_at, updated_at, admin_notes")
        .or(`passport_number.eq.${q},application_id.eq.${q}`)
        .maybeSingle();

      if (cand) {
        setResult({
          type: "candidate",
          name: cand.full_name,
          id: cand.application_id,
          status: cand.status,
          submitted_at: cand.submitted_at,
          updated_at: cand.updated_at,
          admin_notes: cand.admin_notes,
        });
        return;
      }

      // 2. Search voters by passport_number or voter_id_number
      const { data: voter } = await supabase
        .from("voters")
        .select("voter_id_number, full_name, verification_status, submitted_at, updated_at, admin_notes")
        .or(`passport_number.eq.${q},voter_id_number.eq.${q}`)
        .maybeSingle();

      if (voter) {
        setResult({
          type: "voter",
          name: voter.full_name,
          id: voter.voter_id_number ?? "Pending assignment",
          status: voter.verification_status,
          submitted_at: voter.submitted_at,
          updated_at: voter.updated_at,
          admin_notes: voter.admin_notes,
        });
        return;
      }

      // 3. Search parties by contact_email or party_name
      const { data: party } = await supabase
        .from("political_parties")
        .select("party_name, acronym, status, submitted_at, updated_at, admin_notes")
        .or(`party_name.ilike.%${query.trim()}%,acronym.eq.${q}`)
        .maybeSingle();

      if (party) {
        setResult({
          type: "party",
          name: party.party_name,
          id: party.acronym,
          status: party.status,
          submitted_at: party.submitted_at,
          updated_at: party.updated_at,
          admin_notes: party.admin_notes,
        });
        return;
      }

      setNotFound(true);
    } catch (err) {
      console.error(err);
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  }

  const statusConfig = APPLICATION_STATUSES.find(s => s.value === result?.status);

  return (
    <main className="min-h-screen bg-slate-50 py-12">
      <div className="mx-auto max-w-3xl px-6">

        <div className="mb-10">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#153E75]">
            IEC Status Portal
          </p>
          <h1 className="mt-3 text-4xl font-bold tracking-tight text-[#0B1F3A]">
            Application Status Check
          </h1>
          <p className="mt-4 text-lg leading-8 text-slate-600">
            Track your candidate, voter, or political party application through the IEC verification system.
          </p>
        </div>

        {/* SEARCH FORM */}
        <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
          <form onSubmit={handleSearch} className="flex gap-3">
            <input
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Enter passport number, application ID, or party name"
              className="flex-1 rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-[#0B1F3A] focus:ring-2 focus:ring-[#0B1F3A]/10"
            />
            <button
              type="submit"
              disabled={loading || !query.trim()}
              className="rounded-xl bg-[#0B1F3A] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#153E75] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Searching..." : "Check Status"}
            </button>
          </form>

          <p className="mt-3 text-xs text-slate-500">
            You can search by: Passport Number · Application ID (IEC-CAND-...) · Voter ID (IEC-VOTER-...) · Party Name or Acronym
          </p>
        </div>

        {/* RESULT */}
        {result && (
          <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">
                  {result.type === "candidate" ? "Candidate Application"
                    : result.type === "voter" ? "Voter Registration"
                    : "Political Party Registration"}
                </p>
                <h2 className="mt-2 text-2xl font-bold text-[#0B1F3A]">{result.name}</h2>
                <p className="mt-1 font-mono text-sm text-slate-500">{result.id}</p>
              </div>
              <span className={`shrink-0 rounded-full border px-4 py-1.5 text-xs font-bold uppercase tracking-wide ${statusConfig?.color ?? "bg-slate-100 text-slate-700 border-slate-200"}`}>
                {statusConfig?.label ?? result.status.replace(/_/g, " ")}
              </span>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <InfoRow label="Submitted" value={formatDate(result.submitted_at)} />
              <InfoRow label="Last Updated" value={formatDate(result.updated_at)} />
            </div>

            {result.admin_notes && (
              <div className="mt-6 rounded-xl border border-blue-200 bg-blue-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-widest text-blue-700">IEC Review Note</p>
                <p className="mt-2 text-sm text-blue-900">{result.admin_notes}</p>
              </div>
            )}

            {result.status === "needs_correction" && (
              <div className="mt-4 rounded-xl border border-orange-200 bg-orange-50 p-4">
                <p className="text-sm font-medium text-orange-800">
                  Your application requires corrections. Please review the IEC note above and resubmit with the requested information.
                </p>
              </div>
            )}

            {result.status === "approved" && (
              <div className="mt-4 rounded-xl border border-green-200 bg-green-50 p-4">
                <p className="text-sm font-medium text-green-800">
                  ✓ Your application has been officially approved by the IEC.
                </p>
              </div>
            )}
          </div>
        )}

        {/* NOT FOUND */}
        {notFound && (
          <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
            <p className="text-lg font-semibold text-[#0B1F3A]">No record found</p>
            <p className="mt-2 text-sm text-slate-500">
              No application was found matching <strong>{query}</strong>. Please verify your details or contact the IEC.
            </p>
          </div>
        )}

        {/* STATUS LEGEND */}
        <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-semibold text-[#0B1F3A]">Application Status Guide</p>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {APPLICATION_STATUSES.map(s => (
              <div key={s.value} className="flex items-center gap-3">
                <span className={`rounded-full border px-3 py-1 text-xs font-bold uppercase ${s.color}`}>
                  {s.label}
                </span>
                <span className="text-xs text-slate-500">
                  {s.value === "pending" && "Received, awaiting IEC review"}
                  {s.value === "under_review" && "IEC is actively reviewing your file"}
                  {s.value === "approved" && "Officially approved by IEC"}
                  {s.value === "rejected" && "Application did not meet requirements"}
                  {s.value === "needs_correction" && "Action required — check IEC note"}
                </span>
              </div>
            ))}
          </div>
        </div>

      </div>
    </main>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
      <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">{label}</p>
      <p className="mt-1 text-sm font-medium text-slate-700">{value}</p>
    </div>
  );
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("en-IN", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}