"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ShieldCheck, User, Calendar, Filter, Search, Download } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { api } from "@/client/trpc";

interface AuditTrailModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AuditTrailModal({ isOpen, onClose }: AuditTrailModalProps) {
  const [filterAction, setFilterAction] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch admin actions from tRPC
  const { data: actions, isLoading } = api.revenue.getAdminActions.useQuery(
    { limit: 100 },
    { enabled: isOpen }
  );

  const filteredActions = (actions || []).filter((action) => {
    const matchesFilter = filterAction === "all" || action.actionType === filterAction;
    const matchesSearch =
      !searchQuery ||
      action.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (action.Admin?.name || "").toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const exportAudit = () => {
    const csv = [
      ["Timestamp", "Admin", "Action Type", "Description"],
      ...filteredActions.map((a) => [
        new Date(a.createdAt).toISOString(),
        a.Admin.name,
        a.actionType,
        a.description,
      ]),
    ]
      .map((row) => row.join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `audit-trail-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
  };

  const actionTypes = [
    { value: "ASSIGN_EXECUTIVE", label: "Assign Executive", color: "bg-blue-100 text-blue-700" },
    { value: "REMOVE_EXECUTIVE", label: "Remove Executive", color: "bg-red-100 text-red-700" },
    { value: "ADD_POOL_MEMBER", label: "Add Pool Member", color: "bg-green-100 text-green-700" },
    { value: "REMOVE_POOL_MEMBER", label: "Remove Pool Member", color: "bg-orange-100 text-orange-700" },
    { value: "DISTRIBUTE_POOL", label: "Distribute Pool", color: "bg-purple-100 text-purple-700" },
    { value: "SPEND_FROM_RESERVE", label: "Spend from Reserve", color: "bg-pink-100 text-pink-700" },
    { value: "MANUAL_ALLOCATION", label: "Manual Allocation", color: "bg-indigo-100 text-indigo-700" },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white/20 rounded-lg">
                    <ShieldCheck size={24} />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold">Audit Trail</h2>
                    <p className="text-blue-100 text-sm">Complete system action log</p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                >
                  <X size={24} />
                </button>
              </div>
            </div>

            {/* Filters */}
            <div className="p-6 border-b border-slate-200 dark:border-slate-700 space-y-4">
              <div className="flex items-center gap-4">
                {/* Search */}
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search actions..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-800 dark:text-white"
                  />
                </div>

                {/* Action Filter */}
                <select
                  value={filterAction}
                  onChange={(e) => setFilterAction(e.target.value)}
                  className="px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-800 dark:text-white"
                >
                  <option value="all">All Actions</option>
                  {actionTypes.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>

                {/* Export */}
                <button
                  onClick={exportAudit}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                  <Download size={18} />
                  Export CSV
                </button>
              </div>
            </div>

            {/* Actions List */}
            <div className="flex-1 overflow-y-auto p-6">
              <div className="space-y-3">
                {filteredActions.length === 0 ? (
                  <div className="text-center py-12">
                    <ShieldCheck className="w-16 h-16 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
                    <p className="text-slate-500 dark:text-slate-400">No actions found</p>
                  </div>
                ) : (
                  filteredActions.map((action) => {
                    const actionType = actionTypes.find((t) => t.value === action.actionType);
                    return (
                      <motion.div
                        key={action.id}
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="border border-slate-200 dark:border-slate-700 rounded-lg p-4 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <span
                                className={`px-2 py-1 rounded-full text-xs font-medium ${
                                  actionType?.color || "bg-slate-100 text-slate-700"
                                }`}
                              >
                                {actionType?.label || action.actionType}
                              </span>
                              <span className="text-xs text-slate-500 dark:text-slate-400">
                                {formatDistanceToNow(new Date(action.createdAt), {
                                  addSuffix: true,
                                })}
                              </span>
                            </div>

                            <p className="text-slate-800 dark:text-white font-medium mb-2">
                              {action.description}
                            </p>

                            <div className="flex items-center gap-4 text-sm text-slate-600 dark:text-slate-400">
                              <div className="flex items-center gap-1">
                                <User size={14} />
                                <span>{action.Admin.name}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Calendar size={14} />
                                <span>
                                  {new Date(action.createdAt).toLocaleString()}
                                </span>
                              </div>
                            </div>

                            {action.metadata && Object.keys(action.metadata).length > 0 && (
                              <div className="mt-3 p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                                <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">
                                  Metadata
                                </p>
                                <pre className="text-xs text-slate-700 dark:text-slate-300">
                                  {JSON.stringify(action.metadata, null, 2)}
                                </pre>
                              </div>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    );
                  })
                )}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
