"use client";

import { useState, useMemo } from "react";
import { X, Users, TrendingUp, Award, Target, Search, Filter, Calendar, BarChart3, PieChart, Activity, Globe, Zap, Crown, Star, Gift, Shield, Heart, UserPlus, UserCheck, UserX, TrendingDown, ArrowUp, ArrowDown, Clock, DollarSign, Percent } from "lucide-react";
import { motion } from "framer-motion";

type TimeRange = '7d' | '30d' | '90d' | 'all';
type ViewMode = 'overview' | 'growth' | 'engagement' | 'referrals';

interface CommunityStatsModalProps {
  isOpen: boolean;
  onClose: () => void;
  userProfile?: any;
  communityStats?: any;
}

export default function CommunityStatsModal({
  isOpen,
  onClose,
  userProfile,
  communityStats,
}: CommunityStatsModalProps) {
  const [selectedView, setSelectedView] = useState<ViewMode>('overview');
  const [timeRange, setTimeRange] = useState<TimeRange>('30d');
  const [searchQuery, setSearchQuery] = useState('');

  // Platform-wide stats from real data
  const stats = {
    total: {
      members: communityStats?.platform.totalUsers || 0,
      active: communityStats?.platform.activeMembers || 0,
      palliativeActivated: communityStats?.platform.palliativeActiveUsers || 0,
      newThisMonth: communityStats?.platform.newUsersThisMonth || 0,
    },
    levels: {
      level1: communityStats?.levels.level1 || 0,
      level2: communityStats?.levels.level2 || 0,
      level3: communityStats?.levels.level3 || 0,
      level4: communityStats?.levels.level4 || 0,
    },
    growth: {
      today: communityStats?.platform.todaySignups || 0,
      week: communityStats?.platform.weekSignups || 0,
      month: communityStats?.platform.newUsersThisMonth || 0,
      trend: communityStats?.platform.growthTrend || 0,
    },
    engagement: {
      activeRate: communityStats?.platform.activeRate || 0,
      palliativeRate: communityStats?.platform.palliativeRate || 0,
      retentionRate: 85, // Could calculate this from login data
    },
  };

  // User's personal stats
  const personalStats = {
    levels: {
      level1: (userProfile as any)?.level1Count || 0,
      level2: (userProfile as any)?.level2Count || 0,
      level3: (userProfile as any)?.level3Count || 0,
      level4: (userProfile as any)?.level4Count || 0,
    },
    total: ((userProfile as any)?.level1Count || 0) + ((userProfile as any)?.level2Count || 0) + ((userProfile as any)?.level3Count || 0) + ((userProfile as any)?.level4Count || 0),
  };

  const levelDistribution = useMemo(() => {
    const total = stats.levels.level1 + stats.levels.level2 + stats.levels.level3 + stats.levels.level4;
    if (total === 0) return [];
    
    return [
      { label: 'Level 1', value: stats.levels.level1, percentage: (stats.levels.level1 / total) * 100, color: 'from-orange-500 to-yellow-500', startColor: '#f97316', endColor: '#eab308' },
      { label: 'Level 2', value: stats.levels.level2, percentage: (stats.levels.level2 / total) * 100, color: 'from-blue-500 to-cyan-500', startColor: '#3b82f6', endColor: '#06b6d4' },
      { label: 'Level 3', value: stats.levels.level3, percentage: (stats.levels.level3 / total) * 100, color: 'from-green-500 to-emerald-500', startColor: '#22c55e', endColor: '#10b981' },
      { label: 'Level 4', value: stats.levels.level4, percentage: (stats.levels.level4 / total) * 100, color: 'from-purple-500 to-pink-500', startColor: '#a855f7', endColor: '#ec4899' },
    ];
  }, [stats.levels]);

  // Use real growth data from API
  const growthData = useMemo(() => {
    return communityStats?.dailySignups || [];
  }, [communityStats]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.2 }}
        className="w-full h-[90vh] max-w-7xl bg-white dark:bg-bpi-dark-card rounded-2xl shadow-2xl overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-bpi-dark-accent bg-gradient-to-r from-blue-50 to-purple-50 dark:from-bpi-dark-accent dark:to-bpi-dark-card">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl flex items-center justify-center">
              <Users className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-foreground">Community Statistics</h2>
              <p className="text-sm text-muted-foreground">{stats.total.members} total members • {stats.total.active} active</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-xl hover:bg-gray-200 dark:hover:bg-bpi-dark-accent flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* View Tabs */}
        <div className="flex items-center gap-2 px-6 py-3 border-b border-gray-200 dark:border-bpi-dark-accent bg-gray-50 dark:bg-bpi-dark-accent/30">
          {[
            { id: 'overview', label: 'Overview', icon: BarChart3 },
            { id: 'growth', label: 'Growth Trends', icon: TrendingUp },
            { id: 'engagement', label: 'Engagement', icon: Activity },
            { id: 'referrals', label: 'Referral Network', icon: Users },
          ].map(view => {
            const Icon = view.icon;
            return (
              <button
                key={view.id}
                onClick={() => setSelectedView(view.id as ViewMode)}
                className={`px-4 py-2 rounded-lg transition-all flex items-center gap-2 ${
                  selectedView === view.id
                    ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 font-medium'
                    : 'hover:bg-gray-200 dark:hover:bg-bpi-dark-accent text-foreground'
                }`}
              >
                <Icon className="w-4 h-4" />
                {view.label}
              </button>
            );
          })}
        </div>

        {/* Main Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left Sidebar - Quick Stats */}
          <div className="w-64 border-r border-gray-200 dark:border-bpi-dark-accent bg-gray-50 dark:bg-bpi-dark-accent/30 p-4 overflow-y-auto">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase mb-3">Platform Stats</h3>
            <div className="space-y-3">
              {[
                { label: 'Total Members', value: stats.total.members, icon: Users, color: 'text-blue-600' },
                { label: 'Active Members', value: stats.total.active, icon: UserCheck, color: 'text-green-600' },
                { label: 'Palliative Active', value: stats.total.palliativeActivated, icon: Heart, color: 'text-red-600' },
                { label: 'New This Month', value: stats.total.newThisMonth, icon: UserPlus, color: 'text-purple-600' },
              ].map((stat, i) => {
                const Icon = stat.icon;
                return (
                  <motion.div
                    key={stat.label}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="p-3 bg-white dark:bg-bpi-dark-card rounded-xl border border-gray-200 dark:border-bpi-dark-accent"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <Icon className={`w-4 h-4 ${stat.color}`} />
                      <span className="text-xs text-muted-foreground">{stat.label}</span>
                    </div>
                    <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                  </motion.div>
                );
              })}

              <div className="pt-4 mt-4 border-t border-gray-200 dark:border-bpi-dark-accent">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase mb-3">Platform Levels</h3>
                <div className="space-y-2">
                  {levelDistribution.map((level, i) => (
                    <div key={level.label} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">{level.label}</span>
                        <span className="font-medium text-foreground">{level.value}</span>
                      </div>
                      <div className="h-2 bg-gray-200 dark:bg-bpi-dark-accent rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${level.percentage}%` }}
                          transition={{ delay: i * 0.1, duration: 0.5 }}
                          className={`h-full bg-gradient-to-r ${level.color}`}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Personal Contribution */}
              <div className="pt-4 mt-4 border-t border-gray-200 dark:border-bpi-dark-accent">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase mb-3">Your Network</h3>
                <div className="p-3 bg-gradient-to-br from-orange-50 to-yellow-50 dark:from-orange-900/20 dark:to-yellow-900/20 rounded-xl border border-orange-200 dark:border-orange-800">
                  <div className="flex items-center gap-2 mb-2">
                    <Crown className="w-4 h-4 text-orange-600" />
                    <span className="text-xs text-muted-foreground">Total Referrals</span>
                  </div>
                  <p className="text-2xl font-bold text-foreground mb-2">{personalStats.total}</p>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">L1:</span>
                      <span className="font-medium">{personalStats.levels.level1}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">L2:</span>
                      <span className="font-medium">{personalStats.levels.level2}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">L3:</span>
                      <span className="font-medium">{personalStats.levels.level3}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">L4:</span>
                      <span className="font-medium">{personalStats.levels.level4}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Middle Pane - Main Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {selectedView === 'overview' && (
              <div className="space-y-6">
                {/* Top Stats Cards */}
                <div className="grid grid-cols-4 gap-4">
                  {[
                    { label: 'Total Network', value: stats.total.members, change: `+${stats.growth.trend}%`, icon: Users, color: 'from-blue-500 to-cyan-500' },
                    { label: 'Active Rate', value: `${stats.engagement.activeRate}%`, change: '+5%', icon: Activity, color: 'from-green-500 to-emerald-500' },
                    { label: 'Palliative Rate', value: `${stats.engagement.palliativeRate}%`, change: '+8%', icon: Heart, color: 'from-red-500 to-pink-500' },
                    { label: 'Retention', value: `${stats.engagement.retentionRate}%`, change: '+2%', icon: Shield, color: 'from-purple-500 to-pink-500' },
                  ].map((stat, i) => {
                    const Icon = stat.icon;
                    return (
                      <motion.div
                        key={stat.label}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className="p-4 bg-white dark:bg-bpi-dark-card rounded-xl border border-gray-200 dark:border-bpi-dark-accent"
                      >
                        <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${stat.color} flex items-center justify-center mb-3`}>
                          <Icon className="w-5 h-5 text-white" />
                        </div>
                        <p className="text-xs text-muted-foreground mb-1">{stat.label}</p>
                        <div className="flex items-end justify-between">
                          <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                          <span className="text-xs text-green-600 dark:text-green-400 flex items-center gap-1">
                            <ArrowUp className="w-3 h-3" />
                            {stat.change}
                          </span>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>

                {/* Growth Trends */}
                <div className="p-6 bg-white dark:bg-bpi-dark-card rounded-xl border border-gray-200 dark:border-bpi-dark-accent">
                  <h3 className="text-lg font-semibold text-foreground mb-6 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-green-600" />
                    7-Day Growth Trend
                  </h3>
                  <div className="space-y-3">
                    {growthData.map((day: any, i: number) => {
                      const maxSignups = Math.max(...growthData.map((d: any) => d.signups), 1);
                      const signupPercentage = (day.signups / maxSignups) * 100;
                      
                      return (
                        <div key={i} className="space-y-1">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground w-16">{day.date}</span>
                            <div className="flex gap-4 text-xs">
                              <span className="text-blue-600">{day.signups} signups</span>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <div className="flex-1 h-8 bg-gray-200 dark:bg-bpi-dark-accent rounded-lg overflow-hidden">
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${signupPercentage}%` }}
                                transition={{ delay: i * 0.05, duration: 0.3 }}
                                className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 flex items-center justify-end pr-2"
                              >
                                <span className="text-xs text-white font-medium">{day.signups}</span>
                              </motion.div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {selectedView === 'growth' && (
              <div className="space-y-6">
                <div className="p-6 bg-white dark:bg-bpi-dark-card rounded-xl border border-gray-200 dark:border-bpi-dark-accent">
                  <h3 className="text-lg font-semibold text-foreground mb-4">Growth Metrics</h3>
                  <div className="grid grid-cols-3 gap-4">
                    {[
                      { label: 'Today', value: stats.growth.today, icon: Clock },
                      { label: 'This Week', value: stats.growth.week, icon: Calendar },
                      { label: 'This Month', value: stats.growth.month, icon: TrendingUp },
                    ].map(metric => {
                      const Icon = metric.icon;
                      return (
                        <div key={metric.label} className="p-4 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-bpi-dark-accent dark:to-bpi-dark-accent/50 rounded-xl">
                          <Icon className="w-6 h-6 text-blue-600 mb-2" />
                          <p className="text-xs text-muted-foreground mb-1">{metric.label}</p>
                          <p className="text-3xl font-bold text-foreground">{metric.value}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {selectedView === 'engagement' && (
              <div className="space-y-6">
                <div className="p-6 bg-white dark:bg-bpi-dark-card rounded-xl border border-gray-200 dark:border-bpi-dark-accent">
                  <h3 className="text-lg font-semibold text-foreground mb-6">Engagement Metrics</h3>
                  <div className="space-y-6">
                    {[
                      { label: 'Active Rate', value: stats.engagement.activeRate, target: 75, icon: Activity, color: 'from-green-500 to-emerald-500' },
                      { label: 'Palliative Activation', value: stats.engagement.palliativeRate, target: 60, icon: Heart, color: 'from-red-500 to-pink-500' },
                      { label: 'Retention Rate', value: stats.engagement.retentionRate, target: 80, icon: Shield, color: 'from-blue-500 to-cyan-500' },
                    ].map((metric, i) => {
                      const Icon = metric.icon;
                      const percentage = (metric.value / metric.target) * 100;
                      
                      return (
                        <div key={metric.label} className="space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Icon className="w-5 h-5 text-muted-foreground" />
                              <span className="font-medium text-foreground">{metric.label}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-2xl font-bold text-foreground">{metric.value}%</span>
                              <span className="text-xs text-muted-foreground">/ {metric.target}% target</span>
                            </div>
                          </div>
                          <div className="h-4 bg-gray-200 dark:bg-bpi-dark-accent rounded-full overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${percentage > 100 ? 100 : percentage}%` }}
                              transition={{ delay: i * 0.1, duration: 0.5 }}
                              className={`h-full bg-gradient-to-r ${metric.color}`}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {selectedView === 'referrals' && (
              <div className="space-y-6">
                {/* Platform-Wide Referral Network */}
                <div className="p-6 bg-white dark:bg-bpi-dark-card rounded-xl border border-gray-200 dark:border-bpi-dark-accent">
                  <h3 className="text-lg font-semibold text-foreground mb-6">Platform Referral Network</h3>
                  <div className="space-y-4">
                    <div className="grid grid-cols-4 gap-4">
                      {[
                        { level: 'Level 1', count: stats.levels.level1, commission: '10%', icon: '1️⃣' },
                        { level: 'Level 2', count: stats.levels.level2, commission: '5%', icon: '2️⃣' },
                        { level: 'Level 3', count: stats.levels.level3, commission: '3%', icon: '3️⃣' },
                        { level: 'Level 4', count: stats.levels.level4, commission: '2%', icon: '4️⃣' },
                      ].map(level => (
                        <div key={level.level} className="p-4 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-bpi-dark-accent dark:to-bpi-dark-accent/50 rounded-xl text-center">
                          <div className="text-3xl mb-2">{level.icon}</div>
                          <p className="text-xs text-muted-foreground mb-1">{level.level}</p>
                          <p className="text-2xl font-bold text-foreground mb-1">{level.count}</p>
                          <p className="text-xs text-green-600 dark:text-green-400">{level.commission} commission</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Your Personal Network */}
                <div className="p-6 bg-gradient-to-br from-orange-50 to-yellow-50 dark:from-orange-900/20 dark:to-yellow-900/20 rounded-xl border border-orange-200 dark:border-orange-800">
                  <div className="flex items-center gap-2 mb-6">
                    <Crown className="w-5 h-5 text-orange-600" />
                    <h3 className="text-lg font-semibold text-foreground">Your Referral Network</h3>
                  </div>
                  <div className="space-y-4">
                    <div className="grid grid-cols-4 gap-4">
                      {[
                        { level: 'Level 1', count: personalStats.levels.level1, commission: '10%', icon: '1️⃣' },
                        { level: 'Level 2', count: personalStats.levels.level2, commission: '5%', icon: '2️⃣' },
                        { level: 'Level 3', count: personalStats.levels.level3, commission: '3%', icon: '3️⃣' },
                        { level: 'Level 4', count: personalStats.levels.level4, commission: '2%', icon: '4️⃣' },
                      ].map(level => (
                        <div key={level.level} className="p-4 bg-white dark:bg-bpi-dark-card rounded-xl text-center border border-orange-200 dark:border-orange-800">
                          <div className="text-3xl mb-2">{level.icon}</div>
                          <p className="text-xs text-muted-foreground mb-1">{level.level}</p>
                          <p className="text-2xl font-bold text-foreground mb-1">{level.count}</p>
                          <p className="text-xs text-orange-600 dark:text-orange-400">{level.commission} commission</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right Column - Summary Analytics */}
          <div className="w-80 border-l border-gray-200 dark:border-bpi-dark-accent bg-gray-50 dark:bg-bpi-dark-accent/30 p-6 overflow-y-auto">
            <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-blue-600" />
              Summary
            </h3>

            {/* Total Network Size */}
            <div className="p-4 bg-white dark:bg-bpi-dark-card rounded-xl border border-gray-200 dark:border-bpi-dark-accent mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">Network Size</span>
                <Users className="w-4 h-4 text-blue-600" />
              </div>
              <p className="text-3xl font-bold text-foreground mb-1">{stats.total.members}</p>
              <div className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
                <TrendingUp className="w-3 h-3" />
                <span>+{stats.growth.trend}% this month</span>
              </div>
            </div>

            {/* Activity Status */}
            <div className="p-4 bg-white dark:bg-bpi-dark-card rounded-xl border border-gray-200 dark:border-bpi-dark-accent mb-4">
              <h4 className="text-sm font-medium text-foreground mb-3">Activity Status</h4>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Active</span>
                  <span className="font-medium text-green-600">{stats.total.active}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Inactive</span>
                  <span className="font-medium text-gray-600">{stats.total.members - stats.total.active}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Palliative</span>
                  <span className="font-medium text-orange-600">{stats.total.palliativeActivated}</span>
                </div>
              </div>
            </div>

            {/* Top Performer */}
            <div className="p-4 bg-gradient-to-br from-orange-50 to-yellow-50 dark:from-orange-900/20 dark:to-yellow-900/20 rounded-xl border border-orange-200 dark:border-orange-800">
              <div className="flex items-center gap-2 mb-3">
                <Crown className="w-5 h-5 text-orange-600" />
                <h4 className="text-sm font-medium text-foreground">Top Performer</h4>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-500 to-yellow-500 flex items-center justify-center">
                  <span className="text-white font-bold">👑</span>
                </div>
                <div className="flex-1">
                  <p className="font-medium text-foreground">You</p>
                  <p className="text-xs text-muted-foreground">{stats.total.members} referrals</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
