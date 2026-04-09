"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { api } from "@/client/trpc";
import toast from "react-hot-toast";
import {
  X, CheckCircle2, XCircle, Clock, Eye, Shield, FileText,
  User, MapPin, Camera, AlertTriangle, Loader2, BadgeCheck,
  Calendar, Globe, Hash, CreditCard, Download, ExternalLink,
  ChevronDown, ChevronUp,
} from "lucide-react";
import { format } from "date-fns";

interface KycDetailModalProps {
  submissionId: string;
  onClose: () => void;
  onActionComplete: () => void;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; icon: typeof Clock }> = {
  pending: { label: "Pending Review", color: "text-amber-700 dark:text-amber-400", bg: "bg-amber-100 dark:bg-amber-900/30", icon: Clock },
  under_review: { label: "Under Review", color: "text-blue-700 dark:text-blue-400", bg: "bg-blue-100 dark:bg-blue-900/30", icon: Eye },
  approved: { label: "Approved", color: "text-emerald-700 dark:text-emerald-400", bg: "bg-emerald-100 dark:bg-emerald-900/30", icon: CheckCircle2 },
  rejected: { label: "Rejected", color: "text-red-700 dark:text-red-400", bg: "bg-red-100 dark:bg-red-900/30", icon: XCircle },
  expired: { label: "Expired", color: "text-gray-700 dark:text-gray-400", bg: "bg-gray-100 dark:bg-gray-800", icon: AlertTriangle },
};

const DOC_LABELS: Record<string, string> = {
  national_id: "National ID Card",
  passport: "International Passport",
  drivers_license: "Driver's License",
  voters_card: "Voter's Card",
};

const ACTION_LABELS: Record<string, { label: string; color: string }> = {
  submitted: { label: "Submitted", color: "text-blue-600" },
  approved: { label: "Approved", color: "text-emerald-600" },
  rejected: { label: "Rejected", color: "text-red-600" },
  marked_under_review: { label: "Marked Under Review", color: "text-blue-600" },
  admin_override: { label: "Admin Override", color: "text-purple-600" },
  expired: { label: "Expired", color: "text-gray-600" },
  resubmitted: { label: "Resubmitted", color: "text-amber-600" },
};

export default function KycDetailModal({ submissionId, onClose, onActionComplete }: KycDetailModalProps) {
  const [activeTab, setActiveTab] = useState<"details" | "documents" | "audit">("details");
  const [rejectReason, setRejectReason] = useState("");
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [expandedImage, setExpandedImage] = useState<string | null>(null);

  const { data: submission, isLoading } = api.kyc.getSubmissionDetail.useQuery(
    { submissionId },
    { refetchOnWindowFocus: false }
  );

  const approveMutation = api.kyc.approveSubmission.useMutation({
    onSuccess: () => {
      toast.success("KYC approved successfully");
      onActionComplete();
      onClose();
    },
    onError: (e) => toast.error(e.message),
  });

  const rejectMutation = api.kyc.rejectSubmission.useMutation({
    onSuccess: () => {
      toast.success("KYC rejected");
      onActionComplete();
      onClose();
    },
    onError: (e) => toast.error(e.message),
  });

  const markReviewMutation = api.kyc.markUnderReview.useMutation({
    onSuccess: () => {
      toast.success("Marked as under review");
      onActionComplete();
    },
    onError: (e) => toast.error(e.message),
  });

  const cfg = STATUS_CONFIG[submission?.status || "pending"] || STATUS_CONFIG.pending;
  const StatusIcon = cfg.icon;

  const canTakeAction = submission?.status === "pending" || submission?.status === "under_review";

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 backdrop-blur-sm overflow-y-auto py-8 px-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, y: 40, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 40, scale: 0.97 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 w-full max-w-4xl shadow-2xl"
        >
          {isLoading || !submission ? (
            <div className="flex items-center justify-center py-24">
              <Loader2 className="w-10 h-10 animate-spin text-emerald-500" />
            </div>
          ) : (
            <>
              {/* Header */}
              <div className="flex items-start justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-4">
                  {(submission as any).user?.profilePic ? (
                    <img
                      src={(submission as any).user.profilePic}
                      alt=""
                      className="w-14 h-14 rounded-full object-cover border-2 border-gray-200 dark:border-gray-700"
                    />
                  ) : (
                    <div className="w-14 h-14 rounded-full bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center text-lg font-bold text-white">
                      {submission.legalFirstName[0]}{submission.legalLastName[0]}
                    </div>
                  )}
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                      {submission.legalFirstName} {submission.legalLastName}
                    </h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {(submission as any).user?.email || "—"}
                    </p>
                    <span className={`mt-1 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${cfg.bg} ${cfg.color}`}>
                      <StatusIcon className="w-3 h-3" /> {cfg.label}
                    </span>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              {/* Tabs */}
              <div className="flex border-b border-gray-200 dark:border-gray-700 px-6">
                {[
                  { id: "details" as const, label: "Personal Details", icon: User },
                  { id: "documents" as const, label: "Documents", icon: FileText },
                  { id: "audit" as const, label: "Audit Trail", icon: Shield },
                ].map((tab) => {
                  const TabIcon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors -mb-px ${
                        activeTab === tab.id
                          ? "border-emerald-500 text-emerald-600 dark:text-emerald-400"
                          : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                      }`}
                    >
                      <TabIcon className="w-4 h-4" /> {tab.label}
                    </button>
                  );
                })}
              </div>

              {/* Tab Content */}
              <div className="p-6 max-h-[60vh] overflow-y-auto">
                {activeTab === "details" && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Personal Info */}
                    <div className="space-y-4">
                      <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                        <User className="w-4 h-4 text-emerald-500" /> Personal Information
                      </h3>
                      <div className="space-y-3">
                        <DetailRow label="Legal Name" value={`${submission.legalFirstName} ${submission.legalLastName}`} />
                        <DetailRow label="Date of Birth" value={submission.dateOfBirth ? format(new Date(submission.dateOfBirth), "MMMM d, yyyy") : "—"} />
                        <DetailRow label="Nationality" value={submission.nationality || "—"} />
                        <DetailRow label="Gender" value={submission.gender ? submission.gender.charAt(0).toUpperCase() + submission.gender.slice(1) : "—"} />
                        <DetailRow label="BVN" value={submission.bvn ? `****${submission.bvn.slice(-4)}` : "Not provided"} />
                        <DetailRow label="NIN" value={submission.nin ? `****${submission.nin.slice(-4)}` : "Not provided"} />
                      </div>
                    </div>

                    {/* Address */}
                    <div className="space-y-4">
                      <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-emerald-500" /> Residential Address
                      </h3>
                      <div className="space-y-3">
                        <DetailRow label="Street" value={submission.residentialAddress || "—"} />
                        <DetailRow label="City" value={submission.residentialCity || "—"} />
                        <DetailRow label="State" value={submission.residentialState || "—"} />
                        <DetailRow label="Country" value={submission.residentialCountry || "—"} />
                        <DetailRow label="Postal Code" value={submission.residentialZip || "—"} />
                      </div>
                    </div>

                    {/* Document Info */}
                    <div className="space-y-4">
                      <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                        <CreditCard className="w-4 h-4 text-emerald-500" /> Identity Document
                      </h3>
                      <div className="space-y-3">
                        <DetailRow label="Type" value={DOC_LABELS[submission.documentType] || submission.documentType} />
                        <DetailRow label="Number" value={submission.documentNumber} />
                        <DetailRow
                          label="Expiry Date"
                          value={submission.documentExpiryDate ? format(new Date(submission.documentExpiryDate), "MMMM d, yyyy") : "—"}
                        />
                        {submission.expiresAt && (
                          <DetailRow
                            label="KYC Expires"
                            value={format(new Date(submission.expiresAt), "MMMM d, yyyy")}
                            highlight={new Date(submission.expiresAt) < new Date()}
                          />
                        )}
                      </div>
                    </div>

                    {/* Selfie/Biometric */}
                    <div className="space-y-4">
                      <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                        <Camera className="w-4 h-4 text-emerald-500" /> Biometric Verification
                      </h3>
                      <div className="space-y-3">
                        <DetailRow label="Selfie" value={submission.selfieUrl ? "Captured" : "Not provided"} />
                        <DetailRow
                          label="Liveness Check"
                          value={submission.livenessCheckPassed ? "Passed" : "Not verified"}
                        />
                      </div>
                    </div>

                    {/* Timestamps */}
                    <div className="space-y-4 md:col-span-2">
                      <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-emerald-500" /> Timeline
                      </h3>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        <DetailRow label="Submitted" value={format(new Date(submission.submittedAt), "MMM d, yyyy h:mm a")} />
                        <DetailRow
                          label="Reviewed"
                          value={submission.reviewedAt ? format(new Date(submission.reviewedAt), "MMM d, yyyy h:mm a") : "Pending"}
                        />
                        <DetailRow
                          label="Reviewer"
                          value={(submission as any).reviewer?.name || (submission as any).reviewer?.email || "—"}
                        />
                        {submission.rejectionReason && (
                          <div className="md:col-span-4 p-3 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800/50">
                            <p className="text-xs font-semibold text-red-700 dark:text-red-400 mb-1">Rejection Reason:</p>
                            <p className="text-sm text-red-600 dark:text-red-300">{submission.rejectionReason}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === "documents" && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Document Front */}
                      <DocumentCard
                        label="Document Front"
                        url={submission.documentFrontUrl}
                        onExpand={setExpandedImage}
                      />
                      {/* Document Back */}
                      <DocumentCard
                        label="Document Back"
                        url={submission.documentBackUrl}
                        onExpand={setExpandedImage}
                      />
                      {/* Selfie */}
                      <DocumentCard
                        label="Selfie / Photo"
                        url={submission.selfieUrl}
                        onExpand={setExpandedImage}
                      />
                      {/* Proof of Address */}
                      <DocumentCard
                        label="Proof of Address"
                        url={submission.proofOfAddressUrl}
                        sublabel={submission.proofOfAddressType ? `Type: ${submission.proofOfAddressType}` : undefined}
                        onExpand={setExpandedImage}
                      />
                    </div>
                  </div>
                )}

                {activeTab === "audit" && (
                  <div className="space-y-4">
                    {(submission as any).auditLogs?.length > 0 ? (
                      <div className="relative">
                        <div className="absolute left-4 top-0 bottom-0 w-px bg-gray-200 dark:bg-gray-700" />
                        <div className="space-y-4">
                          {((submission as any).auditLogs as any[]).map((log: any, i: number) => {
                            const actionCfg = ACTION_LABELS[log.action] || { label: log.action, color: "text-gray-600" };
                            return (
                              <div key={i} className="relative flex items-start gap-4 pl-8">
                                <div className="absolute left-2.5 top-1.5 w-3 h-3 rounded-full bg-white dark:bg-gray-900 border-2 border-gray-300 dark:border-gray-600" />
                                <div className="flex-1 bg-gray-50 dark:bg-gray-800 rounded-xl p-4 border border-gray-100 dark:border-gray-700">
                                  <div className="flex items-center justify-between mb-1">
                                    <span className={`text-sm font-semibold ${actionCfg.color}`}>{actionCfg.label}</span>
                                    <span className="text-xs text-gray-400">
                                      {format(new Date(log.createdAt), "MMM d, yyyy h:mm a")}
                                    </span>
                                  </div>
                                  <p className="text-xs text-gray-500 dark:text-gray-400">
                                    By: {log.performedByRole === "system" ? "System" : log.performedBy || "Unknown"}
                                  </p>
                                  {log.details && (
                                    <p className="text-xs text-gray-600 dark:text-gray-300 mt-1">{log.details}</p>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-12 text-gray-400">
                        <Shield className="w-10 h-10 mx-auto mb-3 opacity-50" />
                        <p className="text-sm">No audit trail entries yet</p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Action Bar */}
              {canTakeAction && (
                <div className="p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50 rounded-b-2xl">
                  {showRejectForm ? (
                    <div className="space-y-3">
                      <textarea
                        value={rejectReason}
                        onChange={(e) => setRejectReason(e.target.value)}
                        rows={3}
                        placeholder="Please provide a reason for rejection..."
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-900 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 resize-none"
                      />
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => {
                            setShowRejectForm(false);
                            setRejectReason("");
                          }}
                          className="px-4 py-2 text-sm rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => {
                            if (!rejectReason.trim()) {
                              toast.error("Please provide a rejection reason");
                              return;
                            }
                            rejectMutation.mutate({ submissionId, rejectionReason: rejectReason });
                          }}
                          disabled={rejectMutation.isPending}
                          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors disabled:opacity-50"
                        >
                          {rejectMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
                          Confirm Rejection
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {submission.status === "pending" && (
                          <button
                            onClick={() => markReviewMutation.mutate({ submissionId })}
                            disabled={markReviewMutation.isPending}
                            className="inline-flex items-center gap-2 px-4 py-2 text-sm rounded-lg bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors font-medium disabled:opacity-50"
                          >
                            {markReviewMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Eye className="w-4 h-4" />}
                            Mark Under Review
                          </button>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setShowRejectForm(true)}
                          className="inline-flex items-center gap-2 px-4 py-2 text-sm rounded-lg bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors font-medium"
                        >
                          <XCircle className="w-4 h-4" /> Reject
                        </button>
                        <button
                          onClick={() => approveMutation.mutate({ submissionId })}
                          disabled={approveMutation.isPending}
                          className="inline-flex items-center gap-2 px-5 py-2 text-sm font-semibold rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition-colors disabled:opacity-50 shadow-lg shadow-emerald-500/20"
                        >
                          {approveMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                          Approve
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </motion.div>

        {/* Expanded Image Overlay */}
        <AnimatePresence>
          {expandedImage && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 p-8"
              onClick={() => setExpandedImage(null)}
            >
              <motion.img
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0.8 }}
                src={expandedImage}
                alt="Document"
                className="max-w-full max-h-full rounded-xl shadow-2xl"
                onClick={(e) => e.stopPropagation()}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </AnimatePresence>
  );
}

function DetailRow({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div>
      <p className="text-xs font-medium text-gray-400 dark:text-gray-500 mb-0.5">{label}</p>
      <p className={`text-sm font-medium ${highlight ? "text-red-600 dark:text-red-400" : "text-gray-900 dark:text-white"}`}>
        {value}
      </p>
    </div>
  );
}

function DocumentCard({
  label,
  url,
  sublabel,
  onExpand,
}: {
  label: string;
  url: string | null;
  sublabel?: string;
  onExpand: (url: string) => void;
}) {
  if (!url) {
    return (
      <div className="rounded-xl border border-gray-200 dark:border-gray-700 p-6 flex flex-col items-center justify-center text-center bg-gray-50 dark:bg-gray-800/50">
        <FileText className="w-10 h-10 text-gray-300 dark:text-gray-600 mb-2" />
        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{label}</p>
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Not uploaded</p>
      </div>
    );
  }

  const isPdf = url.toLowerCase().endsWith(".pdf");

  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden group">
      <div className="p-3 bg-gray-50 dark:bg-gray-800 flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-900 dark:text-white">{label}</p>
          {sublabel && <p className="text-xs text-gray-400">{sublabel}</p>}
        </div>
        <div className="flex items-center gap-1">
          {!isPdf && (
            <button
              onClick={() => onExpand(url)}
              className="p-1.5 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-500 transition-colors"
              title="Expand"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          )}
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="p-1.5 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-500 transition-colors"
            title="Open in new tab"
          >
            <Download className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>
      {isPdf ? (
        <div className="h-48 flex items-center justify-center bg-gray-100 dark:bg-gray-900">
          <div className="text-center">
            <FileText className="w-12 h-12 text-gray-400 mx-auto mb-2" />
            <p className="text-xs text-gray-500">PDF Document</p>
          </div>
        </div>
      ) : (
        <div
          className="relative h-48 overflow-hidden cursor-pointer"
          onClick={() => onExpand(url)}
        >
          <img
            src={url}
            alt={label}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        </div>
      )}
    </div>
  );
}
