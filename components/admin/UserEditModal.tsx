"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { api } from "@/client/trpc";
import { MdClose, MdSave, MdPerson, MdEmail, MdAccountBalanceWallet } from "react-icons/md";
import toast from "react-hot-toast";
import { createPortal } from "react-dom";

interface UserEditModalProps {
  userId: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function UserEditModal({
  userId,
  isOpen,
  onClose,
  onSuccess,
}: UserEditModalProps) {
  const [mounted, setMounted] = useState(false);
  const { data: user, isLoading } = api.admin.getUserById.useQuery(
    { userId },
    { enabled: isOpen && !!userId }
  );

  useEffect(() => {
    setMounted(true);
  }, []);

  const [formData, setFormData] = useState<{
    name: string;
    email: string;
    role: "user" | "admin" | "super_admin";
    activated: boolean;
    verified: boolean;
    wallet: number;
    spendable: number;
  }>({
    name: user?.name || "",
    email: user?.email || "",
    role: (user?.role as "user" | "admin" | "super_admin") || "user",
    activated: user?.activated || false,
    verified: user?.verified || false,
    wallet: user?.wallet || 0,
    spendable: user?.spendable || 0,
  });

  const updateUserMutation = api.admin.updateUser.useMutation({
    onSuccess: () => {
      toast.success("User updated successfully");
      onSuccess();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  // Update form data when user data loads
  if (user && formData.name === "" && user.name) {
    setFormData({
      name: user.name || "",
      email: user.email || "",
      role: (user.role as "user" | "admin" | "super_admin") || "user",
      activated: user.activated,
      verified: user.verified,
      wallet: user.wallet,
      spendable: user.spendable,
    });
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateUserMutation.mutate({
      userId,
      data: formData,
    });
  };

  if (!isOpen || !mounted) return null;

  return createPortal(
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
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
              {/* Header */}
              <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Edit User
                </h2>
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
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Basic Information */}
                    <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-6">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                        <MdPerson size={24} />
                        Basic Information
                      </h3>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Full Name
                          </label>
                          <input
                            type="text"
                            value={formData.name}
                            onChange={(e) =>
                              setFormData({ ...formData, name: e.target.value })
                            }
                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Email Address
                          </label>
                          <input
                            type="email"
                            value={formData.email}
                            onChange={(e) =>
                              setFormData({ ...formData, email: e.target.value })
                            }
                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Role & Status */}
                    <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-6">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                        Role & Status
                      </h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Role
                          </label>
                          <select
                            value={formData.role}
                            onChange={(e) =>
                              setFormData({ ...formData, role: e.target.value as "user" | "admin" | "super_admin" })
                            }
                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                          >
                            <option value="user">User</option>
                            <option value="admin">Admin</option>
                            <option value="super_admin">Super Admin</option>
                          </select>
                        </div>

                        <div className="space-y-3">
                          <label className="flex items-center gap-3 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={formData.activated}
                              onChange={(e) =>
                                setFormData({ ...formData, activated: e.target.checked })
                              }
                              className="w-5 h-5 text-green-600 rounded focus:ring-green-500"
                            />
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                              Activated
                            </span>
                          </label>

                          <label className="flex items-center gap-3 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={formData.verified}
                              onChange={(e) =>
                                setFormData({ ...formData, verified: e.target.checked })
                              }
                              className="w-5 h-5 text-green-600 rounded focus:ring-green-500"
                            />
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                              Verified
                            </span>
                          </label>
                        </div>
                      </div>
                    </div>

                    {/* Wallets */}
                    <div className="bg-gradient-to-br from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 rounded-xl p-6">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                        <MdAccountBalanceWallet size={24} />
                        Wallet Balances
                      </h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Main Wallet (₦)
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            value={formData.wallet}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                wallet: parseFloat(e.target.value) || 0,
                              })
                            }
                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Spendable (₦)
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            value={formData.spendable}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                spendable: parseFloat(e.target.value) || 0,
                              })
                            }
                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                          />
                        </div>
                      </div>
                      <p className="text-xs text-gray-600 dark:text-gray-400 mt-3">
                        ⚠️ Be careful when editing wallet balances. All changes are logged.
                      </p>
                    </div>
                  </form>
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
                  disabled={updateUserMutation.isPending}
                  className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <MdSave size={20} />
                  {updateUserMutation.isPending ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body
  );
}
