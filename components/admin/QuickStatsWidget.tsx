"use client";

import { motion } from "framer-motion";
import {
  HiUsers,
  HiCash,
  HiCreditCard,
  HiTrendingUp,
  HiCalendar,
} from "react-icons/hi";
import { useCurrency } from "../../contexts/CurrencyContext";

interface QuickStats {
  today: {
    users: number;
    payments: number;
    revenue: number;
  };
  thisMonth: {
    users: number;
    revenue: number;
  };
}

interface QuickStatsWidgetProps {
  stats: QuickStats;
}

export default function QuickStatsWidget({ stats }: QuickStatsWidgetProps) {
  const { formatAmount } = useCurrency();

  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6 shadow-sm">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg">
          <HiTrendingUp className="w-5 h-5 text-white" />
        </div>
        <h2 className="text-lg font-bold text-gray-900 dark:text-white">
          Quick Stats
        </h2>
      </div>

      <div className="space-y-4">
        {/* Today Section */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <HiCalendar className="w-4 h-4 text-gray-500 dark:text-gray-400" />
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
              Today
            </h3>
          </div>
          <div className="space-y-3">
            <StatRow
              icon={<HiUsers className="w-4 h-4 text-blue-600 dark:text-blue-400" />}
              label="New Users"
              value={stats.today.users}
              color="text-blue-600 dark:text-blue-400"
            />
            <StatRow
              icon={<HiCreditCard className="w-4 h-4 text-green-600 dark:text-green-400" />}
              label="Payments"
              value={stats.today.payments}
              color="text-green-600 dark:text-green-400"
            />
            <StatRow
              icon={<HiCash className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />}
              label="Revenue"
              value={formatAmount(stats.today.revenue)}
              color="text-emerald-600 dark:text-emerald-400"
              isAmount
            />
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-gray-200 dark:border-gray-700"></div>

        {/* This Month Section */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <HiCalendar className="w-4 h-4 text-gray-500 dark:text-gray-400" />
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
              This Month
            </h3>
          </div>
          <div className="space-y-3">
            <StatRow
              icon={<HiUsers className="w-4 h-4 text-purple-600 dark:text-purple-400" />}
              label="New Users"
              value={stats.thisMonth.users}
              color="text-purple-600 dark:text-purple-400"
            />
            <StatRow
              icon={<HiCash className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />}
              label="Revenue"
              value={formatAmount(stats.thisMonth.revenue)}
              color="text-indigo-600 dark:text-indigo-400"
              isAmount
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function StatRow({
  icon,
  label,
  value,
  color,
  isAmount = false,
}: {
  icon: React.ReactNode;
  label: string;
  value: number | string;
  color: string;
  isAmount?: boolean;
}) {
  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900 rounded-lg"
    >
      <div className="flex items-center gap-3">
        <div className="p-2 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
          {icon}
        </div>
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {label}
        </span>
      </div>
      <span className={`text-lg font-bold ${color}`}>
        {isAmount ? value : typeof value === 'number' ? value.toLocaleString() : value}
      </span>
    </motion.div>
  );
}
