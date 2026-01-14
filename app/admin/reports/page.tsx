"use client";

import { motion } from "framer-motion";
import { api } from "@/client/trpc";
import { useState } from "react";
import {
  MdTrendingUp,
  MdAttachMoney,
  MdPeople,
  MdShowChart,
  MdCalendarToday,
  MdFileDownload,
} from "react-icons/md";

type Period = "7d" | "30d" | "90d" | "1y";

export default function ReportsPage() {
  const [revenuePeriod, setRevenuePeriod] = useState<Period>("30d");
  const [userPeriod, setUserPeriod] = useState<Period>("30d");

  const { data: revenueData, isLoading: revenueLoading } =
    api.admin.getRevenueAnalytics.useQuery({ period: revenuePeriod });

  const { data: userData, isLoading: userLoading } =
    api.admin.getUserGrowthAnalytics.useQuery({ period: userPeriod });

  const periodLabels = {
    "7d": "Last 7 Days",
    "30d": "Last 30 Days",
    "90d": "Last 90 Days",
    "1y": "Last Year",
  };

  return (
    <div className="min-h-screen pb-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-7xl mx-auto"
      >
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="premium-gradient-text text-4xl font-bold">Reports & Trends</h1>
              <p className="text-muted-foreground mt-1 font-medium">
                Detailed analytics and historical data trends
              </p>
            </div>
            <button
              onClick={async () => {
                try {
                  const usersQ = api.admin.exportUsersToCSV.useQuery({ filters: {} }, { enabled: false });
                  const paymentsQ = api.admin.exportPaymentsToCSV.useQuery({ filters: {} }, { enabled: false });
                  const packagesQ = api.admin.exportPackagesToCSV.useQuery(undefined, { enabled: false });
                  const [users, payments, packages] = await Promise.all([
                    usersQ.refetch(),
                    paymentsQ.refetch(),
                    packagesQ.refetch(),
                  ]);

                  const files = [users.data, payments.data, packages.data].filter(Boolean) as any[];
                  files.forEach((f) => {
                    const blob = new Blob([f.data], { type: "text/csv;charset=utf-8;" });
                    const link = document.createElement("a");
                    const url = URL.createObjectURL(blob);
                    link.setAttribute("href", url);
                    link.setAttribute("download", f.filename);
                    link.style.visibility = "hidden";
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                  });
                } catch (e) {
                  console.error("Export All failed", e);
                }
              }}
              className="premium-button flex items-center gap-2 px-4 py-2 text-white rounded-xl shadow-lg font-semibold"
            >
              <MdFileDownload size={20} />
              <span>Export All</span>
            </button>
          </div>
        </div>

        {/* Revenue Analytics */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="premium-card rounded-2xl p-6 mb-8"
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-[hsl(var(--secondary))]/15 rounded-xl border border-border/60">
                <MdAttachMoney className="text-[hsl(var(--primary))]" size={24} />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  Revenue Trends
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Track revenue performance over time
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {(["7d", "30d", "90d", "1y"] as Period[]).map((period) => (
                <button
                  key={period}
                  onClick={() => setRevenuePeriod(period)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    revenuePeriod === period
                      ? "bg-[hsl(var(--primary))] text-white"
                      : "bg-background/60 border border-border text-foreground/80 hover:bg-background"
                  }`}
                >
                  {periodLabels[period]}
                </button>
              ))}
            </div>
          </div>

          {revenueLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="w-12 h-12 border-4 border-green-600 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <>
              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-lg p-4 border border-green-200 dark:border-green-800">
                  <div className="flex items-center gap-2 mb-2">
                    <MdTrendingUp className="text-green-600 dark:text-green-400" size={20} />
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      Total Revenue
                    </span>
                  </div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    ₦{((revenueData?.totalRevenue || 0) / 1000000).toFixed(2)}M
                  </p>
                </div>
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
                  <div className="flex items-center gap-2 mb-2">
                    <MdShowChart className="text-blue-600 dark:text-blue-400" size={20} />
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      Avg per Day
                    </span>
                  </div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    ₦{((revenueData?.averagePerDay || 0) / 1000).toFixed(1)}K
                  </p>
                </div>
                <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-lg p-4 border border-purple-200 dark:border-purple-800">
                  <div className="flex items-center gap-2 mb-2">
                    <MdCalendarToday className="text-purple-600 dark:text-purple-400" size={20} />
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      Transactions
                    </span>
                  </div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {revenueData?.transactionCount.toLocaleString()}
                  </p>
                </div>
              </div>

              {/* Chart */}
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">
                  Daily Revenue ({periodLabels[revenuePeriod]})
                </h3>
                {revenueData?.chartData && revenueData.chartData.length > 0 ? (
                  <div className="space-y-1">
                    {revenueData.chartData.slice(-30).map((item, idx) => {
                      const maxAmount = Math.max(...revenueData.chartData.map((d) => d.amount));
                      const percentage = (item.amount / maxAmount) * 100;
                      const date = new Date(item.date);

                      return (
                        <motion.div
                          key={idx}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: idx * 0.02 }}
                          className="flex items-center gap-3"
                        >
                          <div className="w-24 text-xs text-gray-600 dark:text-gray-400">
                            {date.toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                            })}
                          </div>
                          <div className="flex-1 bg-gray-100 dark:bg-gray-700 rounded-full h-8 overflow-hidden relative">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${percentage}%` }}
                              transition={{ delay: idx * 0.02 + 0.2, duration: 0.5 }}
                              className="bg-gradient-to-r from-green-500 to-green-600 h-full flex items-center justify-end pr-3"
                            >
                              {percentage > 20 && (
                                <span className="text-xs font-medium text-white">
                                  ₦{(item.amount / 1000).toFixed(1)}K
                                </span>
                              )}
                            </motion.div>
                          </div>
                          {percentage <= 20 && (
                            <div className="w-20 text-xs font-medium text-gray-900 dark:text-white">
                              ₦{(item.amount / 1000).toFixed(1)}K
                            </div>
                          )}
                        </motion.div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                    No revenue data for this period
                  </div>
                )}
              </div>
            </>
          )}
        </motion.div>

        {/* User Growth Analytics */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6"
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <MdPeople className="text-blue-600 dark:text-blue-400" size={24} />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  User Growth Trends
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Monitor user registrations and activations
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {(["7d", "30d", "90d", "1y"] as Period[]).map((period) => (
                <button
                  key={period}
                  onClick={() => setUserPeriod(period)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    userPeriod === period
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                  }`}
                >
                  {periodLabels[period]}
                </button>
              ))}
            </div>
          </div>

          {userLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <>
              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
                  <div className="flex items-center gap-2 mb-2">
                    <MdPeople className="text-blue-600 dark:text-blue-400" size={20} />
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      Total Registrations
                    </span>
                  </div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {userData?.totalRegistrations.toLocaleString()}
                  </p>
                </div>
                <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-lg p-4 border border-green-200 dark:border-green-800">
                  <div className="flex items-center gap-2 mb-2">
                    <MdTrendingUp className="text-green-600 dark:text-green-400" size={20} />
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      Total Activations
                    </span>
                  </div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {userData?.totalActivations.toLocaleString()}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {userData?.totalRegistrations
                      ? ((userData.totalActivations / userData.totalRegistrations) * 100).toFixed(1)
                      : 0}
                    % conversion rate
                  </p>
                </div>
              </div>

              {/* Chart */}
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">
                  Daily Activity ({periodLabels[userPeriod]})
                </h3>
                {userData?.chartData && userData.chartData.length > 0 ? (
                  <div className="space-y-2">
                    {userData.chartData.slice(-30).map((item, idx) => {
                      const maxCount = Math.max(
                        ...userData.chartData.map((d) => Math.max(d.registrations, d.activations))
                      );
                      const regPercentage = (item.registrations / maxCount) * 100;
                      const actPercentage = (item.activations / maxCount) * 100;
                      const date = new Date(item.date);

                      return (
                        <motion.div
                          key={idx}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: idx * 0.02 }}
                          className="space-y-1"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-24 text-xs text-gray-600 dark:text-gray-400">
                              {date.toLocaleDateString("en-US", {
                                month: "short",
                                day: "numeric",
                              })}
                            </div>
                            <div className="flex-1 space-y-1">
                              {/* Registrations */}
                              <div className="flex items-center gap-2">
                                <div className="w-16 text-xs text-blue-600 dark:text-blue-400">
                                  Register
                                </div>
                                <div className="flex-1 bg-gray-100 dark:bg-gray-700 rounded-full h-6 overflow-hidden relative">
                                  <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${regPercentage}%` }}
                                    transition={{ delay: idx * 0.02 + 0.2, duration: 0.5 }}
                                    className="bg-gradient-to-r from-blue-500 to-blue-600 h-full flex items-center justify-end pr-2"
                                  >
                                    {regPercentage > 15 && (
                                      <span className="text-xs font-medium text-white">
                                        {item.registrations}
                                      </span>
                                    )}
                                  </motion.div>
                                </div>
                                {regPercentage <= 15 && (
                                  <div className="w-12 text-xs font-medium text-gray-900 dark:text-white">
                                    {item.registrations}
                                  </div>
                                )}
                              </div>
                              {/* Activations */}
                              <div className="flex items-center gap-2">
                                <div className="w-16 text-xs text-green-600 dark:text-green-400">
                                  Activate
                                </div>
                                <div className="flex-1 bg-gray-100 dark:bg-gray-700 rounded-full h-6 overflow-hidden relative">
                                  <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${actPercentage}%` }}
                                    transition={{ delay: idx * 0.02 + 0.3, duration: 0.5 }}
                                    className="bg-gradient-to-r from-green-500 to-green-600 h-full flex items-center justify-end pr-2"
                                  >
                                    {actPercentage > 15 && (
                                      <span className="text-xs font-medium text-white">
                                        {item.activations}
                                      </span>
                                    )}
                                  </motion.div>
                                </div>
                                {actPercentage <= 15 && (
                                  <div className="w-12 text-xs font-medium text-gray-900 dark:text-white">
                                    {item.activations}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                    No user data for this period
                  </div>
                )}
              </div>
            </>
          )}
        </motion.div>
      </motion.div>
    </div>
  );
}
