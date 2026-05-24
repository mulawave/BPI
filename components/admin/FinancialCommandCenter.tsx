"use client";

import * as React from "react";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import { skipToken } from "@tanstack/react-query";
import {
  MdAccountBalance,
  MdAccountBalanceWallet,
  MdBuild,
  MdArrowDownward,
  MdArrowUpward,
  MdChecklist,
  MdErrorOutline,
  MdFilterAlt,
  MdHub,
  MdOutlineManageSearch,
  MdRefresh,
  MdTimeline,
  MdTrendingDown,
  MdTrendingUp,
  MdWarningAmber,
} from "react-icons/md";
import { api } from "@/client/trpc";
import { useCurrency } from "@/contexts/CurrencyContext";

const SOURCE_OPTIONS = [
  "ALL",
  "DEPOSITS",
  "MEMBERSHIP",
  "WITHDRAWALS",
  "REWARDS",
  "CSP",
  "BPT",
  "FEES",
  "OTHER",
] as const;

function toInputDate(d: Date) {
  return d.toISOString().slice(0, 10);
}

function StatCard({
  title,
  value,
  hint,
  icon,
  tone,
}: {
  title: string;
  value: string;
  hint: string;
  icon: React.ReactNode;
  tone: "positive" | "neutral" | "warning" | "danger";
}) {
  const toneClasses = {
    positive: "from-emerald-500/20 to-green-500/10 border-emerald-500/25",
    neutral: "from-blue-500/15 to-cyan-500/10 border-blue-500/25",
    warning: "from-amber-500/20 to-orange-500/10 border-amber-500/30",
    danger: "from-red-500/20 to-rose-500/10 border-red-500/30",
  } as const;

  return (
    <motion.div
      whileHover={{ y: -3, scale: 1.01 }}
      className={`rounded-2xl border bg-gradient-to-br p-4 backdrop-blur-sm ${toneClasses[tone]}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-wider text-muted-foreground">{title}</p>
          <p className="mt-1 text-2xl font-bold text-foreground">{value}</p>
          <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
        </div>
        <div className="rounded-xl border border-border/60 bg-background/70 p-2">{icon}</div>
      </div>
    </motion.div>
  );
}

export default function FinancialCommandCenter() {
  const { formatAmount } = useCurrency();

  const [dateTo, setDateTo] = React.useState<string>(() => toInputDate(new Date()));
  const [dateFrom, setDateFrom] = React.useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return toInputDate(d);
  });
  const [search, setSearch] = React.useState("");
  const [activeSource, setActiveSource] = React.useState<(typeof SOURCE_OPTIONS)[number]>("ALL");
  const [page, setPage] = React.useState(1);
  const [selectedUserId, setSelectedUserId] = React.useState<string | null>(null);
  const [selectedLedgerTx, setSelectedLedgerTx] = React.useState<{
    id: string;
    userId: string;
    transactionType: string;
    reference: string | null;
    walletType: string;
    absoluteAmount: number;
  } | null>(null);
  const [remediationAction, setRemediationAction] = React.useState<"REVERSE" | "ADJUST">("REVERSE");
  const [remediationReason, setRemediationReason] = React.useState("");
  const [adjustmentAmount, setAdjustmentAmount] = React.useState("");

  const command = api.adminFinancial.getFinancialCommandCenter.useQuery(
    {
      dateFrom: new Date(dateFrom),
      dateTo: new Date(dateTo),
      source: activeSource,
      search: search.trim() || undefined,
      page,
      pageSize: 25,
    }
  );

  const userTrace = api.adminFinancial.getUserFinancialTrace.useQuery(
    selectedUserId
      ? {
          userId: selectedUserId,
          dateFrom: new Date(dateFrom),
          dateTo: new Date(dateTo),
          limit: 80,
        }
      : skipToken
  );

  const remediateMutation = api.adminFinancial.reverseOrAdjustLedgerEntry.useMutation({
    onSuccess: async (res) => {
      toast.success(
        `${res.action === "REVERSE" ? "Reversal" : "Adjustment"} posted: ${res.delta > 0 ? "+" : ""}${formatAmount(
          Math.abs(res.delta),
        )}`,
      );
      setRemediationReason("");
      setAdjustmentAmount("");
      await Promise.all([command.refetch(), userTrace.refetch()]);
    },
    onError: (err) => {
      toast.error(err.message || "Failed to post remediation");
    },
  });
  const remediationBusy = remediateMutation.status === "pending";

  React.useEffect(() => {
    if (command.error) {
      toast.error(command.error.message || "Failed to load financial command center");
    }
  }, [command.error]);

  React.useEffect(() => {
    if (userTrace.error) {
      toast.error(userTrace.error.message || "Failed to load user financial trace");
    }
  }, [userTrace.error]);

  const data = command.data;
  const ledgerPages = data ? Math.max(1, Math.ceil(data.ledger.total / data.ledger.pageSize)) : 1;

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="relative overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-card via-[hsl(var(--muted))] to-card p-6 shadow-xl"
      >
        <div className="absolute -top-28 -right-20 h-56 w-56 rounded-full bg-gradient-to-br from-[hsl(var(--primary))] to-[hsl(var(--secondary))] opacity-10 blur-3xl" />
        <div className="relative flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h2 className="text-2xl font-bold">Financial Command Center</h2>
            <p className="text-sm text-muted-foreground">
              End-to-end accounting visibility across ledger, wallets, queues, CSP flows, reserve pools, and user-level traceability.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-2 rounded-xl border border-border/70 bg-background/80 px-3 py-2">
              <MdFilterAlt className="h-4 w-4 text-muted-foreground" />
              <input
                type="date"
                className="bg-transparent text-sm outline-none"
                value={dateFrom}
                onChange={(e) => {
                  setPage(1);
                  setDateFrom(e.target.value);
                }}
              />
              <span className="text-xs text-muted-foreground">to</span>
              <input
                type="date"
                className="bg-transparent text-sm outline-none"
                value={dateTo}
                onChange={(e) => {
                  setPage(1);
                  setDateTo(e.target.value);
                }}
              />
            </div>
            <select
              value={activeSource}
              onChange={(e) => {
                setPage(1);
                setActiveSource(e.target.value as (typeof SOURCE_OPTIONS)[number]);
              }}
              className="rounded-xl border border-border/70 bg-background/80 px-3 py-2 text-sm"
            >
              {SOURCE_OPTIONS.map((source) => (
                <option key={source} value={source}>
                  {source}
                </option>
              ))}
            </select>
            <div className="flex items-center gap-2 rounded-xl border border-border/70 bg-background/80 px-3 py-2">
              <MdOutlineManageSearch className="h-4 w-4 text-muted-foreground" />
              <input
                value={search}
                onChange={(e) => {
                  setPage(1);
                  setSearch(e.target.value);
                }}
                placeholder="Search tx type, ref, user"
                className="w-44 bg-transparent text-sm outline-none"
              />
            </div>
            <button
              onClick={async () => {
                const id = toast.loading("Refreshing financial surfaces...");
                try {
                  await Promise.all([command.refetch(), userTrace.refetch()]);
                  toast.success("Financial data refreshed");
                } finally {
                  toast.dismiss(id);
                }
              }}
              className="inline-flex items-center gap-2 rounded-xl border border-border/70 bg-background/80 px-3 py-2 text-sm hover:bg-muted"
            >
              <MdRefresh className="h-4 w-4" /> Refresh
            </button>
          </div>
        </div>
      </motion.div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Total Inflows"
          value={formatAmount(data?.summary.inflows || 0)}
          hint="Completed credited flows"
          tone="positive"
          icon={<MdArrowDownward className="h-5 w-5 text-emerald-500" />}
        />
        <StatCard
          title="Total Outflows"
          value={formatAmount(data?.summary.outflows || 0)}
          hint="Completed debits and payouts"
          tone="warning"
          icon={<MdArrowUpward className="h-5 w-5 text-amber-500" />}
        />
        <StatCard
          title="Net Flow"
          value={formatAmount(data?.summary.netFlow || 0)}
          hint="Inflow minus outflow"
          tone={(data?.summary.netFlow || 0) >= 0 ? "neutral" : "danger"}
          icon={(data?.summary.netFlow || 0) >= 0 ? <MdTrendingUp className="h-5 w-5 text-blue-500" /> : <MdTrendingDown className="h-5 w-5 text-red-500" />}
        />
        <StatCard
          title="Unresolved Items"
          value={(data?.summary.unresolvedItems || 0).toLocaleString()}
          hint="Pending payments, withdrawals, distributions"
          tone={(data?.summary.unresolvedItems || 0) > 0 ? "danger" : "positive"}
          icon={<MdChecklist className="h-5 w-5 text-rose-500" />}
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <div className="xl:col-span-2 rounded-2xl border border-border bg-card/75 p-4 backdrop-blur-xl">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="flex items-center gap-2 text-lg font-semibold">
              <MdTimeline className="h-5 w-5 text-primary" /> Ledger Forensics
            </h3>
            <div className="text-xs text-muted-foreground">
              {data ? `${data.ledger.total.toLocaleString()} records` : "Loading..."}
            </div>
          </div>

          <div className="overflow-x-auto rounded-xl border border-border/70">
            <table className="min-w-full text-sm">
              <thead className="bg-muted/60 text-left text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-3 py-2">Time</th>
                  <th className="px-3 py-2">User</th>
                  <th className="px-3 py-2">Source</th>
                  <th className="px-3 py-2">Type</th>
                  <th className="px-3 py-2">Wallet</th>
                  <th className="px-3 py-2 text-right">Amount</th>
                  <th className="px-3 py-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {command.isLoading && (
                  <tr>
                    <td className="px-3 py-6 text-center text-muted-foreground" colSpan={7}>
                      Loading ledger data...
                    </td>
                  </tr>
                )}
                {!command.isLoading && data?.ledger.items.length === 0 && (
                  <tr>
                    <td className="px-3 py-6 text-center text-muted-foreground" colSpan={7}>
                      No transactions matched this filter set.
                    </td>
                  </tr>
                )}
                {data?.ledger.items.map((tx) => (
                  <tr
                    key={tx.id}
                    className="border-t border-border/60 hover:bg-muted/40"
                    onClick={() => setSelectedUserId(tx.userId)}
                  >
                    <td className="px-3 py-2 text-xs text-muted-foreground">{new Date(tx.createdAt).toLocaleString()}</td>
                    <td className="px-3 py-2">
                      <div className="font-medium">{tx.User?.name || "Unknown"}</div>
                      <div className="text-xs text-muted-foreground">{tx.User?.email || tx.userId}</div>
                    </td>
                    <td className="px-3 py-2">
                      <span className="rounded-full border border-border/70 bg-background/70 px-2 py-0.5 text-xs">{tx.source}</span>
                    </td>
                    <td className="px-3 py-2">
                      <div className="font-mono text-xs">{tx.transactionType}</div>
                      <div className="max-w-[220px] truncate text-xs text-muted-foreground">{tx.description || "-"}</div>
                    </td>
                    <td className="px-3 py-2 text-xs text-muted-foreground">{tx.walletType}</td>
                    <td className="px-3 py-2 text-right">
                      <span
                        className={
                          tx.direction === "INFLOW"
                            ? "font-semibold text-emerald-600 dark:text-emerald-400"
                            : tx.direction === "OUTFLOW"
                              ? "font-semibold text-rose-600 dark:text-rose-400"
                              : "font-semibold text-muted-foreground"
                        }
                      >
                        {tx.direction === "INFLOW" ? "+" : tx.direction === "OUTFLOW" ? "-" : ""}
                        {formatAmount(tx.absoluteAmount)}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedLedgerTx({
                            id: tx.id,
                            userId: tx.userId,
                            transactionType: tx.transactionType,
                            reference: tx.reference || null,
                            walletType: tx.walletType,
                            absoluteAmount: tx.absoluteAmount,
                          });
                          setSelectedUserId(tx.userId);
                        }}
                        className="inline-flex items-center gap-1 rounded-lg border border-border/70 bg-background/80 px-2 py-1 text-xs hover:bg-muted"
                      >
                        <MdBuild className="h-3.5 w-3.5" /> Reverse / Adjust
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
            <span>
              Page {data?.ledger.page || page} of {ledgerPages}
            </span>
            <div className="flex items-center gap-2">
              <button
                className="rounded-lg border border-border/70 px-2 py-1 disabled:opacity-40"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Prev
              </button>
              <button
                className="rounded-lg border border-border/70 px-2 py-1 disabled:opacity-40"
                disabled={page >= ledgerPages}
                onClick={() => setPage((p) => Math.min(ledgerPages, p + 1))}
              >
                Next
              </button>
            </div>
          </div>

          <div className="mt-4 rounded-xl border border-border/70 bg-background/60 p-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold">Ledger Remediation Console</p>
                {!selectedLedgerTx ? (
                  <p className="text-xs text-muted-foreground">Pick a row and click Reverse / Adjust to remediate suspicious entries.</p>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    Target: {selectedLedgerTx.transactionType} | Ref: {selectedLedgerTx.reference || selectedLedgerTx.id} | Wallet: {selectedLedgerTx.walletType}
                  </p>
                )}
              </div>
              {selectedLedgerTx && (
                <button
                  onClick={() => {
                    setSelectedLedgerTx(null);
                    setRemediationReason("");
                    setAdjustmentAmount("");
                    setRemediationAction("REVERSE");
                  }}
                  className="rounded-lg border border-border/70 px-2 py-1 text-xs hover:bg-muted"
                >
                  Clear
                </button>
              )}
            </div>

            {selectedLedgerTx && (
              <div className="mt-3 grid gap-3 md:grid-cols-4">
                <div className="md:col-span-1 space-y-2">
                  <label className="text-xs font-semibold text-muted-foreground">Action</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => setRemediationAction("REVERSE")}
                      className={`rounded-lg border px-2 py-1 text-xs ${
                        remediationAction === "REVERSE" ? "bg-rose-500/10 border-rose-500/40 text-rose-600 dark:text-rose-400" : "border-border/70"
                      }`}
                    >
                      Reverse
                    </button>
                    <button
                      onClick={() => setRemediationAction("ADJUST")}
                      className={`rounded-lg border px-2 py-1 text-xs ${
                        remediationAction === "ADJUST" ? "bg-amber-500/10 border-amber-500/40 text-amber-700 dark:text-amber-300" : "border-border/70"
                      }`}
                    >
                      Adjust
                    </button>
                  </div>
                </div>

                <div className="md:col-span-1 space-y-2">
                  <label className="text-xs font-semibold text-muted-foreground">Adjustment Amount</label>
                  <input
                    type="number"
                    step="0.01"
                    disabled={remediationAction !== "ADJUST"}
                    value={adjustmentAmount}
                    onChange={(e) => setAdjustmentAmount(e.target.value)}
                    placeholder="e.g. -2500 or 2500"
                    className="w-full rounded-lg border border-border/70 bg-background px-2 py-1.5 text-xs disabled:opacity-50"
                  />
                  <p className="text-[10px] text-muted-foreground">Use signed value: negative debits, positive credits.</p>
                </div>

                <div className="md:col-span-2 space-y-2">
                  <label className="text-xs font-semibold text-muted-foreground">Reason (required)</label>
                  <textarea
                    value={remediationReason}
                    onChange={(e) => setRemediationReason(e.target.value)}
                    rows={3}
                    placeholder="Document why this remediation is needed for audit integrity..."
                    className="w-full rounded-lg border border-border/70 bg-background px-2 py-1.5 text-xs"
                  />
                  <div className="flex justify-end">
                    <button
                      disabled={
                        remediationBusy ||
                        remediationReason.trim().length < 10 ||
                        (remediationAction === "ADJUST" && (!adjustmentAmount || Number(adjustmentAmount) === 0))
                      }
                      onClick={async () => {
                        await remediateMutation.mutateAsync({
                          transactionId: selectedLedgerTx.id,
                          action: remediationAction,
                          reason: remediationReason.trim(),
                          adjustmentAmount: remediationAction === "ADJUST" ? Number(adjustmentAmount) : undefined,
                        });
                      }}
                      className="rounded-lg border border-border/70 bg-foreground px-3 py-1.5 text-xs font-semibold text-background hover:opacity-90 disabled:opacity-40"
                    >
                      {remediationBusy ? "Applying..." : remediationAction === "REVERSE" ? "Apply Reversal" : "Apply Adjustment"}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-2xl border border-border bg-card/75 p-4">
            <h3 className="flex items-center gap-2 text-sm font-semibold">
              <MdHub className="h-4 w-4 text-primary" /> Source Breakdown
            </h3>
            <div className="mt-3 space-y-2">
              {data?.sourceBreakdown.map((row) => {
                const total = row.inflow + row.outflow || 1;
                const inflowPct = Math.round((row.inflow / total) * 100);
                return (
                  <div key={row.source} className="rounded-xl border border-border/60 bg-background/60 p-3">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold">{row.source}</span>
                      <span className="text-muted-foreground">{row.count} txns</span>
                    </div>
                    <div className="mt-1 text-xs text-muted-foreground">
                      In: {formatAmount(row.inflow)} | Out: {formatAmount(row.outflow)}
                    </div>
                    <div className="mt-2 h-2 overflow-hidden rounded-full bg-border">
                      <div className="h-full bg-gradient-to-r from-emerald-500 to-blue-500" style={{ width: `${inflowPct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card/75 p-4">
            <h3 className="flex items-center gap-2 text-sm font-semibold">
              <MdAccountBalanceWallet className="h-4 w-4 text-primary" /> Wallet & Reserve Snapshot
            </h3>
            <div className="mt-3 space-y-2 text-xs">
              <div className="flex justify-between"><span>Main</span><span>{formatAmount(data?.walletSnapshot.main || 0)}</span></div>
              <div className="flex justify-between"><span>Spendable</span><span>{formatAmount(data?.walletSnapshot.spendable || 0)}</span></div>
              <div className="flex justify-between"><span>Community</span><span>{formatAmount(data?.walletSnapshot.community || 0)}</span></div>
              <div className="flex justify-between"><span>Shareholder</span><span>{formatAmount(data?.walletSnapshot.shareholder || 0)}</span></div>
              <div className="flex justify-between"><span>BPT</span><span>{(data?.walletSnapshot.bpt || 0).toLocaleString()}</span></div>
              <div className="my-2 border-t border-border/70" />
              <div className="flex justify-between"><span>Company Reserve</span><span>{formatAmount(data?.reserveSnapshot.companyReserveBalance || 0)}</span></div>
              <div className="flex justify-between"><span>Strategic Pools</span><span>{formatAmount(data?.reserveSnapshot.strategicPoolsBalance || 0)}</span></div>
              <div className="flex justify-between"><span>Executive Wallet</span><span>{formatAmount(data?.reserveSnapshot.executiveWalletBalance || 0)}</span></div>
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card/75 p-4">
            <h3 className="flex items-center gap-2 text-sm font-semibold">
              <MdAccountBalance className="h-4 w-4 text-primary" /> CSP & Queue Health
            </h3>
            <div className="mt-3 space-y-2 text-xs">
              <div className="flex justify-between"><span>CSP Requests</span><span>{(data?.cspSnapshot.requestsInRange || 0).toLocaleString()}</span></div>
              <div className="flex justify-between"><span>CSP Raised</span><span>{formatAmount(data?.cspSnapshot.totalRaisedAmount || 0)}</span></div>
              <div className="flex justify-between"><span>CSP Contributions</span><span>{formatAmount(data?.cspSnapshot.contributionsAmountInRange || 0)}</span></div>
              <div className="my-2 border-t border-border/70" />
              <div className="flex justify-between"><span>Pending Payments</span><span>{(data?.summary.pendingPayments || 0).toLocaleString()}</span></div>
              <div className="flex justify-between"><span>Pending Withdrawals</span><span>{(data?.summary.pendingWithdrawals || 0).toLocaleString()}</span></div>
              <div className="flex justify-between"><span>Pending Pool Distributions</span><span>{(data?.summary.pendingPoolDistributions || 0).toLocaleString()}</span></div>
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card/75 p-4">
            <h3 className="flex items-center gap-2 text-sm font-semibold">
              <MdWarningAmber className="h-4 w-4 text-amber-500" /> Anomalies
            </h3>
            <div className="mt-3 space-y-2 text-xs">
              <div className="flex items-center justify-between rounded-lg border border-border/60 bg-background/60 px-2 py-1">
                <span className="inline-flex items-center gap-1"><MdErrorOutline className="h-3 w-3 text-rose-500" /> Negative Wallet Users</span>
                <span className="font-semibold">{(data?.summary.negativeWalletUsers || 0).toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between rounded-lg border border-border/60 bg-background/60 px-2 py-1">
                <span className="inline-flex items-center gap-1"><MdChecklist className="h-3 w-3 text-amber-500" /> Total Unresolved</span>
                <span className="font-semibold">{(data?.summary.unresolvedItems || 0).toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card/75 p-4 backdrop-blur-xl">
        <h3 className="text-lg font-semibold">User Source-to-Destination Trace</h3>
        {!selectedUserId && (
          <p className="mt-2 text-sm text-muted-foreground">
            Select a ledger row to load a user-level audit trace, including timeline, pending queues, and source totals.
          </p>
        )}
        {selectedUserId && userTrace.isLoading && (
          <p className="mt-2 text-sm text-muted-foreground">Loading trace for {selectedUserId}...</p>
        )}
        {userTrace.data && (
          <div className="mt-3 grid gap-4 xl:grid-cols-3">
            <div className="xl:col-span-1 space-y-3 rounded-xl border border-border/70 bg-background/70 p-3">
              <div>
                <p className="text-sm font-semibold">{userTrace.data.user.name || "Unnamed User"}</p>
                <p className="text-xs text-muted-foreground">{userTrace.data.user.email || userTrace.data.user.id}</p>
              </div>
              <div className="space-y-1 text-xs">
                <div className="flex justify-between"><span>Inflow</span><span>{formatAmount(userTrace.data.summary.inflowTotal)}</span></div>
                <div className="flex justify-between"><span>Outflow</span><span>{formatAmount(userTrace.data.summary.outflowTotal)}</span></div>
                <div className="flex justify-between"><span>Net</span><span>{formatAmount(userTrace.data.summary.netFlow)}</span></div>
                <div className="flex justify-between"><span>Pending Payments</span><span>{userTrace.data.summary.pendingPaymentsCount}</span></div>
                <div className="flex justify-between"><span>Pending Withdrawals</span><span>{userTrace.data.summary.pendingWithdrawalsCount}</span></div>
              </div>
              <div className="border-t border-border/70 pt-2">
                <p className="text-xs font-semibold text-muted-foreground">Current Wallets</p>
                <div className="mt-1 space-y-1 text-xs">
                  <div className="flex justify-between"><span>Main</span><span>{formatAmount(userTrace.data.user.wallet || 0)}</span></div>
                  <div className="flex justify-between"><span>Community</span><span>{formatAmount(userTrace.data.user.community || 0)}</span></div>
                  <div className="flex justify-between"><span>Shareholder</span><span>{formatAmount(userTrace.data.user.shareholder || 0)}</span></div>
                  <div className="flex justify-between"><span>BPT</span><span>{(userTrace.data.user.bpiTokenWallet || 0).toLocaleString()}</span></div>
                </div>
              </div>
            </div>

            <div className="xl:col-span-2 rounded-xl border border-border/70 bg-background/70 p-3">
              <div className="mb-2 flex items-center justify-between">
                <p className="text-sm font-semibold">Timeline</p>
                <span className="text-xs text-muted-foreground">{userTrace.data.summary.transactionCount} entries</span>
              </div>
              <div className="max-h-[360px] space-y-2 overflow-auto">
                {userTrace.data.timeline.map((tx) => (
                  <div key={tx.id} className="rounded-lg border border-border/60 bg-card/80 p-2 text-xs">
                    <div className="flex items-center justify-between gap-3">
                      <div className="font-mono">{tx.transactionType}</div>
                      <div className="text-muted-foreground">{new Date(tx.createdAt).toLocaleString()}</div>
                    </div>
                    <div className="mt-1 flex items-center justify-between gap-3">
                      <div className="truncate text-muted-foreground">{tx.description || "-"}</div>
                      <div className={tx.direction === "INFLOW" ? "font-semibold text-emerald-600 dark:text-emerald-400" : tx.direction === "OUTFLOW" ? "font-semibold text-rose-600 dark:text-rose-400" : "font-semibold text-muted-foreground"}>
                        {tx.direction === "INFLOW" ? "+" : tx.direction === "OUTFLOW" ? "-" : ""}
                        {formatAmount(tx.absoluteAmount)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
