"use client";

import { motion } from "framer-motion";
import {
  MdPeople,
  MdPayment,
  MdTrendingUp,
  MdNotifications,
  MdAccountBalance,
  MdCheckCircle,
  MdPending,
  MdAttachMoney,
} from "react-icons/md";
import { HiSparkles, HiLightningBolt } from "react-icons/hi";
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

  // Get dashboard statistics
  const { data: stats, isLoading } = api.admin.getDashboardStats.useQuery();

  // Get recent activity
  const { data: activities } = api.admin.getRecentActivity.useQuery({
    limit: 10,
  });

  // Get new enhanced data
  const { data: alerts } = api.admin.getDashboardAlerts.useQuery();
  const { data: performance } = api.admin.getPerformanceMetrics.useQuery();
  const { data: quickStats } = api.admin.getQuickStats.useQuery();

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
          <GlobalSearch />
        </div>
      </motion.div>

      {/* Alerts */}
      {alerts && alerts.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.05 }}
        >
          <DashboardAlerts alerts={alerts} />
        </motion.div>
      )}

      {/* Stats Grid */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.15 }}
        className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4"
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
              <RecentActivity activities={activities || []} />
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
        {performance && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.45 }}
          >
            <div className="relative overflow-hidden rounded-2xl border border-border bg-card/75 backdrop-blur-xl shadow-xl shadow-black/5 dark:shadow-black/20">
              <div className="absolute -top-20 -left-20 h-40 w-40 rounded-full bg-gradient-to-br from-[hsl(var(--secondary))] to-[hsl(var(--primary))] opacity-8 blur-3xl" />
              <div className="relative">
                <PerformanceWidget metrics={performance} />
              </div>
            </div>
          </motion.div>
        )}

        {/* Quick Stats */}
        {quickStats && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.45 }}
          >
            <div className="relative overflow-hidden rounded-2xl border border-border bg-card/75 backdrop-blur-xl shadow-xl shadow-black/5 dark:shadow-black/20">
              <div className="absolute -bottom-20 -right-20 h-40 w-40 rounded-full bg-gradient-to-br from-[hsl(var(--primary))] to-[hsl(var(--secondary))] opacity-8 blur-3xl" />
              <div className="relative">
                <QuickStatsWidget stats={quickStats} />
              </div>
            </div>
          </motion.div>
        )}
      </div>

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
