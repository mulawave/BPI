"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import { Calendar, Download, Plus, TrendingUp } from "lucide-react";
import { api } from "@/client/trpc";

export default function SnapshotManager() {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const { data: snapshots, refetch } = api.revenue.getSnapshots.useQuery({ limit: 12 });

  const createSnapshot = api.revenue.createSnapshot.useMutation({
    onSuccess: () => {
      toast.success(`Snapshot created for ${selectedMonth}/${selectedYear}`);
      setShowCreateModal(false);
      refetch();
    },
    onError: (error: any) => toast.error(error.message),
  });

  const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  const exportSnapshot = (snapshot: any) => {
    const csv = [
      ["Metric", "Value"],
      ["Month", `${months[snapshot.month - 1]} ${snapshot.year}`],
      ["Total Revenue", `₦${Number(snapshot.totalRevenue).toLocaleString()}`],
      ["Company Reserve (50%)", `₦${Number(snapshot.companyReserveTotal).toLocaleString()}`],
      ["Executive Pool (30%)", `₦${Number(snapshot.executivePoolTotal).toLocaleString()}`],
      ["Strategic Pools (20%)", `₦${Number(snapshot.strategicPoolsTotal).toLocaleString()}`],
      [""],
      ["Revenue by Source", ""],
      ["Community Support", `₦${Number(snapshot.communitySupport).toLocaleString()}`],
      [
        "Membership Registration",
        `₦${Number(snapshot.membershipRegistration).toLocaleString()}`,
      ],
      ["Membership Renewal", `₦${Number(snapshot.membershipRenewal).toLocaleString()}`],
      ["Store Purchase", `₦${Number(snapshot.storePurchase).toLocaleString()}`],
      ["Withdrawal Fee", `₦${Number(snapshot.withdrawalFee).toLocaleString()}`],
      ["YouTube Subscription", `₦${Number(snapshot.youtubeSubscription).toLocaleString()}`],
      ["Third Party Services", `₦${Number(snapshot.thirdPartyServices).toLocaleString()}`],
      ["Palliative Program", `₦${Number(snapshot.palliativeProgram).toLocaleString()}`],
      ["Leadership Pool Fee", `₦${Number(snapshot.leadershipPoolFee).toLocaleString()}`],
      ["Training Center", `₦${Number(snapshot.trainingCenter).toLocaleString()}`],
      ["Other", `₦${Number(snapshot.other).toLocaleString()}`],
      [""],
      ["Transactions Processed", snapshot.transactionCount],
      ["Executives Distributed", `₦${Number(snapshot.executivesDistributed).toLocaleString()}`],
      ["Pools Distributed", `₦${Number(snapshot.poolsDistributed).toLocaleString()}`],
    ]
      .map((row) => row.join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `snapshot-${months[snapshot.month - 1]}-${snapshot.year}.csv`;
    a.click();
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
            <Calendar className="w-6 h-6 text-purple-600 dark:text-purple-400" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-800 dark:text-white">
              Monthly Snapshots
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Historical revenue tracking
            </p>
          </div>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
        >
          <Plus size={18} />
          Create Snapshot
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {snapshots && snapshots.length > 0 ? (
          snapshots.map((snapshot: any, index: number) => (
            <motion.div
              key={snapshot.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="border border-slate-200 dark:border-slate-700 rounded-lg p-4 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-bold text-slate-800 dark:text-white">
                  {months[snapshot.month - 1]} {snapshot.year}
                </h3>
                <button
                  onClick={() => exportSnapshot(snapshot)}
                  className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                >
                  <Download size={16} />
                </button>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600 dark:text-slate-400">Total Revenue</span>
                  <span className="font-semibold text-slate-800 dark:text-white">
                    ₦{Number(snapshot.totalRevenue).toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-600 dark:text-slate-400">Company (50%)</span>
                  <span className="text-green-600 dark:text-green-400">
                    ₦{Number(snapshot.companyReserveTotal).toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-600 dark:text-slate-400">Executive (30%)</span>
                  <span className="text-purple-600 dark:text-purple-400">
                    ₦{Number(snapshot.executivePoolTotal).toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-600 dark:text-slate-400">Strategic (20%)</span>
                  <span className="text-orange-600 dark:text-orange-400">
                    ₦{Number(snapshot.strategicPoolsTotal).toLocaleString()}
                  </span>
                </div>
                <div className="pt-2 border-t border-slate-200 dark:border-slate-700">
                  <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                    <span>{snapshot.transactionCount} transactions</span>
                    <TrendingUp size={14} />
                  </div>
                </div>
              </div>
            </motion.div>
          ))
        ) : (
          <div className="col-span-full text-center py-12">
            <Calendar className="w-16 h-16 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
            <p className="text-slate-500 dark:text-slate-400">No snapshots yet</p>
            <p className="text-sm text-slate-400 dark:text-slate-500">
              Create monthly snapshots to track historical revenue
            </p>
          </div>
        )}
      </div>

      {/* Create Snapshot Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-4">
              Create Monthly Snapshot
            </h3>
            <p className="text-slate-600 dark:text-slate-400 mb-4">
              Generate a snapshot of all revenue data for a specific month
            </p>

            <div className="space-y-3 mb-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Month
                </label>
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-800 dark:text-white"
                >
                  {months.map((month, index) => (
                    <option key={index} value={index + 1}>
                      {month}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Year
                </label>
                <input
                  type="number"
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(Number(e.target.value))}
                  min={2020}
                  max={2100}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-800 dark:text-white"
                />
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() =>
                  createSnapshot.mutate({ month: selectedMonth, year: selectedYear })
                }
                disabled={createSnapshot.isPending}
                className="flex-1 px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 text-white rounded-lg transition-colors"
              >
                {createSnapshot.isPending ? "Creating..." : "Create"}
              </button>
              <button
                onClick={() => setShowCreateModal(false)}
                className="flex-1 px-4 py-2 bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-white rounded-lg hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
