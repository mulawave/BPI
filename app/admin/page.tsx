"use client";

import * as React from "react";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import {
  MdPeople,
  MdPayment,
  MdTrendingUp,
  MdNotifications,
  MdAccountBalance,
  MdCheckCircle,
  MdPending,
  MdAttachMoney,
  MdRefresh,
  MdCallReceived,
  MdInfo,
  MdExpandMore,
  MdExpandLess,
} from "react-icons/md";
import { HiSparkles, HiLightningBolt } from "react-icons/hi";
import { AnimatePresence } from "framer-motion";
import { api } from "@/client/trpc";
import { useCurrency } from "@/contexts/CurrencyContext";
import StatsCard from "@/components/admin/StatsCard";
import RecentActivity from "@/components/admin/RecentActivity";
import QuickActions from "@/components/admin/QuickActions";
import AnalyticsCharts from "@/components/admin/AnalyticsCharts";
import DashboardAlerts from "@/components/admin/DashboardAlerts";
import PerformanceWidget from "@/components/admin/PerformanceWidget";
import QuickStatsWidget from "@/components/admin/QuickStatsWidget";
import GlobalSearch from "@/components/admin/GlobalSearch";
import AdminActivityTracker from "@/components/admin/AdminActivityTracker";

export default function AdminDashboardPage() {
  const { formatAmount } = useCurrency();
  const [showUserGuide, setShowUserGuide] = React.useState(false);

  // Get dashboard statistics
  const { data: stats, isLoading, error: statsError, refetch: refetchStats } = api.admin.getDashboardStats.useQuery();

  // Paginated recent activity
  const [activityCursor, setActivityCursor] = React.useState<string | undefined>(undefined);
  const { data: activityPage, isFetching: isFetchingActivity, error: activityError, refetch: refetchActivity } = api.admin.getRecentActivity.useQuery({
    limit: 10,
    cursor: activityCursor,
  });
  const activities = activityPage?.items || [];

  // Get new enhanced data
  const { data: alerts, error: alertsError, refetch: refetchAlerts } = api.admin.getDashboardAlerts.useQuery();
  const { data: performance, error: perfError, refetch: refetchPerformance } = api.admin.getPerformanceMetrics.useQuery();
  const { data: quickStats, error: quickStatsError, refetch: refetchQuickStats } = api.admin.getQuickStats.useQuery();

  React.useEffect(() => {
    const err = statsError || activityError || alertsError || perfError || quickStatsError;
    if (err) {
      toast.error((err as any)?.message || "Failed to load some dashboard data");
    }
  }, [statsError, activityError, alertsError, perfError, quickStatsError]);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gradient-to-br from-[hsl(var(--muted))] via-[hsl(var(--background))] to-[hsl(var(--accent))] dark:from-[hsl(var(--background))] dark:via-[hsl(var(--card))] dark:to-[hsl(var(--background))]">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative"
        >
          <div className="absolute inset-0 rounded-full bg-gradient-to-r from-[hsl(var(--primary))] to-[hsl(var(--secondary))] opacity-20 blur-3xl animate-pulse" />
          <div className="relative h-20 w-20 animate-spin rounded-full border-4 border-border border-t-[hsl(var(--primary))]" />
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen space-y-8 pb-12">
      {/* Premium Background Elements */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-40 -right-40 h-96 w-96 rounded-full bg-gradient-to-br from-[hsl(var(--secondary))] to-[hsl(var(--primary))] opacity-10 blur-3xl dark:opacity-5" />
        <div className="absolute top-1/3 -left-40 h-96 w-96 rounded-full bg-gradient-to-br from-[hsl(var(--primary))] to-[hsl(var(--secondary))] opacity-10 blur-3xl dark:opacity-5" />
      </div>

      {/* Page Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="relative overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-card via-[hsl(var(--muted))] to-card p-8 shadow-xl shadow-black/5 backdrop-blur-sm dark:shadow-black/20"
      >
        <div className="absolute -top-20 -right-20 h-40 w-40 rounded-full bg-gradient-to-br from-[hsl(var(--secondary))] to-[hsl(var(--primary))] opacity-10 blur-2xl" />
        <div className="relative flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-3">
              <motion.div
                initial={{ rotate: -180, scale: 0 }}
                animate={{ rotate: 0, scale: 1 }}
                transition={{ delay: 0.3, type: "spring" }}
                className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-[hsl(var(--primary))] to-[hsl(var(--secondary))] shadow-lg shadow-black/10"
              >
                <HiLightningBolt className="h-7 w-7 text-white" />
              </motion.div>
              <div>
                <h1 className="premium-gradient-text text-4xl font-bold">
                  Command Center
                </h1>
                <div className="flex items-center gap-2 mt-1">
                  <HiSparkles className="h-4 w-4 text-[hsl(var(--secondary))]" />
                  <p className="text-sm font-medium text-muted-foreground">
                    Real-time platform intelligence & control
                  </p>
                </div>
              </div>
            </div>
          </div>
            <div className="flex items-center gap-3">
              <button
                onClick={async () => {
                  const t = toast.loading("Refreshing...");
                  try {
                    await Promise.all([
                      refetchStats(),
                      refetchActivity(),
                      refetchAlerts(),
                      refetchPerformance(),
                      refetchQuickStats(),
                    ]);
                    toast.success("Dashboard refreshed");
                  } catch (e) {
                    toast.error("Refresh failed");
                  } finally {
                    toast.dismiss(t);
                  }
                }}
                className="rounded-lg border px-3 py-1.5 text-sm hover:bg-muted flex items-center gap-1"
              >
                <MdRefresh />
                <span>Refresh</span>
              </button>
              <GlobalSearch />
            </div>
        </div>
      </motion.div>

      {/* User Guide */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.02 }}
        className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 rounded-2xl shadow-lg border-2 border-blue-200 dark:border-blue-800 overflow-hidden"
      >
        <button
          onClick={() => setShowUserGuide(!showUserGuide)}
          className="w-full px-6 py-4 flex items-center justify-between hover:bg-blue-100/50 dark:hover:bg-blue-900/20 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500 rounded-lg">
              <MdInfo className="w-6 h-6 text-white" />
            </div>
            <div className="text-left">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                Admin Dashboard Guide
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Click to {showUserGuide ? "hide" : "view"} dashboard overview & features
              </p>
            </div>
          </div>
          {showUserGuide ? (
            <MdExpandLess className="w-6 h-6 text-gray-600 dark:text-gray-400" />
          ) : (
            <MdExpandMore className="w-6 h-6 text-gray-600 dark:text-gray-400" />
          )}
        </button>

        <AnimatePresence>
          {showUserGuide && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="border-t border-blue-200 dark:border-blue-800"
            >
              <div className="px-6 py-6 space-y-6">
                {/* Dashboard Overview */}
                <div>
                  <h4 className="text-md font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                    <HiLightningBolt className="w-5 h-5 text-blue-600" />
                    Dashboard Overview
                  </h4>
                  <p className="text-sm text-gray-700 dark:text-gray-300 mb-3">
                    The Command Center provides real-time platform intelligence and administrative control over all system operations.
                  </p>
                  <ul className="list-disc list-inside space-y-1 text-sm text-gray-700 dark:text-gray-300 ml-6">
                    <li>Monitor key performance indicators (KPIs) at a glance</li>
                    <li>Track user growth, revenue, and system activity</li>
                    <li>View critical alerts and pending actions</li>
                    <li>Access quick actions for common administrative tasks</li>
                    <li>Analyze trends with interactive charts and graphs</li>
                  </ul>
                </div>

                {/* Key Statistics */}
                <div>
                  <h4 className="text-md font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                    <MdTrendingUp className="w-5 h-5 text-green-600" />
                    Key Statistics
                  </h4>
                  <ul className="list-disc list-inside space-y-1 text-sm text-gray-700 dark:text-gray-300 ml-6">
                    <li><span className="font-semibold">Total Users</span> - Total registered members with growth percentage</li>
                    <li><span className="font-semibold">Pending Payments</span> - Payments awaiting verification (click to review)</li>
                    <li><span className="font-semibold">Pending Withdrawals</span> - Withdrawal requests requiring approval</li>
                    <li><span className="font-semibold">Total Revenue</span> - Platform earnings with trend indicator</li>
                    <li><span className="font-semibold">Active Packages</span> - Currently active membership packages</li>
                  </ul>
                </div>

                {/* Alerts & Monitoring */}
                <div>
                  <h4 className="text-md font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                    <MdNotifications className="w-5 h-5 text-orange-600" />
                    Alerts & Monitoring
                  </h4>
                  <ul className="list-disc list-inside space-y-1 text-sm text-gray-700 dark:text-gray-300 ml-6">
                    <li>Critical system alerts appear at the top of the dashboard</li>
                    <li>Color-coded urgency levels (red = critical, orange = warning, green = info)</li>
                    <li>Click on alerts for more details or quick actions</li>
                    <li>Dismiss alerts once resolved</li>
                  </ul>
                </div>

                {/* Recent Activity */}
                <div>
                  <h4 className="text-md font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                    <MdPeople className="w-5 h-5 text-purple-600" />
                    Recent Activity Stream
                  </h4>
                  <ul className="list-disc list-inside space-y-1 text-sm text-gray-700 dark:text-gray-300 ml-6">
                    <li>Real-time feed of user actions and system events</li>
                    <li>Includes registrations, payments, withdrawals, package activations</li>
                    <li>Paginated for performance - load more as needed</li>
                    <li>Timestamps show relative time (e.g., "2 hours ago")</li>
                  </ul>
                </div>

                {/* Quick Actions */}
                <div>
                  <h4 className="text-md font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                    <MdCheckCircle className="w-5 h-5 text-green-600" />
                    Quick Actions
                  </h4>
                  <ul className="list-disc list-inside space-y-1 text-sm text-gray-700 dark:text-gray-300 ml-6">
                    <li>One-click access to frequently used admin functions</li>
                    <li>Review pending payments and withdrawals</li>
                    <li>Manage users, packages, and community content</li>
                    <li>Access reports and analytics</li>
                  </ul>
                </div>

                {/* Features */}
                <div className="pt-4 border-t border-blue-200 dark:border-blue-700">
                  <h4 className="text-md font-bold text-gray-900 dark:text-white mb-3">
                    ✨ Dashboard Features
                  </h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      Real-time data refresh
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      Interactive analytics charts
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      Performance metrics tracking
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      Global search functionality
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      Activity tracking & audit logs
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      Dark mode support
                    </div>
                  </div>
                </div>

                {/* Pro Tip */}
                <div className="bg-white dark:bg-bpi-dark-card rounded-lg p-4">
                  <h5 className="font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                    <HiSparkles className="w-4 h-4 text-yellow-500" />
                    Pro Tip
                  </h5>
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    Use the <span className="font-bold">Refresh button</span> in the header to update all dashboard data at once. 
                    The <span className="font-bold">Global Search</span> lets you quickly find users, transactions, or any content across the platform.
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Alerts */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.05 }}
      >
        {alertsError ? (
          <div className="rounded-2xl border border-border bg-card/75 p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold">Alerts failed to load</span>
              <button onClick={() => refetchAlerts()} className="rounded-lg border px-3 py-1.5 text-xs hover:bg-muted">Retry</button>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">{alertsError.message}</p>
          </div>
        ) : alerts && alerts.length > 0 ? (
          <DashboardAlerts alerts={alerts} />
        ) : (
          <div className="rounded-2xl border border-border bg-card/75 p-6 animate-pulse">
            <div className="h-4 w-32 bg-muted rounded" />
            <div className="mt-3 h-3 w-full bg-muted/70 rounded" />
            <div className="mt-2 h-3 w-5/6 bg-muted/70 rounded" />
          </div>
        )}
      </motion.div>

      {/* Stats Grid */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.15 }}
        className="grid gap-5 sm:grid-cols-2 lg:grid-cols-5"
      >
        <motion.div
          whileHover={{ y: -4, scale: 1.02 }}
          transition={{ type: "spring", stiffness: 300 }}
        >
          <StatsCard
            title="Total Users"
            value={stats?.totalUsers || 0}
            change={stats?.usersChange || 0}
            icon={MdPeople}
            color="green"
          />
        </motion.div>
        <motion.div
          whileHover={{ y: -4, scale: 1.02 }}
          transition={{ type: "spring", stiffness: 300 }}
        >
          <StatsCard
            title="Pending Payments"
            value={stats?.pendingPayments || 0}
            icon={MdPending}
            color="orange"
            badge="Action Required"
            href="/admin/payments"
          />
        </motion.div>
        <motion.div
          whileHover={{ y: -4, scale: 1.02 }}
          transition={{ type: "spring", stiffness: 300 }}
        >
          <StatsCard
            title="Pending Withdrawals"
            value={stats?.pendingWithdrawals || 0}
            icon={MdCallReceived}
            color="red"
            badge={stats?.pendingWithdrawals && stats.pendingWithdrawals > 0 ? "Review Now" : undefined}
            href="/admin/withdrawals"
          />
        </motion.div>
        <motion.div
          whileHover={{ y: -4, scale: 1.02 }}
          transition={{ type: "spring", stiffness: 300 }}
        >
          <StatsCard
            title="Total Revenue"
            value={formatAmount(stats?.totalRevenue || 0)}
            change={stats?.revenueChange || 0}
            icon={MdAttachMoney}
            color="green"
          />
        </motion.div>
        <motion.div
          whileHover={{ y: -4, scale: 1.02 }}
          transition={{ type: "spring", stiffness: 300 }}
        >
          <StatsCard
            title="Active Members"
            value={stats?.activeMembers || 0}
            change={stats?.membersChange || 0}
            icon={MdCheckCircle}
            color="orange"
          />
        </motion.div>
      </motion.div>

      {/* Charts */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.25 }}
        className="relative overflow-hidden rounded-2xl border border-border bg-card/75 backdrop-blur-xl shadow-xl shadow-black/5 dark:shadow-black/20"
      >
        <div className="absolute -top-20 -left-20 h-40 w-40 rounded-full bg-gradient-to-br from-[hsl(var(--secondary))] to-[hsl(var(--primary))] opacity-8 blur-3xl" />
        <div className="relative">
          <AnalyticsCharts />
        </div>
      </motion.div>

      {/* Activity & Actions Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Recent Activity - 2 columns */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.35 }}
          className="lg:col-span-2"
        >
          <div className="relative overflow-hidden rounded-2xl border border-border bg-card/75 backdrop-blur-xl shadow-xl shadow-black/5 dark:shadow-black/20">
            <div className="absolute -bottom-20 -right-20 h-40 w-40 rounded-full bg-gradient-to-br from-[hsl(var(--primary))] to-[hsl(var(--secondary))] opacity-8 blur-3xl" />
            <div className="relative">
              <RecentActivity
                activities={activities}
                hasMore={Boolean(activityPage?.nextCursor)}
                loadingMore={isFetchingActivity}
                onLoadMore={() => {
                  if (activityPage?.nextCursor) setActivityCursor(activityPage.nextCursor);
                }}
              />
            </div>
          </div>
        </motion.div>

        {/* Quick Actions - 1 column */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.35 }}
        >
          <div className="relative overflow-hidden rounded-2xl border border-border bg-card/75 backdrop-blur-xl shadow-xl shadow-black/5 dark:shadow-black/20">
            <div className="absolute -top-20 -right-20 h-40 w-40 rounded-full bg-gradient-to-br from-[hsl(var(--secondary))] to-[hsl(var(--primary))] opacity-8 blur-3xl" />
            <div className="relative">
              <QuickActions pendingCount={stats?.pendingPayments || 0} />
            </div>
          </div>
        </motion.div>
      </div>

      {/* Additional Widgets */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Performance Metrics */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.45 }}
        >
          <div className="relative overflow-hidden rounded-2xl border border-border bg-card/75 backdrop-blur-xl shadow-xl shadow-black/5 dark:shadow-black/20">
            <div className="absolute -top-20 -left-20 h-40 w-40 rounded-full bg-gradient-to-br from-[hsl(var(--secondary))] to-[hsl(var(--primary))] opacity-8 blur-3xl" />
            <div className="relative">
              {perfError ? (
                <div className="p-6">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold">Performance data failed to load</span>
                    <button onClick={() => refetchPerformance()} className="rounded-lg border px-3 py-1.5 text-xs hover:bg-muted">Retry</button>
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground">{perfError.message}</p>
                </div>
              ) : performance ? (
                <PerformanceWidget metrics={performance} />
              ) : (
                <div className="p-6 animate-pulse">
                  <div className="h-4 w-28 bg-muted rounded" />
                  <div className="mt-3 h-3 w-full bg-muted/70 rounded" />
                  <div className="mt-2 h-3 w-4/6 bg-muted/70 rounded" />
                </div>
              )}
            </div>
          </div>
        </motion.div>

        {/* Quick Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.45 }}
        >
          <div className="relative overflow-hidden rounded-2xl border border-border bg-card/75 backdrop-blur-xl shadow-xl shadow-black/5 dark:shadow-black/20">
            <div className="absolute -bottom-20 -right-20 h-40 w-40 rounded-full bg-gradient-to-br from-[hsl(var(--primary))] to-[hsl(var(--secondary))] opacity-8 blur-3xl" />
            <div className="relative">
              {quickStatsError ? (
                <div className="p-6">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold">Quick stats failed to load</span>
                    <button onClick={() => refetchQuickStats()} className="rounded-lg border px-3 py-1.5 text-xs hover:bg-muted">Retry</button>
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground">{quickStatsError.message}</p>
                </div>
              ) : quickStats ? (
                <QuickStatsWidget stats={quickStats} />
              ) : (
                <div className="p-6 animate-pulse">
                  <div className="h-4 w-24 bg-muted rounded" />
                  <div className="mt-3 h-3 w-full bg-muted/70 rounded" />
                  <div className="mt-2 h-3 w-3/6 bg-muted/70 rounded" />
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </div>

      {/* Financial Overview CTA */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.5 }}
      >
        <div className="relative overflow-hidden rounded-2xl border border-border bg-card/75 backdrop-blur-xl shadow-xl shadow-black/5 dark:shadow-black/20">
          <div className="absolute -top-20 -left-20 h-40 w-40 rounded-full bg-gradient-to-br from-[hsl(var(--secondary))] to-[hsl(var(--primary))] opacity-8 blur-3xl" />
          <div className="relative p-6 flex items-center justify-between gap-4">
            <div>
              <h3 className="text-xl font-semibold">Financial Overview</h3>
              <p className="text-sm text-muted-foreground">Full analytics, breakdowns, and exports moved to a dedicated page.</p>
            </div>
            <a href="/admin/financials" className="rounded-lg border px-4 py-2 text-sm hover:bg-muted">Open Financials</a>
          </div>
        </div>
      </motion.div>

      {/* Admin Activity Tracker */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.55 }}
      >
        <div className="relative overflow-hidden rounded-2xl border border-border bg-card/75 backdrop-blur-xl shadow-xl shadow-black/5 dark:shadow-black/20">
          <div className="absolute -top-20 right-1/2 h-40 w-40 rounded-full bg-gradient-to-br from-[hsl(var(--secondary))] to-[hsl(var(--primary))] opacity-8 blur-3xl" />
          <div className="relative">
            <AdminActivityTracker />
          </div>
        </div>
      </motion.div>
    </div>
  );
}
