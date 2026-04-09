"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { api } from "@/client/trpc";
import toast from "react-hot-toast";
import {
  Shield, Search, Filter, CheckCircle2, XCircle, Clock,
  Eye, ChevronLeft, ChevronRight, AlertTriangle, Users,
  FileText, BadgeCheck, RotateCcw, Loader2, MoreHorizontal,
  Check, X, UserCheck, Download, RefreshCw,
} from "lucide-react";
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  type ColumnDef,
} from "@tanstack/react-table";
import { format } from "date-fns";
import KycDetailModal from "@/components/admin/KycDetailModal";

type KycSubmission = {
  id: string;
  status: string;
  legalFirstName: string;
  legalLastName: string;
  documentType: string;
  documentNumber: string;
  nationality: string;
  submittedAt: Date;
  reviewedAt: Date | null;
  rejectionReason: string | null;
  expiresAt: Date | null;
  user: {
    id: string;
    email: string | null;
    name: string | null;
    firstname: string | null;
    lastname: string | null;
    profilePic: string | null;
    activated: boolean;
    rank: string;
  };
  reviewer: { id: string; name: string | null; email: string | null } | null;
};

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; icon: typeof Clock }> = {
  pending: {
    label: "Pending",
    color: "text-amber-700 dark:text-amber-400",
    bg: "bg-amber-100 dark:bg-amber-900/30",
    icon: Clock,
  },
  under_review: {
    label: "Under Review",
    color: "text-blue-700 dark:text-blue-400",
    bg: "bg-blue-100 dark:bg-blue-900/30",
    icon: Eye,
  },
  approved: {
    label: "Approved",
    color: "text-emerald-700 dark:text-emerald-400",
    bg: "bg-emerald-100 dark:bg-emerald-900/30",
    icon: CheckCircle2,
  },
  rejected: {
    label: "Rejected",
    color: "text-red-700 dark:text-red-400",
    bg: "bg-red-100 dark:bg-red-900/30",
    icon: XCircle,
  },
  expired: {
    label: "Expired",
    color: "text-gray-700 dark:text-gray-400",
    bg: "bg-gray-100 dark:bg-gray-800",
    icon: AlertTriangle,
  },
};

const DOC_LABELS: Record<string, string> = {
  national_id: "National ID",
  passport: "Passport",
  drivers_license: "Driver's License",
  voters_card: "Voter's Card",
};

export default function AdminKycPage() {
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [detailId, setDetailId] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [bulkRejectReason, setBulkRejectReason] = useState("");
  const [showBulkRejectModal, setShowBulkRejectModal] = useState(false);
  const [manualVerifyUserId, setManualVerifyUserId] = useState<string | null>(null);
  const [manualVerifyNotes, setManualVerifyNotes] = useState("");

  const { data: stats, refetch: refetchStats } = api.kyc.getStats.useQuery(undefined, {
    refetchOnWindowFocus: false,
  });

  const { data, isLoading, refetch, isFetching } = api.kyc.listSubmissions.useQuery(
    {
      page,
      pageSize,
      status: (statusFilter || undefined) as any,
      search: search || undefined,
      sortBy: "submittedAt",
      sortOrder: "desc",
    },
    { refetchOnWindowFocus: false, staleTime: 15000 }
  );

  const approveMutation = api.kyc.approveSubmission.useMutation({
    onSuccess: () => {
      toast.success("KYC approved successfully");
      refetch();
      refetchStats();
    },
    onError: (e) => toast.error(e.message),
  });

  const rejectMutation = api.kyc.rejectSubmission.useMutation({
    onSuccess: () => {
      toast.success("KYC rejected");
      refetch();
      refetchStats();
    },
    onError: (e) => toast.error(e.message),
  });

  const markReviewMutation = api.kyc.markUnderReview.useMutation({
    onSuccess: () => {
      toast.success("Marked as under review");
      refetch();
      refetchStats();
    },
    onError: (e) => toast.error(e.message),
  });

  const bulkApproveMutation = api.kyc.bulkApprove.useMutation({
    onSuccess: (data) => {
      toast.success(`${data.approved} submissions approved`);
      setSelectedIds(new Set());
      refetch();
      refetchStats();
    },
    onError: (e) => toast.error(e.message),
  });

  const bulkRejectMutation = api.kyc.bulkReject.useMutation({
    onSuccess: (data) => {
      toast.success(`${data.rejected} submissions rejected`);
      setSelectedIds(new Set());
      setShowBulkRejectModal(false);
      setBulkRejectReason("");
      refetch();
      refetchStats();
    },
    onError: (e) => toast.error(e.message),
  });

  const adminVerifyMutation = api.kyc.adminVerifyUser.useMutation({
    onSuccess: () => {
      toast.success("User manually verified");
      setManualVerifyUserId(null);
      setManualVerifyNotes("");
      refetch();
      refetchStats();
    },
    onError: (e) => toast.error(e.message),
  });

  const submissions = data?.submissions || [];
  const totalPages = data?.totalPages || 1;

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (selectedIds.size === submissions.length) {
      setSelectedIds(new Set());
    } else {
      const ids = submissions.map((s: { id: string }) => s.id);
      setSelectedIds(new Set(ids));
    }
  };

  const columns: ColumnDef<KycSubmission>[] = useMemo(
    () => [
      {
        id: "select",
        header: () => (
          <input
            type="checkbox"
            checked={submissions.length > 0 && selectedIds.size === submissions.length}
            onChange={toggleAll}
            className="rounded border-gray-300 dark:border-gray-600"
          />
        ),
        cell: ({ row }) => (
          <input
            type="checkbox"
            checked={selectedIds.has(row.original.id)}
            onChange={() => toggleSelect(row.original.id)}
            className="rounded border-gray-300 dark:border-gray-600"
          />
        ),
        size: 40,
      },
      {
        id: "user",
        header: "Applicant",
        cell: ({ row }) => {
          const s = row.original;
          return (
            <div className="flex items-center gap-3">
              {s.user.profilePic ? (
                <img src={s.user.profilePic} alt="" className="w-8 h-8 rounded-full object-cover" />
              ) : (
                <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-xs font-bold text-emerald-700 dark:text-emerald-400">
                  {s.legalFirstName[0]}{s.legalLastName[0]}
                </div>
              )}
              <div>
                <p className="font-medium text-sm text-gray-900 dark:text-white">
                  {s.legalFirstName} {s.legalLastName}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{s.user.email}</p>
              </div>
            </div>
          );
        },
      },
      {
        id: "document",
        header: "Document",
        cell: ({ row }) => (
          <div>
            <p className="text-sm text-gray-900 dark:text-white">{DOC_LABELS[row.original.documentType] || row.original.documentType}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 font-mono">{row.original.documentNumber}</p>
          </div>
        ),
      },
      {
        id: "status",
        header: "Status",
        cell: ({ row }) => {
          const cfg = STATUS_CONFIG[row.original.status] || STATUS_CONFIG.pending;
          const Icon = cfg.icon;
          return (
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${cfg.bg} ${cfg.color}`}>
              <Icon className="w-3 h-3" /> {cfg.label}
            </span>
          );
        },
      },
      {
        id: "submitted",
        header: "Submitted",
        cell: ({ row }) => (
          <span className="text-sm text-gray-600 dark:text-gray-400">
            {format(new Date(row.original.submittedAt), "MMM d, yyyy")}
          </span>
        ),
      },
      {
        id: "actions",
        header: "",
        cell: ({ row }) => {
          const s = row.original;
          return (
            <div className="flex items-center gap-1">
              <button
                onClick={() => setDetailId(s.id)}
                className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
                title="View Details"
              >
                <Eye className="w-4 h-4" />
              </button>
              {(s.status === "pending" || s.status === "under_review") && (
                <>
                  <button
                    onClick={() => approveMutation.mutate({ submissionId: s.id })}
                    className="p-1.5 rounded-lg hover:bg-emerald-100 dark:hover:bg-emerald-900/30 text-emerald-600 transition-colors"
                    title="Approve"
                    disabled={approveMutation.isPending}
                  >
                    <Check className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => {
                      const reason = prompt("Rejection reason:");
                      if (reason) rejectMutation.mutate({ submissionId: s.id, rejectionReason: reason });
                    }}
                    className="p-1.5 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 text-red-500 transition-colors"
                    title="Reject"
                    disabled={rejectMutation.isPending}
                  >
                    <X className="w-4 h-4" />
                  </button>
                </>
              )}
              {s.status === "pending" && (
                <button
                  onClick={() => markReviewMutation.mutate({ submissionId: s.id })}
                  className="p-1.5 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 text-blue-500 transition-colors"
                  title="Mark Under Review"
                  disabled={markReviewMutation.isPending}
                >
                  <Eye className="w-4 h-4" />
                </button>
              )}
            </div>
          );
        },
        size: 120,
      },
    ],
    [selectedIds, submissions, approveMutation, rejectMutation, markReviewMutation]
  );

  const table = useReactTable({
    data: submissions as KycSubmission[],
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">KYC Management</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">Identity verification oversight & approvals</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                refetch();
                refetchStats();
              }}
              disabled={isFetching}
              className="p-2 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors"
            >
              <RefreshCw className={`w-4 h-4 text-gray-600 dark:text-gray-400 ${isFetching ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {[
            { label: "Pending", count: stats?.pending || 0, icon: Clock, color: "amber" },
            { label: "Under Review", count: stats?.underReview || 0, icon: Eye, color: "blue" },
            { label: "Approved", count: stats?.approved || 0, icon: CheckCircle2, color: "emerald" },
            { label: "Rejected", count: stats?.rejected || 0, icon: XCircle, color: "red" },
            { label: "Expired", count: stats?.expired || 0, icon: AlertTriangle, color: "gray" },
            { label: "Total", count: stats?.total || 0, icon: Users, color: "purple" },
          ].map((stat) => {
            const Icon = stat.icon;
            return (
              <motion.button
                key={stat.label}
                whileHover={{ y: -2 }}
                onClick={() => {
                  setStatusFilter(stat.label === "Total" ? "" : stat.label.toLowerCase().replace(/ /g, "_"));
                  setPage(1);
                }}
                className={`p-4 rounded-xl border transition-all text-left ${
                  statusFilter === stat.label.toLowerCase().replace(/ /g, "_")
                    ? `bg-${stat.color}-50 dark:bg-${stat.color}-950/30 border-${stat.color}-300 dark:border-${stat.color}-700 ring-2 ring-${stat.color}-500/20`
                    : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <Icon className={`w-4 h-4 text-${stat.color}-500`} />
                  <span className="text-xl font-bold text-gray-900 dark:text-white">{stat.count}</span>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400">{stat.label}</p>
              </motion.button>
            );
          })}
        </div>

        {/* Search & Filters Bar */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                placeholder="Search by name, email, document number, BVN, NIN..."
                className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            >
              <option value="">All Status</option>
              <option value="pending">Pending</option>
              <option value="under_review">Under Review</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
              <option value="expired">Expired</option>
            </select>
          </div>
        </div>

        {/* Bulk Actions Bar */}
        <AnimatePresence>
          {selectedIds.size > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/50 rounded-xl p-3 flex items-center justify-between"
            >
              <span className="text-sm font-medium text-emerald-800 dark:text-emerald-300">
                {selectedIds.size} submission{selectedIds.size > 1 ? "s" : ""} selected
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => bulkApproveMutation.mutate({ submissionIds: Array.from(selectedIds) })}
                  disabled={bulkApproveMutation.isPending}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition-colors disabled:opacity-50"
                >
                  {bulkApproveMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
                  Bulk Approve
                </button>
                <button
                  onClick={() => setShowBulkRejectModal(true)}
                  disabled={bulkRejectMutation.isPending}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors disabled:opacity-50"
                >
                  <X className="w-3 h-3" /> Bulk Reject
                </button>
                <button
                  onClick={() => setSelectedIds(new Set())}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                >
                  Clear
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Table */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
            </div>
          ) : submissions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4">
                <FileText className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">No submissions found</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {search || statusFilter ? "Try adjusting your filters" : "No KYC submissions yet"}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  {table.getHeaderGroups().map((hg) => (
                    <tr key={hg.id} className="border-b border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/50">
                      {hg.headers.map((header) => (
                        <th
                          key={header.id}
                          className="text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider px-4 py-3"
                          style={{ width: header.getSize() }}
                        >
                          {flexRender(header.column.columnDef.header, header.getContext())}
                        </th>
                      ))}
                    </tr>
                  ))}
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700/50">
                  {table.getRowModel().rows.map((row) => (
                    <motion.tr
                      key={row.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors cursor-pointer"
                      onClick={(e) => {
                        // Don't open detail if clicking checkboxes or action buttons
                        if ((e.target as HTMLElement).closest("input, button")) return;
                        setDetailId(row.original.id);
                      }}
                    >
                      {row.getVisibleCells().map((cell) => (
                        <td key={cell.id} className="px-4 py-3">
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </td>
                      ))}
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {(data?.totalPages || 0) > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 dark:border-gray-700">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Showing {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, data?.total || 0)} of {data?.total || 0}
              </p>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-30 transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="px-3 py-1 text-sm font-medium text-gray-700 dark:text-gray-300">
                  {page} / {totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-30 transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Manual Verify Button */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
            <UserCheck className="w-4 h-4 text-emerald-500" />
            Manual Verification
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
            Manually mark any user as KYC verified without requiring document submission.
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              value={manualVerifyUserId || ""}
              onChange={(e) => setManualVerifyUserId(e.target.value)}
              placeholder="Enter User ID"
              className="flex-1 px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            />
            <input
              type="text"
              value={manualVerifyNotes}
              onChange={(e) => setManualVerifyNotes(e.target.value)}
              placeholder="Admin notes (optional)"
              className="flex-1 px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            />
            <button
              onClick={() => {
                if (!manualVerifyUserId?.trim()) {
                  toast.error("Please enter a User ID");
                  return;
                }
                adminVerifyMutation.mutate({
                  userId: manualVerifyUserId.trim(),
                  adminNotes: manualVerifyNotes || undefined,
                });
              }}
              disabled={adminVerifyMutation.isPending || !manualVerifyUserId}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 transition-colors disabled:opacity-50"
            >
              {adminVerifyMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <BadgeCheck className="w-4 h-4" />}
              Verify User
            </button>
          </div>
        </div>
      </div>

      {/* Detail Modal */}
      {detailId && (
        <KycDetailModal
          submissionId={detailId}
          onClose={() => setDetailId(null)}
          onActionComplete={() => {
            refetch();
            refetchStats();
          }}
        />
      )}

      {/* Bulk Reject Modal */}
      <AnimatePresence>
        {showBulkRejectModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
            onClick={() => setShowBulkRejectModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 max-w-md w-full shadow-2xl"
            >
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Bulk Reject</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                Rejecting {selectedIds.size} submission{selectedIds.size > 1 ? "s" : ""}. Provide a reason:
              </p>
              <textarea
                value={bulkRejectReason}
                onChange={(e) => setBulkRejectReason(e.target.value)}
                rows={3}
                placeholder="Rejection reason..."
                className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 resize-none"
              />
              <div className="flex justify-end gap-3 mt-4">
                <button
                  onClick={() => setShowBulkRejectModal(false)}
                  className="px-4 py-2 text-sm rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    if (!bulkRejectReason.trim()) {
                      toast.error("Rejection reason is required");
                      return;
                    }
                    bulkRejectMutation.mutate({
                      submissionIds: Array.from(selectedIds),
                      rejectionReason: bulkRejectReason,
                    });
                  }}
                  disabled={bulkRejectMutation.isPending}
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors disabled:opacity-50"
                >
                  {bulkRejectMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
                  Reject All
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
