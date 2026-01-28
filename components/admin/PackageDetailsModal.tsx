"use client";

import { motion, AnimatePresence } from "framer-motion";
import { api } from "@/client/trpc";
import {
  MdClose,
  MdEdit,
  MdAttachMoney,
  MdPeople,
  MdInfo,
  MdEvent,
  MdCheckCircle,
} from "react-icons/md";
import { format } from "date-fns";

interface PackageDetailsModalProps {
  packageId: string;
  isOpen: boolean;
  onClose: () => void;
  onEdit: () => void;
}

export default function PackageDetailsModal({
  packageId,
  isOpen,
  onClose,
  onEdit,
}: PackageDetailsModalProps) {
  const { data: pkg, isLoading } = api.admin.getPackageById.useQuery(
    { packageId },
    { enabled: isOpen && !!packageId }
  );

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
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
              {/* Header */}
              <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                    {pkg?.name || "Loading..."}
                  </h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    {pkg?.packageType} Package
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={onEdit}
                    className="p-2 text-gray-600 hover:text-green-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-green-400 dark:hover:bg-gray-700 rounded-lg transition-colors"
                  >
                    <MdEdit size={24} />
                  </button>
                  <button
                    onClick={onClose}
                    className="p-2 text-gray-600 hover:text-red-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-red-400 dark:hover:bg-gray-700 rounded-lg transition-colors"
                  >
                    <MdClose size={24} />
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-6">
                {isLoading ? (
                  <div className="flex items-center justify-center h-64">
                    <div className="w-12 h-12 border-4 border-green-600 border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : pkg ? (
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left Column - Pricing & Stats */}
                    <div className="lg:col-span-1 space-y-6">
                      {/* Pricing Card */}
                      <div className="bg-gradient-to-br from-green-500 to-blue-600 rounded-xl p-6 text-white">
                        <div className="flex items-center gap-2 mb-2">
                          <MdAttachMoney size={24} />
                          <span className="text-sm opacity-90">Package Pricing</span>
                        </div>
                        <div className="text-3xl font-bold mb-1">
                          ₦{pkg.price.toLocaleString()}
                        </div>
                        <div className="text-sm opacity-90">
                          VAT: ₦{pkg.vat.toLocaleString()} (7.5%)
                        </div>
                        <div className="mt-3 pt-3 border-t border-white/20">
                          <div className="text-sm opacity-90">Total Price</div>
                          <div className="text-2xl font-bold">
                            ₦{(pkg.price + pkg.vat).toLocaleString()}
                          </div>
                        </div>
                        {pkg.hasRenewal && pkg.renewalFee && (
                          <div className="mt-3 pt-3 border-t border-white/20">
                            <div className="text-sm opacity-90">Renewal Fee</div>
                            <div className="text-xl font-semibold">
                              ₦{pkg.renewalFee.toLocaleString()}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Stats */}
                    <div className="bg-gray-50 dark:bg-green-900/30 rounded-xl p-6">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                          Statistics
                        </h3>
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600 dark:text-gray-400">
                              Active Subscribers
                            </span>
                            <span className="text-lg font-semibold text-gray-900 dark:text-white">
                              {(pkg as any).subscribers?.length || 0}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600 dark:text-gray-400">
                              Total Revenue
                            </span>
                            <span className="text-lg font-semibold text-green-600">
                              ₦{((pkg as any).totalRevenue || 0).toLocaleString()}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600 dark:text-gray-400">Status</span>
                            <span
                              className={`px-2 py-1 text-xs font-medium rounded-full ${
                                pkg.isActive
                                  ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
                                : "bg-gray-100 text-gray-800 dark:bg-green-900/30 dark:text-gray-300"
                              }`}
                            >
                              {pkg.isActive ? "ACTIVE" : "INACTIVE"}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Dates */}
                    <div className="bg-gray-50 dark:bg-green-900/30 rounded-xl p-6">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                          <MdEvent size={20} />
                          Timeline
                        </h3>
                        <div className="space-y-2">
                          <div>
                            <p className="text-xs text-gray-500 dark:text-gray-400">Created</p>
                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                              {format(new Date(pkg.createdAt), "MMM d, yyyy")}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              Last Updated
                            </p>
                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                              {format(new Date(pkg.updatedAt), "MMM d, yyyy HH:mm")}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Right Column - Features & Subscribers */}
                    <div className="lg:col-span-2 space-y-6">
                      {/* Features */}
                    <div className="bg-gray-50 dark:bg-green-900/30 rounded-xl p-6">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                          <MdCheckCircle size={20} />
                          Package Features
                        </h3>
                        {pkg.features && pkg.features.length > 0 ? (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            {pkg.features.map((feature, idx) => (
                              <div
                                key={idx}
                                className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300"
                              >
                                <MdCheckCircle className="text-green-600 mt-0.5 flex-shrink-0" size={16} />
                                <span>{feature}</span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            No features listed
                          </p>
                        )}
                      </div>

                      {/* Reward Distribution */}
                    <div className="bg-gray-50 dark:bg-green-900/30 rounded-xl p-6">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                          <MdInfo size={20} />
                          Referral Rewards
                        </h3>
                        <div className="grid grid-cols-4 gap-3">
                          {[1, 2, 3, 4].map((level) => (
                            <div key={level} className="bg-white dark:bg-gray-800 rounded-lg p-3">
                              <div className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                                Level {level}
                              </div>
                              <div className="space-y-1">
                                <div className="text-xs">
                                  <span className="text-gray-500">Cash: </span>
                                  <span className="font-semibold">
                                    ₦{(pkg as any)[`cash_l${level}`]?.toLocaleString() || 0}
                                  </span>
                                </div>
                                <div className="text-xs">
                                  <span className="text-gray-500">BPT: </span>
                                  <span className="font-semibold">
                                    ₦{(pkg as any)[`bpt_l${level}`]?.toLocaleString() || 0}
                                  </span>
                                </div>
                                <div className="text-xs">
                                  <span className="text-gray-500">Pall: </span>
                                  <span className="font-semibold">
                                    ₦{(pkg as any)[`palliative_l${level}`]?.toLocaleString() || 0}
                                  </span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Recent Subscribers */}
                    <div className="bg-gray-50 dark:bg-green-900/30 rounded-xl p-6">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                          <MdPeople size={20} />
                          Recent Subscribers
                        </h3>
                        {(pkg as any).subscribers && (pkg as any).subscribers.length > 0 ? (
                          <div className="space-y-2">
                            {(pkg as any).subscribers.map((sub: any, idx: number) => (
                              <motion.div
                                key={sub.id}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: idx * 0.05 }}
                                className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-lg"
                              >
                                <div className="flex-1 min-w-0">
                                  <p className="font-medium text-gray-900 dark:text-white truncate">
                                    {sub.name}
                                  </p>
                                  <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                                    {sub.email}
                                  </p>
                                </div>
                                <div className="text-right ml-4">
                                  <p className="text-xs text-gray-500 dark:text-gray-400">
                                    Activated
                                  </p>
                                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                                    {sub.membershipActivatedAt
                                      ? format(new Date(sub.membershipActivatedAt), "MMM d")
                                      : "N/A"}
                                  </p>
                                </div>
                              </motion.div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
                            No subscribers yet
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <p className="text-gray-500 dark:text-gray-400">Package not found</p>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
