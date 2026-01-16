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

interface TableInfo {
  schema: string;
  name: string;
  quotedName: string;
  rowEstimate: number;
  totalBytes: number;
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

export default function DatabaseMaintenancePanel() {
  const { data, isLoading, error, refetch, isRefetching } = api.admin.listDatabaseTables.useQuery(
    undefined,
    { refetchOnWindowFocus: false }
  );
  const truncateMutation = api.admin.truncateTable.useMutation();

  const [search, setSearch] = useState("");
  const [confirmTable, setConfirmTable] = useState<string | null>(null);
  const [processingTable, setProcessingTable] = useState<string | null>(null);
  const confirmTargetRef = useRef<string | null>(null);

  useEffect(() => {
    if (error) {
      toast.error(error.message || "Failed to load tables");
    }
  }, [error]);

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
                  const busy = processingTable === table.name || truncateMutation.isLoading;
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
        confirmText={processingTable ? "Working..." : "Yes, truncate it"}
        cancelText="Cancel"
        onConfirm={handleTruncate}
        onClose={() => {
          if (processingTable) return;
          setConfirmTable(null);
        }}
      />
    </div>
  );
}
