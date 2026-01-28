"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { createPortal } from "react-dom";
import { api } from "@/client/trpc";
import toast from "react-hot-toast";
import {
  MdClose,
  MdSwapHoriz,
  MdWarning,
  MdPerson,
  MdCheckCircle,
  MdSearch,
} from "react-icons/md";

interface SwapSponsorModalProps {
  userId: string;
  userName: string;
  userEmail: string;
  currentSponsor: {
    id: string | null;
    name: string | null;
    email: string | null;
  } | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function SwapSponsorModal({
  userId,
  userName,
  userEmail,
  currentSponsor,
  isOpen,
  onClose,
  onSuccess,
}: SwapSponsorModalProps) {
  const [mounted, setMounted] = useState(false);
  const [newSponsorEmail, setNewSponsorEmail] = useState("");
  const [emailSearch, setEmailSearch] = useState("");
  const [showConfirm, setShowConfirm] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen) {
      setNewSponsorEmail("");
      setEmailSearch("");
      setShowConfirm(false);
    }
  }, [isOpen]);

  // Email autocomplete search
  const { data: emailSuggestions } =
    api.admin.searchUsersByEmail.useQuery(
      { query: emailSearch, limit: 10 },
      { enabled: isOpen && emailSearch.length >= 2 }
    );

  const swapMutation = api.admin.swapSponsor.useMutation({
    onSuccess: (data) => {
      const oldSponsorName = data.oldSponsor?.email || "None";
      const newSponsorName = data.newSponsor.email;
      toast.success(
        `Successfully changed sponsor from ${oldSponsorName} to ${newSponsorName}`
      );
      setIsProcessing(false);
      onSuccess();
      onClose();
    },
    onError: (error) => {
      toast.error(`Failed to swap sponsor: ${error.message}`);
      setIsProcessing(false);
    },
  });

  const handleSubmit = () => {
    if (!newSponsorEmail) {
      toast.error("Please enter a new sponsor email");
      return;
    }

    if (newSponsorEmail.toLowerCase() === userEmail.toLowerCase()) {
      toast.error("User cannot be their own sponsor");
      return;
    }

    if (newSponsorEmail.toLowerCase() === currentSponsor?.email?.toLowerCase()) {
      toast.error("This is already the current sponsor");
      return;
    }

    setShowConfirm(true);
  };

  const handleConfirm = () => {
    setIsProcessing(true);
    setShowConfirm(false);
    swapMutation.mutate({
      userId,
      newSponsorEmail,
    });
  };

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
              <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between bg-gradient-to-r from-orange-500 to-red-500">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
                    <MdSwapHoriz className="text-white" size={24} />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white">Swap Sponsor</h2>
                    <p className="text-sm text-white/80">
                      Change user&apos;s sponsor/referrer
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
              <div className="bg-gray-50 dark:bg-green-900/30 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                  <div className="flex items-center gap-3 mb-3">
                    <MdPerson className="text-gray-400" size={20} />
                    <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      User
                    </div>
                  </div>
                  <div className="font-medium text-gray-900 dark:text-white">
                    {userName}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    {userEmail}
                  </div>
                </div>

                {/* Current Sponsor */}
              <div className="bg-gray-50 dark:bg-green-900/30 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                  <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Current Sponsor
                  </div>
                  <div className="font-medium text-gray-900 dark:text-white">
                    {currentSponsor?.name || currentSponsor?.email || "None"}
                  </div>
                  {currentSponsor?.email && (
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {currentSponsor.email}
                    </div>
                  )}
                </div>

                {/* New Sponsor Email Input */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    New Sponsor Email
                  </label>
                  <div className="relative">
                    <MdSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                    <input
                      type="email"
                      value={newSponsorEmail}
                      onChange={(e) => {
                        setNewSponsorEmail(e.target.value);
                        setEmailSearch(e.target.value);
                      }}
                      placeholder="sponsor@example.com"
                      className="w-full pl-10 pr-4 py-3 bg-white dark:bg-green-900/30 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-gray-900 dark:text-white"
                    />
                    {emailSearch.length >= 2 &&
                      emailSuggestions &&
                      emailSuggestions.length > 0 && (
                        <div className="absolute z-10 w-full mt-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl max-h-60 overflow-y-auto">
                          {emailSuggestions.map((user) => (
                            <button
                              key={user.id}
                              onClick={() => {
                                setNewSponsorEmail(user.email || "");
                                setEmailSearch("");
                              }}
                              className="w-full px-4 py-3 text-left hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center justify-between border-b border-gray-100 dark:border-gray-700 last:border-0"
                            >
                              <div>
                                <div className="font-medium text-gray-900 dark:text-white">
                                  {user.email}
                                </div>
                                {user.name && (
                                  <div className="text-sm text-gray-500">
                                    {user.name}
                                  </div>
                                )}
                              </div>
                              {user.activated && (
                                <MdCheckCircle className="text-green-500" size={16} />
                              )}
                            </button>
                          ))}
                        </div>
                      )}
                  </div>
                </div>

                {/* Warning */}
                <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <MdWarning className="text-yellow-600 dark:text-yellow-500 mt-0.5" size={20} />
                    <div className="flex-1 text-sm text-gray-700 dark:text-gray-300">
                      <p className="font-medium mb-1">Important:</p>
                      <ul className="list-disc list-inside space-y-1">
                        <li>This will update both the sponsor and &quot;referred by&quot; fields</li>
                        <li>The referral record will be updated to the new sponsor</li>
                        <li>This action will be logged in the audit trail</li>
                        <li>Referral commissions are NOT recalculated</li>
                        <li>Circular referral loops are prevented</li>
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
                  disabled={!newSponsorEmail || isProcessing}
                  className="px-6 py-2.5 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-lg font-medium hover:from-orange-600 hover:to-red-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
                >
                  {isProcessing ? "Processing..." : "Swap Sponsor"}
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
                    <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/30 rounded-full flex items-center justify-center">
                      <MdSwapHoriz className="text-orange-600 dark:text-orange-500" size={24} />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                      Confirm Sponsor Swap
                    </h3>
                  </div>
                  <p className="text-gray-700 dark:text-gray-300 mb-2">
                    Change sponsor for <strong>{userEmail}</strong>?
                  </p>
                  <div className="text-sm text-gray-600 dark:text-gray-400 mb-6 space-y-1">
                    <div>
                      <span className="font-medium">From:</span>{" "}
                      {currentSponsor?.email || "None"}
                    </div>
                    <div>
                      <span className="font-medium">To:</span> {newSponsorEmail}
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={() => setShowConfirm(false)}
                      className="flex-1 px-4 py-2.5 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg font-medium hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleConfirm}
                      className="flex-1 px-4 py-2.5 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-lg font-medium hover:from-orange-600 hover:to-red-600 transition-all shadow-md"
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
