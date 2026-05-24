"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import { FiArrowLeft, FiBookOpen, FiLoader, FiPauseCircle, FiShield, FiTrash2 } from "react-icons/fi";
import { api } from "@/client/trpc";
import PluginStatusBadge from "@/components/admin/plugins/PluginStatusBadge";
import PluginValidationReport from "@/components/admin/plugins/PluginValidationReport";
import PluginCapabilityReview from "@/components/admin/plugins/PluginCapabilityReview";
import PluginSettingsForm from "@/components/admin/plugins/PluginSettingsForm";
import PluginSecretRefsForm from "@/components/admin/plugins/PluginSecretRefsForm";
import PluginHealthPanel from "@/components/admin/plugins/PluginHealthPanel";
import PluginEventTimeline from "@/components/admin/plugins/PluginEventTimeline";
import PluginPageShell from "@/components/admin/plugins/PluginPageShell";
import PluginPageRenderer from "@/components/admin/plugins/PluginPageRenderer";
import type { PluginPageSchema } from "@/types/plugin-page-schema";

type DetailPageProps = {
  slug: string;
};

type PluginVersion = {
  id: string;
  version: string;
  validationPassed: boolean;
  validationErrors: unknown;
  readmeMarkdown?: string | null;
  changelogMarkdown?: string | null;
  createdAt: string | Date;
};

const EMPTY_PAGE_SCHEMA: PluginPageSchema = {
  title: "Plugin Preview",
  blocks: [],
};

function parsePluginPageSchema(snapshot: unknown): PluginPageSchema {
  if (!snapshot || typeof snapshot !== "object") return EMPTY_PAGE_SCHEMA;
  const candidate = snapshot as { title?: unknown; blocks?: unknown };
  const blocks = Array.isArray(candidate.blocks) ? candidate.blocks : [];
  return {
    title: typeof candidate.title === "string" ? candidate.title : "Plugin Preview",
    blocks: blocks.filter((block) => block && typeof block === "object") as PluginPageSchema["blocks"],
  };
}

export default function PluginDetailPage({ slug }: DetailPageProps) {
  const router = useRouter();
  const utils = api.useUtils();
  const [selectedVersionId, setSelectedVersionId] = useState<string>("");
  const [approvedCapabilities, setApprovedCapabilities] = useState<string[]>([]);
  const [rejectionReason, setRejectionReason] = useState("");

  const detailQuery = api.adminPlugins.getPluginById.useQuery({ slug });
  const detailErrorMessage = detailQuery.error?.message || "";
  const isAbortError = /aborted|abort/i.test(detailErrorMessage);

  useEffect(() => {
    if (detailQuery.error?.message && !isAbortError) {
      toast.error(detailQuery.error.message);
    }
  }, [detailQuery.error?.message, isAbortError]);

  const plugin = detailQuery.data as any;
  const versions = (plugin?.versions ?? []) as PluginVersion[];

  const readinessQuery = api.adminPlugins.getPluginOperationalReadiness.useQuery(
    {
      pluginRegistryId: plugin?.id ?? "",
    },
    {
      enabled: Boolean(plugin?.id),
    },
  );

  useEffect(() => {
    if (!plugin) return;
    setApprovedCapabilities(Array.isArray(plugin.approvedCapabilities) ? plugin.approvedCapabilities : []);

    const preferredVersionId = plugin.latestVersion?.id ?? plugin.installedVersion?.id ?? plugin.versions?.[0]?.id ?? "";
    setSelectedVersionId(preferredVersionId);
  }, [plugin]);

  const selectedVersion = useMemo(
    () => versions.find((version) => version.id === selectedVersionId) ?? versions[0] ?? null,
    [selectedVersionId, versions],
  );

  const refresh = async () => {
    await detailQuery.refetch();
    await utils.adminPlugins.listPlugins.invalidate();
  };

  const pluginActionIdentity = {
    pluginRegistryId: plugin?.id,
    pluginSlug: plugin?.slug,
    pluginId: plugin?.pluginId,
    pluginVersionId: selectedVersion?.id ?? plugin?.installedVersion?.id ?? undefined,
  };

  const installMutation = api.adminPlugins.installPluginVersion.useMutation({
    onSuccess: async () => {
      toast.success("Plugin version installed");
      await refresh();
    },
    onError: (error) => toast.error(error.message || "Install failed"),
  });

  const rejectMutation = api.adminPlugins.rejectPluginVersion.useMutation({
    onSuccess: async () => {
      toast.success("Plugin version rejected");
      setRejectionReason("");
      await refresh();
    },
    onError: (error) => toast.error(error.message || "Rejection failed"),
  });

  const updateSettingsMutation = api.adminPlugins.updatePluginSettings.useMutation({
    onSuccess: async () => {
      toast.success("Plugin settings updated");
      await refresh();
    },
    onError: (error) => toast.error(error.message || "Settings update failed"),
  });

  const disableMutation = api.adminPlugins.disablePlugin.useMutation({
    onSuccess: async () => {
      toast.success("Plugin disabled");
      await refresh();
    },
    onError: (error) => toast.error(error.message || "Disable failed"),
  });

  const uninstallMutation = api.adminPlugins.uninstallPlugin.useMutation({
    onSuccess: async (result) => {
      toast.success(result.uninstalled ? "Plugin uninstalled" : "Plugin is already not installed");
      await refresh();
    },
    onError: (error) => toast.error(error.message || "Uninstall failed"),
  });

  const removeMutation = api.adminPlugins.removePlugin.useMutation({
    onSuccess: async () => {
      toast.success("Plugin removed");
      await utils.adminPlugins.listPlugins.invalidate();
      router.push("/admin/plugins");
    },
    onError: (error) => toast.error(error.message || "Remove failed"),
  });

  const install = async () => {
    if (!plugin || !selectedVersion) {
      toast.error("No plugin version selected");
      return;
    }

    await installMutation.mutateAsync({
      ...pluginActionIdentity,
      pluginVersionId: selectedVersion.id,
      approvedCapabilities,
    });
  };

  const reject = async () => {
    if (!plugin || !selectedVersion) {
      toast.error("No plugin version selected");
      return;
    }

    if (!rejectionReason.trim().length) {
      toast.error("Provide a rejection reason");
      return;
    }

    await rejectMutation.mutateAsync({
      ...pluginActionIdentity,
      pluginVersionId: selectedVersion.id,
      reason: rejectionReason.trim(),
    });
  };

  const isInstalling = installMutation.status === "pending";
  const isRejecting = rejectMutation.status === "pending";
  const isDisabling = disableMutation.status === "pending";
  const isUninstalling = uninstallMutation.status === "pending";
  const isRemoving = removeMutation.status === "pending";
  const isSavingSettings = updateSettingsMutation.status === "pending";
  const isAnyVersionActionPending = isInstalling || isRejecting || isDisabling || isUninstalling || isRemoving;
  const installedVersionId = plugin?.installedVersion?.id as string | undefined;
  const latestVersionId = plugin?.latestVersion?.id as string | undefined;
  const isSelectedVersionInstalled = Boolean(selectedVersion?.id && installedVersionId === selectedVersion.id);
  const isPluginInstalled = Boolean(installedVersionId);
  const hasUpdateAvailable = Boolean(isPluginInstalled && latestVersionId && installedVersionId !== latestVersionId);
  const isSelectedVersionLatest = Boolean(selectedVersion?.id && selectedVersion.id === latestVersionId);
  const installButtonLabel = isInstalling
    ? "Installing..."
    : isSelectedVersionInstalled
      ? "Installed"
      : isPluginInstalled && isSelectedVersionLatest
        ? "Install Update"
        : "Install Version";
  const currentActionLabel = isInstalling
    ? "Installing selected version"
    : isRejecting
      ? "Rejecting selected version"
      : isDisabling
        ? "Disabling plugin"
        : isUninstalling
          ? "Uninstalling plugin"
          : isRemoving
            ? "Removing plugin"
            : null;
  const declarativePageSchema = parsePluginPageSchema(plugin?.pageSchemaSnapshot);

  if (detailQuery.isLoading && !plugin) {
    return <div className="rounded-2xl border border-border bg-card/70 p-6 text-sm text-muted-foreground">Loading plugin details...</div>;
  }

  if (!plugin && detailQuery.isError && !isAbortError) {
    return (
      <div className="rounded-2xl border border-rose-300/50 bg-rose-50 px-5 py-6 text-sm text-rose-700 dark:border-rose-700/40 dark:bg-rose-900/20 dark:text-rose-300">
        <p className="font-semibold">Unable to load plugin detail</p>
        <p className="mt-1">{detailErrorMessage || "Plugin not found"}</p>
        <Link
          href="/admin/plugins"
          className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-rose-600 underline-offset-2 hover:underline dark:text-rose-400"
        >
          <FiArrowLeft className="h-3.5 w-3.5" />
          Back to plugin inventory
        </Link>
      </div>
    );
  }

  if (!plugin) {
    return (
      <div className="rounded-2xl border border-border bg-card/70 p-6 text-sm text-muted-foreground">
        Refreshing plugin details...
      </div>
    );
  }

  return (
    <div className="w-full space-y-6 overflow-x-hidden pb-10">
      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative w-full overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-card via-[hsl(var(--muted))] to-card p-6 shadow-xl shadow-black/5 dark:shadow-black/20"
      >
        <div className="absolute -top-24 right-[-4rem] h-48 w-48 rounded-full bg-gradient-to-br from-[hsl(var(--primary))/0.25] to-[hsl(var(--secondary))/0.2] blur-3xl" />
        <div className="relative space-y-4">
          <Link href="/admin/plugins" className="inline-flex items-center gap-1 text-xs font-semibold text-muted-foreground transition-colors hover:text-foreground">
            <FiArrowLeft className="h-3.5 w-3.5" />
            Back to plugins
          </Link>

          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h1 className="premium-gradient-text text-3xl font-bold">{plugin.name}</h1>
              <p className="mt-1 text-sm text-muted-foreground">{plugin.description}</p>
              <p className="mt-2 text-xs text-muted-foreground">
                {plugin.pluginId} · /{plugin.slug} · {plugin.category || "Uncategorized"}
              </p>
            </div>
            <PluginStatusBadge status={plugin.status} />
          </div>
        </div>
      </motion.section>

      <div className="grid w-full gap-6 2xl:grid-cols-12">
        <div className="min-w-0 space-y-6 2xl:col-span-8">
          <div className="rounded-2xl border border-border bg-card/70 p-5 shadow-lg shadow-black/5 backdrop-blur-sm dark:shadow-black/20">
            <div className="mb-3 flex items-center justify-between gap-3">
              <h3 className="text-base font-semibold text-foreground">Version Selection</h3>
              <span className="text-xs text-muted-foreground">{versions.length} version(s)</span>
            </div>

            <select
              value={selectedVersionId}
              onChange={(event) => setSelectedVersionId(event.target.value)}
              className="h-10 w-full rounded-xl border border-border bg-background px-3 text-sm text-foreground focus:border-[hsl(var(--primary))] focus:outline-none"
            >
              {versions.map((version) => (
                <option key={version.id} value={version.id}>
                  {version.version} {version.validationPassed ? "(validated)" : "(validation failed)"}
                </option>
              ))}
            </select>

            <div className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-5">
              <button
                type="button"
                onClick={install}
                aria-busy={isInstalling}
                disabled={isAnyVersionActionPending || !selectedVersion || isSelectedVersionInstalled}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[hsl(var(--primary))] to-[hsl(var(--secondary))] px-3 py-2 text-xs font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isInstalling ? <FiLoader className="h-3.5 w-3.5 animate-spin" /> : null}
                {installButtonLabel}
              </button>
              <button
                type="button"
                onClick={reject}
                aria-busy={isRejecting}
                disabled={isAnyVersionActionPending || !selectedVersion}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-rose-300/70 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700 dark:border-rose-700/60 dark:bg-rose-900/20 dark:text-rose-300 disabled:opacity-60"
              >
                {isRejecting ? <FiLoader className="h-3.5 w-3.5 animate-spin" /> : null}
                {isRejecting ? "Rejecting..." : "Reject Version"}
              </button>
              <button
                type="button"
                onClick={() => disableMutation.mutate({
                  ...pluginActionIdentity,
                  reason: "Disabled by admin",
                })}
                aria-busy={isDisabling}
                disabled={isAnyVersionActionPending}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-background px-3 py-2 text-xs font-semibold text-foreground disabled:opacity-60"
              >
                {isDisabling ? <FiLoader className="h-3.5 w-3.5 animate-spin" /> : <FiPauseCircle className="h-3.5 w-3.5" />}
                {isDisabling ? "Disabling..." : "Disable"}
              </button>
              <button
                type="button"
                onClick={() => uninstallMutation.mutate({
                  ...pluginActionIdentity,
                  reason: "Uninstalled by admin",
                })}
                aria-busy={isUninstalling}
                disabled={isAnyVersionActionPending || !plugin.installedVersion?.id}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-amber-300/70 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-700 dark:border-amber-700/60 dark:bg-amber-900/20 dark:text-amber-300 disabled:opacity-60"
              >
                {isUninstalling ? <FiLoader className="h-3.5 w-3.5 animate-spin" /> : <FiPauseCircle className="h-3.5 w-3.5" />}
                {isUninstalling ? "Uninstalling..." : "Uninstall"}
              </button>
              <button
                type="button"
                onClick={() => removeMutation.mutate({
                  ...pluginActionIdentity,
                  reason: "Removed by admin",
                })}
                aria-busy={isRemoving}
                disabled={isAnyVersionActionPending}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-red-300/70 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700 dark:border-red-700/60 dark:bg-red-900/20 dark:text-red-300 disabled:opacity-60"
              >
                {isRemoving ? <FiLoader className="h-3.5 w-3.5 animate-spin" /> : <FiTrash2 className="h-3.5 w-3.5" />}
                {isRemoving ? "Removing..." : "Remove"}
              </button>
            </div>

            <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border bg-background/40 px-3 py-2 text-[11px] text-muted-foreground">
              <span>
                Installed version: <span className="font-semibold text-foreground">{plugin.installedVersion?.version || "None"}</span>
              </span>
              <span>
                {currentActionLabel ? (
                  <span className="inline-flex items-center gap-1 font-semibold text-foreground">
                    <FiLoader className="h-3.5 w-3.5 animate-spin" />
                    {currentActionLabel}
                  </span>
                ) : isPluginInstalled ? (
                  "Version controls are ready."
                ) : (
                  "Plugin is not currently installed."
                )}
              </span>
            </div>

            <textarea
              value={rejectionReason}
              onChange={(event) => setRejectionReason(event.target.value)}
              rows={2}
              placeholder="Reason for rejection"
              className="mt-3 w-full rounded-xl border border-border bg-background px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:border-[hsl(var(--primary))] focus:outline-none"
            />

            {hasUpdateAvailable ? (
              <p className="mt-2 text-xs text-amber-700 dark:text-amber-300">
                New plugin update available. Select the latest version and click Install Update.
              </p>
            ) : null}
          </div>

          <div className="rounded-2xl border border-border bg-card/70 p-5 shadow-lg shadow-black/5 backdrop-blur-sm dark:shadow-black/20">
            <h3 className="mb-2 flex items-center gap-2 text-base font-semibold text-foreground">
              <FiBookOpen className="h-4 w-4 text-[hsl(var(--primary))]" />
              Plugin Guide
            </h3>
            <p className="text-sm text-muted-foreground">{plugin.description}</p>

            <div className="mt-3 grid gap-2 text-xs sm:grid-cols-3">
              <div className="rounded-lg border border-border bg-background/40 px-3 py-2">
                <p className="font-semibold text-foreground">How it works</p>
                <p className="mt-1 text-muted-foreground">This plugin is declarative and host-rendered. It cannot run arbitrary code in phase one.</p>
              </div>
              <div className="rounded-lg border border-border bg-background/40 px-3 py-2">
                <p className="font-semibold text-foreground">What to expect</p>
                <p className="mt-1 text-muted-foreground">Upload creates/updates versions, install sets active version, and settings/secrets control readiness.</p>
              </div>
              <div className="rounded-lg border border-border bg-background/40 px-3 py-2">
                <p className="font-semibold text-foreground">Version updates</p>
                <p className="mt-1 text-muted-foreground">Uploading a new version changes Latest only. The live installed version stays put until an admin selects the new release and installs it.</p>
              </div>
            </div>

            <div className="mt-3 text-xs text-muted-foreground">
              <p>Support URL: {plugin.manifestSnapshot?.support?.url || "Not provided"}</p>
              <p>Support Email: {plugin.manifestSnapshot?.support?.email || "Not provided"}</p>
              <p>Author: {plugin.manifestSnapshot?.author?.name || "Unknown"}</p>
            </div>
          </div>

          <PluginPageShell
            title="Declarative Page Preview"
            description="Host-owned renderer preview of approved declarative blocks. Unsupported blocks fail closed."
          >
            <PluginPageRenderer schema={declarativePageSchema} />
          </PluginPageShell>

          <PluginSettingsForm
            settings={Array.isArray(plugin.settings) ? plugin.settings : []}
            configSchema={plugin.configSchemaSnapshot as any}
            isSaving={isSavingSettings}
            onSubmit={async (values) => {
              await updateSettingsMutation.mutateAsync({
                pluginRegistryId: plugin.id,
                values,
              });
            }}
          />

          <PluginSecretRefsForm
            isSaving={isSavingSettings}
            onApply={async (values) => {
              await updateSettingsMutation.mutateAsync({
                pluginRegistryId: plugin.id,
                values,
              });
            }}
          />
        </div>

        <div className="min-w-0 space-y-6 2xl:col-span-4">
          <div className="rounded-2xl border border-border bg-card/70 p-5 shadow-lg shadow-black/5 backdrop-blur-sm dark:shadow-black/20">
            <h3 className="mb-3 text-base font-semibold text-foreground">Operational Snapshot</h3>
            <div className="grid gap-2 text-xs sm:grid-cols-2 md:grid-cols-1 lg:grid-cols-2">
              <div className="rounded-lg border border-border bg-background/40 px-3 py-2">
                <p className="text-muted-foreground">Status</p>
                <p className="mt-1 font-semibold text-foreground">{plugin.status}</p>
              </div>
              <div className="rounded-lg border border-border bg-background/40 px-3 py-2">
                <p className="text-muted-foreground">Selected Version</p>
                <p className="mt-1 font-semibold text-foreground">{selectedVersion?.version || "-"}</p>
              </div>
              <div className="rounded-lg border border-border bg-background/40 px-3 py-2">
                <p className="text-muted-foreground">Installed Version</p>
                <p className="mt-1 font-semibold text-foreground">{plugin.installedVersion?.version || "-"}</p>
              </div>
              <div className="rounded-lg border border-border bg-background/40 px-3 py-2">
                <p className="text-muted-foreground">Latest Version</p>
                <p className="mt-1 font-semibold text-foreground">{plugin.latestVersion?.version || "-"}</p>
              </div>
              <div className="rounded-lg border border-border bg-background/40 px-3 py-2">
                <p className="text-muted-foreground">Update Available</p>
                <p className="mt-1 font-semibold text-foreground">{hasUpdateAvailable ? "Yes" : "No"}</p>
              </div>
              <div className="rounded-lg border border-border bg-background/40 px-3 py-2">
                <p className="text-muted-foreground">Capabilities</p>
                <p className="mt-1 font-semibold text-foreground">{Array.isArray(plugin.requestedCapabilities) ? plugin.requestedCapabilities.length : 0}</p>
              </div>
              <div className="rounded-lg border border-border bg-background/40 px-3 py-2">
                <p className="text-muted-foreground">Timeline Events</p>
                <p className="mt-1 font-semibold text-foreground">{(readinessQuery.data?.events ?? plugin.eventTimeline?.events ?? []).length}</p>
              </div>
            </div>
          </div>

          <PluginValidationReport
            passed={Boolean(selectedVersion?.validationPassed)}
            validationErrors={selectedVersion?.validationErrors}
          />

          {readinessQuery.data ? (
            <PluginHealthPanel
              health={readinessQuery.data.health}
              readiness={readinessQuery.data.readiness}
            />
          ) : readinessQuery.isLoading ? (
            <div className="rounded-2xl border border-border bg-card/70 p-5 text-xs text-muted-foreground">Loading readiness and health...</div>
          ) : null}

          <PluginCapabilityReview
            requestedCapabilities={Array.isArray(plugin.requestedCapabilities) ? plugin.requestedCapabilities : []}
            approvedCapabilities={approvedCapabilities}
            onChange={setApprovedCapabilities}
            disabled={isInstalling}
          />

          <div className="rounded-2xl border border-border bg-card/70 p-5 shadow-lg shadow-black/5 backdrop-blur-sm dark:shadow-black/20">
            <h3 className="mb-3 flex items-center gap-2 text-base font-semibold text-foreground">
              <FiShield className="h-4 w-4 text-[hsl(var(--primary))]" />
              Capability Grants
            </h3>
            <div className="space-y-2 text-xs">
              {(plugin.permissionGrants ?? []).length ? (
                (plugin.permissionGrants as any[]).map((grant) => (
                  <div key={grant.id} className="rounded-lg border border-border bg-background/40 px-3 py-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-medium text-foreground">{grant.capability}</span>
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${grant.approved ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/35 dark:text-emerald-300" : "bg-zinc-100 text-zinc-700 dark:bg-zinc-900/35 dark:text-zinc-300"}`}>
                        {grant.approved ? "Approved" : "Pending"}
                      </span>
                    </div>
                    <p className="mt-1 text-muted-foreground">Risk: {grant.riskLevel}</p>
                  </div>
                ))
              ) : (
                <p className="text-muted-foreground">No persisted grants yet.</p>
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card/70 p-5 shadow-lg shadow-black/5 backdrop-blur-sm dark:shadow-black/20">
            <h3 className="mb-3 text-base font-semibold text-foreground">Version History</h3>
            <div className="space-y-2 text-xs">
              {versions.length ? versions.map((version) => {
                const isInstalled = plugin.installedVersion?.id === version.id;
                const isLatest = plugin.latestVersion?.id === version.id;
                return (
                  <div key={version.id} className="rounded-lg border border-border bg-background/40 px-3 py-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-semibold text-foreground">v{version.version}</span>
                      <div className="flex items-center gap-1">
                        {isInstalled ? <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 dark:bg-emerald-900/35 dark:text-emerald-300">Installed</span> : null}
                        {isLatest ? <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-semibold text-blue-700 dark:bg-blue-900/35 dark:text-blue-300">Latest</span> : null}
                      </div>
                    </div>
                    <p className="mt-1 text-muted-foreground">Created {new Date(version.createdAt).toLocaleString()}</p>
                  </div>
                );
              }) : <p className="text-muted-foreground">No version records found.</p>}
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card/70 p-5 shadow-lg shadow-black/5 backdrop-blur-sm dark:shadow-black/20">
            <h3 className="mb-3 text-base font-semibold text-foreground">Selected Version Notes</h3>
            {selectedVersion?.changelogMarkdown || selectedVersion?.readmeMarkdown ? (
              <div className="space-y-3 text-xs text-foreground">
                {selectedVersion?.changelogMarkdown ? (
                  <div>
                    <p className="mb-1 font-semibold text-foreground">Changelog</p>
                    <pre className="max-h-40 min-w-0 overflow-auto whitespace-pre-wrap break-words rounded-lg border border-border bg-background/40 p-3 text-xs text-muted-foreground">{selectedVersion.changelogMarkdown}</pre>
                  </div>
                ) : null}
                {selectedVersion?.readmeMarkdown ? (
                  <div>
                    <p className="mb-1 font-semibold text-foreground">Readme</p>
                    <pre className="max-h-40 min-w-0 overflow-auto whitespace-pre-wrap break-words rounded-lg border border-border bg-background/40 p-3 text-xs text-muted-foreground">{selectedVersion.readmeMarkdown}</pre>
                  </div>
                ) : null}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">No readme/changelog provided for this version.</p>
            )}
          </div>

          <PluginEventTimeline
            isLoading={readinessQuery.isLoading}
            events={(readinessQuery.data?.events ?? plugin.eventTimeline?.events ?? []) as any[]}
          />
        </div>
      </div>
    </div>
  );
}
