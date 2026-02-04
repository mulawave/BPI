"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { formatDistanceToNow } from "date-fns";
import { ChevronDown, ChevronUp, Filter, Download } from "lucide-react";

interface AllocationTimelineProps {
  allocations: Array<{
    id: string;
    createdAt: Date;
    totalAmount: number;
    companyReserveAmount: number;
    executivePoolAmount: number;
    strategicPoolsAmount: number;
    source: string;
    Transaction?: {
      description: string | null;
    } | null;
  }>;
}

export default function AllocationTimeline({ allocations }: AllocationTimelineProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [filterSource, setFilterSource] = useState<string>("all");

  const filteredAllocations = filterSource === "all"
    ? allocations
    : allocations.filter((a) => a.source === filterSource);

  const sources = Array.from(new Set(allocations.map((a) => a.source)));

  const exportData = () => {
    const csv = [
      ["Date", "Total", "Company (50%)", "Executive (30%)", "Strategic (20%)", "Source", "Description"],
      ...filteredAllocations.map((a) => [
        new Date(a.createdAt).toISOString(),
        a.totalAmount,
        a.companyReserveAmount,
        a.executivePoolAmount,
        a.strategicPoolsAmount,
        a.source,
        a.Transaction?.description || "",
      ]),
    ]
      .map((row) => row.join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `allocations-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-slate-800 dark:text-white">
          Allocation Timeline
        </h3>
        <div className="flex items-center gap-3">
          <select
            value={filterSource}
            onChange={(e) => setFilterSource(e.target.value)}
            className="px-3 py-1.5 text-sm border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-800 dark:text-white"
          >
            <option value="all">All Sources</option>
            {sources.map((source) => (
              <option key={source} value={source}>
                {source.replace(/_/g, " ")}
              </option>
            ))}
          </select>
          <button
            onClick={exportData}
            className="flex items-center gap-2 px-3 py-1.5 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            <Download size={16} />
            Export CSV
          </button>
        </div>
      </div>

      <div className="space-y-3 max-h-[500px] overflow-y-auto">
        <AnimatePresence>
          {filteredAllocations.map((allocation) => (
            <motion.div
              key={allocation.id}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="border border-slate-200 dark:border-slate-600 rounded-lg overflow-hidden"
            >
              <button
                onClick={() => setExpandedId(expandedId === allocation.id ? null : allocation.id)}
                className="w-full flex items-center justify-between p-4 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="text-left">
                    <p className="text-sm font-medium text-slate-800 dark:text-white">
                      ₦{allocation.totalAmount.toLocaleString()}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {formatDistanceToNow(new Date(allocation.createdAt), { addSuffix: true })}
                    </p>
                  </div>
                  <span className="px-2 py-1 text-xs rounded-full bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300">
                    {allocation.source.replace(/_/g, " ")}
                  </span>
                </div>
                {expandedId === allocation.id ? (
                  <ChevronUp className="text-slate-400" size={20} />
                ) : (
                  <ChevronDown className="text-slate-400" size={20} />
                )}
              </button>

              <AnimatePresence>
                {expandedId === allocation.id && (
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: "auto" }}
                    exit={{ height: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="px-4 pb-4 pt-2 border-t border-slate-200 dark:border-slate-600">
                      <div className="grid grid-cols-3 gap-4 mb-3">
                        <div>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Company Reserve</p>
                          <p className="text-sm font-semibold text-green-600 dark:text-green-400">
                            ₦{allocation.companyReserveAmount.toLocaleString()}
                          </p>
                          <p className="text-xs text-slate-400">50%</p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Executive Pool</p>
                          <p className="text-sm font-semibold text-purple-600 dark:text-purple-400">
                            ₦{allocation.executivePoolAmount.toLocaleString()}
                          </p>
                          <p className="text-xs text-slate-400">30%</p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Strategic Pools</p>
                          <p className="text-sm font-semibold text-orange-600 dark:text-orange-400">
                            ₦{allocation.strategicPoolsAmount.toLocaleString()}
                          </p>
                          <p className="text-xs text-slate-400">20%</p>
                        </div>
                      </div>
                      {allocation.Transaction?.description && (
                        <div className="mt-3 p-3 bg-slate-50 dark:bg-slate-700 rounded-lg">
                          <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Description</p>
                          <p className="text-sm text-slate-700 dark:text-slate-200">
                            {allocation.Transaction.description}
                          </p>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </AnimatePresence>

        {filteredAllocations.length === 0 && (
          <div className="text-center py-8">
            <p className="text-slate-500 dark:text-slate-400">No allocations found</p>
          </div>
        )}
      </div>
    </div>
  );
}
