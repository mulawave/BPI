"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { api } from "../../../client/trpc";
import { motion, AnimatePresence } from "framer-motion";
import CommunityUpdateModal from "../../../components/admin/CommunityUpdateModal";
import BestDealModal from "../../../components/admin/BestDealModal";
import NotificationBroadcastModal from "../../../components/admin/NotificationBroadcastModal";
import {
  HiPlus,
  HiRefresh,
  HiSearch,
  HiX,
  HiEye,
  HiPencil,
  HiTrash,
  HiBell,
  HiTag,
  HiCalendar,
  HiCheckCircle,
  HiXCircle,
  HiClock,
  HiExclamation,
  HiSpeakerphone,
  HiLink,
  HiInformationCircle,
  HiDocumentText,
  HiUser,
} from "react-icons/hi";
import toast from "react-hot-toast";
import { format } from "date-fns";
import StatsCard from "@/components/admin/StatsCard";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import AdminPageGuide from "@/components/admin/AdminPageGuide";

type TabType = "updates" | "deals";
type TrendPoint = { label: string; value: number };
type ReadDistribution = { day: string; count: number };
type ClaimDistribution = { day: string; count: number };
type AuditEntry = {
  id: string;
  action: string;
  status?: string;
  User?: { name?: string | null; email?: string | null };
  userId?: string;
  createdAt: string | Date;
};

export default function CommunityManagementPage() {
  const [activeTab, setActiveTab] = useState<TabType>("updates");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [showActiveOnly, setShowActiveOnly] = useState(false);

  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [selectedUpdate, setSelectedUpdate] = useState<any>(null);
  const [showUpdateDetails, setShowUpdateDetails] = useState(false);
  const [confirmDeleteUpdateId, setConfirmDeleteUpdateId] = useState<string | null>(null);

  const [showNotificationModal, setShowNotificationModal] = useState(false);

  const [showDealModal, setShowDealModal] = useState(false);
  const [selectedDeal, setSelectedDeal] = useState<any>(null);
  const [showDealDetails, setShowDealDetails] = useState(false);
  const [confirmDeleteDealId, setConfirmDeleteDealId] = useState<string | null>(null);
  const [dealDeactivationReason, setDealDeactivationReason] = useState("");

  const updateModalRef = useRef<HTMLDivElement | null>(null);
  const [updateStatusAnnouncement, setUpdateStatusAnnouncement] = useState("");

  const [updatesPage, setUpdatesPage] = useState(1);
  const [dealsPage, setDealsPage] = useState(1);

  const { data: updatesData, refetch: refetchUpdates } = api.admin.getCommunityUpdates.useQuery({
    page: updatesPage,
    limit: 20,
    category: selectedCategory || undefined,
    isActive: showActiveOnly ? true : undefined,
    search: searchQuery || undefined,
  });

  const { data: dealsData, refetch: refetchDeals } = api.admin.getBestDeals.useQuery({
    page: dealsPage,
    limit: 20,
    isActive: showActiveOnly ? true : undefined,
    search: searchQuery || undefined,
  });

  const { data: updateDetails, isFetching: updateDetailsLoading, refetch: refetchUpdateDetails } =
    api.admin.getCommunityUpdateDetails.useQuery(
      { updateId: selectedUpdate?.id || "" },
      { enabled: !!selectedUpdate?.id && showUpdateDetails }
    );

  const { data: dealDetails, isFetching: dealDetailsLoading, refetch: refetchDealDetails } =
    api.admin.getBestDealDetails.useQuery(
      { dealId: selectedDeal?.id || "" },
      { enabled: !!selectedDeal?.id && showDealDetails }
    );

  const deleteUpdateMutation = api.admin.deleteCommunityUpdate.useMutation({
    onSuccess: () => {
      toast.success("Update deleted successfully");
      refetchUpdates();
      setShowUpdateDetails(false);
      setSelectedUpdate(null);
    },
    onError: (error: any) => toast.error(`Failed to delete update: ${error.message}`),
  });

  const toggleUpdateMutation = api.admin.updateCommunityUpdate.useMutation({
    onSuccess: (data) => {
      toast.success("Update status changed");
      setUpdateStatusAnnouncement(data?.isActive ? "Update activated" : "Update deactivated");
      refetchUpdates();
      refetchUpdateDetails();
    },
    onError: (error: any) => toast.error(error.message || "Failed to update status"),
  });

  const toggleDealMutation = api.admin.updateBestDeal.useMutation({
    onSuccess: () => {
      toast.success("Deal status updated");
      refetchDeals();
      refetchDealDetails();
      setDealDeactivationReason("");
    },
    onError: (error: any) => toast.error(error.message || "Failed to update deal"),
  });

  const deleteDealMutation = api.admin.deleteDeal.useMutation({
    onSuccess: () => {
      toast.success("Deal deleted");
      refetchDeals();
      setShowDealDetails(false);
      setSelectedDeal(null);
    },
    onError: (error: any) => toast.error(error.message || "Failed to delete deal"),
  });

  const handleDeleteUpdate = (updateId: string) => setConfirmDeleteUpdateId(updateId);

  const handleViewUpdate = (update: any) => {
    setSelectedUpdate(update);
    setShowUpdateDetails(true);
  };

  const handleViewDeal = (deal: any) => {
    setSelectedDeal(deal);
    setShowDealDetails(true);
  };

  const updateReadTrend: TrendPoint[] = useMemo(() => {
    const source: ReadDistribution[] = updateDetails?.readDistribution || [];
    return Array.from({ length: 7 }).map((_, idx) => {
      const date = new Date();
      date.setDate(date.getDate() - (6 - idx));
      const key = date.toISOString().slice(0, 10);
      const match = source.find((d) => d.day === key);
      return { label: format(date, "MMM dd"), value: match?.count || 0 };
    });
  }, [updateDetails]);

  const claimTrend: TrendPoint[] = useMemo(() => {
    const source: ClaimDistribution[] = dealDetails?.claimDistribution || [];
    return Array.from({ length: 7 }).map((_, idx) => {
      const date = new Date();
      date.setDate(date.getDate() - (6 - idx));
      const key = date.toISOString().slice(0, 10);
      const match = source.find((d) => d.day === key);
      return { label: format(date, "MMM dd"), value: match?.count || 0 };
    });
  }, [dealDetails]);

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      announcement: "bg-blue-500",
      news: "bg-purple-500",
      event: "bg-green-500",
      maintenance: "bg-orange-500",
      important: "bg-red-500",
    };
    return colors[category] || "bg-gray-500";
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case "HIGH": return <HiExclamation className="text-red-500" />;
      case "MEDIUM": return <HiClock className="text-orange-500" />;
      case "LOW": return <HiCheckCircle className="text-green-500" />;
      default: return <HiClock className="text-gray-500" />;
    }
  };

  const updateAttachments = useMemo(() => {
    if (updateDetails?.attachments?.length) return updateDetails.attachments;
    if (updateDetails?.imageUrl) {
      return [{ id: `${updateDetails.id}-image`, type: "image", url: updateDetails.imageUrl, label: "Hero image" }];
    }
    if (selectedUpdate?.imageUrl) {
      return [{ id: `${selectedUpdate.id}-image`, type: "image", url: selectedUpdate.imageUrl, label: "Hero image" }];
    }
    return [];
  }, [selectedUpdate, updateDetails]);

  const dealAttachments = useMemo(() => {
    if (dealDetails?.attachments?.length) return dealDetails.attachments;
    if (dealDetails?.imageUrl) {
      return [{ id: `${dealDetails.id}-image`, type: "image", url: dealDetails.imageUrl, label: "Hero image" }];
    }
    if (selectedDeal?.imageUrl) {
      return [{ id: `${selectedDeal.id}-image`, type: "image", url: selectedDeal.imageUrl, label: "Hero image" }];
    }
    return [];
  }, [selectedDeal, dealDetails]);

  useEffect(() => {
    if (updateDetails) {
      setUpdateStatusAnnouncement(updateDetails.isActive ? "Update is active" : "Update is inactive");
    }
  }, [updateDetails?.id, updateDetails?.isActive]);

  useEffect(() => {
    if (!dealDetails) return;
    if (dealDetails.deactivationReason) {
      setDealDeactivationReason(dealDetails.deactivationReason);
    } else if (!toggleDealMutation.isPending) {
      setDealDeactivationReason("");
    }
  }, [dealDetails?.id, dealDetails?.deactivationReason, toggleDealMutation.isPending]);

  useEffect(() => {
    if (!showUpdateDetails || !updateModalRef.current) return;
    const modal = updateModalRef.current;
    const focusable = modal.querySelectorAll<HTMLElement>("button, [href], input, select, textarea, [tabindex]:not([tabindex='-1'])");
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Tab" || focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey) {
        if (document.activeElement === first) {
          event.preventDefault();
          last?.focus();
        }
        return;
      }
      if (document.activeElement === last) {
        event.preventDefault();
        first?.focus();
      }
    };

    focusable[0]?.focus();
    modal.addEventListener("keydown", handleKeyDown);
    return () => modal.removeEventListener("keydown", handleKeyDown);
  }, [showUpdateDetails, updateDetailsLoading]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-green-50/30 dark:from-gray-900 dark:via-gray-800 dark:to-green-900/10 p-6">
      <ConfirmDialog
        isOpen={!!confirmDeleteUpdateId}
        title="Delete this update?"
        description="This will permanently remove the community update."
        confirmText={deleteUpdateMutation.isPending ? "Deleting..." : "Yes, delete"}
        cancelText="Cancel"
        onClose={() => setConfirmDeleteUpdateId(null)}
        onConfirm={() => {
          if (!confirmDeleteUpdateId) return;
          deleteUpdateMutation.mutate({ updateId: confirmDeleteUpdateId });
          setConfirmDeleteUpdateId(null);
        }}
      />
      <ConfirmDialog
        isOpen={!!confirmDeleteDealId}
        title="Delete this deal?"
        description="This will permanently remove the deal and its claims."
        confirmText={deleteDealMutation.isPending ? "Deleting..." : "Yes, delete"}
        cancelText="Cancel"
        onClose={() => setConfirmDeleteDealId(null)}
        onConfirm={() => {
          if (!confirmDeleteDealId) return;
          deleteDealMutation.mutate({ dealId: confirmDeleteDealId });
          setConfirmDeleteDealId(null);
        }}
      />

      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="premium-gradient-text text-4xl font-bold mb-2">Community Management</h1>
            <p className="text-muted-foreground font-medium">
              Manage community updates, announcements, and best deals
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowNotificationModal(true)}
              className="premium-button flex items-center gap-2 px-4 py-3 text-white rounded-xl shadow-lg font-semibold"
            >
              <HiSpeakerphone className="w-5 h-5" />
              <span className="hidden sm:inline">Broadcast</span>
            </button>
            <button
              onClick={() => activeTab === "updates" ? refetchUpdates() : refetchDeals()}
              className="p-3 bg-background/60 border border-border rounded-xl hover:bg-background transition-colors"
            >
              <HiRefresh className="w-5 h-5 text-foreground/70" />
            </button>
          </div>
        </div>

        {/* User Guide */}
        <AdminPageGuide
          title="Community Management Guide"
          sections={[
            {
              title: "Community Management Overview",
              icon: <HiSpeakerphone className="w-5 h-5 text-blue-600" />,
              items: [
                "Manage <strong>Community Updates</strong> to keep members informed about BPI news",
                "Create <strong>Best Deals</strong> to promote special offers and member perks",
                "Use <strong>Broadcast</strong> to send push notifications to all users",
                "Track engagement with views, reads, and claim statistics",
                "Schedule content or publish immediately"
              ]
            },
            {
              title: "Community Updates Management",
              icon: <HiBell className="w-5 h-5 text-green-600" />,
              type: "ol",
              items: [
                "<strong>Create Update</strong> - Click <strong>+ New</strong> to compose announcement",
                "<strong>Set category</strong> - Choose from Events, News, Alerts, Opportunities",
                "<strong>Add content</strong> - Write title, description, and optional image/link",
                "<strong>Set priority</strong> - Normal, Important, or Critical (affects notification style)",
                "<strong>Publish</strong> - Make active or save as draft for later",
                "<strong>Monitor engagement</strong> - Track views and read status"
              ]
            },
            {
              title: "Best Deals Management",
              icon: <HiTag className="w-5 h-5 text-orange-600" />,
              type: "ol",
              items: [
                "<strong>Create Deal</strong> - Click <strong>+ New Deal</strong> button",
                "<strong>Add details</strong> - Title, description, discount percentage, original/final price",
                "<strong>Set availability</strong> - Total claims allowed, time limit",
                "<strong>Upload image</strong> - Product/service image for visual appeal",
                "<strong>Activate deal</strong> - Make visible to members",
                "<strong>Track claims</strong> - Monitor how many users claimed the deal",
                "<strong>Deactivate when expired</strong> - Manually close or wait for auto-expiry"
              ]
            },
            {
              title: "Broadcast Notifications",
              icon: <HiSpeakerphone className="w-5 h-5 text-purple-600" />,
              items: [
                "Click <strong>Broadcast</strong> button to send system-wide notification",
                "<strong>Title & Message</strong> - Craft clear, actionable notification text",
                "<strong>Priority level</strong> - Info, Success, Warning, or Error",
                "<strong>Target users</strong> - All users, activated only, or specific segments",
                "Broadcasts appear in <strong>all user dashboards</strong> instantly",
                "Use for urgent announcements, maintenance alerts, or major updates"
              ]
            },
            {
              title: "Content Moderation & Analytics",
              icon: <HiInformationCircle className="w-5 h-5 text-blue-600" />,
              items: [
                "<strong>View details</strong> - Click on any update/deal to see full analytics",
                "<strong>Read distribution</strong> - Graph showing when users read content",
                "<strong>Claim trends</strong> - For deals, see claim patterns over time",
                "<strong>Edit anytime</strong> - Update content, change status, or extend deadlines",
                "<strong>Delete carefully</strong> - Removes all associated data permanently",
                "<strong>Audit log</strong> - Track all admin actions and changes"
              ]
            }
          ]}
          features={[
            "Create/edit community updates",
            "Manage best deals & promotions",
            "Broadcast push notifications",
            "Track views & engagement",
            "Category & priority filters",
            "Search updates & deals",
            "Claim tracking for deals",
            "Analytics dashboards"
          ]}
          proTip="For <strong>maximum engagement</strong>, publish community updates during <strong>peak hours (8-10 AM, 6-9 PM)</strong>. Use <strong>Critical priority</strong> sparingly to maintain its effectiveness. Best deals with <strong>limited claims (10-50)</strong> create urgency and drive faster action."
          warning="<strong>Broadcast notifications</strong> are sent to all users immediately and cannot be recalled. Always double-check content before broadcasting. Deleting active deals that users have claimed can cause confusion - consider deactivating instead."
        />

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-6">
          <StatsCard title="Updates" value={updatesData?.total || 0} icon={HiBell} color="green" />
          <StatsCard title="Deals" value={dealsData?.total || 0} icon={HiTag} color="orange" />
          <StatsCard title="Active Only" value={showActiveOnly ? "Yes" : "No"} icon={HiCheckCircle} color="blue" />
          <StatsCard
            title="Filters"
            value={(searchQuery ? 1 : 0) + (selectedCategory ? 1 : 0) + (showActiveOnly ? 1 : 0)}
            icon={HiSearch}
            color="purple"
          />
        </div>

        <div className="flex gap-4 mb-6">
          <button
            onClick={() => setActiveTab("updates")}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all ${
              activeTab === "updates"
                ? "bg-gradient-to-r from-[hsl(var(--primary))] to-[hsl(var(--secondary))] text-white shadow-lg"
                : "bg-card/75 border border-border text-muted-foreground hover:bg-background/60"
            }`}
          >
            <HiBell className="w-5 h-5" />
            Community Updates
            {updatesData && (
              <span className={`px-2 py-1 rounded-full text-xs ${
                activeTab === "updates" ? "bg-white/20" : "bg-gray-100 dark:bg-gray-700"
              }`}>
                {updatesData.total}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab("deals")}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all ${
              activeTab === "deals"
                ? "bg-gradient-to-r from-[hsl(var(--primary))] to-[hsl(var(--secondary))] text-white shadow-lg"
                : "bg-card/75 border border-border text-muted-foreground hover:bg-background/60"
            }`}
          >
            <HiTag className="w-5 h-5" />
            Best Deals
            {dealsData && (
              <span className={`px-2 py-1 rounded-full text-xs ${
                activeTab === "deals" ? "bg-white/20" : "bg-gray-100 dark:bg-gray-700"
              }`}>
                {dealsData.total}
              </span>
            )}
          </button>
        </div>

        <div className="bg-card/75 border border-border rounded-2xl p-6 mb-6 shadow-lg shadow-black/5 backdrop-blur-xl dark:shadow-black/20">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-2">
              <div className="relative">
                <HiSearch className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by title or description..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-background/50 border-2 border-border rounded-xl focus:outline-none focus:border-[hsl(var(--primary))] focus:ring-4 focus:ring-[hsl(var(--secondary))]/20 text-foreground placeholder:text-muted-foreground"
                />
              </div>
            </div>
            {activeTab === "updates" && (
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-4 py-3 bg-background/50 border-2 border-border rounded-xl focus:outline-none focus:border-[hsl(var(--primary))] text-foreground"
              >
                <option value="">All Categories</option>
                <option value="announcement">Announcement</option>
                <option value="news">News</option>
                <option value="event">Event</option>
                <option value="maintenance">Maintenance</option>
                <option value="important">Important</option>
              </select>
            )}
            <label className="flex items-center gap-3 px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl cursor-pointer">
              <input
                type="checkbox"
                checked={showActiveOnly}
                onChange={(e) => setShowActiveOnly(e.target.checked)}
                className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
              />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Active Only
              </span>
            </label>
          </div>
        </div>

        <button
          onClick={() => activeTab === "updates" ? setShowUpdateModal(true) : setShowDealModal(true)}
          className="mb-6 premium-button flex items-center gap-2 px-6 py-3 text-white rounded-xl shadow-lg font-semibold"
        >
          <HiPlus className="w-5 h-5" />
          Create {activeTab === "updates" ? "Update" : "Deal"}
        </button>

        <AnimatePresence mode="wait">
          {activeTab === "updates" && updatesData && (
            <motion.div
              key="updates"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-4"
            >
              {updatesData.updates.map((update: any) => (
                <motion.div
                  key={update.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6 shadow-sm hover:shadow-md transition-all"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium text-white ${getCategoryColor(update.category)}`}>
                          {update.category}
                        </span>
                        <div className="flex items-center gap-1">
                          {getPriorityIcon(update.priority)}
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {update.priority}
                          </span>
                        </div>
                        {update.isActive ? (
                          <div className="flex items-center gap-1 text-green-600 dark:text-green-400">
                            <HiCheckCircle className="w-4 h-4" />
                            <span className="text-xs font-medium">Active</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1 text-gray-400">
                            <HiXCircle className="w-4 h-4" />
                            <span className="text-xs font-medium">Inactive</span>
                          </div>
                        )}
                      </div>
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                        {update.title}
                      </h3>
                      <p className="text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">
                        {update.content}
                      </p>
                      <div className="flex items-center gap-6 text-sm text-gray-500 dark:text-gray-400">
                        <div className="flex items-center gap-2">
                          <HiEye className="w-4 h-4" />
                          <span>{update.viewCount || 0} views</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <HiCalendar className="w-4 h-4" />
                          <span>{format(new Date(update.createdAt), "MMM dd, yyyy")}</span>
                        </div>
                        <span>by {update.User?.name || "System"}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      <button
                        onClick={() => handleViewUpdate(update)}
                        className="p-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors"
                      >
                        <HiEye className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => {
                          setSelectedUpdate(update);
                          setShowUpdateModal(true);
                        }}
                        className="p-2 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/40 transition-colors"
                      >
                        <HiPencil className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleDeleteUpdate(update.id)}
                        className="p-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors"
                      >
                        <HiTrash className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}

              {updatesData.updates.length === 0 && (
                <div className="text-center py-12">
                  <HiBell className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                  <h3 className="text-xl font-medium text-gray-900 dark:text-white mb-2">
                    No updates found
                  </h3>
                  <p className="text-gray-500 dark:text-gray-400">
                    Create your first community update to get started
                  </p>
                </div>
              )}

              {updatesData.totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-6">
                  <button
                    onClick={() => setUpdatesPage(1)}
                    disabled={updatesPage === 1}
                    className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    First
                  </button>
                  <button
                    onClick={() => setUpdatesPage((p) => Math.max(1, p - 1))}
                    disabled={updatesPage === 1}
                    className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    Previous
                  </button>
                  <span className="px-4 py-2 text-gray-700 dark:text-gray-300">
                    Page {updatesPage} of {updatesData.totalPages}
                  </span>
                  <button
                    onClick={() => setUpdatesPage((p) => Math.min(updatesData.totalPages, p + 1))}
                    disabled={updatesPage === updatesData.totalPages}
                    className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    Next
                  </button>
                  <button
                    onClick={() => setUpdatesPage(updatesData.totalPages)}
                    disabled={updatesPage === updatesData.totalPages}
                    className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    Last
                  </button>
                </div>
              )}
            </motion.div>
          )}

          {activeTab === "deals" && dealsData && (
            <motion.div
              key="deals"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="grid grid-cols-1 md:grid-cols-2 gap-6"
            >
              {dealsData.deals.map((deal: any) => (
                <motion.div
                  key={deal.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all"
                >
                  {deal.imageUrl && (
                    <div className="h-48 bg-gradient-to-br from-purple-400 to-purple-600"></div>
                  )}
                  <div className="p-6">
                    <div className="flex items-center gap-2 mb-3">
                      {deal.isFeatured && (
                        <span className="px-3 py-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 text-xs font-medium rounded-full">
                          Featured
                        </span>
                      )}
                      {deal.isActive ? (
                        <span className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 text-xs font-medium rounded-full">
                          Active
                        </span>
                      ) : (
                        <span className="px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 text-xs font-medium rounded-full">
                          Inactive
                        </span>
                      )}
                      <span className="px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 text-xs font-medium rounded-full">
                        {deal.dealType}
                      </span>
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                      {deal.title}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">
                      {deal.description}
                    </p>
                    <div className="flex items-center gap-4 mb-4">
                      {deal.discountedPrice && (
                        <div className="flex items-baseline gap-2">
                          <span className="text-2xl font-bold text-green-600 dark:text-green-400">
                            ${deal.discountedPrice}
                          </span>
                          {deal.originalPrice && (
                            <span className="text-sm text-gray-400 line-through">
                              ${deal.originalPrice}
                            </span>
                          )}
                        </div>
                      )}
                      <span className="px-3 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 text-sm font-bold rounded-full">
                        {deal.discountValue}% OFF
                      </span>
                    </div>
                    <div className="flex items-center gap-6 text-sm text-gray-500 dark:text-gray-400 mb-4">
                      <div className="flex items-center gap-2">
                        <HiCalendar className="w-4 h-4" />
                        <span>
                          {format(new Date(deal.startDate), "MMM dd")} - {format(new Date(deal.endDate), "MMM dd")}
                        </span>
                      </div>
                      {deal.usageLimit && (
                        <span>{deal.currentUsage || 0}/{deal.usageLimit} claimed</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleViewDeal(deal)}
                        className="flex-1 px-4 py-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors font-medium"
                      >
                        View Details
                      </button>
                      <button
                        onClick={() => {
                          setSelectedDeal(deal);
                          setShowDealModal(true);
                        }}
                        className="p-2 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/40 transition-colors"
                      >
                        <HiPencil className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}

              {dealsData.deals.length === 0 && (
                <div className="col-span-2 text-center py-12">
                  <HiTag className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                  <h3 className="text-xl font-medium text-gray-900 dark:text-white mb-2">
                    No deals found
                  </h3>
                  <p className="text-gray-500 dark:text-gray-400">
                    Create your first deal to get started
                  </p>
                </div>
              )}

              {dealsData.totalPages > 1 && (
                <div className="col-span-2 flex items-center justify-center gap-2 mt-6">
                  <button
                    onClick={() => setDealsPage(1)}
                    disabled={dealsPage === 1}
                    className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    First
                  </button>
                  <button
                    onClick={() => setDealsPage((p) => Math.max(1, p - 1))}
                    disabled={dealsPage === 1}
                    className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    Previous
                  </button>
                  <span className="px-4 py-2 text-gray-700 dark:text-gray-300">
                    Page {dealsPage} of {dealsData.totalPages}
                  </span>
                  <button
                    onClick={() => setDealsPage((p) => Math.min(dealsData.totalPages, p + 1))}
                    disabled={dealsPage === dealsData.totalPages}
                    className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    Next
                  </button>
                  <button
                    onClick={() => setDealsPage(dealsData.totalPages)}
                    disabled={dealsPage === dealsData.totalPages}
                    className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    Last
                  </button>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {showUpdateDetails && selectedUpdate && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Update details modal"
          onKeyDown={(e) => { if (e.key === "Escape") setShowUpdateDetails(false); }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            ref={updateModalRef}
            tabIndex={-1}
            className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-5xl w-full max-h-[92vh] overflow-y-auto"
          >
            <div className="p-6 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Update Details</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">Live data from database</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    if (!updateDetails) return;
                    setShowUpdateDetails(false);
                    setSelectedUpdate(updateDetails);
                    setShowUpdateModal(true);
                  }}
                  disabled={!updateDetails}
                  className="rounded-lg border px-3 py-1.5 text-sm hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                  Edit
                </button>
                <button
                  onClick={() => {
                    if (!updateDetails) return;
                    toggleUpdateMutation.mutate({
                      updateId: updateDetails.id,
                      data: { isActive: !updateDetails.isActive },
                    });
                  }}
                  disabled={!updateDetails || toggleUpdateMutation.isPending}
                  className="rounded-lg border px-3 py-1.5 text-sm hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                  {updateDetails?.isActive ? "Deactivate" : "Activate"}
                </button>
                <button
                  onClick={() => {
                    if (!updateDetails) return;
                    setShowUpdateDetails(false);
                    setConfirmDeleteUpdateId(updateDetails.id);
                  }}
                  disabled={!updateDetails}
                  className="rounded-lg border border-red-500 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                >
                  Delete
                </button>
                <button
                  onClick={() => setShowUpdateDetails(false)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
                >
                  <HiX className="w-5 h-5 text-gray-500 dark:text-gray-300" />
                </button>
              </div>
            </div>

            <div className="sr-only" aria-live="polite">{updateStatusAnnouncement}</div>

            <div className="p-6 space-y-6">
              {updateDetailsLoading && (
                <div className="flex items-center justify-center py-12">
                  <div className="w-10 h-10 border-4 border-[hsl(var(--primary))] border-t-transparent rounded-full animate-spin" />
                </div>
              )}

              {!updateDetails && !updateDetailsLoading && (
                <div className="rounded-xl border border-border bg-card/70 p-6 text-center text-sm text-muted-foreground">
                  <p className="mb-3">Unable to load the update. Please refresh and retry.</p>
                  <div className="flex items-center justify-center gap-3">
                    <button
                      onClick={() => refetchUpdateDetails()}
                      className="rounded-lg border px-3 py-1.5 text-sm font-semibold text-foreground hover:bg-muted"
                    >
                      Retry
                    </button>
                    <button
                      onClick={() => setShowUpdateDetails(false)}
                      className="rounded-lg border px-3 py-1.5 text-sm font-semibold text-foreground hover:bg-muted"
                    >
                      Close
                    </button>
                  </div>
                </div>
              )}

              {updateDetails && (
                <>
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-700 dark:bg-gray-800 dark:text-gray-200">
                      {updateDetails.category}
                    </span>
                    <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700 dark:bg-green-900/30 dark:text-green-300">
                      Priority: {updateDetails.priority}
                    </span>
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${
                      updateDetails.isActive
                        ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300"
                        : "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300"
                    }`}>
                      {updateDetails.isActive ? "Active" : "Inactive"}
                    </span>
                    {updateDetails.lastActor?.name && (
                      <span className="flex items-center gap-2 rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700 dark:bg-blue-900/30 dark:text-blue-200">
                        <HiUser className="w-4 h-4" /> Last actor: {updateDetails.lastActor.name}
                      </span>
                    )}
                  </div>

                  <div className="space-y-2">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">{updateDetails.title}</h3>
                    <p className="text-gray-600 dark:text-gray-300 whitespace-pre-wrap">{updateDetails.content}</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                    <div className="rounded-lg border border-border bg-muted/30 p-3">
                      <p className="text-xs text-muted-foreground">Views</p>
                      <p className="text-lg font-semibold">{updateDetails.viewCount ?? 0}</p>
                    </div>
                    <div className="rounded-lg border border-border bg-muted/30 p-3">
                      <p className="text-xs text-muted-foreground">Clicks</p>
                      <p className="text-lg font-semibold">{updateDetails.clickCount ?? 0}</p>
                    </div>
                    <div className="rounded-lg border border-border bg-muted/30 p-3">
                      <p className="text-xs text-muted-foreground">Reads</p>
                      <p className="text-lg font-semibold">{updateDetails.readCount ?? 0}</p>
                    </div>
                    <div className="rounded-lg border border-border bg-muted/30 p-3">
                      <p className="text-xs text-muted-foreground">Published</p>
                      <p className="text-sm font-semibold">{updateDetails.publishedAt ? new Date(updateDetails.publishedAt).toLocaleString() : "-"}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="rounded-lg border border-border p-4">
                      <p className="text-xs text-muted-foreground mb-1">CTA</p>
                      <p className="text-sm font-semibold">{updateDetails.ctaText || "No CTA"}</p>
                      <div className="flex items-center gap-1 text-xs">
                        <HiLink className="w-4 h-4" />
                        {updateDetails.ctaLink ? (
                          <a
                            href={updateDetails.ctaLink}
                            target="_blank"
                            rel="noreferrer"
                            className="font-semibold text-blue-600 underline decoration-dotted underline-offset-2 dark:text-blue-300 break-all"
                          >
                            {updateDetails.ctaLink}
                          </a>
                        ) : (
                          <span className="text-muted-foreground">No link</span>
                        )}
                      </div>
                    </div>
                    <div className="rounded-lg border border-border p-4">
                      <p className="text-xs text-muted-foreground mb-1">Audience</p>
                      <p className="text-sm font-semibold">Packages: {updateDetails.audience?.packages || updateDetails.targetPackages || "All"}</p>
                      <p className="text-sm font-semibold">Ranks: {updateDetails.audience?.ranks || updateDetails.targetRanks || "All"}</p>
                      <p className="text-sm font-semibold">Regions: {updateDetails.audience?.regions || updateDetails.targetRegions || "All"}</p>
                    </div>
                    <div className="rounded-lg border border-border p-4">
                      <p className="text-xs text-muted-foreground mb-1">Timestamps</p>
                      <p className="text-sm font-semibold">Created: {new Date(updateDetails.metadata?.createdAt || updateDetails.createdAt).toLocaleString()}</p>
                      <p className="text-sm font-semibold">Updated: {new Date(updateDetails.metadata?.updatedAt || updateDetails.updatedAt).toLocaleString()}</p>
                      <p className="text-sm font-semibold">Expires: {updateDetails.metadata?.expiresAt || updateDetails.expiresAt ? new Date(updateDetails.metadata?.expiresAt || updateDetails.expiresAt as string | number | Date).toLocaleString() : "-"}</p>
                    </div>
                  </div>

                  <div className="rounded-xl border border-border bg-card/70 p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold">Attachments</p>
                      <span className="text-xs text-muted-foreground">Full record assets</span>
                    </div>
                    {updateAttachments.length > 0 ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {updateAttachments.map((asset: any) => (
                          <div key={asset.id} className="rounded-lg border border-border bg-background/70 p-3">
                            <p className="text-xs text-muted-foreground mb-2">{asset.label || asset.type || "Attachment"}</p>
                            {asset.type === "image" ? (
                              <img
                                src={asset.url}
                                alt={asset.label || "Attachment"}
                                className="h-32 w-full rounded-lg object-cover"
                              />
                            ) : (
                              <a
                                href={asset.url}
                                target="_blank"
                                rel="noreferrer"
                                className="text-sm font-semibold text-blue-600 underline decoration-dotted underline-offset-2 dark:text-blue-300 break-all"
                              >
                                {asset.url}
                              </a>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">No attachments on this update.</p>
                    )}
                  </div>

                  <div className="rounded-xl border border-border bg-card/70 p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold">Status timeline</p>
                      <button
                        onClick={() => refetchUpdateDetails()}
                        className="rounded-lg border px-3 py-1 text-xs font-semibold text-foreground hover:bg-muted"
                      >
                        Refresh
                      </button>
                    </div>
                    {updateDetails.statusHistory?.length ? (
                      <div className="space-y-3">
                        {updateDetails.statusHistory.map((entry: any) => (
                          <div key={entry.id} className="flex items-start gap-3 border-l-2 border-dashed border-border pl-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-background/70">
                              <HiInformationCircle className="w-5 h-5 text-foreground" />
                            </div>
                            <div className="flex-1 space-y-1">
                              <p className="text-sm font-semibold text-foreground">{entry.action}</p>
                              <p className="text-xs text-muted-foreground">Status: {entry.status || "unknown"}</p>
                              <p className="text-xs text-muted-foreground">
                                {entry.actor?.name || entry.actor?.email || "System"} - {entry.createdAt ? new Date(entry.createdAt).toLocaleString() : ""}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">No status changes recorded yet.</p>
                    )}
                  </div>

                  <div className="rounded-xl border border-border bg-card/70 p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold">Read activity (last 7 days)</p>
                      <span className="text-xs text-muted-foreground">Live counts</span>
                    </div>
                    <div className="flex items-end gap-2">
                      {updateReadTrend.map((point) => (
                        <div key={point.label} className="flex flex-col items-center gap-1">
                          <div className="w-10 rounded-full bg-gradient-to-t from-blue-500/30 to-blue-500" style={{ height: `${8 + point.value * 6}px` }} />
                          <span className="text-[10px] text-muted-foreground">{point.label}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {updateDetails.UpdateRead && updateDetails.UpdateRead.length > 0 && (
                    <div className="rounded-xl border border-border bg-card/70 p-4">
                      <p className="text-sm font-semibold mb-3">Recent Reads</p>
                      <div className="space-y-2 text-sm text-muted-foreground">
                        {updateDetails.UpdateRead.map((read: any) => (
                          <div key={read.id} className="flex items-center justify-between border-b border-border/50 pb-2 last:border-0 last:pb-0">
                            <div className="flex items-center gap-2">
                              <HiDocumentText className="w-4 h-4 text-foreground" />
                              <span className="font-medium text-foreground">{read.User?.name || read.User?.email || "Reader"}
                              </span>
                            </div>
                            <span className="text-xs text-muted-foreground">{new Date(read.readAt).toLocaleString()}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {updateDetails.audit && updateDetails.audit.length > 0 && (
                    <div className="rounded-xl border border-border bg-card/70 p-4">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-sm font-semibold">Audit Trail</p>
                        <span className="text-xs text-muted-foreground">Most recent {updateDetails.audit.length}</span>
                      </div>
                      <div className="space-y-2">
                        {updateDetails.audit.map((log: AuditEntry) => (
                          <div key={log.id} className="flex items-center justify-between text-sm border-b border-border/50 pb-2 last:border-0 last:pb-0">
                            <div className="flex flex-col">
                              <span className="font-semibold text-foreground">{log.action}</span>
                              <span className="text-xs text-muted-foreground">{log.User?.name || log.userId}</span>
                            </div>
                            <span className="text-xs text-muted-foreground">{new Date(log.createdAt).toLocaleString()}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </motion.div>
        </div>
      )}

      {showDealDetails && selectedDeal && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Deal details modal"
          onKeyDown={(e) => { if (e.key === "Escape") setShowDealDetails(false); }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-5xl w-full max-h-[92vh] overflow-y-auto"
          >
            <div className="p-6 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Deal Details</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">Live deal data from database</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    if (!dealDetails) return;
                    setShowDealDetails(false);
                    setSelectedDeal(dealDetails);
                    setShowDealModal(true);
                  }}
                  disabled={!dealDetails}
                  className="rounded-lg border px-3 py-1.5 text-sm hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                  Edit
                </button>
                <button
                  onClick={() => {
                    if (!dealDetails) return;
                    const nextActive = !dealDetails.isActive;
                    if (!nextActive && !dealDeactivationReason.trim()) {
                      toast.error("Add a deactivation reason before disabling");
                      return;
                    }
                    toggleDealMutation.mutate({
                      dealId: dealDetails.id,
                      data: {
                        isActive: nextActive,
                        deactivationReason: nextActive ? undefined : dealDeactivationReason.trim(),
                      },
                    });
                  }}
                  disabled={!dealDetails || toggleDealMutation.isPending}
                  className="rounded-lg border px-3 py-1.5 text-sm hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                  {dealDetails?.isActive ? "Deactivate" : "Activate"}
                </button>
                <button
                  onClick={() => {
                    if (!dealDetails) return;
                    setShowDealDetails(false);
                    setConfirmDeleteDealId(dealDetails.id);
                  }}
                  disabled={!dealDetails}
                  className="rounded-lg border border-red-500 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                >
                  Delete
                </button>
                <button
                  onClick={() => setShowDealDetails(false)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
                >
                  <HiX className="w-5 h-5 text-gray-500 dark:text-gray-300" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {dealDetailsLoading && (
                <div className="flex items-center justify-center py-12">
                  <div className="w-10 h-10 border-4 border-[hsl(var(--primary))] border-t-transparent rounded-full animate-spin" />
                </div>
              )}

              {!dealDetails && !dealDetailsLoading && (
                <div className="rounded-xl border border-border bg-card/70 p-6 text-center text-sm text-muted-foreground">
                  <p className="mb-3">Unable to load live deal details. Please retry or refresh the list.</p>
                  <div className="flex items-center justify-center gap-3">
                    <button
                      onClick={() => refetchDealDetails()}
                      className="rounded-lg border px-3 py-1.5 text-sm font-semibold text-foreground hover:bg-muted"
                    >
                      Retry
                    </button>
                    <button
                      onClick={() => setShowDealDetails(false)}
                      className="rounded-lg border px-3 py-1.5 text-sm font-semibold text-foreground hover:bg-muted"
                    >
                      Close
                    </button>
                  </div>
                </div>
              )}

              {dealDetails && (
                <>
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-700 dark:bg-gray-800 dark:text-gray-200">
                      {(dealDetails.dealType || selectedDeal.dealType || "deal").toString()}
                    </span>
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${
                      dealDetails.isActive
                        ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300"
                        : "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300"
                    }`}>
                      {dealDetails.isActive ? "Active" : "Inactive"}
                    </span>
                    {dealDetails.isFeatured && (
                      <span className="rounded-full bg-purple-100 px-3 py-1 text-xs font-semibold text-purple-700 dark:bg-purple-900/30 dark:text-purple-200">
                        Featured
                      </span>
                    )}
                    {dealDetails.lastActor?.name && (
                      <span className="flex items-center gap-2 rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700 dark:bg-blue-900/30 dark:text-blue-200">
                        <HiUser className="w-4 h-4" /> Last actor: {dealDetails.lastActor.name}
                      </span>
                    )}
                  </div>

                  <div className="space-y-2">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">{dealDetails.title}</h3>
                    <p className="text-gray-600 dark:text-gray-300 whitespace-pre-wrap">{dealDetails.description}</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                    <div className="rounded-lg border border-border bg-muted/30 p-3">
                      <p className="text-xs text-muted-foreground">Discount</p>
                      <p className="text-lg font-semibold">{dealDetails.discountValue}% {dealDetails.discountType}</p>
                    </div>
                    <div className="rounded-lg border border-border bg-muted/30 p-3">
                      <p className="text-xs text-muted-foreground">Usage</p>
                      <p className="text-lg font-semibold">{dealDetails.currentUsage ?? 0} / {dealDetails.usageLimit ?? "∞"}</p>
                    </div>
                    <div className="rounded-lg border border-border bg-muted/30 p-3">
                      <p className="text-xs text-muted-foreground">Remaining</p>
                      <p className="text-lg font-semibold">{dealDetails.remainingClaims ?? "∞"}
                      </p>
                    </div>
                    <div className="rounded-lg border border-border bg-muted/30 p-3">
                      <p className="text-xs text-muted-foreground">Validity</p>
                      <p className="text-sm font-semibold">
                        {new Date(dealDetails.startDate).toLocaleDateString()} - {new Date(dealDetails.endDate).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="rounded-lg border border-border p-4">
                      <p className="text-xs text-muted-foreground mb-1">Pricing</p>
                      <p className="text-sm font-semibold">Original: ₦{(dealDetails.originalPrice || 0).toLocaleString()}</p>
                      <p className="text-sm font-semibold">Discounted: ₦{(dealDetails.discountedPrice || 0).toLocaleString()}</p>
                    </div>
                    <div className="rounded-lg border border-border p-4">
                      <p className="text-xs text-muted-foreground mb-1">Eligibility</p>
                      <p className="text-sm font-semibold">Packages: {dealDetails.audience?.packages || dealDetails.eligiblePackages || "All"}</p>
                      <p className="text-sm font-semibold">Ranks: {dealDetails.audience?.ranks || dealDetails.eligibleRanks || "All"}</p>
                      <p className="text-sm font-semibold">Min purchase: {dealDetails.audience?.minPurchaseAmount || dealDetails.minPurchaseAmount ? `₦${Number(dealDetails.audience?.minPurchaseAmount || dealDetails.minPurchaseAmount).toLocaleString()}` : "None"}</p>
                    </div>
                    <div className="rounded-lg border border-border p-4">
                      <p className="text-xs text-muted-foreground mb-1">CTA</p>
                      <p className="text-sm font-semibold">{dealDetails.ctaText || "No CTA"}</p>
                      <p className="text-xs text-muted-foreground break-all">Hero image: {dealDetails.imageUrl || "None"}</p>
                      {dealDetails.metadata?.updatedAt && (
                        <p className="text-xs text-muted-foreground">Updated: {new Date(dealDetails.metadata.updatedAt).toLocaleString()}</p>
                      )}
                    </div>
                  </div>

                  <div className="rounded-xl border border-border bg-card/70 p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold">Attachments</p>
                      <span className="text-xs text-muted-foreground">Full record assets</span>
                    </div>
                    {dealAttachments.length > 0 ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {dealAttachments.map((asset: any) => (
                          <div key={asset.id} className="rounded-lg border border-border bg-background/70 p-3">
                            <p className="text-xs text-muted-foreground mb-2">{asset.label || asset.type || "Attachment"}</p>
                            {asset.type === "image" ? (
                              <img
                                src={asset.url}
                                alt={asset.label || "Attachment"}
                                className="h-32 w-full rounded-lg object-cover"
                              />
                            ) : (
                              <a
                                href={asset.url}
                                target="_blank"
                                rel="noreferrer"
                                className="text-sm font-semibold text-blue-600 underline decoration-dotted underline-offset-2 dark:text-blue-300 break-all"
                              >
                                {asset.url}
                              </a>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">No attachments on this deal.</p>
                    )}
                  </div>

                  <div className="rounded-xl border border-border bg-card/70 p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold">Status timeline</p>
                      <button
                        onClick={() => refetchDealDetails()}
                        className="rounded-lg border px-3 py-1 text-xs font-semibold text-foreground hover:bg-muted"
                      >
                        Refresh
                      </button>
                    </div>
                    {dealDetails.statusHistory?.length ? (
                      <div className="space-y-3">
                        {dealDetails.statusHistory.map((entry: any) => (
                          <div key={entry.id} className="flex items-start gap-3 border-l-2 border-dashed border-border pl-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-background/70">
                              <HiInformationCircle className="w-5 h-5 text-foreground" />
                            </div>
                            <div className="flex-1 space-y-1">
                              <p className="text-sm font-semibold text-foreground">{entry.action}</p>
                              <p className="text-xs text-muted-foreground">Status: {entry.status || "unknown"}</p>
                              <p className="text-xs text-muted-foreground">
                                {entry.actor?.name || entry.actor?.email || "System"} - {entry.createdAt ? new Date(entry.createdAt).toLocaleString() : ""}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">No status changes recorded yet.</p>
                    )}
                  </div>

                  {dealDetails.deactivationReason && (
                    <div className="rounded-xl border border-border bg-card/70 p-4">
                      <p className="text-sm font-semibold mb-2">Latest deactivation reason</p>
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap">{dealDetails.deactivationReason}</p>
                    </div>
                  )}

                  <div className="rounded-xl border border-border bg-card/70 p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                        <HiInformationCircle className="w-4 h-4" />
                        Deactivation reason (required when turning off)
                      </div>
                      <span className="text-xs text-muted-foreground">Stored in audit metadata</span>
                    </div>
                    <textarea
                      value={dealDeactivationReason}
                      onChange={(e) => setDealDeactivationReason(e.target.value)}
                      placeholder="Explain why this deal is being paused"
                      className="w-full rounded-lg border border-border bg-background/70 p-3 text-sm focus:border-[hsl(var(--primary))] focus:ring-4 focus:ring-[hsl(var(--secondary))]/20"
                      rows={3}
                    />
                  </div>

                  <div className="rounded-xl border border-border bg-card/70 p-4 space-y-4">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold text-foreground">Performance</p>
                      <p className="text-xs text-muted-foreground">Usage rate {dealDetails.usageRate ? `${dealDetails.usageRate.toFixed(1)}%` : "n/a"}
                      </p>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <div className="rounded-lg border border-border/60 bg-background/60 p-3">
                        <p className="text-xs text-muted-foreground">Claims</p>
                        <p className="text-lg font-semibold">{dealDetails.claimCount}</p>
                      </div>
                      <div className="rounded-lg border border-border/60 bg-background/60 p-3">
                        <p className="text-xs text-muted-foreground">Remaining</p>
                        <p className="text-lg font-semibold">{dealDetails.remainingClaims ?? "∞"}
                        </p>
                      </div>
                      <div className="rounded-lg border border-border/60 bg-background/60 p-3">
                        <p className="text-xs text-muted-foreground">Usage/Limit</p>
                        <p className="text-lg font-semibold">{dealDetails.currentUsage ?? 0} / {dealDetails.usageLimit ?? "∞"}
                        </p>
                      </div>
                      <div className="rounded-lg border border-border/60 bg-background/60 p-3">
                        <p className="text-xs text-muted-foreground">Latest claim</p>
                        <p className="text-xs font-semibold text-foreground">{dealDetails.claims[0]?.claimedAt ? new Date(dealDetails.claims[0].claimedAt).toLocaleString() : "-"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-end gap-2">
                      {claimTrend.map((point) => (
                        <div key={point.label} className="flex flex-col items-center gap-1">
                          <div className="w-10 rounded-full bg-gradient-to-t from-emerald-500/40 to-emerald-500" style={{ height: `${8 + point.value * 6}px` }} />
                          <span className="text-[10px] text-muted-foreground">{point.label}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {dealDetails.claims && dealDetails.claims.length > 0 && (
                    <div className="rounded-xl border border-border bg-card/70 p-4">
                      <p className="text-sm font-semibold mb-3">Recent Claims</p>
                      <div className="space-y-2 text-sm text-muted-foreground">
                        {dealDetails.claims.map((claim: any) => (
                          <div key={claim.id} className="flex items-center justify-between border-b border-border/50 pb-2 last:border-0 last:pb-0">
                            <div>
                              <p className="font-medium text-foreground">{claim.User?.name || claim.User?.email || "User"}
                              </p>
                              <p className="text-xs text-muted-foreground">{claim.discountAmount ? `Discount ₦${claim.discountAmount}` : "Claimed"}
                              </p>
                            </div>
                            <span className="text-xs text-muted-foreground">{claim.claimedAt ? new Date(claim.claimedAt).toLocaleString() : ""}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {dealDetails.audit && dealDetails.audit.length > 0 && (
                    <div className="rounded-xl border border-border bg-card/70 p-4">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-sm font-semibold">Audit Trail</p>
                        <span className="text-xs text-muted-foreground">Most recent {dealDetails.audit.length}
                        </span>
                      </div>
                      <div className="space-y-2">
                        {dealDetails.audit.map((log: AuditEntry) => (
                          <div key={log.id} className="flex items-center justify-between text-sm border-b border-border/50 pb-2 last:border-0 last:pb-0">
                            <div className="flex flex-col">
                              <span className="font-semibold text-foreground">{log.action}</span>
                              <span className="text-xs text-muted-foreground">{log.User?.name || log.userId}
                              </span>
                            </div>
                            <span className="text-xs text-muted-foreground">{new Date(log.createdAt).toLocaleString()}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </motion.div>
        </div>
      )}

      <CommunityUpdateModal
        isOpen={showUpdateModal}
        onClose={() => {
          setShowUpdateModal(false);
          setSelectedUpdate(null);
        }}
        update={selectedUpdate}
        onSuccess={() => {
          refetchUpdates();
          refetchUpdateDetails();
        }}
      />

      <BestDealModal
        isOpen={showDealModal}
        onClose={() => {
          setShowDealModal(false);
          setSelectedDeal(null);
        }}
        deal={selectedDeal}
        onSuccess={() => {
          refetchDeals();
          refetchDealDetails();
        }}
      />

      <NotificationBroadcastModal
        isOpen={showNotificationModal}
        onClose={() => setShowNotificationModal(false)}
      />
    </div>
  );
}
