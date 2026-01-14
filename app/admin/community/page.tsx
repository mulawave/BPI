"use client";

import { useState } from "react";
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
} from "react-icons/hi";
import toast from "react-hot-toast";
import { format } from "date-fns";
import StatsCard from "@/components/admin/StatsCard";
import ConfirmDialog from "@/components/ui/ConfirmDialog";

type TabType = "updates" | "deals";

export default function CommunityManagementPage() {
  const [activeTab, setActiveTab] = useState<TabType>("updates");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [selectedPriority, setSelectedPriority] = useState<string>("");
  const [showActiveOnly, setShowActiveOnly] = useState(false);

  // Update Modal States
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [selectedUpdate, setSelectedUpdate] = useState<any>(null);
  const [showUpdateDetails, setShowUpdateDetails] = useState(false);

  // Notification Modal State
  const [showNotificationModal, setShowNotificationModal] = useState(false);

  // Deal Modal States
  const [showDealModal, setShowDealModal] = useState(false);
  const [selectedDeal, setSelectedDeal] = useState<any>(null);
  const [showDealDetails, setShowDealDetails] = useState(false);
  const [confirmDeleteUpdateId, setConfirmDeleteUpdateId] = useState<string | null>(null);

  // Pagination
  const [updatesPage, setUpdatesPage] = useState(1);
  const [dealsPage, setDealsPage] = useState(1);

  // API Queries
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

  const deleteUpdateMutation = api.admin.deleteCommunityUpdate.useMutation({
    onSuccess: () => {
      toast.success("Update deleted successfully");
      refetchUpdates();
    },
    onError: (error: any) => {
      toast.error(`Failed to delete update: ${error.message}`);
    },
  });

  const handleDeleteUpdate = (updateId: string) => {
    setConfirmDeleteUpdateId(updateId);
  };

  const handleViewUpdate = (update: any) => {
    setSelectedUpdate(update);
    setShowUpdateDetails(true);
  };

  const handleViewDeal = (deal: any) => {
    setSelectedDeal(deal);
    setShowDealDetails(true);
  };

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
      <div className="max-w-7xl mx-auto">
        {/* Header */}
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

        {/* Summary Cards */}
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-6">
          <StatsCard
            title="Updates"
            value={updatesData?.total || 0}
            icon={HiBell}
            color="green"
          />
          <StatsCard
            title="Deals"
            value={dealsData?.total || 0}
            icon={HiTag}
            color="orange"
          />
          <StatsCard
            title="Active Only"
            value={showActiveOnly ? "Yes" : "No"}
            icon={HiCheckCircle}
            color="blue"
          />
          <StatsCard
            title="Filters"
            value={(searchQuery ? 1 : 0) + (selectedCategory ? 1 : 0) + (selectedPriority ? 1 : 0) + (showActiveOnly ? 1 : 0)}
            icon={HiSearch}
            color="purple"
          />
        </div>

        {/* Tabs */}
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

        {/* Filters & Search */}
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

        {/* Create Button */}
        <button
          onClick={() => activeTab === "updates" ? setShowUpdateModal(true) : setShowDealModal(true)}
          className="mb-6 premium-button flex items-center gap-2 px-6 py-3 text-white rounded-xl shadow-lg font-semibold"
        >
          <HiPlus className="w-5 h-5" />
          Create {activeTab === "updates" ? "Update" : "Deal"}
        </button>

        {/* Content */}
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

              {/* Pagination */}
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

              {/* Pagination */}
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

        {/* Update Details Modal - Placeholder */}
        {showUpdateDetails && selectedUpdate && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            >
              <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Update Details</h2>
                <button
                  onClick={() => setShowUpdateDetails(false)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <HiX className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                </button>
              </div>
              <div className="p-6">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">{selectedUpdate.title}</h3>
                <p className="text-gray-600 dark:text-gray-400 whitespace-pre-wrap">{selectedUpdate.content}</p>
              </div>
            </motion.div>
          </div>
        )}

        {/* Deal Details Modal - Placeholder */}
        {showDealDetails && selectedDeal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            >
              <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Deal Details</h2>
                <button
                  onClick={() => setShowDealDetails(false)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <HiX className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                </button>
              </div>
              <div className="p-6">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">{selectedDeal.title}</h3>
                <p className="text-gray-600 dark:text-gray-400">{selectedDeal.description}</p>
              </div>
            </motion.div>
          </div>
        )}

        {/* Community Update Modal */}
        <CommunityUpdateModal
          isOpen={showUpdateModal}
          onClose={() => {
            setShowUpdateModal(false);
            setSelectedUpdate(null);
          }}
          update={selectedUpdate}
          onSuccess={refetchUpdates}
        />

        {/* Best Deal Modal */}
        <BestDealModal
          isOpen={showDealModal}
          onClose={() => {
            setShowDealModal(false);
            setSelectedDeal(null);
          }}
          deal={selectedDeal}
          onSuccess={refetchDeals}
        />

        {/* Notification Broadcast Modal */}
        <NotificationBroadcastModal
          isOpen={showNotificationModal}
          onClose={() => setShowNotificationModal(false)}
        />
      </div>
    </div>
  );
}
