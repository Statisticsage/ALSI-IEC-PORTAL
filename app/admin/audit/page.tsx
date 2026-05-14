"use client";

import { useEffect, useState } from "react";
import AdminShell from "@/components/layout/AdminShell";
import { getSupabase } from "@/lib/supabase";
import { AuditLog } from "@/types";

const ACTION_COLORS: Record<string, string> = {
  approve:      "bg-green-100 text-green-700 border-green-200",
  reject:       "bg-red-100 text-red-700 border-red-200",
  request_info: "bg-orange-100 text-orange-700 border-orange-200",
  update:       "bg-blue-100 text-blue-700 border-blue-200",
  create:       "bg-indigo-100 text-indigo-700 border-indigo-200",
  delete:       "bg-red-100 text-red-800 border-red-200",
  export:       "bg-purple-100 text-purple-700 border-purple-200",
  login:        "bg-slate-100 text-slate-600 border-slate-200",
  logout:       "bg-slate-100 text-slate-500 border-slate-200",
};

const PAGE_SIZE = 25;

export default function AuditLogPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [filterAction, setFilterAction] = useState("all");
  const [filterTarget, setFilterTarget] = useState("all");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<AuditLog | null>(null);

  useEffect(() => { fetchLogs(); }, [page, filterAction, filterTarget]);

  async function fetchLogs() {
    setLoading(true);
    const supabase = getSupabase();
    let query = supabase
      .from("audit_logs")
      .select("*", { count: "exact" })
      .order("timestamp", { ascending: false })
      .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

    if (filterAction !== "all") query = query.eq("action_type", filterAction);
    if (filterTarget !== "all") query = query.eq("target_type", filterTarget);

    const { data, count } = await query;
    setLogs((data as AuditLog[]) ?? []);
    setTotal(count ?? 0);
    setLoading(false);
  }

  const filtered = search
    ? logs.filter(l =>
        l.actor_name.toLowerCase().includes(search.toLowerCase()) ||
        l.description.toLowerCase().includes(search.toLowerCase()) ||
        l.target_id?.toLowerCase().includes(search.toLowerCase())
      )
    : logs;

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <AdminShell>
      {/* HEADER */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#0B1F3A]">Audit Logs</h1>
          <p className="mt-1 text-sm text-slate-500">
            Complete record of all IEC administrative actions — {total.toLocaleString()} total entries
          </p>
        </div>
        <button
          onClick={() => { setPage(0); fetchLogs(); }}
          className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100"
        >
          Refresh
        </button>
      </div>

      {/* SECURITY ALERT BANNER — shows if any failed login attempts exist */}
      <SecurityAlertBanner />

      {/* FILTERS */}
      <div className="mb-5 flex flex-wrap gap-3">
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by actor, description, or ID..."
          className="w-72 rounded-xl border border-slate-300 px-4 py-2 text-sm outline-none focus:border-[#0B1F3A]"
        />
        <select
          value={filterAction}
          onChange={e => { setFilterAction(e.target.value); setPage(0); }}
          className="rounded-xl border border-slate-300 px-4 py-2 text-sm outline-none focus:border-[#0B1F3A]"
        >
          <option value="all">All Actions</option>
          <option value="approve">Approve</option>
          <option value="reject">Reject</option>
          <option value="request_info">Request Info</option>
          <option value="update">Update</option>
          <option value="export">Export</option>
          <option value="login">Login</option>
          <option value="logout">Logout</option>
        </select>
        <select
          value={filterTarget}
          onChange={e => { setFilterTarget(e.target.value); setPage(0); }}
          className="rounded-xl border border-slate-300 px-4 py-2 text-sm outline-none focus:border-[#0B1F3A]"
        >
          <option value="all">All Targets</option>
          <option value="candidate">Candidates</option>
          <option value="voter">Voters</option>
          <option value="political_party">Political Parties</option>
          <option value="system">System</option>
        </select>
      </div>

      {/* TABLE */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-14 animate-pulse rounded-xl bg-slate-200" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center shadow-sm">
          <p className="text-slate-500">No audit log entries found.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-slate-200 bg-slate-50">
                <tr>
                  {["Timestamp", "Actor", "Role", "Action", "Target", "Description", "IP Address", ""].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map(log => {
                  const isSecurity = log.description.includes("SECURITY ALERT");
                  return (
                    <tr key={log.id} className={`hover:bg-slate-50 ${isSecurity ? "bg-red-50" : ""}`}>
                      <td className="px-4 py-3 text-xs text-slate-500 whitespace-nowrap">
                        {formatDateTime(log.created_at)}
                      </td>
                      <td className="px-4 py-3 font-medium text-[#0B1F3A] whitespace-nowrap">
                        {isSecurity && <span className="mr-1">🚨</span>}
                        {log.actor_name}
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-500 capitalize whitespace-nowrap">
                        {log.actor_role.replace(/_/g, " ")}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={`rounded-full border px-2.5 py-1 text-xs font-bold uppercase ${ACTION_COLORS[log.action_type] ?? "bg-slate-100 text-slate-600"}`}>
                          {log.action_type.replace(/_/g, " ")}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-500 capitalize whitespace-nowrap">
                        {log.target_type.replace(/_/g, " ")}
                      </td>
                      <td className="px-4 py-3 max-w-xs">
                        <p className="truncate text-sm text-slate-600">{log.description}</p>
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-slate-400 whitespace-nowrap">
                        {log.ip_address ?? "—"}
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => setSelected(log)}
                          className="rounded-lg border border-slate-200 px-3 py-1 text-xs font-medium text-slate-600 hover:bg-slate-100"
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* PAGINATION */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-slate-200 px-6 py-4">
              <p className="text-sm text-slate-500">
                Page {page + 1} of {totalPages} — {total.toLocaleString()} total entries
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage(p => Math.max(0, p - 1))}
                  disabled={page === 0}
                  className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 disabled:opacity-40"
                >
                  Previous
                </button>
                <button
                  onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                  disabled={page >= totalPages - 1}
                  className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* DETAIL MODAL */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-8 shadow-2xl">
            <div className="mb-6 flex items-start justify-between">
              <h2 className="text-lg font-bold text-[#0B1F3A]">Audit Entry Detail</h2>
              <button onClick={() => setSelected(null)} className="rounded-lg p-2 hover:bg-slate-100">
                <svg className="h-5 w-5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="grid gap-4 rounded-xl bg-slate-50 p-5">
              {[
                ["Timestamp", formatDateTime(selected.created_at)],
                ["Actor", selected.actor_name],
                ["Role", selected.actor_role.replace(/_/g, " ")],
                ["Action", selected.action_type.replace(/_/g, " ").toUpperCase()],
                ["Target Type", selected.target_type.replace(/_/g, " ")],
                ["Target ID", selected.target_id ?? "—"],
                ["IP Address", selected.ip_address ?? "—"],
              ].map(([label, value]) => (
                <div key={label} className="flex justify-between gap-4 text-sm">
                  <span className="font-semibold text-slate-500">{label}</span>
                  <span className="text-right text-slate-700">{value}</span>
                </div>
              ))}
            </div>

            <div className="mt-4 rounded-xl border border-slate-200 bg-white p-4">
              <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">Description</p>
              <p className="mt-2 text-sm leading-6 text-slate-700">{selected.description}</p>
            </div>
          </div>
        </div>
      )}
    </AdminShell>
  );
}

// ── SECURITY ALERT BANNER ──────────────────────────────
function SecurityAlertBanner() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    async function check() {
      const supabase = getSupabase();
      const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const { count: c } = await supabase
        .from("login_attempts")
        .select("*", { count: "exact", head: true })
        .eq("success", false)
        .gte("attempted_at", since);
      setCount(c ?? 0);
    }
    check();
  }, []);

  if (count === 0) return null;

  return (
    <div className="mb-6 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-5">
      <svg className="mt-0.5 h-5 w-5 shrink-0 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
      <div>
        <p className="text-sm font-bold text-red-700">Security Alert — {count} Failed Login Attempt{count !== 1 ? "s" : ""} in the last 24 hours</p>
        <p className="mt-1 text-sm text-red-600">
          Unauthorised access attempts have been detected on the admin portal. Review the logs below and check if alsiiec048@gmail.com received a security alert email.
        </p>
      </div>
    </div>
  );
}

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString("en-IN", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit", second: "2-digit",
  });
}




