"use client";

import { motion } from "framer-motion";
import { api } from "@/client/trpc";
import {
  MdTrendingUp,
  MdPeople,
  MdAttachMoney,
  MdAutorenew,
  MdCheckCircle,
  MdClose,
} from "react-icons/md";
import { useState } from "react";

interface PackageAnalyticsProps {
  packageId: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function PackageAnalytics({
  packageId,
  isOpen,
  onClose,
}: PackageAnalyticsProps) {
  const { data: pkg, isLoading, error } = api.admin.getPackageById.useQuery(
    { packageId },
    { enabled: isOpen && !!packageId }
  );

  if (!isOpen) return null;

  const subscribers = (pkg as any)?.subscribers || [];
  const activeCount = (pkg as any)?.activeSubscriptions || 0;
  const totalRevenue = (pkg as any)?.totalRevenue || 0;
  const avgRevenuePerUser = activeCount > 0 ? totalRevenue / activeCount : 0;
  const growthWindowDays = (pkg as any)?.analytics?.growthWindowDays || 30;
  const growthRate = (pkg as any)?.analytics?.subscriberGrowthRate;
  const currentWindowActivations = (pkg as any)?.analytics?.currentWindowActivations || 0;
  const previousWindowActivations = (pkg as any)?.analytics?.previousWindowActivations || 0;
  const hasGrowthBaseline = typeof growthRate === "number";
  const growthDirection = hasGrowthBaseline && growthRate >= 0 ? "+" : "";

  return (
    <>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
      />

      {/* Modal */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
      >
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                Package Analytics
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                {pkg?.name}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-600 hover:text-red-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-red-400 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <MdClose size={24} />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {isLoading ? (
              <div className="flex min-h-[320px] items-center justify-center">
                <div className="flex flex-col items-center gap-4 text-center">
                  <div className="h-12 w-12 animate-spin rounded-full border-4 border-gray-200 border-t-emerald-500 dark:border-gray-700 dark:border-t-emerald-400" />
                  <div>
                    <p className="text-base font-semibold text-gray-900 dark:text-white">
                      Loading package analytics
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Pulling live subscriber and revenue data.
                    </p>
                  </div>
                </div>
              </div>
            ) : error ? (
              <div className="flex min-h-[320px] items-center justify-center">
                <div className="max-w-md rounded-2xl border border-red-200 bg-red-50 p-6 text-center dark:border-red-900/60 dark:bg-red-950/30">
                  <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-red-600 dark:bg-red-900/50 dark:text-red-300">
                    <MdClose size={24} />
                  </div>
                  <h3 className="text-lg font-semibold text-red-700 dark:text-red-300">
                    Analytics unavailable
                  </h3>
                  <p className="mt-2 text-sm text-red-600/90 dark:text-red-200/90">
                    {error.message || "Failed to load package analytics."}
                  </p>
                </div>
              </div>
            ) : (
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              {/* Active Subscribers */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white"
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-white/20 rounded-lg">
                    <MdPeople size={24} />
                  </div>
                  <span className="text-sm opacity-90">Active Subscribers</span>
                </div>
                <div className="text-3xl font-bold">{activeCount.toLocaleString()}</div>
                <div className="text-xs opacity-75 mt-1">
                  <MdTrendingUp className="inline mr-1" size={14} />
                  {hasGrowthBaseline
                    ? `${growthDirection}${growthRate.toFixed(1)}% vs previous ${growthWindowDays} days`
                    : currentWindowActivations > 0
                      ? `No prior ${growthWindowDays}-day baseline yet`
                      : `No activation trend captured yet`}
                </div>
              </motion.div>

              {/* Total Revenue */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 text-white"
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-white/20 rounded-lg">
                    <MdAttachMoney size={24} />
                  </div>
                  <span className="text-sm opacity-90">Total Revenue</span>
                </div>
                <div className="text-3xl font-bold">
                  ₦{(totalRevenue / 1000000).toFixed(2)}M
                </div>
                <div className="text-xs opacity-75 mt-1">Estimated from active subscriptions</div>
              </motion.div>

              {/* Avg Revenue per User */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-6 text-white"
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-white/20 rounded-lg">
                    <MdTrendingUp size={24} />
                  </div>
                  <span className="text-sm opacity-90">Avg per User</span>
                </div>
                <div className="text-3xl font-bold">
                  ₦{avgRevenuePerUser.toLocaleString(undefined, {
                    maximumFractionDigits: 0,
                  })}
                </div>
                <div className="text-xs opacity-75 mt-1">Per subscriber</div>
              </motion.div>

              {/* Package Status */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className={`bg-gradient-to-br ${
                  pkg?.isActive
                    ? "from-teal-500 to-teal-600"
                    : "from-gray-500 to-gray-600"
                } rounded-xl p-6 text-white`}
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-white/20 rounded-lg">
                    {pkg?.isActive ? <MdCheckCircle size={24} /> : <MdAutorenew size={24} />}
                  </div>
                  <span className="text-sm opacity-90">Package Status</span>
                </div>
                <div className="text-3xl font-bold">
                  {pkg?.isActive ? "Active" : "Inactive"}
                </div>
                <div className="text-xs opacity-75 mt-1">
                  {pkg?.isActive ? "Available for purchase" : "Not available"}
                </div>
              </motion.div>
            </div>

            <div className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-5 dark:border-emerald-900/60 dark:bg-emerald-950/20">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700 dark:text-emerald-300">
                  Current {growthWindowDays}-Day Activations
                </p>
                <p className="mt-2 text-3xl font-bold text-emerald-700 dark:text-emerald-300">
                  {currentWindowActivations.toLocaleString()}
                </p>
                <p className="mt-2 text-sm text-emerald-700/80 dark:text-emerald-200/80">
                  Members activated on this package during the current analytics window.
                </p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-5 dark:border-slate-800 dark:bg-slate-900/60">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-600 dark:text-slate-400">
                  Previous {growthWindowDays}-Day Window
                </p>
                <p className="mt-2 text-3xl font-bold text-slate-900 dark:text-white">
                  {previousWindowActivations.toLocaleString()}
                </p>
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                  Used as the comparison baseline for trend reporting when enough live data exists.
                </p>
              </div>
            </div>

            {/* Pricing Breakdown */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Pricing Breakdown
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-3 bg-white dark:bg-gray-800 rounded-lg">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Base Price</span>
                    <span className="text-lg font-semibold text-gray-900 dark:text-white">
                      ₦{pkg?.price.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-white dark:bg-gray-800 rounded-lg">
                    <span className="text-sm text-gray-600 dark:text-gray-400">VAT (7.5%)</span>
                    <span className="text-lg font-semibold text-gray-900 dark:text-white">
                      ₦{pkg?.vat.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                    <span className="text-sm font-medium text-green-700 dark:text-green-300">
                      Total Price
                    </span>
                    <span className="text-xl font-bold text-green-600 dark:text-green-400">
                      ₦{((pkg?.price || 0) + (pkg?.vat || 0)).toLocaleString()}
                    </span>
                  </div>
                  {pkg?.hasRenewal && pkg?.renewalFee && (
                    <div className="flex justify-between items-center p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                      <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
                        Renewal Fee
                      </span>
                      <span className="text-lg font-semibold text-blue-600 dark:text-blue-400">
                        ₦{pkg.renewalFee.toLocaleString()}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Reward Distribution Summary */}
              <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Total Reward Distribution
                </h3>
                <div className="space-y-3">
                  {(() => {
                    const totalCash = [1, 2, 3, 4].reduce(
                      (sum, l) => sum + ((pkg as any)?.[`cash_l${l}`] || 0),
                      0
                    );
                    const totalBpt = [1, 2, 3, 4].reduce(
                      (sum, l) => sum + ((pkg as any)?.[`bpt_l${l}`] || 0),
                      0
                    );
                    const totalPalliative = [1, 2, 3, 4].reduce(
                      (sum, l) => sum + ((pkg as any)?.[`palliative_l${l}`] || 0),
                      0
                    );

                    return (
                      <>
                        <div className="flex justify-between items-center p-3 bg-white dark:bg-gray-800 rounded-lg">
                          <span className="text-sm text-gray-600 dark:text-gray-400">
                            Total Cash Rewards
                          </span>
                          <span className="text-lg font-semibold text-green-600 dark:text-green-400">
                            ₦{totalCash.toLocaleString()}
                          </span>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-white dark:bg-gray-800 rounded-lg">
                          <span className="text-sm text-gray-600 dark:text-gray-400">
                            Total BPT Rewards
                          </span>
                          <span className="text-lg font-semibold text-blue-600 dark:text-blue-400">
                            ₦{totalBpt.toLocaleString()}
                          </span>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-white dark:bg-gray-800 rounded-lg">
                          <span className="text-sm text-gray-600 dark:text-gray-400">
                            Total Palliative Rewards
                          </span>
                          <span className="text-lg font-semibold text-purple-600 dark:text-purple-400">
                            ₦{totalPalliative.toLocaleString()}
                          </span>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-gray-100 dark:bg-gray-700 rounded-lg border-t-2 border-gray-300 dark:border-gray-600">
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            Total All Rewards
                          </span>
                          <span className="text-xl font-bold text-gray-900 dark:text-white">
                            ₦{(totalCash + totalBpt + totalPalliative).toLocaleString()}
                          </span>
                        </div>
                      </>
                    );
                  })()}
                </div>
              </div>
            </div>

            {/* Reward Distribution by Level */}
            <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Reward Distribution by Referral Level
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {[1, 2, 3, 4].map((level) => {
                  const cash = (pkg as any)?.[`cash_l${level}`] || 0;
                  const bpt = (pkg as any)?.[`bpt_l${level}`] || 0;
                  const palliative = (pkg as any)?.[`palliative_l${level}`] || 0;
                  const total = cash + bpt + palliative;

                  return (
                    <motion.div
                      key={level}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.1 * level }}
                      className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700"
                    >
                      <div className="text-center mb-3">
                        <div className="inline-flex items-center justify-center w-10 h-10 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-full font-bold mb-2">
                          L{level}
                        </div>
                        <h4 className="font-semibold text-gray-900 dark:text-white">
                          Level {level}
                        </h4>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between text-xs">
                          <span className="text-gray-600 dark:text-gray-400">Cash:</span>
                          <span className="font-semibold text-gray-900 dark:text-white">
                            ₦{cash.toLocaleString()}
                          </span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="text-gray-600 dark:text-gray-400">BPT:</span>
                          <span className="font-semibold text-gray-900 dark:text-white">
                            ₦{bpt.toLocaleString()}
                          </span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="text-gray-600 dark:text-gray-400">Palliative:</span>
                          <span className="font-semibold text-gray-900 dark:text-white">
                            ₦{palliative.toLocaleString()}
                          </span>
                        </div>
                        <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                          <div className="flex justify-between text-sm font-semibold">
                            <span className="text-gray-700 dark:text-gray-300">Total:</span>
                            <span className="text-green-600 dark:text-green-400">
                              ₦{total.toLocaleString()}
                            </span>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
            )}
          </div>
        </div>
      </motion.div>
    </>
  );
}
