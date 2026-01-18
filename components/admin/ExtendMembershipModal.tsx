"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { createPortal } from "react-dom";
import { api } from "@/client/trpc";
import toast from "react-hot-toast";
import {
  MdClose,
  MdCalendarToday,
  MdAccessTime,
  MdWarning,
  MdCheckCircle,
} from "react-icons/md";
import { format, addMonths } from "date-fns";

interface ExtendMembershipModalProps {
  userId: string;
  currentExpiration: Date | null;
  userName: string;
  userEmail: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function ExtendMembershipModal({
  userId,
  currentExpiration,
  userName,
  userEmail,
  isOpen,
  onClose,
  onSuccess,
}: ExtendMembershipModalProps) {
  const [mounted, setMounted] = useState(false);
  const [months, setMonths] = useState(1);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen) {
      setMonths(1);
      setShowConfirm(false);
    }
  }, [isOpen]);

  const extendMutation = api.admin.extendMembershipExpiration.useMutation({
    onSuccess: (data) => {
      toast.success(
        `Successfully extended membership for ${userEmail} by ${months} month(s)`
      );
      setIsProcessing(false);
      onSuccess();
      onClose();
    },
    onError: (error) => {
      toast.error(`Extension failed: ${error.message}`);
      setIsProcessing(false);
    },
  });

  const handleSubmit = () => {
    if (months < 1 || months > 36) {
      toast.error("Months must be between 1 and 36");
      return;
    }
    setShowConfirm(true);
  };

  const handleConfirm = () => {
    setIsProcessing(true);
    setShowConfirm(false);
    extendMutation.mutate({ userId, months });
  };

  const newExpiration = currentExpiration
    ? addMonths(new Date(currentExpiration), months)
    : null;

  if (!mounted || !isOpen) return null;

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
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed inset-0 z-[101] flex items-center justify-center p-4"
          >
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col">
              {/* Header */}
              <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between bg-gradient-to-r from-purple-500 to-pink-500">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
                    <MdCalendarToday className="text-white" size={24} />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white">
                      Extend Membership Expiration
                    </h2>
                    <p className="text-sm text-white/80">
                      Add additional months to membership duration
                    </p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="text-white hover:bg-white/20 p-2 rounded-full transition-colors"
                >
                  <MdClose size={24} />
                </button>
              </div>

              {/* Content */}
              <div className="p-6 space-y-6">
                {/* User Info */}
                <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">User</div>
                      <div className="font-medium text-gray-900 dark:text-white mt-1">
                        {userName}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        {userEmail}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        Current Expiration
                      </div>
                      <div className="font-medium text-gray-900 dark:text-white mt-1">
                        {currentExpiration
                          ? format(new Date(currentExpiration), "PPP")
                          : "Not set"}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Months Input */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Extend by (months)
                  </label>
                  <div className="relative">
                    <MdAccessTime className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                    <input
                      type="number"
                      min="1"
                      max="36"
                      value={months}
                      onChange={(e) => setMonths(Math.max(1, Math.min(36, parseInt(e.target.value) || 1)))}
                      className="w-full pl-10 pr-4 py-3 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900 dark:text-white"
                    />
                  </div>
                  <p className="mt-2 text-sm text-gray-500">Enter a value between 1 and 36 months</p>
                </div>

                {/* Quick Select Buttons */}
                <div>
                  <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Quick Select
                  </div>
                  <div className="grid grid-cols-4 gap-2">
                    {[1, 3, 6, 12].map((m) => (
                      <button
                        key={m}
                        onClick={() => setMonths(m)}
                        className={`px-4 py-2 rounded-lg font-medium transition-all ${
                          months === m
                            ? "bg-purple-500 text-white shadow-md"
                            : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
                        }`}
                      >
                        {m} {m === 1 ? "mo" : "mos"}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Preview */}
                {newExpiration && (
                  <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <MdCheckCircle className="text-green-600 dark:text-green-500 mt-0.5" size={20} />
                      <div className="flex-1">
                        <div className="font-medium text-gray-900 dark:text-white mb-2">
                          New Expiration Date
                        </div>
                        <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                          {format(newExpiration, "PPP")}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                          {months} month(s) added from current expiration
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Warning */}
                <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <MdWarning className="text-yellow-600 dark:text-yellow-500 mt-0.5" size={20} />
                    <div className="flex-1 text-sm text-gray-700 dark:text-gray-300">
                      <p className="font-medium mb-1">Important:</p>
                      <ul className="list-disc list-inside space-y-1">
                        <li>This will extend the membership expiration date</li>
                        <li>The user&apos;s package assignment remains unchanged</li>
                        <li>This action will be logged in the audit trail</li>
                        <li>No payout processing or commission calculations occur</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-end gap-3 bg-gray-50 dark:bg-gray-900/50">
                <button
                  onClick={onClose}
                  className="px-6 py-2.5 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-800 rounded-lg font-medium transition-colors"
                  disabled={isProcessing}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={isProcessing || months < 1 || months > 36}
                  className="px-6 py-2.5 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg font-medium hover:from-purple-600 hover:to-pink-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
                >
                  {isProcessing ? "Processing..." : "Extend Membership"}
                </button>
              </div>
            </div>
          </motion.div>

          {/* Confirmation Dialog */}
          <AnimatePresence>
            {showConfirm && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[102] flex items-center justify-center p-4 bg-black/40"
              >
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.9, opacity: 0 }}
                  className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-6 max-w-md w-full"
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center">
                      <MdCalendarToday className="text-purple-600 dark:text-purple-500" size={24} />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                      Confirm Extension
                    </h3>
                  </div>
                  <p className="text-gray-700 dark:text-gray-300 mb-2">
                    Extend membership for <strong>{userEmail}</strong> by{" "}
                    <strong>{months} month(s)</strong>?
                  </p>
                  {newExpiration && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                      New expiration: {format(newExpiration, "PPP")}
                    </p>
                  )}
                  <div className="flex gap-3">
                    <button
                      onClick={() => setShowConfirm(false)}
                      className="flex-1 px-4 py-2.5 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg font-medium hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleConfirm}
                      className="flex-1 px-4 py-2.5 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg font-medium hover:from-purple-600 hover:to-pink-600 transition-all shadow-md"
                    >
                      Confirm
                    </button>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </>
      )}
    </AnimatePresence>,
    document.body
  );
}
