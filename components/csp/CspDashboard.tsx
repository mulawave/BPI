"use client";

import { useMemo, useState } from "react";
import { api } from "@/client/trpc";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import toast from "react-hot-toast";
import {
  CheckCircle2,
  AlertTriangle,
  Clock,
  Users,
  Target,
  RadioTower,
  Wallet,
  Sparkles,
  ArrowUpRight,
  Mail,
  Bell,
  Shield,
  Zap,
  Globe,
  HeadphonesIcon,
  ChevronRight,
} from "lucide-react";

interface CspDashboardProps {
  userName?: string | null;
}

const membershipRank = ["basic", "regular", "regular plus", "gold", "platinum", "platinum plus"] as const;

type Membership = typeof membershipRank[number];

type SupportCategory = "national" | "global";

export function CspDashboard({ userName }: CspDashboardProps) {
  const [supportCategory, setSupportCategory] = useState<SupportCategory>("national");
  const [purpose, setPurpose] = useState("");
  const [amount, setAmount] = useState("10000");
  const [notes, setNotes] = useState("");
  const [selectedBroadcast, setSelectedBroadcast] = useState<any | null>(null);
  const [contributionAmount, setContributionAmount] = useState("");
  const [contributionWallet, setContributionWallet] = useState<"community" | "wallet">("wallet");

  const categoryRules = {
    national: {
      label: "National",
      minMembership: "regular plus" as Membership,
      minDirects: 10,
      minThreshold: 10000,
      broadcastHours: 48,
    },
    global: {
      label: "Global",
      minMembership: "gold" as Membership,
      minDirects: 20,
      minThreshold: 20000,
      broadcastHours: 48,
    },
  } satisfies Record<SupportCategory, { label: string; minMembership: Membership; minDirects: number; minThreshold: number; broadcastHours: number }>;

  const eligibilityQuery = api.csp.getEligibility.useQuery(undefined, { refetchOnWindowFocus: false });
  const liveStatusQuery = api.csp.getLiveStatus.useQuery(undefined, { refetchOnWindowFocus: false });
  const historyQuery = api.csp.listHistory.useQuery({ pageSize: 5 }, { refetchOnWindowFocus: false });
  const broadcastsQuery = api.csp.listBroadcasts.useQuery(undefined, { refetchOnWindowFocus: false });
  const submitRequest = api.csp.submitRequest.useMutation({
    onSuccess: () => {
      toast.success("Support request submitted for approval.");
      liveStatusQuery.refetch();
      historyQuery.refetch();
      setPurpose("");
      setNotes("");
      setAmount(categoryRules[supportCategory].minThreshold.toString());
    },
    onError: (err) => {
      toast.error(err.message || "Failed to submit request");
    },
  });

  const contributeMutation = api.csp.contribute.useMutation({
    onSuccess: () => {
      toast.success("Contribution submitted and held");
      setSelectedBroadcast(null);
      setContributionAmount("");
      broadcastsQuery.refetch();
      liveStatusQuery.refetch();
      eligibilityQuery.refetch();
    },
    onError: (err) => toast.error(err.message),
  });

  const profile = {
    membership: (eligibilityQuery.data?.membershipName?.toLowerCase() as Membership) ?? ("basic" as Membership),
    membershipLabel: eligibilityQuery.data?.membershipName ?? "No active membership",
    membershipActive: eligibilityQuery.data?.membershipActive ?? false,
    directReferrals: eligibilityQuery.data?.directReferrals ?? 0,
    contributionsMade: eligibilityQuery.data?.cumulativeContributions ?? 0,
    minContributionRequired: eligibilityQuery.data?.minContributionRequired ?? 10000,
    minPerContribution: eligibilityQuery.data?.minPerContribution ?? 500,
    requestsContributed: eligibilityQuery.data?.requestsContributed ?? 0,
    minDistinctRequests: eligibilityQuery.data?.minDistinctRequests ?? 10,
    nationalDirectRequired: 10,
    globalDirectRequired: 20,
  };

  const balances = {
    cash: eligibilityQuery.data?.walletBalance ?? 0,
    community: eligibilityQuery.data?.communityBalance ?? 0,
  };

  const eligibility = useMemo(() => {
    const backend = eligibilityQuery.data?.categories?.[supportCategory];
    const rules = categoryRules[supportCategory];
    if (!backend) {
      return {
        eligible: false,
        hasMembership: false,
        hasDirects: false,
        hasContrib: false,
        hasDistinct: false,
        meetsMinPerContribution: false,
        rules,
      };
    }

    return {
      eligible: backend.eligible,
      hasMembership: backend.hasMembership,
      hasDirects: backend.hasDirects,
      hasContrib: backend.hasContrib,
      hasDistinct: backend.hasDistinct,
      meetsMinPerContribution: profile.minPerContribution >= 500,
      rules,
    };
  }, [eligibilityQuery.data, profile.minPerContribution, supportCategory]);

  const extensionPaid = [
    { amount: 40000, hours: 24 },
    { amount: 60000, hours: 48 },
    { amount: 80000, hours: 72 },
    { amount: 100000, hours: 168 },
  ];

  const extensionReferrals = [
    { directs: 30, hours: 24 },
    { directs: 40, hours: 48 },
    { directs: 50, hours: 72 },
    { directs: 100, hours: 168 },
  ];

  const contributionSplit = [
    { label: "Recipient Support", pct: 80, desc: "Recipient support wallet" },
    { label: "Admin Wallet", pct: 5, desc: "System administration" },
    { label: "Sponsor / Referrer", pct: 1, desc: "Direct sponsor reward" },
    { label: "State Wallet", pct: 2, desc: "State reps" },
    { label: "Management Wallet", pct: 5, desc: "Managed beneficiaries" },
    { label: "Reserve Wallet", pct: 7, desc: "Management reserve" },
  ];

  const history = (historyQuery.data?.items ?? []).map((item: { id: string; category: string; amount: number; status: string; createdAt: string | Date }) => ({
    id: item.id,
    category: item.category,
    amount: item.amount,
    status: item.status,
    date: new Date(item.createdAt).toLocaleDateString(),
  }));

  const broadcasts = broadcastsQuery.data ?? [];
  const broadcastColumns = useMemo(() => {
    const perColumn = 5;
    const chunks: typeof broadcastsQuery.data[] = [];
    for (let i = 0; i < broadcasts.length; i += perColumn) {
      chunks.push(broadcasts.slice(i, i + perColumn));
    }
    return chunks;
  }, [broadcasts]);

  const liveStatus = liveStatusQuery.data;

  const formatCountdown = (seconds?: number | null) => {
    if (!seconds || seconds <= 0) return "--";
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${String(hrs).padStart(2, "0")}:${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  const handleSubmit = () => {
    if (!eligibility.eligible) {
      toast.error("You must meet all eligibility rules before requesting support.");
      return;
    }
    const parsedAmount = Number(amount);
    submitRequest.mutate({
      category: supportCategory,
      amount: Number.isNaN(parsedAmount) ? categoryRules[supportCategory].minThreshold : parsedAmount,
      purpose,
      notes,
    });
  };

  return (
    <div className="space-y-6">
      {/* Hero */}
      <Card className="relative overflow-hidden bg-gradient-to-br from-emerald-500 via-emerald-600 to-emerald-700 text-white p-6 sm:p-8 shadow-xl">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.08),transparent_45%),radial-gradient(circle_at_bottom_right,rgba(255,255,255,0.12),transparent_40%)]" />
        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <p className="text-sm uppercase tracking-wide text-white/80">Community Support Program</p>
            <h1 className="text-2xl sm:text-3xl font-bold mt-2">Request & Track Support</h1>
            <p className="text-white/80 mt-2 max-w-2xl">
              Check eligibility, request support, monitor broadcasts, and view wallet splits in one place.
            </p>
          </div>
          <div className="flex items-center gap-3 bg-white/10 rounded-xl px-4 py-3 backdrop-blur border border-white/20">
            {eligibility.eligible ? (
              <CheckCircle2 className="w-6 h-6 text-white" />
            ) : (
              <AlertTriangle className="w-6 h-6 text-amber-200" />
            )}
            <div>
              <p className="text-sm font-semibold">Status</p>
              <p className="text-white/80 text-sm">
                {eligibility.eligible ? "Eligible to request support" : "Complete requirements to unlock"}
              </p>
            </div>
          </div>
        </div>
      </Card>

      {/* Wallet balances */}
      <div className="grid sm:grid-cols-2 gap-3">
        <Card className="p-4 border-l-4 border-l-emerald-500 bg-white dark:bg-bpi-dark-card flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground">Cash Wallet</p>
            <p className="text-xl font-bold text-foreground">₦{balances.cash.toLocaleString()}</p>
          </div>
          <Wallet className="w-6 h-6 text-emerald-600" />
        </Card>
        <Card className="p-4 border-l-4 border-l-blue-500 bg-white dark:bg-bpi-dark-card flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground">Community Wallet</p>
            <p className="text-xl font-bold text-foreground">₦{balances.community.toLocaleString()}</p>
          </div>
          <Users className="w-6 h-6 text-blue-600" />
        </Card>
      </div>

      {/* Eligibility overview */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <Card className="p-4 border-l-4 border-l-emerald-500 bg-white dark:bg-bpi-dark-card">
          <div className="flex items-center gap-3">
            <Shield className="w-5 h-5 text-emerald-600" />
            <div>
              <p className="text-xs text-muted-foreground">Membership</p>
              <p className="font-semibold text-foreground">{profile.membershipLabel}</p>
              <p className="text-[11px] text-muted-foreground">{profile.membershipActive ? "Active" : "Inactive"}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4 border-l-4 border-l-emerald-500 bg-white dark:bg-bpi-dark-card">
          <div className="flex items-center gap-3">
            <Target className="w-5 h-5 text-emerald-600" />
            <div>
              <p className="text-xs text-muted-foreground">Direct referrals</p>
              <p className="font-semibold text-foreground">{profile.directReferrals}</p>
              <p className="text-[11px] text-muted-foreground">Need {categoryRules[supportCategory].minDirects}+ for {categoryRules[supportCategory].label}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4 border-l-4 border-l-emerald-500 bg-white dark:bg-bpi-dark-card">
          <div className="flex items-center gap-3">
            <Wallet className="w-5 h-5 text-emerald-600" />
            <div>
              <p className="text-xs text-muted-foreground">Contributions made</p>
              <p className="font-semibold text-foreground">₦{profile.contributionsMade.toLocaleString()}</p>
              <p className="text-[11px] text-muted-foreground">Min ₦{profile.minContributionRequired.toLocaleString()} to qualify</p>
            </div>
          </div>
        </Card>
        <Card className="p-4 border-l-4 border-l-emerald-500 bg-white dark:bg-bpi-dark-card">
          <div className="flex items-center gap-3">
            <Clock className="w-5 h-5 text-emerald-600" />
            <div>
              <p className="text-xs text-muted-foreground">Broadcast window</p>
              <p className="font-semibold text-foreground">{categoryRules[supportCategory].broadcastHours} hrs</p>
              <p className="text-[11px] text-muted-foreground">Extendable via payments or directs</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Request + rules */}
      <div className="grid lg:grid-cols-3 gap-4 items-start">
        <Card className="p-5 bg-white dark:bg-bpi-dark-card lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between gap-2">
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Support Request</p>
              <h3 className="text-lg font-semibold text-foreground">Submit a request</h3>
            </div>
            <span className={`px-3 py-1 text-xs font-semibold rounded-full ${eligibility.eligible ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-200" : "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-200"}`}>
              {eligibility.eligible ? "Eligible" : "Locked"}
            </span>
          </div>

          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium text-foreground">Support category</label>
              <div className="mt-1 grid grid-cols-2 gap-2">
                {(["national", "global"] as SupportCategory[]).map((cat) => {
                  const active = supportCategory === cat;
                  const rules = categoryRules[cat];
                  return (
                    <button
                      key={cat}
                      onClick={() => setSupportCategory(cat)}
                      className={`w-full rounded-lg border px-3 py-2 text-left transition ${active ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20" : "border-gray-200 dark:border-bpi-dark-accent"}`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-foreground">{rules.label}</span>
                        <Globe className="w-4 h-4 text-muted-foreground" />
                      </div>
                      <p className="text-xs text-muted-foreground">Directs {rules.minDirects}+ • Threshold ₦{rules.minThreshold.toLocaleString()}</p>
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-sm font-medium text-foreground">Requested amount</label>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-gray-200 dark:border-bpi-dark-accent bg-background px-3 py-2 text-sm"
                  min={categoryRules[supportCategory].minThreshold}
                />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">Purpose</label>
                <input
                  type="text"
                  value={purpose}
                  onChange={(e) => setPurpose(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-gray-200 dark:border-bpi-dark-accent bg-background px-3 py-2 text-sm"
                  placeholder="E.g. medical, rent"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-foreground">Additional details</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="mt-1 w-full rounded-lg border border-gray-200 dark:border-bpi-dark-accent bg-background px-3 py-2 text-sm"
              placeholder="Add context for management approval"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <span className={`px-2 py-1 rounded-full ${eligibility.hasMembership ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-200" : "bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-200"}`}>
              {eligibility.hasMembership ? "Membership ok" : "Upgrade membership"}
            </span>
            <span className={`px-2 py-1 rounded-full ${eligibility.hasDirects ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-200" : "bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-200"}`}>
              {eligibility.hasDirects ? "Directs ok" : `Need ${categoryRules[supportCategory].minDirects}+ directs`}
            </span>
            <span className={`px-2 py-1 rounded-full ${eligibility.hasContrib ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-200" : "bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-200"}`}>
              {eligibility.hasContrib ? "Contribution ok" : "Contribute ₦10k cumulative"}
            </span>
            <span className={`px-2 py-1 rounded-full ${eligibility.hasDistinct ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-200" : "bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-200"}`}>
              {eligibility.hasDistinct ? "10 requests met" : `${profile.minDistinctRequests} distinct requests needed`}
            </span>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="text-xs text-muted-foreground flex items-center gap-2">
              <Mail className="w-4 h-4" />
              Confirmation email and broadcast will be sent after approval.
            </div>
            <Button
              onClick={handleSubmit}
              disabled={!eligibility.eligible}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              Submit for approval
            </Button>
          </div>
        </Card>

        <Card className="p-5 bg-white dark:bg-bpi-dark-card space-y-3">
          <div className="flex items-center gap-2">
            <HeadphonesIcon className="w-5 h-5 text-emerald-600" />
            <h4 className="font-semibold text-foreground">Live status</h4>
          </div>
          <div className="rounded-xl border border-emerald-100 dark:border-emerald-900/40 bg-emerald-50/60 dark:bg-emerald-900/10 p-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-foreground">Broadcast window</p>
              <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-200">{formatCountdown(liveStatus?.remainingSeconds)}</span>
            </div>
            <p className="text-xs text-muted-foreground">Auto-closes when time or threshold reached.</p>
            <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
              <div className="p-3 rounded-lg bg-white dark:bg-bpi-dark-card border border-gray-100 dark:border-bpi-dark-accent">
                <p className="text-muted-foreground">Raised</p>
                <p className="font-semibold text-foreground">₦{(liveStatus?.raisedAmount ?? 0).toLocaleString()} / ₦{(liveStatus?.thresholdAmount ?? categoryRules[supportCategory].minThreshold).toLocaleString()}</p>
              </div>
              <div className="p-3 rounded-lg bg-white dark:bg-bpi-dark-card border border-gray-100 dark:border-bpi-dark-accent">
                <p className="text-muted-foreground">Contributors</p>
                <p className="font-semibold text-foreground">{liveStatus?.contributorsCount ?? 0}</p>
              </div>
            </div>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Bell className="w-4 h-4" />
              Broadcast will notify email, dashboard, Telegram, WhatsApp bots.
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <RadioTower className="w-4 h-4" />
              Management approval required before going live.
            </div>
          </div>
        </Card>
      </div>

      {/* Extensions and split */}
      <div className="grid lg:grid-cols-2 gap-4">
        <Card className="p-5 bg-white dark:bg-bpi-dark-card space-y-4">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-emerald-600" />
            <h4 className="font-semibold text-foreground">Time extensions</h4>
          </div>
          <div className="space-y-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase">Pay for extra time</p>
            <div className="grid grid-cols-2 gap-2 text-sm">
              {extensionPaid.map((row) => (
                <div key={row.amount} className="p-3 rounded-lg border border-gray-200 dark:border-bpi-dark-accent bg-gradient-to-r from-emerald-50 to-emerald-50/50 dark:from-emerald-900/10 dark:to-emerald-900/5">
                  <p className="font-semibold text-foreground">+{row.hours} hrs</p>
                  <p className="text-xs text-muted-foreground">Pay ₦{row.amount.toLocaleString()}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase">Earn extra time via directs</p>
            <div className="grid grid-cols-2 gap-2 text-sm">
              {extensionReferrals.map((row) => (
                <div key={row.directs} className="p-3 rounded-lg border border-gray-200 dark:border-bpi-dark-accent bg-gradient-to-r from-blue-50 to-blue-50/50 dark:from-blue-900/10 dark:to-blue-900/5">
                  <p className="font-semibold text-foreground">+{row.hours} hrs</p>
                  <p className="text-xs text-muted-foreground">Add {row.directs} directs</p>
                </div>
              ))}
            </div>
          </div>
        </Card>

        <Card className="p-5 bg-white dark:bg-bpi-dark-card space-y-3">
          <div className="flex items-center gap-2">
            <Wallet className="w-5 h-5 text-emerald-600" />
            <h4 className="font-semibold text-foreground">80 / 20 split preview</h4>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {contributionSplit.map((item) => (
              <div key={item.label} className="p-3 rounded-lg border border-gray-200 dark:border-bpi-dark-accent bg-gray-50 dark:bg-bpi-dark-accent/30">
                <div className="flex items-center justify-between">
                  <p className="font-semibold text-foreground text-sm">{item.label}</p>
                  <span className="text-xs font-bold text-emerald-700 dark:text-emerald-200">{item.pct}%</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">{item.desc}</p>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-5 bg-white dark:bg-bpi-dark-card space-y-3 lg:col-span-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <RadioTower className="w-5 h-5 text-emerald-600" />
              <h4 className="font-semibold text-foreground">Active broadcasts</h4>
            </div>
            <Button variant="outline" size="sm" onClick={() => broadcastsQuery.refetch()}>
              Refresh
            </Button>
          </div>

          {broadcastsQuery.data && broadcastsQuery.data.length === 0 && (
            <p className="text-sm text-muted-foreground">No active broadcasts right now.</p>
          )}

          <div className="grid lg:grid-cols-2 gap-3">
            {broadcastColumns.map((col, idx) => (
              <div key={idx} className="space-y-3">
                {col.map((item) => {
                  const percent = Math.min(100, Math.floor((item.raisedAmount / item.thresholdAmount) * 100));
                  const remaining = item.broadcastExpiresAt ? formatCountdown(Math.floor((new Date(item.broadcastExpiresAt).getTime() - Date.now()) / 1000)) : "--";
                  const targetMet = item.raisedAmount >= item.thresholdAmount;
                  return (
                    <div key={item.id} className="rounded-lg border border-gray-200 dark:border-bpi-dark-accent bg-gray-50 dark:bg-bpi-dark-accent/30 p-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-semibold">
                            {item.user?.name?.[0]?.toUpperCase() ?? item.user?.email?.[0]?.toUpperCase() ?? "?"}
                          </div>
                          <div>
                            <p className="font-semibold text-foreground text-sm">{item.user?.name ?? item.user?.email ?? "User"}</p>
                            <p className="text-xs text-muted-foreground">{item.user?.email}</p>
                          </div>
                        </div>
                        {targetMet ? (
                          <span className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700 border border-blue-100">
                            <CheckCircle2 className="h-4 w-4" /> Target met
                          </span>
                        ) : (
                          <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => setSelectedBroadcast(item)}>
                            Contribute
                          </Button>
                        )}
                      </div>
                      <div className="mt-2 flex items-center justify-between text-sm">
                        <div>
                          <p className="font-semibold text-foreground">₦{item.thresholdAmount.toLocaleString()}</p>
                          <p className="text-xs text-muted-foreground">Requested • {item.category}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-foreground">₦{item.raisedAmount.toLocaleString()}</p>
                          <p className="text-xs text-muted-foreground">Raised</p>
                        </div>
                      </div>
                      <div className="mt-2 h-2 rounded-full bg-gray-200 dark:bg-bpi-dark-accent overflow-hidden">
                        <div className="h-full bg-emerald-500" style={{ width: `${percent}%` }} />
                      </div>
                      <div className="mt-1 flex items-center justify-between text-xs text-muted-foreground">
                        <span>{percent}% funded</span>
                        <span>{item.isAdminDefault ? "No expiry" : `Time left: ${remaining}`}</span>
                      </div>
                      <p className="mt-2 text-sm text-foreground">Purpose: {item.purpose}</p>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* History & notifications */}
      <div className="grid lg:grid-cols-3 gap-4">
        <Card className="p-5 bg-white dark:bg-bpi-dark-card lg:col-span-2">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-emerald-600" />
              <h4 className="font-semibold text-foreground">Recent requests</h4>
            </div>
            <Button variant="outline" size="sm" className="gap-1">
              View all
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
          <div className="divide-y divide-gray-200 dark:divide-bpi-dark-accent">
                {history.map((item: { id: string; category: string; date: string; amount: number; status: string }) => (
                  <div key={item.id} className="py-3 flex items-center justify-between text-sm">
                    <div>
                      <p className="font-semibold text-foreground">{item.id}</p>
                      <p className="text-xs text-muted-foreground">{item.category} • {item.date}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-foreground">₦{Number(item.amount).toLocaleString()}</p>
                      <span className={`text-[11px] px-2 py-1 rounded-full ${["approved", "broadcasting", "closed"].includes(item.status.toLowerCase()) ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-200" : "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-200"}`}>
                        {item.status}
                      </span>
                    </div>
                  </div>
                ))}
          </div>
        </Card>

        <Card className="p-5 bg-white dark:bg-bpi-dark-card space-y-3">
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-emerald-600" />
            <h4 className="font-semibold text-foreground">Notifications</h4>
          </div>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-600" /> Qualification notice</li>
            <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-600" /> Request submitted</li>
            <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-600" /> Approval + broadcast</li>
            <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-600" /> Contribution confirmation</li>
            <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-600" /> Countdown expiry alerts</li>
          </ul>
        </Card>
      </div>

      <Card className="p-5 bg-white dark:bg-bpi-dark-card">
        <div className="flex items-center gap-2 mb-3">
          <RadioTower className="w-5 h-5 text-emerald-600" />
          <h4 className="font-semibold text-foreground">What happens next?</h4>
        </div>
        <div className="grid md:grid-cols-4 gap-3 text-sm">
          {[
            { title: "Submit", desc: "Send request with purpose and amount." },
            { title: "Approval", desc: "Management reviews and approves." },
            { title: "Broadcast", desc: "48h window to raise threshold." },
            { title: "Payout", desc: "Auto 80/20 split across wallets." },
          ].map((step, idx) => (
            <div key={step.title} className="p-3 rounded-lg border border-gray-200 dark:border-bpi-dark-accent bg-gray-50 dark:bg-bpi-dark-accent/30">
              <p className="text-xs text-muted-foreground">Step {idx + 1}</p>
              <p className="font-semibold text-foreground">{step.title}</p>
              <p className="text-xs text-muted-foreground mt-1">{step.desc}</p>
            </div>
          ))}
        </div>
      </Card>

      {selectedBroadcast && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="absolute inset-0" onClick={() => setSelectedBroadcast(null)} />
          <div className="relative w-full max-w-lg rounded-2xl bg-white dark:bg-bpi-dark-card border border-border p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Contribute to</p>
                <h3 className="text-lg font-semibold text-foreground">{selectedBroadcast.user?.name ?? selectedBroadcast.user?.email ?? "User"}</h3>
                <p className="text-xs text-muted-foreground">{selectedBroadcast.purpose}</p>
              </div>
              <button className="text-muted-foreground" onClick={() => setSelectedBroadcast(null)}>✕</button>
            </div>

            <div className="grid gap-3">
              <div>
                <label className="text-sm font-medium text-foreground">Amount (min ₦500)</label>
                <input
                  type="number"
                  min={500}
                  value={contributionAmount}
                  onChange={(e) => setContributionAmount(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-gray-200 dark:border-bpi-dark-accent bg-background px-3 py-2 text-sm"
                  placeholder="Enter amount"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-foreground">Wallet</label>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  {["wallet", "community"].map((w) => (
                    <button
                      key={w}
                      onClick={() => setContributionWallet(w as "wallet" | "community")}
                      className={`rounded-lg border px-3 py-2 text-sm font-semibold capitalize transition ${contributionWallet === w ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20" : "border-gray-200 dark:border-bpi-dark-accent"}`}
                    >
                      {w === "wallet"
                        ? `Cash Wallet • ₦${balances.cash.toLocaleString()}`
                        : `Community Wallet • ₦${balances.community.toLocaleString()}`}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground mt-1">Only Cash or Community wallets are accepted. Balances refresh after each contribution.</p>
              </div>
            </div>

            <Button
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
              disabled={contributeMutation.isPending || !contributionAmount}
              onClick={() => {
                const amt = Number(contributionAmount);
                if (Number.isNaN(amt) || amt < 500) {
                  toast.error("Minimum contribution is ₦500");
                  return;
                }
                contributeMutation.mutate({
                  requestId: selectedBroadcast.id,
                  amount: amt,
                  walletType: contributionWallet,
                });
              }}
            >
              {contributeMutation.isPending ? "Processing..." : "Submit contribution"}
            </Button>

            <p className="text-xs text-muted-foreground">
              Funds are held until the requester hits the threshold. Admin releases payout with 80/20 split.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export default CspDashboard;
