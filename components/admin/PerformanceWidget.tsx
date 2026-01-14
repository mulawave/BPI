"use client";

import { motion } from "framer-motion";
import {
  HiClock,
  HiDatabase,
  HiUsers,
  HiTrendingUp,
  HiCheckCircle,
} from "react-icons/hi";

interface PerformanceMetrics {
  responseTime: {
    average: number;
    p95: number;
    p99: number;
  };
  dbMetrics: {
    activeConnections: number;
    slowQueries: number;
    cacheHitRate: number;
  };
  userEngagement: {
    activeUsers24h: number;
    activeUsers7d: number;
    dailyActiveRate: number;
  };
  transactions: {
    count24h: number;
    count7d: number;
    successRate: number;
  };
}

interface PerformanceWidgetProps {
  metrics: PerformanceMetrics;
}

export default function PerformanceWidget({ metrics }: PerformanceWidgetProps) {
  const getHealthColor = (value: number, thresholds: { good: number; warning: number }) => {
    if (value <= thresholds.good) return "text-green-600 dark:text-green-400";
    if (value <= thresholds.warning) return "text-orange-600 dark:text-orange-400";
    return "text-red-600 dark:text-red-400";
  };

  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6 shadow-sm">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg">
          <HiTrendingUp className="w-5 h-5 text-white" />
        </div>
        <h2 className="text-lg font-bold text-gray-900 dark:text-white">
          System Performance
        </h2>
      </div>

      <div className="space-y-6">
        {/* Response Time */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <HiClock className="w-4 h-4 text-gray-500 dark:text-gray-400" />
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Response Time
            </h3>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <MetricBadge
              label="Avg"
              value={`${metrics.responseTime.average}ms`}
              color={getHealthColor(metrics.responseTime.average, { good: 200, warning: 500 })}
            />
            <MetricBadge
              label="P95"
              value={`${metrics.responseTime.p95}ms`}
              color={getHealthColor(metrics.responseTime.p95, { good: 500, warning: 1000 })}
            />
            <MetricBadge
              label="P99"
              value={`${metrics.responseTime.p99}ms`}
              color={getHealthColor(metrics.responseTime.p99, { good: 1000, warning: 2000 })}
            />
          </div>
        </div>

        {/* Database */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <HiDatabase className="w-4 h-4 text-gray-500 dark:text-gray-400" />
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Database
            </h3>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">Connections</span>
              <span className="text-sm font-semibold text-gray-900 dark:text-white">
                {metrics.dbMetrics.activeConnections}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">Slow Queries</span>
              <span className={`text-sm font-semibold ${metrics.dbMetrics.slowQueries > 5 ? 'text-orange-600 dark:text-orange-400' : 'text-green-600 dark:text-green-400'}`}>
                {metrics.dbMetrics.slowQueries}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">Cache Hit Rate</span>
              <span className="text-sm font-semibold text-green-600 dark:text-green-400">
                {metrics.dbMetrics.cacheHitRate.toFixed(1)}%
              </span>
            </div>
          </div>
        </div>

        {/* User Engagement */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <HiUsers className="w-4 h-4 text-gray-500 dark:text-gray-400" />
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Engagement
            </h3>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">Active 24h</span>
              <span className="text-sm font-semibold text-gray-900 dark:text-white">
                {metrics.userEngagement.activeUsers24h}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">Active 7d</span>
              <span className="text-sm font-semibold text-gray-900 dark:text-white">
                {metrics.userEngagement.activeUsers7d}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">DAU/WAU</span>
              <span className="text-sm font-semibold text-blue-600 dark:text-blue-400">
                {metrics.userEngagement.dailyActiveRate.toFixed(1)}%
              </span>
            </div>
          </div>
        </div>

        {/* Transactions */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <HiCheckCircle className="w-4 h-4 text-gray-500 dark:text-gray-400" />
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Transactions
            </h3>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">Last 24h</span>
              <span className="text-sm font-semibold text-gray-900 dark:text-white">
                {metrics.transactions.count24h}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">Last 7d</span>
              <span className="text-sm font-semibold text-gray-900 dark:text-white">
                {metrics.transactions.count7d}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">Success Rate</span>
              <span className="text-sm font-semibold text-green-600 dark:text-green-400">
                {metrics.transactions.successRate.toFixed(1)}%
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function MetricBadge({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-2 text-center">
      <div className="text-xs text-gray-500 dark:text-gray-400">{label}</div>
      <div className={`text-sm font-bold ${color} mt-1`}>{value}</div>
    </div>
  );
}
