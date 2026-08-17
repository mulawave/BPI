"use client";

import { useEffect, useMemo, useState, startTransition, useRef } from "react";
import { api } from "@/client/trpc";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import toast from "react-hot-toast";
import { PaymentPurpose } from "@/server/services/payment";
import CryptoTransferDetails from "@/components/payment/CryptoTransferDetails";
import { useCurrency } from '@/contexts/CurrencyContext';
import { Input } from "@/components/ui/input";
import { isCspBroadcastVisible } from "@/lib/csp/broadcastVisibility";
import {
  CheckCircle2,
  AlertTriangle,
  Clock,
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
  TimerReset,
  TrendingDown,
  Crown,
  Gem,
  Award,
  Landmark,
  ScrollText,
  Lock,
} from "lucide-react";

interface CspDashboardProps {
  userName?: string | null;
}

const membershipRank = ["basic", "regular", "regular plus", "gold", "platinum", "platinum plus"] as const;

type Membership = typeof membershipRank[number];

type SupportCategory = "national" | "global";

function hashRequestId(value: string) {
  let hash = 0;
  for (let i = 0; i < value.length; i++) {
    hash = (hash << 5) - hash + value.charCodeAt(i);
    hash |= 0;
  }
  const normalized = Math.abs(hash).toString(36).slice(0, 8);
  return `CSP-${normalized}`;
}

function shuffleArray<T>(input: T[]) {
  const arr = [...input];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export function CspDashboard({ userName }: CspDashboardProps) {
  const { formatAmount, selectedCurrency } = useCurrency();
  const [supportCategory, setSupportCategory] = useState<SupportCategory>("national");
  const [purpose, setPurpose] = useState("");
  const [amount, setAmount] = useState("10000");
  const [notes, setNotes] = useState("");
  const [selectedBroadcast, setSelectedBroadcast] = useState<any | null>(null);
  const [contributionAmount, setContributionAmount] = useState("");
  const [contributionWallet, setContributionWallet] = useState<"community" | "wallet" | "crypto">("wallet");
  const [cryptoTxHash, setCryptoTxHash] = useState("");
  const [shuffledBroadcasts, setShuffledBroadcasts] = useState<typeof broadcastsQuery.data>([]);
  const [giftBadgeId, setGiftBadgeId] = useState<string | null>(null);
  const [giftRecipient, setGiftRecipient] = useState("");

  const categoryRulesFallback = {
    national: { label: "National", minDirects: 2, minThreshold: 10000, broadcastHours: 48, minCumulativeContrib: 10000, minDistinctRequests: 10 },
    global: { label: "Global", minDirects: 10, minThreshold: 20000, broadcastHours: 48, minCumulativeContrib: 20000, minDistinctRequests: 10 },
  };

  const utils = api.useUtils();

  // ── Cancel all in-flight CSP queries when navigating away ─────────────────
  // React Query does NOT automatically abort batched fetch requests on unmount.
  // Without this, a slow getEligibility response holds the HTTP connection open
  // (up to the 20s timeout), blocking Next.js navigation fetches entirely.
  const utilsRef = useRef(utils);
  utilsRef.current = utils;
  useEffect(() => {
    return () => {
      void utilsRef.current.csp.getEligibility.cancel();
      void utilsRef.current.csp.getWaitStatus.cancel();
      void utilsRef.current.csp.getMyCspRecognition.cancel();
      void utilsRef.current.csp.getLiveStatus.cancel();
      void utilsRef.current.csp.listHistory.cancel();
      void utilsRef.current.csp.listBroadcasts.cancel();
      void utilsRef.current.notification.getMyNotifications.cancel();
    };
  }, []);

  const eligibilityQuery = api.csp.getEligibility.useQuery(undefined, { refetchOnWindowFocus: false, retry: false, staleTime: 2 * 60 * 1000 });
  // Consume the already-cached user.getDetails (loaded by DashboardContent — zero extra fetch)
  // used as reliable fallback when eligibility cache predates a membership activation
  const { data: userDetails } = api.user.getDetails.useQuery(undefined, { staleTime: 5 * 60 * 1000, refetchOnWindowFocus: false });
  const waitStatusQuery = api.csp.getWaitStatus.useQuery(undefined, { refetchOnWindowFocus: false, retry: false, staleTime: 2 * 60 * 1000 });
  const recognitionQuery = api.csp.getMyCspRecognition.useQuery(undefined, { refetchOnWindowFocus: false, retry: false, staleTime: 2 * 60 * 1000 });
  const liveStatusQuery = api.csp.getLiveStatus.useQuery(undefined, { refetchOnWindowFocus: false, retry: false, staleTime: 60 * 1000 });
  const historyQuery = api.csp.listHistory.useQuery({ pageSize: 5 }, { refetchOnWindowFocus: false, retry: false, staleTime: 2 * 60 * 1000 });
  const broadcastsQuery = api.csp.listBroadcasts.useQuery(undefined, { refetchOnWindowFocus: true, retry: false, staleTime: 60 * 1000, refetchInterval: 15 * 1000 });
  const communicationFeedQuery = api.csp.getCommunicationFeed.useQuery(undefined, { refetchOnWindowFocus: false, staleTime: 60 * 1000 });
  const notificationsQuery = api.notification.getMyNotifications.useQuery(undefined, { refetchOnWindowFocus: false, staleTime: 60 * 1000 });
  const markNotificationRead = api.notification.markAsRead.useMutation({
    onSuccess: () => notificationsQuery.refetch(),
  });

  // Derive per-category config from backend when available, fall back to static defaults
  const categoryRules = {
    national: eligibilityQuery.data?.categoryConfig?.national ?? categoryRulesFallback.national,
    global: eligibilityQuery.data?.categoryConfig?.global ?? categoryRulesFallback.global,
  };
  const effectiveCategoryRules = categoryRules[supportCategory];
  const effectiveMinDirects = effectiveCategoryRules?.minDirects ?? 10;
  const directsRequirementLabel = effectiveMinDirects === 0
    ? "No directs required"
    : `${effectiveMinDirects}+ directs needed`;

  const submitRequest = api.csp.submitRequest.useMutation({
    onSuccess: () => {
      toast.success("Support request submitted for approval.");
      liveStatusQuery.refetch();
      historyQuery.refetch();
      eligibilityQuery.refetch();
      setPurpose("");
      setNotes("");
      setAmount(String(categoryRules[supportCategory]?.minThreshold ?? 10000));
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

  const cryptoContributeMutation = api.payment.submitCryptoProof.useMutation({
    onSuccess: () => {
      toast.success("Crypto proof submitted. Awaiting admin verification.");
      setSelectedBroadcast(null);
      setContributionAmount("");
      setCryptoTxHash("");
      broadcastsQuery.refetch();
    },
    onError: (err) => toast.error(err.message),
  });

  const giftBadgeMutation = api.csp.giftTimeReductionBadge.useMutation({
    onSuccess: (r: any) => {
      toast.success(`Badge gifted to ${r.recipientName}`);
      setGiftBadgeId(null);
      setGiftRecipient("");
      recognitionQuery.refetch();
    },
    onError: (err) => toast.error(err.message),
  });

  const redeemBadgeMutation = api.csp.redeemTimeReductionBadge.useMutation({
    onSuccess: (r: any) => {
      toast.success(`Cooling reduced by ${r.reducedMonths} month(s)`);
      recognitionQuery.refetch();
      eligibilityQuery.refetch();
      waitStatusQuery.refetch();
    },
    onError: (err) => toast.error(err.message),
  });

  const profile = {
    membership: (eligibilityQuery.data?.membershipName?.toLowerCase() as Membership) ?? ((userDetails?.activeMembership as any)?.name?.toLowerCase() as Membership) ?? ("basic" as Membership),
    // Prefer eligibility result; fall back to user.getDetails cache so stale eligibility never hides a valid membership
    membershipLabel: eligibilityQuery.data?.membershipName ?? (userDetails?.activeMembership as any)?.name ?? "No active membership",
    membershipActive: eligibilityQuery.data?.membershipActive ?? !!userDetails?.activeMembership,
    directReferrals: eligibilityQuery.data?.directReferrals ?? 0,
    qualifiedDirects: eligibilityQuery.data?.qualifiedDirects ?? 0,
    contributionsMade: eligibilityQuery.data?.cumulativeContributions ?? 0,
    minContributionRequired: eligibilityQuery.data?.minContributionRequired ?? 10000,
    minPerContribution: eligibilityQuery.data?.minPerContribution ?? 500,
    requestsContributed: eligibilityQuery.data?.requestsContributed ?? 0,
    minDistinctRequests: eligibilityQuery.data?.minDistinctRequests ?? 10,
    hasCooldown: waitStatusQuery.data?.hasCooldown ?? eligibilityQuery.data?.cooldown?.isActive ?? false,
    cooldownEndsAt: waitStatusQuery.data?.cooldownEndsAt ?? eligibilityQuery.data?.cooldown?.cooldownEndsAt ?? null,
    sponsorProgress: waitStatusQuery.data?.sponsorProgress ?? eligibilityQuery.data?.sponsorProgress ?? null,
  };

  const tierProfile = eligibilityQuery.data
    ? {
        contributionRight: eligibilityQuery.data.contributionRight ?? 0,
        currentTier: eligibilityQuery.data.currentTier ?? null,
        maxSupportCap: eligibilityQuery.data.maxSupportCap ?? 0,
        amountToNextTier: eligibilityQuery.data.amountToNextTier ?? null,
        kycApproved: eligibilityQuery.data.kycApproved ?? false,
        autoDebitEnabled: eligibilityQuery.data.autoDebitEnabled ?? false,
        autoContributeEnabled: eligibilityQuery.data.autoContributeEnabled ?? false,
        contributionMultiplier: eligibilityQuery.data.contributionMultiplier ?? 20,
      }
    : null;

  // Use userDetails wallet as primary source — it's already cached by DashboardContent
  // so balances appear instantly without waiting for the slow getEligibility response.
  const balances = {
    cash: (userDetails as any)?.wallet ?? eligibilityQuery.data?.walletBalance ?? 0,
    community: (userDetails as any)?.community ?? eligibilityQuery.data?.communityBalance ?? 0,
  };

  const eligibility = useMemo(() => {
    const backend = eligibilityQuery.data?.categories?.[supportCategory];
    if (!backend) {
      return {
        eligible: false,
        hasMembership: false,
        hasDirects: false,
        hasContrib: false,
        hasDistinct: false,
        meetsMinPerContribution: false,
        globalPath: null as string | null,
      };
    }

    return {
      eligible: backend.eligible,
      hasMembership: backend.hasMembership,
      hasDirects: backend.hasDirects,
      hasContrib: backend.hasContrib,
      hasDistinct: backend.hasDistinct,
      meetsMinPerContribution: profile.minPerContribution >= 500,
      globalPath: backend.globalPath ?? null,
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

  const history = (historyQuery.data?.items ?? []).map((item: { id: string; category: string; amount: number; status: string; createdAt: string | Date }) => ({
    id: item.id,
    category: item.category,
    amount: item.amount,
    status: item.status,
    date: new Date(item.createdAt).toLocaleDateString(),
  }));

  const broadcasts = broadcastsQuery.data ?? [];
  const now = new Date();
  const visibleBroadcasts = broadcasts.filter((broadcast) => isCspBroadcastVisible(broadcast, now));
  if (broadcasts.length > visibleBroadcasts.length) {
    // Stale broadcasts hidden from feed — visibleBroadcasts used for rendering
  }

  useEffect(() => {
    setShuffledBroadcasts(visibleBroadcasts);
  }, [visibleBroadcasts]);

  useEffect(() => {
    if (!visibleBroadcasts.length) return;
    const interval = setInterval(() => {
      // startTransition marks this as a non-urgent update so Next.js
      // navigation clicks are never blocked by the cosmetic shuffle re-render.
      startTransition(() => {
        setShuffledBroadcasts((prev) => {
          const source = prev && prev.length ? prev : visibleBroadcasts;
          return shuffleArray(source);
        });
      });
    }, 30000);
    return () => clearInterval(interval);
  }, [visibleBroadcasts]);

  const broadcastColumns = useMemo(() => {
    const perColumn = 5;
    const source = (shuffledBroadcasts && shuffledBroadcasts.length ? shuffledBroadcasts : visibleBroadcasts) ?? [];
    const chunks: typeof broadcastsQuery.data[] = [];
    for (let i = 0; i < source.length; i += perColumn) {
      chunks.push(source.slice(i, i + perColumn));
    }
    return chunks;
  }, [broadcasts, shuffledBroadcasts]);

  const broadcastMetrics = useMemo(() => {
    const total = broadcasts.length;
    const targetMetCount = broadcasts.filter((b) => b.raisedAmount >= b.thresholdAmount).length;
    const totalRaised = broadcasts.reduce((sum, b) => sum + b.raisedAmount, 0);
    const avgProgress = total
      ? Math.round(
          (broadcasts.reduce((sum, b) => sum + (b.raisedAmount / Math.max(1, b.thresholdAmount)), 0) / total) * 100
        )
      : 0;
    return { total, targetMetCount, totalRaised, avgProgress };
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
      amount: Number.isNaN(parsedAmount) ? (categoryRules[supportCategory]?.minThreshold ?? 10000) : parsedAmount,
      purpose,
      notes,
    });
  };

  if (eligibilityQuery.isLoading) {
    return (
      <div className="space-y-4 pb-4 animate-pulse">
        <div className="h-32 rounded-2xl bg-slate-200 dark:bg-slate-800" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-24 rounded-2xl bg-slate-200 dark:bg-slate-800" />
          ))}
        </div>
        <div className="h-64 rounded-2xl bg-slate-200 dark:bg-slate-800" />
      </div>
    );
  }

  if (eligibilityQuery.isError) {
    return (
      <div className="rounded-2xl border border-red-200 dark:border-red-800/50 bg-red-50/70 dark:bg-red-950/20 p-6 text-center space-y-2">
        <AlertTriangle className="w-8 h-8 text-red-500 mx-auto" />
        <p className="font-serif text-lg font-bold text-red-800 dark:text-red-200">Unable to load CSP dashboard</p>
        <p className="text-sm text-red-600 dark:text-red-400">Please refresh the page or try again later.</p>
        <Button variant="outline" size="sm" onClick={() => eligibilityQuery.refetch()} className="mt-2 border-red-300 dark:border-red-700 text-red-700 dark:text-red-300">
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-5 pb-4">
      {/* ── HERO BANNER ── */}
      <div className="relative overflow-hidden rounded-2xl shadow-xl ring-1 ring-amber-300/20">
        {/* Base gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#04231a] via-[#0a3d2b] to-[#062818]" />
        {/* Radial glow layers */}
        <div className="absolute -top-32 -left-24 w-[28rem] h-[28rem] rounded-full bg-emerald-500/25 blur-3xl" />
        <div className="absolute -bottom-24 -right-16 w-[26rem] h-[26rem] rounded-full bg-amber-400/15 blur-3xl" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(255,215,140,0.10),transparent_50%),radial-gradient(ellipse_at_bottom_right,rgba(16,185,129,0.18),transparent_55%)]" />
        {/* Ornamental gold top-line */}
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-amber-300/70 to-transparent" />
        <div className="absolute top-1.5 left-0 right-0 h-px bg-gradient-to-r from-transparent via-amber-300/25 to-transparent" />

        <div className="relative px-6 py-6 sm:px-8 sm:py-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="flex-1">
              <div className="flex items-center gap-2.5 mb-3">
                <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-gradient-to-br from-amber-300 to-amber-600 shadow-md ring-1 ring-amber-200/50">
                  <Crown className="h-3.5 w-3.5 text-[#2a1a05]" />
                </div>
                <span className="text-[10px] uppercase tracking-[0.3em] font-semibold text-amber-200/90">
                  Community Support Program
                </span>
              </div>

              <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold leading-[1.05] text-white tracking-tight">
                Request &amp; Steward{" "}
                <span className="bg-gradient-to-r from-amber-200 via-amber-300 to-amber-500 bg-clip-text text-transparent">
                  Community Support
                </span>
              </h1>
              <p className="mt-3 text-emerald-50/60 text-sm sm:text-base leading-relaxed max-w-xl">
                Verify your standing, submit a request, and follow live broadcasts — all in one place.
              </p>
            </div>

            {/* Status seal */}
            <div className="relative shrink-0">
              <div className="absolute -inset-1 rounded-xl bg-gradient-to-br from-amber-300/30 to-transparent blur-lg" />
              <div className="relative rounded-xl bg-white/[0.06] backdrop-blur-xl border border-amber-200/20 px-5 py-4 min-w-[260px]">
                <div className="flex items-center gap-3">
                  <div className={"flex items-center justify-center h-11 w-11 rounded-lg ring-1 " + (profile.hasCooldown ? "bg-amber-500/15 ring-amber-300/40 text-amber-200" : eligibility.eligible ? "bg-emerald-500/20 ring-emerald-300/40 text-emerald-200" : "bg-amber-500/15 ring-amber-300/40 text-amber-200")}>
                    {profile.hasCooldown ? (
                      <TimerReset className="w-5 h-5" />
                    ) : eligibility.eligible ? (
                      <CheckCircle2 className="w-5 h-5" />
                    ) : (
                      <AlertTriangle className="w-5 h-5" />
                    )}
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.3em] text-amber-200/70 font-semibold">Standing</p>
                    <p className="text-white font-serif text-lg leading-tight mt-0.5">
                      {profile.hasCooldown
                        ? "Cooldown Active"
                        : eligibility.eligible
                        ? "Eligible to Request"
                        : "Requirements Pending"}
                    </p>
                    <p className="text-emerald-50/60 text-xs mt-1 max-w-[180px]">
                      {profile.hasCooldown
                        ? "Next request temporarily locked"
                        : eligibility.eligible
                        ? "Your seal is verified"
                        : "Complete rites to unlock"}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          </div>
        </div>

      {/* ── TREasury + TIER METRICS (4-col) ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Cash Wallet */}
        <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-white via-white to-emerald-50/40 dark:from-slate-950 dark:via-emerald-950/40 dark:to-slate-950 border border-emerald-200/60 dark:border-emerald-800/40 shadow-lg shadow-emerald-900/[0.04] hover:shadow-emerald-900/[0.10] transition-shadow duration-300">
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-emerald-500/40 to-transparent" />
          <div className="absolute -top-16 -right-16 w-40 h-40 rounded-full bg-emerald-400/10 blur-2xl group-hover:bg-emerald-400/20 transition-colors" />
          <div className="relative p-4 flex items-center justify-between">
            <div>
              <p className="text-[9px] uppercase tracking-[0.25em] font-semibold text-emerald-700/70 dark:text-emerald-300/60">Cash Treasury</p>
              <p className="mt-1.5 font-serif text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
                {formatAmount(balances.cash)}
              </p>
              <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">Available</p>
            </div>
            <div className="flex items-center justify-center h-10 w-10 rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-700 shadow-md ring-1 ring-emerald-300/40">
              <Wallet className="w-4 h-4 text-white" />
            </div>
          </div>
        </div>

        {/* Community Wallet */}
        <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-white via-white to-amber-50/40 dark:from-slate-950 dark:via-amber-950/20 dark:to-slate-950 border border-amber-200/60 dark:border-amber-800/40 shadow-lg shadow-amber-900/[0.04] hover:shadow-amber-900/[0.10] transition-shadow duration-300">
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-amber-500/40 to-transparent" />
          <div className="absolute -top-16 -right-16 w-40 h-40 rounded-full bg-amber-400/10 blur-2xl group-hover:bg-amber-400/20 transition-colors" />
          <div className="relative p-4 flex items-center justify-between">
            <div>
              <p className="text-[9px] uppercase tracking-[0.25em] font-semibold text-amber-700/80 dark:text-amber-300/70">Community Coffers</p>
              <p className="mt-1.5 font-serif text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
                {formatAmount(balances.community)}
              </p>
              <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">Reserved for CSP</p>
            </div>
            <div className="flex items-center justify-center h-10 w-10 rounded-lg bg-gradient-to-br from-amber-400 to-amber-600 shadow-md ring-1 ring-amber-300/50">
              <Landmark className="w-4 h-4 text-white" />
            </div>
          </div>
        </div>

        {/* Contribution Right */}
        <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-white via-white to-emerald-50/30 dark:from-slate-950 dark:via-slate-950 dark:to-emerald-950/20 border border-slate-200/70 dark:border-slate-800/70 shadow-lg hover:shadow-xl transition-shadow">
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-emerald-500/30 to-transparent" />
          <div className="relative p-4 flex items-center justify-between">
            <div>
              <p className="text-[9px] uppercase tracking-[0.25em] font-semibold text-slate-500 dark:text-slate-400">Contribution Right</p>
              <p className="mt-1.5 font-serif text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
                {tierProfile ? formatAmount(tierProfile.contributionRight) : "—"}
              </p>
              <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">Per request</p>
            </div>
            <div className="flex items-center justify-center h-10 w-10 rounded-lg bg-gradient-to-br from-emerald-600 to-emerald-800 shadow-md ring-1 ring-emerald-300/30">
              <Sparkles className="w-4 h-4 text-amber-300" />
            </div>
          </div>
        </div>

        {/* Max Support Cap */}
        <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-white via-white to-amber-50/30 dark:from-slate-950 dark:via-slate-950 dark:to-amber-950/20 border border-slate-200/70 dark:border-slate-800/70 shadow-lg hover:shadow-xl transition-shadow">
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-amber-500/30 to-transparent" />
          <div className="relative p-4 flex items-center justify-between">
            <div>
              <p className="text-[9px] uppercase tracking-[0.25em] font-semibold text-slate-500 dark:text-slate-400">Max Support Cap</p>
              <p className="mt-1.5 font-serif text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
                {tierProfile ? formatAmount(tierProfile.maxSupportCap) : "—"}
              </p>
              <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">
                {tierProfile?.currentTier ? tierProfile.currentTier.name : "No tier"}
              </p>
            </div>
            <div className="flex items-center justify-center h-10 w-10 rounded-lg bg-gradient-to-br from-amber-500 to-amber-700 shadow-md ring-1 ring-amber-300/40">
              <Shield className="w-4 h-4 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* ── TIER STANDING + COOLDOWN ── */}
      <div className="grid lg:grid-cols-2 gap-4 items-start">
      {tierProfile && (
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-white via-white to-slate-50 dark:from-slate-950 dark:via-slate-950 dark:to-emerald-950/30 border border-slate-200/70 dark:border-slate-800/70 shadow-lg">
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-amber-400/50 to-transparent" />

          <div className="relative p-5 space-y-4">
            {/* Header */}
            <div className="flex items-center gap-2.5">
              <div className="flex items-center justify-center h-9 w-9 rounded-lg bg-gradient-to-br from-amber-300 to-amber-600 shadow-md ring-1 ring-amber-200/60">
                <Gem className="w-3.5 h-3.5 text-white" />
              </div>
              <div>
                <p className="text-[9px] uppercase tracking-[0.25em] font-semibold text-amber-700/80 dark:text-amber-300/70">Tier Standing</p>
                <h4 className="font-serif text-lg font-bold text-slate-900 dark:text-white">Order of Contribution</h4>
              </div>
            </div>

            {/* Metrics grid */}
            <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
              {[
                { label: "Contrib. Right", value: formatAmount(tierProfile.contributionRight), icon: Sparkles, tint: "emerald" },
                { label: "Current Tier", value: tierProfile.currentTier ? `${tierProfile.currentTier.name}` : "No tier yet", sub: tierProfile.currentTier ? `#${tierProfile.currentTier.tierNumber}` : null, icon: Crown, tint: "amber" },
                { label: "Max Cap", value: formatAmount(tierProfile.maxSupportCap), icon: Shield, tint: "emerald" },
                { label: "To Next Tier", value: tierProfile.amountToNextTier == null ? "—" : formatAmount(Math.max(0, tierProfile.amountToNextTier)), icon: ArrowUpRight, tint: "amber" },
              ].map((stat, idx) => (
                <div key={idx} className="group relative rounded-lg border border-slate-200/70 dark:border-slate-800/70 bg-gradient-to-br from-slate-50/70 to-white dark:from-slate-900/50 dark:to-slate-950 p-3 hover:border-amber-300/50 dark:hover:border-amber-500/30 transition-colors">
                  <div className="flex items-start justify-between mb-1.5">
                    <p className="text-[9px] uppercase tracking-[0.18em] font-semibold text-slate-500 dark:text-slate-400">{stat.label}</p>
                    <stat.icon className={`h-3 w-3 ${stat.tint === "amber" ? "text-amber-500/70" : "text-emerald-600/70"}`} />
                  </div>
                  <p className="font-serif text-base font-bold text-slate-900 dark:text-white leading-tight">{stat.value}</p>
                  {stat.sub && <p className="mt-0.5 text-[10px] text-slate-500 dark:text-slate-400 font-mono">{stat.sub}</p>}
                </div>
              ))}
            </div>

            {/* Status seals */}
            <div className="flex flex-wrap gap-2">
              {[
                { ok: tierProfile.kycApproved, on: "KYC Approved", off: "KYC Pending" },
                { ok: tierProfile.autoDebitEnabled, on: "Auto-Debit Enabled", off: "Auto-Debit Off" },
                { ok: tierProfile.autoContributeEnabled, on: "Auto-Contribute Enabled", off: "Auto-Contribute Off" },
              ].map((s, i) => (
                <span key={i} className={"inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-semibold ring-1 " + (s.ok ? "bg-emerald-50 text-emerald-800 ring-emerald-200/70 dark:bg-emerald-900/25 dark:text-emerald-200 dark:ring-emerald-800/50" : "bg-amber-50 text-amber-800 ring-amber-200/70 dark:bg-amber-900/20 dark:text-amber-200 dark:ring-amber-800/50")}>
                  {s.ok ? <CheckCircle2 className="h-3 w-3" /> : <AlertTriangle className="h-3 w-3" />}
                  {s.ok ? s.on : s.off}
                </span>
              ))}
            </div>

            {/* Calculator ribbon */}
            <div className="relative overflow-hidden rounded-lg bg-gradient-to-r from-emerald-900 to-emerald-800 p-3.5 ring-1 ring-amber-300/20">
              <div className="relative flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <ScrollText className="h-4 w-4 text-amber-300" />
                  <div>
                    <p className="text-[9px] uppercase tracking-[0.2em] font-semibold text-amber-200/80">Calculator</p>
                    <p className="text-xs text-emerald-50/70">Right × {tierProfile.contributionMultiplier}</p>
                  </div>
                </div>
                <p className="font-serif text-xl font-bold bg-gradient-to-r from-amber-200 to-amber-400 bg-clip-text text-transparent">
                  {formatAmount(tierProfile.contributionRight * tierProfile.contributionMultiplier)}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── COOLDOWN / SPONSOR PROGRESS ── */}
      {(waitStatusQuery.data?.hasCooldown || waitStatusQuery.data?.sponsorProgress) && (
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-amber-50/80 to-white dark:from-amber-950/20 dark:via-slate-950 dark:to-amber-950/10 border border-amber-300/50 dark:border-amber-700/40 shadow-lg">
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-amber-500/60 to-transparent" />

          <div className="relative p-5 flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="flex items-center justify-center h-10 w-10 rounded-lg bg-gradient-to-br from-amber-400 to-amber-600 shadow-md ring-1 ring-amber-300/50 shrink-0">
                <TimerReset className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="text-[9px] uppercase tracking-[0.25em] font-semibold text-amber-700 dark:text-amber-300/80">Restricted Period</p>
                <p className="font-serif text-lg font-bold text-slate-900 dark:text-white mt-0.5">
                  {waitStatusQuery.data?.hasCooldown ? "Collection Cooldown Active" : "Sponsor Reduction Progress"}
                </p>
                {waitStatusQuery.data?.cooldownEndsAt ? (
                  <p className="text-sm text-slate-600 dark:text-slate-400 mt-2 max-w-md">
                    You cannot submit a new request until{" "}
                    <span className="font-semibold text-amber-800 dark:text-amber-200">
                      {new Date(waitStatusQuery.data.cooldownEndsAt).toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" })}
                    </span>
                    {waitStatusQuery.data.cooldownMonths && (
                      <> · <span className="font-medium">{waitStatusQuery.data.cooldownMonths}-month cooldown</span></>
                    )}
                    .
                  </p>
                ) : (
                  <p className="text-sm text-slate-600 dark:text-slate-400 mt-2 max-w-md">
                    Your sponsor progress is being tracked toward a shorter cooling period.
                  </p>
                )}
              </div>
            </div>

            <div className="lg:min-w-[320px] space-y-3">
              {/* Monthly reduction progress */}
              {waitStatusQuery.data?.monthlyProgress && (
                <div className="rounded-xl border border-amber-200/70 dark:border-amber-800/40 bg-white/80 dark:bg-slate-950/60 backdrop-blur p-4 space-y-2.5">
                  <div className="flex items-center gap-2">
                    <TrendingDown className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                    <p className="text-xs font-semibold text-slate-900 dark:text-white">
                      Reduce wait by contributing {formatAmount(waitStatusQuery.data.monthlyProgress.target)}/mo
                    </p>
                  </div>
                  <div className="h-2 w-full rounded-full bg-amber-100 dark:bg-amber-950/50 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-amber-400 to-amber-600 transition-all duration-500 shadow-[0_0_10px_rgba(251,191,36,0.5)]"
                      style={{ width: `${waitStatusQuery.data.monthlyProgress.pct}%` }}
                    />
                  </div>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400 flex items-center justify-between gap-2">
                    <span>{formatAmount(waitStatusQuery.data.monthlyProgress.contributed)} contributed this month</span>
                    {waitStatusQuery.data.monthlyProgress.reduced ? (
                      <span className="inline-flex items-center gap-1 text-emerald-700 dark:text-emerald-300 font-semibold">
                        <CheckCircle2 className="h-3 w-3" /> 1 month deducted
                      </span>
                    ) : (
                      <span>{formatAmount(Math.max(0, waitStatusQuery.data.monthlyProgress.target - waitStatusQuery.data.monthlyProgress.contributed))} to next reduction</span>
                    )}
                  </p>
                </div>
              )}

              {waitStatusQuery.data?.sponsorProgress && (
                <div className="rounded-xl border border-amber-200/70 dark:border-amber-800/40 bg-white/80 dark:bg-slate-950/60 backdrop-blur p-4 space-y-2.5">
                  <div className="flex items-center justify-between gap-2 text-xs">
                    <span className="font-semibold text-slate-900 dark:text-white">Sponsor Reduction</span>
                    <span className="font-mono text-slate-600 dark:text-slate-400">
                      {waitStatusQuery.data.sponsorProgress.directSponsorCount}/{waitStatusQuery.data.sponsorProgress.requiredCount}
                    </span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-amber-100 dark:bg-amber-950/50 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-amber-400 to-amber-600 transition-all duration-500 shadow-[0_0_10px_rgba(251,191,36,0.5)]"
                      style={{
                        width: `${Math.min(
                          100,
                          Math.round((waitStatusQuery.data.sponsorProgress.directSponsorCount / Math.max(1, waitStatusQuery.data.sponsorProgress.requiredCount)) * 100)
                        )}%`,
                      }}
                    />
                  </div>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400 flex items-center justify-between gap-2">
                    <span>
                      {waitStatusQuery.data.sponsorProgress.qualifies
                        ? `Qualifies for ${waitStatusQuery.data.sponsorProgress.reducedCoolingMonths}-month cooling`
                        : `Need ${Math.max(0, waitStatusQuery.data.sponsorProgress.requiredCount - waitStatusQuery.data.sponsorProgress.directSponsorCount)} more sponsor(s)`}
                    </span>
                    {waitStatusQuery.data.sponsorProgress.reducedCoolingEndsAt && (
                      <span className="text-slate-900 dark:text-white font-medium">
                        {new Date(waitStatusQuery.data.sponsorProgress.reducedCoolingEndsAt).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
                      </span>
                    )}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      </div>

      {/* ── DONOR RECOGNITION + ELIGIBILITY ── */}
      <div className="grid lg:grid-cols-2 gap-4 items-start">
      {/* ── DONOR RECOGNITION ── */}
      {recognitionQuery.data && (
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-50/70 to-white dark:from-emerald-950/20 dark:via-slate-950 dark:to-amber-950/10 border border-emerald-200/60 dark:border-emerald-800/40 shadow-lg">
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-amber-400/60 to-transparent" />

          <div className="relative p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="flex items-center justify-center h-10 w-10 rounded-lg bg-gradient-to-br from-amber-300 to-amber-700 shadow-md ring-1 ring-amber-200/60">
                  <Award className="w-4 h-4 text-white" />
                </div>
                <div>
                  <p className="text-[9px] uppercase tracking-[0.25em] font-semibold text-amber-700/90 dark:text-amber-300/80">Order of Merit</p>
                  <p className="font-serif text-lg font-bold text-slate-900 dark:text-white mt-0.5">Donor Recognition</p>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-1.5 max-w-xl">
                    {recognitionQuery.data.donationCount
                      ? `${recognitionQuery.data.donationCount} donation${recognitionQuery.data.donationCount === 1 ? "" : "s"} — ${formatAmount(recognitionQuery.data.totalDonatedAmount)} inscribed.`
                      : "No donation record yet."}
                  </p>
                </div>
              </div>

              {recognitionQuery.data.latestDonation?.certificateUrl && (
                <Button asChild variant="outline" className="self-start border-amber-400/40 text-amber-800 hover:bg-amber-50 hover:border-amber-500 dark:border-amber-700/50 dark:text-amber-300 dark:hover:bg-amber-900/20">
                  <a href={recognitionQuery.data.latestDonation.certificateUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2">
                    <ScrollText className="h-4 w-4" />
                    Certificate
                  </a>
                </Button>
              )}
            </div>

            <div className="grid gap-2.5 md:grid-cols-3">
              {[
                {
                  label: "Latest Support",
                  primary: recognitionQuery.data.latestDonation
                    ? `${formatAmount(recognitionQuery.data.latestDonation.amount)}`
                    : "No donation yet",
                  secondary: recognitionQuery.data.latestDonation
                    ? (recognitionQuery.data.latestDonation.category ?? "Uncategorised")
                    : null,
                  tertiary: recognitionQuery.data.latestDonation?.organization ?? null,
                },
                {
                  label: "Latest Badge",
                  primary: recognitionQuery.data.badges[0]?.category?.badgeType ?? "No badge issued",
                  secondary: recognitionQuery.data.badges[0]?.category
                    ? `${recognitionQuery.data.badges[0].category.coolingReductionMonths} month reduction`
                    : null,
                  tertiary: "Never expires once issued",
                },
                {
                  label: "Certificate",
                  primary: "PDF Available",
                  secondary: "Permanent record",
                  tertiary: "Gift or redeem badges below",
                },
              ].map((c, i) => (
                <div key={i} className="rounded-lg border border-slate-200/70 dark:border-slate-800/70 bg-white/90 dark:bg-slate-950/70 px-3 py-3 hover:border-amber-300/60 dark:hover:border-amber-600/30 transition-colors">
                  <p className="text-[9px] uppercase tracking-[0.2em] font-semibold text-amber-700/80 dark:text-amber-300/60">{c.label}</p>
                  <p className="mt-1.5 font-serif text-base font-bold text-slate-900 dark:text-white leading-tight">{c.primary}</p>
                  {c.secondary && <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">{c.secondary}</p>}
                  {c.tertiary && <p className="text-[10px] text-slate-500 dark:text-slate-500 mt-1">{c.tertiary}</p>}
                </div>
              ))}
            </div>

            {/* ── Time Reduction Badges: gift or redeem ── */}
            {recognitionQuery.data.badges.length > 0 && (
              <div className="space-y-2.5">
                <p className="text-[9px] uppercase tracking-[0.25em] font-semibold text-amber-700/90 dark:text-amber-300/80">My Time Reduction Badges</p>
                <div className="space-y-2">
                  {recognitionQuery.data.badges.map((badge: any) => (
                    <div key={badge.id} className="rounded-lg border border-slate-200/70 dark:border-slate-800/70 bg-white/90 dark:bg-slate-950/70 px-3 py-2.5">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2.5">
                          <Gem className="h-3.5 w-3.5 text-amber-500" />
                          <div>
                            <p className="text-xs font-semibold text-slate-900 dark:text-white">
                              {badge.category?.badgeType ?? "Time Reduction Badge"}
                              <span className="ml-2 text-[11px] font-normal text-slate-500">{badge.reductionMonths}mo</span>
                            </p>
                            <p className="text-[11px] text-slate-500">
                              {badge.status === "available" ? "Available to redeem or gift" : badge.status === "redeemed" ? "Redeemed" : badge.status}
                            </p>
                          </div>
                        </div>
                        {badge.status === "available" && (
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={redeemBadgeMutation.isPending}
                              onClick={() => redeemBadgeMutation.mutate({ badgeId: badge.id })}
                              className="border-emerald-400/40 text-emerald-800 hover:bg-emerald-50 dark:border-emerald-700/50 dark:text-emerald-300 dark:hover:bg-emerald-900/20"
                            >
                              <TimerReset className="h-3.5 w-3.5 mr-1" /> Redeem
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => { setGiftBadgeId(giftBadgeId === badge.id ? null : badge.id); setGiftRecipient(""); }}
                              className="border-amber-400/40 text-amber-800 hover:bg-amber-50 dark:border-amber-700/50 dark:text-amber-300 dark:hover:bg-amber-900/20"
                            >
                              <ArrowUpRight className="h-3.5 w-3.5 mr-1" /> Gift
                            </Button>
                          </div>
                        )}
                      </div>
                      {giftBadgeId === badge.id && (
                        <div className="mt-3 flex flex-col sm:flex-row gap-2">
                          <Input
                            value={giftRecipient}
                            onChange={(e) => setGiftRecipient(e.target.value)}
                            placeholder="Recipient email or SSC"
                            className="flex-1"
                          />
                          <Button
                            size="sm"
                            disabled={giftBadgeMutation.isPending || giftRecipient.trim().length < 2}
                            onClick={() => giftBadgeMutation.mutate({ badgeId: badge.id, recipient: giftRecipient.trim() })}
                          >
                            {giftBadgeMutation.isPending ? "Gifting..." : "Send Gift"}
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── Donation history + certificates ── */}
            {recognitionQuery.data.donations.length > 0 && (
              <div className="space-y-2.5">
                <p className="text-[9px] uppercase tracking-[0.25em] font-semibold text-amber-700/90 dark:text-amber-300/80">Donation History</p>
                <div className="space-y-2">
                  {recognitionQuery.data.donations.map((donation: any) => (
                    <div key={donation.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-200/70 dark:border-slate-800/70 bg-white/90 dark:bg-slate-950/70 px-3 py-2.5">
                      <div>
                        <p className="text-xs font-semibold text-slate-900 dark:text-white">
                          {formatAmount(donation.amount)}
                          {donation.category && <span className="ml-2 text-[11px] font-normal text-slate-500">{donation.category}</span>}
                        </p>
                        <p className="text-[11px] text-slate-500">{new Date(donation.createdAt).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" })}</p>
                      </div>
                      {donation.certificateUrl && (
                        <Button asChild size="sm" variant="outline" className="border-amber-400/40 text-amber-800 hover:bg-amber-50 dark:border-amber-700/50 dark:text-amber-300 dark:hover:bg-amber-900/20">
                          <a href={donation.certificateUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5">
                            <ScrollText className="h-3.5 w-3.5" /> Certificate
                          </a>
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── ELIGIBILITY OVERVIEW ── */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-slate-300 dark:via-slate-700 to-transparent" />
          <p className="text-[9px] uppercase tracking-[0.25em] font-semibold text-slate-500 dark:text-slate-400">Standing at a Glance</p>
          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-slate-300 dark:via-slate-700 to-transparent" />
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
          {[
            {
              icon: Shield,
              label: "Membership",
              value: profile.membershipLabel,
              sub: profile.membershipActive ? "Active" : "Inactive",
              ok: profile.membershipActive,
            },
            {
              icon: Target,
              label: "Qualified Directs",
              value: String(profile.qualifiedDirects),
              sub: effectiveMinDirects === 0
                ? "No directs required"
                : `Need ${effectiveMinDirects}+ for ${effectiveCategoryRules?.label ?? supportCategory}`,
              ok: effectiveMinDirects === 0 || profile.qualifiedDirects >= effectiveMinDirects,
            },
            {
              icon: Wallet,
              label: "Contributions",
              value: formatAmount(profile.contributionsMade),
              sub: `Min ${formatAmount(profile.minContributionRequired)}`,
              ok: profile.contributionsMade >= profile.minContributionRequired,
            },
            {
              icon: Clock,
              label: "Broadcast Window",
              value: `${categoryRules[supportCategory]?.broadcastHours ?? 48} hrs`,
              sub: "Extendable via payments or directs",
              ok: true,
            },
          ].map((s, i) => (
            <div key={i} className="group relative overflow-hidden rounded-lg bg-white dark:bg-slate-950/70 border border-slate-200/70 dark:border-slate-800/70 hover:border-emerald-300/70 dark:hover:border-emerald-700/50 hover:shadow-md transition-all">
              <div className={`absolute top-0 left-0 right-0 h-0.5 ${s.ok ? "bg-gradient-to-r from-emerald-400 to-emerald-600" : "bg-gradient-to-r from-amber-400 to-amber-600"}`} />
              <div className="p-3">
                <div className="flex items-start justify-between mb-1.5">
                  <div className={`flex items-center justify-center h-8 w-8 rounded-lg ring-1 ${s.ok ? "bg-emerald-50 ring-emerald-200/70 text-emerald-700 dark:bg-emerald-900/20 dark:ring-emerald-800/40 dark:text-emerald-300" : "bg-amber-50 ring-amber-200/70 text-amber-700 dark:bg-amber-900/20 dark:ring-amber-800/40 dark:text-amber-300"}`}>
                    <s.icon className="w-3.5 h-3.5" />
                  </div>
                  {s.ok && <CheckCircle2 className="h-3 w-3 text-emerald-500" />}
                </div>
                <p className="text-[9px] uppercase tracking-[0.18em] font-semibold text-slate-500 dark:text-slate-400">{s.label}</p>
                <p className="mt-0.5 font-serif text-base font-bold text-slate-900 dark:text-white leading-tight">{s.value}</p>
                <p className="mt-0.5 text-[10px] text-slate-500 dark:text-slate-400">{s.sub}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
      </div>

      {/* ── REQUEST + LIVE STATUS ── */}
      <div className="grid lg:grid-cols-3 gap-4 items-start">
        {/* Request form */}
        <div className="lg:col-span-2 relative overflow-hidden rounded-2xl bg-white dark:bg-slate-950 border border-slate-200/70 dark:border-slate-800/70 shadow-lg">
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-emerald-500 via-amber-400 to-emerald-500" />

          <div className="relative p-5 space-y-4">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-start gap-2.5">
                <div className="flex items-center justify-center h-10 w-10 rounded-lg bg-gradient-to-br from-emerald-600 to-emerald-800 shadow-md ring-1 ring-emerald-400/40">
                  <ScrollText className="w-4 h-4 text-white" />
                </div>
                <div>
                  <p className="text-[9px] uppercase tracking-[0.25em] font-semibold text-emerald-700/80 dark:text-emerald-300/70">Petition of Support</p>
                  <h3 className="font-serif text-xl font-bold text-slate-900 dark:text-white">Submit a Request</h3>
                </div>
              </div>
              <span className={"inline-flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-semibold rounded-full ring-1 " + (eligibility.eligible ? "bg-emerald-50 text-emerald-800 ring-emerald-300/60 dark:bg-emerald-900/25 dark:text-emerald-200 dark:ring-emerald-700/40" : "bg-amber-50 text-amber-800 ring-amber-300/60 dark:bg-amber-900/25 dark:text-amber-200 dark:ring-amber-700/40")}>
                {eligibility.eligible ? <CheckCircle2 className="h-3 w-3" /> : <Lock className="h-3 w-3" />}
                {eligibility.eligible ? "Eligible" : "Locked"}
              </span>
            </div>

            {/* Category selector */}
            <div>
              <label className="text-[10px] uppercase tracking-[0.25em] font-semibold text-slate-500 dark:text-slate-400">Support Category</label>
              <div className="mt-2 grid grid-cols-2 gap-2.5">
                {(["national", "global"] as SupportCategory[]).map((cat) => {
                  const active = supportCategory === cat;
                  const rules = categoryRules[cat];
                  return (
                    <button
                      key={cat}
                      onClick={() => setSupportCategory(cat)}
                      className={"group relative overflow-hidden rounded-xl border-2 px-4 py-3 text-left transition-all " + (active ? "border-emerald-500 bg-gradient-to-br from-emerald-50 via-white to-emerald-50/50 dark:from-emerald-950/40 dark:via-slate-950 dark:to-emerald-950/20 shadow-lg shadow-emerald-900/[0.08]" : "border-slate-200 dark:border-slate-800 hover:border-emerald-300 dark:hover:border-emerald-700 bg-white dark:bg-slate-950/50")}
                    >
                      {active && <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-emerald-400 to-amber-400" />}
                      <div className="flex items-center justify-between">
                        <span className="font-serif text-base font-bold text-slate-900 dark:text-white">{rules?.label ?? cat}</span>
                        <Globe className={`w-4 h-4 ${active ? "text-emerald-600 dark:text-emerald-400" : "text-slate-400"}`} />
                      </div>
                      <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                        {rules?.minDirects === 0 ? "No directs required" : `${rules?.minDirects ?? 10}+ directs`} · {formatAmount(rules?.minThreshold ?? 10000)}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Amount + Purpose */}
            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] uppercase tracking-[0.25em] font-semibold text-slate-500 dark:text-slate-400">Requested Amount</label>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="mt-2 w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950/70 px-4 py-3 text-base font-serif font-bold text-slate-900 dark:text-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition"
                  min={categoryRules[supportCategory]?.minThreshold ?? 10000}
                />
                {amount && !Number.isNaN(Number(amount)) && Number(amount) > 0 && (
                  <p className="mt-1.5 text-[11px] text-slate-500 dark:text-slate-400">
                    Broadcast target: <span className="font-semibold text-slate-700 dark:text-slate-300">{formatAmount(Math.ceil(Number(amount) * 1.2))}</span> <span className="text-amber-600 dark:text-amber-400">(+20% markup)</span>
                  </p>
                )}
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-[0.25em] font-semibold text-slate-500 dark:text-slate-400">Purpose</label>
                <input
                  type="text"
                  value={purpose}
                  onChange={(e) => setPurpose(e.target.value)}
                  className="mt-2 w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950/70 px-4 py-3 text-sm text-slate-900 dark:text-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition"
                  placeholder="E.g. medical, rent, education"
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] uppercase tracking-[0.25em] font-semibold text-slate-500 dark:text-slate-400">Additional Details</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                className="mt-2 w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950/70 px-4 py-3 text-sm text-slate-900 dark:text-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition resize-none"
                placeholder="Add context for management approval"
              />
            </div>

            {/* Requirements chips */}
            <div className="flex flex-wrap gap-2">
              {[
                { ok: eligibility.hasMembership, on: "Membership OK", off: "Upgrade membership" },
                { ok: effectiveMinDirects === 0 || eligibility.hasDirects, on: "Directs OK", off: directsRequirementLabel },
                { ok: eligibility.hasContrib, on: "Contribution OK", off: `${formatAmount(categoryRules[supportCategory]?.minCumulativeContrib ?? 10000)} cumulative` },
                { ok: eligibility.hasDistinct, on: "10 requests met", off: `${profile.minDistinctRequests} distinct requests needed` },
              ].map((s, i) => (
                <span key={i} className={"inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-semibold ring-1 " + (s.ok ? "bg-emerald-50 text-emerald-800 ring-emerald-200/70 dark:bg-emerald-900/20 dark:text-emerald-200 dark:ring-emerald-800/40" : "bg-amber-50 text-amber-800 ring-amber-200/70 dark:bg-amber-900/20 dark:text-amber-200 dark:ring-amber-800/40")}>
                  {s.ok ? <CheckCircle2 className="h-3 w-3" /> : <AlertTriangle className="h-3 w-3" />}
                  {s.ok ? s.on : s.off}
                </span>
              ))}
              {supportCategory === "global" && eligibility.globalPath && (
                <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-semibold ring-1 bg-blue-50 text-blue-800 ring-blue-200/70 dark:bg-blue-900/20 dark:text-blue-200 dark:ring-blue-800/40">
                  <Sparkles className="h-3 w-3" />
                  Qualifies via Path {eligibility.globalPath}
                </span>
              )}
            </div>

            {/* Submit */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
              <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                Confirmation &amp; broadcast sent after approval
              </div>
              <button
                onClick={handleSubmit}
                disabled={!eligibility.eligible || profile.hasCooldown || submitRequest.isPending}
                className="group relative inline-flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-emerald-600 to-emerald-800 px-5 py-2.5 text-xs font-semibold uppercase tracking-wider text-white shadow-md ring-1 ring-emerald-400/30 hover:shadow-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Sparkles className="w-3.5 h-3.5 relative" />
                <span className="relative">{profile.hasCooldown ? "Cooldown Active" : "Submit for Approval"}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Live status */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-900 via-emerald-950 to-slate-950 border border-emerald-700/40 shadow-lg">
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-amber-400/60 to-transparent" />

          <div className="relative p-5 space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="flex items-center justify-center h-9 w-9 rounded-lg bg-gradient-to-br from-amber-300 to-amber-600 shadow-md ring-1 ring-amber-200/50">
                <RadioTower className="w-3.5 h-3.5 text-white" />
              </div>
              <div>
                <p className="text-[9px] uppercase tracking-[0.25em] font-semibold text-amber-200/80">Broadcast Chamber</p>
                <h4 className="font-serif text-base font-bold text-white">Live Status</h4>
              </div>
            </div>

            {liveStatus ? (
              <div className="rounded-xl bg-white/[0.06] backdrop-blur border border-amber-200/20 p-4">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-xs text-emerald-100/70">Broadcast window</p>
                  <div className="flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="font-mono text-sm font-bold text-amber-200">{formatCountdown(liveStatus.remainingSeconds)}</span>
                  </div>
                </div>
                <p className="text-[11px] text-emerald-100/50">Auto-closes when time or threshold reached</p>

                <div className="mt-4 grid grid-cols-2 gap-2">
                  <div className="rounded-lg bg-black/20 border border-emerald-500/20 px-3 py-2.5">
                    <p className="text-[10px] uppercase tracking-wider text-emerald-100/60">Raised</p>
                    <p className="mt-1 font-serif text-sm font-bold text-white leading-tight">
                      {formatAmount(liveStatus.raisedAmount)}
                    </p>
                    <p className="text-[10px] text-emerald-100/50 mt-0.5">
                      of {formatAmount(liveStatus.thresholdAmount)}
                    </p>
                  </div>
                  <div className="rounded-lg bg-black/20 border border-emerald-500/20 px-3 py-2.5">
                    <p className="text-[10px] uppercase tracking-wider text-emerald-100/60">Patrons</p>
                    <p className="mt-1 font-serif text-lg font-bold text-white">{liveStatus.contributorsCount}</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="rounded-xl bg-white/[0.06] backdrop-blur border border-amber-200/20 p-5 text-center space-y-2">
                <p className="font-serif text-lg font-bold text-white">No active broadcast</p>
                <p className="text-sm text-emerald-100/70">Submit a request to go live</p>
              </div>
            )}

            <div className="space-y-2.5 text-xs">
              <div className="flex items-start gap-2.5 text-emerald-100/70">
                <Bell className="w-3.5 h-3.5 mt-0.5 text-amber-300 shrink-0" />
                <span>Broadcasts reach email, dashboard, Telegram &amp; WhatsApp</span>
              </div>
              <div className="flex items-start gap-2.5 text-emerald-100/70">
                <RadioTower className="w-3.5 h-3.5 mt-0.5 text-amber-300 shrink-0" />
                <span>Management approval required before going live</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── EXTENSIONS + ANALYTICS ── */}
      <div className="grid lg:grid-cols-2 gap-4">
        {/* Time extensions */}
        <div className="relative overflow-hidden rounded-2xl bg-white dark:bg-slate-950 border border-slate-200/70 dark:border-slate-800/70 shadow-lg">
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-emerald-400/50 to-transparent" />
          <div className="relative p-5 space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="flex items-center justify-center h-9 w-9 rounded-lg bg-gradient-to-br from-emerald-600 to-emerald-800 shadow-md ring-1 ring-emerald-400/40">
                <Clock className="w-3.5 h-3.5 text-white" />
              </div>
              <div>
                <p className="text-[9px] uppercase tracking-[0.25em] font-semibold text-emerald-700/80 dark:text-emerald-300/70">Chronicle</p>
                <h4 className="font-serif text-base font-bold text-slate-900 dark:text-white">Time Extensions</h4>
              </div>
            </div>

            <div className="space-y-2.5">
              <p className="text-[9px] uppercase tracking-[0.2em] font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-2">
                <span className="h-px flex-1 bg-slate-200 dark:bg-slate-800" />
                Auto-Extension Thresholds
                <span className="h-px flex-1 bg-slate-200 dark:bg-slate-800" />
              </p>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 -mt-1">Granted automatically when contributions cross milestones</p>
              <div className="grid grid-cols-2 gap-2">
                {extensionPaid.map((row) => (
                  <div key={row.amount} className="group rounded-lg border border-emerald-200/60 dark:border-emerald-800/40 bg-gradient-to-br from-emerald-50/60 to-white dark:from-emerald-950/30 dark:to-slate-950 p-3">
                    <div className="flex items-center justify-between">
                      <p className="font-serif text-lg font-bold text-emerald-700 dark:text-emerald-300">+{row.hours}h</p>
                      <span className="text-[8px] uppercase tracking-wider font-semibold text-emerald-600/60 dark:text-emerald-400/60">Auto</span>
                    </div>
                    <p className="text-[10px] text-slate-600 dark:text-slate-400 mt-0.5">At {formatAmount(row.amount)} raised</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-2.5">
              <p className="text-[9px] uppercase tracking-[0.2em] font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-2">
                <span className="h-px flex-1 bg-slate-200 dark:bg-slate-800" />
                Earn Time via Directs
                <span className="h-px flex-1 bg-slate-200 dark:bg-slate-800" />
              </p>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 -mt-1">Admin-granted when your direct sponsor count reaches milestones</p>
              <div className="grid grid-cols-2 gap-2">
                {extensionReferrals.map((row) => (
                  <div key={row.directs} className="group rounded-lg border border-amber-200/60 dark:border-amber-800/40 bg-gradient-to-br from-amber-50/60 to-white dark:from-amber-950/25 dark:to-slate-950 p-3">
                    <div className="flex items-center justify-between">
                      <p className="font-serif text-lg font-bold text-amber-700 dark:text-amber-300">+{row.hours}h</p>
                      <span className="text-[8px] uppercase tracking-wider font-semibold text-amber-600/60 dark:text-amber-400/60">Admin</span>
                    </div>
                    <p className="text-[10px] text-slate-600 dark:text-slate-400 mt-0.5">At {row.directs} directs</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Live analytics */}
        <div className="relative overflow-hidden rounded-2xl bg-white dark:bg-slate-950 border border-slate-200/70 dark:border-slate-800/70 shadow-lg">
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-amber-400/50 to-transparent" />
          <div className="relative p-5 space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="flex items-center justify-center h-9 w-9 rounded-lg bg-gradient-to-br from-amber-400 to-amber-600 shadow-md ring-1 ring-amber-300/50">
                <Zap className="w-3.5 h-3.5 text-white" />
              </div>
              <div>
                <p className="text-[9px] uppercase tracking-[0.25em] font-semibold text-amber-700/80 dark:text-amber-300/70">Realm Metrics</p>
                <h4 className="font-serif text-base font-bold text-slate-900 dark:text-white">Live Analytics</h4>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: "Active Broadcasts", value: broadcastMetrics.total, tint: "emerald" },
                { label: "Targets Met", value: broadcastMetrics.targetMetCount, tint: "amber" },
                { label: "Total Raised", value: formatAmount(broadcastMetrics.totalRaised), tint: "emerald" },
                { label: "Avg. Progress", value: `${broadcastMetrics.avgProgress}%`, tint: "amber" },
              ].map((s, i) => (
                <div key={i} className="relative overflow-hidden rounded-lg border border-slate-200/70 dark:border-slate-800/70 bg-gradient-to-br from-slate-50/60 to-white dark:from-slate-900/40 dark:to-slate-950 p-3">
                  <div className={`absolute top-0 left-0 h-full w-0.5 ${s.tint === "amber" ? "bg-gradient-to-b from-amber-400 to-amber-600" : "bg-gradient-to-b from-emerald-400 to-emerald-600"}`} />
                  <p className="text-[9px] uppercase tracking-[0.18em] font-semibold text-slate-500 dark:text-slate-400">{s.label}</p>
                  <p className="mt-1 font-serif text-xl font-bold text-slate-900 dark:text-white leading-none">{s.value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Active broadcasts */}
        <div className="lg:col-span-2 relative overflow-hidden rounded-2xl bg-white dark:bg-slate-950 border border-slate-200/70 dark:border-slate-800/70 shadow-lg">
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-emerald-500 via-amber-400 to-emerald-500" />
          <div className="relative p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <div className="flex items-center justify-center h-9 w-9 rounded-lg bg-gradient-to-br from-emerald-700 to-emerald-900 shadow-md ring-1 ring-amber-300/30">
                  <RadioTower className="w-3.5 h-3.5 text-amber-300" />
                </div>
                <div>
                  <p className="text-[9px] uppercase tracking-[0.25em] font-semibold text-emerald-700/80 dark:text-emerald-300/70">The Assembly</p>
                  <h4 className="font-serif text-lg font-bold text-slate-900 dark:text-white">Active Broadcasts</h4>
                </div>
              </div>
              <Button variant="outline" size="sm" onClick={() => broadcastsQuery.refetch()} className="border-slate-300 dark:border-slate-700 hover:border-emerald-400 dark:hover:border-emerald-600 text-slate-700 dark:text-slate-200">
                <Sparkles className="w-3.5 h-3.5 mr-1.5" />
                Refresh
              </Button>
            </div>

            {broadcastsQuery.isLoading && (
              <div className="space-y-2.5 animate-pulse">
                {[0, 1].map((i) => (
                  <div key={i} className="h-28 rounded-lg bg-slate-100 dark:bg-slate-800/50" />
                ))}
              </div>
            )}

            {broadcastsQuery.data && broadcastsQuery.data.length === 0 && (
              <div className="rounded-lg border border-dashed border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/30 py-8 text-center">
                <RadioTower className="w-7 h-7 text-slate-300 dark:text-slate-700 mx-auto mb-2" />
                <p className="text-xs text-slate-500 dark:text-slate-400">No active broadcasts at this moment.</p>
                <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">The chamber is quiet. Check back soon.</p>
              </div>
            )}

            <div className="grid lg:grid-cols-2 gap-2.5">
              {broadcastColumns.map((col, idx) => (
                <div key={idx} className="space-y-2.5">
                  {(col ?? []).map((item) => {
                    const percent = Math.min(100, Math.floor((item.raisedAmount / item.thresholdAmount) * 100));
                    const remaining = item.broadcastExpiresAt ? formatCountdown(Math.floor((new Date(item.broadcastExpiresAt).getTime() - Date.now()) / 1000)) : "--";
                    const targetMet = item.raisedAmount >= item.thresholdAmount;
                    const anonLabel = hashRequestId(item.id);
                    return (
                      <div key={item.id} className="group relative overflow-hidden rounded-lg border border-slate-200/70 dark:border-slate-800/70 bg-gradient-to-br from-white to-slate-50/60 dark:from-slate-950 dark:to-emerald-950/10 p-3 hover:border-emerald-400/60 dark:hover:border-emerald-600/40 hover:shadow-md transition-all">
                        <div className={`absolute top-0 left-0 right-0 h-0.5 ${targetMet ? "bg-gradient-to-r from-emerald-400 to-emerald-600" : "bg-gradient-to-r from-amber-400 to-amber-500"}`} />

                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2.5">
                            <div className="relative flex items-center justify-center h-9 w-9 rounded-lg bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900 ring-1 ring-slate-200 dark:ring-slate-700">
                              <Lock className="w-3.5 h-3.5 text-slate-600 dark:text-slate-300" />
                              <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-emerald-400 ring-2 ring-white dark:ring-slate-950 animate-pulse" />
                            </div>
                            <div>
                              <p className="font-mono text-xs font-bold text-slate-900 dark:text-white">{anonLabel}</p>
                              <p className="text-[10px] uppercase tracking-wider text-slate-500 dark:text-slate-400">Anonymous · {item.category}</p>
                            </div>
                          </div>
                          {targetMet ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 text-emerald-800 ring-1 ring-emerald-300/60 px-2 py-0.5 text-[10px] font-semibold dark:bg-emerald-900/25 dark:text-emerald-200 dark:ring-emerald-700/40">
                              <CheckCircle2 className="h-2.5 w-2.5" /> Target Met
                            </span>
                          ) : (
                            <button
                              onClick={() => setSelectedBroadcast(item)}
                              className="inline-flex items-center gap-1 rounded-lg bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white text-[11px] font-semibold px-2.5 py-1 shadow-md ring-1 ring-emerald-400/30 transition"
                            >
                              <Sparkles className="h-2.5 w-2.5" />
                              Contribute
                            </button>
                          )}
                        </div>

                        <div className="mt-2.5 flex items-center justify-between">
                          <div>
                            <p className="font-serif text-base font-bold text-slate-900 dark:text-white">{formatAmount(item.thresholdAmount)}</p>
                            <p className="text-[10px] uppercase tracking-wider text-slate-500 dark:text-slate-400">Requested</p>
                          </div>
                          <div className="text-right">
                            <p className="font-serif text-lg font-bold text-emerald-700 dark:text-emerald-300">{formatAmount(item.raisedAmount)}</p>
                            <p className="text-[10px] uppercase tracking-wider text-slate-500 dark:text-slate-400">Raised</p>
                          </div>
                        </div>

                        <div className="mt-2.5 h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-emerald-600 shadow-[0_0_8px_rgba(16,185,129,0.5)] transition-all duration-700"
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                        <div className="mt-1.5 flex items-center justify-between text-[11px]">
                          <span className="font-semibold text-emerald-700 dark:text-emerald-300">{percent}% funded</span>
                          <span className="text-slate-500 dark:text-slate-400 font-mono">
                            {item.isAdminDefault ? "No expiry" : remaining}
                          </span>
                        </div>

                        <p className="mt-2.5 text-xs text-slate-600 dark:text-slate-400 truncate">
                          <span className="text-slate-500 dark:text-slate-500">Purpose: </span>{item.purpose}
                        </p>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── HISTORY + NOTIFICATIONS ── */}
      <div className="grid lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 relative overflow-hidden rounded-2xl bg-white dark:bg-slate-950 border border-slate-200/70 dark:border-slate-800/70 shadow-lg">
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-emerald-400/50 to-transparent" />
          <div className="relative p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="flex items-center justify-center h-9 w-9 rounded-lg bg-gradient-to-br from-slate-800 to-slate-950 shadow-md ring-1 ring-amber-300/20">
                  <ScrollText className="w-3.5 h-3.5 text-amber-300" />
                </div>
                <div>
                  <p className="text-[9px] uppercase tracking-[0.25em] font-semibold text-slate-500 dark:text-slate-400">Chronicle</p>
                  <h4 className="font-serif text-base font-bold text-slate-900 dark:text-white">Recent Petitions</h4>
                </div>
              </div>
            </div>
            <div className="divide-y divide-slate-100 dark:divide-slate-800/70">
              {history.map((item) => {
                const ok = ["approved", "broadcasting", "closed"].includes(item.status.toLowerCase());
                return (
                  <div key={item.id} className="py-2.5 flex items-center justify-between text-sm hover:bg-slate-50/60 dark:hover:bg-slate-900/40 rounded-lg px-2 -mx-2 transition-colors">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className={"h-8 w-8 rounded-lg flex items-center justify-center ring-1 shrink-0 " + (ok ? "bg-emerald-50 ring-emerald-200/60 text-emerald-700 dark:bg-emerald-900/20 dark:ring-emerald-800/40 dark:text-emerald-300" : "bg-amber-50 ring-amber-200/60 text-amber-700 dark:bg-amber-900/20 dark:ring-amber-800/40 dark:text-amber-300")}>
                        {ok ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Clock className="h-3.5 w-3.5" />}
                      </div>
                      <div className="min-w-0">
                        <p className="font-mono text-[11px] font-bold text-slate-900 dark:text-white truncate">{item.id}</p>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 capitalize">{item.category} {item.date}</p>
                      </div>
                    </div>
                    <div className="text-right shrink-0 ml-2">
                      <p className="font-serif text-sm font-bold text-slate-900 dark:text-white">{formatAmount(Number(item.amount))}</p>
                      <span className={"inline-flex items-center gap-1 text-[9px] font-semibold uppercase tracking-wider mt-0.5 px-1.5 py-0.5 rounded-full ring-1 " + (ok ? "bg-emerald-50 text-emerald-800 ring-emerald-200/70 dark:bg-emerald-900/25 dark:text-emerald-200 dark:ring-emerald-800/40" : "bg-amber-50 text-amber-800 ring-amber-200/70 dark:bg-amber-900/25 dark:text-amber-200 dark:ring-amber-800/40")}>
                        {item.status}
                      </span>
                    </div>
                  </div>
                );
              })}
              {history.length === 0 && (
                <p className="py-6 text-center text-xs text-slate-500 dark:text-slate-400">No petitions recorded yet.</p>
              )}
            </div>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-white to-slate-50 dark:from-slate-950 dark:to-emerald-950/20 border border-slate-200/70 dark:border-slate-800/70 shadow-lg">
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-amber-400/50 to-transparent" />
          <div className="relative p-5 space-y-3">
            <div className="flex items-center gap-2.5">
              <div className="flex items-center justify-center h-9 w-9 rounded-lg bg-gradient-to-br from-amber-400 to-amber-600 shadow-md ring-1 ring-amber-300/50">
                <Bell className="w-3.5 h-3.5 text-white" />
              </div>
              <div>
                <p className="text-[9px] uppercase tracking-[0.25em] font-semibold text-amber-700/80 dark:text-amber-300/70">Herald</p>
                <h4 className="font-serif text-base font-bold text-slate-900 dark:text-white">Notifications</h4>
              </div>
            </div>
            <ul className="space-y-2">
              {notificationsQuery.isLoading ? (
                <li className="py-4 text-center text-xs text-slate-400 dark:text-slate-500 animate-pulse">Loading notifications…</li>
              ) : notificationsQuery.data && notificationsQuery.data.length > 0 ? (
                notificationsQuery.data.slice(0, 6).map((n) => (
                  <li
                    key={n.id}
                    onClick={() => { if (!n.isRead) markNotificationRead.mutate({ notificationId: n.id }); }}
                    className={"flex items-start gap-2 text-xs rounded-lg px-2 -mx-2 py-1.5 transition-colors cursor-pointer " + (n.isRead ? "text-slate-500 dark:text-slate-400" : "text-slate-900 dark:text-white bg-emerald-50/50 dark:bg-emerald-900/10 hover:bg-emerald-50/80 dark:hover:bg-emerald-900/20")}
                  >
                    <div className={"flex items-center justify-center h-4 w-4 rounded-full ring-1 shrink-0 mt-0.5 " + (n.isRead ? "bg-slate-100 dark:bg-slate-800 ring-slate-200 dark:ring-slate-700" : "bg-emerald-100 dark:bg-emerald-900/30 ring-emerald-200/70 dark:ring-emerald-800/40")}>
                      {n.isRead ? <CheckCircle2 className="w-2.5 h-2.5 text-slate-400 dark:text-slate-500" /> : <Bell className="w-2.5 h-2.5 text-emerald-700 dark:text-emerald-300" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold truncate">{n.title}</p>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">{n.message}</p>
                    </div>
                    {!n.isRead && <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shrink-0 mt-1" />}
                  </li>
                ))
              ) : (
                <li className="py-4 text-center text-xs text-slate-400 dark:text-slate-500">No notifications yet.</li>
              )}
            </ul>
          </div>
        </div>
      </div>

      {/* ── WHAT HAPPENS NEXT + COMMUNICATION ── */}
      <div className="grid lg:grid-cols-2 gap-4 items-start">
      {/* ── WHAT HAPPENS NEXT ── */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-50 to-white dark:from-slate-900/40 dark:via-slate-950 dark:to-emerald-950/20 border border-slate-200/70 dark:border-slate-800/70 shadow-lg">
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-amber-400/50 to-transparent" />
        <div className="relative p-5">
          <div className="flex items-center gap-2.5 mb-4">
            <div className="flex items-center justify-center h-9 w-9 rounded-lg bg-gradient-to-br from-emerald-700 to-emerald-900 shadow-md ring-1 ring-amber-300/25">
              <ScrollText className="w-3.5 h-3.5 text-amber-300" />
            </div>
            <div>
              <p className="text-[9px] uppercase tracking-[0.25em] font-semibold text-emerald-700/80 dark:text-emerald-300/70">The Rite</p>
              <h4 className="font-serif text-base font-bold text-slate-900 dark:text-white">What Happens Next</h4>
            </div>
          </div>

          <div className="grid md:grid-cols-4 gap-2.5">
            {[
              { title: "Submit", desc: "Send request with purpose and amount." },
              { title: "Approval", desc: "Management reviews and approves." },
              { title: "Broadcast", desc: "48h window to raise threshold." },
              { title: "Payout", desc: "Admin releases held funds to the recipient." },
            ].map((step, idx) => (
              <div key={step.title} className="group relative overflow-hidden rounded-lg border border-slate-200/70 dark:border-slate-800/70 bg-white/90 dark:bg-slate-950/80 p-3 hover:border-emerald-300 dark:hover:border-emerald-700 transition-colors">
                <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-emerald-400 to-amber-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="flex items-center gap-1.5 mb-1.5">
                  <span className="inline-flex items-center justify-center h-5 w-5 rounded-full bg-gradient-to-br from-emerald-600 to-emerald-800 text-white text-[10px] font-bold shadow-md ring-1 ring-amber-300/30">
                    {idx + 1}
                  </span>
                  <p className="text-[9px] uppercase tracking-[0.18em] font-semibold text-slate-500 dark:text-slate-400">Step</p>
                </div>
                <p className="font-serif text-sm font-bold text-slate-900 dark:text-white">{step.title}</p>
                <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5 leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
      </div>

      {/* ── CONTRIBUTE MODAL ── */}
      {selectedBroadcast && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md px-4 py-6 overflow-y-auto">
          <div className="absolute inset-0" onClick={() => setSelectedBroadcast(null)} />

          <div className="relative w-full max-w-lg my-auto">
            {/* Ambient gold glow */}
            <div className="absolute -inset-1 rounded-2xl bg-gradient-to-br from-amber-400/30 via-emerald-500/20 to-amber-400/20 blur-2xl" />

            <div className="relative rounded-2xl bg-gradient-to-br from-white via-white to-emerald-50/30 dark:from-slate-950 dark:via-slate-950 dark:to-emerald-950/30 border border-amber-300/40 dark:border-amber-700/40 shadow-[0_25px_80px_-10px_rgba(0,0,0,0.5)] overflow-hidden">
              {/* Top ornamental bar */}
              <div className="h-1 bg-gradient-to-r from-emerald-500 via-amber-400 to-emerald-500" />

              <div className="p-6 sm:p-7 space-y-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="flex items-center justify-center h-11 w-11 rounded-xl bg-gradient-to-br from-emerald-700 to-emerald-900 shadow-lg shadow-emerald-900/30 ring-1 ring-amber-300/30 shrink-0">
                      <Gem className="w-4 h-4 text-amber-300" />
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-[0.3em] font-semibold text-emerald-700/80 dark:text-emerald-300/70">Contribute to</p>
                      <h3 className="font-serif text-xl font-bold text-slate-900 dark:text-white mt-0.5">{hashRequestId(selectedBroadcast.id)}</h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-xs">{selectedBroadcast.purpose}</p>
                    </div>
                  </div>
                  <button
                    className="flex items-center justify-center h-8 w-8 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors"
                    onClick={() => setSelectedBroadcast(null)}
                    aria-label="Close"
                  >
                    ✕
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="text-[10px] uppercase tracking-[0.25em] font-semibold text-slate-500 dark:text-slate-400">Amount (min {formatAmount(500)})</label>
                    <input
                      type="number"
                      min={500}
                      value={contributionAmount}
                      onChange={(e) => setContributionAmount(e.target.value)}
                      className="mt-2 w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950/70 px-4 py-3 text-base font-serif font-bold text-slate-900 dark:text-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition"
                      placeholder="Enter amount"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] uppercase tracking-[0.25em] font-semibold text-slate-500 dark:text-slate-400">Payment Method</label>
                    <div className="mt-2 grid grid-cols-1 sm:grid-cols-3 gap-2">
                      {(["wallet", "community", "crypto"] as const).map((w) => {
                        const active = contributionWallet === w;
                        return (
                          <button
                            key={w}
                            onClick={() => setContributionWallet(w)}
                            className={"relative overflow-hidden rounded-xl border-2 px-3 py-2.5 text-xs font-semibold capitalize transition-all " + (active ? "border-emerald-500 bg-gradient-to-br from-emerald-50 to-white dark:from-emerald-950/40 dark:to-slate-950 shadow-md shadow-emerald-900/[0.08]" : "border-slate-200 dark:border-slate-800 hover:border-emerald-300 dark:hover:border-emerald-700 bg-white dark:bg-slate-950/50")}
                          >
                            {active && <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-emerald-400 to-amber-400" />}
                            <div className="text-slate-900 dark:text-white text-xs font-serif font-bold">
                              {w === "wallet" ? "Cash" : w === "community" ? "Community" : "Crypto"}
                            </div>
                            <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 normal-case font-normal">
                              {w === "wallet"
                                ? formatAmount(balances.cash)
                                : w === "community"
                                  ? formatAmount(balances.community)
                                  : "USDT"}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2">
                      {contributionWallet === "crypto"
                        ? "Send USDT and paste the transaction hash below."
                        : "Balances refresh after each contribution."}
                    </p>
                  </div>

                  {contributionWallet === "crypto" && (
                    <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                      <CryptoTransferDetails className="space-y-3" />
                      <div>
                        <label className="text-[10px] uppercase tracking-[0.25em] font-semibold text-slate-500 dark:text-slate-400">Transaction Hash *</label>
                        <Input
                          type="text"
                          value={cryptoTxHash}
                          onChange={(e) => setCryptoTxHash(e.target.value)}
                          placeholder="Paste your transaction hash here"
                          className="mt-2 font-mono text-xs"
                        />
                      </div>
                    </div>
                  )}
                </div>

                <button
                  className="group relative w-full inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 via-emerald-700 to-emerald-800 px-6 py-3.5 text-sm font-semibold uppercase tracking-wider text-white shadow-lg shadow-emerald-900/30 ring-1 ring-emerald-400/30 hover:shadow-xl hover:shadow-emerald-900/40 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                  disabled={
                    (contributionWallet === "crypto" ? cryptoContributeMutation.isPending : contributeMutation.isPending)
                    || !contributionAmount
                    || (contributionWallet === "crypto" && !cryptoTxHash.trim())
                  }
                  onClick={() => {
                    const amt = Number(contributionAmount);
                    if (Number.isNaN(amt) || amt < 500) {
                      toast.error(`Minimum contribution is ${formatAmount(500)}`);
                      return;
                    }
                    if (contributionWallet === "crypto") {
                      if (!cryptoTxHash.trim()) {
                        toast.error("Please enter the transaction hash");
                        return;
                      }
                      cryptoContributeMutation.mutate({
                        amount: amt,
                        currency: "USDT",
                        purpose: PaymentPurpose.CSP_CONTRIBUTION,
                        txHash: cryptoTxHash.trim(),
                        metadata: { cspRequestId: selectedBroadcast.id },
                      });
                      return;
                    }
                    contributeMutation.mutate({
                      requestId: selectedBroadcast.id,
                      amount: amt,
                      walletType: contributionWallet,
                    });
                  }}
                >
                  <span className="absolute inset-0 rounded-xl bg-gradient-to-r from-transparent via-amber-300/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  <Sparkles className="w-4 h-4 relative" />
                  <span className="relative">
                    {(contributionWallet === "crypto" ? cryptoContributeMutation.isPending : contributeMutation.isPending)
                      ? "Processing…"
                      : "Submit Contribution"}
                  </span>
                </button>

                <p className="text-[11px] text-slate-500 dark:text-slate-400 text-center leading-relaxed">
                  Funds are held until the threshold is met or admin releases payout after review.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── COMMUNICATION HISTORY ── */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-serif text-base font-bold text-slate-900 dark:text-white">Communication History</h3>
          <Button variant="outline" size="sm" onClick={() => communicationFeedQuery.refetch()} className="border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200">
            <Bell className="w-3.5 h-3.5 mr-1.5" />
            Refresh
          </Button>
        </div>
        {communicationFeedQuery.data && communicationFeedQuery.data.length > 0 ? (
          <div className="space-y-2">
            {communicationFeedQuery.data.map((item) => (
              <div key={item.id} className="flex items-start gap-2.5 rounded-lg border border-slate-100 dark:border-slate-800 p-2.5">
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-slate-900 dark:text-white">{item.title}</p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">{item.message}</p>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">{new Date(item.createdAt).toLocaleString()}</p>
                </div>
                {!item.isRead && (
                  <span className="inline-flex items-center rounded-full bg-emerald-100 dark:bg-emerald-900/30 px-2 py-0.5 text-[10px] font-medium text-emerald-700 dark:text-emerald-400">
                    New
                  </span>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-slate-400 dark:text-slate-500 text-center py-4">No communications yet.</p>
        )}
      </div>

    </div>
  );
}

export default CspDashboard;
