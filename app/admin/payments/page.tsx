"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { api } from "@/client/trpc";
import type { inferRouterOutputs } from "@trpc/server";
import type { AppRouter } from "@/server/trpc/router/_app";
import {
  MdSearch,
  MdFilterList,
  MdRefresh,
  MdPending,
  MdAttachMoney,
  MdEvent,
} from "react-icons/md";
import { format } from "date-fns";
import ExportButton from "@/components/admin/ExportButton";
import PaymentDetailsModal from "@/components/admin/PaymentDetailsModal";
import PaymentReviewModal from "@/components/admin/PaymentReviewModal";
import BulkActionsBar from "@/components/admin/BulkActionsBar";
import toast from "react-hot-toast";
import StatsCard from "@/components/admin/StatsCard";

type RouterOutputs = inferRouterOutputs<AppRouter>;
type PaymentsOutput = RouterOutputs["admin"]["getAllPayments"];
type Payment = PaymentsOutput["payments"][number];

export default function PaymentsPage() {
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined);
  const [showFilters, setShowFilters] = useState(false);
  const [activeTab, setActiveTab] = useState<"ledger" | "pending">("ledger");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [currentPaymentId, setCurrentPaymentId] = useState<string | null>(null);

  const { data, isLoading, refetch } = api.admin.getAllPayments.useQuery({
    page,
    pageSize,
    search: search || undefined,
    status: statusFilter,
  });

  const {
    data: pending,
    isLoading: loadingPending,
    refetch: refetchPending,
  } = api.admin.getPendingPayments.useQuery({
    page,
    pageSize,
    status: undefined,
    search: search || undefined,
  }, { enabled: activeTab === "pending" });

  const bulkReview = api.admin.bulkReviewPayments.useMutation({
    onSuccess: (res) => {
      toast.success(`Processed ${res.count} payment(s)`);
      setSelectedIds([]);
      refetchPending();
    },
    onError: (e) => toast.error(e.message),
  });

  const activeFiltersCount = (search ? 1 : 0) + (statusFilter ? 1 : 0);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300";
      case "approved":
        return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300";
      case "rejected":
        return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300";
      case "expired":
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300";
      default:
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return <MdPending className="text-yellow-500" size={20} />;
      case "completed":
        return <MdPending className="text-green-500" size={20} />;
      default:
        return <MdPending className="text-gray-500" size={20} />;
    }
  };

  return (
    <div className="space-y-6 pb-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-7xl mx-auto"
      >
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="relative overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-card via-[hsl(var(--muted))] to-card p-8 shadow-xl shadow-black/5 backdrop-blur-sm dark:shadow-black/20"
        >
          <div className="absolute -top-20 -right-20 h-40 w-40 rounded-full bg-gradient-to-br from-[hsl(var(--secondary))] to-[hsl(var(--primary))] opacity-10 blur-2xl" />
          <div className="relative flex items-center justify-between gap-4">
            <div className="min-w-0">
              <h1 className="premium-gradient-text text-4xl font-bold">Payment Ledger</h1>
              <p className="text-muted-foreground mt-1 font-medium">
                View all payment transactions from the live ledger
              </p>
            </div>
            <div className="flex items-center gap-3">
              <ExportButton
                type="payments"
                filters={{
                  status: statusFilter,
                }}
              />
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => activeTab === "ledger" ? refetch() : refetchPending()}
                className="flex items-center gap-2 rounded-xl border border-border bg-background/60 px-4 py-2.5 font-semibold text-foreground/80 shadow-sm transition-all hover:bg-background hover:text-foreground"
              >
                <MdRefresh size={20} />
                <span>Refresh</span>
              </motion.button>
            </div>
          </div>
        </motion.div>

        {/* Tabs */}
        <div className="mt-4 flex items-center gap-2">
          <button
            onClick={() => setActiveTab("ledger")}
            className={`px-4 py-2 rounded-lg text-sm font-semibold ${activeTab === "ledger" ? "bg-[hsl(var(--primary))] text-white" : "bg-background/60 border border-border text-foreground/80"}`}
          >
            Ledger
          </button>
          <button
            onClick={() => setActiveTab("pending")}
            className={`px-4 py-2 rounded-lg text-sm font-semibold ${activeTab === "pending" ? "bg-[hsl(var(--primary))] text-white" : "bg-background/60 border border-border text-foreground/80"}`}
          >
            Pending Reviews
          </button>
        </div>

        {/* Summary Cards */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08 }}
          className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-4"
        >
          <StatsCard
            title="Total Transactions"
            value={data?.total || 0}
            icon={MdAttachMoney}
            color="green"
          />
          <StatsCard
            title="Showing"
            value={data?.payments?.length || 0}
            icon={MdEvent}
            color="blue"
            badge={`Page ${data?.currentPage || page}/${data?.pages || 1}`}
          />
          <StatsCard
            title="Active Filters"
            value={activeFiltersCount}
            icon={MdFilterList}
            color="orange"
            badge={activeFiltersCount > 0 ? "Filtered" : "All"}
          />
          <StatsCard
            title="Status"
            value={statusFilter || "All"}
            icon={MdPending}
            color="purple"
          />
        </motion.div>

        {/* Search and Filters */}
        <div className="mt-6 rounded-2xl border border-border bg-card/75 p-4 shadow-lg shadow-black/5 backdrop-blur-xl dark:shadow-black/20">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <MdSearch
                className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                size={20}
              />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by reference, description, type, name, or email..."
                className="w-full rounded-xl border-2 border-border bg-background/50 py-3 pl-10 pr-4 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-[hsl(var(--primary))] focus:ring-4 focus:ring-[hsl(var(--secondary))]/20 transition-all"
              />
            </div>

            {/* Filter Toggle */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 rounded-xl border-2 border-border bg-background/40 px-5 py-3 font-medium text-foreground/80 transition-all hover:bg-background hover:text-foreground"
            >
              <MdFilterList size={20} />
              <span>Filters</span>
            </button>
          </div>

          {/* Filters Panel */}
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6 pt-6 border-t border-border"
            >
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Status
                </label>
                <select
                  value={statusFilter || ""}
                  onChange={(e) =>
                    setStatusFilter(e.target.value || undefined)
                  }
                  className="w-full rounded-xl border-2 border-border bg-background/50 px-3 py-3 text-foreground"
                >
                  <option value="">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="completed">Completed</option>
                  <option value="failed">Failed</option>
                </select>
              </div>

              <div className="flex items-end md:col-span-2">
                <button
                  onClick={() => {
                    setStatusFilter(undefined);
                    setSearch("");
                  }}
                  className="w-full rounded-xl border-2 border-border bg-background/40 px-4 py-3 font-medium text-foreground/80 transition-all hover:bg-background hover:text-foreground"
                >
                  Clear Filters
                </button>
              </div>
            </motion.div>
          )}
        </div>

        {/* Payments Table */}
        {activeTab === "ledger" && (
        <div className="mt-6 overflow-hidden rounded-2xl border border-border bg-card/75 shadow-lg shadow-black/5 backdrop-blur dark:shadow-black/20">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-border bg-background/60">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Wallet
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Reference
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Date
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {isLoading ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center">
                      <div className="flex justify-center">
                        <div className="w-8 h-8 border-4 border-green-600 border-t-transparent rounded-full animate-spin" />
                      </div>
                    </td>
                  </tr>
                ) : data?.payments.length === 0 ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-6 py-12 text-center text-gray-500 dark:text-gray-400"
                    >
                      No payments found
                    </td>
                  </tr>
                ) : (
                  data?.payments.map((payment, idx) => (
                    <motion.tr
                      key={payment.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="font-medium text-gray-900 dark:text-white">
                            {payment.User?.name || "N/A"}
                          </span>
                          <span className="text-sm text-gray-500">{payment.User?.email}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-gray-700 dark:text-gray-300">
                          {payment.transactionType}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <MdAttachMoney className="text-green-600" size={18} />
                          <span className="font-semibold text-gray-900 dark:text-white">
                            NGN {payment.amount.toLocaleString()}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-gray-700 dark:text-gray-300">
                          {payment.walletType}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm font-mono text-gray-600 dark:text-gray-400">
                          {payment.reference || "N/A"}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(payment.status)}
                          <span
                            className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(
                              payment.status
                            )}`}
                          >
                            {payment.status.toUpperCase()}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                          <MdEvent size={16} />
                          {format(new Date(payment.createdAt), "MMM d, yyyy")}
                        </div>
                      </td>
                    </motion.tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {data && data.pages > 1 && (
            <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <div className="text-sm text-gray-700 dark:text-gray-300">
                Showing {(page - 1) * pageSize + 1} to{" "}
                {Math.min(page * pageSize, data.total)} of {data.total} payments
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage(page - 1)}
                  disabled={page === 1}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Previous
                </button>
                <button
                  onClick={() => setPage(page + 1)}
                  disabled={page >= data.pages}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
        )}

        {activeTab === "pending" && (
          <div className="mt-6 overflow-hidden rounded-2xl border border-border bg-card/75 shadow-lg shadow-black/5 backdrop-blur dark:shadow-black/20">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b border-border bg-background/60">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Select</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">User</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Type</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Amount</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Reference</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {loadingPending ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-12 text-center">
                        <div className="flex justify-center">
                          <div className="w-8 h-8 border-4 border-green-600 border-t-transparent rounded-full animate-spin" />
                        </div>
                      </td>
                    </tr>
                  ) : pending?.payments?.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">No pending payments</td>
                    </tr>
                  ) : (
                    pending?.payments?.map((p: any, idx: number) => (
                      <motion.tr key={p.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05 }} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                        <td className="px-6 py-4">
                          <input
                            type="checkbox"
                            checked={selectedIds.includes(p.id)}
                            onChange={(e) => {
                              setSelectedIds((prev) =>
                                e.target.checked ? [...prev, p.id] : prev.filter((id) => id !== p.id)
                              );
                            }}
                          />
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col">
                            <span className="font-medium text-gray-900 dark:text-white">{p.User?.name || "N/A"}</span>
                            <span className="text-sm text-gray-500">{p.User?.email}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4"><span className="text-sm text-gray-700 dark:text-gray-300">{p.transactionType}</span></td>
                        <td className="px-6 py-4"><span className="font-semibold text-gray-900 dark:text-white">NGN {p.amount.toLocaleString()}</span></td>
                        <td className="px-6 py-4"><span className="text-sm font-mono text-gray-600 dark:text-gray-400">{p.gatewayReference || "N/A"}</span></td>
                        <td className="px-6 py-4">
                          <span className="px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300">{p.status.toUpperCase()}</span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex gap-2">
                            <button
                              className="px-3 py-2 text-xs rounded-lg border border-border bg-background/60"
                              onClick={() => { setCurrentPaymentId(p.id); setDetailsOpen(true); }}
                            >
                              Details
                            </button>
                            <button
                              className="px-3 py-2 text-xs rounded-lg bg-green-600 text-white"
                              onClick={() => { setCurrentPaymentId(p.id); setReviewOpen(true); }}
                            >
                              Review
                            </button>
                          </div>
                        </td>
                      </motion.tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination for pending */}
            {pending && pending.pages > 1 && (
              <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
                <div className="text-sm text-gray-700 dark:text-gray-300">
                  Showing {(page - 1) * pageSize + 1} to {Math.min(page * pageSize, pending.total)} of {pending.total} payments
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setPage(page - 1)} disabled={page === 1} className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">Previous</button>
                  <button onClick={() => setPage(page + 1)} disabled={page >= pending.pages} className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">Next</button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Modals */}
        <PaymentDetailsModal
          paymentId={currentPaymentId || ""}
          isOpen={detailsOpen}
          onClose={() => setDetailsOpen(false)}
          onReview={() => { setDetailsOpen(false); setReviewOpen(true); }}
        />
        <PaymentReviewModal
          paymentId={currentPaymentId || ""}
          isOpen={reviewOpen}
          onClose={() => setReviewOpen(false)}
          onSuccess={() => { setReviewOpen(false); refetchPending(); }}
        />

        {/* Bulk actions */}
        <BulkActionsBar
          selectedCount={selectedIds.length}
          onClear={() => setSelectedIds([])}
          actions={[
            {
              label: "Approve",
              icon: () => <span className="h-4 w-4">✓</span>,
              variant: "success",
              confirmMessage: "Approve selected payments?",
              onClick: () => bulkReview.mutate({ paymentIds: selectedIds, action: "approve" }),
            },
            {
              label: "Reject",
              icon: () => <span className="h-4 w-4">✕</span>,
              variant: "danger",
              confirmMessage: "Reject selected payments?",
              onClick: () => bulkReview.mutate({ paymentIds: selectedIds, action: "reject" }),
            },
          ]}
        />
      </motion.div>
    </div>
  );
}
