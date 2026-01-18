"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import {
  Loader2,
  Share2,
  Search,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Package,
  Clock,
  Users,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import { api } from "@/client/trpc";

interface ReferralFilter {
  rootUserId?: string;
  email?: string;
  depth: number;
  packageIds: string[];
  registrationFrom?: string;
  registrationTo?: string;
  sortBy: "registration" | "package";
  sortOrder: "asc" | "desc";
}

const shimmer = "relative overflow-hidden before:absolute before:inset-0 before:-translate-x-full before:bg-gradient-to-r before:from-transparent before:via-white/10 before:to-transparent before:animate-[shimmer_1.8s_infinite]";

export default function AdminReferralsPage() {
  const [filters, setFilters] = useState<ReferralFilter>({
    depth: 5,
    packageIds: [],
    sortBy: "registration",
    sortOrder: "desc",
  });
  const [rootQuery, setRootQuery] = useState("");
  const [linkingId, setLinkingId] = useState<string | null>(null);
  const [pendingSponsor, setPendingSponsor] = useState<{ userId: string; sponsorId: string } | null>(null);
  const [missingSponsorEmail, setMissingSponsorEmail] = useState<Record<string, string>>({});
  const [edgesPage, setEdgesPage] = useState(1);
  const [edgesPageSize] = useState(50);

  const [expandedLevels, setExpandedLevels] = useState<Record<number, boolean>>({});
  const [levelPage, setLevelPage] = useState<Record<number, number>>({});
  const [levelPageSize, setLevelPageSize] = useState<Record<number, number>>({});

  const [flatPage, setFlatPage] = useState(1);
  const [flatPageSize, setFlatPageSize] = useState(25);

  const networkQuery = api.adminReferrals.getReferralNetwork.useQuery(
    {
      rootUserId: filters.rootUserId,
      email: filters.email,
      depth: filters.depth,
      packageIds: filters.packageIds,
      registrationFrom: filters.registrationFrom,
      registrationTo: filters.registrationTo,
      sortBy: filters.sortBy,
      sortOrder: filters.sortOrder,
      limitPerLevel: 200,
    }
  );

  const packages = networkQuery.data?.packages || [];

  const missingQuery = api.adminReferrals.getMissingReferralUsers.useQuery(
    {
      page: 1,
      pageSize: 25,
      search: undefined,
      packageIds: filters.packageIds,
      registrationFrom: filters.registrationFrom,
      registrationTo: filters.registrationTo,
    }
  );

  const edgesQuery = api.adminReferrals.getReferralEdges.useQuery({
    page: edgesPage,
    pageSize: edgesPageSize,
  });

  const searchUsersQuery = api.adminReferrals.searchReferralUsers.useQuery(
    { query: rootQuery || "seed", limit: 6 },
    { enabled: rootQuery.length > 2 }
  );

  const reassignSponsor = api.adminReferrals.reassignSponsor.useMutation();
  const resolveMissing = api.adminReferrals.resolveMissingReferral.useMutation();
  const resolveMissingByEmail = api.adminReferrals.resolveMissingReferralByEmail.useMutation();

  const isBusy =
    networkQuery.isLoading ||
    networkQuery.isRefetching ||
    reassignSponsor.isPending ||
    resolveMissing.isPending ||
    resolveMissingByEmail.isPending;

  const packageOptions = useMemo(() => packages.map((p) => ({ value: p.id, label: `${p.name} • ${p.packageType}` })), [packages]);

  const handleRefresh = async () => {
    const toastId = toast.loading("Refreshing referral map...");
    try {
      await Promise.all([networkQuery.refetch(), missingQuery.refetch()]);
      toast.success("Referral data refreshed", { id: toastId });
    } catch (err: any) {
      toast.error(err?.message || "Failed to refresh", { id: toastId });
    }
  };

  const handleSponsorChange = async (userId: string, sponsorId: string) => {
    if (!sponsorId) {
      toast.error("Select a sponsor before reassigning.");
      return;
    }
    setPendingSponsor({ userId, sponsorId });
    const toastId = toast.loading("Updating sponsor...");
    try {
      await reassignSponsor.mutateAsync({ userId, newSponsorId: sponsorId });
      await Promise.all([networkQuery.refetch(), missingQuery.refetch()]);
      toast.success("Sponsor updated and lineage refreshed", { id: toastId });
    } catch (err: any) {
      toast.error(err?.message || "Failed to update sponsor", { id: toastId });
    } finally {
      setPendingSponsor(null);
    }
  };

  const handleResolveMissing = async (userId: string, sponsorId: string) => {
    if (!sponsorId) {
      toast.error("Choose a sponsor to attach this user.");
      return;
    }
    setPendingSponsor({ userId, sponsorId });
    const toastId = toast.loading("Resolving missing referral...");
    try {
      await resolveMissing.mutateAsync({ userId, sponsorId });
      await Promise.all([networkQuery.refetch(), missingQuery.refetch()]);
      toast.success("User attached and lineage recalculated", { id: toastId });
    } catch (err: any) {
      toast.error(err?.message || "Resolution failed", { id: toastId });
    } finally {
      setPendingSponsor(null);
    }
  };

  const handleResolveMissingByEmail = async (userId: string) => {
    const sponsorEmail = (missingSponsorEmail[userId] || "").trim();
    if (!sponsorEmail) {
      toast.error("Enter a sponsor email.");
      return;
    }

    setPendingSponsor({ userId, sponsorId: sponsorEmail });
    const toastId = toast.loading("Attaching sponsor by email...");
    try {
      await resolveMissingByEmail.mutateAsync({ userId, sponsorEmail });
      await Promise.all([networkQuery.refetch(), missingQuery.refetch()]);
      toast.success("Sponsor attached", { id: toastId });
      setMissingSponsorEmail((prev) => ({ ...prev, [userId]: "" }));
    } catch (err: any) {
      toast.error(err?.message || "Failed to attach sponsor", { id: toastId });
    } finally {
      setPendingSponsor(null);
    }
  };

  const flattenedNetwork = useMemo(() => {
    if (!networkQuery.data) return [] as any[];
    const rows: any[] = [{
      ...networkQuery.data.root,
      level: 0,
      referrerId: null,
      referredAt: networkQuery.data.root.createdAt,
    }];
    for (const level of networkQuery.data.levels) {
      for (const node of level.nodes) {
        rows.push({ ...node, level: level.level });
      }
    }
    return rows;
  }, [networkQuery.data]);

  const flatTotalPages = useMemo(
    () => Math.max(1, Math.ceil(flattenedNetwork.length / Math.max(1, flatPageSize))),
    [flattenedNetwork.length, flatPageSize]
  );
  const flatRows = useMemo(() => {
    const start = (flatPage - 1) * flatPageSize;
    return flattenedNetwork.slice(start, start + flatPageSize);
  }, [flattenedNetwork, flatPage, flatPageSize]);

  useEffect(() => {
    setFlatPage(1);
  }, [filters.rootUserId, filters.email, filters.depth, filters.packageIds, filters.registrationFrom, filters.registrationTo, filters.sortBy, filters.sortOrder]);

  useEffect(() => {
    setFlatPage((p) => Math.min(Math.max(1, p), flatTotalPages));
  }, [flatTotalPages]);

  const LevelCard = ({ level }: { level: any }) => {
    const isExpanded = expandedLevels[level.level] ?? true;
    const perPage = levelPageSize[level.level] ?? 20;
    const currentPage = levelPage[level.level] ?? 1;
    const totalPages = Math.max(1, Math.ceil(level.nodes.length / Math.max(1, perPage)));
    const safePage = Math.min(Math.max(1, currentPage), totalPages);
    const pagedNodes = level.nodes.slice((safePage - 1) * perPage, (safePage - 1) * perPage + perPage);

    useEffect(() => {
      if (safePage !== currentPage) {
        setLevelPage((prev) => ({ ...prev, [level.level]: safePage }));
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [totalPages]);

    return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="relative overflow-hidden rounded-2xl border border-border bg-card/80 shadow-xl backdrop-blur"
    >
      <div className="absolute -top-20 -right-24 h-40 w-40 rounded-full bg-gradient-to-br from-[hsl(var(--secondary))] to-[hsl(var(--primary))] opacity-10 blur-3xl" />
      <div className="relative flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[hsl(var(--primary))] to-[hsl(var(--secondary))] text-white shadow-lg">
            <Share2 className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Level {level.level}</p>
            <p className="text-lg font-semibold">{level.nodes.length} accounts</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-2">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Clock className="h-4 w-4" />
            {filters.sortBy === "registration" ? "Sorted by registration date" : "Sorted by package"}
          </div>

          <div className="flex items-center gap-2">
            <label className="text-xs font-semibold text-muted-foreground">Per page</label>
            <select
              value={perPage}
              onChange={(e) => {
                const next = Number(e.target.value);
                setLevelPageSize((prev) => ({ ...prev, [level.level]: next }));
                setLevelPage((prev) => ({ ...prev, [level.level]: 1 }));
              }}
              className="h-8 rounded-lg border border-border bg-background px-2 text-xs font-semibold"
              disabled={!isExpanded}
            >
              {[20, 50, 100, 200].map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setLevelPage((prev) => ({ ...prev, [level.level]: Math.max(1, safePage - 1) }))}
              disabled={!isExpanded || safePage <= 1}
              className="inline-flex h-8 items-center justify-center rounded-lg border border-border bg-background px-3 text-xs font-semibold transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-60"
            >
              Prev
            </button>
            <div className="text-xs font-semibold text-muted-foreground">
              {safePage}/{totalPages}
            </div>
            <button
              onClick={() => setLevelPage((prev) => ({ ...prev, [level.level]: Math.min(totalPages, safePage + 1) }))}
              disabled={!isExpanded || safePage >= totalPages}
              className="inline-flex h-8 items-center justify-center rounded-lg border border-border bg-background px-3 text-xs font-semibold transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-60"
            >
              Next
            </button>
          </div>

          <button
            onClick={() => setExpandedLevels((prev) => ({ ...prev, [level.level]: !(prev[level.level] ?? true) }))}
            className="inline-flex h-8 items-center gap-2 rounded-lg border border-border bg-background px-3 text-xs font-semibold transition hover:bg-muted"
          >
            {isExpanded ? "Collapse" : "Expand"}
          </button>
        </div>
      </div>
      {isExpanded ? (
      <div className="grid gap-3 px-4 pb-4 sm:grid-cols-2 lg:grid-cols-3">
        {pagedNodes.map((node: any) => {
          const isLinking = linkingId === node.id;
          const isChanging = pendingSponsor?.userId === node.id;
          return (
            <motion.div
              key={node.id}
              whileHover={{ y: -4, scale: 1.01 }}
              className="rounded-xl border border-border/80 bg-gradient-to-br from-card to-background/60 p-4 shadow-md"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="space-y-1">
                  <p className="text-sm font-semibold leading-tight">{node.name || "No name"}</p>
                  <p className="text-xs text-muted-foreground">{node.email}</p>
                  <p className="text-[11px] text-muted-foreground/80">Legacy: {node.legacyId || "—"}</p>
                </div>
                <span className="rounded-full bg-[hsl(var(--secondary))]/15 px-2 py-1 text-[11px] font-semibold text-[hsl(var(--secondary))]">
                  L{level.level}
                </span>
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                <Package className="h-4 w-4" />
                <span>{node.package?.name || "No package"}</span>
                <span className="mx-1">•</span>
                <Users className="h-4 w-4" />
                <span>{node.downlineCount} downlines</span>
              </div>
              <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span>{new Date(node.createdAt).toLocaleDateString()}</span>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  onClick={() => {
                    setLinkingId(node.id);
                    setTimeout(() => setLinkingId(null), 500);
                  }}
                  className="group inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-xs font-semibold transition-all hover:bg-background"
                  aria-busy={isLinking}
                >
                  {isLinking ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                  <span>Preview</span>
                </button>
                <button
                  onClick={() => handleSponsorChange(node.id, filters.rootUserId || node.referrerId || "")}
                  disabled={isChanging || !node.referrerId}
                  className="inline-flex items-center gap-2 rounded-lg bg-[hsl(var(--primary))] px-3 py-2 text-xs font-semibold text-white shadow-md transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
                  aria-busy={isChanging}
                >
                  {isChanging ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
                  <span>Reassign</span>
                </button>
                <Link
                  href={`/admin/users?userId=${node.id}`}
                  onClick={() => {
                    setLinkingId(node.id);
                    setTimeout(() => setLinkingId(null), 600);
                  }}
                  className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-xs font-semibold transition hover:bg-muted"
                  aria-busy={isLinking}
                >
                  {isLinking ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
                  <span>Open user</span>
                </Link>
              </div>
            </motion.div>
          );
        })}
      </div>
      ) : (
        <div className="px-4 pb-4">
          <div className="rounded-xl border border-border bg-background/60 p-4 text-sm text-muted-foreground">
            Collapsed.
          </div>
        </div>
      )}
    </motion.div>
    );
  };

  return (
    <div className="space-y-8 pb-16">
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-40 -right-20 h-96 w-96 rounded-full bg-gradient-to-br from-[hsl(var(--primary))] to-[hsl(var(--secondary))] opacity-10 blur-3xl" />
        <div className="absolute bottom-0 left-10 h-80 w-80 rounded-full bg-gradient-to-br from-[hsl(var(--secondary))] to-[hsl(var(--accent))] opacity-10 blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl border border-border bg-card/80 p-6 shadow-xl backdrop-blur"
      >
        <div className="absolute -top-16 -left-10 h-48 w-48 rounded-full bg-gradient-to-br from-[hsl(var(--secondary))] to-[hsl(var(--primary))] opacity-15 blur-3xl" />
        <div className="relative flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-[hsl(var(--primary))] to-[hsl(var(--secondary))] text-white shadow-lg">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Admin • Referrals</p>
              <h1 className="text-3xl font-bold leading-tight">Referral Command Center</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Inspect up to 10 levels, repair lineage cascades, and resolve missing sponsors with live recalculation.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleRefresh}
              disabled={isBusy}
              className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-semibold transition hover:bg-background disabled:cursor-not-allowed disabled:opacity-60"
              aria-busy={isBusy}
            >
              {isBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
              <span>Refresh</span>
            </button>
            <div className="inline-flex items-center gap-2 rounded-lg bg-[hsl(var(--primary))]/10 px-4 py-2 text-sm font-semibold text-[hsl(var(--primary))]">
              <Sparkles className="h-4 w-4" /> Live lineage guardrails
            </div>
          </div>
        </div>
      </motion.div>

      <div className="grid gap-4 rounded-2xl border border-border bg-card/70 p-4 shadow-lg backdrop-blur-lg">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <div className="flex flex-col gap-2">
            <label className="text-xs font-semibold text-muted-foreground">Root user (email / legacy id)</label>
            <div className="group relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                value={rootQuery}
                onChange={(e) => setRootQuery(e.target.value)}
                placeholder="Search user"
                className="w-full rounded-lg border border-border bg-background px-9 py-2 text-sm focus:border-[hsl(var(--secondary))] focus:outline-none"
              />
            </div>
            <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
              <AnimatePresence>
                {searchUsersQuery.data?.map((u) => (
                  <motion.button
                    key={u.id}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    onClick={() => setFilters((f) => ({ ...f, rootUserId: u.id, email: undefined }))}
                    className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-3 py-1 font-semibold transition hover:bg-muted"
                    aria-busy={isBusy}
                  >
                    {isBusy ? <Loader2 className="h-3 w-3 animate-spin" /> : <CheckCircle2 className="h-3 w-3 text-[hsl(var(--primary))]" />}
                    <span>{u.email}</span>
                  </motion.button>
                ))}
              </AnimatePresence>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-xs font-semibold text-muted-foreground">Depth (levels)</label>
            <div className="flex items-center gap-2">
              <input
                type="range"
                min={1}
                max={10}
                value={filters.depth}
                onChange={(e) => setFilters((f) => ({ ...f, depth: Number(e.target.value) }))}
                className="w-full"
              />
              <span className="flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-background text-sm font-semibold">
                {filters.depth}
              </span>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-xs font-semibold text-muted-foreground">Membership package filter</label>
            <div className="flex flex-wrap gap-2">
              {packageOptions.slice(0, 4).map((pkg) => {
                const active = filters.packageIds.includes(pkg.value);
                return (
                  <button
                    key={pkg.value}
                    onClick={() =>
                      setFilters((f) => ({
                        ...f,
                        packageIds: active
                          ? f.packageIds.filter((id) => id !== pkg.value)
                          : [...f.packageIds, pkg.value],
                      }))
                    }
                    className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold transition ${
                      active ? "border-[hsl(var(--primary))] bg-[hsl(var(--primary))]/10 text-[hsl(var(--primary))]" : "border-border bg-background"
                    }`}
                    aria-busy={isBusy}
                  >
                    {active ? <Sparkles className="h-3 w-3" /> : <Package className="h-3 w-3" />}
                    {pkg.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="flex flex-col gap-2">
            <label className="text-xs font-semibold text-muted-foreground">Registration from</label>
            <input
              type="date"
              value={filters.registrationFrom || ""}
              onChange={(e) => setFilters((f) => ({ ...f, registrationFrom: e.target.value || undefined }))}
              className="rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-[hsl(var(--secondary))] focus:outline-none"
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-xs font-semibold text-muted-foreground">Registration to</label>
            <input
              type="date"
              value={filters.registrationTo || ""}
              onChange={(e) => setFilters((f) => ({ ...f, registrationTo: e.target.value || undefined }))}
              className="rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-[hsl(var(--secondary))] focus:outline-none"
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-xs font-semibold text-muted-foreground">Sort by</label>
            <select
              value={filters.sortBy}
              onChange={(e) => setFilters((f) => ({ ...f, sortBy: e.target.value as any }))}
              className="rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-[hsl(var(--secondary))] focus:outline-none"
            >
              <option value="registration">Registration date</option>
              <option value="package">Membership package</option>
            </select>
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-xs font-semibold text-muted-foreground">Order</label>
            <select
              value={filters.sortOrder}
              onChange={(e) => setFilters((f) => ({ ...f, sortOrder: e.target.value as any }))}
              className="rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-[hsl(var(--secondary))] focus:outline-none"
            >
              <option value="asc">Ascending</option>
              <option value="desc">Descending</option>
            </select>
          </div>
        </div>
      </div>

      {networkQuery.isLoading ? (
        <div className={`rounded-2xl border border-border bg-card/60 p-10 text-center ${shimmer}`}>
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-border border-t-[hsl(var(--primary))]" />
          <p className="mt-3 text-sm text-muted-foreground">Loading referral network...</p>
        </div>
      ) : networkQuery.data ? (
        <div className="space-y-4">
          <div className="rounded-2xl border border-border bg-card/75 p-4 shadow-lg backdrop-blur">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[hsl(var(--primary))] to-[hsl(var(--secondary))] text-white shadow-md">
                  <Users className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Root</p>
                  <p className="text-lg font-semibold">{networkQuery.data.root.name || networkQuery.data.root.email}</p>
                  <p className="text-xs text-muted-foreground">Package: {networkQuery.data.root.package?.name || "None"}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="rounded-full bg-[hsl(var(--secondary))]/10 px-3 py-1 text-xs font-semibold text-[hsl(var(--secondary))]">
                  {networkQuery.data.totals.totalNodes} nodes • {networkQuery.data.totals.levels} levels
                </div>
                <button
                  onClick={handleRefresh}
                  disabled={isBusy}
                  className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-xs font-semibold transition hover:bg-background disabled:cursor-not-allowed disabled:opacity-60"
                  aria-busy={isBusy}
                >
                  {isBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                  <span>Resync</span>
                </button>
              </div>
            </div>
          </div>

          <div className="grid gap-4">
            {networkQuery.data.levels.map((level) => (
              <LevelCard key={level.level} level={level} />
            ))}
            {networkQuery.data.levels.length === 0 && (
              <div className="rounded-2xl border border-border bg-card/70 p-6 text-center text-sm text-muted-foreground">
                No referrals found for this root and filters.
              </div>
            )}
          </div>

          {/* B) Flattened tree table */}
          <div className="rounded-2xl border border-border bg-card/75 p-6 shadow-xl backdrop-blur">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[hsl(var(--primary))] to-[hsl(var(--secondary))] text-white shadow-md">
                  <Users className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Structured table</p>
                  <p className="text-lg font-semibold">Flattened referral tree (root + levels)</p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <div className="flex items-center gap-2">
                  <label className="text-xs font-semibold text-muted-foreground">Rows</label>
                  <select
                    value={flatPageSize}
                    onChange={(e) => {
                      setFlatPageSize(Number(e.target.value));
                      setFlatPage(1);
                    }}
                    className="h-8 rounded-lg border border-border bg-background px-2 text-xs font-semibold"
                  >
                    {[25, 50, 100, 200].map((n) => (
                      <option key={n} value={n}>
                        {n}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setFlatPage((p) => Math.max(1, p - 1))}
                    disabled={flatPage <= 1}
                    className="inline-flex h-8 items-center justify-center rounded-lg border border-border bg-background px-3 text-xs font-semibold transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    Prev
                  </button>
                  <div className="text-xs font-semibold text-muted-foreground">
                    {flatPage}/{flatTotalPages}
                  </div>
                  <button
                    onClick={() => setFlatPage((p) => Math.min(flatTotalPages, p + 1))}
                    disabled={flatPage >= flatTotalPages}
                    className="inline-flex h-8 items-center justify-center rounded-lg border border-border bg-background px-3 text-xs font-semibold transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    Next
                  </button>
                </div>

                <button
                  onClick={handleRefresh}
                  disabled={isBusy}
                  className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-xs font-semibold transition hover:bg-background disabled:cursor-not-allowed disabled:opacity-60"
                  aria-busy={isBusy}
                >
                  {isBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                  <span>Refresh</span>
                </button>
              </div>
            </div>

            <div className="mt-4 overflow-x-auto rounded-xl border border-border bg-background/60">
              <table className="min-w-full text-sm">
                <thead className="border-b border-border bg-background/80">
                  <tr className="text-left text-xs font-semibold text-muted-foreground">
                    <th className="px-4 py-3">Level</th>
                    <th className="px-4 py-3">Name</th>
                    <th className="px-4 py-3">Email</th>
                    <th className="px-4 py-3">Package</th>
                    <th className="px-4 py-3">Joined</th>
                    <th className="px-4 py-3">Sponsor</th>
                    <th className="px-4 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {flatRows.map((row) => (
                    <tr key={row.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center rounded-full border border-border bg-background px-2.5 py-1 text-xs font-semibold">
                          L{row.level}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-semibold">{row.name || "—"}</td>
                      <td className="px-4 py-3 text-muted-foreground">{row.email || "—"}</td>
                      <td className="px-4 py-3 text-muted-foreground">{row.package?.name || "No package"}</td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {row.createdAt ? new Date(row.createdAt).toLocaleDateString() : "—"}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {row.sponsorId || row.referrerId || "—"}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-2">
                          <Link
                            href={`/admin/users?userId=${row.id}`}
                            className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-1.5 text-xs font-semibold transition hover:bg-muted"
                            aria-busy={linkingId === row.id}
                            onClick={() => {
                              setLinkingId(row.id);
                              setTimeout(() => setLinkingId(null), 600);
                            }}
                          >
                            {linkingId === row.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
                            <span>Open</span>
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border border-border bg-card/70 p-6 text-center text-sm text-muted-foreground">
          Unable to load referral data.
        </div>
      )}

      {/* A) Raw referral table */}
      <div className="rounded-2xl border border-border bg-card/75 p-6 shadow-xl backdrop-blur">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[hsl(var(--secondary))] to-[hsl(var(--primary))] text-white shadow-md">
              <Share2 className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Database</p>
              <p className="text-lg font-semibold">Referral table (raw edges)</p>
            </div>
          </div>
          <button
            onClick={() => edgesQuery.refetch()}
            disabled={edgesQuery.isRefetching}
            className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-xs font-semibold transition hover:bg-background disabled:cursor-not-allowed disabled:opacity-60"
            aria-busy={edgesQuery.isRefetching}
          >
            {edgesQuery.isRefetching ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            <span>Reload</span>
          </button>
        </div>

        {edgesQuery.isLoading ? (
          <div className={`mt-4 rounded-xl border border-border bg-background/70 p-6 text-center ${shimmer}`}>
            <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-border border-t-[hsl(var(--primary))]" />
            <p className="mt-2 text-sm text-muted-foreground">Loading referral edges...</p>
          </div>
        ) : edgesQuery.data ? (
          <>
            <div className="mt-4 overflow-x-auto rounded-xl border border-border bg-background/60">
              <table className="min-w-full text-sm">
                <thead className="border-b border-border bg-background/80">
                  <tr className="text-left text-xs font-semibold text-muted-foreground">
                    <th className="px-4 py-3">Created</th>
                    <th className="px-4 py-3">Referrer</th>
                    <th className="px-4 py-3">Referred</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Reward</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {edgesQuery.data.rows.map((r) => (
                    <tr key={r.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3 text-muted-foreground">
                        {r.createdAt ? new Date(r.createdAt).toLocaleString() : "—"}
                      </td>
                      <td className="px-4 py-3">
                        <div className="space-y-0.5">
                          <div className="font-semibold">{r.referrer?.name || "—"}</div>
                          <div className="text-xs text-muted-foreground">{r.referrer?.email || r.referrerId}</div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="space-y-0.5">
                          <div className="font-semibold">{r.referred?.name || "—"}</div>
                          <div className="text-xs text-muted-foreground">{r.referred?.email || r.referredId}</div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center rounded-full border border-border bg-background px-2.5 py-1 text-xs font-semibold">
                          {r.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {r.rewardPaid ? "Paid" : "Unpaid"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
              <div>
                Page <span className="font-semibold text-foreground">{edgesQuery.data.page}</span> of{" "}
                <span className="font-semibold text-foreground">{edgesQuery.data.pages || 1}</span> •{" "}
                <span className="font-semibold text-foreground">{edgesQuery.data.total}</span> rows
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setEdgesPage((p) => Math.max(1, p - 1))}
                  disabled={edgesPage <= 1 || edgesQuery.isRefetching}
                  className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-xs font-semibold transition hover:bg-background disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Prev
                </button>
                <button
                  onClick={() => setEdgesPage((p) => p + 1)}
                  disabled={edgesPage >= (edgesQuery.data.pages || 1) || edgesQuery.isRefetching}
                  className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-xs font-semibold transition hover:bg-background disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Next
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="mt-4 rounded-xl border border-border bg-background/70 p-6 text-center text-sm text-muted-foreground">
            Unable to load referral edges.
          </div>
        )}
      </div>

      <div className="rounded-2xl border border-border bg-card/75 p-6 shadow-xl backdrop-blur">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 text-white shadow-md">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Missing referred users</p>
              <p className="text-lg font-semibold">Unattached accounts ({missingQuery.data?.total || 0})</p>
            </div>
          </div>
          <button
            onClick={() => missingQuery.refetch()}
            disabled={missingQuery.isRefetching}
            className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-xs font-semibold transition hover:bg-background disabled:cursor-not-allowed disabled:opacity-60"
            aria-busy={missingQuery.isRefetching}
          >
            {missingQuery.isRefetching ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            <span>Reload</span>
          </button>
        </div>

        {missingQuery.isLoading ? (
          <div className={`mt-4 rounded-xl border border-border bg-background/70 p-6 text-center ${shimmer}`}>
            <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-border border-t-[hsl(var(--primary))]" />
            <p className="mt-2 text-sm text-muted-foreground">Loading missing accounts...</p>
          </div>
        ) : (
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {missingQuery.data?.items.map((u) => {
              const resolving = pendingSponsor?.userId === u.id;
              return (
                <motion.div
                  key={u.id}
                  whileHover={{ y: -4, scale: 1.01 }}
                  className="rounded-xl border border-border bg-background/80 p-4 shadow-md"
                >
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <p className="text-sm font-semibold leading-tight">{u.name || u.email}</p>
                      <p className="text-xs text-muted-foreground">Legacy: {u.legacyId || "—"}</p>
                      <p className="text-[11px] text-muted-foreground">Registered {new Date(u.createdAt).toLocaleDateString()}</p>
                    </div>
                    <span className="rounded-full bg-amber-500/15 px-2 py-1 text-[11px] font-semibold text-amber-600">No sponsor</span>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2 text-[11px] text-muted-foreground">
                    <Package className="h-3 w-3" />
                    <span>{u.package?.name || "No package"}</span>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <div className="w-full">
                      <label className="mb-1 block text-[11px] font-semibold text-muted-foreground">
                        Attach sponsor by email
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          value={missingSponsorEmail[u.id] || ""}
                          onChange={(e) =>
                            setMissingSponsorEmail((prev) => ({
                              ...prev,
                              [u.id]: e.target.value,
                            }))
                          }
                          placeholder="sponsor@email.com"
                          className="h-9 flex-1 rounded-lg border border-border bg-background px-3 text-xs focus:border-[hsl(var(--secondary))] focus:outline-none"
                          disabled={resolving}
                        />
                        <button
                          onClick={() => handleResolveMissingByEmail(u.id)}
                          disabled={resolving || !(missingSponsorEmail[u.id] || "").trim()}
                          className="inline-flex h-9 items-center gap-2 rounded-lg bg-[hsl(var(--primary))] px-3 text-xs font-semibold text-white shadow-md transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
                          aria-busy={resolving}
                        >
                          {resolving ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
                          Attach
                        </button>
                      </div>
                    </div>

                    <button
                      onClick={() =>
                        handleResolveMissing(
                          u.id,
                          networkQuery.data?.root.id || filters.rootUserId || ""
                        )
                      }
                      disabled={resolving || !(networkQuery.data?.root.id || filters.rootUserId)}
                      className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-xs font-semibold transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-60"
                      aria-busy={resolving}
                    >
                      {resolving ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
                      Attach to root sponsor
                    </button>
                    <Link
                      href={`/admin/users?userId=${u.id}`}
                      onClick={() => {
                        setLinkingId(u.id);
                        setTimeout(() => setLinkingId(null), 600);
                      }}
                      className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-xs font-semibold transition hover:bg-muted"
                      aria-busy={linkingId === u.id}
                    >
                      {linkingId === u.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
                      Open profile
                    </Link>
                  </div>
                </motion.div>
              );
            })}
            {missingQuery.data?.items.length === 0 && (
              <div className="rounded-xl border border-border bg-background/70 p-6 text-center text-sm text-muted-foreground">
                No missing referrals found for current filters.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
