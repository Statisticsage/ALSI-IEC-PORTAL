"use client";

import { useEffect, useState } from "react";
import AdminShell from "@/components/layout/AdminShell";
import { supabase } from "@/lib/supabase";
import { DashboardStats } from "@/types";
import { useAdmin } from "@/lib/useAdmin";

const EMPTY: DashboardStats = {
  total_candidates: 0, pending_candidates: 0,
  approved_candidates: 0, rejected_candidates: 0,
  total_voters: 0, approved_voters: 0,
  total_parties: 0, approved_parties: 0,
};

export default function DashboardPage() {
  const { admin } = useAdmin();
  const [stats, setStats] = useState<DashboardStats>(EMPTY);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const [
        { count: totalC },
        { count: pendingC },
        { count: approvedC },
        { count: rejectedC },
        { count: totalV },
        { count: approvedV },
        { count: totalP },
        { count: approvedP },
      ] = await Promise.all([
        supabase.from("candidates").select("*", { count: "exact", head: true }),
        supabase.from("candidates").select("*", { count: "exact", head: true }).eq("status", "pending"),
        supabase.from("candidates").select("*", { count: "exact", head: true }).eq("status", "approved"),
        supabase.from("candidates").select("*", { count: "exact", head: true }).eq("status", "rejected"),
        supabase.rpc("rpc_voter_status_lookup", {
          passport_number: null,
          voter_id: null,
        }),
        supabase.from("voters").select("*", { count: "exact", head: true }).eq("voter_approved", true),
        supabase.from("political_parties").select("*", { count: "exact", head: true }),
        supabase.from("political_parties").select("*", { count: "exact", head: true }).eq("status", "approved"),
      ]);

      setStats({
        total_candidates: totalC ?? 0,
        pending_candidates: pendingC ?? 0,
        approved_candidates: approvedC ?? 0,
        rejected_candidates: rejectedC ?? 0,
        total_voters: totalV ?? 0,
        approved_voters: approvedV ?? 0,
        total_parties: totalP ?? 0,
        approved_parties: approvedP ?? 0,
      });
      setLoading(false);
    }
    load();
  }, []);

  return (
    <AdminShell>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[#0B1F3A]">Dashboard</h1>
        <p className="mt-1 text-sm text-slate-500">
          Welcome back, {admin?.full_name}. Here is the current election registration overview.
        </p>
      </div>

      {loading ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-28 animate-pulse rounded-2xl bg-slate-200" />
          ))}
        </div>
      ) : (
        <>
          {/* CANDIDATE STATS */}
          <div className="mb-6">
            <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-slate-500">Candidates</p>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <StatCard label="Total Submitted" value={stats.total_candidates} color="blue" />
              <StatCard label="Pending Review" value={stats.pending_candidates} color="yellow" />
              <StatCard label="Approved" value={stats.approved_candidates} color="green" />
              <StatCard label="Rejected" value={stats.rejected_candidates} color="red" />
            </div>
          </div>

          {/* VOTER STATS */}
          <div className="mb-6">
            <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-slate-500">Voters</p>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <StatCard label="Total Registered" value={stats.total_voters} color="blue" />
              <StatCard label="Verified & Approved" value={stats.approved_voters} color="green" />
              <StatCard label="Pending Verification" value={stats.total_voters - stats.approved_voters} color="yellow" />
              <StatCard label="Approval Rate" value={stats.total_voters > 0 ? `${Math.round((stats.approved_voters / stats.total_voters) * 100)}%` : "—"} color="slate" />
            </div>
          </div>

          {/* PARTY STATS */}
          <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-slate-500">Political Parties</p>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <StatCard label="Total Registered" value={stats.total_parties} color="blue" />
              <StatCard label="Approved" value={stats.approved_parties} color="green" />
              <StatCard label="Pending Review" value={stats.total_parties - stats.approved_parties} color="yellow" />
            </div>
          </div>
        </>
      )}
    </AdminShell>
  );
}

function StatCard({ label, value, color }: { label: string; value: number | string; color: string }) {
  const colors: Record<string, string> = {
    blue: "border-blue-200 bg-blue-50",
    green: "border-green-200 bg-green-50",
    yellow: "border-yellow-200 bg-yellow-50",
    red: "border-red-200 bg-red-50",
    slate: "border-slate-200 bg-slate-50",
  };
  const textColors: Record<string, string> = {
    blue: "text-blue-800", green: "text-green-800",
    yellow: "text-yellow-800", red: "text-red-800", slate: "text-slate-700",
  };
  return (
    <div className={`rounded-2xl border p-5 ${colors[color]}`}>
      <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">{label}</p>
      <p className={`mt-2 text-3xl font-bold ${textColors[color]}`}>{value}</p>
    </div>
  );
}