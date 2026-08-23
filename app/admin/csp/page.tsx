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
  Globe,
  MapPin,
  Settings,
  Wallet,
  Building2,
  ChevronDown,
  ChevronUp,
  Info,
  Layers,
} from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import AdminPageGuide from "@/components/admin/AdminPageGuide";
import CspAdminOverviewSection from "@/components/admin/CspAdminOverviewSection";

type RouterOutputs = inferRouterOutputs<AppRouter>;
type AdminQueue = RouterOutputs["csp"]["adminListRequests"];
type TierConfig = RouterOutputs["csp"]["getCspTierConfig"];
type TierRuleChangeLogPage = RouterOutputs["csp"]["adminListCspRuleChangeLogs"];
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
  isAdminDefault?: boolean;
  isActive?: boolean;
  User?: { id: string; name: string | null; email: string | null } | null;
};

type StatusKey = "pending" | "approved" | "broadcasting" | "ready_for_release" | "released" | "closed" | "rejected";

const statusChip: Record<StatusKey, { label: string; tone: string }> = {
  pending: { label: "Pending", tone: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-200" },
  approved: { label: "Approved", tone: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200" },
  broadcasting: { label: "Broadcasting", tone: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-200" },
  ready_for_release: { label: "Ready for Release", tone: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-200" },
  released: { label: "Released", tone: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-200" },
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
  const [statuses, setStatuses] = useState<StatusKey[]>(["pending", "approved", "broadcasting", "ready_for_release"]);
  const [search, setSearch] = useState("");
  const [approveTarget, setApproveTarget] = useState<QueueItem | null>(null);
  const [extendTarget, setExtendTarget] = useState<QueueItem | null>(null);
  const [extendHours, setExtendHours] = useState(24);
  const [extendReason, setExtendReason] = useState<"paid" | "referrals">("paid");
  const [extendValue, setExtendValue] = useState<number | undefined>(undefined);
  const [showCreateDefault, setShowCreateDefault] = useState(false);
  const [detailTarget, setDetailTarget] = useState<QueueItem | null>(null);
  const [rejectTarget, setRejectTarget] = useState<QueueItem | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [cooldownMonths, setCooldownMonths] = useState<6 | 12 | 24 | 36>(12);
  const [userSearchTerm, setUserSearchTerm] = useState("");
  const [selectedUser, setSelectedUser] = useState<{ id: string; name: string | null; email: string } | null>(null);

  // Country management state
  const [showCountryPanel, setShowCountryPanel] = useState(false);
  const [countryForm, setCountryForm] = useState({ countryCode: "", countryName: "", isNationalActive: false, isGlobalActive: false, activationThreshold: 10000, notes: "" });

  // Reserve transfer state
  const [showReservePanel, setShowReservePanel] = useState(false);
  const [reserveForm, setReserveForm] = useState({ userId: "", amount: 0, reason: "" });
  const [reserveUserSearch, setReserveUserSearch] = useState("");

  // Eligibility config state
  const [showConfigPanel, setShowConfigPanel] = useState(false);
  const [showTierPanel, setShowTierPanel] = useState(false);
  const [showTiersPanel, setShowTiersPanel] = useState(false);
  const [showAuditPanel, setShowAuditPanel] = useState(false);
  const [ruleLogPage, setRuleLogPage] = useState(1);
  const [ruleLogFilter, setRuleLogFilter] = useState("");
  const [defaultForm, setDefaultForm] = useState({
    category: "national" as "national" | "global",
    amount: 10000,
    purpose: "",
    notes: "",
  });

  const { data, isLoading, refetch } = api.csp.adminListRequests.useQuery({
    status: statuses,
    page,
    pageSize,
  });

  const { data: defaultRequests, refetch: refetchDefaults } = api.csp.listAdminDefaultRequests.useQuery();

  const { data: cspCountries, refetch: refetchCountries } = api.csp.listCspCountries.useQuery();
  const { data: eligibilityConfig, refetch: refetchEligibilityConfig } = api.csp.getCspEligibilityConfig.useQuery();
  const { data: tierConfig, refetch: refetchTierConfig } = api.csp.getCspTierConfig.useQuery();
  const { data: cspTiers, refetch: refetchCspTiers } = api.csp.adminListCspTiers.useQuery();
  const { data: ruleChangeLogs, refetch: refetchRuleChangeLogs, isFetching: isRuleChangeLogsFetching } = api.csp.adminListCspRuleChangeLogs.useQuery({
    page: ruleLogPage,
    pageSize: 10,
    ruleKey: ruleLogFilter.trim() || undefined,
  });

  const utils = api.useUtils();
  const { data: visibilityDiagnostics, refetch: refetchDiagnostics } = api.csp.getBroadcastVisibilityDiagnostics.useQuery();
  const { data: adminOverview, refetch: refetchAdminOverview, isLoading: overviewLoading } = api.csp.getCspAdminOverview.useQuery({});

  const { data: searchedUsers } = api.user.searchUsers.useQuery(
    { term: userSearchTerm },
    { enabled: userSearchTerm.length >= 2 }
  );

  const { data: reserveSearchedUsers } = api.user.searchUsers.useQuery(
    { term: reserveUserSearch },
    { enabled: reserveUserSearch.length >= 2 }
  );

  const approveMutation = api.csp.approveRequest.useMutation({
    onSuccess: (res) => {
      toast.success("Request approved and broadcast started");
      setApproveTarget(null);
      refetch();
      utils.csp.listBroadcasts.invalidate();
      utils.csp.getLiveStatus.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  const extendMutation = api.csp.extendBroadcast.useMutation({
    onSuccess: () => {
      toast.success("Broadcast extended");
      setExtendTarget(null);
      refetch();
      utils.csp.listBroadcasts.invalidate();
      utils.csp.getLiveStatus.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  const releaseMutation = api.csp.releaseFunds.useMutation({
    onSuccess: () => {
      toast.success("Funds released with 80/20 split");
      refetch();
      refetchDefaults();
      setDetailTarget(null);
      utils.csp.listBroadcasts.invalidate();
      utils.csp.getLiveStatus.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  const createDefaultMutation = api.csp.createAdminDefaultRequest.useMutation({
    onSuccess: () => {
      setSelectedUser(null);
      setUserSearchTerm("");
      toast.success("Default CSP request created and live");
      setShowCreateDefault(false);
      setDefaultForm({ category: "national", amount: 10000, purpose: "", notes: "" });
      refetchDefaults();
      refetch();
      utils.csp.listBroadcasts.invalidate();
      utils.csp.getLiveStatus.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  const toggleDefaultMutation = api.csp.toggleAdminDefaultRequest.useMutation({
    onSuccess: (res) => {
      toast.success(res.isActive ? "Default request activated" : "Default request deactivated");
      refetchDefaults();
      refetch();
      utils.csp.listBroadcasts.invalidate();
      utils.csp.getLiveStatus.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  const markCompleteMutation = api.csp.markAdminDefaultComplete.useMutation({
    onSuccess: () => {
      toast.success("Default request marked as complete");
      refetchDefaults();
      refetch();
      utils.csp.listBroadcasts.invalidate();
      utils.csp.getLiveStatus.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  const rejectMutation = api.csp.rejectRequest.useMutation({
    onSuccess: () => {
      toast.success("Request rejected and user notified");
      setRejectTarget(null);
      setRejectReason("");
      refetch();
      utils.csp.listBroadcasts.invalidate();
      utils.csp.getLiveStatus.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  const upsertCountryMutation = api.csp.upsertCspCountry.useMutation({
    onSuccess: () => { toast.success("Country record saved"); refetchCountries(); setCountryForm({ countryCode: "", countryName: "", isNationalActive: false, isGlobalActive: false, activationThreshold: 10000, notes: "" }); },
    onError: (err) => toast.error(err.message),
  });

  const transferReserveMutation = api.csp.transferReserveToUser.useMutation({
    onSuccess: () => { toast.success("Reserve funds transferred to user's community wallet"); setReserveForm({ userId: "", amount: 0, reason: "" }); setReserveUserSearch(""); },
    onError: (err) => toast.error(err.message),
  });

  const updateEligibilityConfigMutation = api.csp.updateCspEligibilityConfig.useMutation({
    onSuccess: () => { toast.success("Eligibility config updated"); refetchEligibilityConfig(); },
    onError: (err) => toast.error(err.message),
  });

  const updateTierConfigMutation = api.csp.updateCspTierConfig.useMutation({
    onSuccess: () => {
      toast.success("Tier rules updated");
      refetchTierConfig();
      refetchRuleChangeLogs();
    },
    onError: (err) => toast.error(err.message),
  });

  const upsertTiersMutation = api.csp.adminUpsertCspTiers.useMutation({
    onSuccess: () => {
      toast.success("Tiers updated");
      refetchCspTiers();
      refetchRuleChangeLogs();
    },
    onError: (err) => toast.error(err.message),
  });

  const seedTiersMutation = api.csp.seedDefaultCspTiers.useMutation({
    onSuccess: (res) => {
      toast.success(res.message || "Default tiers seeded");
      refetchCspTiers();
      refetchRuleChangeLogs();
    },
    onError: (err) => toast.error(err.message),
  });

  const handleReject = () => {
    if (!rejectTarget) return;
    if (!rejectReason.trim()) {
      toast.error("Please provide a reason for rejection");
      return;
    }
    if (rejectReason.trim().length < 10) {
      toast.error("Reason must be at least 10 characters");
      return;
    }
    rejectMutation.mutate({
      requestId: rejectTarget.id,
      reason: rejectReason.trim(),
    });
  };

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

      {/* ─── CSP Admin Overview ─────────────────────────────────────────── */}
      <CspAdminOverviewSection
        data={adminOverview}
        isLoading={overviewLoading}
        onRefresh={() => refetchAdminOverview()}
      />

      {/* Broadcast visibility diagnostics */}
      <div className="rounded-2xl border border-border bg-card p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold">Broadcast visibility diagnostics</h2>
          <button
            onClick={() => refetchDiagnostics()}
            className="flex items-center gap-2 rounded-xl border border-border bg-muted px-3 py-1.5 text-sm font-medium hover:bg-accent"
          >
            <RefreshCw className="h-3.5 w-3.5" /> Refresh diagnostics
          </button>
        </div>
        {visibilityDiagnostics ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="rounded-lg border border-border p-3">
              <p className="text-xs text-muted-foreground">Total broadcasting</p>
              <p className="text-2xl font-bold">{visibilityDiagnostics.total}</p>
            </div>
            <div className="rounded-lg border border-border p-3">
              <p className="text-xs text-muted-foreground">Visible in feed</p>
              <p className="text-2xl font-bold text-emerald-600">{visibilityDiagnostics.visible}</p>
            </div>
            <div className="rounded-lg border border-border p-3 col-span-2">
              <p className="text-xs text-muted-foreground">Hidden from feed</p>
              <div className="mt-2 space-y-1">
                {Object.entries(visibilityDiagnostics.hiddenReasonCounts).length > 0 ? (
                  Object.entries(visibilityDiagnostics.hiddenReasonCounts).map(([reason, count]) => (
                    <div key={reason} className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">{reason.replace(/_/g, " ")}</span>
                      <span className="font-semibold text-red-500">{count}</span>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">None hidden</p>
                )}
              </div>
            </div>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Loading diagnostics…</p>
        )}
      </div>

      {/* User Guide */}
      <AdminPageGuide
        title="CSP Management Guide"
        sections={[
          {
            title: "Community Support Program (CSP) Overview",
            icon: <RadioTower className="w-5 h-5 text-blue-600" />,
            items: [
              "CSP allows users to request financial support from the community",
              "Community members contribute to support requests that are approved",
              "Only <strong>Community Wallet</strong> and <strong>Cash Wallet</strong> funds can be used",
              "Approved requests are broadcast for a limited time",
              "You can extend broadcast time for successful fundraising"
            ]
          },
          {
            title: "Request Approval Process",
            icon: <CheckCircle2 className="w-5 h-5 text-green-600" />,
            type: "ol",
            items: [
              "<strong>Review pending requests</strong> - Check member details, category, amount, and purpose",
              "<strong>Verify eligibility</strong> - Ensure request meets CSP criteria",
              "<strong>Approve or Reject</strong> - Click approve to start broadcast or reject if invalid",
              "<strong>Broadcast begins</strong> - Approved requests are live for community contributions",
              "<strong>Monitor progress</strong> - Track raised amount vs threshold"
            ]
          },
          {
            title: "CSP Request Statuses",
            icon: <AlertCircle className="w-5 h-5 text-orange-600" />,
            items: [
              { label: "Pending", text: "Awaiting admin approval" },
              { label: "Approved", text: "Approved but broadcast not yet started" },
              { label: "Broadcasting", text: "Live and accepting contributions" },
              { label: "Closed", text: "Broadcast ended (goal met or time expired)" },
              { label: "Rejected", text: "Request denied by admin" }
            ]
          },
          {
            title: "Broadcast Extension",
            icon: <TimerReset className="w-5 h-5 text-purple-600" />,
            items: [
              "Click <strong>Extend</strong> on broadcasting requests to add more time",
              "<strong>Paid Extension</strong> - User pays to extend broadcast period",
              "<strong>Referral Extension</strong> - User earns extension via referrals",
              "Set extension hours (default 24 hours)",
              "Extensions help requests that are close to reaching their goal"
            ]
          },
          {
            title: "Request Information",
            icon: <Users className="w-5 h-5 text-blue-600" />,
            items: [
              "<strong>Member</strong> - User requesting support",
              "<strong>Category</strong> - Type of support needed (medical, education, etc.)",
              "<strong>Amount</strong> - Target amount to raise",
              "<strong>Purpose</strong> - Detailed explanation of need",
              "<strong>Progress</strong> - Amount raised / Threshold amount",
              "<strong>Contributors</strong> - Number of community members who contributed",
              "<strong>Countdown</strong> - Time remaining in broadcast"
            ]
          }
        ]}
        features={[
          "Approve/reject support requests",
          "Start broadcast campaigns",
          "Extend broadcast periods",
          "Track contribution progress",
          "Filter by status",
          "Search requests",
          "Real-time countdown timers",
          "Community wallet integration"
        ]}
        proTip="Monitor <strong>broadcasting requests</strong> that are close to their goal but running out of time - these are great candidates for <strong>extension</strong>. Use the <strong>status filters</strong> to focus on pending approvals during peak review times."
        warning="Once a request is <strong>approved and broadcast starts</strong>, it immediately becomes visible to all community members. Ensure you've verified the legitimacy and urgency of the request before approval. Fraudulent requests damage community trust."
      />

      <div className="grid gap-4 md:grid-cols-4">
        <StatCard icon={Sparkles} label="Total in scope" value={aggregates.total} tone="from-emerald-500 to-emerald-600" />
        <StatCard icon={AlertCircle} label="Pending approval" value={aggregates.pending} tone="from-amber-500 to-amber-600" />
        <StatCard icon={RadioTower} label="Broadcasting" value={aggregates.live} tone="from-cyan-500 to-blue-600" />
        <StatCard icon={CheckCircle2} label="Prepped (approved)" value={aggregates.approved} tone="from-indigo-500 to-purple-600" />
      </div>

      {/* Default Requests Section */}
      <div className="rounded-2xl border-2 border-emerald-500/30 bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/20 dark:to-teal-950/20 p-6 shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold text-emerald-900 dark:text-emerald-100 flex items-center gap-2">
              <Sparkles className="w-5 h-5" />
              Admin Default Requests
            </h2>
            <p className="text-sm text-emerald-700 dark:text-emerald-300 mt-1">
              Base requests that users can donate to for meeting CSP eligibility. No expiry, bypasses all criteria.
            </p>
          </div>
          <button
            onClick={() => setShowCreateDefault(true)}
            className="flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-emerald-700"
          >
            <Sparkles className="h-4 w-4" /> Create Default Request
          </button>
        </div>

        <div className="space-y-3">
          {(!defaultRequests || defaultRequests.length === 0) && (
            <div className="rounded-xl border border-emerald-200 dark:border-emerald-800 bg-white/60 dark:bg-black/20 p-4 text-center text-sm text-muted-foreground">
              No default requests yet. Create one to help users meet eligibility criteria.
            </div>
          )}

          {defaultRequests && defaultRequests.map((req: any) => {
            const raised = req.raisedAmount ?? 0;
            const threshold = req.thresholdAmount;
            const pct = Math.min(100, Math.round((raised / threshold) * 100));
            return (
              <div key={req.id} className="rounded-xl border border-emerald-200 dark:border-emerald-800 bg-white/80 dark:bg-black/30 p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      <span className={`rounded-full px-2 py-1 text-xs font-semibold uppercase ${
                        req.isActive 
                          ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-200"
                          : "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300"
                      }`}>
                        {req.isActive ? "Active" : "Inactive"}
                      </span>
                      <span className="rounded-full bg-emerald-100 px-2 py-1 text-xs font-semibold uppercase text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-200">
                        {req.category}
                      </span>
                      <span className="text-sm font-bold text-foreground">₦{formatAmount(req.thresholdAmount)}</span>
                    </div>
                    <p className="text-sm font-medium text-foreground">{req.purpose}</p>
                    {req.notes && <p className="text-xs text-muted-foreground">{req.notes}</p>}

                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>₦{formatAmount(raised)} / ₦{formatAmount(threshold)}</span>
                        <span>{pct}%</span>
                      </div>
                      <div className="h-2 rounded-full bg-muted">
                        <div className="h-2 rounded-full bg-emerald-500" style={{ width: `${pct}%` }} />
                      </div>
                      <p className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Users className="h-3 w-3" /> {req.contributorsCount} contributors
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    {req.isActive && req.raisedAmount >= req.thresholdAmount && (
                      <button
                        onClick={() => markCompleteMutation.mutate({ requestId: req.id })}
                        disabled={markCompleteMutation.isPending}
                        className="flex items-center gap-1 rounded-lg border border-green-500 bg-green-50 px-3 py-1 text-xs font-semibold text-green-700 transition hover:bg-green-100 dark:bg-green-900/20 dark:text-green-200 disabled:opacity-50"
                      >
                        <CheckCircle2 className="h-4 w-4" /> Mark Complete
                      </button>
                    )}
                    <button
                      onClick={() => toggleDefaultMutation.mutate({ requestId: req.id, isActive: !req.isActive })}
                      disabled={toggleDefaultMutation.isPending}
                      className={`flex items-center gap-1 rounded-lg border px-3 py-1 text-xs font-semibold transition disabled:opacity-50 ${
                        req.isActive
                          ? "border-red-500 bg-red-50 text-red-700 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-200"
                          : "border-green-500 bg-green-50 text-green-700 hover:bg-green-100 dark:bg-green-900/20 dark:text-green-200"
                      }`}
                    >
                      {req.isActive ? "Deactivate" : "Activate"}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex flex-col gap-3 rounded-2xl border border-border bg-card/70 p-4 shadow-sm backdrop-blur">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-wrap gap-2">
            {(["pending", "approved", "broadcasting", "ready_for_release", "released", "closed"] as StatusKey[]).map((status) => {
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
                      {item.isAdminDefault ? (
                        <Sparkles className="h-4 w-4 text-amber-500" aria-label="Admin Default Request" />
                      ) : (
                        <ShieldCheck className="h-4 w-4 text-emerald-600" />
                      )}
                      <span>{user?.name ?? "Unknown"}</span>
                      {item.isAdminDefault && (
                        <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold uppercase text-amber-700 dark:bg-amber-900/30 dark:text-amber-200">
                          Default
                        </span>
                      )}
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
                      <>
                        <button
                          onClick={() => setApproveTarget(item)}
                          className="flex items-center gap-1 rounded-lg border border-emerald-500 px-3 py-1 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-50 dark:text-emerald-200 dark:hover:bg-emerald-900/20"
                        >
                          <Sparkles className="h-4 w-4" /> Approve
                        </button>
                        <button
                          onClick={() => setRejectTarget(item)}
                          className="flex items-center gap-1 rounded-lg border border-rose-500 px-3 py-1 text-xs font-semibold text-rose-700 transition hover:bg-rose-50 dark:text-rose-200 dark:hover:bg-rose-900/20"
                        >
                          <AlertCircle className="h-4 w-4" /> Reject
                        </button>
                      </>
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
                      onClick={() => setDetailTarget(item)}
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

      {/* ─── Country Management Panel ─────────────────────────────────────────── */}
      <div className="rounded-2xl border border-border bg-card/70 p-6 shadow-sm">
        <button
          onClick={() => setShowCountryPanel((v) => !v)}
          className="flex w-full items-center justify-between text-left"
        >
          <div className="flex items-center gap-3">
            <Globe className="h-5 w-5 text-blue-600" />
            <div>
              <h2 className="text-lg font-bold text-foreground">Country Activation</h2>
              <p className="text-sm text-muted-foreground">Manage which countries are CSP-active for National and Global broadcasts.</p>
            </div>
          </div>
          {showCountryPanel ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
        </button>

        {showCountryPanel && (
          <div className="mt-6 space-y-6">
            {/* Existing countries */}
            <div className="overflow-hidden rounded-xl border border-border">
              <div className="grid grid-cols-6 bg-muted/50 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                <div className="col-span-1">Code</div>
                <div className="col-span-2">Country</div>
                <div className="col-span-1">National</div>
                <div className="col-span-1">Global</div>
                <div className="col-span-1 text-right">Count/Target</div>
              </div>
              <div className="divide-y divide-border bg-card">
                {(!cspCountries || cspCountries.length === 0) && (
                  <p className="p-4 text-sm text-muted-foreground">No country records yet.</p>
                )}
                {cspCountries?.map((c: any) => (
                  <div key={c.countryCode} className="grid grid-cols-6 items-center px-4 py-3 text-sm gap-2">
                    <div className="col-span-1 font-mono font-bold text-foreground">{c.countryCode}</div>
                    <div className="col-span-2 text-foreground">{c.countryName}</div>
                    <div className="col-span-1">
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${c.isNationalActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                        {c.isNationalActive ? "Active" : "Inactive"}
                      </span>
                    </div>
                    <div className="col-span-1">
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${c.isGlobalActive ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-500"}`}>
                        {c.isGlobalActive ? "Active" : "Inactive"}
                      </span>
                    </div>
                    <div className="col-span-1 text-right text-xs text-muted-foreground">
                      {c.regularActivationCount.toLocaleString()} / {c.activationThreshold.toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Add / update country form */}
            <div className="rounded-xl border border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-950/20 p-4 space-y-3">
              <h3 className="text-sm font-bold text-foreground flex items-center gap-2"><MapPin className="h-4 w-4 text-blue-600" /> Add / Update Country</h3>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-muted-foreground">ISO Code (e.g. NG)</label>
                  <input value={countryForm.countryCode} onChange={(e) => setCountryForm((f) => ({ ...f, countryCode: e.target.value.toUpperCase() }))}
                    className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" placeholder="NG" maxLength={3} />
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground">Country Name</label>
                  <input value={countryForm.countryName} onChange={(e) => setCountryForm((f) => ({ ...f, countryName: e.target.value }))}
                    className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" placeholder="Nigeria" />
                </div>
                <div>
                  <label className="flex items-center text-xs font-semibold text-muted-foreground">
                    Activation Threshold
                    <FieldInfo text="Number of Regular activations in this country before National broadcasts auto-activate. Set 0 to activate immediately." recommended="10,000" />
                  </label>
                  <input type="number" min={0} value={countryForm.activationThreshold} onChange={(e) => setCountryForm((f) => ({ ...f, activationThreshold: parseInt(e.target.value) || 0 }))}
                    className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground">Notes</label>
                  <input value={countryForm.notes} onChange={(e) => setCountryForm((f) => ({ ...f, notes: e.target.value }))}
                    className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" placeholder="Optional notes" />
                </div>
                <div className="flex items-center gap-3 col-span-2">
                  <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <input type="checkbox" checked={countryForm.isNationalActive} onChange={(e) => setCountryForm((f) => ({ ...f, isNationalActive: e.target.checked }))} className="rounded" />
                    National Active
                  </label>
                  <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <input type="checkbox" checked={countryForm.isGlobalActive} onChange={(e) => setCountryForm((f) => ({ ...f, isGlobalActive: e.target.checked }))} className="rounded" />
                    Global Active
                  </label>
                </div>
              </div>
              <button
                onClick={() => upsertCountryMutation.mutate(countryForm)}
                disabled={upsertCountryMutation.isPending || !countryForm.countryCode || !countryForm.countryName}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {upsertCountryMutation.isPending ? "Saving..." : "Save Country"}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ─── CSP Eligibility Config Panel ────────────────────────────────────────── */}
      <div className="rounded-2xl border border-border bg-card/70 p-6 shadow-sm">
        <button
          onClick={() => setShowConfigPanel((v) => !v)}
          className="flex w-full items-center justify-between text-left"
        >
          <div className="flex items-center gap-3">
            <Settings className="h-5 w-5 text-purple-600" />
            <div>
              <h2 className="text-lg font-bold text-foreground">Eligibility & Threshold Config</h2>
              <p className="text-sm text-muted-foreground">Configure membership tier, direct invite minimums, contribution thresholds, and broadcast hours.</p>
            </div>
          </div>
          {showConfigPanel ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
        </button>

        {showConfigPanel && eligibilityConfig && (
          <EligibilityConfigForm config={eligibilityConfig} onSave={(data) => updateEligibilityConfigMutation.mutate(data)} isPending={updateEligibilityConfigMutation.isPending} />
        )}
        {showConfigPanel && !eligibilityConfig && (
          <p className="mt-4 text-sm text-muted-foreground">Loading config...</p>
        )}
      </div>

      {/* ─── CSP Tier Rules & Audit Log ────────────────────────────────────── */}
      <div className="rounded-2xl border border-border bg-card/70 p-6 shadow-sm">
        <button
          onClick={() => setShowTierPanel((v) => !v)}
          className="flex w-full items-center justify-between text-left"
        >
          <div className="flex items-center gap-3">
            <Sparkles className="h-5 w-5 text-emerald-600" />
            <div>
              <h2 className="text-lg font-bold text-foreground">CSP Tier Rules</h2>
              <p className="text-sm text-muted-foreground">Manage the tier model, badge permanence, and sponsor-based cooling settings.</p>
            </div>
          </div>
          {showTierPanel ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
        </button>

        {showTierPanel && tierConfig && (
          <TierConfigForm
            config={tierConfig}
            onSave={(data) => updateTierConfigMutation.mutate(data)}
            isPending={updateTierConfigMutation.isPending}
          />
        )}
        {showTierPanel && !tierConfig && (
          <p className="mt-4 text-sm text-muted-foreground">Loading tier config...</p>
        )}
      </div>

      {/* ─── CSP Tier Table (per-tier values) ─────────────────────────────── */}
      <div className="rounded-2xl border border-border bg-card/70 p-6 shadow-sm">
        <button
          onClick={() => setShowTiersPanel((v) => !v)}
          className="flex w-full items-center justify-between text-left"
        >
          <div className="flex items-center gap-3">
            <Layers className="h-5 w-5 text-emerald-600" />
            <div>
              <h2 className="text-lg font-bold text-foreground">CSP Tiers</h2>
              <p className="text-sm text-muted-foreground">Edit each tier&apos;s contribution-right threshold, support cap, minimum fulfilment %, and activation.</p>
            </div>
          </div>
          {showTiersPanel ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
        </button>

        {showTiersPanel && cspTiers && cspTiers.length > 0 && (
          <TiersManager
            tiers={cspTiers}
            onSave={(tiers, reason) => upsertTiersMutation.mutate({ tiers, reason })}
            isPending={upsertTiersMutation.isPending}
          />
        )}
        {showTiersPanel && cspTiers && cspTiers.length === 0 && (
          <div className="mt-4 space-y-4">
            <div className="rounded-xl border border-border bg-muted/30 px-4 py-6 text-center">
              <Layers className="mx-auto h-8 w-8 text-muted-foreground" />
              <p className="mt-2 text-sm font-medium text-foreground">No CSP tiers found</p>
              <p className="mt-1 text-xs text-muted-foreground">
                The tier table is empty. Seed the default 20 tiers to get started, or add tiers manually.
              </p>
              <button
                onClick={() => seedTiersMutation.mutate()}
                disabled={seedTiersMutation.isPending}
                className="mt-4 inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
              >
                <Layers className="h-4 w-4" />
                {seedTiersMutation.isPending ? "Seeding..." : "Seed Default Tiers"}
              </button>
            </div>
          </div>
        )}
        {showTiersPanel && !cspTiers && (
          <p className="mt-4 text-sm text-muted-foreground">Loading tiers...</p>
        )}
      </div>

      <div className="rounded-2xl border border-border bg-card/70 p-6 shadow-sm">
        <button
          onClick={() => setShowAuditPanel((v) => !v)}
          className="flex w-full items-center justify-between text-left"
        >
          <div className="flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-purple-600" />
            <div>
              <h2 className="text-lg font-bold text-foreground">CSP Rule Audit Log</h2>
              <p className="text-sm text-muted-foreground">Review who changed tier settings and why.</p>
            </div>
          </div>
          {showAuditPanel ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
        </button>

        {showAuditPanel && (
          <RuleChangeLogViewer
            pageData={ruleChangeLogs}
            page={ruleLogPage}
            filter={ruleLogFilter}
            onFilterChange={(value) => {
              setRuleLogFilter(value);
              setRuleLogPage(1);
            }}
            onPageChange={setRuleLogPage}
            onRefresh={() => {
              void refetchRuleChangeLogs();
            }}
            isFetching={isRuleChangeLogsFetching}
          />
        )}
      </div>

      {/* ─── Reserve Pool Transfer ────────────────────────────────────────────── */}
      <div className="rounded-2xl border border-border bg-card/70 p-6 shadow-sm">
        <button
          onClick={() => setShowReservePanel((v) => !v)}
          className="flex w-full items-center justify-between text-left"
        >
          <div className="flex items-center gap-3">
            <Wallet className="h-5 w-5 text-amber-600" />
            <div>
              <h2 className="text-lg font-bold text-foreground">Reserve Pool Transfer</h2>
              <p className="text-sm text-muted-foreground">Transfer from the CSP Reserve Wallet to a member's community wallet for under-funded campaigns.</p>
            </div>
          </div>
          {showReservePanel ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
        </button>

        {showReservePanel && (
          <div className="mt-6 space-y-4">
            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-muted-foreground">Search Recipient User</label>
                <input value={reserveUserSearch} onChange={(e) => setReserveUserSearch(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" placeholder="Search by name or email..." />
                {reserveSearchedUsers && reserveSearchedUsers.length > 0 && !reserveForm.userId && (
                  <div className="mt-1 rounded-lg border border-border bg-card shadow-lg max-h-40 overflow-y-auto">
                    {reserveSearchedUsers.map((u: any) => (
                      <button key={u.id} onClick={() => { setReserveForm((f) => ({ ...f, userId: u.id })); setReserveUserSearch(`${u.name ?? ""} (${u.email})`); }}
                        className="w-full text-left px-3 py-2 hover:bg-muted text-sm border-b border-border last:border-0">
                        <span className="font-medium">{u.name ?? "Unnamed"}</span> <span className="text-muted-foreground text-xs">{u.email}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-muted-foreground">Amount (₦)</label>
                  <input type="number" value={reserveForm.amount || ""} onChange={(e) => setReserveForm((f) => ({ ...f, amount: parseInt(e.target.value) || 0 }))}
                    className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" placeholder="e.g. 50000" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground">Reason</label>
                  <input value={reserveForm.reason} onChange={(e) => setReserveForm((f) => ({ ...f, reason: e.target.value }))}
                    className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" placeholder="e.g. Campaign did not meet target" />
                </div>
              </div>
              <button
                onClick={() => transferReserveMutation.mutate(reserveForm)}
                disabled={transferReserveMutation.isPending || !reserveForm.userId || reserveForm.amount <= 0 || !reserveForm.reason}
                className="rounded-lg bg-amber-600 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-700 disabled:opacity-50"
              >
                {transferReserveMutation.isPending ? "Transferring..." : "Transfer from Reserve"}
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

            <div className="space-y-2">
              <label className="text-sm font-semibold text-foreground">Cooldown Period (after release)</label>
              <p className="text-xs text-muted-foreground">How long before this member can make another request once funds are released.</p>
              <div className="grid grid-cols-4 gap-2">
                {([6, 12, 24, 36] as const).map((m) => (
                  <button
                    key={m}
                    onClick={() => setCooldownMonths(m)}
                    className={`rounded-lg border px-3 py-2 text-sm font-semibold transition ${
                      cooldownMonths === m
                        ? "border-emerald-500 bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-200"
                        : "border-border text-muted-foreground hover:border-emerald-400"
                    }`}
                  >
                    {m}mo
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={() => approveMutation.mutate({ requestId: approveTarget.id, cooldownMonths })}
              disabled={approveMutation.isPending}
              className="w-full rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-emerald-700 disabled:opacity-60"
            >
              {approveMutation.isPending ? "Approving..." : `Approve & broadcast (${cooldownMonths}mo cooldown)`}
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

      {/* Create Default Request Modal */}
      {showCreateDefault && (
        <ModalShell onClose={() => setShowCreateDefault(false)}>
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-foreground">Create Admin Default Request</h3>
            <p className="text-sm text-muted-foreground">
              Create a base CSP request that users can donate to for meeting eligibility criteria. No timer, no criteria checks.
            </p>

            <div className="space-y-3">
              {/* User Selection */}
              <div>
                <label className="text-sm font-semibold text-foreground">Recipient User (Optional)</label>
                <p className="text-xs text-muted-foreground mb-2">
                  Leave empty to create a system-wide default request, or select a specific user
                </p>
                
                {selectedUser ? (
                  <div className="flex items-center justify-between rounded-lg border border-emerald-500 bg-emerald-50 dark:bg-emerald-900/30 px-3 py-2">
                    <div>
                      <p className="text-sm font-medium text-foreground">{selectedUser.name || "Unnamed User"}</p>
                      <p className="text-xs text-muted-foreground">{selectedUser.email}</p>
                    </div>
                    <button
                      onClick={() => {
                        setSelectedUser(null);
                        setUserSearchTerm("");
                      }}
                      className="text-xs text-red-600 hover:text-red-700 font-medium"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Search by email, name, or screen name..."
                      value={userSearchTerm}
                      onChange={(e) => setUserSearchTerm(e.target.value)}
                      className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm pr-10"
                    />
                    {userSearchTerm && (
                      <button
                        onClick={() => setUserSearchTerm("")}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        ✕
                      </button>
                    )}
                    
                    {/* Search Results Dropdown */}
                    {searchedUsers && searchedUsers.length > 0 && (
                      <div className="absolute z-10 mt-1 w-full rounded-lg border border-border bg-card shadow-lg max-h-48 overflow-y-auto">
                        {searchedUsers.map((user: any) => (
                          <button
                            key={user.id}
                            onClick={() => {
                              setSelectedUser(user);
                              setUserSearchTerm("");
                            }}
                            className="w-full text-left px-3 py-2 hover:bg-muted transition border-b border-border last:border-0"
                          >
                            <p className="text-sm font-medium text-foreground">{user.name || "Unnamed User"}</p>
                            <p className="text-xs text-muted-foreground">{user.email}</p>
                            {user.screenName && (
                              <p className="text-xs text-muted-foreground">@{user.screenName}</p>
                            )}
                          </button>
                        ))}
                      </div>
                    )}
                    
                    {userSearchTerm.length >= 2 && searchedUsers && searchedUsers.length === 0 && (
                      <div className="absolute z-10 mt-1 w-full rounded-lg border border-border bg-card shadow-lg px-3 py-2">
                        <p className="text-xs text-muted-foreground">No users found</p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div>
                <label className="text-sm font-semibold text-foreground">Category</label>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {(["national", "global"] as const).map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setDefaultForm((prev) => ({ ...prev, category: cat }))}
                      className={`rounded-lg border px-3 py-2 text-sm font-semibold capitalize transition ${
                        defaultForm.category === cat
                          ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-900/30"
                          : "border-border"
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-sm font-semibold text-foreground">Target Amount (₦)</label>
                <input
                  type="number"
                  min={10000}
                  step={1000}
                  value={defaultForm.amount}
                  onChange={(e) => setDefaultForm((prev) => ({ ...prev, amount: parseInt(e.target.value) || 10000 }))}
                  className="mt-2 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                />
              </div>

              <div>
                <label className="text-sm font-semibold text-foreground">Purpose</label>
                <input
                  type="text"
                  placeholder="E.g., Emergency Medical Fund, Education Support"
                  value={defaultForm.purpose}
                  onChange={(e) => setDefaultForm((prev) => ({ ...prev, purpose: e.target.value }))}
                  className="mt-2 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                />
              </div>

              <div>
                <label className="text-sm font-semibold text-foreground">Notes (Optional)</label>
                <textarea
                  placeholder="Additional details about this default request"
                  rows={3}
                  value={defaultForm.notes}
                  onChange={(e) => setDefaultForm((prev) => ({ ...prev, notes: e.target.value }))}
                  className="mt-2 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm resize-none"
                />
              </div>
            </div>

            <button
              onClick={() => createDefaultMutation.mutate({
                ...defaultForm,
                userId: selectedUser?.id,
              })}
              disabled={createDefaultMutation.isPending || !defaultForm.purpose.trim()}
              className="w-full rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-emerald-700 disabled:opacity-60"
            >
              {createDefaultMutation.isPending ? "Creating..." : "Create Default Request"}
            </button>
            <button
              onClick={() => setShowCreateDefault(false)}
              className="w-full rounded-lg border border-border px-4 py-2 text-sm font-semibold text-foreground/80"
            >
              Cancel
            </button>
          </div>
        </ModalShell>
      )}

      {/* Detail Modal */}
      {detailTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="absolute inset-0" onClick={() => setDetailTarget(null)} />
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="relative w-full max-w-2xl rounded-2xl border border-border bg-card shadow-2xl max-h-[90vh] overflow-y-auto"
          >
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-card/95 backdrop-blur px-6 py-4">
              <h3 className="text-lg font-bold text-foreground">CSP Request Details</h3>
              <button
                onClick={() => setDetailTarget(null)}
                className="rounded-lg p-2 text-muted-foreground transition hover:bg-muted hover:text-foreground"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Member Info */}
              <div>
                <h4 className="text-sm font-semibold text-muted-foreground mb-3">Member Information</h4>
                <div className="bg-muted/30 rounded-lg p-4 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Name:</span>
                    <span className="text-sm font-medium text-foreground">{detailTarget.User?.name || "N/A"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Email:</span>
                    <span className="text-sm font-medium text-foreground">{detailTarget.User?.email || "N/A"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">User ID:</span>
                    <span className="text-xs font-mono text-muted-foreground">{detailTarget.userId}</span>
                  </div>
                </div>
              </div>

              {/* Request Details */}
              <div>
                <h4 className="text-sm font-semibold text-muted-foreground mb-3">Request Details</h4>
                <div className="bg-muted/30 rounded-lg p-4 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Category:</span>
                    <span className="text-sm font-semibold text-foreground uppercase">{detailTarget.category}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Target Amount:</span>
                    <span className="text-sm font-bold text-foreground">₦{formatAmount(detailTarget.thresholdAmount)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Amount Raised:</span>
                    <span className="text-sm font-semibold text-emerald-600">₦{formatAmount(detailTarget.raisedAmount)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Progress:</span>
                    <span className="text-sm font-medium text-foreground">
                      {detailTarget.thresholdAmount > 0 
                        ? Math.round((detailTarget.raisedAmount / detailTarget.thresholdAmount) * 100) 
                        : 0}%
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Contributors:</span>
                    <span className="text-sm font-medium text-foreground">{detailTarget.contributorsCount}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Status:</span>
                    <div>{statusBadge(detailTarget.status)}</div>
                  </div>
                  {detailTarget.isAdminDefault && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Type:</span>
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 dark:bg-amber-900/30 px-3 py-1 text-xs font-semibold text-amber-800 dark:text-amber-200">
                        <Sparkles className="h-3 w-3" />
                        Admin Default
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Purpose */}
              <div>
                <h4 className="text-sm font-semibold text-muted-foreground mb-3">Purpose</h4>
                <div className="bg-muted/30 rounded-lg p-4">
                  <p className="text-sm text-foreground">{detailTarget.purpose}</p>
                </div>
              </div>

              {/* Timeline */}
              <div>
                <h4 className="text-sm font-semibold text-muted-foreground mb-3">Timeline</h4>
                <div className="bg-muted/30 rounded-lg p-4 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Created:</span>
                    <span className="text-sm font-medium text-foreground">
                      {format(new Date(detailTarget.createdAt), "MMM d, yyyy h:mm a")}
                    </span>
                  </div>
                  {detailTarget.broadcastExpiresAt && (
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Expires:</span>
                      <span className="text-sm font-medium text-foreground">
                        {format(new Date(detailTarget.broadcastExpiresAt), "MMM d, yyyy h:mm a")}
                      </span>
                    </div>
                  )}
                  {detailTarget.isAdminDefault && (
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Expiry:</span>
                      <span className="text-sm font-medium text-amber-600">No expiry (permanent)</span>
                    </div>
                  )}
                  {detailTarget.status === "broadcasting" && detailTarget.broadcastExpiresAt && (
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Time Remaining:</span>
                      <span className="text-sm font-medium text-foreground">{getCountdown(detailTarget)}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4 border-t border-border">
                {detailTarget.status === "pending" && !detailTarget.isAdminDefault && (
                  <>
                    <button
                      onClick={() => {
                        setApproveTarget(detailTarget);
                        setDetailTarget(null);
                      }}
                      className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700"
                    >
                      <ShieldCheck className="h-4 w-4" />
                      Approve Request
                    </button>
                    <button
                      onClick={() => {
                        setRejectTarget(detailTarget);
                        setDetailTarget(null);
                      }}
                      className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-rose-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-rose-700"
                    >
                      <AlertCircle className="h-4 w-4" />
                      Reject Request
                    </button>
                  </>
                )}
                {detailTarget.status === "broadcasting" && !detailTarget.isAdminDefault && (
                  <button
                    onClick={() => {
                      setExtendTarget(detailTarget);
                      setDetailTarget(null);
                    }}
                    className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
                  >
                    <TimerReset className="h-4 w-4" />
                    Extend Broadcast
                  </button>
                )}
                {detailTarget.raisedAmount > 0 && (
                  <button
                    onClick={() => releaseMutation.mutate({ requestId: detailTarget.id })}
                    disabled={releaseMutation.isPending}
                    className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-800 disabled:opacity-60"
                  >
                    <ShieldCheck className="h-4 w-4" />
                    {releaseMutation.isPending ? "Releasing..." : "Release funds"}
                  </button>
                )}
                <button
                  onClick={() => setDetailTarget(null)}
                  className="flex-1 rounded-lg border border-border px-4 py-2.5 text-sm font-semibold text-foreground transition hover:bg-muted"
                >
                  Close
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Reject Modal */}
      {rejectTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="absolute inset-0" onClick={() => { setRejectTarget(null); setRejectReason(""); }} />
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="relative w-full max-w-lg rounded-2xl border border-border bg-card shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-border px-6 py-4">
              <h3 className="text-lg font-bold text-foreground">Reject CSP Request</h3>
              <button
                onClick={() => { setRejectTarget(null); setRejectReason(""); }}
                className="rounded-lg p-2 text-muted-foreground transition hover:bg-muted hover:text-foreground"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-rose-600 dark:text-rose-400 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-semibold text-rose-900 dark:text-rose-100">Reject Request</h4>
                    <p className="text-xs text-rose-700 dark:text-rose-300 mt-1">
                      This will permanently reject the request from <strong>{rejectTarget.User?.name || rejectTarget.User?.email}</strong> and send them an email notification with your reason.
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-foreground mb-2">
                  Reason for Rejection <span className="text-rose-500">*</span>
                </label>
                <textarea
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="Explain why this request is being rejected (e.g., doesn't meet eligibility criteria, suspicious activity, incomplete information, etc.)"
                  className="w-full rounded-lg border border-border bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-500/20 min-h-[120px] resize-y"
                  maxLength={500}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {rejectReason.length}/500 characters • Minimum 10 characters required
                </p>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => { setRejectTarget(null); setRejectReason(""); }}
                  className="flex-1 rounded-lg border border-border px-4 py-2.5 text-sm font-semibold text-foreground transition hover:bg-muted"
                >
                  Cancel
                </button>
                <button
                  onClick={handleReject}
                  disabled={rejectMutation.isPending || !rejectReason.trim() || rejectReason.trim().length < 10}
                  className="flex-1 rounded-lg bg-rose-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-rose-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {rejectMutation.isPending ? (
                    <>
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      Rejecting...
                    </>
                  ) : (
                    <>
                      <AlertCircle className="h-4 w-4" />
                      Reject Request
                    </>
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}

type FieldHint = { text: string; recommended?: string };

const ELIGIBILITY_FIELD_INFO: Record<string, FieldHint> = {
  minPerContribution: { text: "Smallest amount (₦) a member may contribute to any CSP request. Set 0 to allow any amount.", recommended: "500" },
  waitReductionMonthlyTarget: { text: "Monthly contribution amount (₦) that qualifies a member for wait-time reduction. Set 0 to disable.", recommended: "10,000" },
  national_minMembership: { text: "Lowest membership tier allowed to raise a National broadcast.", recommended: "regular plus" },
  national_minDirects: { text: "Minimum qualifying direct invites needed for National eligibility. Set 0 to require none.", recommended: "0 (no requirement)" },
  national_minCumulativeContrib: { text: "Minimum lifetime CSP contribution (₦) needed for National eligibility. Set 0 to disable.", recommended: "10,000" },
  national_minDistinctRequests: { text: "Minimum number of distinct members the applicant must have supported. Set 0 to disable.", recommended: "10" },
  national_broadcastHours: { text: "How long (hours) a National request stays on broadcast before auto-handling. Set 0 to disable timed broadcast.", recommended: "48" },
  national_minThreshold: { text: "Minimum requested amount (₦) for a National request. Set 0 to disable.", recommended: "10,000" },
  global_minMembership: { text: "Lowest membership tier allowed to raise a Global broadcast.", recommended: "regular plus" },
  global_minDirects: { text: "Minimum qualifying direct invites (Path A) needed for Global eligibility. Set 0 to require none.", recommended: "0 (no requirement)" },
  global_minCumulativeContrib: { text: "Minimum lifetime CSP contribution (₦) needed for Global eligibility. Set 0 to disable.", recommended: "20,000" },
  global_minDistinctRequests: { text: "Minimum number of distinct members the applicant must have supported. Set 0 to disable.", recommended: "100" },
  global_broadcastHours: { text: "How long (hours) a Global request stays on broadcast before auto-handling. Set 0 to disable timed broadcast.", recommended: "48" },
  global_minThreshold: { text: "Minimum requested amount (₦) for a Global request. Set 0 to disable.", recommended: "20,000" },
};

const TIER_FIELD_INFO: Record<string, FieldHint> = {
  tierModelEnabled: { text: "Master switch for the 20-tier Contribution-Right model. When off, the classic flat flow is used.", recommended: "On" },
  requireKyc: { text: "Require members to complete KYC before raising a CSP request.", recommended: "On" },
  requireAutoDebit: { text: "Require Auto-Debit to be enabled before raising a request.", recommended: "On" },
  requireAutoContribute: { text: "Require Auto-Contribute to be enabled before raising a request.", recommended: "On" },
  contributionMultiplier: { text: "Multiplier applied to a member's Contribution Right to compute their request cap (Right × multiplier). Set 0 to disable capping.", recommended: "20" },
  minContributionRight: { text: "Minimum Contribution Right a member needs before they can raise a request. Set 0 to disable.", recommended: "10,000" },
  defaultBroadcastHours: { text: "Default broadcast duration (hours) for new requests. Set 0 to disable timed broadcast.", recommended: "48" },
  autoExtensionHours: { text: "Hours added each time an under-fulfilled broadcast is auto-extended. Set 0 to disable.", recommended: "48" },
  maxAutoExtensions: { text: "Maximum number of automatic extensions before a request is closed. Set 0 to disable auto-extension.", recommended: "3" },
  defaultCoolingMonthsMin: { text: "Minimum cooling period (months) before a member can raise again. Set 0 for no minimum.", recommended: "12" },
  defaultCoolingMonthsMax: { text: "Maximum cooling period (months) between requests.", recommended: "24" },
  sponsorshipRequiredCount: { text: "Number of sponsored members required to earn reduced cooling. Set 0 to disable.", recommended: "100" },
  sponsorshipReducedCoolingMonths: { text: "Cooling period (months) applied once the sponsor count is met.", recommended: "6" },
  sponsorshipRequiresKyc: { text: "Require KYC for the sponsor-based cooling reduction to apply.", recommended: "Off" },
  sponsorshipRequiresRegularPlus: { text: "Require Regular Plus tier for the sponsor-based cooling reduction.", recommended: "Off" },
  sponsorshipAutoApply: { text: "Automatically apply the reduced cooling period once a member is eligible.", recommended: "Off" },
  badgeGiftingEnabled: { text: "Allow members to gift their Time Reduction Badges to other members.", recommended: "On" },
};

function FieldInfo({ text, recommended }: FieldHint) {
  return (
    <span className="group relative inline-flex items-center align-middle">
      <button
        type="button"
        aria-label="Field information"
        className="ml-1 inline-flex h-4 w-4 items-center justify-center rounded-full text-muted-foreground/60 hover:text-foreground focus:text-foreground focus:outline-none"
      >
        <Info className="h-3.5 w-3.5" />
      </button>
      <span
        role="tooltip"
        className="pointer-events-none absolute left-0 top-6 z-50 w-64 rounded-lg border border-border bg-card p-3 text-xs leading-relaxed opacity-0 shadow-xl transition-opacity duration-150 group-hover:opacity-100 group-focus-within:opacity-100"
      >
        <span className="block text-muted-foreground">{text}</span>
        {recommended && (
          <span className="mt-1.5 block font-semibold text-emerald-600 dark:text-emerald-400">Recommended: {recommended}</span>
        )}
      </span>
    </span>
  );
}

function EligibilityConfigForm({ config, onSave, isPending }: { config: any; onSave: (data: any) => void; isPending: boolean }) {
  const [form, setForm] = useState({
    minPerContribution: config.minPerContribution,
    national_minDirects: config.national.minDirects,
    national_minCumulativeContrib: config.national.minCumulativeContrib,
    national_minDistinctRequests: config.national.minDistinctRequests,
    national_broadcastHours: config.national.broadcastHours,
    national_minThreshold: config.national.minThreshold,
    national_minMembership: config.national.minMembership,
    global_minDirects: config.global.minDirects,
    global_minCumulativeContrib: config.global.minCumulativeContrib,
    global_minDistinctRequests: config.global.minDistinctRequests,
    global_broadcastHours: config.global.broadcastHours,
    global_minThreshold: config.global.minThreshold,
    global_minMembership: config.global.minMembership,
    waitReductionMonthlyTarget: config.waitReductionMonthlyTarget,
  });
  const field = (key: string, label: string, type: "number" | "text" = "number") => (
    <div>
      <label className="flex items-center text-xs font-semibold text-muted-foreground">
        {label}
        {ELIGIBILITY_FIELD_INFO[key] && <FieldInfo {...ELIGIBILITY_FIELD_INFO[key]} />}
      </label>
      <input type={type} min={type === "number" ? 0 : undefined} value={(form as any)[key]} onChange={(e) => setForm((f) => ({ ...f, [key]: type === "number" ? (parseInt(e.target.value) || 0) : e.target.value }))}
        className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" />
    </div>
  );
  return (
    <div className="mt-6 space-y-5">
      <div>
        <h3 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2"><Building2 className="h-4 w-4 text-emerald-600" /> General</h3>
        <div className="grid grid-cols-2 gap-3">
          {field("minPerContribution", "Min per contribution (₦)")}
          {field("waitReductionMonthlyTarget", "Wait reduction monthly target (₦)")}
        </div>
      </div>
      <div>
        <h3 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2"><MapPin className="h-4 w-4 text-blue-600" /> National</h3>
        <div className="grid grid-cols-3 gap-3">
          {field("national_minMembership", "Min membership tier", "text")}
          {field("national_minDirects", "Min qualifying directs")}
          {field("national_minCumulativeContrib", "Min cumulative contribution (₦)")}
          {field("national_minDistinctRequests", "Min distinct recipients")}
          {field("national_broadcastHours", "Default broadcast hours")}
          {field("national_minThreshold", "Min request threshold (₦)")}
        </div>
      </div>
      <div>
        <h3 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2"><Globe className="h-4 w-4 text-purple-600" /> Global</h3>
        <div className="grid grid-cols-3 gap-3">
          {field("global_minMembership", "Min membership tier", "text")}
          {field("global_minDirects", "Min qualifying directs (Path A)")}
          {field("global_minCumulativeContrib", "Min cumulative contribution (₦)")}
          {field("global_minDistinctRequests", "Min distinct recipients")}
          {field("global_broadcastHours", "Default broadcast hours")}
          {field("global_minThreshold", "Min request threshold (₦)")}
        </div>
      </div>
      <button onClick={() => onSave(form)} disabled={isPending}
        className="rounded-lg bg-purple-600 px-4 py-2 text-sm font-semibold text-white hover:bg-purple-700 disabled:opacity-50">
        {isPending ? "Saving..." : "Save Eligibility Config"}
      </button>
    </div>
  );
}

type CspTierRow = RouterOutputs["csp"]["adminListCspTiers"][number];

function TiersManager({ tiers, onSave, isPending }: { tiers: CspTierRow[]; onSave: (tiers: any[], reason?: string) => void; isPending: boolean }) {
  const [rows, setRows] = useState<CspTierRow[]>(tiers);
  const [reason, setReason] = useState("");

  React.useEffect(() => { setRows(tiers); }, [tiers]);

  const update = (tierNumber: number, patch: Partial<CspTierRow>) =>
    setRows((prev) => prev.map((r) => (r.tierNumber === tierNumber ? { ...r, ...patch } : r)));

  const numeric = (v: string) => (v === "" ? 0 : Math.max(0, parseInt(v, 10) || 0));

  return (
    <div className="mt-4 space-y-4">
      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
              <th className="px-3 py-2">#</th>
              <th className="px-3 py-2">Name</th>
              <th className="px-3 py-2">Contribution Right (₦)</th>
              <th className="px-3 py-2">Max Support Cap (₦)</th>
              <th className="px-3 py-2">Min Fulfilment %</th>
              <th className="px-3 py-2 text-center">Active</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.tierNumber} className="border-t border-border">
                <td className="px-3 py-2 font-semibold text-muted-foreground">{row.tierNumber}</td>
                <td className="px-3 py-2">
                  <input
                    type="text"
                    value={row.name}
                    onChange={(e) => update(row.tierNumber, { name: e.target.value })}
                    className="w-40 rounded-md border border-border bg-background px-2 py-1.5 text-sm"
                  />
                </td>
                <td className="px-3 py-2">
                  <input
                    type="number" min={0}
                    value={String(row.contributionRight)}
                    onChange={(e) => update(row.tierNumber, { contributionRight: numeric(e.target.value) })}
                    className="w-32 rounded-md border border-border bg-background px-2 py-1.5 text-sm"
                  />
                </td>
                <td className="px-3 py-2">
                  <input
                    type="number" min={0}
                    value={String(row.maxSupportCap)}
                    onChange={(e) => update(row.tierNumber, { maxSupportCap: numeric(e.target.value) })}
                    className="w-32 rounded-md border border-border bg-background px-2 py-1.5 text-sm"
                  />
                </td>
                <td className="px-3 py-2">
                  <input
                    type="number" min={0} max={100}
                    value={String(row.minFulfilmentPct)}
                    onChange={(e) => update(row.tierNumber, { minFulfilmentPct: Math.min(100, numeric(e.target.value)) })}
                    className="w-24 rounded-md border border-border bg-background px-2 py-1.5 text-sm"
                  />
                </td>
                <td className="px-3 py-2 text-center">
                  <input
                    type="checkbox"
                    checked={row.isActive}
                    onChange={(e) => update(row.tierNumber, { isActive: e.target.checked })}
                    className="h-4 w-4 rounded border-border"
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div>
        <label className="text-xs font-semibold text-muted-foreground">Reason for change (optional, logged)</label>
        <input
          type="text"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="e.g. Adjusted caps for 2026 program"
          className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
        />
      </div>

      <button
        onClick={() => onSave(rows.map(({ id: _id, createdAt: _c, updatedAt: _u, ...rest }: any) => rest), reason.trim() || undefined)}
        disabled={isPending}
        className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
      >
        <Layers className="h-4 w-4" />
        {isPending ? "Saving..." : "Save Tiers"}
      </button>
    </div>
  );
}

function TierConfigForm({ config, onSave, isPending }: { config: TierConfig | undefined; onSave: (data: any) => void; isPending: boolean }) {
  const [form, setForm] = useState({
    tierModelEnabled: config?.tierModelEnabled ?? false,
    contributionMultiplier: config?.contributionMultiplier ?? 20,
    minContributionRight: config?.minContributionRight ?? 10000,
    requireKyc: config?.requireKyc ?? false,
    requireAutoDebit: config?.requireAutoDebit ?? false,
    requireAutoContribute: config?.requireAutoContribute ?? false,
    defaultBroadcastHours: config?.defaultBroadcastHours ?? 48,
    autoExtensionHours: config?.autoExtensionHours ?? 48,
    maxAutoExtensions: config?.maxAutoExtensions ?? 3,
    defaultCoolingMonthsMin: config?.defaultCoolingMonthsMin ?? 12,
    defaultCoolingMonthsMax: config?.defaultCoolingMonthsMax ?? 24,
    sponsorshipRequiredCount: config?.sponsorshipRequiredCount ?? 100,
    sponsorshipReducedCoolingMonths: config?.sponsorshipReducedCoolingMonths ?? 6,
    sponsorshipRequiresKyc: config?.sponsorshipRequiresKyc ?? false,
    sponsorshipRequiresRegularPlus: config?.sponsorshipRequiresRegularPlus ?? false,
    sponsorshipAutoApply: config?.sponsorshipAutoApply ?? false,
    badgeGiftingEnabled: config?.badgeGiftingEnabled ?? true,
    reason: "",
  });

  React.useEffect(() => {
    if (!config) return;
    setForm({
      tierModelEnabled: config.tierModelEnabled,
      contributionMultiplier: config.contributionMultiplier,
      minContributionRight: config.minContributionRight,
      requireKyc: config.requireKyc,
      requireAutoDebit: config.requireAutoDebit,
      requireAutoContribute: config.requireAutoContribute,
      defaultBroadcastHours: config.defaultBroadcastHours,
      autoExtensionHours: config.autoExtensionHours,
      maxAutoExtensions: config.maxAutoExtensions,
      defaultCoolingMonthsMin: config.defaultCoolingMonthsMin,
      defaultCoolingMonthsMax: config.defaultCoolingMonthsMax,
      sponsorshipRequiredCount: config.sponsorshipRequiredCount,
      sponsorshipReducedCoolingMonths: config.sponsorshipReducedCoolingMonths,
      sponsorshipRequiresKyc: config.sponsorshipRequiresKyc,
      sponsorshipRequiresRegularPlus: config.sponsorshipRequiresRegularPlus,
      sponsorshipAutoApply: config.sponsorshipAutoApply,
      badgeGiftingEnabled: config.badgeGiftingEnabled,
      reason: "",
    });
  }, [config]);

  const setNumber = (key: keyof typeof form) => (value: string) => {
    setForm((current) => ({
      ...current,
      [key]: parseInt(value, 10) || 0,
    }));
  };

  const setBool = (key: keyof typeof form) => (value: boolean) => {
    setForm((current) => ({
      ...current,
      [key]: value,
    }));
  };

  const numberField = (key: keyof typeof form, label: string) => (
    <div>
      <label className="flex items-center text-xs font-semibold text-muted-foreground">
        {label}
        {TIER_FIELD_INFO[key as string] && <FieldInfo {...TIER_FIELD_INFO[key as string]} />}
      </label>
      <input
        type="number"
        min={0}
        value={String((form as any)[key])}
        onChange={(e) => setNumber(key)(e.target.value)}
        className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
      />
    </div>
  );

  const boolField = (key: keyof typeof form, label: string) => (
    <label className="flex items-center justify-between gap-3 rounded-lg border border-border bg-background px-3 py-2 text-sm">
      <span className="flex items-center font-medium text-foreground">
        {label}
        {TIER_FIELD_INFO[key as string] && <FieldInfo {...TIER_FIELD_INFO[key as string]} />}
      </span>
      <input
        type="checkbox"
        checked={Boolean((form as any)[key])}
        onChange={(e) => setBool(key)(e.target.checked)}
        className="h-4 w-4 rounded border-border"
      />
    </label>
  );

  return (
    <div className="mt-6 space-y-5">
      <div>
        <h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-foreground">
          <Sparkles className="h-4 w-4 text-emerald-600" />
          Core tier controls
        </h3>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {boolField("tierModelEnabled", "Enable tier model")}
          {boolField("requireKyc", "Require KYC")}
          {boolField("requireAutoDebit", "Require Auto-Debit")}
          {boolField("requireAutoContribute", "Require Auto-Contribute")}
          {numberField("contributionMultiplier", "Contribution multiplier")}
          {numberField("minContributionRight", "Minimum Contribution Right")}
          {numberField("defaultBroadcastHours", "Default broadcast hours")}
        </div>
      </div>

      <div>
        <h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-foreground">
          <TimerReset className="h-4 w-4 text-amber-600" />
          Cooling & extension rules
        </h3>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {numberField("autoExtensionHours", "Auto-extension hours")}
          {numberField("maxAutoExtensions", "Maximum auto-extensions")}
          {numberField("defaultCoolingMonthsMin", "Default cooling min (months)")}
          {numberField("defaultCoolingMonthsMax", "Default cooling max (months)")}
          {numberField("sponsorshipRequiredCount", "Sponsor count for reduction")}
          {numberField("sponsorshipReducedCoolingMonths", "Reduced cooling months")}
          {boolField("sponsorshipRequiresKyc", "Sponsor reduction requires KYC")}
          {boolField("sponsorshipRequiresRegularPlus", "Sponsor reduction requires Regular Plus")}
          {boolField("sponsorshipAutoApply", "Auto-apply sponsor reduction")}
          {boolField("badgeGiftingEnabled", "Enable badge gifting")}
        </div>
      </div>

      <div>
        <label className="text-xs font-semibold text-muted-foreground">Change reason</label>
        <textarea
          value={form.reason}
          onChange={(e) => setForm((current) => ({ ...current, reason: e.target.value }))}
          rows={3}
          className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
          placeholder="Optional note for the audit log"
        />
      </div>

      <button
        onClick={() => onSave(form)}
        disabled={isPending || !config}
        className="rounded-lg bg-purple-600 px-4 py-2 text-sm font-semibold text-white hover:bg-purple-700 disabled:opacity-50"
      >
        {isPending ? "Saving..." : "Save CSP Tier Rules"}
      </button>
    </div>
  );
}

function RuleChangeLogViewer({
  pageData,
  page,
  filter,
  onFilterChange,
  onPageChange,
  onRefresh,
  isFetching,
}: {
  pageData: TierRuleChangeLogPage | undefined;
  page: number;
  filter: string;
  onFilterChange: (value: string) => void;
  onPageChange: (page: number) => void;
  onRefresh: () => void;
  isFetching: boolean;
}) {
  const logs = pageData?.logs ?? [];
  const total = pageData?.total ?? 0;
  const totalPages = pageData?.totalPages ?? 1;

  const formatValue = (value: string | null) => {
    if (value == null || value === "") return "—";
    return value;
  };

  return (
    <div className="mt-6 space-y-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div className="grid gap-3 sm:grid-cols-[minmax(0,320px)_auto]">
          <div>
            <label className="text-xs font-semibold text-muted-foreground">Rule key filter</label>
            <input
              value={filter}
              onChange={(e) => onFilterChange(e.target.value)}
              className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
              placeholder="e.g. csp_default_broadcast_hours"
            />
          </div>
          <button
            onClick={onRefresh}
            disabled={isFetching}
            className="mt-6 inline-flex items-center justify-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-semibold text-foreground hover:bg-muted disabled:opacity-50"
          >
            <RefreshCw className={isFetching ? "h-4 w-4 animate-spin" : "h-4 w-4"} />
            Refresh
          </button>
        </div>
        <div className="text-sm text-muted-foreground">
          {total} change{total === 1 ? "" : "s"} total
        </div>
      </div>

      {logs.length === 0 ? (
        <div className="rounded-xl border border-border bg-background px-4 py-6 text-sm text-muted-foreground">
          No rule changes found.
        </div>
      ) : (
        <div className="space-y-3">
          {logs.map((log) => (
            <div key={log.id} className="rounded-xl border border-border bg-background p-4">
              <div className="flex flex-col gap-2 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-purple-100 px-2.5 py-1 text-xs font-semibold text-purple-700 dark:bg-purple-900/30 dark:text-purple-200">
                      {log.ruleKey}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(log.createdAt), "PPpp")}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">
                    by <span className="font-medium text-foreground">{log.AdminUser?.name ?? log.AdminUser?.email ?? "Unknown admin"}</span>
                  </p>
                </div>
                <p className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(log.createdAt), { addSuffix: true })}
                </p>
              </div>

              <div className="mt-4 grid gap-3 md:grid-cols-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Previous</p>
                  <p className="mt-1 rounded-lg bg-muted px-3 py-2 text-sm font-mono text-foreground break-words">
                    {formatValue(log.previousValue)}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Current</p>
                  <p className="mt-1 rounded-lg bg-muted px-3 py-2 text-sm font-mono text-foreground break-words">
                    {formatValue(log.newValue)}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Reason</p>
                  <p className="mt-1 rounded-lg bg-muted px-3 py-2 text-sm text-foreground break-words">
                    {formatValue(log.reason)}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-between gap-3">
          <button
            onClick={() => onPageChange(Math.max(1, page - 1))}
            disabled={page <= 1}
            className="rounded-lg border border-border px-3 py-2 text-sm font-semibold disabled:opacity-50"
          >
            Previous
          </button>
          <span className="text-sm text-muted-foreground">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => onPageChange(Math.min(totalPages, page + 1))}
            disabled={page >= totalPages}
            className="rounded-lg border border-border px-3 py-2 text-sm font-semibold disabled:opacity-50"
          >
            Next
          </button>
        </div>
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
