"use client";

import { motion } from "framer-motion";
import { api } from "@/client/trpc";
import toast from "react-hot-toast";
import {
  MdPeople,
  MdAttachMoney,
  MdTrendingUp,
  MdAssignment,
  MdCheckCircle,
  MdPending,
  MdCardMembership,
  MdRefresh,
} from "react-icons/md";
import { useState } from "react";

export default function AnalyticsPage() {
  const [refreshKey, setRefreshKey] = useState(0);

  const { data: analytics, isLoading, refetch } = api.admin.getSystemAnalytics.useQuery(undefined, {
    refetchInterval: 60000, // Refresh every minute
  });

  const handleRefresh = async () => {
    const t = toast.loading("Refreshing analytics...");
    try {
      await refetch();
      setRefreshKey((prev) => prev + 1);
      toast.success("Analytics refreshed");
    } catch (e: any) {
      toast.error(e?.message || "Failed to refresh");
    } finally {
      toast.dismiss(t);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="w-12 h-12 border-4 border-[hsl(var(--primary))] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-7xl mx-auto"
      >
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="relative overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-card via-[hsl(var(--muted))] to-card p-8 shadow-xl shadow-black/5 backdrop-blur-sm dark:shadow-black/20"
        >
          <div className="absolute -top-20 -right-20 h-40 w-40 rounded-full bg-gradient-to-br from-[hsl(var(--secondary))] to-[hsl(var(--primary))] opacity-10 blur-2xl" />
          <div className="relative flex items-center justify-between gap-4">
            <div className="min-w-0">
              <h1 className="premium-gradient-text text-4xl font-bold">System Analytics</h1>
              <p className="text-muted-foreground mt-1 font-medium">
                Real-time system metrics and performance overview
              </p>
            </div>
            <button
              onClick={handleRefresh}
              className="flex items-center gap-2 rounded-xl border border-border bg-background/60 px-4 py-2.5 font-semibold text-foreground/80 shadow-sm transition-all hover:bg-background hover:text-foreground"
            >
              <MdRefresh size={20} />
              <span>Refresh</span>
            </button>
          </div>
        </motion.div>

        {/* Key Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Total Users */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="premium-stat-card bg-gradient-to-br from-[hsl(var(--primary))] to-[hsl(var(--secondary))] rounded-2xl p-6 text-white shadow-xl shadow-black/10"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="p-3 bg-white/20 rounded-lg">
                <MdPeople size={28} />
              </div>
              <div className="flex-1">
                <p className="text-sm opacity-90">Total Users</p>
                <p className="text-3xl font-bold">{analytics?.users.total.toLocaleString()}</p>
              </div>
            </div>
            <div className="pt-3 border-t border-white/20">
              <div className="flex justify-between text-sm">
                <span className="opacity-90">Active:</span>
                <span className="font-semibold">{analytics?.users.active.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm mt-1">
                <span className="opacity-90">New (30d):</span>
                <span className="font-semibold">
                  +{analytics?.users.newLast30Days.toLocaleString()}
                </span>
              </div>
            </div>
          </motion.div>

          {/* Total Revenue */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="premium-stat-card bg-gradient-to-br from-[hsl(var(--primary))] to-[hsl(var(--secondary))] rounded-2xl p-6 text-white shadow-xl shadow-black/10"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="p-3 bg-white/20 rounded-lg">
                <MdAttachMoney size={28} />
              </div>
              <div className="flex-1">
                <p className="text-sm opacity-90">Total Revenue</p>
                <p className="text-3xl font-bold">
                  ₦{((analytics?.payments.totalAmount || 0) / 1000000).toFixed(2)}M
                </p>
              </div>
            </div>
            <div className="pt-3 border-t border-white/20">
              <div className="flex justify-between text-sm">
                <span className="opacity-90">Approved:</span>
                <span className="font-semibold">
                  {analytics?.payments.approved.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between text-sm mt-1">
                <span className="opacity-90">Pending:</span>
                <span className="font-semibold">
                  {analytics?.payments.pending.toLocaleString()}
                </span>
              </div>
            </div>
          </motion.div>

          {/* Active Packages */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="premium-stat-card bg-gradient-to-br from-[hsl(var(--primary))] to-[hsl(var(--secondary))] rounded-2xl p-6 text-white shadow-xl shadow-black/10"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="p-3 bg-white/20 rounded-lg">
                <MdCardMembership size={28} />
              </div>
              <div className="flex-1">
                <p className="text-sm opacity-90">Packages</p>
                <p className="text-3xl font-bold">{analytics?.packages.active}</p>
              </div>
            </div>
            <div className="pt-3 border-t border-white/20">
              <div className="flex justify-between text-sm">
                <span className="opacity-90">Total:</span>
                <span className="font-semibold">{analytics?.packages.total}</span>
              </div>
              <div className="flex justify-between text-sm mt-1">
                <span className="opacity-90">Active Rate:</span>
                <span className="font-semibold">
                  {analytics?.packages.total
                    ? ((analytics.packages.active / analytics.packages.total) * 100).toFixed(0)
                    : 0}
                  %
                </span>
              </div>
            </div>
          </motion.div>

          {/* Recent Activity */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl p-6 text-white"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="p-3 bg-white/20 rounded-lg">
                <MdTrendingUp size={28} />
              </div>
              <div className="flex-1">
                <p className="text-sm opacity-90">Activity (7d)</p>
                <p className="text-3xl font-bold">
                  {(analytics?.activity.recentPayments || 0) +
                    (analytics?.activity.recentActivations || 0)}
                </p>
              </div>
            </div>
            <div className="pt-3 border-t border-white/20">
              <div className="flex justify-between text-sm">
                <span className="opacity-90">Payments:</span>
                <span className="font-semibold">
                  {analytics?.activity.recentPayments.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between text-sm mt-1">
                <span className="opacity-90">Activations:</span>
                <span className="font-semibold">
                  {analytics?.activity.recentActivations.toLocaleString()}
                </span>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Revenue by Package */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 mb-8"
        >
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
            Revenue by Package
          </h2>
          <div className="space-y-4">
            {analytics?.revenue.byPackage
              .sort((a, b) => b.revenue - a.revenue)
              .map((pkg, idx) => {
                const maxRevenue = Math.max(...analytics.revenue.byPackage.map((p) => p.revenue));
                const percentage = (pkg.revenue / maxRevenue) * 100;

                return (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.6 + idx * 0.05 }}
                    className="space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-gray-900 dark:text-white">
                          {pkg.packageName}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {pkg.subscribers} subscriber{pkg.subscribers !== 1 ? "s" : ""}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-green-600 dark:text-green-400">
                          ₦{(pkg.revenue / 1000000).toFixed(2)}M
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {((pkg.revenue / analytics.revenue.total) * 100).toFixed(1)}% of total
                        </p>
                      </div>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${percentage}%` }}
                        transition={{ delay: 0.8 + idx * 0.05, duration: 0.5 }}
                        className="bg-gradient-to-r from-green-500 to-blue-500 h-2 rounded-full"
                      />
                    </div>
                  </motion.div>
                );
              })}
          </div>
        </motion.div>

        {/* User Breakdown */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* User Status */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6"
          >
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">User Status</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                <div className="flex items-center gap-3">
                  <MdCheckCircle className="text-green-600 dark:text-green-400" size={24} />
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white">Active Members</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      With membership package
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {analytics?.users.active.toLocaleString()}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {analytics?.users.total
                      ? ((analytics.users.active / analytics.users.total) * 100).toFixed(1)
                      : 0}
                    %
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-3">
                  <MdPending className="text-gray-600 dark:text-gray-400" size={24} />
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white">Inactive Users</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      No membership package
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-gray-600 dark:text-gray-400">
                    {((analytics?.users.total || 0) - (analytics?.users.active || 0)).toLocaleString()}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {analytics?.users.inactivePercentage.toFixed(1)}%
                  </p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Payment Status */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6"
          >
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
              Payment Overview
            </h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                <div className="flex items-center gap-3">
                  <MdCheckCircle className="text-green-600 dark:text-green-400" size={24} />
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white">Approved</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Successfully processed
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {analytics?.payments.approved.toLocaleString()}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {analytics?.payments.total
                      ? ((analytics.payments.approved / analytics.payments.total) * 100).toFixed(1)
                      : 0}
                    %
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-800">
                <div className="flex items-center gap-3">
                  <MdPending className="text-orange-600 dark:text-orange-400" size={24} />
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white">Pending Review</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Awaiting approval
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                    {analytics?.payments.pending.toLocaleString()}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {analytics?.payments.total
                      ? ((analytics.payments.pending / analytics.payments.total) * 100).toFixed(1)
                      : 0}
                    %
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}
