"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import {
  MdDeleteSweep,
  MdRefresh,
  MdShield,
  MdStorage,
  MdTableChart,
  MdWarningAmber,
} from "react-icons/md";
import { api } from "@/client/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/Modal";

interface TableInfo {
  schema: string;
  name: string;
  quotedName: string;
  rowEstimate: number;
  totalBytes: number;
}

interface WipeEligibilityInfo {
  schema: string;
  name: string;
  rowCount: number;
  eligible: boolean;
}

function formatBytes(bytes: number): string {
  if (!bytes || bytes < 0) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const value = bytes / Math.pow(1024, i);
  return `${value.toFixed(value >= 10 ? 0 : 1)} ${units[i]}`;
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat().format(value || 0);
}

function formatCell(value: unknown): string {
  if (value === null || value === undefined) return "—";
  if (typeof value === "object") {
    try {
      return JSON.stringify(value);
    } catch (_) {
      return "[object]";
    }
  }
  return String(value);
}

export default function DatabaseMaintenancePanel() {
  const { data, isLoading, error, refetch, isRefetching } = api.admin.listDatabaseTables.useQuery(
    undefined,
    { refetchOnWindowFocus: false }
  );
  const truncateMutation = api.admin.truncateTable.useMutation();
  const [previewTable, setPreviewTable] = useState<string | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const previewQuery = api.admin.previewTable.useQuery(
    { tableName: previewTable || "", limit: 20 },
    { enabled: Boolean(previewTable), staleTime: 30000, refetchOnWindowFocus: false }
  );
  const {
    data: eligibilityData,
    isLoading: isLoadingEligibility,
    error: eligibilityError,
    refetch: refetchEligibility,
    isRefetching: isRefetchingEligibility,
  } = api.admin.getWipeEligibility.useQuery(undefined, { refetchOnWindowFocus: false });
  const {
    data: wipeProfile,
    isLoading: isLoadingWipeProfile,
    error: wipeProfileError,
    refetch: refetchWipeProfile,
    isRefetching: isRefetchingWipeProfile,
  } = api.admin.getWipeProfile.useQuery(undefined, { refetchOnWindowFocus: false });
  const captureWipeProfileMutation = api.admin.captureWipeProfile.useMutation();
  const wipeMutation = api.admin.wipeStoredTables.useMutation();

  const handlePreview = (tableName: string) => {
    if (previewTable === tableName) {
      setPreviewOpen(true);
      previewQuery.refetch();
      return;
    }
    setPreviewTable(tableName);
    setPreviewOpen(true);
  };

  const [search, setSearch] = useState("");
  const [confirmTable, setConfirmTable] = useState<string | null>(null);
  const [processingTable, setProcessingTable] = useState<string | null>(null);
  const confirmTargetRef = useRef<string | null>(null);
  const [confirmWipe, setConfirmWipe] = useState(false);

  useEffect(() => {
    if (error) {
      toast.error(error.message || "Failed to load tables");
    }
  }, [error]);

  useEffect(() => {
    if (eligibilityError) {
      toast.error(eligibilityError.message || "Failed to load wipe eligibility");
    }
  }, [eligibilityError]);

  useEffect(() => {
    if (wipeProfileError) {
      toast.error(wipeProfileError.message || "Failed to load wipe profile");
    }
  }, [wipeProfileError]);

  useEffect(() => {
    if (previewQuery.error) {
      toast.error(previewQuery.error.message || "Failed to load preview");
    }
  }, [previewQuery.error]);

  useEffect(() => {
    if (previewQuery.data && previewTable && previewOpen) {
      const count = previewQuery.data.rows?.length || 0;
      toast.success(`Loaded ${count} row${count === 1 ? "" : "s"} from ${previewTable}`);
    }
  }, [previewQuery.data, previewTable, previewOpen]);

  useEffect(() => {
    if (previewTable && previewOpen) {
      previewQuery.refetch();
    }
  }, [previewTable, previewOpen]);

  const tables: TableInfo[] = useMemo(() => {
    if (!data) return [];
    const term = search.trim().toLowerCase();
    const sorted = [...data].sort((a, b) => a.name.localeCompare(b.name));
    if (!term) return sorted;
    return sorted.filter((table) => table.name.toLowerCase().includes(term));
  }, [data, search]);

  const totalSize = useMemo(
    () => tables.reduce((acc, t) => acc + (t.totalBytes || 0), 0),
    [tables]
  );

  const totalRows = useMemo(
    () => tables.reduce((acc, t) => acc + (t.rowEstimate || 0), 0),
    [tables]
  );

  const largestTable = useMemo(() => {
    if (!tables.length) return null;
    return tables.reduce((prev, curr) => (curr.totalBytes > prev.totalBytes ? curr : prev));
  }, [tables]);

  const eligibility = (eligibilityData || []) as WipeEligibilityInfo[];
  const eligibleTables = eligibility.filter((t) => t.eligible);
  const blockedTables = eligibility.filter((t) => !t.eligible);

  const handleTruncate = async () => {
    const target = confirmTargetRef.current;
    if (!target) return;
    setProcessingTable(target);
    const toastId = toast.loading(`Truncating ${target}...`);

    try {
      await truncateMutation.mutateAsync({ tableName: target });
      toast.success(`Truncated and reset ${target}`);
      await refetch();
    } catch (err: any) {
      toast.error(err?.message || "Failed to truncate table");
    } finally {
      toast.dismiss(toastId);
      setConfirmTable(null);
      confirmTargetRef.current = null;
      setProcessingTable(null);
    }
  };

  const handleCaptureWipeProfile = async () => {
    const toastId = toast.loading("Capturing wipeable table list...");
    try {
      const result = await captureWipeProfileMutation.mutateAsync();
      toast.success(`Captured ${result.wipeableTables.length} wipeable table(s).`);
      await Promise.all([refetchEligibility(), refetchWipeProfile()]);
    } catch (err: any) {
      toast.error(err?.message || "Failed to capture wipe profile");
    } finally {
      toast.dismiss(toastId);
    }
  };

  const handleWipeEligible = async () => {
    const toastId = toast.loading("Resetting database using stored table list...");
    try {
      const result = await wipeMutation.mutateAsync();
      toast.success(`Wiped ${result.wipedTables.length} table(s).`);
      await Promise.all([refetch(), refetchEligibility(), refetchWipeProfile()]);
    } catch (err: any) {
      toast.error(err?.message || "Failed to reset database");
    } finally {
      toast.dismiss(toastId);
      setConfirmWipe(false);
    }
  };

  return (
    <div className="space-y-8 pb-16">
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="relative overflow-hidden rounded-3xl border border-border bg-gradient-to-br from-[hsl(var(--primary))]/10 via-card to-[hsl(var(--secondary))]/10 p-8 shadow-xl shadow-black/10 backdrop-blur"
      >
        <div className="absolute -left-10 -top-10 h-40 w-40 rounded-full bg-[hsl(var(--primary))]/20 blur-3xl" />
        <div className="absolute -right-16 bottom-0 h-48 w-48 rounded-full bg-[hsl(var(--secondary))]/20 blur-3xl" />
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full border border-border bg-background/60 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-foreground/80">
              <MdShield className="h-4 w-4" />
              Super Admin Only
            </div>
            <h1 className="text-3xl font-bold text-foreground lg:text-4xl">Database Maintenance</h1>
            <p className="max-w-2xl text-sm text-muted-foreground lg:text-base">
              Review every table, run a truncate + identity reset instantly, and keep schema intact.
              Actions log to the audit trail so you always have accountability.
            </p>
            <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-3 py-1 font-semibold text-amber-600">
                <MdWarningAmber className="h-4 w-4" /> Irreversible per table
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-3 py-1 font-semibold text-emerald-700">
                <MdStorage className="h-4 w-4" /> Public schema scope
              </span>
            </div>
          </div>
          <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center">
            <Button
              variant="outline"
              className="flex items-center gap-2"
              onClick={() => refetch()}
              disabled={isLoading || isRefetching}
            >
              <MdRefresh className={`h-4 w-4 ${isRefetching ? "animate-spin" : ""}`} />
              Refresh
            </Button>
            <div className="rounded-xl border border-red-200 bg-red-50/70 px-4 py-2 text-sm font-semibold text-red-700 shadow-sm dark:border-red-900/50 dark:bg-red-900/30 dark:text-red-200">
              Production enabled — proceed carefully
            </div>
          </div>
        </div>
      </motion.div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="relative overflow-hidden border-border/70 bg-card/80 backdrop-blur">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-3 text-lg">
              <div className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-background/70">
                <MdTableChart className="h-5 w-5" />
              </div>
              Tables
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-3xl font-bold">{formatNumber(tables.length)}</div>
            <p className="text-sm text-muted-foreground">Including migrations and system tables.</p>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-border/70 bg-card/80 backdrop-blur">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-3 text-lg">
              <div className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-background/70">
                <MdStorage className="h-5 w-5" />
              </div>
              Estimated Rows
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-3xl font-bold">{formatNumber(totalRows)}</div>
            <p className="text-sm text-muted-foreground">Summed from pg_stat estimates.</p>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-border/70 bg-card/80 backdrop-blur">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-3 text-lg">
              <div className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-background/70">
                <MdShield className="h-5 w-5" />
              </div>
              Footprint
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-3xl font-bold">{formatBytes(totalSize)}</div>
            <p className="text-sm text-muted-foreground">
              {largestTable ? `Largest: ${largestTable.name} (${formatBytes(largestTable.totalBytes)})` : "Size includes indexes."}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
        <Card className="h-fit border-amber-200/70 bg-amber-50/70 shadow-sm backdrop-blur dark:border-amber-900/40 dark:bg-amber-900/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-amber-800 dark:text-amber-100">
              <MdWarningAmber className="h-5 w-5" /> Safe-ops guidance
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-amber-900/90 dark:text-amber-50/80">
            <ul className="list-disc space-y-2 pl-4">
              <li>Truncate runs with CASCADE and RESTART IDENTITY — dependent tables will be cleared.</li>
              <li>Schema is untouched; only data resets. Be mindful of seed data requirements.</li>
              <li>_prisma_migrations is included; avoid truncating if you rely on migration history.</li>
              <li>Every action is logged in auditLog with your admin ID.</li>
            </ul>
            <div className="rounded-lg border border-amber-300/80 bg-white/70 px-3 py-2 text-xs font-semibold text-amber-800 shadow-sm dark:border-amber-700/50 dark:bg-amber-900/30 dark:text-amber-100">
              Tip: filter tables and run precise wipes instead of full resets.
            </div>
          </CardContent>
        </Card>

        <Card className="overflow-hidden border-border/70 bg-card/80 backdrop-blur">
          <CardHeader className="flex flex-col gap-4 pb-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="text-xl">Public schema tables</CardTitle>
              <p className="text-sm text-muted-foreground">Search, inspect, and truncate per table.</p>
            </div>
            <div className="flex items-center gap-3">
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Filter tables..."
                className="w-full min-w-[180px]"
              />
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className="h-16 animate-pulse rounded-lg border border-border/60 bg-muted/30"
                  />
                ))}
              </div>
            ) : error ? (
              <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-6 text-sm text-red-700 shadow-sm dark:border-red-900/50 dark:bg-red-900/20 dark:text-red-200">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="font-semibold">Failed to load tables.</p>
                    <p className="text-xs text-red-600/80 dark:text-red-100/80">{error.message}</p>
                  </div>
                  <Button
                    variant="outline"
                    className="border-red-200 text-red-700 hover:bg-red-50 dark:border-red-800 dark:text-red-200 dark:hover:bg-red-950"
                    onClick={() => refetch()}
                  >
                    Retry
                  </Button>
                </div>
              </div>
            ) : tables.length === 0 ? (
              <div className="rounded-lg border border-border/70 bg-muted/30 px-4 py-6 text-center text-sm text-muted-foreground">
                No tables found in the public schema.
              </div>
            ) : (
              <div className="space-y-3">
                {tables.map((table) => {
                  const busy = processingTable === table.name || truncateMutation.isPending;
                  const previewing = previewTable === table.name && previewQuery.isFetching;
                  return (
                    <motion.div
                      key={table.name}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.15 }}
                      className="flex flex-col gap-3 rounded-xl border border-border/70 bg-background/60 p-4 shadow-sm backdrop-blur-md sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-card/70">
                          <MdTableChart className="h-5 w-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 text-base font-semibold text-foreground">
                            {table.name}
                            <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                              {table.schema}
                            </span>
                          </div>
                          <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                            <span className="inline-flex items-center gap-1 rounded-full bg-muted/60 px-2 py-1 font-semibold text-foreground/80">
                              Rows ≈ {formatNumber(table.rowEstimate)}
                            </span>
                            <span className="inline-flex items-center gap-1 rounded-full bg-muted/60 px-2 py-1 font-semibold text-foreground/80">
                              Footprint {formatBytes(table.totalBytes)}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <Button
                          variant="ghost"
                          className="flex items-center gap-2"
                          onClick={() => handlePreview(table.name)}
                          disabled={busy || previewing}
                        >
                          {previewing ? (
                            <span className="inline-flex items-center gap-2">
                              <MdRefresh className="h-4 w-4 animate-spin" />
                              Previewing...
                            </span>
                          ) : (
                            <span>Preview</span>
                          )}
                        </Button>
                        <Button
                          variant="outline"
                          className="flex items-center gap-2 border-red-200 text-red-700 hover:bg-red-50 dark:border-red-800 dark:text-red-200 dark:hover:bg-red-950"
                          onClick={() => {
                            confirmTargetRef.current = table.name;
                            setConfirmTable(table.name);
                          }}
                          disabled={busy}
                        >
                          <MdDeleteSweep className="h-4 w-4" />
                          Truncate & reset
                        </Button>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="border-border/70 bg-card/80 backdrop-blur">
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="text-xl">Database reset / nuke</CardTitle>
            <p className="text-sm text-muted-foreground">
              Capture wipeable table names once (from currently empty tables), then reset using that stored list.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              disabled={isLoadingEligibility || isRefetchingEligibility}
              onClick={() => refetchEligibility()}
            >
              <MdRefresh className={`mr-2 h-4 w-4 ${isRefetchingEligibility ? "animate-spin" : ""}`} />
              Refresh eligibility
            </Button>
            <Button
              variant="outline"
              disabled={captureWipeProfileMutation.isPending || isLoadingEligibility}
              onClick={handleCaptureWipeProfile}
            >
              {captureWipeProfileMutation.isPending ? "Capturing..." : "Capture wipeable list"}
            </Button>
            <Button
              variant="outline"
              className="border-red-200 text-red-700 hover:bg-red-50 dark:border-red-800 dark:text-red-200 dark:hover:bg-red-950"
              disabled={wipeMutation.isPending || isLoadingWipeProfile || !wipeProfile?.wipeableTables?.length}
              onClick={() => setConfirmWipe(true)}
            >
              {wipeMutation.isPending ? "Working..." : "Reset using stored list"}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoadingEligibility ? (
            <div className="h-20 animate-pulse rounded-lg border border-border/60 bg-muted/30" />
          ) : eligibilityError ? (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-4 text-sm text-red-700 shadow-sm dark:border-red-900/50 dark:bg-red-900/20 dark:text-red-200">
              {eligibilityError.message}
            </div>
          ) : (
            <div className="grid gap-6 lg:grid-cols-2">
              <div className="rounded-xl border border-emerald-200/70 bg-emerald-50/70 p-4 dark:border-emerald-900/40 dark:bg-emerald-900/20">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-emerald-800 dark:text-emerald-100">Wipeable (empty tables)</h3>
                  <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-xs font-semibold text-emerald-700 dark:text-emerald-200">
                    {eligibleTables.length}
                  </span>
                </div>
                <div className="mt-3 max-h-48 space-y-2 overflow-auto pr-2 text-sm">
                  {eligibleTables.length === 0 ? (
                    <div className="text-xs text-emerald-700/80 dark:text-emerald-100/70">No empty tables found.</div>
                  ) : (
                    eligibleTables.map((t) => (
                      <div key={t.name} className="flex items-center justify-between rounded-lg bg-white/70 px-3 py-2 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-100">
                        <span>{t.name}</span>
                        <span className="text-xs text-emerald-700/70 dark:text-emerald-100/60">rows: {formatNumber(t.rowCount)}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="rounded-xl border border-slate-200/70 bg-slate-50/70 p-4 dark:border-slate-800/50 dark:bg-slate-900/30">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-100">Protected (non-empty tables)</h3>
                  <span className="rounded-full bg-slate-500/15 px-2 py-0.5 text-xs font-semibold text-slate-700 dark:text-slate-200">
                    {blockedTables.length}
                  </span>
                </div>
                <div className="mt-3 max-h-48 space-y-2 overflow-auto pr-2 text-sm">
                  {blockedTables.length === 0 ? (
                    <div className="text-xs text-slate-600/80 dark:text-slate-200/70">No non-empty tables.</div>
                  ) : (
                    blockedTables.map((t) => (
                      <div key={t.name} className="flex items-center justify-between rounded-lg bg-white/70 px-3 py-2 text-slate-700 dark:bg-slate-900/40 dark:text-slate-100">
                        <span>{t.name}</span>
                        <span className="text-xs text-slate-600/70 dark:text-slate-200/60">rows: {formatNumber(t.rowCount)}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}
          <div className="mt-6 rounded-xl border border-border/70 bg-muted/20 p-4 text-sm">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="font-semibold text-foreground">Stored wipe profile</p>
                <p className="text-xs text-muted-foreground">
                  {wipeProfile?.capturedAt
                    ? `Captured at ${new Date(wipeProfile.capturedAt).toLocaleString()}`
                    : "Not captured yet"}
                </p>
              </div>
              <Button
                variant="ghost"
                disabled={isLoadingWipeProfile || isRefetchingWipeProfile}
                onClick={() => refetchWipeProfile()}
              >
                <MdRefresh className={`mr-2 h-4 w-4 ${isRefetchingWipeProfile ? "animate-spin" : ""}`} />
                Refresh profile
              </Button>
            </div>
            <div className="mt-3 grid gap-3 md:grid-cols-2">
              <div className="rounded-lg border border-emerald-200/70 bg-emerald-50/60 p-3 text-xs text-emerald-800 dark:border-emerald-900/40 dark:bg-emerald-900/20 dark:text-emerald-100">
                <div className="flex items-center justify-between">
                  <span className="font-semibold">Stored wipeable tables</span>
                  <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-semibold">
                    {wipeProfile?.wipeableTables?.length || 0}
                  </span>
                </div>
                <div className="mt-2 max-h-28 space-y-1 overflow-auto pr-2">
                  {(wipeProfile?.wipeableTables || []).length === 0 ? (
                    <div className="text-[11px] text-emerald-700/70 dark:text-emerald-100/70">No stored list yet.</div>
                  ) : (
                    (wipeProfile?.wipeableTables || []).map((name) => (
                      <div key={name} className="rounded bg-white/70 px-2 py-1 dark:bg-emerald-900/30">
                        {name}
                      </div>
                    ))
                  )}
                </div>
              </div>
              <div className="rounded-lg border border-slate-200/70 bg-slate-50/60 p-3 text-xs text-slate-800 dark:border-slate-800/50 dark:bg-slate-900/20 dark:text-slate-100">
                <div className="flex items-center justify-between">
                  <span className="font-semibold">Stored protected tables</span>
                  <span className="rounded-full bg-slate-500/15 px-2 py-0.5 text-[10px] font-semibold">
                    {wipeProfile?.protectedTables?.length || 0}
                  </span>
                </div>
                <div className="mt-2 max-h-28 space-y-1 overflow-auto pr-2">
                  {(wipeProfile?.protectedTables || []).length === 0 ? (
                    <div className="text-[11px] text-slate-600/70 dark:text-slate-200/70">No stored list yet.</div>
                  ) : (
                    (wipeProfile?.protectedTables || []).map((name) => (
                      <div key={name} className="rounded bg-white/70 px-2 py-1 dark:bg-slate-900/30">
                        {name}
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <ConfirmDialog
        isOpen={Boolean(confirmTable)}
        title="Confirm truncate"
        description={
          <div className="space-y-2 text-sm text-foreground/90">
            <p>
              This will run <strong>TRUNCATE ... RESTART IDENTITY CASCADE</strong> on
              <span className="font-semibold"> {confirmTargetRef.current || confirmTable}</span>.
            </p>
            <p>All rows will be removed and sequences reset. This cannot be undone.</p>
          </div>
        }
        confirmText={processingTable || truncateMutation.isPending ? "Working..." : "Yes, truncate it"}
        cancelText="Cancel"
        onConfirm={handleTruncate}
        onClose={() => {
          if (processingTable) return;
          setConfirmTable(null);
        }}
      />

      <ConfirmDialog
        isOpen={confirmWipe}
        title="Confirm database reset"
        description={
          <div className="space-y-2 text-sm text-foreground/90">
            <p>
              This will truncate <strong>only the stored wipeable tables</strong> and reset their identities.
            </p>
            <p>Protected tables will be skipped. This cannot be undone.</p>
          </div>
        }
        confirmText={wipeMutation.isPending ? "Working..." : "Yes, reset using stored list"}
        cancelText="Cancel"
        onConfirm={handleWipeEligible}
        onClose={() => {
          if (wipeMutation.isPending) return;
          setConfirmWipe(false);
        }}
      />

      <Modal
        isOpen={previewOpen}
        onClose={() => {
          setPreviewOpen(false);
        }}
        title={previewTable ? `Preview: ${previewTable}` : "Preview"}
        maxWidth="screen"
      >
        <div className="flex h-[80vh] w-full flex-col gap-4 overflow-auto pr-1">
          <div className="flex flex-wrap items-center gap-3 justify-between">
            <div className="text-sm text-muted-foreground">
              Showing first 20 rows ordered by first column.
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                disabled={!previewTable || previewQuery.isFetching}
                onClick={() => previewTable && previewQuery.refetch()}
              >
                <MdRefresh className={`mr-2 h-4 w-4 ${previewQuery.isFetching ? "animate-spin" : ""}`} />
                Refresh
              </Button>
              <Button
                variant="ghost"
                disabled={previewQuery.isFetching}
                onClick={() => {
                  setPreviewOpen(false);
                  setPreviewTable(null);
                }}
              >
                Clear
              </Button>
            </div>
          </div>

          {!previewTable ? (
            <div className="rounded-lg border border-border/70 bg-muted/30 px-4 py-6 text-sm text-muted-foreground">
              Choose a table to preview its contents.
            </div>
          ) : previewQuery.isFetching ? (
            <div className="h-20 animate-pulse rounded-lg border border-border/60 bg-muted/30" />
          ) : previewQuery.error ? (
            <div className="flex flex-col gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-4 text-sm text-red-700 shadow-sm dark:border-red-900/50 dark:bg-red-900/20 dark:text-red-200">
              <div className="font-semibold">Failed to load preview.</div>
              <div className="text-xs text-red-600/80 dark:text-red-100/80">{previewQuery.error.message}</div>
            </div>
          ) : previewQuery.data?.rows && previewQuery.data.rows.length > 0 ? (
            <div className="max-h-[70vh] overflow-auto rounded-lg border border-border/70">
              <table className="w-full min-w-max text-sm">
                <thead className="border-b border-border/70 bg-muted/40">
                  <tr>
                    {previewQuery.data.columns.map((col) => (
                      <th key={col.column_name} className="px-3 py-2 text-left font-semibold text-foreground">
                        {col.column_name}
                        <span className="ml-2 text-xs text-muted-foreground">{col.data_type}
                        </span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {previewQuery.data.rows.map((row, idx) => (
                    <tr key={idx} className="hover:bg-muted/40">
                      {previewQuery.data.columns.map((col) => (
                        <td key={col.column_name} className="px-3 py-2 align-top text-sm text-foreground">
                          {formatCell(row[col.column_name])}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="rounded-lg border border-border/70 bg-muted/30 px-4 py-6 text-sm text-muted-foreground">
              No rows found.
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}
