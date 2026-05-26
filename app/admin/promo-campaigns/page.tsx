// @ts-nocheck
"use client";

import { useState } from "react";
import {
  Gift,
  Plus,
  ToggleLeft,
  ToggleRight,
  Trash2,
  Users,
  Download,
  Eye,
  X,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  CheckCircle,
  Clock,
  TrendingDown,
} from "lucide-react";
import toast from "react-hot-toast";
import { api } from "@/client/trpc";
import { Button } from "@/components/ui/button";

interface Campaign {
  id: string;
  name: string;
  type: string;
  quota: number;
  usedCount: number;
  isActive: boolean;
  targetPackageId: string | null;
  startDate: string | null;
  endDate: string | null;
  notes: string | null;
  createdAt: string;
}

interface Claim {
  id: string;
  claimedAt: string;
  packageId: string;
  User: {
    id: string;
    name: string;
    email: string;
    phone: string | null;
    createdAt: string;
    membershipExpiresAt: string | null;
  };
}

export default function PromoCampaignsAdminPage() {
  const { data: campaigns = [], refetch } =
    api.promoCampaign.adminListCampaigns.useQuery();
  const { data: packages = [] } = api.package.getPackages.useQuery();

  const createMutation = api.promoCampaign.adminCreateCampaign.useMutation();
  const toggleMutation = api.promoCampaign.adminToggleActive.useMutation();
  const deleteMutation = api.promoCampaign.adminDeleteCampaign.useMutation();

  const [showCreate, setShowCreate] = useState(false);
  const [selectedCampaignId, setSelectedCampaignId] = useState<string | null>(
    null,
  );
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const { data: claimsData = [], isLoading: claimsLoading } =
    api.promoCampaign.adminGetClaims.useQuery(
      { campaignId: selectedCampaignId! },
      { enabled: !!selectedCampaignId },
    );

  // ── Create form state ────────────────────────────────────────────────────
  const [form, setForm] = useState({
    name: "",
    quota: 100,
    targetPackageId: "",
    startDate: "",
    endDate: "",
    notes: "",
  });

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    const tid = toast.loading("Creating campaign…");
    try {
      await createMutation.mutateAsync({
        name: form.name,
        quota: form.quota,
        targetPackageId: form.targetPackageId || undefined,
        startDate: form.startDate || undefined,
        endDate: form.endDate || undefined,
        notes: form.notes || undefined,
      });
      toast.success("Campaign created", { id: tid });
      setShowCreate(false);
      setForm({
        name: "",
        quota: 100,
        targetPackageId: "",
        startDate: "",
        endDate: "",
        notes: "",
      });
      refetch();
    } catch (err: any) {
      toast.error(err.message || "Failed to create campaign", { id: tid });
    }
  }

  async function handleToggle(id: string, current: boolean) {
    const tid = toast.loading(current ? "Deactivating…" : "Activating…");
    try {
      await toggleMutation.mutateAsync({ id, isActive: !current });
      toast.success(current ? "Campaign deactivated" : "Campaign activated", {
        id: tid,
      });
      refetch();
    } catch (err: any) {
      toast.error(err.message || "Toggle failed", { id: tid });
    }
  }

  async function handleDelete(id: string) {
    const tid = toast.loading("Deleting campaign…");
    try {
      await deleteMutation.mutateAsync({ id });
      toast.success("Campaign deleted", { id: tid });
      refetch();
    } catch (err: any) {
      toast.error(err.message || "Delete failed", { id: tid });
    }
  }

  function exportClaims(camId: string, camName: string) {
    if (claimsData.length === 0) return;
    const header = "Name,Email,Phone,Claimed At,Expires At";
    const rows = claimsData.map((c: Claim) =>
      [
        `"${c.User.name}"`,
        `"${c.User.email}"`,
        `"${c.User.phone ?? ""}"`,
        `"${new Date(c.claimedAt).toLocaleString()}"`,
        `"${c.User.membershipExpiresAt ? new Date(c.User.membershipExpiresAt).toLocaleString() : "N/A"}"`,
      ].join(","),
    );
    const csv = [header, ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `promo-claims-${camName.replace(/\s+/g, "-")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function toggleExpand(id: string) {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  // ── Derived stats ─────────────────────────────────────────────────────────
  const totalQuota = campaigns.reduce((s: number, c: Campaign) => s + c.quota, 0);
  const totalUsed = campaigns.reduce(
    (s: number, c: Campaign) => s + c.usedCount,
    0,
  );
  const activeCampaigns = campaigns.filter((c: Campaign) => c.isActive).length;
  const quotaLeft = totalQuota - totalUsed;

  return (
    <div className="min-h-screen">
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full border border-green-500/30 bg-green-100 dark:bg-green-900/30">
            <Gift className="h-5 w-5 text-green-600 dark:text-green-400" />
          </div>
          <div>
            <h1 className="premium-gradient-text text-2xl font-bold">Promo Campaigns</h1>
            <p className="text-sm text-muted-foreground">
              Revenue-isolated free membership activations
            </p>
          </div>
        </div>
        <Button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 rounded-lg bg-green-700 px-4 py-2 text-sm font-medium text-white hover:bg-green-600"
        >
          <Plus className="h-4 w-4" /> New Campaign
        </Button>
      </div>

      <div className="space-y-6">
        {/* ── Summary stats ────────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {[
            {
              label: "Total Campaigns",
              value: campaigns.length,
              icon: Gift,
              iconBg: "bg-blue-100 dark:bg-blue-900/30",
              iconColor: "text-blue-600 dark:text-blue-400",
              valColor: "text-blue-600 dark:text-blue-400",
            },
            {
              label: "Active Campaigns",
              value: activeCampaigns,
              icon: CheckCircle,
              iconBg: "bg-green-100 dark:bg-green-900/30",
              iconColor: "text-green-600 dark:text-green-400",
              valColor: "text-green-600 dark:text-green-400",
            },
            {
              label: "Total Quota",
              value: totalQuota.toLocaleString(),
              icon: Users,
              iconBg: "bg-purple-100 dark:bg-purple-900/30",
              iconColor: "text-purple-600 dark:text-purple-400",
              valColor: "text-purple-600 dark:text-purple-400",
            },
            {
              label: "Claims Used",
              value: totalUsed.toLocaleString(),
              icon: Clock,
              iconBg: "bg-amber-100 dark:bg-amber-900/30",
              iconColor: "text-amber-600 dark:text-amber-400",
              valColor: "text-amber-600 dark:text-amber-400",
            },
            {
              label: "Quota Left",
              value: quotaLeft.toLocaleString(),
              icon: TrendingDown,
              iconBg: "bg-rose-100 dark:bg-rose-900/30",
              iconColor: "text-rose-600 dark:text-rose-400",
              valColor: quotaLeft === 0 ? "text-red-600 dark:text-red-400" : "text-rose-600 dark:text-rose-400",
            },
          ].map(({ label, value, icon: Icon, iconBg, iconColor, valColor }) => (
            <div
              key={label}
              className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800"
            >
              <div className="flex items-center gap-2">
                <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${iconBg}`}>
                  <Icon className={`h-4 w-4 ${iconColor}`} />
                </div>
                <span className="text-xs text-gray-500 dark:text-gray-400">{label}</span>
              </div>
              <p className={`mt-2 text-2xl font-bold ${valColor}`}>{value}</p>
            </div>
          ))}
        </div>

        {/* ── Campaign list ─────────────────────────────────────────────────── */}
        {campaigns.length === 0 ? (
          <div className="rounded-xl border border-gray-200 bg-white py-16 text-center dark:border-gray-700 dark:bg-gray-800">
            <Gift className="mx-auto mb-3 h-10 w-10 text-gray-300 dark:text-gray-600" />
            <p className="text-gray-500 dark:text-gray-400">No promo campaigns yet.</p>
            <Button
              onClick={() => setShowCreate(true)}
              className="mt-4 bg-green-700 text-white hover:bg-green-600"
            >
              Create your first campaign
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {campaigns.map((c: Campaign) => {
              const pct = Math.min(100, Math.round((c.usedCount / c.quota) * 100));
              const isExpanded = expandedIds.has(c.id);
              const isViewingClaims = selectedCampaignId === c.id;

              return (
                <div
                  key={c.id}
                  className="rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800"
                >
                  {/* Card header */}
                  <div className="flex items-center gap-4 p-4">
                    {/* Status dot */}
                    <div
                      className={`h-2.5 w-2.5 flex-shrink-0 rounded-full ${c.isActive ? "bg-green-500" : "bg-gray-300 dark:bg-gray-600"}`}
                    />

                    {/* Campaign info */}
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-semibold text-gray-900 dark:text-white">
                          {c.name}
                        </span>
                        {c.isActive && (
                          <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs text-green-700 dark:bg-green-900/50 dark:text-green-400">
                            Active
                          </span>
                        )}
                        {!c.isActive && (
                          <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-500 dark:bg-gray-700 dark:text-gray-400">
                            Inactive
                          </span>
                        )}
                      </div>
                      {/* Progress bar */}
                      <div className="mt-2 flex items-center gap-3">
                        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-700">
                          <div
                            className={`h-full rounded-full transition-all ${pct >= 100 ? "bg-red-500" : pct >= 80 ? "bg-amber-500" : "bg-green-500"}`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {c.usedCount.toLocaleString()} /{" "}
                          {c.quota.toLocaleString()} ({pct}%)
                        </span>
                      </div>
                      {/* Dates */}
                      {(c.startDate || c.endDate) && (
                        <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
                          {c.startDate
                            ? `From ${new Date(c.startDate).toLocaleDateString()}`
                            : ""}{" "}
                          {c.endDate
                            ? `→ ${new Date(c.endDate).toLocaleDateString()}`
                            : ""}
                        </p>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex flex-shrink-0 items-center gap-2">
                      <button
                        onClick={() => handleToggle(c.id, c.isActive)}
                        className="rounded-lg border border-gray-200 p-2 transition hover:border-green-400 hover:bg-green-50 dark:border-gray-600 dark:hover:border-green-500/50 dark:hover:bg-green-900/20"
                        title={c.isActive ? "Deactivate" : "Activate"}
                      >
                        {c.isActive ? (
                          <ToggleRight className="h-4 w-4 text-green-600 dark:text-green-400" />
                        ) : (
                          <ToggleLeft className="h-4 w-4 text-gray-400" />
                        )}
                      </button>

                      <button
                        onClick={() => {
                          setSelectedCampaignId(
                            isViewingClaims ? null : c.id,
                          );
                        }}
                        className="rounded-lg border border-gray-200 p-2 transition hover:border-blue-400 hover:bg-blue-50 dark:border-gray-600 dark:hover:border-blue-500/50 dark:hover:bg-blue-900/20"
                        title="View claims"
                      >
                        <Eye
                          className={`h-4 w-4 ${isViewingClaims ? "text-blue-600 dark:text-blue-400" : "text-gray-400"}`}
                        />
                      </button>

                      <button
                        onClick={() => handleDelete(c.id)}
                        className="rounded-lg border border-gray-200 p-2 transition hover:border-red-400 hover:bg-red-50 dark:border-gray-600 dark:hover:border-red-500/50 dark:hover:bg-red-900/20"
                        title="Delete (only if no claims)"
                      >
                        <Trash2 className="h-4 w-4 text-gray-400 hover:text-red-500" />
                      </button>

                      <button
                        onClick={() => toggleExpand(c.id)}
                        className="rounded-lg border border-gray-200 p-2 transition hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-700"
                      >
                        {isExpanded ? (
                          <ChevronUp className="h-4 w-4 text-gray-400" />
                        ) : (
                          <ChevronDown className="h-4 w-4 text-gray-400" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Expanded details */}
                  {isExpanded && (
                    <div className="border-t border-gray-100 px-4 py-3 dark:border-gray-700">
                      <dl className="grid grid-cols-2 gap-2 text-sm sm:grid-cols-3">
                        <div>
                          <dt className="text-gray-400 dark:text-gray-500">Campaign ID</dt>
                          <dd className="font-mono text-xs text-gray-600 dark:text-gray-300">
                            {c.id}
                          </dd>
                        </div>
                        <div>
                          <dt className="text-gray-400 dark:text-gray-500">Created</dt>
                          <dd className="text-gray-700 dark:text-gray-300">
                            {new Date(c.createdAt).toLocaleDateString()}
                          </dd>
                        </div>
                        <div>
                          <dt className="text-gray-400 dark:text-gray-500">Target Package</dt>
                          <dd className="text-gray-700 dark:text-gray-300">
                            {c.targetPackageId
                              ? packages.find(
                                  (p: any) => p.id === c.targetPackageId,
                                )?.name ?? c.targetPackageId
                              : "Any package"}
                          </dd>
                        </div>
                        {c.notes && (
                          <div className="col-span-full">
                            <dt className="text-gray-400 dark:text-gray-500">Notes</dt>
                            <dd className="text-gray-700 dark:text-gray-300">{c.notes}</dd>
                          </div>
                        )}
                      </dl>
                    </div>
                  )}

                  {/* Claims panel */}
                  {isViewingClaims && (
                    <div className="border-t border-gray-100 p-4 dark:border-gray-700">
                      <div className="mb-3 flex items-center justify-between">
                        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                          Claims ({claimsData.length})
                        </h3>
                        {claimsData.length > 0 && (
                          <button
                            onClick={() => exportClaims(c.id, c.name)}
                            className="flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-400 dark:hover:bg-gray-700"
                          >
                            <Download className="h-3.5 w-3.5" /> Export CSV
                          </button>
                        )}
                      </div>

                      {claimsLoading ? (
                        <p className="text-sm text-gray-400">Loading…</p>
                      ) : claimsData.length === 0 ? (
                        <p className="text-sm text-gray-400">No claims yet.</p>
                      ) : (
                        <div className="max-h-64 overflow-y-auto rounded-lg border border-gray-200 dark:border-gray-700">
                          <table className="w-full text-xs">
                            <thead className="border-b border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-700/50">
                              <tr>
                                <th className="px-3 py-2 text-left text-gray-500 dark:text-gray-400">
                                  User
                                </th>
                                <th className="px-3 py-2 text-left text-gray-500 dark:text-gray-400">
                                  Email
                                </th>
                                <th className="px-3 py-2 text-left text-gray-500 dark:text-gray-400">
                                  Claimed At
                                </th>
                                <th className="px-3 py-2 text-left text-gray-500 dark:text-gray-400">
                                  Expires
                                </th>
                              </tr>
                            </thead>
                            <tbody>
                              {claimsData.map((claim: Claim) => (
                                <tr
                                  key={claim.id}
                                  className="border-b border-gray-100 hover:bg-gray-50 dark:border-gray-700/50 dark:hover:bg-gray-700/30"
                                >
                                  <td className="px-3 py-2 text-gray-800 dark:text-gray-200">
                                    {claim.User.name}
                                  </td>
                                  <td className="px-3 py-2 text-gray-600 dark:text-gray-400">
                                    {claim.User.email}
                                  </td>
                                  <td className="px-3 py-2 text-gray-600 dark:text-gray-400">
                                    {new Date(
                                      claim.claimedAt,
                                    ).toLocaleDateString()}
                                  </td>
                                  <td className="px-3 py-2 text-gray-600 dark:text-gray-400">
                                    {claim.User.membershipExpiresAt
                                      ? new Date(
                                          claim.User.membershipExpiresAt,
                                        ).toLocaleDateString()
                                      : "—"}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Create Campaign Modal ────────────────────────────────────────────── */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-4 backdrop-blur-sm sm:items-center">
          <div className="w-full max-w-lg rounded-2xl border border-gray-200 bg-white p-6 shadow-2xl dark:border-gray-700 dark:bg-gray-800">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                New Promo Campaign
              </h2>
              <button
                onClick={() => setShowCreate(false)}
                className="rounded-lg p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <X className="h-4 w-4 text-gray-500 dark:text-gray-400" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4">
              {/* Name */}
              <div>
                <label className="mb-1 block text-xs text-gray-600 dark:text-gray-400">
                  Campaign Name *
                </label>
                <input
                  value={form.name}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, name: e.target.value }))
                  }
                  required
                  placeholder="e.g. 10K Free Activations Wave 1"
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-green-600 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-500 dark:focus:border-green-500"
                />
              </div>

              {/* Quota */}
              <div>
                <label className="mb-1 block text-xs text-gray-600 dark:text-gray-400">
                  Quota (number of free activations) *
                </label>
                <input
                  type="number"
                  min={1}
                  max={100000}
                  value={form.quota}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      quota: parseInt(e.target.value) || 1,
                    }))
                  }
                  required
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-green-600 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:focus:border-green-500"
                />
              </div>

              {/* Target package (optional) */}
              <div>
                <label className="mb-1 block text-xs text-gray-600 dark:text-gray-400">
                  Restrict to Package (optional — leave blank for any)
                </label>
                <select
                  value={form.targetPackageId}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, targetPackageId: e.target.value }))
                  }
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-green-600 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:focus:border-green-500"
                >
                  <option value="">Any package</option>
                  {packages.map((p: any) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Date range */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs text-gray-600 dark:text-gray-400">
                    Start Date (optional)
                  </label>
                  <input
                    type="date"
                    value={form.startDate}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, startDate: e.target.value }))
                    }
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-green-600 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:focus:border-green-500 dark:[color-scheme:dark]"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-gray-600 dark:text-gray-400">
                    End Date (optional)
                  </label>
                  <input
                    type="date"
                    value={form.endDate}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, endDate: e.target.value }))
                    }
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-green-600 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:focus:border-green-500 dark:[color-scheme:dark]"
                  />
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="mb-1 block text-xs text-gray-600 dark:text-gray-400">
                  Admin Notes (optional)
                </label>
                <textarea
                  value={form.notes}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, notes: e.target.value }))
                  }
                  rows={3}
                  maxLength={500}
                  placeholder="Internal notes for tracking this campaign…"
                  className="w-full resize-none rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-green-600 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-500 dark:focus:border-green-500"
                />
              </div>

              {/* Revenue isolation notice */}
              <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 dark:border-amber-500/20 dark:bg-amber-900/10">
                <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-600 dark:text-amber-400" />
                <p className="text-xs text-amber-700 dark:text-amber-300/80">
                  Promo activations are <strong>completely revenue-isolated</strong>.
                  They do not create revenue transactions, wallet entries, or
                  referral payouts. Activations are logged only in the promo
                  claims ledger.
                </p>
              </div>

              <div className="flex gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowCreate(false)}
                  className="flex-1 border-gray-200 bg-transparent text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={createMutation.isPending}
                  className="flex-1 bg-green-700 text-white hover:bg-green-600"
                >
                  {createMutation.isPending ? "Creating…" : "Create Campaign"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
