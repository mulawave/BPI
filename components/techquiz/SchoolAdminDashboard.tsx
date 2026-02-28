"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { api } from "@/client/trpc";
import { Building2, Users, CheckCircle, XCircle, Clock, BarChart3, ChevronRight, AlertCircle, RefreshCcw } from "lucide-react";
import toast from "react-hot-toast";

const statusColors: Record<string, string> = {
  SLOT_RESERVED: "bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-300 border border-amber-200 dark:border-amber-700",
  VERIFIED: "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-700",
  REJECTED: "bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-300 border border-red-200 dark:border-red-700",
  ROUND1_ELIGIBLE: "bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300 border border-blue-200 dark:border-blue-700",
  QUALIFIER: "bg-violet-50 text-violet-700 dark:bg-violet-900/20 dark:text-violet-300 border border-violet-200 dark:border-violet-700",
  ROUND2_ELIGIBLE: "bg-indigo-50 text-indigo-700 dark:bg-indigo-900/20 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-700",
};

function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${statusColors[status] ?? "bg-slate-100 text-slate-600"}`}>
      {status.replace(/_/g, " ")}
    </span>
  );
}

function QuotaBar({ used, min, max }: { used: number; min: number; max: number }) {
  const pct = Math.min(100, Math.round((used / max) * 100));
  const hasMin = used >= min;
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="text-slate-500 dark:text-slate-400">Quota Progress</span>
        <span className="font-semibold text-slate-700 dark:text-slate-200">{used} / {max} slots</span>
      </div>
      <div className="h-2 rounded-full bg-slate-100 dark:bg-slate-700 overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className={`h-full rounded-full ${pct >= 100 ? "bg-red-500" : hasMin ? "bg-emerald-500" : "bg-amber-400"}`}
        />
      </div>
      <div className="flex justify-between text-[10px] text-slate-400">
        <span>Min: {min}</span>
        <span className={hasMin ? "text-emerald-600 font-semibold" : "text-amber-500 font-semibold"}>
          {hasMin ? "✓ Minimum met" : `Need ${min - used} more`}
        </span>
        <span>Max: {max}</span>
      </div>
    </div>
  );
}

function RejectModal({
  name,
  onConfirm,
  onClose,
}: {
  name: string;
  onConfirm: (reason: string) => void;
  onClose: () => void;
}) {
  const [reason, setReason] = useState("");
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-md border border-slate-200 dark:border-slate-700 p-6"
      >
        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">Reject Candidate</h3>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">Rejecting <strong className="text-slate-700 dark:text-slate-200">{name}</strong>. Their slot will be released.</p>
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Reason for rejection (optional)..."
          rows={3}
          className="w-full text-sm px-3 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-white placeholder-slate-400 focus:outline-none focus:border-red-400 resize-none"
        />
        <div className="flex gap-3 mt-4 justify-end">
          <button onClick={onClose} className="px-4 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition">
            Cancel
          </button>
          <button
            onClick={() => onConfirm(reason)}
            className="px-4 py-2 text-sm rounded-lg bg-red-500 hover:bg-red-600 text-white font-semibold transition"
          >
            Confirm Reject
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default function SchoolAdminDashboard() {
  const [selectedEventId, setSelectedEventId] = useState<string>("");
  const [page, setPage] = useState(1);
  const [rejectTarget, setRejectTarget] = useState<{ id: string; name: string } | null>(null);

  const profileQuery = api.techquiz.getSchoolAdminProfile.useQuery();
  const profile = profileQuery.data;

  // Admin event list to let school admin select which event to view
  const eventsQuery = api.techquiz.adminListEvents.useQuery(
    { page: 1, perPage: 50, status: "PUBLISHED" },
    { enabled: !!profile }
  );

  const candidatesQuery = api.techquiz.schoolDashboardApplications.useQuery(
    { eventId: selectedEventId, page, perPage: 20 },
    { enabled: !!selectedEventId && !!profile }
  );

  const verifyMutation = api.techquiz.verifyCandidate.useMutation({
    onSuccess: (_, vars) => {
      toast.success(vars.decision === "APPROVE" ? "Candidate approved!" : "Candidate rejected.");
      candidatesQuery.refetch();
      setRejectTarget(null);
    },
    onError: (e) => toast.error(e.message),
  });

  if (profileQuery.isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <AlertCircle className="w-12 h-12 text-slate-300" />
        <p className="text-slate-500 dark:text-slate-400 text-center">
          No school admin profile found for your account.<br />
          Contact BPI Admin to be assigned to a school.
        </p>
      </div>
    );
  }

  const events = eventsQuery.data?.events ?? [];
  const applications = candidatesQuery.data?.applications ?? [];
  const total = candidatesQuery.data?.total ?? 0;
  const quotaInfo = candidatesQuery.data?.quotaInfo;
  const totalPages = Math.max(1, Math.ceil(total / 20));

  const pendingCount = applications.filter((a) => a.status === "SLOT_RESERVED").length;
  const verifiedCount = applications.filter((a) => a.status === "VERIFIED").length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">School Admin Dashboard</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-1.5">
            <Building2 size={14} />
            {profile.school?.name ?? "—"} · {profile.school?.state ?? ""}
          </p>
        </div>
        <button
          onClick={() => { candidatesQuery.refetch(); eventsQuery.refetch(); }}
          className="flex items-center gap-1.5 px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition"
        >
          <RefreshCcw size={13} /> Refresh
        </button>
      </div>

      {/* Event selector */}
      <div className="bg-white dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700 p-5">
        <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide mb-2">
          Select Event to Manage
        </label>
        <select
          value={selectedEventId}
          onChange={(e) => { setSelectedEventId(e.target.value); setPage(1); }}
          className="w-full max-w-sm px-3 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-slate-800 dark:text-white focus:outline-none focus:border-emerald-500"
        >
          <option value="">Choose a published event...</option>
          {events.map((ev) => (
            <option key={ev.id} value={ev.id}>{ev.title} · {ev.state}</option>
          ))}
        </select>
      </div>

      {selectedEventId && (
        <>
          {/* Quota stats */}
          {quotaInfo && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="grid grid-cols-2 md:grid-cols-4 gap-4"
            >
              {[
                { label: "Pending Review", value: pendingCount, icon: Clock, color: "text-amber-600" },
                { label: "Verified", value: verifiedCount, icon: CheckCircle, color: "text-emerald-600" },
                { label: "Total Applications", value: total, icon: Users, color: "text-blue-600" },
                { label: "Quota Status", value: quotaInfo.participationStatus.replace(/_/g, " "), icon: BarChart3, color: "text-violet-600" },
              ].map((stat) => (
                <div key={stat.label} className="bg-white dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
                  <stat.icon size={16} className={`${stat.color} mb-2`} />
                  <div className="text-xl font-bold text-slate-900 dark:text-white">{stat.value}</div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">{stat.label}</div>
                </div>
              ))}
            </motion.div>
          )}

          {/* Quota bar */}
          {quotaInfo && (
            <div className="bg-white dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700 p-5">
              <QuotaBar used={quotaInfo.enrolledCount} min={quotaInfo.minStudents} max={quotaInfo.maxStudents} />
            </div>
          )}

          {/* Applications table */}
          <div className="bg-white dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
            <div className="p-5 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
              <h2 className="font-semibold text-slate-900 dark:text-white">Registered Candidates</h2>
              <span className="text-sm text-slate-500 dark:text-slate-400">{total} total</span>
            </div>

            {candidatesQuery.isLoading ? (
              <div className="flex justify-center py-12">
                <div className="w-7 h-7 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : applications.length === 0 ? (
              <div className="py-12 text-center text-slate-400 dark:text-slate-500">
                No candidates registered for this event yet.
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-700">
                <AnimatePresence initial={false}>
                  {applications.map((app, i) => (
                    <motion.div
                      key={app.id}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.03 }}
                      className="flex items-center gap-4 px-5 py-4 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition"
                    >
                      <div className="w-9 h-9 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-sm font-bold text-emerald-700 dark:text-emerald-300 flex-shrink-0">
                        {(app.childBeneficiary?.childName ?? "?")[0].toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-slate-800 dark:text-white text-sm truncate">
                          {app.childBeneficiary?.childName ?? "Unknown"}
                        </p>
                        <p className="text-xs text-slate-400 dark:text-slate-500 truncate">
                          Parent: {app.parent?.name ?? "—"} · {app.parent?.email ?? ""}
                        </p>
                      </div>
                      <StatusBadge status={app.status} />
                      {app.status === "SLOT_RESERVED" && (
                        <div className="flex gap-2">
                          <button
                            onClick={() =>
                              verifyMutation.mutate({ applicationId: app.id, decision: "APPROVE" })
                            }
                            disabled={verifyMutation.isPending}
                            className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white transition disabled:opacity-50"
                          >
                            <CheckCircle size={11} /> Approve
                          </button>
                          <button
                            onClick={() =>
                              setRejectTarget({ id: app.id, name: app.childBeneficiary?.childName ?? "Candidate" })
                            }
                            disabled={verifyMutation.isPending}
                            className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-700 transition disabled:opacity-50"
                          >
                            <XCircle size={11} /> Reject
                          </button>
                        </div>
                      )}
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-5 py-3 border-t border-slate-100 dark:border-slate-700">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="text-sm px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition disabled:opacity-40"
                >
                  Previous
                </button>
                <span className="text-sm text-slate-500">Page {page} of {totalPages}</span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="text-sm px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition disabled:opacity-40 flex items-center gap-1"
                >
                  Next <ChevronRight size={13} />
                </button>
              </div>
            )}
          </div>
        </>
      )}

      {/* Reject modal */}
      <AnimatePresence>
        {rejectTarget && (
          <RejectModal
            name={rejectTarget.name}
            onConfirm={(reason) =>
              verifyMutation.mutate({
                applicationId: rejectTarget.id,
                decision: "REJECT",
                rejectionReason: reason || undefined,
              })
            }
            onClose={() => setRejectTarget(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
