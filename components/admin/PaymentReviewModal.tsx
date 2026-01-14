"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { api } from "@/client/trpc";
import { MdClose, MdCheckCircle, MdCancel, MdSave } from "react-icons/md";
import toast from "react-hot-toast";

interface PaymentReviewModalProps {
  paymentId: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function PaymentReviewModal({
  paymentId,
  isOpen,
  onClose,
  onSuccess,
}: PaymentReviewModalProps) {
  const [action, setAction] = useState<"approve" | "reject">("approve");
  const [notes, setNotes] = useState("");

  const reviewMutation = api.admin.reviewPayment.useMutation({
    onSuccess: () => {
      toast.success(`Payment ${action === "approve" ? "approved" : "rejected"} successfully`);
      onSuccess();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const handleSubmit = () => {
    if (action === "reject" && !notes.trim()) {
      toast.error("Please provide a reason for rejection");
      return;
    }

    reviewMutation.mutate({
      paymentId,
      action,
      notes: notes.trim() || undefined,
    });
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden">
              {/* Header */}
              <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Review Payment
                </h2>
                <button
                  onClick={onClose}
                  className="p-2 text-gray-600 hover:text-red-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-red-400 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <MdClose size={24} />
                </button>
              </div>

              {/* Content */}
              <div className="p-6 space-y-6">
                {/* Action Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                    Decision
                  </label>
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      onClick={() => setAction("approve")}
                      className={`p-4 rounded-xl border-2 transition-all ${
                        action === "approve"
                          ? "border-green-500 bg-green-50 dark:bg-green-900/20"
                          : "border-gray-200 dark:border-gray-700 hover:border-green-300"
                      }`}
                    >
                      <div className="flex flex-col items-center gap-2">
                        <MdCheckCircle
                          size={32}
                          className={
                            action === "approve"
                              ? "text-green-600"
                              : "text-gray-400"
                          }
                        />
                        <span
                          className={`font-medium ${
                            action === "approve"
                              ? "text-green-900 dark:text-green-100"
                              : "text-gray-700 dark:text-gray-300"
                          }`}
                        >
                          Approve Payment
                        </span>
                        <span className="text-xs text-gray-600 dark:text-gray-400">
                          Credit user wallet
                        </span>
                      </div>
                    </button>

                    <button
                      onClick={() => setAction("reject")}
                      className={`p-4 rounded-xl border-2 transition-all ${
                        action === "reject"
                          ? "border-red-500 bg-red-50 dark:bg-red-900/20"
                          : "border-gray-200 dark:border-gray-700 hover:border-red-300"
                      }`}
                    >
                      <div className="flex flex-col items-center gap-2">
                        <MdCancel
                          size={32}
                          className={
                            action === "reject" ? "text-red-600" : "text-gray-400"
                          }
                        />
                        <span
                          className={`font-medium ${
                            action === "reject"
                              ? "text-red-900 dark:text-red-100"
                              : "text-gray-700 dark:text-gray-300"
                          }`}
                        >
                          Reject Payment
                        </span>
                        <span className="text-xs text-gray-600 dark:text-gray-400">
                          Decline transaction
                        </span>
                      </div>
                    </button>
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {action === "reject" ? "Reason for Rejection *" : "Notes (Optional)"}
                  </label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={4}
                    placeholder={
                      action === "reject"
                        ? "Please provide a clear reason for rejecting this payment..."
                        : "Add any notes or comments about this payment..."
                    }
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
                  />
                  <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                    {action === "reject"
                      ? "This reason will be saved and may be shared with the user."
                      : "These notes are for internal record-keeping only."}
                  </p>
                </div>

                {/* Warning */}
                {action === "approve" && (
                  <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-4">
                    <div className="flex gap-3">
                      <MdCheckCircle className="text-green-600 flex-shrink-0 mt-0.5" size={20} />
                      <div className="text-sm text-green-900 dark:text-green-100">
                        <p className="font-medium mb-1">Approving this payment will:</p>
                        <ul className="list-disc list-inside space-y-1 text-green-800 dark:text-green-200">
                          <li>Credit the amount to the user's wallet</li>
                          <li>Mark the payment as approved</li>
                          <li>Log this action in the audit trail</li>
                          <li>This action cannot be undone</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                )}

                {action === "reject" && (
                  <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4">
                    <div className="flex gap-3">
                      <MdCancel className="text-red-600 flex-shrink-0 mt-0.5" size={20} />
                      <div className="text-sm text-red-900 dark:text-red-100">
                        <p className="font-medium mb-1">Rejecting this payment will:</p>
                        <ul className="list-disc list-inside space-y-1 text-red-800 dark:text-red-200">
                          <li>Mark the payment as rejected</li>
                          <li>No funds will be credited</li>
                          <li>Log this action with your provided reason</li>
                          <li>This action cannot be undone</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-end gap-3">
                <button
                  onClick={onClose}
                  className="px-6 py-2 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={reviewMutation.isPending}
                  className={`px-6 py-2 text-white rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed ${
                    action === "approve"
                      ? "bg-green-600 hover:bg-green-700"
                      : "bg-red-600 hover:bg-red-700"
                  }`}
                >
                  {action === "approve" ? (
                    <MdCheckCircle size={20} />
                  ) : (
                    <MdCancel size={20} />
                  )}
                  {reviewMutation.isPending
                    ? "Processing..."
                    : action === "approve"
                    ? "Approve Payment"
                    : "Reject Payment"}
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
