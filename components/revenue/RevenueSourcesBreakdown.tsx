"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  DollarSign,
  Users,
  Store,
  Youtube,
  CreditCard,
  Heart,
  GraduationCap,
  Shield,
  TrendingUp,
  Package,
  Globe,
} from "lucide-react";
import { api } from "@/client/trpc";

export default function RevenueSourcesBreakdown() {
  const [selectedSource, setSelectedSource] = useState<string | null>(null);
  const [dayRange, setDayRange] = useState(30);

  const { data: revenueBySource } = api.revenue.getRevenueBySource.useQuery({ days: dayRange });
  const { data: sourceDetails } = api.revenue.getRevenueSourceDetails.useQuery(
    {
      source: selectedSource as any,
      days: dayRange,
    },
    { enabled: !!selectedSource }
  );

  const sources = [
    {
      key: "COMMUNITY_SUPPORT",
      name: "Community Support (CSP)",
      icon: Heart,
      color: "bg-red-500",
      description: "Monthly contributions from community members",
    },
    {
      key: "MEMBERSHIP_REGISTRATION",
      name: "Membership Registration",
      icon: Users,
      color: "bg-blue-500",
      description: "One-time registration fees for new members",
    },
    {
      key: "MEMBERSHIP_RENEWAL",
      name: "Membership Renewal",
      icon: CreditCard,
      color: "bg-green-500",
      description: "Annual renewal fees from existing members",
    },
    {
      key: "STORE_PURCHASE",
      name: "BPI Store",
      icon: Store,
      color: "bg-purple-500",
      description: "Product sales from BPI marketplace",
    },
    {
      key: "WITHDRAWAL_FEE",
      name: "Withdrawal Fees",
      icon: DollarSign,
      color: "bg-orange-500",
      description: "Transaction fees for wallet withdrawals",
    },
    {
      key: "YOUTUBE_SUBSCRIPTION",
      name: "YouTube Subscriptions",
      icon: Youtube,
      color: "bg-red-600",
      description: "Revenue from educational content subscriptions",
    },
    {
      key: "THIRD_PARTY_SERVICES",
      name: "Third Party Services",
      icon: Globe,
      color: "bg-indigo-500",
      description: "Partner services and integrations",
    },
    {
      key: "PALLIATIVE_PROGRAM",
      name: "Palliative Program",
      icon: Heart,
      color: "bg-pink-500",
      description: "Aid distribution program revenues",
    },
    {
      key: "LEADERSHIP_POOL_FEE",
      name: "Leadership Pool Fee",
      icon: Shield,
      color: "bg-yellow-600",
      description: "Fees from leadership development programs",
    },
    {
      key: "TRAINING_CENTER",
      name: "Training Center",
      icon: GraduationCap,
      color: "bg-teal-500",
      description: "Educational courses and certification fees",
    },
    {
      key: "OTHER",
      name: "Other Sources",
      icon: Package,
      color: "bg-slate-500",
      description: "Miscellaneous revenue streams",
    },
  ];

  const getSourceData = (sourceKey: string) => {
    return revenueBySource?.find((s) => s.source === sourceKey);
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
            <TrendingUp className="w-6 h-6 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-800 dark:text-white">
              Revenue Sources (11 Streams)
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Breakdown by origin
            </p>
          </div>
        </div>
        <select
          value={dayRange}
          onChange={(e) => setDayRange(Number(e.target.value))}
          className="px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-800 dark:text-white"
        >
          <option value={7}>Last 7 days</option>
          <option value={30}>Last 30 days</option>
          <option value={90}>Last 90 days</option>
          <option value={365}>Last year</option>
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {sources.map((source, index) => {
          const data = getSourceData(source.key);
          const amount = data?.amount || 0;
          const count = data?.count || 0;

          return (
            <motion.div
              key={source.key}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="border border-slate-200 dark:border-slate-700 rounded-lg p-4 hover:shadow-lg transition-all cursor-pointer group"
              onClick={() => setSelectedSource(source.key)}
            >
              <div className="flex items-start gap-3 mb-3">
                <div className={`p-2 ${source.color} bg-opacity-10 rounded-lg`}>
                  <source.icon
                    className={`w-5 h-5 ${source.color.replace("bg-", "text-")}`}
                  />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-slate-800 dark:text-white text-sm">
                    {source.name}
                  </h3>
                </div>
              </div>

              <div className="space-y-2">
                <div>
                  <p className="text-2xl font-bold text-slate-800 dark:text-white">
                    ₦{amount.toLocaleString()}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {count} transaction{count !== 1 ? "s" : ""}
                  </p>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2">
                  {source.description}
                </p>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Source Detail Modal */}
      {selectedSource && sourceDetails && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl max-w-4xl w-full p-6 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-2xl font-bold text-slate-800 dark:text-white mb-1">
                  {sources.find((s) => s.key === selectedSource)?.name}
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  {sources.find((s) => s.key === selectedSource)?.description}
                </p>
              </div>
              <button
                onClick={() => setSelectedSource(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-2xl font-bold"
              >
                ✕
              </button>
            </div>

            {/* Summary Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                <p className="text-sm text-blue-600 dark:text-blue-400 font-medium mb-1">Total Revenue</p>
                <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                  ₦{sourceDetails.total.toLocaleString()}
                </p>
              </div>
              <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 p-4 rounded-lg border border-green-200 dark:border-green-800">
                <p className="text-sm text-green-600 dark:text-green-400 font-medium mb-1">Transactions</p>
                <p className="text-2xl font-bold text-green-900 dark:text-green-100">
                  {sourceDetails.count}
                </p>
              </div>
              <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 p-4 rounded-lg border border-purple-200 dark:border-purple-800">
                <p className="text-sm text-purple-600 dark:text-purple-400 font-medium mb-1">Average</p>
                <p className="text-2xl font-bold text-purple-900 dark:text-purple-100">
                  ₦{Math.round(sourceDetails.average).toLocaleString()}
                </p>
              </div>
            </div>

            {/* Recent Transactions */}
            <div className="mb-6">
              <h4 className="text-lg font-bold text-slate-800 dark:text-white mb-3">
                Recent Transactions
              </h4>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {sourceDetails.transactions && sourceDetails.transactions.length > 0 ? (
                  sourceDetails.transactions.map((txn: any) => (
                    <div
                      key={txn.id}
                      className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700 rounded-lg border border-slate-200 dark:border-slate-600"
                    >
                      <div className="flex-1">
                        <p className="font-medium text-slate-800 dark:text-white">
                          ₦{Number(txn.amount).toLocaleString()}
                        </p>
                        {txn.description && (
                          <p className="text-sm text-slate-600 dark:text-slate-400">
                            {txn.description}
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                          {new Date(txn.createdAt).toLocaleDateString()}
                        </p>
                        <p className="text-xs text-slate-400 dark:text-slate-500">
                          {new Date(txn.createdAt).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-slate-500 dark:text-slate-400">
                    No transactions found for this period
                  </div>
                )}
              </div>
            </div>

            <button
              onClick={() => setSelectedSource(null)}
              className="w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
