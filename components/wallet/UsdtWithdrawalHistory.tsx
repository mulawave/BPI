"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FiX, FiCopy, FiExternalLink, FiClock, FiCheckCircle, FiXCircle } from "react-icons/fi";
import { DollarSign } from "lucide-react";
import { api } from "@/client/trpc";
import { format } from "date-fns";
import toast from "react-hot-toast";

interface UsdtWithdrawalHistoryProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function UsdtWithdrawalHistory({ isOpen, onClose }: UsdtWithdrawalHistoryProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const { data: withdrawals, isLoading } = api.wallet.getMyUsdtWithdrawals.useQuery(
    undefined,
    { enabled: isOpen }
  );

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case "completed":
        return { icon: FiCheckCircle, color: "text-emerald-500", bg: "bg-emerald-100 dark:bg-emerald-900/30", label: "Completed" };
      case "failed":
      case "rejected":
        return { icon: FiXCircle, color: "text-red-500", bg: "bg-red-100 dark:bg-red-900/30", label: status === "failed" ? "Failed" : "Rejected" };
      default:
        return { icon: FiClock, color: "text-amber-500", bg: "bg-amber-100 dark:bg-amber-900/30", label: "Pending" };
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
        onClick={(e) => e.target === e.currentTarget && onClose()}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-2xl max-h-[85vh] overflow-hidden shadow-2xl border border-gray-200 dark:border-gray-700"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-900/50 rounded-xl flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">USDT Withdrawals</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">TRC-20 Network History</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            >
              <FiX className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="overflow-y-auto max-h-[calc(85vh-80px)] p-6">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-12 gap-3">
                <div className="w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin" />
                <p className="text-sm text-gray-500">Loading withdrawals...</p>
              </div>
            ) : !withdrawals || withdrawals.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 gap-3">
                <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
                  <DollarSign className="w-8 h-8 text-gray-400" />
                </div>
                <p className="text-gray-500 font-medium">No USDT withdrawals yet</p>
                <p className="text-sm text-gray-400">Your USDT withdrawal history will appear here</p>
              </div>
            ) : (
              <div className="space-y-3">
                {withdrawals.map((w, idx) => {
                  const statusConfig = getStatusConfig(w.status);
                  const StatusIcon = statusConfig.icon;
                  const isExpanded = selectedId === w.id;

                  return (
                    <motion.div
                      key={w.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.04 }}
                      className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden"
                    >
                      {/* Row */}
                      <button
                        onClick={() => setSelectedId(isExpanded ? null : w.id)}
                        className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors text-left"
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-9 h-9 rounded-full flex items-center justify-center ${statusConfig.bg}`}>
                            <StatusIcon className={`w-4.5 h-4.5 ${statusConfig.color}`} />
                          </div>
                          <div>
                            <div className="font-semibold text-gray-900 dark:text-white">
                              ${w.amount.toLocaleString()} <span className="text-xs font-normal text-gray-500">USDT</span>
                            </div>
                            <div className="text-xs text-gray-500">{format(new Date(w.createdAt), "MMM d, yyyy 'at' h:mm a")}</div>
                          </div>
                        </div>
                        <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${statusConfig.bg} ${statusConfig.color}`}>
                          {statusConfig.label}
                        </span>
                      </button>

                      {/* Expanded Details */}
                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="overflow-hidden"
                          >
                            <div className="px-4 pb-4 pt-1 space-y-3 border-t border-gray-100 dark:border-gray-800">
                              {/* Reference */}
                              <div className="flex items-center justify-between text-sm">
                                <span className="text-gray-500">Reference</span>
                                <span className="font-mono text-xs text-gray-700 dark:text-gray-300">{w.reference}</span>
                              </div>

                              {/* Network */}
                              <div className="flex items-center justify-between text-sm">
                                <span className="text-gray-500">Network</span>
                                <span className="font-medium text-emerald-600">{w.network}</span>
                              </div>

                              {/* Wallet Address */}
                              <div className="text-sm">
                                <span className="text-gray-500 block mb-1">Wallet Address</span>
                                <div className="flex items-center gap-2 bg-gray-50 dark:bg-gray-800 rounded-lg px-3 py-2">
                                  <span className="font-mono text-xs text-gray-700 dark:text-gray-300 break-all flex-1">{w.usdtAddress}</span>
                                  <button
                                    onClick={(e) => { e.stopPropagation(); copyToClipboard(w.usdtAddress); }}
                                    className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors shrink-0"
                                    title="Copy address"
                                  >
                                    <FiCopy className="w-3.5 h-3.5 text-gray-500" />
                                  </button>
                                </div>
                              </div>

                              {/* Transaction Hash (if approved) */}
                              {w.adminTxHash && (
                                <div className="text-sm">
                                  <span className="text-gray-500 block mb-1">Transaction Hash</span>
                                  <div className="flex items-center gap-2 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg px-3 py-2 border border-emerald-200 dark:border-emerald-800">
                                    <span className="font-mono text-xs text-emerald-700 dark:text-emerald-300 break-all flex-1">{w.adminTxHash}</span>
                                    <button
                                      onClick={(e) => { e.stopPropagation(); copyToClipboard(w.adminTxHash!); }}
                                      className="p-1 hover:bg-emerald-100 dark:hover:bg-emerald-800 rounded transition-colors shrink-0"
                                      title="Copy hash"
                                    >
                                      <FiCopy className="w-3.5 h-3.5 text-emerald-600" />
                                    </button>
                                    <a
                                      href={`https://tronscan.org/#/transaction/${w.adminTxHash}`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      onClick={(e) => e.stopPropagation()}
                                      className="p-1 hover:bg-emerald-100 dark:hover:bg-emerald-800 rounded transition-colors shrink-0"
                                      title="View on TRONSCAN"
                                    >
                                      <FiExternalLink className="w-3.5 h-3.5 text-emerald-600" />
                                    </a>
                                  </div>
                                </div>
                              )}

                              {/* Approved At */}
                              {w.approvedAt && (
                                <div className="flex items-center justify-between text-sm">
                                  <span className="text-gray-500">Approved At</span>
                                  <span className="text-gray-700 dark:text-gray-300">{format(new Date(w.approvedAt), "MMM d, yyyy 'at' h:mm a")}</span>
                                </div>
                              )}

                              {/* Pending info */}
                              {w.status === "pending" && (
                                <div className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
                                  <p className="text-xs text-amber-700 dark:text-amber-300">
                                    <strong>Awaiting admin review.</strong> You&apos;ll receive a notification and a transaction hash once the USDT has been sent to your wallet.
                                  </p>
                                </div>
                              )}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
