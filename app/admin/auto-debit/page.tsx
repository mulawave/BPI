"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import { format } from "date-fns";
import { Activity, AlertTriangle, ChevronLeft, ChevronRight, RefreshCw, Search, Settings } from "lucide-react";
import { api } from "@/client/trpc";

type Kind = "all" | "AUTO_DEBIT_FAILED" | "AUTO_CONTRIBUTE_FAILED";

const KIND_LABEL: Record<string, string> = {
  AUTO_DEBIT_FAILED: "Auto-Debit",
  AUTO_CONTRIBUTE_FAILED: "Auto-Contribute",
};

const naira = (n: number | null | undefined) => (n == null ? "—" : `₦${Number(n).toLocaleString()}`);

function PolicyCard() {
  const utils = api.useUtils();
  const { data: policy, isLoading } = api.csp.adminGetAutoDebitPolicy.useQuery();
  const [minPercentage, setMinPercentage] = useState(10);
  const [depositsEnabled, setDepositsEnabled] = useState(true);
  const [cspPayoutEnabled, setCspPayoutEnabled] = useState(true);

  useEffect(() => {
    if (!policy) return;
    setMinPercentage(policy.minPercentage);
    setDepositsEnabled(policy.depositsEnabled);
    setCspPayoutEnabled(policy.cspPayoutEnabled);
  }, [policy]);

  const save = api.csp.adminSaveAutoDebitPolicy.useMutation({
    onSuccess: () => {
      toast.success("Auto-Debit rules saved");
      utils.csp.adminGetAutoDebitPolicy.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  const changed =
    !!policy &&
    (policy.minPercentage !== minPercentage ||
      policy.depositsEnabled !== depositsEnabled ||
      policy.cspPayoutEnabled !== cspPayoutEnabled);

  return (
    <section className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-5 space-y-4">
      <div className="flex items-center gap-2">
        <Settings className="w-5 h-5 text-emerald-600" />
        <h2 className="font-semibold text-gray-900 dark:text-white">Auto-Debit rules</h2>
      </div>
      {isLoading ? (
        <div className="h-24 animate-pulse bg-gray-100 dark:bg-gray-700 rounded" />
      ) : (
        <div className="grid gap-4 md:grid-cols-3">
          <label className="block">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Compulsory minimum (%)</span>
            <input
              type="number"
              min={0}
              max={100}
              value={minPercentage}
              onChange={(e) => setMinPercentage(Math.min(100, Math.max(0, Math.round(Number(e.target.value) || 0))))}
              className="mt-1 w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-sm"
            />
            <span className="mt-1 block text-xs text-gray-500 dark:text-gray-400">
              Applied to every member&apos;s referral rewards and CSP sponsor share. Members may choose more. 0 makes
              Auto-Debit optional.
            </span>
          </label>
          <label className="flex items-start gap-3">
            <input type="checkbox" checked={depositsEnabled} onChange={(e) => setDepositsEnabled(e.target.checked)} className="mt-1" />
            <span>
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Allow Auto-Debit on deposits</span>
              <span className="block text-xs text-gray-500 dark:text-gray-400">
                Members choose whether it applies to their deposits. Switch off to stop it for everyone.
              </span>
            </span>
          </label>
          <label className="flex items-start gap-3">
            <input type="checkbox" checked={cspPayoutEnabled} onChange={(e) => setCspPayoutEnabled(e.target.checked)} className="mt-1" />
            <span>
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Apply to released CSP support</span>
              <span className="block text-xs text-gray-500 dark:text-gray-400">
                Auto-Debit the funds a beneficiary receives when their CSP campaign is released.
              </span>
            </span>
          </label>
        </div>
      )}
      <div className="flex justify-end">
        <button
          onClick={() => save.mutate({ minPercentage, depositsEnabled, cspPayoutEnabled })}
          disabled={!changed || save.isPending}
          className="px-4 py-2 rounded-lg bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700 disabled:opacity-50"
        >
          {save.isPending ? "Saving..." : "Save rules"}
        </button>
      </div>
    </section>
  );
}

export default function AdminAutoDebitPage() {
  const [kind, setKind] = useState<Kind>("all");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [page, setPage] = useState(1);

  useEffect(() => {
    const t = setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 300);
    return () => clearTimeout(t);
  }, [searchInput]);

  const { data, isLoading, refetch, isFetching } = api.csp.adminGetAutomationFailures.useQuery({
    kind,
    search: search || undefined,
    from: from || undefined,
    to: to || undefined,
    page,
    limit: 25,
  });

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 sm:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-1">
              <Link href="/admin" className="hover:text-gray-700 dark:hover:text-gray-200">Admin</Link>
              <span>/</span>
              <span className="text-gray-900 dark:text-white">Auto-Debit Alerts</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Activity className="w-6 h-6 text-emerald-600" />
              Auto-Debit &amp; Auto-Contribute Alerts
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Failed automatic transfers to Community Wallets and failed automatic CSP contributions.
            </p>
          </div>
          <button
            onClick={() => refetch()}
            className="self-start p-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 text-gray-600 dark:text-gray-300 ${isFetching ? "animate-spin" : ""}`} />
          </button>
        </div>

        {(data?.last24h ?? 0) > 0 && (
          <div className="flex items-center gap-2 p-3 rounded-lg border border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-800 dark:bg-amber-900/20 dark:text-amber-200 text-sm">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            {data?.last24h} failure{data?.last24h === 1 ? "" : "s"} in the last 24 hours.
          </div>
        )}

        <PolicyCard />

        <section className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl">
          <div className="p-4 grid gap-3 md:grid-cols-[1fr_auto_auto_auto] items-end border-b border-gray-200 dark:border-gray-700">
            <label className="block">
              <span className="text-xs text-gray-500 dark:text-gray-400">Search member or reason</span>
              <div className="relative mt-1">
                <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder="Name, email, username or reason"
                  className="w-full pl-9 pr-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-sm"
                />
              </div>
            </label>
            <label className="block">
              <span className="text-xs text-gray-500 dark:text-gray-400">Type</span>
              <select
                value={kind}
                onChange={(e) => { setKind(e.target.value as Kind); setPage(1); }}
                className="mt-1 w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-sm"
              >
                <option value="all">All</option>
                <option value="AUTO_DEBIT_FAILED">Auto-Debit</option>
                <option value="AUTO_CONTRIBUTE_FAILED">Auto-Contribute</option>
              </select>
            </label>
            <label className="block">
              <span className="text-xs text-gray-500 dark:text-gray-400">From</span>
              <input type="date" value={from} onChange={(e) => { setFrom(e.target.value); setPage(1); }} className="mt-1 w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-sm" />
            </label>
            <label className="block">
              <span className="text-xs text-gray-500 dark:text-gray-400">To</span>
              <input type="date" value={to} onChange={(e) => { setTo(e.target.value); setPage(1); }} className="mt-1 w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-sm" />
            </label>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-900/50 text-left text-xs uppercase text-gray-500 dark:text-gray-400">
                <tr>
                  <th className="px-4 py-3">When</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Member</th>
                  <th className="px-4 py-3">What happened</th>
                  <th className="px-4 py-3 text-right">Credit</th>
                  <th className="px-4 py-3 text-right">Cash / Community</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {isLoading ? (
                  <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-500">Loading…</td></tr>
                ) : (data?.rows.length ?? 0) === 0 ? (
                  <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-500">No failures match these filters.</td></tr>
                ) : (
                  data!.rows.map((r) => (
                    <tr key={r.id} className="align-top">
                      <td className="px-4 py-3 whitespace-nowrap text-gray-600 dark:text-gray-300">{format(new Date(r.createdAt), "dd MMM yyyy, HH:mm")}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${r.kind === "AUTO_DEBIT_FAILED" ? "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300" : "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300"}`}>
                          {KIND_LABEL[r.kind] ?? r.kind}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-900 dark:text-white">{r.user?.name || r.user?.username || "Unknown"}</div>
                        <div className="text-xs text-gray-500">{r.user?.email}</div>
                      </td>
                      <td className="px-4 py-3 text-gray-700 dark:text-gray-300">
                        <div>{r.reason}</div>
                        {r.context && <div className="text-xs text-gray-500">{r.context}</div>}
                      </td>
                      <td className="px-4 py-3 text-right whitespace-nowrap">{naira(r.amount)}</td>
                      <td className="px-4 py-3 text-right whitespace-nowrap text-gray-600 dark:text-gray-300">
                        {naira(r.user?.wallet)} / {naira(r.user?.community)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between p-4 border-t border-gray-200 dark:border-gray-700 text-sm text-gray-600 dark:text-gray-300">
            <span>{data?.total ?? 0} total</span>
            <div className="flex items-center gap-2">
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1} className="p-1.5 rounded border border-gray-200 dark:border-gray-700 disabled:opacity-40" aria-label="Previous page">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span>Page {page} of {data?.totalPages ?? 1}</span>
              <button onClick={() => setPage((p) => p + 1)} disabled={page >= (data?.totalPages ?? 1)} className="p-1.5 rounded border border-gray-200 dark:border-gray-700 disabled:opacity-40" aria-label="Next page">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
