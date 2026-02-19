"use client";

import { useEffect, useRef, useState } from "react";
import { Plus, Edit2, Trash2, Power, PowerOff, ExternalLink, Image as ImageIcon, MoveUp, MoveDown, Upload, X, UserCheck, Calendar, Shield } from "lucide-react";
import { api } from "@/client/trpc";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";
import AdminPageGuide from "@/components/admin/AdminPageGuide";

export default function ThirdPartyPlatformsPage() {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingPlatform, setEditingPlatform] = useState<any | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    registrationUrl: "",
    adminDefaultLink: "",
    category: "",
    logo: "",
  });

  const utils = api.useUtils();

  // Get all platforms (admin view)
  const { data: platforms, isLoading } = api.admin.getAllThirdPartyPlatforms.useQuery();

  // =========================
  // Executive Overpass
  // =========================
  const [overpassEmail, setOverpassEmail] = useState("");
  const [overpassMode, setOverpassMode] = useState<"PERMANENT" | "EXPIRES">("PERMANENT");
  const [overpassExpiryDate, setOverpassExpiryDate] = useState<string>(""); // YYYY-MM-DD
  const [debouncedOverpassEmail, setDebouncedOverpassEmail] = useState("");
  const [overpassEmailFocused, setOverpassEmailFocused] = useState(false);

  const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedOverpassEmail(overpassEmail.trim()), 500);
    return () => clearTimeout(t);
  }, [overpassEmail]);

  const {
    data: overpassPreview,
    isFetching: isFetchingPreview,
    error: overpassPreviewError,
  } = api.admin.getThirdPartyExecutiveOverpassPreview.useQuery(
    { email: debouncedOverpassEmail },
    {
      enabled: isValidEmail(debouncedOverpassEmail),
      refetchOnWindowFocus: false,
      staleTime: 0,
    }
  );

  const { data: overpassEmailMatches, isFetching: isFetchingMatches } =
    api.admin.searchThirdPartyExecutiveOverpassUsers.useQuery(
      { query: debouncedOverpassEmail, limit: 10 },
      {
        enabled: debouncedOverpassEmail.trim().length >= 2,
        refetchOnWindowFocus: false,
        staleTime: 0,
      }
    );

  const {
    data: activeOverpasses,
    isLoading: isLoadingOverpasses,
  } = api.admin.listThirdPartyExecutiveOverpasses.useQuery(undefined, {
    refetchOnWindowFocus: false,
    staleTime: 0,
  });

  const grantOverpassMutation = api.admin.grantThirdPartyExecutiveOverpass.useMutation({
    onSuccess: async () => {
      toast.success("Executive overpass granted");
      await utils.admin.listThirdPartyExecutiveOverpasses.invalidate();
      if (isValidEmail(debouncedOverpassEmail)) {
        await utils.admin.getThirdPartyExecutiveOverpassPreview.invalidate({
          email: debouncedOverpassEmail,
        });
      }
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const revokeOverpassMutation = api.admin.revokeThirdPartyExecutiveOverpass.useMutation({
    onSuccess: async () => {
      toast.success("Executive overpass revoked");
      await utils.admin.listThirdPartyExecutiveOverpasses.invalidate();
      if (isValidEmail(debouncedOverpassEmail)) {
        await utils.admin.getThirdPartyExecutiveOverpassPreview.invalidate({
          email: debouncedOverpassEmail,
        });
      }
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  // Mutations
  const createMutation = api.admin.createThirdPartyPlatform.useMutation({
    onSuccess: () => {
      toast.success("Platform created successfully");
      setIsAddModalOpen(false);
      resetForm();
      utils.admin.getAllThirdPartyPlatforms.invalidate();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const updateMutation = api.admin.updateThirdPartyPlatform.useMutation({
    onSuccess: () => {
      toast.success("Platform updated successfully");
      setEditingPlatform(null);
      resetForm();
      utils.admin.getAllThirdPartyPlatforms.invalidate();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const deleteMutation = api.admin.deleteThirdPartyPlatform.useMutation({
    onSuccess: () => {
      toast.success("Platform deleted successfully");
      utils.admin.getAllThirdPartyPlatforms.invalidate();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const toggleActiveMutation = api.admin.toggleThirdPartyPlatformStatus.useMutation({
    onSuccess: () => {
      utils.admin.getAllThirdPartyPlatforms.invalidate();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const reorderMutation = api.admin.reorderThirdPartyPlatform.useMutation({
    onSuccess: () => {
      utils.admin.getAllThirdPartyPlatforms.invalidate();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      registrationUrl: "",
      adminDefaultLink: "",
      category: "",
      logo: "",
    });
    setUploadProgress(0);
    setUploadingImage(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image size must be less than 5MB");
      return;
    }

    setUploadingImage(true);
    setUploadProgress(0);

    try {
      // Create form data
      const formDataObj = new FormData();
      formDataObj.append("file", file);
      formDataObj.append("folder", "third-party-platforms");

      // Simulate progress (since we can't track actual upload progress easily)
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      // Upload to your server endpoint
      const response = await fetch("/api/upload", {
        method: "POST",
        body: formDataObj,
      });

      clearInterval(progressInterval);

      if (!response.ok) {
        throw new Error("Upload failed");
      }

      const data = await response.json();
      setUploadProgress(100);
      
      setTimeout(() => {
        setFormData({ ...formData, logo: data.url });
        toast.success("Image uploaded successfully");
        setUploadingImage(false);
        setUploadProgress(0);
      }, 500);
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Failed to upload image");
      setUploadingImage(false);
      setUploadProgress(0);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleRemoveImage = () => {
    setFormData({ ...formData, logo: "" });
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleEdit = (platform: any) => {
    setEditingPlatform(platform);
    setFormData({
      name: platform.name,
      description: platform.description || "",
      registrationUrl: platform.registrationUrl || "",
      adminDefaultLink: platform.adminDefaultLink || "",
      category: platform.category || "",
      logo: platform.logo || "",
    });
    setIsAddModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast.error("Platform name is required");
      return;
    }

    if (editingPlatform) {
      updateMutation.mutate({
        id: editingPlatform.id,
        ...formData,
      });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleDelete = (platform: any) => {
    toast.custom((t) => (
      <div className="w-full max-w-sm rounded-lg border border-bpi-border bg-white p-3 shadow-lg dark:border-bpi-dark-accent dark:bg-bpi-dark-card">
        <div className="text-sm text-foreground">Delete "{platform.name}"?</div>
        <div className="mt-2 flex items-center justify-end gap-2">
          <button
            onClick={() => toast.dismiss(t.id)}
            className="rounded px-2 py-1 text-xs text-muted-foreground hover:bg-gray-50 dark:hover:bg-bpi-dark-accent/30"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              toast.dismiss(t.id);
              deleteMutation.mutate({ id: platform.id });
            }}
            className="rounded bg-red-600 px-2 py-1 text-xs text-white hover:bg-red-700"
          >
            Delete
          </button>
        </div>
      </div>
    ));
  };

  const handleToggleActive = (platform: any) => {
    toggleActiveMutation.mutate({ id: platform.id, isActive: !platform.isActive });
  };

  const handleReorder = (platformId: string, direction: 'up' | 'down') => {
    reorderMutation.mutate({ id: platformId, direction });
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="text-center">Loading third-party platforms...</div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Third-Party Opportunities</h1>
          <p className="text-sm text-muted-foreground">Manage external platform integrations</p>
        </div>
        <Button
          onClick={() => {
            resetForm();
            setEditingPlatform(null);
            setIsAddModalOpen(true);
          }}
          className="flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Platform
        </Button>
      </div>

      <div className="flex flex-col gap-6 mb-6">
        <div className="order-1">
          {/* User Guide */}
          <AdminPageGuide
            title="Third-Party Opportunities Guide"
            sections={[
              {
                title: "Third-Party Platform Overview",
                icon: <ExternalLink className="w-5 h-5 text-blue-600" />,
                items: [
                  "Promote <strong>external earning opportunities</strong> to BPI members",
                  "Integrate <strong>partner platforms</strong> (surveys, freelancing, affiliate programs)",
                  "Provide <strong>registration links</strong> with optional BPI tracking",
                  "<strong>Admin default links</strong> for platforms requiring admin accounts",
                  "<strong>Reorder platforms</strong> to prioritize best opportunities",
                  "<strong>Active/inactive</strong> status control without deleting data"
                ]
              },
              {
                title: "Adding New Platforms",
                icon: <Plus className="w-5 h-5 text-green-600" />,
                type: "ol",
                items: [
                  "<strong>Click 'Add Platform'</strong> - Opens platform creation modal",
                  "<strong>Enter platform name</strong> - Clear, recognizable name (e.g., 'Fiverr', 'Survey Junkie')",
                  "<strong>Add description</strong> - Brief explanation of earning opportunity (2-3 sentences)",
                  "<strong>Registration URL</strong> - Direct link for users to sign up (include referral code if applicable)",
                  "<strong>Admin default link</strong> - Admin portal URL or dashboard (optional)",
                  "<strong>Select category</strong> - Classify platform (Surveys, Freelancing, Crypto, etc.)",
                  "<strong>Upload logo</strong> - Platform logo image (PNG/JPG, recommended 200x200px)",
                  "<strong>Set active status</strong> - Toggle on to make visible to users immediately"
                ]
              },
              {
                title: "Platform Categories",
                icon: <ImageIcon className="w-5 h-5 text-orange-600" />,
                items: [
                  "<strong>Surveys</strong> - Paid survey platforms (Swagbucks, InboxDollars)",
                  "<strong>Freelancing</strong> - Skill-based work (Fiverr, Upwork, Freelancer)",
                  "<strong>Crypto</strong> - Cryptocurrency earning/trading platforms",
                  "<strong>Affiliate Marketing</strong> - Referral-based income opportunities",
                  "<strong>E-commerce</strong> - Online selling platforms (eBay, Etsy, Amazon)",
                  "<strong>Other</strong> - Miscellaneous opportunities not fitting above categories"
                ]
              },
              {
                title: "Platform Reordering",
                icon: <MoveUp className="w-5 h-5 text-purple-600" />,
                items: [
                  "<strong>Move Up/Down</strong> - Click arrow buttons to adjust display order",
                  "<strong>Top positions</strong> - Most visible to users, highest engagement",
                  "<strong>Strategic ordering</strong> - Place best-paying/easiest platforms first",
                  "<strong>Seasonal adjustments</strong> - Reorder based on platform availability",
                  "<strong>Test performance</strong> - Track which positions get most clicks",
                  "Order changes are <strong>immediate</strong> - reflect instantly on user dashboards"
                ]
              },
              {
                title: "Logo Upload & Branding",
                icon: <Upload className="w-5 h-5 text-blue-600" />,
                items: [
                  "<strong>Click upload button</strong> - Select logo image from device",
                  "<strong>Supported formats</strong> - JPG, JPEG, PNG (max 2MB)",
                  "<strong>Recommended size</strong> - 200x200px square for best display",
                  "<strong>Upload progress</strong> - Real-time percentage shown",
                  "<strong>Auto-optimization</strong> - Images compressed for fast loading",
                  "<strong>Remove/replace</strong> - Click X to delete, re-upload to change"
                ]
              }
            ]}
            features={[
              "Add/edit/delete third-party platforms",
              "Logo upload & display",
              "Category classification",
              "Registration URL tracking",
              "Admin portal links",
              "Platform reordering (priority)",
              "Active/inactive status toggle",
              "Description & branding management"
            ]}
            proTip="For <strong>maximum user engagement</strong>, add <strong>5-10 high-quality platforms</strong> with <strong>clear earning potential</strong>. Include your <strong>BPI referral code</strong> in registration URLs to earn commissions. Order platforms by <strong>ease of use</strong> (easiest first) to reduce user drop-off. Update descriptions regularly with <strong>current payout rates</strong> to maintain trust. Test all links monthly to ensure they're <strong>not broken</strong>."
            warning="Always <strong>verify platform legitimacy</strong> before adding - scam platforms damage BPI's credibility. <strong>Registration URLs with referral codes</strong> should comply with both platform's and BPI's terms of service. <strong>Deleting a platform is permanent</strong> - consider deactivating instead to preserve click history. <strong>Admin default links</strong> should never contain sensitive credentials."
          />
        </div>

        {/* Executive Overpass */}
        <div className="order-2 bg-white dark:bg-bpi-dark-card border border-bpi-border dark:border-bpi-dark-accent rounded-xl overflow-hidden">
        <div className="p-5 border-b border-bpi-border dark:border-bpi-dark-accent flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-bpi-primary/10 flex items-center justify-center">
              <Shield className="w-5 h-5 text-bpi-primary" />
            </div>
            <div>
              <div className="text-lg font-semibold text-foreground">Executive Overpass</div>
              <div className="text-sm text-muted-foreground">
                Bypass sponsor dependency for Third-Party Opportunities only
              </div>
            </div>
          </div>
          <div className="text-xs text-muted-foreground whitespace-nowrap">
            Expiry is end-of-day (server time)
          </div>
        </div>

        <div className="p-5 grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Email lookup */}
          <div className="lg:col-span-1 space-y-3 relative">
            <label className="text-sm font-medium text-foreground">User Email</label>
            <input
              type="email"
              value={overpassEmail}
              onChange={(e) => setOverpassEmail(e.target.value)}
              onFocus={() => setOverpassEmailFocused(true)}
              onBlur={() => {
                setTimeout(() => setOverpassEmailFocused(false), 150);
              }}
              placeholder="Enter user email"
              className="w-full px-3 py-2 border border-bpi-border dark:border-bpi-dark-accent rounded bg-white dark:bg-bpi-dark-card text-foreground"
            />

            {overpassEmailFocused && (overpassEmailMatches?.length || 0) > 0 && (
                <div className="absolute z-50 mt-1 w-full rounded-lg border border-bpi-border bg-white shadow-lg dark:border-bpi-dark-accent dark:bg-bpi-dark-card overflow-hidden">
                  <div className="px-3 py-2 text-xs text-muted-foreground border-b border-bpi-border dark:border-bpi-dark-accent flex items-center justify-between">
                    <span>
                      {isFetchingMatches ? "Searching…" : `Matches (${overpassEmailMatches?.length || 0})`}
                    </span>
                    <span className="text-[11px]">Click to select</span>
                  </div>
                  <div className="max-h-56 overflow-auto">
                    {overpassEmailMatches?.map((m: any) => (
                      <button
                        key={m.id}
                        type="button"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => {
                          setOverpassEmail(m.email);
                          setOverpassEmailFocused(false);
                        }}
                        className="w-full px-3 py-2 text-left hover:bg-gray-50 dark:hover:bg-bpi-dark-accent/30 transition-colors"
                      >
                        <div className="text-sm font-medium text-foreground">
                          {m.fullName || m.email}
                        </div>
                        <div className="text-xs text-muted-foreground">{m.email}</div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

            {overpassEmail.trim().length > 0 &&
              !isValidEmail(overpassEmail.trim()) &&
              (overpassEmailMatches?.length || 0) === 0 && (
                <div className="text-xs text-red-600">Please enter a valid email address</div>
              )}
            {isFetchingPreview && isValidEmail(debouncedOverpassEmail) && (
              <div className="text-xs text-muted-foreground">Validating email…</div>
            )}
            {overpassPreviewError && isValidEmail(debouncedOverpassEmail) && (
              <div className="text-xs text-red-600">
                {(overpassPreviewError as any)?.message || "Lookup failed"}
              </div>
            )}
          </div>

          {/* Preview */}
          <div className="lg:col-span-2 space-y-3">
            <div className="flex items-center gap-2 text-sm font-medium text-foreground">
              <UserCheck className="w-4 h-4" />
              Validation Result
            </div>

            {overpassPreview ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="rounded-lg border border-bpi-border dark:border-bpi-dark-accent p-4 bg-gray-50 dark:bg-bpi-dark-accent/20">
                  <div className="text-xs text-muted-foreground">User</div>
                  <div className="text-sm font-semibold text-foreground">
                    {overpassPreview.user.fullName || overpassPreview.user.email}
                  </div>
                  <div className="text-xs text-muted-foreground">{overpassPreview.user.email}</div>
                </div>

                <div className="rounded-lg border border-bpi-border dark:border-bpi-dark-accent p-4 bg-gray-50 dark:bg-bpi-dark-accent/20">
                  <div className="text-xs text-muted-foreground">Immediate Sponsor</div>
                  <div className="text-sm font-semibold text-foreground">
                    {overpassPreview.sponsor?.fullName || "No sponsor"}
                  </div>
                  <div className="text-xs text-muted-foreground">{overpassPreview.sponsor?.email || "-"}</div>
                </div>

                <div className="rounded-lg border border-bpi-border dark:border-bpi-dark-accent p-4 bg-gray-50 dark:bg-bpi-dark-accent/20">
                  <div className="text-xs text-muted-foreground">Membership Status</div>
                  <div className="text-sm font-semibold text-foreground">
                    {overpassPreview.membership.isActivated ? "Activated" : "Not activated"}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Plan: {overpassPreview.membership.planName || "-"}
                  </div>
                </div>

                <div className="rounded-lg border border-bpi-border dark:border-bpi-dark-accent p-4 bg-gray-50 dark:bg-bpi-dark-accent/20">
                  <div className="text-xs text-muted-foreground">Active Overpass</div>
                  <div className="text-sm font-semibold text-foreground">
                    {overpassPreview.overpass.isActive ? "Yes" : "No"}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Expires: {overpassPreview.overpass.expiresAt ? new Date(overpassPreview.overpass.expiresAt).toLocaleDateString() : "Permanent / N/A"}
                  </div>
                </div>

                <div className="md:col-span-2 rounded-lg border border-bpi-border dark:border-bpi-dark-accent p-4 bg-white dark:bg-bpi-dark-card">
                  <div className="flex flex-col md:flex-row md:items-end gap-3 justify-between">
                    <div className="flex-1">
                      <div className="text-xs text-muted-foreground mb-1">Overpass Mode</div>
                      <select
                        value={overpassMode}
                        onChange={(e) => setOverpassMode(e.target.value as any)}
                        className="w-full px-3 py-2 border border-bpi-border dark:border-bpi-dark-accent rounded bg-white dark:bg-bpi-dark-card text-foreground"
                      >
                        <option value="PERMANENT">Permanent</option>
                        <option value="EXPIRES">Expires</option>
                      </select>
                    </div>

                    <div className="flex-1">
                      <div className="text-xs text-muted-foreground mb-1 flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        Expiry Date
                      </div>
                      <input
                        type="date"
                        value={overpassExpiryDate}
                        onChange={(e) => setOverpassExpiryDate(e.target.value)}
                        disabled={overpassMode !== "EXPIRES"}
                        className="w-full px-3 py-2 border border-bpi-border dark:border-bpi-dark-accent rounded bg-white dark:bg-bpi-dark-card text-foreground disabled:opacity-50"
                      />
                      {overpassMode === "EXPIRES" && !overpassExpiryDate && (
                        <div className="text-xs text-muted-foreground mt-1">
                          Pick a date (end-of-day server time)
                        </div>
                      )}
                    </div>

                    <div className="flex gap-2 md:justify-end">
                      <Button
                        onClick={() => {
                          if (!overpassPreview?.user?.email) {
                            toast.error("Enter a valid user email");
                            return;
                          }
                          if (overpassMode === "EXPIRES" && !overpassExpiryDate) {
                            toast.error("Select an expiry date");
                            return;
                          }

                          const toastId = toast.loading("Granting executive overpass...");
                          grantOverpassMutation
                            .mutateAsync({
                              email: overpassPreview.user.email,
                              mode: overpassMode,
                              expiresOn: overpassMode === "EXPIRES" ? overpassExpiryDate : undefined,
                            })
                            .then(() => toast.success("Overpass granted", { id: toastId }))
                            .catch((e: any) => toast.error(e?.message || "Failed", { id: toastId }));
                        }}
                        disabled={grantOverpassMutation.isPending}
                        className="bg-bpi-primary hover:bg-bpi-primary/90"
                      >
                        {grantOverpassMutation.isPending ? "Granting…" : "Grant Overpass"}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="rounded-lg border border-dashed border-bpi-border dark:border-bpi-dark-accent p-6 text-sm text-muted-foreground">
                Enter a user email to validate and preview details.
              </div>
            )}
          </div>
        </div>

        {/* Tracking Table */}
        <div className="border-t border-bpi-border dark:border-bpi-dark-accent">
          <div className="p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="text-sm font-semibold text-foreground">Active Executive Overpasses</div>
              <div className="text-xs text-muted-foreground">
                {isLoadingOverpasses ? "Loading…" : `${activeOverpasses?.length || 0} active`}
              </div>
            </div>

            <div className="overflow-x-auto rounded-lg border border-bpi-border dark:border-bpi-dark-accent">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-50 dark:bg-bpi-dark-accent/30">
                  <tr>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground">User</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground">Sponsor</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground">Mode</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground">Expires</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground">Granted</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {activeOverpasses?.map((row: any) => (
                    <tr key={row.id} className="border-t border-bpi-border dark:border-bpi-dark-accent">
                      <td className="px-4 py-3">
                        <div className="font-medium text-foreground">{row.user.fullName || row.user.email}</div>
                        <div className="text-xs text-muted-foreground">{row.user.email}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-foreground">{row.sponsor?.fullName || "No sponsor"}</div>
                        <div className="text-xs text-muted-foreground">{row.sponsor?.email || "-"}</div>
                      </td>
                      <td className="px-4 py-3 text-foreground">{row.expiresAt ? "Expires" : "Permanent"}</td>
                      <td className="px-4 py-3 text-foreground">
                        {row.expiresAt ? new Date(row.expiresAt).toLocaleDateString() : "-"}
                      </td>
                      <td className="px-4 py-3 text-foreground">{new Date(row.grantedAt).toLocaleDateString()}</td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => {
                            toast.custom((t) => (
                              <div className="w-full max-w-sm rounded-lg border border-bpi-border bg-white p-3 shadow-lg dark:border-bpi-dark-accent dark:bg-bpi-dark-card">
                                <div className="text-sm text-foreground">Revoke overpass for {row.user.email}?</div>
                                <div className="mt-2 flex items-center justify-end gap-2">
                                  <button
                                    onClick={() => toast.dismiss(t.id)}
                                    className="rounded px-2 py-1 text-xs text-muted-foreground hover:bg-gray-50 dark:hover:bg-bpi-dark-accent/30"
                                  >
                                    Cancel
                                  </button>
                                  <button
                                    onClick={() => {
                                      toast.dismiss(t.id);
                                      const toastId = toast.loading("Revoking overpass...");
                                      revokeOverpassMutation
                                        .mutateAsync({ userId: row.userId })
                                        .then(() => toast.success("Overpass revoked", { id: toastId }))
                                        .catch((e: any) => toast.error(e?.message || "Failed", { id: toastId }));
                                    }}
                                    className="rounded bg-red-600 px-2 py-1 text-xs text-white hover:bg-red-700"
                                  >
                                    Revoke
                                  </button>
                                </div>
                              </div>
                            ));
                          }}
                          className="px-3 py-1.5 rounded bg-red-50 text-red-700 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-300"
                          disabled={revokeOverpassMutation.isPending}
                        >
                          Revoke
                        </button>
                      </td>
                    </tr>
                  ))}
                  {!isLoadingOverpasses && (!activeOverpasses || activeOverpasses.length === 0) && (
                    <tr>
                      <td className="px-4 py-8 text-center text-muted-foreground" colSpan={6}>
                        No active executive overpasses.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
        </div>
      </div>

      {/* Platforms List */}
      <div className="grid gap-4">
        {platforms && platforms.length > 0 ? (
          platforms.map((platform: any, index: number) => (
            <div
              key={platform.id}
              className="bg-white dark:bg-bpi-dark-card border border-bpi-border dark:border-bpi-dark-accent rounded-lg p-4"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-4 flex-1">
                  {platform.logo ? (
                    <img
                      src={platform.logo}
                      alt={platform.name}
                      className="w-12 h-12 rounded object-cover"
                    />
                  ) : (
                    <div className="w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded flex items-center justify-center">
                      <ImageIcon className="w-6 h-6 text-gray-400" />
                    </div>
                  )}
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-foreground">{platform.name}</h3>
                      {platform.isActive ? (
                        <span className="px-2 py-0.5 text-xs bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 rounded">
                          Active
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 text-xs bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400 rounded">
                          Inactive
                        </span>
                      )}
                      {platform.category && (
                        <span className="px-2 py-0.5 text-xs bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 rounded">
                          {platform.category}
                        </span>
                      )}
                    </div>
                    {platform.description && (
                      <p className="text-sm text-muted-foreground mt-1">{platform.description}</p>
                    )}
                    <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                      {platform.registrationUrl && (
                        <a
                          href={platform.registrationUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 hover:text-bpi-primary"
                        >
                          <ExternalLink className="w-3 h-3" />
                          Registration URL
                        </a>
                      )}
                      {platform.adminDefaultLink && (
                        <a
                          href={platform.adminDefaultLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 hover:text-bpi-primary"
                        >
                          <ExternalLink className="w-3 h-3" />
                          Admin Link
                        </a>
                      )}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  {/* Reorder */}
                  <div className="flex flex-col gap-1">
                    <button
                      onClick={() => handleReorder(platform.id, 'up')}
                      disabled={index === 0}
                      className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      <MoveUp className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleReorder(platform.id, 'down')}
                      disabled={index === platforms.length - 1}
                      className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      <MoveDown className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Toggle Active */}
                  <button
                    onClick={() => handleToggleActive(platform)}
                    className={`p-2 rounded ${
                      platform.isActive
                        ? "text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20"
                        : "text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
                    }`}
                    title={platform.isActive ? "Deactivate" : "Activate"}
                  >
                    {platform.isActive ? (
                      <Power className="w-4 h-4" />
                    ) : (
                      <PowerOff className="w-4 h-4" />
                    )}
                  </button>

                  {/* Edit */}
                  <button
                    onClick={() => handleEdit(platform)}
                    className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>

                  {/* Delete */}
                  <button
                    onClick={() => handleDelete(platform)}
                    className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-12 text-muted-foreground">
            No platforms configured yet. Click "Add Platform" to get started.
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-bpi-dark-card rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-xl font-bold mb-4">
                {editingPlatform ? "Edit Platform" : "Add New Platform"}
              </h2>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Platform Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-bpi-border dark:border-bpi-dark-accent rounded bg-white dark:bg-bpi-dark-card text-foreground"
                    placeholder="e.g., Binance, Kucoin"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-3 py-2 border border-bpi-border dark:border-bpi-dark-accent rounded bg-white dark:bg-bpi-dark-card text-foreground"
                    rows={3}
                    placeholder="Brief description of the platform"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Category</label>
                  <input
                    type="text"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3 py-2 border border-bpi-border dark:border-bpi-dark-accent rounded bg-white dark:bg-bpi-dark-card text-foreground"
                    placeholder="e.g., Crypto Exchange, Investment"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Platform Logo</label>
                  
                  {/* Image Preview */}
                  {formData.logo && (
                    <div className="relative mb-3 inline-block">
                      <img
                        src={formData.logo}
                        alt="Platform logo"
                        className="w-32 h-32 object-cover rounded-lg border border-bpi-border dark:border-bpi-dark-accent"
                      />
                      <button
                        type="button"
                        onClick={handleRemoveImage}
                        className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  )}

                  {/* Upload Section */}
                  <div className="space-y-2 mb-3">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                      id="logo-upload"
                      disabled={uploadingImage}
                    />
                    <label
                      htmlFor="logo-upload"
                      className={`flex items-center justify-center gap-2 px-4 py-2 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${
                        uploadingImage
                          ? "border-gray-300 bg-gray-50 dark:bg-gray-800 cursor-not-allowed"
                          : "border-bpi-border dark:border-bpi-dark-accent hover:border-bpi-primary hover:bg-bpi-primary/5"
                      }`}
                    >
                      {uploadingImage ? (
                        <>
                          <div className="w-5 h-5 border-2 border-bpi-primary border-t-transparent rounded-full animate-spin" />
                          <span className="text-sm">Uploading... {uploadProgress}%</span>
                        </>
                      ) : (
                        <>
                          <Upload className="w-5 h-5 text-bpi-primary" />
                          <span className="text-sm text-foreground">
                            {formData.logo ? "Change Image" : "Upload Image"}
                          </span>
                        </>
                      )}
                    </label>

                    {/* Upload Progress Bar */}
                    {uploadingImage && (
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-gradient-to-r from-orange-500 to-green-500 h-full transition-all duration-300 ease-out"
                          style={{ width: `${uploadProgress}%` }}
                        />
                      </div>
                    )}
                  </div>

                  {/* Manual URL Input */}
                  <div>
                    <div className="text-xs text-muted-foreground text-center my-2">or enter URL manually</div>
                    <input
                      type="url"
                      value={formData.logo}
                      onChange={(e) => setFormData({ ...formData, logo: e.target.value })}
                      className="w-full px-3 py-2 border border-bpi-border dark:border-bpi-dark-accent rounded bg-white dark:bg-bpi-dark-card text-foreground"
                      placeholder="https://example.com/logo.png"
                      disabled={uploadingImage}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Maximum file size: 5MB. Supported formats: JPG, PNG, GIF, SVG
                    </p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Registration URL</label>
                  <input
                    type="url"
                    value={formData.registrationUrl}
                    onChange={(e) => setFormData({ ...formData, registrationUrl: e.target.value })}
                    className="w-full px-3 py-2 border border-bpi-border dark:border-bpi-dark-accent rounded bg-white dark:bg-bpi-dark-card text-foreground"
                    placeholder="https://platform.com/register"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Admin Default Referral Link</label>
                  <input
                    type="url"
                    value={formData.adminDefaultLink}
                    onChange={(e) => setFormData({ ...formData, adminDefaultLink: e.target.value })}
                    className="w-full px-3 py-2 border border-bpi-border dark:border-bpi-dark-accent rounded bg-white dark:bg-bpi-dark-card text-foreground"
                    placeholder="https://platform.com/ref/admin123"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    This link will be shown to users whose upline hasn't submitted their link yet
                  </p>
                </div>

                <div className="flex items-center gap-2 pt-4">
                  <Button
                    type="submit"
                    disabled={createMutation.isPending || updateMutation.isPending}
                    className="flex-1"
                  >
                    {createMutation.isPending || updateMutation.isPending ? (
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        {editingPlatform ? "Updating..." : "Creating..."}
                      </div>
                    ) : (
                      <>{editingPlatform ? "Update Platform" : "Create Platform"}</>
                    )}
                  </Button>
                  <Button
                    type="button"
                    onClick={() => {
                      setIsAddModalOpen(false);
                      setEditingPlatform(null);
                      resetForm();
                    }}
                    variant="outline"
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
