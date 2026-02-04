"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import {
  Shield,
  UserPlus,
  UserMinus,
  DollarSign,
  RefreshCw,
  ArrowRightLeft,
  Settings,
  Lock,
} from "lucide-react";
import { api } from "@/client/trpc";

export default function GovernancePowers() {
  const [showManualAllocation, setShowManualAllocation] = useState(false);
  const [showPoolTransfer, setShowPoolTransfer] = useState(false);
  const [showPercentageChange, setShowPercentageChange] = useState(false);

  // Manual allocation state
  const [allocationType, setAllocationType] = useState<"EXECUTIVE" | "POOL">("EXECUTIVE");
  const [allocationDestination, setAllocationDestination] = useState("");
  const [allocationAmount, setAllocationAmount] = useState("");
  const [allocationReason, setAllocationReason] = useState("");

  // Pool transfer state
  const [transferFrom, setTransferFrom] = useState("COMPANY_RESERVE");
  const [transferTo, setTransferTo] = useState("");
  const [transferAmount, setTransferAmount] = useState("");
  const [transferReason, setTransferReason] = useState("");

  // Percentage adjustment state
  const [percentages, setPercentages] = useState({
    CEO: 30,
    CTO: 20,
    HEAD_OF_TRAVEL: 20,
    CMO: 10,
    OLIVER: 5,
    MORRISON: 5,
    ANNIE: 10,
  });
  const [percentageReason, setPercentageReason] = useState("");

  // Queries
  const { data: shareholders } = api.revenue.getExecutiveShareholders.useQuery();
  const { data: pools } = api.revenue.getStrategicPools.useQuery();

  // Mutations
  const manualAllocation = api.revenue.manualAllocation.useMutation({
    onSuccess: (data) => {
      toast.success(data.message);
      setShowManualAllocation(false);
      setAllocationAmount("");
      setAllocationReason("");
      setAllocationDestination("");
    },
    onError: (error: any) => toast.error(error.message),
  });

  const poolTransfer = api.revenue.poolTransfer.useMutation({
    onSuccess: (data) => {
      toast.success(data.message);
      setShowPoolTransfer(false);
      setTransferAmount("");
      setTransferReason("");
      setTransferFrom("COMPANY_RESERVE");
      setTransferTo("");
    },
    onError: (error: any) => toast.error(error.message),
  });

  const adjustPercentages = api.revenue.adjustExecutivePercentages.useMutation({
    onSuccess: (data) => {
      toast.success(data.message);
      setShowPercentageChange(false);
      setPercentageReason("");
    },
    onError: (error: any) => toast.error(error.message),
  });

  const powers = [
    {
      id: "assign",
      title: "Assign Executives",
      description: "Assign users to executive roles with revenue shares",
      icon: UserPlus,
      color: "bg-blue-500",
      action: () => toast("Use the Executive Shareholders section above"),
    },
    {
      id: "remove",
      title: "Remove Executives",
      description: "Remove executives from revenue-sharing roles",
      icon: UserMinus,
      color: "bg-red-500",
      action: () => toast("Use the Executive Shareholders section above"),
    },
    {
      id: "pools",
      title: "Manage Pool Members",
      description: "Add/remove members from strategic pools",
      icon: Shield,
      color: "bg-green-500",
      action: () => toast("Use the Strategic Pools section above"),
    },
    {
      id: "reserve",
      title: "Spend Reserve Funds",
      description: "Approve spending from company reserve",
      icon: DollarSign,
      color: "bg-purple-500",
      action: () => toast("Click the Company Reserve (50%) card above"),
    },
    {
      id: "manual",
      title: "Manual Revenue Allocation",
      description: "Manually allocate revenue outside normal flows",
      icon: RefreshCw,
      color: "bg-orange-500",
      action: () => setShowManualAllocation(true),
    },
    {
      id: "transfer",
      title: "Inter-Pool Transfers",
      description: "Transfer funds between pools",
      icon: ArrowRightLeft,
      color: "bg-pink-500",
      action: () => setShowPoolTransfer(true),
    },
    {
      id: "percentages",
      title: "Adjust Percentages",
      description: "Modify executive/pool percentage allocations",
      icon: Settings,
      color: "bg-indigo-500",
      action: () => setShowPercentageChange(true),
    },
  ];

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-red-100 dark:bg-red-900/20 rounded-lg">
          <Lock className="w-6 h-6 text-red-600 dark:text-red-400" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white">
            Governance Powers
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Admin-only actions (all logged in audit trail)
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {powers.map((power, index) => (
          <motion.button
            key={power.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            onClick={power.action}
            className="group relative overflow-hidden bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-700 dark:to-slate-800 border-2 border-slate-200 dark:border-slate-600 rounded-xl p-6 hover:border-blue-500 dark:hover:border-blue-400 transition-all duration-200 hover:shadow-lg"
          >
            <div
              className={`absolute top-0 right-0 w-20 h-20 ${power.color} opacity-10 rounded-full -mr-10 -mt-10 group-hover:scale-150 transition-transform duration-300`}
            />

            <div className="relative">
              <div
                className={`inline-flex p-3 ${power.color} bg-opacity-10 rounded-lg mb-4`}
              >
                <power.icon className={`w-6 h-6 ${power.color.replace("bg-", "text-")}`} />
              </div>

              <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-2">
                {power.title}
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                {power.description}
              </p>
            </div>
          </motion.button>
        ))}
      </div>

      {/* Manual Allocation Modal */}
      {showManualAllocation && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-4">
              Manual Revenue Allocation
            </h3>
            <p className="text-slate-600 dark:text-slate-400 mb-4">
              Allocate funds from Company Reserve to an Executive or Strategic Pool. This bypasses normal revenue flows.
            </p>
            <div className="space-y-3 mb-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Allocate To
                </label>
                <select
                  value={allocationType}
                  onChange={(e) => {
                    setAllocationType(e.target.value as "EXECUTIVE" | "POOL");
                    setAllocationDestination("");
                  }}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-800 dark:text-white"
                >
                  <option value="EXECUTIVE">Executive Shareholder</option>
                  <option value="POOL">Strategic Pool</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  {allocationType === "EXECUTIVE" ? "Select Executive" : "Select Pool"}
                </label>
                <select
                  value={allocationDestination}
                  onChange={(e) => setAllocationDestination(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-800 dark:text-white"
                >
                  <option value="">-- Select --</option>
                  {allocationType === "EXECUTIVE" ? (
                    shareholders?.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.role} {s.User ? `- ${s.User.name}` : "(Unassigned)"}
                      </option>
                    ))
                  ) : (
                    pools?.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))
                  )}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Amount (₦)
                </label>
                <input
                  type="number"
                  placeholder="Enter amount"
                  value={allocationAmount}
                  onChange={(e) => setAllocationAmount(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-800 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Reason
                </label>
                <textarea
                  placeholder="Explain the reason for manual allocation (minimum 10 characters)"
                  rows={3}
                  value={allocationReason}
                  onChange={(e) => setAllocationReason(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-800 dark:text-white"
                />
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  if (!allocationDestination) {
                    toast.error("Please select a destination");
                    return;
                  }
                  if (!allocationAmount || Number(allocationAmount) <= 0) {
                    toast.error("Please enter a valid amount");
                    return;
                  }
                  if (!allocationReason || allocationReason.length < 10) {
                    toast.error("Please provide a detailed reason (min 10 characters)");
                    return;
                  }
                  manualAllocation.mutate({
                    destinationType: allocationType,
                    destinationId: allocationDestination,
                    amount: Number(allocationAmount),
                    reason: allocationReason,
                  });
                }}
                disabled={manualAllocation.isPending}
                className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg transition-colors"
              >
                {manualAllocation.isPending ? "Allocating..." : "Allocate"}
              </button>
              <button
                onClick={() => setShowManualAllocation(false)}
                className="flex-1 px-4 py-2 bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-white rounded-lg hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Pool Transfer Modal */}
      {showPoolTransfer && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-4">
              Inter-Pool Transfer
            </h3>
            <p className="text-slate-600 dark:text-slate-400 mb-4">
              Transfer funds between Company Reserve and Strategic Pools
            </p>
            <div className="space-y-3 mb-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  From
                </label>
                <select
                  value={transferFrom}
                  onChange={(e) => setTransferFrom(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-800 dark:text-white"
                >
                  <option value="COMPANY_RESERVE">Company Reserve</option>
                  {pools?.map((pool) => (
                    <option key={pool.id} value={pool.id}>
                      {pool.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  To
                </label>
                <select
                  value={transferTo}
                  onChange={(e) => setTransferTo(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-800 dark:text-white"
                >
                  <option value="">-- Select --</option>
                  <option value="COMPANY_RESERVE">Company Reserve</option>
                  {pools?.map((pool) => (
                    <option key={pool.id} value={pool.id}>
                      {pool.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Amount (₦)
                </label>
                <input
                  type="number"
                  placeholder="Enter amount"
                  value={transferAmount}
                  onChange={(e) => setTransferAmount(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-800 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Reason
                </label>
                <textarea
                  placeholder="Explain the reason for transfer (minimum 10 characters)"
                  rows={3}
                  value={transferReason}
                  onChange={(e) => setTransferReason(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-800 dark:text-white"
                />
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  if (!transferTo) {
                    toast.error("Please select destination");
                    return;
                  }
                  if (transferFrom === transferTo) {
                    toast.error("Source and destination cannot be the same");
                    return;
                  }
                  if (!transferAmount || Number(transferAmount) <= 0) {
                    toast.error("Please enter a valid amount");
                    return;
                  }
                  if (!transferReason || transferReason.length < 10) {
                    toast.error("Please provide a detailed reason (min 10 characters)");
                    return;
                  }
                  poolTransfer.mutate({
                    from: transferFrom,
                    to: transferTo,
                    amount: Number(transferAmount),
                    reason: transferReason,
                  });
                }}
                disabled={poolTransfer.isPending}
                className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg transition-colors"
              >
                {poolTransfer.isPending ? "Transferring..." : "Transfer"}
              </button>
              <button
                onClick={() => setShowPoolTransfer(false)}
                className="flex-1 px-4 py-2 bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-white rounded-lg hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Percentage Change Modal */}
      {showPercentageChange && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-4">
              Adjust Executive Allocation Percentages
            </h3>
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-4">
              <p className="text-sm text-red-700 dark:text-red-400 font-medium">
                ⚠️ Warning: Changing percentages affects all future revenue allocations
              </p>
            </div>

            <div className="space-y-4 mb-4">
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Adjust the percentage allocation for each executive role. Total must equal 100%.
              </p>

              {/* Executive Percentage Inputs */}
              {Object.entries(percentages).map(([role, value]) => (
                <div key={role} className="flex items-center gap-3">
                  <label className="flex-1 text-sm font-medium text-slate-700 dark:text-slate-300">
                    {role.replace(/_/g, " ")}
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="0.01"
                      value={value}
                      onChange={(e) => {
                        const newValue = parseFloat(e.target.value) || 0;
                        setPercentages((prev) => ({
                          ...prev,
                          [role]: newValue,
                        }));
                      }}
                      className="w-24 px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-800 dark:text-white text-right"
                    />
                    <span className="text-slate-600 dark:text-slate-400">%</span>
                  </div>
                </div>
              ))}

              {/* Total Display */}
              <div className="flex items-center justify-between pt-3 border-t-2 border-slate-300 dark:border-slate-600">
                <span className="font-bold text-slate-800 dark:text-white">Total:</span>
                <div className="flex items-center gap-2">
                  <span
                    className={`text-xl font-bold ${
                      Math.abs(Object.values(percentages).reduce((sum, v) => sum + v, 0) - 100) < 0.01
                        ? "text-green-600 dark:text-green-400"
                        : "text-red-600 dark:text-red-400"
                    }`}
                  >
                    {Object.values(percentages)
                      .reduce((sum, v) => sum + v, 0)
                      .toFixed(2)}
                  </span>
                  <span className="text-slate-600 dark:text-slate-400">%</span>
                </div>
              </div>

              {/* Reason */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Reason for Change
                </label>
                <textarea
                  placeholder="Explain why percentages are being adjusted (minimum 10 characters)"
                  rows={3}
                  value={percentageReason}
                  onChange={(e) => setPercentageReason(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-800 dark:text-white"
                />
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  const total = Object.values(percentages).reduce((sum, v) => sum + v, 0);
                  if (Math.abs(total - 100) > 0.01) {
                    toast.error(`Percentages must sum to 100%. Current total: ${total.toFixed(2)}%`);
                    return;
                  }
                  if (!percentageReason || percentageReason.length < 10) {
                    toast.error("Please provide a detailed reason (min 10 characters)");
                    return;
                  }
                  adjustPercentages.mutate({
                    percentages: Object.entries(percentages).map(([role, percentage]) => ({
                      role: role as any,
                      percentage,
                    })),
                    reason: percentageReason,
                  });
                }}
                disabled={adjustPercentages.isPending}
                className="flex-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white rounded-lg transition-colors font-medium"
              >
                {adjustPercentages.isPending ? "Updating..." : "Update Percentages"}
              </button>
              <button
                onClick={() => {
                  setShowPercentageChange(false);
                  // Reset to current values from database
                  setPercentages({
                    CEO: 30,
                    CTO: 20,
                    HEAD_OF_TRAVEL: 20,
                    CMO: 10,
                    OLIVER: 5,
                    MORRISON: 5,
                    ANNIE: 10,
                  });
                  setPercentageReason("");
                }}
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
