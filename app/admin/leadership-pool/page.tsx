"use client";

import { useState, useEffect } from "react";
import { api } from "@/client/trpc";
import toast from "react-hot-toast";
import { motion } from "framer-motion";
import AdminPageGuide from "@/components/admin/AdminPageGuide";
import {
  FiSettings,
  FiUsers,
  FiTrendingUp,
  FiPlusCircle,
  FiXCircle,
  FiTrash2,
  FiSearch,
  FiFilter,
  FiCheckCircle,
  FiAlertCircle,
} from "react-icons/fi";

export default function AdminLeadershipPoolPage() {
  const [selectedTab, setSelectedTab] = useState<"settings" | "participants">("settings");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDisqualifyModal, setShowDisqualifyModal] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<"all" | "earned" | "sponsored">("all");
  const [currentPage, setCurrentPage] = useState(1);

  // Settings form state - initialized from query
  const [poolAmount, setPoolAmount] = useState<number>(0);
  const [poolEnabled, setPoolEnabled] = useState(true);
  const [maxParticipants, setMaxParticipants] = useState(0);

  // Queries
  const { data: settings, refetch: refetchSettings, isLoading: settingsLoading } = api.admin.getLeadershipPoolSettings.useQuery(undefined, {
    refetchOnMount: true,
    refetchOnWindowFocus: false,
  });

  // Update form state when settings data changes
  useEffect(() => {
    if (settings) {
      setPoolAmount(settings.amount);
      setPoolEnabled(settings.enabled);
      setMaxParticipants(settings.maxParticipants);
    }
  }, [settings]);

  const { data: stats, refetch: refetchStats } = api.admin.getLeadershipPoolStats.useQuery();

  const { data: participantsData, refetch: refetchParticipants } = api.admin.getLeadershipPoolParticipants.useQuery({
    page: currentPage,
    pageSize: 20,
    filter: filterType,
    search: searchTerm || undefined,
  });

  // Mutations
  const updateSettings = api.admin.updateLeadershipPoolSettings.useMutation({
    onSuccess: () => {
      toast.success("Leadership Pool settings updated");
      refetchSettings();
      refetchStats();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update settings");
    },
  });

  const addSponsorshipClass = api.admin.addSponsorshipClassParticipant.useMutation({
    onSuccess: (data) => {
      toast.success(`${data.user.name} added to sponsorship class`);
      setShowAddModal(false);
      setSelectedUserId(null);
      refetchParticipants();
      refetchStats();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to add participant");
    },
  });

  const removeSponsorshipClass = api.admin.removeSponsorshipClassParticipant.useMutation({
    onSuccess: () => {
      toast.success("Removed from sponsorship class");
      refetchParticipants();
      refetchStats();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to remove from sponsorship class");
    },
  });

  const disqualifyParticipant = api.admin.disqualifyParticipant.useMutation({
    onSuccess: () => {
      toast.success("Participant disqualified");
      setShowDisqualifyModal(false);
      setSelectedUserId(null);
      refetchParticipants();
      refetchStats();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to disqualify participant");
    },
  });

  const handleUpdateSettings = () => {
    updateSettings.mutate({
      amount: poolAmount,
      enabled: poolEnabled,
      maxParticipants,
    });
  };

  const handleAddParticipant = () => {
    if (!selectedUserId) {
      toast.error("Please enter a user ID");
      return;
    }
    addSponsorshipClass.mutate({ userId: selectedUserId });
  };

  const handleRemoveSponsorshipClass = (userId: string) => {
    if (confirm("Remove this user from sponsorship class? They may still remain qualified if they meet normal criteria.")) {
      removeSponsorshipClass.mutate({ userId });
    }
  };

  const handleDisqualify = () => {
    if (!selectedUserId) return;
    disqualifyParticipant.mutate({ userId: selectedUserId });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-green-50 dark:from-gray-950 dark:via-gray-900 dark:to-green-950 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
            Leadership Pool Management
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Configure pool settings and manage participants
          </p>
        </div>

        {/* User Guide */}
        <AdminPageGuide
          title="Leadership Pool Guide"
          sections={[
            {
              title: "Leadership Pool Overview",
              icon: <FiUsers className="w-5 h-5 text-blue-600" />,
              items: [
                "<strong>Reward top performers</strong> who achieve leadership qualifications",
                "Participants share a <strong>monthly pool amount</strong> distributed equally",
                "Qualification via <strong>earned performance</strong> or <strong>sponsor sponsorship class</strong>",
                "<strong>Auto-qualify</strong> users who meet criteria or manually add participants",
                "<strong>Disqualify</strong> users who no longer meet requirements",
                "Track <strong>earned vs sponsored</strong> qualifications for transparency"
              ]
            },
            {
              title: "Configuring Pool Settings",
              icon: <FiSettings className="w-5 h-5 text-green-600" />,
              type: "ol",
              items: [
                "<strong>Set Pool Amount</strong> - Enter monthly budget to distribute (e.g., ₦1,000,000)",
                "<strong>Max Participants</strong> - Limit number of qualified members (e.g., 50)",
                "<strong>Enable/Disable Pool</strong> - Toggle pool on/off without changing settings",
                "<strong>Save Changes</strong> - Click 'Update Settings' to apply configuration",
                "<strong>Distribution logic</strong> - Pool Amount ÷ Total Qualified = Per-Person Share",
                "Settings update <strong>immediately</strong> - next payout uses new values"
              ]
            },
            {
              title: "Qualification Types",
              icon: <FiCheckCircle className="w-5 h-5 text-orange-600" />,
              items: [
                { label: "Earned", text: "User achieved qualification through performance metrics" },
                { label: "Sponsored", text: "Added to sponsorship class by sponsor (manual approval)" }
              ]
            },
            {
              title: "Adding Participants",
              icon: <FiPlusCircle className="w-5 h-5 text-purple-600" />,
              items: [
                "Click <strong>'Add to Sponsorship Class'</strong> button",
                "<strong>Search user</strong> by name, email, or ID",
                "<strong>Confirm selection</strong> - User added to qualified pool",
                "Sponsored participants receive <strong>same share as earned qualifiers</strong>",
                "Use for <strong>special recognition</strong> or manual override of criteria",
                "Changes reflect <strong>immediately</strong> in stats and distribution calculations"
              ]
            },
            {
              title: "Disqualifying Participants",
              icon: <FiXCircle className="w-5 h-5 text-red-600" />,
              items: [
                "Click <strong>'Disqualify'</strong> button next to participant name",
                "<strong>Confirm action</strong> - User removed from qualified pool",
                "Disqualification is <strong>immediate</strong> - affects current month's payout",
                "Use when users <strong>no longer meet criteria</strong> or violate policies",
                "<strong>Audit trail</strong> - All disqualifications are logged",
                "Can re-add later if user re-qualifies"
              ]
            },
            {
              title: "Participant Management & Filters",
              icon: <FiFilter className="w-5 h-5 text-blue-600" />,
              items: [
                "<strong>View all qualified</strong> - See complete list of pool participants",
                "<strong>Filter by type</strong> - Show earned only, sponsored only, or all",
                "<strong>Search participants</strong> - Find specific users by name/email",
                "<strong>Pagination</strong> - Browse large lists (20 participants per page)",
                "<strong>Sort options</strong> - Order by qualification date, type, or name",
                "<strong>Export list</strong> - Download participant data for reporting"
              ]
            }
          ]}
          features={[
            "Configure monthly pool amount",
            "Set maximum participants",
            "Enable/disable pool",
            "Add to sponsorship class",
            "Disqualify participants",
            "Track earned vs sponsored qualifications",
            "Search & filter participants",
            "Real-time stats dashboard"
          ]}
          proTip="Set <strong>Max Participants</strong> to create exclusivity and drive competition. For example, <strong>top 50 performers only</strong> creates urgency. Use <strong>sponsored slots sparingly</strong> (10-20% of total) to maintain earned qualification prestige. <strong>Review qualifications monthly</strong> to ensure all participants still meet criteria. Communicate pool amount and distribution clearly to <strong>motivate performance</strong>."
          warning="<strong>Disqualifying a participant is immediate</strong> and removes them from the current month's payout - ensure you've verified they no longer meet criteria. <strong>Changing pool amount mid-month</strong> affects current cycle's distribution. <strong>Max participants limit</strong> blocks new qualifications once reached - increase if needed. All actions are <strong>logged and auditable</strong> - use responsibly."
        />

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 border border-gray-200 dark:border-gray-700"
          >
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-xl">
                <FiUsers className="text-2xl text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Qualified</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">
                  {stats?.totalQualified || 0}
                </p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 border border-gray-200 dark:border-gray-700"
          >
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
                <FiTrendingUp className="text-2xl text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Earned</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">
                  {stats?.earnedQualifications || 0}
                </p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 border border-gray-200 dark:border-gray-700"
          >
            <div className="flex items-center gap-4">
              <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-xl">
                <FiPlusCircle className="text-2xl text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Sponsored</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">
                  {stats?.sponsoredQualifications || 0}
                </p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Tabs */}
        <div className="mb-6 flex gap-4 border-b border-gray-200 dark:border-gray-700">
          <button
            onClick={() => setSelectedTab("settings")}
            className={`px-6 py-3 font-medium transition-colors ${
              selectedTab === "settings"
                ? "text-green-600 dark:text-green-400 border-b-2 border-green-600 dark:border-green-400"
                : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
            }`}
          >
            <div className="flex items-center gap-2">
              <FiSettings />
              Settings
            </div>
          </button>
          <button
            onClick={() => setSelectedTab("participants")}
            className={`px-6 py-3 font-medium transition-colors ${
              selectedTab === "participants"
                ? "text-green-600 dark:text-green-400 border-b-2 border-green-600 dark:border-green-400"
                : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
            }`}
          >
            <div className="flex items-center gap-2">
              <FiUsers />
              Participants ({stats?.totalQualified || 0})
            </div>
          </button>
        </div>

        {/* Settings Tab */}
        {selectedTab === "settings" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 border border-gray-200 dark:border-gray-700"
          >
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
              Pool Configuration
            </h2>

            {settingsLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="flex flex-col items-center gap-3">
                  <div className="w-12 h-12 border-4 border-green-500 border-t-transparent rounded-full animate-spin" />
                  <p className="text-sm text-gray-500 dark:text-gray-400">Loading settings...</p>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
              {/* Pool Amount */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Pool Amount (₦)
                </label>
                <input
                  type="number"
                  value={poolAmount}
                  onChange={(e) => setPoolAmount(Number(e.target.value))}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg 
                    bg-white dark:bg-gray-900 text-gray-900 dark:text-white
                    focus:outline-none focus:ring-2 focus:ring-green-500"
                  min={0}
                />
                <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                  Total amount to be distributed among qualified participants
                </p>
              </div>

              {/* Pool Enabled Toggle */}
              <div>
                <label className="flex items-center gap-3 cursor-pointer">
                  <div className="relative">
                    <input
                      type="checkbox"
                      checked={poolEnabled}
                      onChange={(e) => setPoolEnabled(e.target.checked)}
                      className="sr-only"
                    />
                    <div
                      className={`w-14 h-8 rounded-full transition-colors ${
                        poolEnabled
                          ? "bg-green-600"
                          : "bg-gray-300 dark:bg-gray-600"
                      }`}
                    >
                      <div
                        className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full transition-transform ${
                          poolEnabled ? "translate-x-6" : ""
                        }`}
                      />
                    </div>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Leadership Pool Challenge {poolEnabled ? "Enabled" : "Disabled"}
                    </span>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Users can see and participate in the challenge when enabled
                    </p>
                  </div>
                </label>
              </div>

              {/* Max Participants */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Maximum Participants
                </label>
                <input
                  type="number"
                  value={maxParticipants}
                  onChange={(e) => setMaxParticipants(Number(e.target.value))}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg 
                    bg-white dark:bg-gray-900 text-gray-900 dark:text-white
                    focus:outline-none focus:ring-2 focus:ring-green-500"
                  min={1}
                />
                <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                  Maximum number of users who can qualify for the pool
                </p>
              </div>

              {/* Save Button */}
              <button
                onClick={handleUpdateSettings}
                disabled={updateSettings.isPending}
                className="w-full px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-medium 
                  rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed
                  flex items-center justify-center gap-2"
              >
                {updateSettings.isPending ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <FiCheckCircle />
                    Save Settings
                  </>
                )}
              </button>
            </div>
            )}
          </motion.div>
        )}

        {/* Participants Tab */}
        {selectedTab === "participants" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700"
          >
            {/* Toolbar */}
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                <div className="flex gap-2">
                  {/* Search */}
                  <div className="relative">
                    <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search by name or email..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                        bg-white dark:bg-gray-900 text-gray-900 dark:text-white w-64
                        focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>

                  {/* Filter */}
                  <select
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value as any)}
                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                      bg-white dark:bg-gray-900 text-gray-900 dark:text-white
                      focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    <option value="all">All Participants</option>
                    <option value="earned">Earned Only</option>
                    <option value="sponsored">Sponsored Only</option>
                  </select>
                </div>

                {/* Add Button */}
                <button
                  onClick={() => setShowAddModal(true)}
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-medium 
                    rounded-lg transition-colors flex items-center gap-2"
                >
                  <FiPlusCircle />
                  Add Sponsorship Class
                </button>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-900">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Package
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Classification
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Qualified Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Share %
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {participantsData?.participants.map((participant) => (
                    <tr key={participant.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {participant.userName || "No name"}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {participant.userEmail}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300">
                          {participant.membershipPackage || "None"}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {participant.sponsorshipClass ? (
                          <span className="flex items-center gap-1 text-sm text-purple-600 dark:text-purple-400">
                            <FiPlusCircle />
                            Sponsored
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-sm text-blue-600 dark:text-blue-400">
                            <FiCheckCircle />
                            Earned
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {participant.qualifiedAt
                          ? new Date(participant.qualifiedAt).toLocaleDateString()
                          : "N/A"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {participant.poolSharePercentage.toFixed(2)}%
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end gap-2">
                          {participant.sponsorshipClass && (
                            <button
                              onClick={() => handleRemoveSponsorshipClass(participant.userId)}
                              className="text-orange-600 hover:text-orange-900 dark:text-orange-400 dark:hover:text-orange-300"
                              title="Remove from sponsorship class"
                            >
                              <FiXCircle className="text-lg" />
                            </button>
                          )}
                          <button
                            onClick={() => {
                              setSelectedUserId(participant.userId);
                              setShowDisqualifyModal(true);
                            }}
                            className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                            title="Disqualify participant"
                          >
                            <FiTrash2 className="text-lg" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {participantsData?.participants.length === 0 && (
                <div className="text-center py-12">
                  <FiAlertCircle className="mx-auto text-4xl text-gray-400 mb-4" />
                  <p className="text-gray-500 dark:text-gray-400">No participants found</p>
                </div>
              )}
            </div>

            {/* Pagination */}
            {participantsData && participantsData.pagination.totalPages > 1 && (
              <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    Showing page {participantsData.pagination.page} of{" "}
                    {participantsData.pagination.totalPages}
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded 
                        hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Previous
                    </button>
                    <button
                      onClick={() => setCurrentPage(p => Math.min(participantsData.pagination.totalPages, p + 1))}
                      disabled={currentPage === participantsData.pagination.totalPages}
                      className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded 
                        hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next
                    </button>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </div>

      {/* Add Sponsorship Class Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full p-6"
          >
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              Add Sponsorship Class Participant
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Enter the user ID to grant automatic qualification. This bypasses all normal requirements.
            </p>
            <input
              type="text"
              value={selectedUserId || ""}
              onChange={(e) => setSelectedUserId(e.target.value)}
              placeholder="User ID"
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg 
                bg-white dark:bg-gray-900 text-gray-900 dark:text-white mb-4
                focus:outline-none focus:ring-2 focus:ring-green-500"
            />
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setSelectedUserId(null);
                }}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                  hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={handleAddParticipant}
                disabled={!selectedUserId || addSponsorshipClass.isPending}
                className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg 
                  disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {addSponsorshipClass.isPending ? "Adding..." : "Add"}
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Disqualify Modal */}
      {showDisqualifyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full p-6"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-full">
                <FiAlertCircle className="text-2xl text-red-600 dark:text-red-400" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                Disqualify Participant
              </h3>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
              This will completely remove the user from the Leadership Pool, including any sponsorship class status. 
              They will need to re-qualify through normal means or be re-added manually.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowDisqualifyModal(false);
                  setSelectedUserId(null);
                }}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                  hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={handleDisqualify}
                disabled={disqualifyParticipant.isPending}
                className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg 
                  disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {disqualifyParticipant.isPending ? "Removing..." : "Disqualify"}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
