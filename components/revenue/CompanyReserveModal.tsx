"use client";

import { useState } from "react";
import { api } from "@/client/trpc";
import toast from "react-hot-toast";
import { X, Wallet, TrendingUp, TrendingDown, DollarSign, Calendar, User } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface CompanyReserveModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CompanyReserveModal({ isOpen, onClose }: CompanyReserveModalProps) {
  const [showSpendForm, setShowSpendForm] = useState(false);
  const [spendData, setSpendData] = useState({
    amount: "",
    category: "OPERATIONS" as const,
    description: "",
  });

  // Queries
  const { data: reserve, isLoading, refetch } = api.revenue.getCompanyReserve.useQuery(
    { includeTransactions: true, limit: 50 },
    { enabled: isOpen }
  );

  // Mutations
  const spendMutation = api.revenue.spendFromReserve.useMutation({
    onSuccess: () => {
      toast.success("Spend recorded successfully");
      refetch();
      setShowSpendForm(false);
      setSpendData({ amount: "", category: "OPERATIONS", description: "" });
    },
    onError: (error) => toast.error(error.message),
  });

  const handleSpendSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const amount = parseFloat(spendData.amount);
    if (!amount || amount <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    if (!spendData.description || spendData.description.length < 5) {
      toast.error("Description must be at least 5 characters");
      return;
    }

    spendMutation.mutate({
      amount,
      category: spendData.category,
      description: spendData.description,
    });
  };

  const categories = [
    { value: "SALARIES", label: "Salaries & Wages", icon: "👥" },
    { value: "INFRASTRUCTURE", label: "Infrastructure & Development", icon: "🏗️" },
    { value: "MARKETING", label: "Marketing & Growth", icon: "📈" },
    { value: "LEGAL", label: "Legal & Compliance", icon: "⚖️" },
    { value: "OPERATIONS", label: "Operations & Maintenance", icon: "⚙️" },
    { value: "OTHER", label: "Other Expenses", icon: "📌" },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-green-600 to-emerald-600 px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Wallet className="w-6 h-6 text-white" />
                <h2 className="text-2xl font-bold text-white">Company Reserve</h2>
              </div>
              <button
                onClick={onClose}
                className="text-white hover:bg-white/20 rounded-lg p-2 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="text-slate-600 dark:text-slate-300">Loading reserve details...</div>
                </div>
              ) : !reserve ? (
                <div className="text-center py-12">
                  <p className="text-slate-600 dark:text-slate-300">Company reserve not found</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Summary Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl p-4 border border-green-200 dark:border-green-800">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-green-700 dark:text-green-300">Current Balance</span>
                        <Wallet className="w-5 h-5 text-green-600 dark:text-green-400" />
                      </div>
                      <div className="text-3xl font-bold text-green-800 dark:text-green-200">
                        ₦{Number(reserve.balance || 0).toLocaleString()}
                      </div>
                    </div>

                    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl p-4 border border-blue-200 dark:border-blue-800">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-blue-700 dark:text-blue-300">Total Received</span>
                        <TrendingUp className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div className="text-3xl font-bold text-blue-800 dark:text-blue-200">
                        ₦{Number(reserve.totalReceived || 0).toLocaleString()}
                      </div>
                    </div>

                    <div className="bg-gradient-to-br from-red-50 to-pink-50 dark:from-red-900/20 dark:to-pink-900/20 rounded-xl p-4 border border-red-200 dark:border-red-800">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-red-700 dark:text-red-300">Total Spent</span>
                        <TrendingDown className="w-5 h-5 text-red-600 dark:text-red-400" />
                      </div>
                      <div className="text-3xl font-bold text-red-800 dark:text-red-200">
                        ₦{Number(reserve.totalSpent || 0).toLocaleString()}
                      </div>
                    </div>
                  </div>

                  {/* Record Spend Button */}
                  {!showSpendForm && (
                    <button
                      onClick={() => setShowSpendForm(true)}
                      className="w-full py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-700 hover:to-emerald-700 transition-all font-medium"
                    >
                      <DollarSign className="w-5 h-5 inline mr-2" />
                      Record New Spend
                    </button>
                  )}

                  {/* Spend Form */}
                  {showSpendForm && (
                    <motion.form
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      onSubmit={handleSpendSubmit}
                      className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-6 space-y-4 border border-slate-200 dark:border-slate-600"
                    >
                      <h3 className="text-lg font-semibold text-slate-800 dark:text-white">Record Spend</h3>

                      <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">
                          Amount (₦)
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          value={spendData.amount}
                          onChange={(e) => setSpendData({ ...spendData, amount: e.target.value })}
                          className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-800 dark:text-white focus:ring-2 focus:ring-green-500"
                          placeholder="Enter amount"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">
                          Category
                        </label>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                          {categories.map((cat) => (
                            <button
                              key={cat.value}
                              type="button"
                              onClick={() => setSpendData({ ...spendData, category: cat.value as any })}
                              className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                                spendData.category === cat.value
                                  ? "bg-green-600 text-white"
                                  : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700"
                              }`}
                            >
                              <span className="mr-1">{cat.icon}</span>
                              {cat.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">
                          Description
                        </label>
                        <textarea
                          value={spendData.description}
                          onChange={(e) => setSpendData({ ...spendData, description: e.target.value })}
                          className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-800 dark:text-white focus:ring-2 focus:ring-green-500"
                          placeholder="Describe the expense..."
                          rows={3}
                          required
                        />
                      </div>

                      <div className="flex gap-2">
                        <button
                          type="submit"
                          disabled={spendMutation.isPending}
                          className="flex-1 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 font-medium"
                        >
                          {spendMutation.isPending ? "Recording..." : "Record Spend"}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setShowSpendForm(false);
                            setSpendData({ amount: "", category: "OPERATIONS", description: "" });
                          }}
                          className="px-6 py-2 bg-slate-200 dark:bg-slate-600 text-slate-700 dark:text-white rounded-lg hover:bg-slate-300 dark:hover:bg-slate-500 transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    </motion.form>
                  )}

                  {/* Transaction History */}
                  <div>
                    <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                      <Calendar className="w-5 h-5" />
                      Transaction History
                    </h3>

                    {!(reserve as any).Transactions || (reserve as any).Transactions.length === 0 ? (
                      <div className="text-center py-8 text-slate-600 dark:text-slate-300">
                        No transactions yet
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {(reserve as any).Transactions.map((transaction: any) => (
                          <div
                            key={transaction.id}
                            className="bg-white dark:bg-slate-700 rounded-lg p-4 border border-slate-200 dark:border-slate-600"
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <span
                                    className={`px-2 py-0.5 rounded text-xs font-medium ${
                                      transaction.type === "REVENUE_ALLOCATION"
                                        ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300"
                                        : "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300"
                                    }`}
                                  >
                                    {transaction.type.replace(/_/g, " ")}
                                  </span>
                                  {transaction.category && (
                                    <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-600 rounded text-xs font-medium text-slate-700 dark:text-slate-200">
                                      {transaction.category}
                                    </span>
                                  )}
                                </div>
                                <p className="text-sm text-slate-700 dark:text-slate-200 mb-2">
                                  {transaction.description}
                                </p>
                                <div className="flex items-center gap-4 text-xs text-slate-500">
                                  <span className="flex items-center gap-1">
                                    <Calendar className="w-3 h-3" />
                                    {new Date(transaction.createdAt).toLocaleDateString()}
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <User className="w-3 h-3" />
                                    {transaction.ApprovedBy?.name || "System"}
                                  </span>
                                </div>
                              </div>
                              <div
                                className={`text-lg font-bold ${
                                  transaction.type === "REVENUE_ALLOCATION"
                                    ? "text-green-600 dark:text-green-400"
                                    : "text-red-600 dark:text-red-400"
                                }`}
                              >
                                {transaction.type === "REVENUE_ALLOCATION" ? "+" : "-"}
                                ₦{Number(transaction.amount).toLocaleString()}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
