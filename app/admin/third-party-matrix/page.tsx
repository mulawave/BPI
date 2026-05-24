// @ts-nocheck
"use client";

import { useMemo, useState, type ReactNode } from "react";
import {
  Activity,
  AlertTriangle,
  BarChart3,
  Download,
  GitBranch,
  RefreshCw,
  Search,
  Settings,
  Shield,
  Users,
} from "lucide-react";
import toast from "react-hot-toast";
import { api } from "@/client/trpc";
import { Button } from "@/components/ui/button";
import AdminPageGuide from "@/components/admin/AdminPageGuide";

type ThirdPartyMatrixSettings = {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  isEnabled: boolean;
  allowAutoPlacement: boolean;
  allowAdminMaintenance: boolean;
  maxPlacementRetries: number;
  alertImbalanceThreshold: number;
};

export default function ThirdPartyMatrixAdminPage() {
  const utils = api.useUtils();
  const [query, setQuery] = useState("");
  const [selectedSponsorId, setSelectedSponsorId] = useState<string | null>(null);

  // Query for matrix settings
  const rawSettingsQuery = api.thirdPartyMatrixAdmin.getSettings.useQuery();
  const settings = rawSettingsQuery.data as ThirdPartyMatrixSettings | undefined;
  
  const { data: overview, isLoading: loadingOverview } = api.thirdPartyMatrixAdmin.getOverview.useQuery();
  const { data: sponsors, isLoading: loadingSponsors } = api.thirdPartyMatrixAdmin.listSponsors.useQuery({
    query: query.trim() || undefined,
    limit: 80,
  });
  const { data: sponsorDetails, isLoading: loadingSponsorDetails } = api.thirdPartyMatrixAdmin.getSponsorDetails.useQuery(
    { sponsorId: selectedSponsorId || "" },
    { enabled: !!selectedSponsorId }
  );

  const updateSettings = api.thirdPartyMatrixAdmin.updateSettings.useMutation({
    onSuccess: async () => {
      toast.success("Matrix settings updated");
      await utils.thirdPartyMatrixAdmin.getSettings.invalidate();
      await utils.thirdPartyMatrixAdmin.getOverview.invalidate();
    },
    onError: (error) => toast.error(error.message),
  });

  const repairPlacement = api.thirdPartyMatrixAdmin.repairPlacement.useMutation({
    onSuccess: async () => {
      toast.success("Placement repaired");
      await utils.thirdPartyMatrixAdmin.getOverview.invalidate();
      if (selectedSponsorId) {
        await utils.thirdPartyMatrixAdmin.getSponsorDetails.invalidate({ sponsorId: selectedSponsorId });
      }
    },
    onError: (error) => toast.error(error.message),
  });

  const resetSponsor = api.thirdPartyMatrixAdmin.resetSponsorNodes.useMutation({
    onSuccess: async () => {
      toast.success("Sponsor matrix reset");
      await utils.thirdPartyMatrixAdmin.getOverview.invalidate();
      await utils.thirdPartyMatrixAdmin.listSponsors.invalidate();
      if (selectedSponsorId) {
        await utils.thirdPartyMatrixAdmin.getSponsorDetails.invalidate({ sponsorId: selectedSponsorId });
      }
    },
    onError: (error) => toast.error(error.message),
  });

  const exportCsv = api.thirdPartyMatrixAdmin.exportPlacementReportCsv.useQuery({}, {
    enabled: false,
  });

  const selectedSponsorName = useMemo(() => {
    if (!sponsorDetails?.sponsor) return null;
    return sponsorDetails.sponsor.name;
  }, [sponsorDetails]);

  const triggerCsvDownload = async () => {
    try {
      const response = await exportCsv.refetch();
      const payload = response.data;
      if (!payload?.csv) {
        toast.error("No report rows found to export");
        return;
      }

      const blob = new Blob([payload.csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.setAttribute("download", payload.fileName);
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
      URL.revokeObjectURL(url);
      toast.success("CSV report exported");
    } catch (error: any) {
      toast.error(error?.message || "Failed to export CSV");
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Third Party Matrix Control Center</h1>
          <p className="text-sm text-muted-foreground">Admin controls, sponsor management, and placement reporting</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="gap-2" onClick={triggerCsvDownload}>
            <Download className="w-4 h-4" />
            Export CSV
          </Button>
          <Button className="gap-2" onClick={() => utils.thirdPartyMatrixAdmin.getOverview.invalidate()}>
            <RefreshCw className="w-4 h-4" />
            Refresh
          </Button>
        </div>
      </div>

      <AdminPageGuide
        title="Third Party Matrix Admin Guide"
        sections={[
          {
            title: "What this control center does",
            icon: <GitBranch className="w-5 h-5 text-emerald-600" />,
            items: [
              "Manage global matrix behavior (enable/disable, auto-placement, safeguards)",
              "Inspect sponsor-level matrix nodes and left/right occupancy",
              "Track placement activity and balance health",
              "Run maintenance actions for placement corrections",
              "Export placement reports for operations and compliance",
            ],
          },
          {
            title: "Operations workflow",
            icon: <Settings className="w-5 h-5 text-blue-600" />,
            type: "ol",
            items: [
              "Set matrix controls from the Settings panel",
              "Use sponsor search to inspect matrix structure",
              "Run repair placement only for verified edge cases",
              "Use reset sponsor cautiously for rebuild scenarios",
              "Export reports after major changes for audit trail",
            ],
          },
        ]}
        features={[
          "Global matrix toggles",
          "Sponsor matrix drill-down",
          "Recent placement activity",
          "Repair/reset maintenance actions",
          "CSV reporting export",
        ]}
        proTip="Use sponsor detail inspection before running any maintenance action. Keep CSV exports per operation window for traceability."
        warning="Reset actions can remove sponsor matrix structure. Confirm with operations before executing maintenance changes."
      />

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-4">
        <div className="xl:col-span-8 space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <StatCard label="Sponsors" value={overview?.totalSponsors ?? 0} icon={<Users className="w-4 h-4" />} />
            <StatCard label="Nodes" value={overview?.totalNodes ?? 0} icon={<GitBranch className="w-4 h-4" />} />
            <StatCard label="Placements" value={overview?.totalPlacements ?? 0} icon={<Activity className="w-4 h-4" />} />
            <StatCard label="Imbalance" value={overview?.imbalance ?? 0} icon={<AlertTriangle className="w-4 h-4" />} />
          </div>


          <div className="rounded-2xl border border-bpi-border dark:border-bpi-dark-accent bg-white dark:bg-bpi-dark-card p-4">
            <div className="flex items-center justify-between gap-3 mb-3">
              <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-bpi-primary" />
                Placement Activity Feed
              </h2>
              {loadingOverview && <span className="text-xs text-muted-foreground">Loading...</span>}
            </div>
            <div className="space-y-2 max-h-[320px] overflow-y-auto pr-1">
              {(overview?.latestActivity || []).length === 0 ? (
                <p className="text-sm text-muted-foreground">No activity recorded yet.</p>
              ) : (
                overview?.latestActivity.map((item) => (
                  <div key={item.id} className="rounded-xl border border-bpi-border dark:border-bpi-dark-accent p-3 bg-gray-50 dark:bg-bpi-dark-accent/30">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <p className="text-sm font-semibold text-foreground">{item.userName}</p>
                        <p className="text-xs text-muted-foreground">Sponsor: {item.sponsorName}</p>
                      </div>
                      <div className="text-right">
                        <span className="inline-flex px-2 py-1 rounded-full border border-bpi-border dark:border-bpi-dark-accent text-xs font-semibold">
                          {item.leg}
                        </span>
                        <p className="text-xs text-muted-foreground mt-1">{new Date(item.createdAt).toLocaleString()}</p>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">{item.decisionBranch} • {item.sourceFlow}</p>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-bpi-border dark:border-bpi-dark-accent bg-white dark:bg-bpi-dark-card p-4">
            <div className="flex items-center justify-between mb-3 gap-3">
              <h2 className="text-lg font-semibold text-foreground">Sponsor Management</h2>
              <div className="relative w-full max-w-xs">
                <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search sponsor..."
                  className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-bpi-border dark:border-bpi-dark-accent bg-white dark:bg-bpi-dark-card"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[700px] text-sm">
                <thead>
                  <tr className="text-left text-muted-foreground border-b border-bpi-border dark:border-bpi-dark-accent">
                    <th className="py-2">Sponsor</th>
                    <th className="py-2">Nodes</th>
                    <th className="py-2">Placements</th>
                    <th className="py-2">Left</th>
                    <th className="py-2">Right</th>
                    <th className="py-2">Gap</th>
                    <th className="py-2 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loadingSponsors ? (
                    <tr>
                      <td colSpan={7} className="py-6 text-center text-muted-foreground">Loading sponsors...</td>
                    </tr>
                  ) : (sponsors || []).length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-6 text-center text-muted-foreground">No sponsor rows found.</td>
                    </tr>
                  ) : (
                    sponsors?.map((row: any) => (
                      <tr key={row.sponsorId} className="border-b border-bpi-border/70 dark:border-bpi-dark-accent/70">
                        <td className="py-2">
                          <div className="font-medium text-foreground">{row.sponsorName}</div>
                          <div className="text-xs text-muted-foreground">{row.sponsorEmail || "No email"}</div>
                        </td>
                        <td className="py-2">{row.nodeCount}</td>
                        <td className="py-2">{row.placementCount}</td>
                        <td className="py-2">{row.leftCount}</td>
                        <td className="py-2">{row.rightCount}</td>
                        <td className="py-2">{row.imbalance}</td>
                        <td className="py-2 text-right">
                          <Button
                            variant="outline"
                            className="h-8"
                            onClick={() => setSelectedSponsorId(row.sponsorId)}
                          >
                            Inspect
                          </Button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="xl:col-span-4 space-y-4">
          <div className="rounded-2xl border border-bpi-border dark:border-bpi-dark-accent bg-white dark:bg-bpi-dark-card p-4">
            <h2 className="text-lg font-semibold text-foreground flex items-center gap-2 mb-3">
              <Shield className="w-5 h-5 text-bpi-primary" />
              Matrix Settings
            </h2>
            <div className="space-y-3">
              <ToggleRow
                label="Matrix Enabled"
                enabled={settings?.isEnabled ?? true}
                onChange={(value) => updateSettings.mutate({ isEnabled: value })}
                busy={updateSettings.isPending}
              />
              <ToggleRow
                label="Auto Placement"
                enabled={settings?.allowAutoPlacement ?? true}
                onChange={(value) => updateSettings.mutate({ allowAutoPlacement: value })}
                busy={updateSettings.isPending}
              />
              <ToggleRow
                label="Admin Maintenance"
                enabled={settings?.allowAdminMaintenance ?? true}
                onChange={(value) => updateSettings.mutate({ allowAdminMaintenance: value })}
                busy={updateSettings.isPending}
              />
            </div>
          </div>

          <div className="rounded-2xl border border-bpi-border dark:border-bpi-dark-accent bg-white dark:bg-bpi-dark-card p-4">
            <h2 className="text-lg font-semibold text-foreground mb-3">Selected Sponsor</h2>
            {!selectedSponsorId ? (
              <p className="text-sm text-muted-foreground">Select a sponsor from the table to inspect node details and run maintenance actions.</p>
            ) : loadingSponsorDetails ? (
              <p className="text-sm text-muted-foreground">Loading sponsor details...</p>
            ) : sponsorDetails ? (
              <>
                <div className="rounded-lg bg-gray-50 dark:bg-bpi-dark-accent/30 border border-bpi-border dark:border-bpi-dark-accent p-3 mb-3">
                  <p className="font-semibold text-foreground">{selectedSponsorName}</p>
                  <p className="text-xs text-muted-foreground">Nodes: {sponsorDetails.nodes.length} • Recent placements: {sponsorDetails.placements.length}</p>
                </div>
                <div className="space-y-2 mb-4 max-h-44 overflow-y-auto">
                  {sponsorDetails.nodes.map((node) => (
                    <div key={node.id} className="rounded-lg border border-bpi-border dark:border-bpi-dark-accent p-2">
                      <p className="text-xs font-semibold text-foreground">Node #{node.sequence}</p>
                      <p className="text-xs text-muted-foreground">L: {node.leftUser ? `${node.leftUser.firstname || ""} ${node.leftUser.lastname || ""}`.trim() || node.leftUser.email : "Open"}</p>
                      <p className="text-xs text-muted-foreground">R: {node.rightUser ? `${node.rightUser.firstname || ""} ${node.rightUser.lastname || ""}`.trim() || node.rightUser.email : "Open"}</p>
                    </div>
                  ))}
                </div>
                <div className="space-y-2">
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => {
                      const orphan = sponsorDetails.placements.find((p) => p.decisionBranch.includes("FAILED"));
                      if (!orphan) {
                        toast("No failed audit rows detected for quick repair.");
                        return;
                      }
                      repairPlacement.mutate({ userId: orphan.userId, sponsorId: sponsorDetails.sponsor.id });
                    }}
                    disabled={repairPlacement.isPending}
                  >
                    {repairPlacement.isPending ? "Repairing..." : "Run Quick Repair"}
                  </Button>
                  <Button
                    variant="destructive"
                    className="w-full"
                    onClick={() => resetSponsor.mutate({ sponsorId: sponsorDetails.sponsor.id })}
                    disabled={resetSponsor.isPending}
                  >
                    {resetSponsor.isPending ? "Resetting..." : "Reset Sponsor Matrix"}
                  </Button>
                </div>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">Sponsor not found.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, icon }: { label: string; value: number; icon: ReactNode }) {
  return (
    <div className="rounded-xl border border-bpi-border dark:border-bpi-dark-accent bg-white dark:bg-bpi-dark-card p-3">
      <div className="flex items-center justify-between mb-1 text-muted-foreground text-xs">
        <span>{label}</span>
        <span>{icon}</span>
      </div>
      <p className="text-2xl font-bold text-foreground">{value}</p>
    </div>
  );
}

function ToggleRow({
  label,
  enabled,
  busy,
  onChange,
}: {
  label: string;
  enabled: boolean;
  busy?: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-bpi-border dark:border-bpi-dark-accent p-2">
      <p className="text-sm font-medium text-foreground">{label}</p>
      <button
        disabled={busy}
        onClick={() => onChange(!enabled)}
        className={`inline-flex w-14 h-8 rounded-full transition-colors ${enabled ? "bg-emerald-600" : "bg-gray-300 dark:bg-bpi-dark-accent"} ${busy ? "opacity-60" : ""}`}
      >
        <span
          className={`h-6 w-6 rounded-full bg-white my-1 transition-transform ${enabled ? "translate-x-7" : "translate-x-1"}`}
        />
      </button>
    </div>
  );
}
