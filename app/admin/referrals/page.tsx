"use client";

import { useMemo, useState } from "react";
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

  const searchUsersQuery = api.adminReferrals.searchReferralUsers.useQuery(
    { query: rootQuery || "seed", limit: 6 },
    { enabled: rootQuery.length > 2 }
  );

  const reassignSponsor = api.adminReferrals.reassignSponsor.useMutation();
  const resolveMissing = api.adminReferrals.resolveMissingReferral.useMutation();

  const isBusy =
    networkQuery.isLoading ||
    networkQuery.isRefetching ||
    reassignSponsor.isPending ||
    resolveMissing.isPending;

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

  const LevelCard = ({ level }: { level: any }) => (
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
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Clock className="h-4 w-4" />
          {filters.sortBy === "registration" ? "Sorted by registration date" : "Sorted by package"}
        </div>
      </div>
      <div className="grid gap-3 px-4 pb-4 sm:grid-cols-2 lg:grid-cols-3">
        {level.nodes.map((node: any) => {
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
    </motion.div>
  );

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
        </div>
      ) : (
        <div className="rounded-2xl border border-border bg-card/70 p-6 text-center text-sm text-muted-foreground">
          Unable to load referral data.
        </div>
      )}

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
