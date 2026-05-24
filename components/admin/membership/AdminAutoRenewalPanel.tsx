import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { api } from "@/client/trpc";
import toast from "react-hot-toast";
import {
  MdRefresh,
  MdInfo,
  MdSync,
  MdCancel,
  MdCheck,
  MdWarning,
  MdPlay,
  MdPause,
} from "react-icons/md";

interface Member {
  userId: string;
  userName: string;
  userEmail: string;
  currentPackage: string;
  renewalFee: number;
  membershipExpiresAt: Date;
  daysExpired: number;
  renewalCount: number;
}

export default function AdminAutoRenewalPanel() {
  const [activeTab, setActiveTab] = useState<
    "candidates" | "preview" | "execute"
  >("candidates");
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [dryRunResults, setDryRunResults] = useState<{
    total: number;
    candidates: Member[];
  } | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [previewData, setPreviewData] = useState<any>(null);

  // Queries and mutations
  const candidatesQuery = api.admin.getAutoRenewalCandidates.useQuery(
    { limit: 50 }
  );
  const previewQuery = api.admin.previewAutoRenewal.useQuery(
    selectedUserId ? { userId: selectedUserId } : undefined,
    { enabled: showPreview && !!selectedUserId }
  );
  const processAutoRenewalMutation =
    api.admin.processAutoRenewalForUser.useMutation({
      onSuccess: (data) => {
        if (data.success) {
          toast.success(
            `Auto-renewal completed! New expiry: ${new Date(data.newExpiresAt!).toLocaleDateString()}`
          );
          candidatesQuery.refetch();
          setShowPreview(false);
          setSelectedUserId("");
        } else {
          toast.error(data.error || "Auto-renewal failed");
        }
      },
      onError: (error) => {
        toast.error(error.message || "Error processing auto-renewal");
      },
    });

  const bulkProcessMutation = api.admin.bulkProcessAutoRenewal.useMutation({
    onSuccess: (data) => {
      if (data.success) {
        if (data.dryRun) {
          setDryRunResults({
            total: data.totalCandidates,
            candidates: data.candidates || [],
          });
          toast.success(
            `Dry run: Found ${data.totalCandidates} users eligible for auto-renewal`
          );
        } else {
          toast.success(
            `Bulk auto-renewal completed: ${data.processed} renewed, ${data.failed} failed`
          );
          candidatesQuery.refetch();
        }
      } else {
        toast.error(data.error || "Bulk operation failed");
      }
    },
    onError: (error) => {
      toast.error(error.message || "Error during bulk operation");
    },
  });

  const handleProcessUser = async (userId: string) => {
    processAutoRenewalMutation.mutate({ userId });
  };

  const handleDryRun = () => {
    bulkProcessMutation.mutate({ dryRun: true, limit: 100 });
  };

  const handleExecuteBulk = () => {
    if (
      !confirm("This will auto-renew all expired eligible memberships. Continue?")
    ) {
      return;
    }
    bulkProcessMutation.mutate({ dryRun: false, limit: 100 });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      {/* Header */}
      <div className="flex items-center justify-between rounded-xl border border-border bg-card/60 p-4 backdrop-blur-sm">
        <div>
          <h2 className="text-lg font-bold text-foreground">
            Membership Auto-Renewal Management
          </h2>
          <p className="text-sm text-muted-foreground">
            View and process automatic membership renewals for expired
            memberships
          </p>
        </div>
        <MdSync className="text-3xl text-emerald-500" />
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-border">
        {["candidates", "preview", "execute"].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab as any)}
            className={`px-4 py-2 font-medium transition-colors ${
              activeTab === tab
                ? "border-b-2 border-emerald-500 text-emerald-600"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab === "candidates" && "Auto-Renewal Candidates"}
            {tab === "preview" && "Preview Renewal"}
            {tab === "execute" && "Bulk Process"}
          </button>
        ))}
      </div>

      {/* Content */}
      <AnimatePresence mode="wait">
        {/* Candidates Tab */}
        {activeTab === "candidates" && (
          <motion.div
            key="candidates"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-4"
          >
            <div className="flex items-center justify-between rounded-lg bg-muted/60 p-4">
              <div>
                <p className="text-sm text-muted-foreground">Total Candidates</p>
                <p className="text-2xl font-bold">
                  {candidatesQuery.data?.total || 0}
                </p>
              </div>
              <button
                onClick={() => candidatesQuery.refetch()}
                disabled={candidatesQuery.isFetching}
                className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm font-medium hover:bg-muted/80"
              >
                <MdRefresh
                  className={candidatesQuery.isFetching ? "animate-spin" : ""}
                />
                Refresh
              </button>
            </div>

            {/* Candidates Table */}
            {candidatesQuery.data?.candidates && (
              <div className="overflow-x-auto rounded-lg border border-border">
                <table className="w-full text-sm">
                  <thead className="bg-muted/60 text-xs uppercase text-muted-foreground">
                    <tr>
                      <th className="px-4 py-3 text-left">User</th>
                      <th className="px-4 py-3 text-left">Package</th>
                      <th className="px-4 py-3 text-left">Expired</th>
                      <th className="px-4 py-3 text-left">Renewals</th>
                      <th className="px-4 py-3 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {candidatesQuery.data.candidates.map((member: Member) => (
                      <tr
                        key={member.userId}
                        className="hover:bg-muted/40 transition"
                      >
                        <td className="px-4 py-3">
                          <p className="font-medium">{member.userName}</p>
                          <p className="text-xs text-muted-foreground">
                            {member.userEmail}
                          </p>
                        </td>
                        <td className="px-4 py-3">{member.currentPackage}</td>
                        <td className="px-4 py-3">
                          <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-1 text-xs font-semibold text-red-700 dark:bg-red-900/30 dark:text-red-400">
                            {member.daysExpired}d ago
                          </span>
                        </td>
                        <td className="px-4 py-3">{member.renewalCount}</td>
                        <td className="px-4 py-3 text-center">
                          <button
                            onClick={() => {
                              setSelectedUserId(member.userId);
                              setShowPreview(true);
                              setActiveTab("preview");
                            }}
                            className="inline-flex items-center gap-1 rounded-lg border border-emerald-300 bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-700 hover:bg-emerald-100 dark:border-emerald-900/60 dark:bg-emerald-900/20 dark:text-emerald-300"
                          >
                            <MdCheck size={14} />
                            Process
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {candidatesQuery.data?.total === 0 && (
              <div className="rounded-lg bg-blue-50 p-4 text-center dark:bg-blue-900/20">
                <p className="text-sm text-muted-foreground">
                  No auto-renewal candidates found at this time
                </p>
              </div>
            )}
          </motion.div>
        )}

        {/* Preview Tab */}
        {activeTab === "preview" && (
          <motion.div
            key="preview"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-4"
          >
            {!showPreview ? (
              <div className="rounded-lg bg-muted/60 p-8 text-center">
                <p className="text-sm text-muted-foreground">
                  Select a candidate from the list to preview their renewal
                </p>
              </div>
            ) : previewQuery.isLoading ? (
              <div className="flex items-center justify-center gap-2 rounded-lg bg-muted/60 p-8">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
                <p className="text-sm text-muted-foreground">
                  Loading preview...
                </p>
              </div>
            ) : previewQuery.data?.eligible === false ? (
              <div className="rounded-lg bg-yellow-50 p-4 dark:bg-yellow-900/20">
                <div className="flex items-start gap-2">
                  <MdWarning className="mt-1 text-yellow-600 dark:text-yellow-400" />
                  <div>
                    <p className="font-medium text-yellow-800 dark:text-yellow-200">
                      Not Eligible
                    </p>
                    <p className="text-sm text-yellow-700 dark:text-yellow-300">
                      {previewQuery.data.reason}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              previewQuery.data && (
                <div className="space-y-4 rounded-lg border border-border bg-card/60 p-4 backdrop-blur-sm">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="rounded-lg bg-muted/60 p-3">
                      <p className="text-xs text-muted-foreground">
                        Renewal Package
                      </p>
                      <p className="text-lg font-bold">
                        {previewQuery.data.renewalPackage}
                      </p>
                    </div>
                    <div className={`rounded-lg p-3 ${previewQuery.data.isUpgrade ? "bg-green-100 dark:bg-green-900/20" : "bg-muted/60"}`}>
                      <p className="text-xs text-muted-foreground">
                        {previewQuery.data.isUpgrade ? "Upgrade" : "Same Tier"}
                      </p>
                      <p className="text-lg font-bold">
                        {previewQuery.data.isUpgrade ? "✓ Upgrade" : "Same Package"}
                      </p>
                    </div>
                    <div className="rounded-lg bg-muted/60 p-3">
                      <p className="text-xs text-muted-foreground">Renewal Fee</p>
                      <p className="text-lg font-bold">
                        ₦{previewQuery.data.renewalFee.toLocaleString()}
                      </p>
                    </div>
                    <div className="rounded-lg bg-muted/60 p-3">
                      <p className="text-xs text-muted-foreground">Total Cost</p>
                      <p className="text-lg font-bold">
                        ₦{previewQuery.data.totalCost.toLocaleString()}
                      </p>
                    </div>
                  </div>

                  {/* Rewards Preview */}
                  <div>
                    <p className="mb-2 text-sm font-semibold">Estimated Rewards</p>
                    <div className="grid grid-cols-3 gap-2">
                      {Object.entries(previewQuery.data.estimatedRewards).map(
                        ([key, value]) =>
                          (value as number) > 0 && (
                            <div
                              key={key}
                              className="rounded-lg bg-muted/80 p-2 text-center text-xs"
                            >
                              <p className="capitalize text-muted-foreground">
                                {key}
                              </p>
                              <p className="font-bold">
                                {(value as number).toLocaleString()}
                              </p>
                            </div>
                          )
                      )}
                    </div>
                  </div>

                  {/* Action Button */}
                  <button
                    onClick={() =>
                      handleProcessUser(selectedUserId)
                    }
                    disabled={processAutoRenewalMutation.isPending}
                    className="w-full rounded-lg bg-emerald-600 px-4 py-2 font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
                  >
                    {processAutoRenewalMutation.isPending
                      ? "Processing..."
                      : "Process Auto-Renewal"}
                  </button>
                </div>
              )
            )}
          </motion.div>
        )}

        {/* Bulk Process Tab */}
        {activeTab === "execute" && (
          <motion.div
            key="execute"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-4"
          >
            <div className="rounded-lg border border-border bg-blue-50 p-4 dark:bg-blue-900/20">
              <div className="flex items-start gap-2">
                <MdInfo className="mt-1 text-blue-600 dark:text-blue-400" />
                <div>
                  <p className="font-medium text-blue-800 dark:text-blue-200">
                    Bulk Auto-Renewal
                  </p>
                  <p className="mt-1 text-sm text-blue-700 dark:text-blue-300">
                    Process all eligible expired memberships at once. Start with
                    a dry run to preview the impact.
                  </p>
                </div>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <button
                onClick={handleDryRun}
                disabled={bulkProcessMutation.isPending}
                className="flex items-center justify-center gap-2 rounded-lg border border-blue-300 bg-blue-50 px-4 py-3 font-semibold text-blue-700 hover:bg-blue-100 disabled:opacity-60 dark:border-blue-900/60 dark:bg-blue-900/20 dark:text-blue-300"
              >
                {bulkProcessMutation.isPending ? (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
                ) : (
                  <MdInfo size={20} />
                )}
                Dry Run (Preview)
              </button>

              <button
                onClick={handleExecuteBulk}
                disabled={bulkProcessMutation.isPending}
                className="flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-3 font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
              >
                {bulkProcessMutation.isPending ? (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                ) : (
                  <MdPlay size={20} />
                )}
                Execute Bulk Renewal
              </button>
            </div>

            {/* Dry Run Results */}
            {dryRunResults && (
              <div className="space-y-3 rounded-lg border border-border bg-card/60 p-4 backdrop-blur-sm">
                <h3 className="font-semibold">Dry Run Results</h3>
                <p className="text-sm">
                  Found {dryRunResults.total} users eligible for auto-renewal
                </p>

                {dryRunResults.candidates.length > 0 && (
                  <div className="max-h-48 overflow-y-auto rounded-lg bg-muted/60 p-3 text-xs">
                    {dryRunResults.candidates.map((member) => (
                      <div
                        key={member.userId}
                        className="mb-2 flex justify-between border-b border-border pb-2"
                      >
                        <span>{member.userName}</span>
                        <span className="text-muted-foreground">
                          {member.currentPackage}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
