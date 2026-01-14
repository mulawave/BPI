"use client";

import { motion, AnimatePresence } from "framer-motion";
import { api } from "@/client/trpc";
import {
  MdClose,
  MdPerson,
  MdEmail,
  MdAttachMoney,
  MdReceipt,
  MdEvent,
  MdInfo,
  MdImage,
  MdCheckCircle,
  MdCancel,
  MdAccountBalanceWallet,
} from "react-icons/md";
import { format } from "date-fns";
import Image from "next/image";

interface PaymentDetailsModalProps {
  paymentId: string;
  isOpen: boolean;
  onClose: () => void;
  onReview: () => void;
}

export default function PaymentDetailsModal({
  paymentId,
  isOpen,
  onClose,
  onReview,
}: PaymentDetailsModalProps) {
  const { data: payment, isLoading } = api.admin.getPaymentById.useQuery(
    { paymentId },
    { enabled: isOpen && !!paymentId }
  );

  if (!isOpen) return null;

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300";
      case "approved":
        return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300";
      case "rejected":
        return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300";
    }
  };

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
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
              {/* Header */}
              <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                    Payment Details
                  </h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    Reference: {payment?.gatewayReference || "N/A"}
                  </p>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 text-gray-600 hover:text-red-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-red-400 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <MdClose size={24} />
                </button>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-6">
                {isLoading ? (
                  <div className="flex items-center justify-center h-64">
                    <div className="w-12 h-12 border-4 border-green-600 border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : payment ? (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Left Column - Transaction Info */}
                    <div className="space-y-6">
                      {/* Amount Card */}
                      <div className="bg-gradient-to-br from-green-500 to-blue-600 rounded-xl p-6 text-white">
                        <div className="flex items-center gap-3 mb-2">
                          <MdAttachMoney size={32} />
                          <span className="text-sm opacity-90">Transaction Amount</span>
                        </div>
                        <div className="text-4xl font-bold">
                          {payment.currency} {payment.amount.toLocaleString()}
                        </div>
                        <div className="mt-4 flex items-center gap-2">
                          <span
                            className={`px-3 py-1 text-sm font-medium rounded-full ${getStatusColor(
                              payment.status
                            )}`}
                          >
                            {payment.status.toUpperCase()}
                          </span>
                        </div>
                      </div>

                      {/* Transaction Details */}
                      <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-6">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                          Transaction Details
                        </h3>
                        <div className="space-y-3">
                          <DetailItem
                            icon={MdReceipt}
                            label="Transaction Type"
                            value={payment.transactionType}
                          />
                          <DetailItem
                            icon={MdAccountBalanceWallet}
                            label="Payment Method"
                            value={payment.paymentMethod}
                          />
                          <DetailItem
                            icon={MdReceipt}
                            label="Gateway Reference"
                            value={payment.gatewayReference || "N/A"}
                          />
                          <DetailItem
                            icon={MdEvent}
                            label="Submitted On"
                            value={format(new Date(payment.createdAt), "MMM d, yyyy HH:mm")}
                          />
                          {payment.expiresAt && (
                            <DetailItem
                              icon={MdEvent}
                              label="Expires On"
                              value={format(new Date(payment.expiresAt), "MMM d, yyyy HH:mm")}
                            />
                          )}
                        </div>
                      </div>

                      {/* Metadata */}
                      {payment.metadata && (
                        <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-6">
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                            <MdInfo size={24} />
                            Additional Information
                          </h3>
                          <pre className="text-sm text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 p-4 rounded-lg overflow-x-auto">
                            {JSON.stringify(payment.metadata, null, 2)}
                          </pre>
                        </div>
                      )}
                    </div>

                    {/* Right Column - User Info & Proof */}
                    <div className="space-y-6">
                      {/* User Information */}
                      <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-6">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                          User Information
                        </h3>
                        <div className="space-y-3">
                          <DetailItem
                            icon={MdPerson}
                            label="Name"
                            value={payment.User.name || "N/A"}
                          />
                          <DetailItem
                            icon={MdEmail}
                            label="Email"
                            value={payment.User.email || "N/A"}
                          />
                          <DetailItem
                            icon={MdPerson}
                            label="Username"
                            value={payment.User.username || "N/A"}
                          />
                          <DetailItem
                            icon={MdAccountBalanceWallet}
                            label="Current Wallet"
                            value={`₦${(payment.User as any).wallet?.toLocaleString() || "0"}`}
                          />
                          <DetailItem
                            icon={MdAccountBalanceWallet}
                            label="Spendable Balance"
                            value={`₦${(payment.User as any).spendable?.toLocaleString() || "0"}`}
                          />
                        </div>
                      </div>

                      {/* Proof of Payment */}
                      {payment.proofOfPayment && (
                        <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-6">
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                            <MdImage size={24} />
                            Proof of Payment
                          </h3>
                          <div className="relative w-full h-64 bg-gray-200 dark:bg-gray-800 rounded-lg overflow-hidden">
                            <Image
                              src={payment.proofOfPayment}
                              alt="Proof of Payment"
                              fill
                              className="object-contain"
                            />
                          </div>
                          <a
                            href={payment.proofOfPayment}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mt-3 block text-center text-sm text-green-600 hover:text-green-700 underline"
                          >
                            View Full Size
                          </a>
                        </div>
                      )}

                      {/* Review Information */}
                      {payment.reviewedBy && (
                        <div className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-xl p-6">
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                            Review Information
                          </h3>
                          <div className="space-y-3">
                            <DetailItem
                              icon={MdPerson}
                              label="Reviewed By"
                              value={payment.Reviewer?.name || "N/A"}
                            />
                            {payment.reviewedAt && (
                              <DetailItem
                                icon={MdEvent}
                                label="Reviewed At"
                                value={format(new Date(payment.reviewedAt), "MMM d, yyyy HH:mm")}
                              />
                            )}
                            {payment.reviewNotes && (
                              <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
                                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                                  Review Notes
                                </p>
                                <p className="text-sm text-gray-700 dark:text-gray-300">
                                  {payment.reviewNotes}
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <p className="text-gray-500 dark:text-gray-400">Payment not found</p>
                  </div>
                )}
              </div>

              {/* Footer */}
              {payment && payment.status === "pending" && (
                <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-end gap-3">
                  <button
                    onClick={onClose}
                    className="px-6 py-2 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    Close
                  </button>
                  <button
                    onClick={onReview}
                    className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
                  >
                    <MdCheckCircle size={20} />
                    Review Payment
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// Helper Component
function DetailItem({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3">
      <div className="w-8 h-8 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
        <Icon className="text-green-600" size={18} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
        <p className="text-sm font-medium text-gray-900 dark:text-white break-words">{value}</p>
      </div>
    </div>
  );
}
