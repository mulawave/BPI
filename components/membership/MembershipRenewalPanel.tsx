import React, { useState } from "react";
import { motion } from "framer-motion";
import { api } from "@/client/trpc";
import toast from "react-hot-toast";
import {
  MdCheck,
  MdWarning,
  MdInfo,
  MdRefresh,
  MdHistory,
  MdSync,
} from "react-icons/md";

export default function MembershipRenewalPanel() {
  const [showRenewalDetails, setShowRenewalDetails] = useState(false);
  const [showRenewalHistory, setShowRenewalHistory] = useState(false);

  // Queries
  const statusQuery = api.package.getMembershipRenewalStatus.useQuery();
  const previewQuery = api.package.previewMembershipRenewal.useQuery(
    undefined,
    {
      enabled: showRenewalDetails && statusQuery.data?.isRenewalWindow,
    }
  );
  const historyQuery = api.package.getMembershipRenewalHistory.useQuery(
    { limit: 10, page: 1 },
    { enabled: showRenewalHistory }
  );

  // Mutations
  const autoRenewalMutation =
    api.package.initiateUserAutoRenewal.useMutation({
      onSuccess: (data: any) => {
        if (data.success) {
          toast.success(data.message || "Membership renewed successfully!");
          statusQuery.refetch();
          setShowRenewalDetails(false);
        } else {
          toast.error(data.error || "Auto-renewal failed");
        }
      },
      onError: (error: any) => {
        toast.error(error.message || "Error processing renewal");
      },
    });

  if (statusQuery.isLoading) {
    return (
      <div className="flex items-center justify-center gap-2 rounded-lg bg-muted/60 p-8">
        <div className="h-4 w-4 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
        <p className="text-sm text-muted-foreground">Loading membership status...</p>
      </div>
    );
  }

  if (!statusQuery.data?.hasActiveMembership) {
    return (
      <div className="rounded-lg border border-yellow-300 bg-yellow-50 p-4 dark:border-yellow-900/60 dark:bg-yellow-900/20">
        <div className="flex items-start gap-2">
          <MdWarning className="mt-1 text-yellow-600 dark:text-yellow-400" />
          <div>
            <p className="font-medium text-yellow-800 dark:text-yellow-200">
              No Active Membership
            </p>
            <p className="text-sm text-yellow-700 dark:text-yellow-300">
              {statusQuery.data?.error || "You do not have an active membership"}
            </p>
          </div>
        </div>
      </div>
    );
  }

  const status = statusQuery.data;
  const isExpired = status.daysUntilExpiry < 0;
  const canRenew = status.isRenewalWindow;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      {/* Main Status Card */}
      <div className="premium-stat-card relative overflow-hidden rounded-2xl border border-border bg-card/80 p-6 shadow-xl shadow-black/5 backdrop-blur-sm dark:shadow-black/20">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
              <MdSync className="text-emerald-500" size={18} /> Membership Status
            </p>
            <h3 className="mt-1 text-2xl font-bold text-foreground">
              {status.currentPackage}
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              {status.userName} • {status.userEmail}
            </p>
          </div>

          {/* Status Badge */}
          <div
            className={`flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-semibold ${
              isExpired
                ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                : canRenew
                  ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
                  : "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
            }`}
          >
            {isExpired ? (
              <>
                <MdWarning size={16} />
                Expired
              </>
            ) : canRenew ? (
              <>
                <MdInfo size={16} />
                Renewal Window
              </>
            ) : (
              <>
                <MdCheck size={16} />
                Active
              </>
            )}
          </div>
        </div>

        {/* Key Details Grid */}
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-xl bg-muted/60 px-4 py-3">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              Days Until Expiry
            </p>
            <p className={`text-lg font-semibold ${isExpired ? "text-red-600 dark:text-red-400" : "text-foreground"}`}>
              {Math.abs(status.daysUntilExpiry)}d
            </p>
          </div>
          <div className="rounded-xl bg-muted/60 px-4 py-3">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              Expires
            </p>
            <p className="text-lg font-semibold text-foreground">
              {new Date(status.membershipExpiresAt).toLocaleDateString()}
            </p>
          </div>
          <div className="rounded-xl bg-muted/60 px-4 py-3">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              Activated
            </p>
            <p className="text-lg font-semibold text-foreground">
              {status.membershipActivatedAt
                ? new Date(status.membershipActivatedAt).toLocaleDateString()
                : "N/A"}
            </p>
          </div>
          <div className="rounded-xl bg-muted/60 px-4 py-3">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              Total Renewals
            </p>
            <p className="text-lg font-semibold text-foreground">
              {status.totalRenewals}
            </p>
          </div>
        </div>

        {/* Renewal Facts */}
        <div className="mt-4 space-y-2">
          <p className="text-xs text-muted-foreground">
            <span className="font-semibold">Renewal Fee:</span> ₦
            {status.renewalFee.toLocaleString()}
          </p>
          <p className="text-xs text-muted-foreground">
            <span className="font-semibold">Renewal Cycle:</span>{" "}
            {status.renewalCycleDays || 365} days
          </p>
        </div>
      </div>

      {/* Actions */}
      <div className="grid gap-3 sm:grid-cols-3">
        {/* View Details Button */}
        <button
          onClick={() => setShowRenewalDetails(!showRenewalDetails)}
          disabled={!canRenew && !showRenewalDetails}
          className="flex items-center justify-center gap-2 rounded-lg border border-border px-4 py-2 font-semibold text-foreground hover:bg-muted/60 disabled:opacity-50"
        >
          <MdInfo size={16} />
          {showRenewalDetails ? "Hide Details" : "View Renewal Details"}
        </button>

        {/* History Button */}
        <button
          onClick={() => setShowRenewalHistory(!showRenewalHistory)}
          className="flex items-center justify-center gap-2 rounded-lg border border-border px-4 py-2 font-semibold text-foreground hover:bg-muted/60"
        >
          <MdHistory size={16} />
          Renewal History
        </button>

        {/* Auto-Renew Button */}
        {canRenew && (
          <button
            onClick={() => autoRenewalMutation.mutate({})}
            disabled={autoRenewalMutation.isPending}
            className="flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
          >
            {autoRenewalMutation.isPending ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
            ) : (
              <MdCheck size={16} />
            )}
            {autoRenewalMutation.isPending ? "Processing..." : "Renew Now"}
          </button>
        )}
      </div>

      {/* Renewal Details Section */}
      {showRenewalDetails && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4 rounded-lg border border-border bg-card/60 p-4 backdrop-blur-sm"
        >
          <h4 className="font-semibold">Renewal Preview</h4>

          {!canRenew ? (
            <div className="rounded-lg bg-yellow-50 p-4 text-center dark:bg-yellow-900/20">
              <p className="text-sm text-yellow-700 dark:text-yellow-300">
                Renewal is not yet available. You can renew starting{" "}
                <span className="font-semibold">
                  {new Date(new Date(status.membershipExpiresAt).getTime() - 30 * 24 * 60 * 60 * 1000).toLocaleDateString()}
                </span>
              </p>
            </div>
          ) : previewQuery.isLoading ? (
            <div className="flex items-center justify-center gap-2">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
              <p className="text-sm text-muted-foreground">Loading preview...</p>
            </div>
          ) : previewQuery.data?.eligible === false ? (
            <div className="rounded-lg bg-red-50 p-4 dark:bg-red-900/20">
              <p className="text-sm text-red-700 dark:text-red-300">
                {previewQuery.data.reason}
              </p>
            </div>
          ) : (
            previewQuery.data && (
              <div className="space-y-3">
                {/* Renewal Summary */}
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  <div className="rounded-lg bg-muted/60 p-2 text-center">
                    <p className="text-xs text-muted-foreground">Package</p>
                    <p className="font-bold">{previewQuery.data.renewalPackage}</p>
                  </div>
                  <div className="rounded-lg bg-muted/60 p-2 text-center">
                    <p className="text-xs text-muted-foreground">Fee</p>
                    <p className="font-bold">
                      ₦{previewQuery.data.renewalFee.toLocaleString()}
                    </p>
                  </div>
                  <div className="rounded-lg bg-muted/60 p-2 text-center">
                    <p className="text-xs text-muted-foreground">VAT</p>
                    <p className="font-bold">
                      ₦{previewQuery.data.vat.toLocaleString()}
                    </p>
                  </div>
                  <div className="rounded-lg bg-emerald-100 p-2 text-center dark:bg-emerald-900/30">
                    <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-300">
                      Total
                    </p>
                    <p className="font-bold text-emerald-700 dark:text-emerald-300">
                      ₦{previewQuery.data.totalCost.toLocaleString()}
                    </p>
                  </div>
                </div>

                {/* Estimated Rewards */}
                {Object.values(previewQuery.data.estimatedRewards).some((v: any) => v > 0) && (
                  <div>
                    <p className="mb-2 text-xs font-semibold text-muted-foreground">
                      Estimated Referral Rewards
                    </p>
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                      {Object.entries(previewQuery.data.estimatedRewards).map(
                        ([key, value]) =>
                          (value as number) > 0 && (
                            <div
                              key={key}
                              className="flex items-center gap-1 rounded-lg bg-muted/60 px-2 py-1 text-xs"
                            >
                              <span className="capitalize text-muted-foreground">
                                {key}:
                              </span>
                              <span className="font-bold">
                                {(value as number).toLocaleString()}
                              </span>
                            </div>
                          )
                      )}
                    </div>
                  </div>
                )}

                {/* Upgrade Notice */}
                {previewQuery.data.isUpgrade && (
                  <div className="rounded-lg bg-green-50 p-3 dark:bg-green-900/20">
                    <div className="flex items-center gap-2">
                      <MdCheck className="text-green-600 dark:text-green-400" />
                      <p className="text-sm font-medium text-green-700 dark:text-green-300">
                        This renewal includes an upgrade to a higher tier!
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )
          )}
        </motion.div>
      )}

      {/* Renewal History Section */}
      {showRenewalHistory && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4 rounded-lg border border-border bg-card/60 p-4 backdrop-blur-sm"
        >
          <h4 className="font-semibold">Renewal History</h4>

          {historyQuery.isLoading ? (
            <div className="flex items-center justify-center gap-2">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
              <p className="text-sm text-muted-foreground">Loading history...</p>
            </div>
          ) : historyQuery.data?.renewals && historyQuery.data.renewals.length > 0 ? (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {historyQuery.data.renewals.map((renewal: any) => (
                <div
                  key={renewal.renewalHistoryId}
                  className="rounded-lg bg-muted/60 p-3 text-sm"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Renewal #{renewal.renewalNumber}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(renewal.renewedAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">
                        ₦{renewal.totalPaid.toLocaleString()}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Expires:{" "}
                        {new Date(renewal.expiresAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No renewal history found</p>
          )}
        </motion.div>
      )}

      {/* Information Box */}
      <div className="rounded-lg border border-blue-300 bg-blue-50 p-3 text-sm dark:border-blue-900/60 dark:bg-blue-900/20">
        <div className="flex gap-2">
          <MdInfo className="mt-0.5 text-blue-600 dark:text-blue-400" size={18} />
          <div className="text-blue-700 dark:text-blue-300">
            <p className="font-medium">Auto-Renewal Policy</p>
            <ul className="mt-1 list-inside list-disc space-y-1 text-xs">
              <li>Regular Members auto-upgrade to Regular Plus upon renewal</li>
              <li>You can only maintain or upgrade your membership tier</li>
              <li>Downgrades are not permitted</li>
              <li>
                Renewal is available 30 days before your membership expires
              </li>
            </ul>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
