"use client";

import React, { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { api } from "@/client/trpc";
import type { inferRouterOutputs } from "@trpc/server";
import type { AppRouter } from "@/server/trpc/router/_app";
import toast from "react-hot-toast";
import {
  RadioTower,
  RefreshCw,
  Search,
  Clock3,
  Users,
  ShieldCheck,
  Sparkles,
  ArrowUpRight,
  TimerReset,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";

type RouterOutputs = inferRouterOutputs<AppRouter>;
type AdminQueue = RouterOutputs["csp"]["adminListRequests"];
type QueueItem = {
  id: string;
  userId: string;
  category: string;
  amount: number;
  purpose: string;
  thresholdAmount: number;
  raisedAmount: number;
  contributorsCount: number;
  createdAt: Date;
  broadcastExpiresAt: Date | null;
  status: StatusKey;
  User?: { id: string; name: string | null; email: string | null } | null;
};

type StatusKey = "pending" | "approved" | "broadcasting" | "closed" | "rejected";

const statusChip: Record<StatusKey, { label: string; tone: string }> = {
  pending: { label: "Pending", tone: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-200" },
  approved: { label: "Approved", tone: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200" },
  broadcasting: { label: "Broadcasting", tone: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-200" },
  closed: { label: "Closed", tone: "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-100" },
  rejected: { label: "Rejected", tone: "bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-200" },
};

function statusBadge(status: StatusKey) {
  const tone = statusChip[status] ?? statusChip.pending;
  return <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold ${tone.tone}`}>{tone.label}</span>;
}

function formatAmount(ngn: number) {
  return ngn.toLocaleString();
}

function getCountdown(request: QueueItem) {
  if (!request.broadcastExpiresAt) return "--";
  const ms = new Date(request.broadcastExpiresAt).getTime() - Date.now();
  if (ms <= 0) return "Expired";
  const hrs = Math.floor(ms / (1000 * 60 * 60));
  const mins = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
  return `${hrs}h ${mins}m`;
}

export default function CspAdminQueuePage() {
  const [page, setPage] = useState(1);
  const pageSize = 15;
  const [statuses, setStatuses] = useState<StatusKey[]>(["pending", "approved", "broadcasting"]);
  const [search, setSearch] = useState("");
  const [approveTarget, setApproveTarget] = useState<QueueItem | null>(null);
  const [extendTarget, setExtendTarget] = useState<QueueItem | null>(null);
  const [extendHours, setExtendHours] = useState(24);
  const [extendReason, setExtendReason] = useState<"paid" | "referrals">("paid");
  const [extendValue, setExtendValue] = useState<number | undefined>(undefined);

  const { data, isLoading, refetch } = api.csp.adminListRequests.useQuery({
    status: statuses,
    page,
    pageSize,
  });

  const approveMutation = api.csp.approveRequest.useMutation({
    onSuccess: (res) => {
      toast.success("Request approved and broadcast started");
      setApproveTarget(null);
      refetch();
    },
    onError: (err) => toast.error(err.message),
  });

  const extendMutation = api.csp.extendBroadcast.useMutation({
    onSuccess: () => {
      toast.success("Broadcast extended");
      setExtendTarget(null);
      refetch();
    },
    onError: (err) => toast.error(err.message),
  });

  const items = (data?.items ?? []) as unknown as QueueItem[];

  const aggregates = useMemo(() => {
    const total = data?.total ?? 0;
    const pending = items.filter((r) => r.status === "pending").length;
    const live = items.filter((r) => r.status === "broadcasting").length;
    const approved = items.filter((r) => r.status === "approved").length;
    return { total, pending, live, approved };
  }, [data?.total, items]);

  const filteredItems = useMemo(() => {
    if (!search.trim()) return items;
    const term = search.toLowerCase();
    return items.filter((item) => {
      const userStr = `${item.User?.name ?? ""} ${item.User?.email ?? ""}`.toLowerCase();
      return userStr.includes(term) || item.category.toLowerCase().includes(term) || (item.status ?? "").toLowerCase().includes(term);
    });
  }, [items, search]);

  return (
    <div className="space-y-6 pb-12">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-emerald-600 via-emerald-700 to-emerald-900 p-8 text-white shadow-xl"
      >
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="space-y-2">
            <p className="text-sm uppercase tracking-[0.18em] text-white/70">CSP Live Queue</p>
            <h1 className="text-3xl font-bold leading-tight">Approve, broadcast, and extend CSP support requests</h1>
            <p className="max-w-2xl text-white/80 text-sm">Only Community or Cash wallets fund CSP; review eligibility, start broadcasts, and manage countdowns from this panel.</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => refetch()}
              className="flex items-center gap-2 rounded-xl border border-white/30 bg-white/10 px-4 py-2 text-sm font-semibold backdrop-blur hover:bg-white/15"
            >
              <RefreshCw className="h-4 w-4" /> Refresh
            </button>
            <span className="flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-4 py-2 text-sm">
              <RadioTower className="h-4 w-4" />
              <span>{aggregates.live} live / {aggregates.pending} pending</span>
            </span>
          </div>
        </div>
      </motion.div>

      <div className="grid gap-4 md:grid-cols-4">
        <StatCard icon={Sparkles} label="Total in scope" value={aggregates.total} tone="from-emerald-500 to-emerald-600" />
        <StatCard icon={AlertCircle} label="Pending approval" value={aggregates.pending} tone="from-amber-500 to-amber-600" />
        <StatCard icon={RadioTower} label="Broadcasting" value={aggregates.live} tone="from-cyan-500 to-blue-600" />
        <StatCard icon={CheckCircle2} label="Prepped (approved)" value={aggregates.approved} tone="from-indigo-500 to-purple-600" />
      </div>

      <div className="flex flex-col gap-3 rounded-2xl border border-border bg-card/70 p-4 shadow-sm backdrop-blur">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-wrap gap-2">
            {(["pending", "approved", "broadcasting", "closed"] as StatusKey[]).map((status) => {
              const active = statuses.includes(status);
              return (
                <button
                  key={status}
                  onClick={() =>
                    setStatuses((prev) =>
                      prev.includes(status)
                        ? prev.filter((s) => s !== status)
                        : [...prev, status]
                    )
                  }
                  className={`rounded-full border px-3 py-1 text-xs font-semibold transition ${
                    active ? "border-emerald-500 bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-200" : "border-border text-muted-foreground"
                  }`}
                >
                  {statusChip[status].label}
                </button>
              );
            })}
          </div>
          <div className="flex items-center gap-2 rounded-xl border border-border bg-background px-3 py-2 text-sm">
            <Search className="h-4 w-4 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by member or status"
              className="w-52 bg-transparent text-sm outline-none"
            />
          </div>
        </div>

        <div className="overflow-hidden rounded-xl border border-border shadow-sm">
          <div className="grid grid-cols-12 bg-muted/50 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            <div className="col-span-3">Member</div>
            <div className="col-span-2">Request</div>
            <div className="col-span-2">Progress</div>
            <div className="col-span-2">Countdown</div>
            <div className="col-span-1">Status</div>
            <div className="col-span-2 text-right">Actions</div>
          </div>
          <div className="divide-y divide-border bg-card/70">
            {isLoading && (
              <div className="p-6 text-sm text-muted-foreground">Loading queue...</div>
            )}
            {!isLoading && filteredItems.length === 0 && (
              <div className="p-6 text-sm text-muted-foreground">No requests match the selected filters.</div>
            )}
            {filteredItems.map((item) => {
              const raised = item.raisedAmount ?? 0;
              const threshold = item.thresholdAmount ?? item.amount;
              const pct = Math.min(100, Math.round((raised / threshold) * 100));
              const user = item.User ?? null;
              const contributors = item.contributorsCount ?? 0;
              const created = format(new Date(item.createdAt), "MMM d, yyyy");
              return (
                <div key={item.id} className="grid grid-cols-12 items-center px-4 py-3 gap-2">
                  <div className="col-span-3 space-y-1">
                    <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                      <ShieldCheck className="h-4 w-4 text-emerald-600" />
                      <span>{user?.name ?? "Unknown"}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">{user?.email ?? "No email"}</p>
                    <p className="text-[11px] text-muted-foreground">Created {created}</p>
                  </div>

                  <div className="col-span-2 space-y-1 text-sm">
                    <div className="flex items-center gap-2">
                      <span className="rounded-full bg-emerald-50 px-2 py-1 text-[11px] font-semibold uppercase text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-200">
                        {item.category}
                      </span>
                      <span className="text-muted-foreground">₦{formatAmount(item.amount)}</span>
                    </div>
                    <p className="text-[11px] text-muted-foreground">Purpose: {item.purpose}</p>
                  </div>

                  <div className="col-span-2 space-y-2">
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>₦{formatAmount(raised)} / ₦{formatAmount(threshold)}</span>
                      <span>{pct}%</span>
                    </div>
                    <div className="h-2 rounded-full bg-muted">
                      <div className="h-2 rounded-full bg-emerald-500" style={{ width: `${pct}%` }} />
                    </div>
                    <p className="flex items-center gap-1 text-[11px] text-muted-foreground"><Users className="h-3 w-3" /> {contributors} contributors</p>
                  </div>

                  <div className="col-span-2 text-sm text-foreground">
                    <div className="flex items-center gap-2">
                      <Clock3 className="h-4 w-4 text-muted-foreground" />
                      <span>{getCountdown(item)}</span>
                    </div>
                    {item.broadcastExpiresAt && (
                      <p className="text-[11px] text-muted-foreground">Ends {formatDistanceToNow(new Date(item.broadcastExpiresAt), { addSuffix: true })}</p>
                    )}
                  </div>

                  <div className="col-span-1">
                    {statusBadge(item.status as StatusKey)}
                  </div>

                  <div className="col-span-2 flex items-center justify-end gap-2">
                    {item.status === "pending" && (
                      <button
                        onClick={() => setApproveTarget(item)}
                        className="flex items-center gap-1 rounded-lg border border-emerald-500 px-3 py-1 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-50 dark:text-emerald-200 dark:hover:bg-emerald-900/20"
                      >
                        <Sparkles className="h-4 w-4" /> Approve
                      </button>
                    )}
                    {item.status === "broadcasting" && (
                      <button
                        onClick={() => setExtendTarget(item)}
                        className="flex items-center gap-1 rounded-lg border border-blue-500 px-3 py-1 text-xs font-semibold text-blue-700 transition hover:bg-blue-50 dark:text-blue-200 dark:hover:bg-blue-900/20"
                      >
                        <TimerReset className="h-4 w-4" /> Extend
                      </button>
                    )}
                    <button
                      onClick={() => toast("Coming soon: export & detail view")}
                      className="flex items-center gap-1 rounded-lg border border-border px-3 py-1 text-xs font-semibold text-foreground/80 transition hover:bg-muted"
                    >
                      <ArrowUpRight className="h-4 w-4" /> Open
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {data && (
          <div className="flex items-center justify-between text-xs text-muted-foreground pt-3">
            <span>
              Page {data.page} of {Math.max(1, Math.ceil((data.total ?? 0) / pageSize))}
            </span>
            <div className="flex gap-2">
              <button
                disabled={page === 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="rounded-lg border border-border px-3 py-1 disabled:opacity-50"
              >
                Prev
              </button>
              <button
                disabled={items.length < pageSize}
                onClick={() => setPage((p) => p + 1)}
                className="rounded-lg border border-border px-3 py-1 disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {approveTarget && (
        <ModalShell onClose={() => setApproveTarget(null)}>
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-foreground">Approve & start broadcast</h3>
            <p className="text-sm text-muted-foreground">This will set status to broadcasting and start the default window based on category rules.</p>
            <div className="rounded-xl border border-border bg-muted/40 p-4 text-sm">
              <p className="font-semibold text-foreground">{approveTarget.User?.name ?? "Member"}</p>
              <p className="text-muted-foreground">{approveTarget.category} • ₦{formatAmount(approveTarget.amount)}</p>
            </div>
            <button
              onClick={() => approveMutation.mutate({ requestId: approveTarget.id })}
              disabled={approveMutation.isPending}
              className="w-full rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-emerald-700 disabled:opacity-60"
            >
              {approveMutation.isPending ? "Approving..." : "Approve & broadcast"}
            </button>
            <button
              onClick={() => setApproveTarget(null)}
              className="w-full rounded-lg border border-border px-4 py-2 text-sm font-semibold text-foreground/80"
            >
              Cancel
            </button>
          </div>
        </ModalShell>
      )}

      {extendTarget && (
        <ModalShell onClose={() => setExtendTarget(null)}>
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-foreground">Extend broadcast</h3>
            <p className="text-sm text-muted-foreground">Record an extension and push the expiry forward.</p>
            <div className="grid gap-3">
              <label className="text-sm font-semibold text-foreground">Hours to add</label>
              <input
                type="range"
                min={1}
                max={168}
                step={1}
                value={extendHours}
                onChange={(e) => setExtendHours(parseInt(e.target.value, 10))}
              />
              <div className="text-sm text-muted-foreground">+{extendHours} hours</div>

              <label className="text-sm font-semibold text-foreground">Reason</label>
              <div className="grid grid-cols-2 gap-2">
                {["paid", "referrals"].map((reason) => (
                  <button
                    key={reason}
                    onClick={() => setExtendReason(reason as "paid" | "referrals")}
                    className={`rounded-lg border px-3 py-2 text-sm font-semibold transition ${
                      extendReason === reason ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-900/30" : "border-border"
                    }`}
                  >
                    {reason === "paid" ? "Paid" : "Referrals"}
                  </button>
                ))}
              </div>

              <label className="text-sm font-semibold text-foreground">Value (optional)</label>
              <input
                type="number"
                value={extendValue ?? ""}
                onChange={(e) => setExtendValue(e.target.value ? parseInt(e.target.value, 10) : undefined)}
                placeholder={extendReason === "paid" ? "Amount received" : "Directs added"}
                className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
              />
            </div>
            <button
              onClick={() => extendMutation.mutate({ requestId: extendTarget.id, hours: extendHours, reason: extendReason, value: extendValue })}
              disabled={extendMutation.isPending}
              className="w-full rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-blue-700 disabled:opacity-60"
            >
              {extendMutation.isPending ? "Extending..." : "Apply extension"}
            </button>
            <button
              onClick={() => setExtendTarget(null)}
              className="w-full rounded-lg border border-border px-4 py-2 text-sm font-semibold text-foreground/80"
            >
              Cancel
            </button>
          </div>
        </ModalShell>
      )}
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number;
  tone: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-border bg-card/80 p-4 shadow-sm backdrop-blur"
    >
      <div className="flex items-center justify-between">
        <div className={`flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br ${tone} text-white shadow-inner`}>
          <Icon className="h-5 w-5" />
        </div>
        <span className="text-2xl font-bold text-foreground">{value}</span>
      </div>
      <p className="mt-2 text-sm font-semibold text-muted-foreground">{label}</p>
    </motion.div>
  );
}

function ModalShell({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="absolute inset-0" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="relative w-full max-w-lg rounded-2xl border border-border bg-card p-6 shadow-2xl"
      >
        {children}
      </motion.div>
    </div>
  );
}
