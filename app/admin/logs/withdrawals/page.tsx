// @ts-nocheck
"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { api } from "@/client/trpc";
import { MdSearch, MdRefresh, MdDownload, MdCallReceived } from "react-icons/md";
import { format } from "date-fns";
import { useCurrency } from "@/contexts/CurrencyContext";

export default function WithdrawalLogsPage() {
  const [page, setPage] = useState(1);
  const [pageSize] = useState(50);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined);
  const { formatAmount } = useCurrency();

  const { data, isLoading, refetch } = api.admin.getWithdrawalLogs.useQuery({
    page,
    pageSize,
    search: search || undefined,
    status: statusFilter,
  });

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "completed":
      case "approved":
        return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300";
      case "pending":
      case "processing":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300";
      case "rejected":
      case "failed":
        return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300";
    }
  };

  const withdrawalData = data?.withdrawals || [];
  const completedCount = withdrawalData.filter(w => w.status === 'completed').length;
  const pendingCount = withdrawalData.filter(w => w.status === 'pending' || w.status === 'processing').length;
  const totalAmountValue = withdrawalData
    .filter(w => w.status === 'completed')
    .reduce((sum, w) => sum + Math.abs(w.amount), 0);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-border border-t-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-7xl mx-auto"
      >
        {/* Header */}
        <div className="relative overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-card via-[hsl(var(--muted))] to-card p-8 shadow-xl">
          <div className="absolute -top-20 -right-20 h-40 w-40 rounded-full bg-gradient-to-br from-red-500 to-orange-600 opacity-10 blur-2xl" />
          <div className="relative">
            <div className="flex items-center gap-3 mb-2">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-red-500 to-orange-600 shadow-lg">
                <MdCallReceived className="h-7 w-7 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold">Withdrawal Logs</h1>
                <p className="text-muted-foreground">View all withdrawal transactions</p>
              </div>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
          <div className="rounded-lg border border-border bg-card p-4">
            <div className="text-sm text-muted-foreground">Total Withdrawals</div>
            <div className="text-2xl font-bold">{data?.total || 0}</div>
          </div>
          <div className="rounded-lg border border-border bg-card p-4">
            <div className="text-sm text-muted-foreground">Pending</div>
            <div className="text-2xl font-bold text-yellow-600">{pendingCount}</div>
          </div>
          <div className="rounded-lg border border-border bg-card p-4">
            <div className="text-sm text-muted-foreground">Completed</div>
            <div className="text-2xl font-bold text-green-600">{completedCount}</div>
          </div>
          <div className="rounded-lg border border-border bg-card p-4">
            <div className="text-sm text-muted-foreground">Total Amount</div>
            <div className="text-2xl font-bold">{formatAmount(totalAmountValue)}</div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-4 mt-6">
          <div className="relative flex-1 min-w-[200px]">
            <MdSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search by user, reference..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-lg border border-border bg-background px-10 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <select
            value={statusFilter || ""}
            onChange={(e) => setStatusFilter(e.target.value || undefined)}
            className="rounded-lg border border-border bg-background px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="">All Status</option>
            <option value="pending">Pending</option>
            <option value="processing">Processing</option>
            <option value="completed">Completed</option>
            <option value="failed">Failed</option>
          </select>
          <button
            onClick={() => refetch()}
            className="rounded-lg border border-border bg-background px-4 py-2 hover:bg-muted transition-colors flex items-center gap-2"
          >
            <MdRefresh className="h-5 w-5" />
            Refresh
          </button>
        </div>

        {/* Table */}
        <div className="mt-6 overflow-hidden rounded-lg border border-border bg-card">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Date</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">User</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Type</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Description</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold">Amount</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Reference</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {withdrawalData.map(withdrawal => (
                  <tr key={withdrawal.id} className="hover:bg-muted/50">
                    <td className="px-4 py-3 text-sm">
                      {format(new Date(withdrawal.createdAt), "MMM dd, yyyy HH:mm")}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <div>
                        <div className="font-medium">{withdrawal.User?.name || "N/A"}</div>
                        <div className="text-muted-foreground text-xs">{withdrawal.User?.email || ""}</div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300">
                        {withdrawal.transactionType?.replace('WITHDRAWAL_', '')}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm max-w-xs truncate">
                      {withdrawal.description}
                    </td>
                    <td className="px-4 py-3 text-sm text-right font-mono font-semibold text-red-600">
                      {formatAmount(Math.abs(withdrawal.amount))}
                    </td>
                    <td className="px-4 py-3 text-sm font-mono text-xs">
                      {withdrawal.reference || "N/A"}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(withdrawal.status)}`}>
                        {withdrawal.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination */}
        {data && data.pages > 1 && (
          <div className="mt-6 flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              Page {page} of {data.pages} ({data.total} total)
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-4 py-2 rounded-lg border border-border bg-background disabled:opacity-50 disabled:cursor-not-allowed hover:bg-muted transition-colors"
              >
                Previous
              </button>
              <button
                onClick={() => setPage((p) => Math.min(data.pages, p + 1))}
                disabled={page === data.pages}
                className="px-4 py-2 rounded-lg border border-border bg-background disabled:opacity-50 disabled:cursor-not-allowed hover:bg-muted transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
