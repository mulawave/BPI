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

  return (
    <div className="min-h-screen bg-[#0a0f0a] text-white">
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="border-b border-white/10 bg-gradient-to-r from-[#0d1f14] to-[#0a0f0a] px-6 py-5">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full border border-green-500/30 bg-green-900/30">
              <Gift className="h-5 w-5 text-green-400" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Promo Campaigns</h1>
              <p className="text-xs text-white/50">
                Revenue-isolated free membership activations
              </p>
            </div>
          </div>
          <Button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 rounded-lg bg-green-700 px-4 py-2 text-sm font-medium hover:bg-green-600"
          >
            <Plus className="h-4 w-4" /> New Campaign
          </Button>
        </div>
      </div>

      <div className="mx-auto max-w-6xl space-y-6 px-6 py-6">
        {/* ── Summary stats ────────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            {
              label: "Total Campaigns",
              value: campaigns.length,
              icon: Gift,
              color: "blue",
            },
            {
              label: "Active Campaigns",
              value: activeCampaigns,
              icon: CheckCircle,
              color: "green",
            },
            {
              label: "Total Quota",
              value: totalQuota.toLocaleString(),
              icon: Users,
              color: "purple",
            },
            {
              label: "Claims Used",
              value: totalUsed.toLocaleString(),
              icon: Clock,
              color: "amber",
            },
          ].map(({ label, value, icon: Icon, color }) => (
            <div
              key={label}
              className={`rounded-xl border border-${color}-500/20 bg-${color}-900/10 p-4`}
            >
              <div className="flex items-center gap-2">
                <Icon className={`h-4 w-4 text-${color}-400`} />
                <span className="text-xs text-white/60">{label}</span>
              </div>
              <p className={`mt-2 text-2xl font-bold text-${color}-400`}>
                {value}
              </p>
            </div>
          ))}
        </div>

        {/* ── Campaign list ─────────────────────────────────────────────────── */}
        {campaigns.length === 0 ? (
          <div className="rounded-xl border border-white/10 bg-white/5 py-16 text-center">
            <Gift className="mx-auto mb-3 h-10 w-10 text-white/20" />
            <p className="text-white/50">No promo campaigns yet.</p>
            <Button
              onClick={() => setShowCreate(true)}
              className="mt-4 bg-green-700 hover:bg-green-600"
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
                  className="rounded-xl border border-white/10 bg-white/5"
                >
                  {/* Card header */}
                  <div className="flex items-center gap-4 p-4">
                    {/* Status dot */}
                    <div
                      className={`h-2.5 w-2.5 flex-shrink-0 rounded-full ${c.isActive ? "bg-green-400" : "bg-white/20"}`}
                    />

                    {/* Campaign info */}
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-semibold text-white">
                          {c.name}
                        </span>
                        {c.isActive && (
                          <span className="rounded-full bg-green-900/50 px-2 py-0.5 text-xs text-green-400">
                            Active
                          </span>
                        )}
                        {!c.isActive && (
                          <span className="rounded-full bg-white/10 px-2 py-0.5 text-xs text-white/40">
                            Inactive
                          </span>
                        )}
                      </div>
                      {/* Progress bar */}
                      <div className="mt-2 flex items-center gap-3">
                        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/10">
                          <div
                            className={`h-full rounded-full transition-all ${pct >= 100 ? "bg-red-500" : pct >= 80 ? "bg-amber-500" : "bg-green-500"}`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <span className="text-xs text-white/50">
                          {c.usedCount.toLocaleString()} /{" "}
                          {c.quota.toLocaleString()} ({pct}%)
                        </span>
                      </div>
                      {/* Dates */}
                      {(c.startDate || c.endDate) && (
                        <p className="mt-1 text-xs text-white/40">
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
                        className="rounded-lg border border-white/10 p-2 transition hover:border-green-500/50 hover:bg-green-900/20"
                        title={c.isActive ? "Deactivate" : "Activate"}
                      >
                        {c.isActive ? (
                          <ToggleRight className="h-4 w-4 text-green-400" />
                        ) : (
                          <ToggleLeft className="h-4 w-4 text-white/40" />
                        )}
                      </button>

                      <button
                        onClick={() => {
                          setSelectedCampaignId(
                            isViewingClaims ? null : c.id,
                          );
                        }}
                        className="rounded-lg border border-white/10 p-2 transition hover:border-blue-500/50 hover:bg-blue-900/20"
                        title="View claims"
                      >
                        <Eye
                          className={`h-4 w-4 ${isViewingClaims ? "text-blue-400" : "text-white/40"}`}
                        />
                      </button>

                      <button
                        onClick={() => handleDelete(c.id)}
                        className="rounded-lg border border-white/10 p-2 transition hover:border-red-500/50 hover:bg-red-900/20"
                        title="Delete (only if no claims)"
                      >
                        <Trash2 className="h-4 w-4 text-white/40 hover:text-red-400" />
                      </button>

                      <button
                        onClick={() => toggleExpand(c.id)}
                        className="rounded-lg border border-white/10 p-2 transition hover:bg-white/10"
                      >
                        {isExpanded ? (
                          <ChevronUp className="h-4 w-4 text-white/40" />
                        ) : (
                          <ChevronDown className="h-4 w-4 text-white/40" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Expanded details */}
                  {isExpanded && (
                    <div className="border-t border-white/10 px-4 py-3">
                      <dl className="grid grid-cols-2 gap-2 text-sm sm:grid-cols-3">
                        <div>
                          <dt className="text-white/40">Campaign ID</dt>
                          <dd className="font-mono text-xs text-white/70">
                            {c.id}
                          </dd>
                        </div>
                        <div>
                          <dt className="text-white/40">Created</dt>
                          <dd className="text-white/70">
                            {new Date(c.createdAt).toLocaleDateString()}
                          </dd>
                        </div>
                        <div>
                          <dt className="text-white/40">Target Package</dt>
                          <dd className="text-white/70">
                            {c.targetPackageId
                              ? packages.find(
                                  (p: any) => p.id === c.targetPackageId,
                                )?.name ?? c.targetPackageId
                              : "Any package"}
                          </dd>
                        </div>
                        {c.notes && (
                          <div className="col-span-full">
                            <dt className="text-white/40">Notes</dt>
                            <dd className="text-white/70">{c.notes}</dd>
                          </div>
                        )}
                      </dl>
                    </div>
                  )}

                  {/* Claims panel */}
                  {isViewingClaims && (
                    <div className="border-t border-white/10 p-4">
                      <div className="mb-3 flex items-center justify-between">
                        <h3 className="text-sm font-semibold text-white/80">
                          Claims ({claimsData.length})
                        </h3>
                        {claimsData.length > 0 && (
                          <button
                            onClick={() => exportClaims(c.id, c.name)}
                            className="flex items-center gap-1 rounded-lg border border-white/10 px-3 py-1.5 text-xs text-white/60 hover:bg-white/10"
                          >
                            <Download className="h-3.5 w-3.5" /> Export CSV
                          </button>
                        )}
                      </div>

                      {claimsLoading ? (
                        <p className="text-sm text-white/40">Loading…</p>
                      ) : claimsData.length === 0 ? (
                        <p className="text-sm text-white/40">No claims yet.</p>
                      ) : (
                        <div className="max-h-64 overflow-y-auto rounded-lg border border-white/10">
                          <table className="w-full text-xs">
                            <thead className="border-b border-white/10 bg-white/5">
                              <tr>
                                <th className="px-3 py-2 text-left text-white/50">
                                  User
                                </th>
                                <th className="px-3 py-2 text-left text-white/50">
                                  Email
                                </th>
                                <th className="px-3 py-2 text-left text-white/50">
                                  Claimed At
                                </th>
                                <th className="px-3 py-2 text-left text-white/50">
                                  Expires
                                </th>
                              </tr>
                            </thead>
                            <tbody>
                              {claimsData.map((claim: Claim) => (
                                <tr
                                  key={claim.id}
                                  className="border-b border-white/5 hover:bg-white/5"
                                >
                                  <td className="px-3 py-2 text-white/80">
                                    {claim.User.name}
                                  </td>
                                  <td className="px-3 py-2 text-white/60">
                                    {claim.User.email}
                                  </td>
                                  <td className="px-3 py-2 text-white/60">
                                    {new Date(
                                      claim.claimedAt,
                                    ).toLocaleDateString()}
                                  </td>
                                  <td className="px-3 py-2 text-white/60">
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
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-4 backdrop-blur-sm sm:items-center">
          <div className="w-full max-w-lg rounded-2xl border border-white/15 bg-[#0d1f14] p-6 shadow-2xl">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-lg font-bold text-white">
                New Promo Campaign
              </h2>
              <button
                onClick={() => setShowCreate(false)}
                className="rounded-lg p-1.5 hover:bg-white/10"
              >
                <X className="h-4 w-4 text-white/60" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4">
              {/* Name */}
              <div>
                <label className="mb-1 block text-xs text-white/60">
                  Campaign Name *
                </label>
                <input
                  value={form.name}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, name: e.target.value }))
                  }
                  required
                  placeholder="e.g. 10K Free Activations Wave 1"
                  className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-white/30 focus:border-green-600/60 focus:outline-none"
                />
              </div>

              {/* Quota */}
              <div>
                <label className="mb-1 block text-xs text-white/60">
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
                  className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-white/30 focus:border-green-600/60 focus:outline-none"
                />
              </div>

              {/* Target package (optional) */}
              <div>
                <label className="mb-1 block text-xs text-white/60">
                  Restrict to Package (optional — leave blank for any)
                </label>
                <select
                  value={form.targetPackageId}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, targetPackageId: e.target.value }))
                  }
                  className="w-full rounded-lg border border-white/10 bg-[#0a0f0a] px-3 py-2 text-sm text-white focus:border-green-600/60 focus:outline-none"
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
                  <label className="mb-1 block text-xs text-white/60">
                    Start Date (optional)
                  </label>
                  <input
                    type="date"
                    value={form.startDate}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, startDate: e.target.value }))
                    }
                    className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:border-green-600/60 focus:outline-none [color-scheme:dark]"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-white/60">
                    End Date (optional)
                  </label>
                  <input
                    type="date"
                    value={form.endDate}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, endDate: e.target.value }))
                    }
                    className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:border-green-600/60 focus:outline-none [color-scheme:dark]"
                  />
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="mb-1 block text-xs text-white/60">
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
                  className="w-full resize-none rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-white/30 focus:border-green-600/60 focus:outline-none"
                />
              </div>

              {/* Revenue isolation notice */}
              <div className="flex items-start gap-2 rounded-lg border border-amber-500/20 bg-amber-900/10 p-3">
                <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-400" />
                <p className="text-xs text-amber-300/80">
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
                  className="flex-1 border-white/10 bg-transparent text-white/70 hover:bg-white/10"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={createMutation.isPending}
                  className="flex-1 bg-green-700 hover:bg-green-600"
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
