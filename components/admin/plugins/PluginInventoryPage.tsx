"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { FiFilter, FiRefreshCw, FiSearch } from "react-icons/fi";
import toast from "react-hot-toast";
import { api } from "@/client/trpc";
import PluginInventoryTable from "@/components/admin/plugins/PluginInventoryTable";
import PluginUploadPanel from "@/components/admin/plugins/PluginUploadPanel";

const STATUS_OPTIONS = [
  "ALL",
  "DRAFT",
  "VALIDATED",
  "REJECTED",
  "INSTALLED",
  "CONFIG_REQUIRED",
  "DISABLED",
  "ENABLED",
  "ERROR",
  "REMOVED",
] as const;

type StatusFilter = (typeof STATUS_OPTIONS)[number];

export default function PluginInventoryPage() {
  const [status, setStatus] = useState<StatusFilter>("ALL");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const queryInput = useMemo(
    () => ({
      page,
      perPage: 20,
      search: search.trim() || undefined,
      status: status === "ALL" ? undefined : status,
    }),
    [page, search, status],
  );

  const inventoryQuery = api.adminPlugins.listPlugins.useQuery(queryInput, {
    retry: 2,
    refetchOnWindowFocus: false,
  });

  const inventoryErrorMessage = inventoryQuery.error?.message || "";
  const isAbortError = /aborted|abort/i.test(inventoryErrorMessage);

  useEffect(() => {
    if (inventoryErrorMessage && !isAbortError) {
      toast.error(inventoryErrorMessage);
    }
  }, [inventoryErrorMessage, isAbortError]);

  const plugins = inventoryQuery.data?.plugins ?? [];

  return (
    <div className="space-y-6 pb-10">
      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-card via-[hsl(var(--muted))] to-card p-6 shadow-xl shadow-black/5 dark:shadow-black/20"
      >
        <div className="absolute -top-24 right-[-4rem] h-48 w-48 rounded-full bg-gradient-to-br from-[hsl(var(--primary))/0.25] to-[hsl(var(--secondary))/0.2] blur-3xl" />
        <div className="relative flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="premium-gradient-text text-3xl font-bold">Plugin Management</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Review inventory, monitor validation state, and drive controlled plugin lifecycle operations.
            </p>
          </div>
          <button
            type="button"
            onClick={() => inventoryQuery.refetch()}
            className="inline-flex items-center gap-2 self-start rounded-xl border border-border bg-background/60 px-4 py-2 text-sm font-semibold text-foreground transition-colors hover:bg-background"
          >
            <FiRefreshCw className="h-4 w-4" />
            Refresh
          </button>
        </div>
      </motion.section>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-border bg-card/70 p-4">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Total</p>
          <p className="mt-1 text-2xl font-bold text-foreground">{inventoryQuery.data?.total ?? 0}</p>
        </div>
        <div className="rounded-2xl border border-border bg-card/70 p-4">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Page</p>
          <p className="mt-1 text-2xl font-bold text-foreground">{inventoryQuery.data?.page ?? page}</p>
        </div>
        <div className="rounded-2xl border border-border bg-card/70 p-4">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Status Filter</p>
          <p className="mt-1 text-2xl font-bold text-foreground">{status}</p>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[2fr_1fr]">
        <div className="space-y-4">
          <div className="rounded-2xl border border-border bg-card/70 p-4">
            <div className="grid gap-3 md:grid-cols-[1fr_200px_auto]">
              <label className="relative block">
                <FiSearch className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  value={search}
                  onChange={(event) => {
                    setSearch(event.target.value);
                    setPage(1);
                  }}
                  placeholder="Search by name, pluginId, or slug"
                  className="h-10 w-full rounded-xl border border-border bg-background pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-[hsl(var(--primary))] focus:outline-none"
                />
              </label>

              <label className="relative block">
                <FiFilter className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <select
                  value={status}
                  onChange={(event) => {
                    setStatus(event.target.value as StatusFilter);
                    setPage(1);
                  }}
                  className="h-10 w-full appearance-none rounded-xl border border-border bg-background pl-9 pr-3 text-sm text-foreground focus:border-[hsl(var(--primary))] focus:outline-none"
                >
                  {STATUS_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </label>

              <button
                type="button"
                onClick={() => {
                  setSearch("");
                  setStatus("ALL");
                  setPage(1);
                }}
                className="h-10 rounded-xl border border-border bg-background px-3 text-sm font-semibold text-foreground transition-colors hover:bg-[hsl(var(--muted))]"
              >
                Reset
              </button>
            </div>
          </div>

          {inventoryQuery.isError && !isAbortError ? (
            <div className="rounded-2xl border border-rose-300/50 bg-rose-50 px-4 py-5 text-sm text-rose-700 dark:border-rose-700/40 dark:bg-rose-900/20 dark:text-rose-300">
              <p className="font-semibold">Unable to load plugin inventory</p>
              <p className="mt-1">{inventoryQuery.error.message}</p>
            </div>
          ) : inventoryQuery.isError && isAbortError ? (
            <div className="rounded-2xl border border-border bg-card/70 p-6 text-sm text-muted-foreground">
              Refreshing plugin inventory...
            </div>
          ) : inventoryQuery.isLoading ? (
            <div className="rounded-2xl border border-border bg-card/70 p-6 text-sm text-muted-foreground">Loading plugin inventory...</div>
          ) : (
            <PluginInventoryTable plugins={plugins as any[]} isBusy={inventoryQuery.isFetching} />
          )}

          <div className="flex items-center justify-between rounded-2xl border border-border bg-card/70 p-3">
            <p className="text-xs text-muted-foreground">
              Page {inventoryQuery.data?.page ?? page} of {inventoryQuery.data?.totalPages ?? 1}
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setPage((current) => Math.max(1, current - 1))}
                disabled={page <= 1}
                className="rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-semibold text-foreground transition-colors hover:bg-[hsl(var(--muted))] disabled:opacity-50"
              >
                Prev
              </button>
              <button
                type="button"
                onClick={() => {
                  const max = inventoryQuery.data?.totalPages ?? page;
                  setPage((current) => (current >= max ? current : current + 1));
                }}
                disabled={page >= (inventoryQuery.data?.totalPages ?? 1)}
                className="rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-semibold text-foreground transition-colors hover:bg-[hsl(var(--muted))] disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        </div>

        <PluginUploadPanel onUploaded={() => inventoryQuery.refetch()} />
      </div>
    </div>
  );
}
