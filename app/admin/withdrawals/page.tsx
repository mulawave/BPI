"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { api } from "@/client/trpc";
import {
  MdSearch,
  MdRefresh,
  MdAttachMoney,
  MdCheckCircle,
  MdCancel,
  MdPending,
  MdAccountBalance,
} from "react-icons/md";
import { format } from "date-fns";
import toast from "react-hot-toast";
import StatsCard from "@/components/admin/StatsCard";

export default function WithdrawalsPage() {
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [search, setSearch] = useState("");
  const [selectedWithdrawal, setSelectedWithdrawal] = useState<any>(null);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [approvalNotes, setApprovalNotes] = useState("");

  const { data, isLoading, refetch } = api.admin.getPendingWithdrawals.useQuery({
    page,
    pageSize,
    search: search || undefined,
  });

  const approveMutation = api.admin.approveWithdrawal.useMutation({
    onSuccess: () => {
      toast.success("Withdrawal approved and processed!");
      setShowApproveModal(false);
      setSelectedWithdrawal(null);
      setApprovalNotes("");
      refetch();
    },
    onError: (error) => {
      toast.error(`Failed to approve: ${error.message}`);
    },
  });

  const rejectMutation = api.admin.rejectWithdrawal.useMutation({
    onSuccess: () => {
      toast.success("Withdrawal rejected and funds refunded");
      setShowRejectModal(false);
      setSelectedWithdrawal(null);
      setRejectReason("");
      refetch();
    },
    onError: (error) => {
      toast.error(`Failed to reject: ${error.message}`);
    },
  });

  const handleApprove = () => {
    if (!selectedWithdrawal) return;
    approveMutation.mutate({
      withdrawalId: selectedWithdrawal.id,
      notes: approvalNotes,
    });
  };

  const handleReject = () => {
    if (!selectedWithdrawal || !rejectReason.trim()) {
      toast.error("Please provide a reason for rejection");
      return;
    }
    rejectMutation.mutate({
      withdrawalId: selectedWithdrawal.id,
      reason: rejectReason,
    });
  };

  const getTypeColor = (type: string) => {
    return type === "WITHDRAWAL_CASH"
      ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
      : "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300";
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
          <div className="absolute -top-20 -right-20 h-40 w-40 rounded-full bg-gradient-to-br from-orange-500 to-red-600 opacity-10 blur-2xl" />
          <div className="relative flex items-center justify-between gap-4">
            <div className="min-w-0">
              <h1 className="text-4xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
                Withdrawal Approvals
              </h1>
              <p className="text-muted-foreground mt-1 font-medium">
                Review and approve pending withdrawal requests
              </p>
            </div>
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => refetch()}
              className="flex items-center gap-2 rounded-xl border border-border bg-background/60 px-4 py-2.5 font-semibold text-foreground/80 shadow-sm transition-all hover:bg-background hover:text-foreground"
            >
              <MdRefresh size={20} />
              <span>Refresh</span>
            </motion.button>
          </div>
        </motion.div>

        {/* Summary Cards */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08 }}
          className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3"
        >
          <StatsCard
            title="Pending Withdrawals"
            value={data?.total || 0}
            icon={MdPending}
            color="orange"
          />
          <StatsCard
            title="Showing"
            value={data?.withdrawals?.length || 0}
            icon={MdAccountBalance}
            color="blue"
            badge={`Page ${data?.currentPage || page}/${data?.pages || 1}`}
          />
          <StatsCard
            title="Total Value"
            value={`₦${(data?.withdrawals?.reduce((sum, w) => sum + Math.abs(w.amount), 0) || 0).toLocaleString()}`}
            icon={MdAttachMoney}
            color="green"
          />
        </motion.div>

        {/* Search */}
        <div className="mt-6 rounded-2xl border border-border bg-card/75 p-4 shadow-lg shadow-black/5 backdrop-blur-xl dark:shadow-black/20">
          <div className="relative">
            <MdSearch
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              size={20}
            />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by reference, user name, or email..."
              className="w-full rounded-xl border-2 border-border bg-background/50 py-3 pl-10 pr-4 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-[hsl(var(--primary))] focus:ring-4 focus:ring-[hsl(var(--secondary))]/20 transition-all"
            />
          </div>
        </div>

        {/* Withdrawals Table */}
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
                    Bank Details
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Reference
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {isLoading ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center">
                      <div className="flex justify-center">
                        <div className="w-8 h-8 border-4 border-orange-600 border-t-transparent rounded-full animate-spin" />
                      </div>
                    </td>
                  </tr>
                ) : data?.withdrawals.length === 0 ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-6 py-12 text-center text-gray-500 dark:text-gray-400"
                    >
                      No pending withdrawals
                    </td>
                  </tr>
                ) : (
                  data?.withdrawals.map((withdrawal, idx) => (
                    <motion.tr
                      key={withdrawal.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="font-medium text-gray-900 dark:text-white">
                            {withdrawal.User?.name || "N/A"}
                          </span>
                          <span className="text-sm text-gray-500">
                            {withdrawal.User?.email}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-2 py-1 text-xs font-medium rounded-full ${getTypeColor(
                            withdrawal.transactionType
                          )}`}
                        >
                          {withdrawal.transactionType === "WITHDRAWAL_CASH"
                            ? "CASH"
                            : "BPT"}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <MdAttachMoney className="text-green-600" size={18} />
                          <span className="font-semibold text-gray-900 dark:text-white">
                            ₦{Math.abs(withdrawal.amount).toLocaleString()}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {withdrawal.User?.bankRecords?.[0] ? (
                          <div className="text-sm">
                            <div className="font-medium text-gray-900 dark:text-white">
                              {withdrawal.User.bankRecords[0].bank?.bankName}
                            </div>
                            <div className="text-gray-500">
                              {withdrawal.User.bankRecords[0].accountNumber}
                            </div>
                            <div className="text-gray-500">
                              {withdrawal.User.bankRecords[0].accountName}
                            </div>
                          </div>
                        ) : (
                          <span className="text-sm text-gray-500">
                            No bank details
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm font-mono text-gray-600 dark:text-gray-400">
                          {withdrawal.reference || "N/A"}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          {format(new Date(withdrawal.createdAt), "MMM d, yyyy")}
                          <div className="text-xs text-gray-500">
                            {format(new Date(withdrawal.createdAt), "h:mm a")}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              setSelectedWithdrawal(withdrawal);
                              setShowApproveModal(true);
                            }}
                            className="px-3 py-2 text-xs rounded-lg bg-green-600 text-white hover:bg-green-700 transition-colors"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => {
                              setSelectedWithdrawal(withdrawal);
                              setShowRejectModal(true);
                            }}
                            className="px-3 py-2 text-xs rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors"
                          >
                            Reject
                          </button>
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
                {Math.min(page * pageSize, data.total)} of {data.total} withdrawals
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
      </motion.div>

      {/* Approve Modal */}
      {showApproveModal && selectedWithdrawal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-md w-full mx-4 shadow-2xl"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                <MdCheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                Approve Withdrawal
              </h3>
            </div>

            <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">User:</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {selectedWithdrawal.User?.name}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Amount:</span>
                  <span className="font-bold text-green-600">
                    ₦{Math.abs(selectedWithdrawal.amount).toLocaleString()}
                  </span>
                </div>
                {selectedWithdrawal.User?.bankRecords?.[0] && (
                  <>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Bank:</span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {selectedWithdrawal.User.bankRecords[0].bank?.bankName}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Account:</span>
                      <span className="font-mono text-gray-900 dark:text-white">
                        {selectedWithdrawal.User.bankRecords[0].accountNumber}
                      </span>
                    </div>
                  </>
                )}
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Notes (Optional)
              </label>
              <textarea
                value={approvalNotes}
                onChange={(e) => setApprovalNotes(e.target.value)}
                placeholder="Add any notes about this approval..."
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>

            <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg mb-6">
              <p className="text-sm text-yellow-800 dark:text-yellow-300">
                <strong>⚠️ This will:</strong>
                <br />
                • Initiate a Flutterwave transfer to the user's bank account
                <br />
                • Mark the withdrawal as completed
                <br />• Send a confirmation notification to the user
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowApproveModal(false);
                  setSelectedWithdrawal(null);
                  setApprovalNotes("");
                }}
                disabled={approveMutation.isPending}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleApprove}
                disabled={approveMutation.isPending}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 font-semibold"
              >
                {approveMutation.isPending ? "Processing..." : "Approve & Transfer"}
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal && selectedWithdrawal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-md w-full mx-4 shadow-2xl"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
                <MdCancel className="w-6 h-6 text-red-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                Reject Withdrawal
              </h3>
            </div>

            <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">User:</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {selectedWithdrawal.User?.name}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Amount:</span>
                  <span className="font-bold text-red-600">
                    ₦{Math.abs(selectedWithdrawal.amount).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Rejection Reason <span className="text-red-500">*</span>
              </label>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Explain why this withdrawal is being rejected..."
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>

            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg mb-6">
              <p className="text-sm text-blue-800 dark:text-blue-300">
                <strong>ℹ️ This will:</strong>
                <br />
                • Refund the amount + fees back to the user's wallet
                <br />
                • Mark the withdrawal as rejected
                <br />• Send a notification to the user with the reason
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowRejectModal(false);
                  setSelectedWithdrawal(null);
                  setRejectReason("");
                }}
                disabled={rejectMutation.isPending}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                disabled={rejectMutation.isPending || !rejectReason.trim()}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 font-semibold"
              >
                {rejectMutation.isPending ? "Processing..." : "Reject & Refund"}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
