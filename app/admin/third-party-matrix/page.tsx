// @ts-nocheck
"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
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
import { Layers, Pencil, Plus, Trash2, ToggleLeft, ToggleRight, Upload, X } from "lucide-react";

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
    // ── Platform management state ──────────────────────────────────────────────
    const [platformSection, setPlatformSection] = useState(true);
    const [showAddPlatform, setShowAddPlatform] = useState(false);
    const [editingPlatform, setEditingPlatform] = useState<any | null>(null);
    const [platformForm, setPlatformForm] = useState({
      name: "",
      description: "",
      registrationUrl: "",
      adminDefaultLink: "",
      defaultAdminUserId: "",
      category: "",
      displayOrder: 0,
      logo: "",
      isActive: true,
    });
    const [deletingPlatformId, setDeletingPlatformId] = useState<string | null>(null);
    const [confirmDeletePlatformId, setConfirmDeletePlatformId] = useState<string | null>(null);
    const [logoPreview, setLogoPreview] = useState<string>("");
    const [uploadProgress, setUploadProgress] = useState<number>(0);
    const [uploadingLogo, setUploadingLogo] = useState(false);

  useEffect(() => {
    if (!confirmDeletePlatformId) return;
    const timeout = setTimeout(() => setConfirmDeletePlatformId(null), 5000);
    return () => clearTimeout(timeout);
  }, [confirmDeletePlatformId]);

  const utils = api.useUtils();
  const [query, setQuery] = useState("");
  const [selectedSponsorId, setSelectedSponsorId] = useState<string | null>(null);
  const [resetUserQuery, setResetUserQuery] = useState("");
  const [selectedResetUserId, setSelectedResetUserId] = useState<string>("");
  const [selectedResetPlatformId, setSelectedResetPlatformId] = useState<string>("");
  const [resetRemoveRegistration, setResetRemoveRegistration] = useState(true);

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
  const { data: platformAnalytics, isLoading: loadingPlatformAnalytics } = api.thirdPartyMatrixAdmin.getPlatformAnalytics.useQuery();
  const { data: resetUserMatches, isFetching: searchingResetUsers } = api.thirdPartyMatrixAdmin.searchUsersForReset.useQuery(
    {
      query: resetUserQuery.trim(),
      limit: 12,
    },
    {
      enabled: resetUserQuery.trim().length >= 2,
    }
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

  const resetUserSubmission = api.thirdPartyMatrixAdmin.resetUserPlatformSubmission.useMutation({
    onSuccess: async (result) => {
      toast.success(
        `${result.deletedLinks} link(s) and ${result.deletedRegistrations} registration(s) removed for ${result.platformName}`
      );
      await utils.thirdPartyMatrixAdmin.getPlatformAnalytics.invalidate();
      await utils.thirdPartyPlatforms.adminListPlatforms.invalidate();
      setSelectedResetUserId("");
      setSelectedResetPlatformId("");
      setResetUserQuery("");
    },
    onError: (error) => toast.error(error.message),
  });

  const selectedSponsorName = useMemo(() => {
    if (!sponsorDetails?.sponsor) return null;
    return sponsorDetails.sponsor.name;
  }, [sponsorDetails]);

  const selectedResetUser = useMemo(
    () => (resetUserMatches || []).find((u: any) => u.id === selectedResetUserId) || null,
    [resetUserMatches, selectedResetUserId]
  );

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

    // ── Platform CRUD helpers ──────────────────────────────────────────────────
    const { data: platformList, isLoading: loadingPlatforms } = api.thirdPartyPlatforms.adminListPlatforms.useQuery();
    const {
      data: platformOwners,
      isLoading: loadingPlatformOwners,
      error: platformOwnersError,
    } = api.thirdPartyPlatforms.adminListPlatformOwners.useQuery();

    const addPlatform = api.thirdPartyPlatforms.adminAddPlatform.useMutation({
      onSuccess: async () => {
        toast.success("Platform added");
        resetPlatformForm();
        setShowAddPlatform(false);
        await utils.thirdPartyPlatforms.adminListPlatforms.invalidate();
      },
      onError: (e) => toast.error(e.message),
    });

    const updatePlatform = api.thirdPartyPlatforms.adminUpdatePlatform.useMutation({
      onSuccess: async () => {
        toast.success("Platform updated");
        setEditingPlatform(null);
        resetPlatformForm();
        await utils.thirdPartyPlatforms.adminListPlatforms.invalidate();
      },
      onError: (e) => toast.error(e.message),
    });

    const togglePlatformActive = api.thirdPartyPlatforms.adminTogglePlatformActive.useMutation({
      onSuccess: async (data) => {
        toast.success(data.isActive ? "Platform activated" : "Platform deactivated");
        await utils.thirdPartyPlatforms.adminListPlatforms.invalidate();
      },
      onError: (e) => toast.error(e.message),
    });

    const deletePlatform = api.thirdPartyPlatforms.adminDeletePlatform.useMutation({
      onMutate: (variables) => {
        setDeletingPlatformId(variables.id);
      },
      onSuccess: async () => {
        toast.success("Platform deleted");
        await utils.thirdPartyPlatforms.adminListPlatforms.invalidate();
        setDeletingPlatformId(null);
        setConfirmDeletePlatformId(null);
      },
      onError: (e) => {
        toast.error(e.message);
        setDeletingPlatformId(null);
        setConfirmDeletePlatformId(null);
      },
    });

    function resetPlatformForm() {
      setPlatformForm({ name: "", description: "", registrationUrl: "", adminDefaultLink: "", defaultAdminUserId: "", category: "", displayOrder: 0, logo: "", isActive: true });
      setLogoPreview("");
      setUploadProgress(0);
    }

    function openEditPlatform(p: any) {
      setEditingPlatform(p);
      setPlatformForm({
        name: p.name,
        description: p.description || "",
        registrationUrl: p.registrationUrl || "",
        adminDefaultLink: p.adminDefaultLink || "",
        defaultAdminUserId: p.defaultAdminUserId || "",
        category: p.category || "",
        displayOrder: p.displayOrder ?? 0,
        logo: p.logo || "",
        isActive: p.isActive,
      });
      setLogoPreview(p.logo || "");
      setShowAddPlatform(true);
    }

    async function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
      const file = e.target.files?.[0];
      if (!file) return;

      // Instant local preview
      const reader = new FileReader();
      reader.onload = (ev) => setLogoPreview(ev.target?.result as string);
      reader.readAsDataURL(file);

      // Upload with XHR progress tracking
      setUploadingLogo(true);
      setUploadProgress(0);

      const formData = new FormData();
      formData.append("file", file);

      const xhr = new XMLHttpRequest();
      xhr.open("POST", "/api/admin/upload-platform-logo");

      xhr.upload.onprogress = (ev) => {
        if (ev.lengthComputable) {
          setUploadProgress(Math.round((ev.loaded / ev.total) * 100));
        }
      };

      xhr.onload = () => {
        setUploadingLogo(false);
        if (xhr.status === 200) {
          const data = JSON.parse(xhr.responseText);
          setPlatformForm((prev) => ({ ...prev, logo: data.url }));
          toast.success("Logo uploaded");
        } else {
          const err = JSON.parse(xhr.responseText);
          toast.error(err.error || "Logo upload failed");
          setLogoPreview("");
        }
      };

      xhr.onerror = () => {
        setUploadingLogo(false);
        toast.error("Logo upload failed");
        setLogoPreview("");
      };

      xhr.send(formData);
    }

    function handleSubmitPlatform() {
      if (!platformForm.name.trim()) { toast.error("Platform name is required"); return; }
      if (!platformForm.registrationUrl.trim()) { toast.error("Platform base URL is required"); return; }
      if (!platformForm.defaultAdminUserId) { toast.error("Please select the default owner admin"); return; }

      if (editingPlatform) {
        updatePlatform.mutate({ id: editingPlatform.id, ...platformForm, displayOrder: Number(platformForm.displayOrder) });
      } else {
        addPlatform.mutate({ ...platformForm, displayOrder: Number(platformForm.displayOrder) });
      }
    }

    function handleResetSubmission() {
      if (!selectedResetUserId) {
        toast.error("Select a user to reset");
        return;
      }
      if (!selectedResetPlatformId) {
        toast.error("Select a platform to reset");
        return;
      }

      resetUserSubmission.mutate({
        userId: selectedResetUserId,
        platformId: selectedResetPlatformId,
        removeRegistration: resetRemoveRegistration,
      });
    }

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

        {/* ── Platform Management ─────────────────────────────────────────── */}
        <div className="rounded-2xl border border-bpi-border dark:border-bpi-dark-accent bg-white dark:bg-bpi-dark-card">
          <div
            className="flex items-center justify-between p-4 cursor-pointer select-none"
            onClick={() => setPlatformSection((v) => !v)}
          >
            <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <Layers className="w-5 h-5 text-bpi-primary" />
              Platform Management
              {platformList && (
                <span className="text-xs font-normal text-muted-foreground">
                  ({platformList.length} platform{platformList.length !== 1 ? "s" : ""})
                </span>
              )}
            </h2>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                className="gap-1"
                onClick={(e) => {
                  e.stopPropagation();
                  setEditingPlatform(null);
                  resetPlatformForm();
                  setShowAddPlatform(true);
                  setPlatformSection(true);
                }}
              >
                <Plus className="w-4 h-4" />
                Add Platform
              </Button>
            </div>
          </div>

          {platformSection && (
            <div className="border-t border-bpi-border dark:border-bpi-dark-accent">
              {/* Add / Edit form */}
              {showAddPlatform && (
                <div className="p-5 border-b border-bpi-border dark:border-bpi-dark-accent bg-gray-50 dark:bg-bpi-dark-accent/20">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-foreground">
                      {editingPlatform ? `Editing: ${editingPlatform.name}` : "Add New Platform"}
                    </h3>
                    <button
                      onClick={() => { setShowAddPlatform(false); setEditingPlatform(null); resetPlatformForm(); }}
                      className="p-1 hover:bg-gray-200 dark:hover:bg-bpi-dark-accent rounded"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Logo upload */}
                    <div className="md:col-span-2">
                      <label className="block text-xs font-semibold text-muted-foreground mb-2">Platform Logo</label>
                      <div className="flex items-start gap-4">
                        <div className="w-20 h-20 rounded-xl border-2 border-dashed border-bpi-border dark:border-bpi-dark-accent flex items-center justify-center bg-white dark:bg-bpi-dark-card overflow-hidden flex-shrink-0">
                          {logoPreview ? (
                            <img src={logoPreview} alt="Logo preview" className="w-full h-full object-contain" />
                          ) : (
                            <Upload className="w-8 h-8 text-muted-foreground" />
                          )}
                        </div>
                        <div className="flex-1">
                          <label className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-bpi-border dark:border-bpi-dark-accent bg-white dark:bg-bpi-dark-card text-sm font-medium cursor-pointer hover:bg-gray-50 dark:hover:bg-bpi-dark-accent/50 transition-colors">
                            <Upload className="w-4 h-4" />
                            {uploadingLogo ? `Uploading… ${uploadProgress}%` : "Choose Logo"}
                            <input
                              type="file"
                              accept="image/jpeg,image/png,image/gif,image/webp,image/svg+xml"
                              className="hidden"
                              onChange={handleLogoUpload}
                              disabled={uploadingLogo}
                            />
                          </label>
                          <p className="text-xs text-muted-foreground mt-1">JPEG, PNG, GIF, WebP or SVG · Max 2 MB</p>
                          {uploadingLogo && (
                            <div className="mt-2 w-full max-w-xs">
                              <div className="h-2 rounded-full bg-gray-200 dark:bg-bpi-dark-accent overflow-hidden">
                                <div
                                  className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-all duration-200"
                                  style={{ width: `${uploadProgress}%` }}
                                />
                              </div>
                              <p className="text-xs text-muted-foreground mt-1">{uploadProgress}% uploaded</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-muted-foreground mb-1">Platform Name *</label>
                      <input
                        type="text"
                        placeholder="e.g. Facebook"
                        value={platformForm.name}
                        onChange={(e) => setPlatformForm((p) => ({ ...p, name: e.target.value }))}
                        className="w-full rounded-lg border border-bpi-border dark:border-bpi-dark-accent bg-white dark:bg-bpi-dark-card px-3 py-2 text-sm text-foreground"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-muted-foreground mb-1">Category</label>
                      <input
                        type="text"
                        placeholder="e.g. Social Media"
                        value={platformForm.category}
                        onChange={(e) => setPlatformForm((p) => ({ ...p, category: e.target.value }))}
                        className="w-full rounded-lg border border-bpi-border dark:border-bpi-dark-accent bg-white dark:bg-bpi-dark-card px-3 py-2 text-sm text-foreground"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-xs font-semibold text-muted-foreground mb-1">Description</label>
                      <input
                        type="text"
                        placeholder="Brief platform description"
                        value={platformForm.description}
                        onChange={(e) => setPlatformForm((p) => ({ ...p, description: e.target.value }))}
                        className="w-full rounded-lg border border-bpi-border dark:border-bpi-dark-accent bg-white dark:bg-bpi-dark-card px-3 py-2 text-sm text-foreground"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-muted-foreground mb-1">
                        Platform Base URL * <span className="text-[10px] font-normal">(used for link validation only – not shown to users)</span>
                      </label>
                      <input
                        type="url"
                        placeholder="https://facebook.com"
                        value={platformForm.registrationUrl}
                        onChange={(e) => setPlatformForm((p) => ({ ...p, registrationUrl: e.target.value }))}
                        className="w-full rounded-lg border border-bpi-border dark:border-bpi-dark-accent bg-white dark:bg-bpi-dark-card px-3 py-2 text-sm text-foreground"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-muted-foreground mb-1">
                        Default Admin Referral Link <span className="text-[10px] font-normal">(link used for the selected owner admin and shown to their direct downlines)</span>
                      </label>
                      <input
                        type="url"
                        placeholder="https://facebook.com/r/yourref"
                        value={platformForm.adminDefaultLink}
                        onChange={(e) => setPlatformForm((p) => ({ ...p, adminDefaultLink: e.target.value }))}
                        className="w-full rounded-lg border border-bpi-border dark:border-bpi-dark-accent bg-white dark:bg-bpi-dark-card px-3 py-2 text-sm text-foreground"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-muted-foreground mb-1">Default Link Owner Admin *</label>
                      <select
                        value={platformForm.defaultAdminUserId}
                        onChange={(e) => setPlatformForm((p) => ({ ...p, defaultAdminUserId: e.target.value }))}
                        disabled={loadingPlatformOwners}
                        className="w-full rounded-lg border border-bpi-border dark:border-bpi-dark-accent bg-white dark:bg-bpi-dark-card px-3 py-2 text-sm text-foreground"
                      >
                        <option value="">{loadingPlatformOwners ? "Loading admins..." : "Select admin owner"}</option>
                        {(platformOwners || []).map((owner: any) => (
                          <option key={owner.id} value={owner.id}>
                            {owner.name} ({owner.role}{owner.activated ? "" : " - inactive"})
                          </option>
                        ))}
                      </select>
                      {platformOwnersError && (
                        <p className="text-xs text-red-600 mt-1">Failed to load admins. Try refreshing the page.</p>
                      )}
                      {!loadingPlatformOwners && (platformOwners || []).length === 0 && (
                        <p className="text-xs text-orange-600 mt-1">No admins found. Create an admin first.</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-muted-foreground mb-1">Display Order</label>
                      <input
                        type="number"
                        min={0}
                        value={platformForm.displayOrder}
                        onChange={(e) => setPlatformForm((p) => ({ ...p, displayOrder: Number(e.target.value) }))}
                        className="w-full rounded-lg border border-bpi-border dark:border-bpi-dark-accent bg-white dark:bg-bpi-dark-card px-3 py-2 text-sm text-foreground"
                      />
                    </div>

                    <div className="flex items-center gap-3">
                      <label className="text-xs font-semibold text-muted-foreground">Active</label>
                      <button
                        type="button"
                        onClick={() => setPlatformForm((p) => ({ ...p, isActive: !p.isActive }))}
                        className={`inline-flex w-12 h-6 rounded-full transition-colors ${platformForm.isActive ? "bg-emerald-600" : "bg-gray-300 dark:bg-bpi-dark-accent"}`}
                      >
                        <span className={`h-4 w-4 rounded-full bg-white my-1 transition-transform ${platformForm.isActive ? "translate-x-7" : "translate-x-1"}`} />
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 mt-4">
                    <Button
                      onClick={handleSubmitPlatform}
                      disabled={addPlatform.isPending || updatePlatform.isPending || uploadingLogo}
                      className="gap-2"
                    >
                      {(addPlatform.isPending || updatePlatform.isPending) ? "Saving…" : editingPlatform ? "Save Changes" : "Add Platform"}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => { setShowAddPlatform(false); setEditingPlatform(null); resetPlatformForm(); }}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}

              {/* Platform list */}
              <div className="overflow-x-auto">
                <table className="w-full min-w-[700px] text-sm">
                  <thead>
                    <tr className="text-left text-muted-foreground border-b border-bpi-border dark:border-bpi-dark-accent">
                      <th className="px-4 py-3">Logo</th>
                      <th className="px-4 py-3">Platform</th>
                      <th className="px-4 py-3">Category</th>
                      <th className="px-4 py-3">Owner Admin</th>
                      <th className="px-4 py-3">Base URL</th>
                      <th className="px-4 py-3">Admin Link</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loadingPlatforms ? (
                      <tr>
                        <td colSpan={8} className="px-4 py-8 text-center text-muted-foreground">Loading platforms…</td>
                      </tr>
                    ) : (platformList || []).length === 0 ? (
                      <tr>
                        <td colSpan={8} className="px-4 py-8 text-center text-muted-foreground">No platforms added yet. Click "Add Platform" to get started.</td>
                      </tr>
                    ) : (
                      (platformList || []).map((p: any) => (
                        <tr key={p.id} className="border-b border-bpi-border/60 dark:border-bpi-dark-accent/60 hover:bg-gray-50 dark:hover:bg-bpi-dark-accent/20 transition-colors">
                          <td className="px-4 py-3">
                            <div className="w-10 h-10 rounded-lg overflow-hidden bg-gray-100 dark:bg-bpi-dark-accent flex items-center justify-center flex-shrink-0">
                              {p.logo ? (
                                <img src={p.logo} alt={p.name} className="w-full h-full object-contain" />
                              ) : (
                                <span className="text-sm font-bold text-muted-foreground">{p.name.charAt(0)}</span>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="font-medium text-foreground">{p.name}</div>
                            {p.description && <div className="text-xs text-muted-foreground truncate max-w-[180px]">{p.description}</div>}
                          </td>
                          <td className="px-4 py-3 text-muted-foreground">{p.category || "—"}</td>
                          <td className="px-4 py-3">
                            {p.DefaultAdminUser ? (
                              <div>
                                <div className="text-xs font-medium text-foreground">
                                  {`${p.DefaultAdminUser.firstname || ""} ${p.DefaultAdminUser.lastname || ""}`.trim() || p.DefaultAdminUser.email}
                                </div>
                                <div className="text-[11px] text-muted-foreground">
                                  {p.DefaultAdminUser.role}
                                  {p.DefaultAdminUser.activated ? "" : " • inactive"}
                                </div>
                              </div>
                            ) : (
                              <span className="text-xs text-orange-600 dark:text-orange-400">Unassigned</span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            {p.registrationUrl ? (
                              <span className="text-xs font-mono text-muted-foreground truncate block max-w-[140px]">{p.registrationUrl}</span>
                            ) : <span className="text-muted-foreground">—</span>}
                          </td>
                          <td className="px-4 py-3">
                            {p.adminDefaultLink ? (
                              <span className="text-xs text-emerald-700 dark:text-emerald-400 font-medium">Set ✓</span>
                            ) : (
                              <span className="text-xs text-orange-600 dark:text-orange-400">Not set</span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${p.isActive ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300" : "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400"}`}>
                              {p.isActive ? "Active" : "Inactive"}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-1 justify-end">
                              <button
                                onClick={() => openEditPlatform(p)}
                                className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-bpi-dark-accent text-muted-foreground hover:text-foreground transition-colors"
                                title="Edit"
                              >
                                <Pencil className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => togglePlatformActive.mutate({ id: p.id })}
                                className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-bpi-dark-accent text-muted-foreground hover:text-foreground transition-colors"
                                title={p.isActive ? "Deactivate" : "Activate"}
                                disabled={togglePlatformActive.isPending}
                              >
                                {p.isActive ? <ToggleRight className="w-4 h-4 text-green-600" /> : <ToggleLeft className="w-4 h-4" />}
                              </button>
                              <button
                                onClick={() => {
                                  if (deletingPlatformId) return;
                                  if (confirmDeletePlatformId !== p.id) {
                                    setConfirmDeletePlatformId(p.id);
                                    toast("Click delete again within 5 seconds to confirm.");
                                    return;
                                  }
                                  setConfirmDeletePlatformId(null);
                                  deletePlatform.mutate({ id: p.id });
                                }}
                                className={`p-1.5 rounded transition-colors ${confirmDeletePlatformId === p.id ? "bg-red-100 dark:bg-red-900/20 text-red-600" : "hover:bg-red-50 dark:hover:bg-red-900/20 text-muted-foreground hover:text-red-600"}`}
                                title={confirmDeletePlatformId === p.id ? "Click again to confirm delete" : "Delete"}
                                disabled={deletePlatform.isPending || deletingPlatformId === p.id}
                              >
                                {deletingPlatformId === p.id ? (
                                  <RefreshCw className="w-4 h-4 animate-spin" />
                                ) : (
                                  <Trash2 className={`w-4 h-4 ${confirmDeletePlatformId === p.id ? "animate-pulse" : ""}`} />
                                )}
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* ── Platform Analytics + Reset Tool ─────────────────────────────── */}
        <div className="rounded-2xl border border-bpi-border dark:border-bpi-dark-accent bg-white dark:bg-bpi-dark-card p-4">
          <div className="flex items-center justify-between gap-3 mb-3">
            <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-bpi-primary" />
              Platform Activity Analytics
            </h2>
            {loadingPlatformAnalytics && <span className="text-xs text-muted-foreground">Loading...</span>}
          </div>

          <div className="overflow-x-auto mb-4">
            <table className="w-full min-w-[980px] text-sm">
              <thead>
                <tr className="text-left text-muted-foreground border-b border-bpi-border dark:border-bpi-dark-accent">
                  <th className="px-3 py-2">Platform</th>
                  <th className="px-3 py-2">Owner</th>
                  <th className="px-3 py-2">Submissions</th>
                  <th className="px-3 py-2">Registrations</th>
                  <th className="px-3 py-2">Owner Downlines</th>
                  <th className="px-3 py-2">Downline Submitted</th>
                  <th className="px-3 py-2">Downline Registered</th>
                  <th className="px-3 py-2">Completion</th>
                  <th className="px-3 py-2">Recent Activity</th>
                </tr>
              </thead>
              <tbody>
                {(platformAnalytics || []).length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-3 py-8 text-center text-muted-foreground">
                      No platform analytics yet. Activity will appear after link submissions or registrations.
                                          No platform analytics yet. Activity will appear after users submit their referral links.
                    </td>
                  </tr>
                ) : (
                  (platformAnalytics || []).map((row: any) => (
                    <tr key={row.platformId} className="border-b border-bpi-border/60 dark:border-bpi-dark-accent/60">
                      <td className="px-3 py-2">
                        <div className="font-medium text-foreground">{row.platformName}</div>
                        <div className="text-xs text-muted-foreground">{row.isActive ? "Active" : "Inactive"}</div>
                      </td>
                      <td className="px-3 py-2">
                        <div className="text-foreground">{row.ownerName}</div>
                        <div className="text-xs text-muted-foreground">{row.ownerRole || "—"}</div>
                      </td>
                      <td className="px-3 py-2">{row.totalSubmissions}</td>
                      <td className="px-3 py-2">{row.totalRegistrations}</td>
                      <td className="px-3 py-2">{row.ownerDownlines}</td>
                      <td className="px-3 py-2">{row.downlineSubmissions}</td>
                      <td className="px-3 py-2">{row.downlineRegistrations}</td>
                      <td className="px-3 py-2">
                        <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
                          {row.downlineCompletionRate}%
                        </span>
                      </td>
                      <td className="px-3 py-2">
                        {row.recentSubmissions?.length ? (
                          <div className="text-xs text-muted-foreground">
                            Latest: {row.recentSubmissions[0].userName} • {new Date(row.recentSubmissions[0].createdAt).toLocaleDateString()}
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">No submissions</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="rounded-xl border border-amber-200 dark:border-amber-900/40 bg-amber-50/60 dark:bg-amber-900/10 p-4">
            <h3 className="text-sm font-semibold text-foreground mb-3">Test Reset: Clear User Platform Submission</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1">Find User</label>
                <input
                  value={resetUserQuery}
                  onChange={(e) => {
                    setResetUserQuery(e.target.value);
                    setSelectedResetUserId("");
                  }}
                  placeholder="Search by name or email"
                  className="w-full rounded-lg border border-bpi-border dark:border-bpi-dark-accent bg-white dark:bg-bpi-dark-card px-3 py-2 text-sm"
                />
                {searchingResetUsers && <p className="text-xs text-muted-foreground mt-1">Searching users...</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1">Select User</label>
                <select
                  value={selectedResetUserId}
                  onChange={(e) => setSelectedResetUserId(e.target.value)}
                  className="w-full rounded-lg border border-bpi-border dark:border-bpi-dark-accent bg-white dark:bg-bpi-dark-card px-3 py-2 text-sm"
                >
                  <option value="">Choose user</option>
                  {(resetUserMatches || []).map((u: any) => (
                    <option key={u.id} value={u.id}>{u.name} ({u.email || "no-email"})</option>
                  ))}
                </select>
                {selectedResetUser && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Sponsor: {selectedResetUser.sponsorName || "None"}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1">Platform</label>
                <select
                  value={selectedResetPlatformId}
                  onChange={(e) => setSelectedResetPlatformId(e.target.value)}
                  className="w-full rounded-lg border border-bpi-border dark:border-bpi-dark-accent bg-white dark:bg-bpi-dark-card px-3 py-2 text-sm"
                >
                  <option value="">Choose platform</option>
                  {(platformList || []).map((p: any) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <label className="inline-flex items-center gap-2 text-sm text-foreground">
                <input
                  type="checkbox"
                  checked={resetRemoveRegistration}
                  onChange={(e) => setResetRemoveRegistration(e.target.checked)}
                  className="rounded"
                />
                Also clear registration record
              </label>
              <Button
                variant="destructive"
                onClick={handleResetSubmission}
                disabled={resetUserSubmission.isPending}
              >
                {resetUserSubmission.isPending ? "Resetting..." : "Reset Submission"}
              </Button>
            </div>
          </div>
        </div>

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
