"use client";

import React, { useState } from "react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { FiArrowRight, FiLoader, FiPackage, FiTrash2 } from "react-icons/fi";
import toast from "react-hot-toast";
import PluginStatusBadge from "@/components/admin/plugins/PluginStatusBadge";
import { api } from "@/client/trpc";

type PluginRow = {
  id: string;
  slug: string;
  pluginId: string;
  name: string;
  category: string;
  status:
    | "DRAFT"
    | "VALIDATED"
    | "REJECTED"
    | "INSTALLED"
    | "CONFIG_REQUIRED"
    | "DISABLED"
    | "ENABLED"
    | "ERROR"
    | "REMOVED";
  approvedCapabilities: unknown;
  installedVersion?: { version: string } | null;
  latestVersion?: { version: string } | null;
  updatedAt: string | Date;
};

export default function PluginInventoryTable({
  plugins,
  isBusy,
}: {
  plugins: PluginRow[];
  isBusy?: boolean;
}) {
  const [removingPluginId, setRemovingPluginId] = useState<string | null>(null);
  const [openingPluginId, setOpeningPluginId] = useState<string | null>(null);

  const utils = api.useUtils();
  const removeMutation = api.adminPlugins.removePlugin.useMutation({
    onSuccess: async () => {
      toast.success("Plugin removed");
      setRemovingPluginId(null);
      await utils.adminPlugins.listPlugins.invalidate();
    },
    onError: (error) => {
      setRemovingPluginId(null);
      toast.error(error.message || "Remove failed");
    },
  });

  if (!plugins.length) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-card/50 p-12 text-center">
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-[hsl(var(--muted))]">
          <FiPackage className="h-6 w-6 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold text-foreground">No plugins found</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          Adjust search and filters, or upload a new plugin package to begin onboarding.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card/70 shadow-lg shadow-black/5 backdrop-blur-sm dark:shadow-black/20">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-border">
          <thead className="bg-[hsl(var(--muted))/0.45]">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">Plugin</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">Status</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">Category</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">Versions</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">Capabilities</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">Updated</th>
              <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-muted-foreground">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60">
            {plugins.map((plugin) => {
              const approvedCapabilities = Array.isArray(plugin.approvedCapabilities)
                ? plugin.approvedCapabilities.length
                : 0;
              const isOpeningCurrent = openingPluginId === plugin.id;
              const isAnyOpening = openingPluginId !== null;

              return (
                <tr key={plugin.id} className="transition-colors hover:bg-[hsl(var(--muted))/0.4]">
                  <td className="px-4 py-4 align-top">
                    <div className="font-semibold text-foreground">{plugin.name}</div>
                    <div className="text-xs text-muted-foreground">{plugin.pluginId}</div>
                    <div className="text-xs text-muted-foreground">/{plugin.slug}</div>
                  </td>
                  <td className="px-4 py-4 align-top">
                    <PluginStatusBadge status={plugin.status} />
                  </td>
                  <td className="px-4 py-4 align-top text-sm text-foreground">{plugin.category || "Uncategorized"}</td>
                  <td className="px-4 py-4 align-top text-sm text-muted-foreground">
                    <div>Installed: {plugin.installedVersion?.version ?? "-"}</div>
                    <div>Latest: {plugin.latestVersion?.version ?? "-"}</div>
                  </td>
                  <td className="px-4 py-4 align-top text-sm text-foreground">{approvedCapabilities}</td>
                  <td className="px-4 py-4 align-top text-sm text-muted-foreground">
                    {formatDistanceToNow(new Date(plugin.updatedAt), { addSuffix: true })}
                  </td>
                  <td className="px-4 py-4 align-top text-right">
                    <div className="inline-flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          removeMutation.mutate({
                            pluginRegistryId: plugin.id,
                            reason: "Removed from plugin inventory",
                          });
                          setRemovingPluginId(plugin.id);
                        }}
                        disabled={removeMutation.status === "pending"}
                        className="inline-flex items-center gap-1 rounded-lg border border-red-300/70 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700 transition-colors hover:bg-red-100 dark:border-red-700/60 dark:bg-red-900/20 dark:text-red-300 dark:hover:bg-red-900/30 disabled:cursor-not-allowed disabled:opacity-60"
                        title="Remove plugin"
                      >
                        <FiTrash2 className="h-3.5 w-3.5" />
                        {removeMutation.status === "pending" && removingPluginId === plugin.id ? "Removing..." : "Delete"}
                      </button>

                      <Link
                        href={`/admin/plugins/${plugin.slug}`}
                        onClick={(event) => {
                          if (isAnyOpening && !isOpeningCurrent) {
                            event.preventDefault();
                            return;
                          }
                          setOpeningPluginId(plugin.id);
                        }}
                        aria-busy={isOpeningCurrent}
                        className={`inline-flex items-center gap-1 rounded-lg border border-border bg-background/60 px-3 py-2 text-xs font-semibold text-foreground transition-colors hover:bg-background ${isAnyOpening ? "pointer-events-none opacity-70" : ""}`}
                      >
                        {isOpeningCurrent ? (
                          <>
                            Opening
                            <FiLoader className="h-3.5 w-3.5 animate-spin" />
                          </>
                        ) : (
                          <>
                            Open
                            <FiArrowRight className="h-3.5 w-3.5" />
                          </>
                        )}
                      </Link>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {isBusy ? (
        <div className="border-t border-border px-4 py-3 text-xs text-muted-foreground">Refreshing plugin inventory...</div>
      ) : null}
    </div>
  );
}
