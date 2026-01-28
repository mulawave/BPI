"use client";

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { createPortal } from "react-dom";
import { api } from "@/client/trpc";
import toast from "react-hot-toast";
import {
  MdClose,
  MdCardMembership,
  MdPerson,
  MdGroups,
  MdEmail,
  MdAttachMoney,
  MdWarning,
  MdCheckCircle,
  MdSearch,
  MdDelete,
} from "react-icons/md";

type AssignmentMode = "single" | "bulk" | "email";

interface AssignMembershipModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  mode?: AssignmentMode;
  preSelectedUserId?: string;
  preSelectedEmail?: string;
}

interface EmailSuggestion {
  id: string;
  email: string;
  name: string | null;
  activated: boolean;
  activeMembershipPackage: { name: string } | null;
}

export default function AssignMembershipModal({
  isOpen,
  onClose,
  onSuccess,
  mode: initialMode = "single",
  preSelectedUserId,
  preSelectedEmail,
}: AssignMembershipModalProps) {
  const [mounted, setMounted] = useState(false);
  const [mode, setMode] = useState<AssignmentMode>(initialMode);
  const [selectedUserId, setSelectedUserId] = useState(preSelectedUserId || "");
  const [emailInput, setEmailInput] = useState(preSelectedEmail || "");
  const [bulkEmails, setBulkEmails] = useState<string[]>([]);
  const [emailSearch, setEmailSearch] = useState("");
  const [selectedPackageId, setSelectedPackageId] = useState("");
  const [processPayout, setProcessPayout] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Reset when modal opens
  useEffect(() => {
    if (isOpen) {
      setMode(initialMode);
      setSelectedUserId(preSelectedUserId || "");
      setEmailInput(preSelectedEmail || "");
      setBulkEmails([]);
      setEmailSearch("");
      setSelectedPackageId("");
      setProcessPayout(false);
      setShowConfirm(false);
    }
  }, [isOpen, initialMode, preSelectedUserId, preSelectedEmail]);

  // Get membership packages
  const { data: packages, isLoading: packagesLoading } =
    api.membershipPackages.getPackages.useQuery(undefined, { enabled: isOpen });

  // Email autocomplete search
  const { data: emailSuggestions, isLoading: searchLoading } =
    api.admin.searchUsersByEmail.useQuery(
      { query: emailSearch, limit: 10 },
      { enabled: isOpen && emailSearch.length >= 2 }
    );

  // Mutations
  const assignMutation = api.admin.assignMembershipPackage.useMutation({
    onSuccess: (data) => {
      toast.success(
        `Successfully assigned ${data.package.name} to ${data.user.email}${processPayout ? " with payout processed" : ""}`
      );
      setIsProcessing(false);
      onSuccess();
      onClose();
    },
    onError: (error) => {
      toast.error(`Assignment failed: ${error.message}`);
      setIsProcessing(false);
    },
  });

  const bulkAssignMutation = api.admin.bulkAssignMembershipPackage.useMutation({
    onSuccess: (data) => {
      const message = `Assigned ${data.package.name} to ${data.results.success} user(s)${data.results.failed > 0 ? `. ${data.results.failed} failed.` : ""}`;
      
      if (data.results.failed === 0) {
        toast.success(message);
      } else {
        toast(message, { icon: "⚠️" });
        
        // Show error details
        if (data.results.errors.length > 0) {
          data.results.errors.forEach((err: { email: string; error: string }) => {
            toast.error(`${err.email}: ${err.error}`, { duration: 5000 });
          });
        }
      }
      
      setIsProcessing(false);
      onSuccess();
      onClose();
    },
    onError: (error) => {
      toast.error(`Bulk assignment failed: ${error.message}`);
      setIsProcessing(false);
    },
  });

  const handleAddEmail = (email: string) => {
    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail) return;
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      toast.error(`Invalid email format: ${trimmedEmail}`);
      return;
    }

    if (bulkEmails.includes(trimmedEmail)) {
      toast.error(`Email already added: ${trimmedEmail}`);
      return;
    }

    setBulkEmails([...bulkEmails, trimmedEmail]);
    setEmailSearch("");
  };

  const handleParseBulkEmails = () => {
    const emails = emailInput
      .split(/[,\n]/)
      .map((e) => e.trim().toLowerCase())
      .filter((e) => e);

    const validEmails: string[] = [];
    const invalidEmails: string[] = [];
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    emails.forEach((email) => {
      if (emailRegex.test(email)) {
        if (!bulkEmails.includes(email)) {
          validEmails.push(email);
        }
      } else {
        invalidEmails.push(email);
      }
    });

    if (validEmails.length > 0) {
      setBulkEmails([...bulkEmails, ...validEmails]);
      setEmailInput("");
      toast.success(`Added ${validEmails.length} email(s)`);
    }

    if (invalidEmails.length > 0) {
      toast.error(`${invalidEmails.length} invalid email(s): ${invalidEmails.join(", ")}`);
    }
  };

  const handleRemoveEmail = (email: string) => {
    setBulkEmails(bulkEmails.filter((e) => e !== email));
  };

  const handleSubmit = () => {
    if (!selectedPackageId) {
      toast.error("Please select a membership package");
      return;
    }

    if (mode === "single" && !selectedUserId) {
      toast.error("Please select a user");
      return;
    }

    if (mode === "email" && !emailInput) {
      toast.error("Please enter an email address");
      return;
    }

    if (mode === "bulk" && bulkEmails.length === 0) {
      toast.error("Please add at least one email address");
      return;
    }

    setShowConfirm(true);
  };

  const handleConfirm = () => {
    setIsProcessing(true);
    setShowConfirm(false);

    if (mode === "bulk") {
      bulkAssignMutation.mutate({
        emails: bulkEmails,
        packageId: selectedPackageId,
        processPayout,
      });
    } else {
      const targetEmail = emailInput;
      const targetUserId = selectedUserId;

      // For single mode with user ID
      if (mode === "single" && selectedUserId) {
        assignMutation.mutate({
          userId: selectedUserId,
          packageId: selectedPackageId,
          processPayout,
        });
        return;
      }

      // For email mode, find user by email first
      if (mode === "email" && emailInput) {
        // Use the email suggestions to get userId
        const matchedUser = emailSuggestions?.find(
          (u) => u.email?.toLowerCase() === emailInput.toLowerCase()
        );
        
        if (matchedUser) {
          assignMutation.mutate({
            userId: matchedUser.id,
            packageId: selectedPackageId,
            processPayout,
          });
        } else {
          toast.error("User not found with that email");
          setIsProcessing(false);
        }
      }
    }
  };

  const selectedPackage = useMemo(
    () => packages?.find((p: any) => p.id === selectedPackageId) as { id: string; name: string; price: number } | undefined,
    [packages, selectedPackageId]
  );

  const confirmationMessage = useMemo(() => {
    const pkg = selectedPackage?.name || "selected package";
    const payoutText = processPayout
      ? " with full referral payout processing"
      : " without payout processing";

    if (mode === "bulk") {
      return `Assign ${pkg} to ${bulkEmails.length} user(s)${payoutText}?`;
    } else {
      return `Assign ${pkg} to the selected user${payoutText}?`;
    }
  }, [mode, selectedPackage, processPayout, bulkEmails.length]);

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
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
              {/* Header */}
              <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between bg-gradient-to-r from-green-500 to-blue-500">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
                    <MdCardMembership className="text-white" size={24} />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white">
                      Assign Membership Package
                    </h2>
                    <p className="text-sm text-white/80">
                      Assign packages to users with optional payout processing
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

              {/* Mode Selection */}
              <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-green-900/30">
                <div className="flex gap-2">
                  <button
                    onClick={() => setMode("single")}
                    className={`flex-1 px-4 py-2 rounded-lg font-medium transition-all ${
                      mode === "single"
                        ? "bg-green-500 text-white shadow-md"
                        : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                    }`}
                  >
                    <MdPerson className="inline mr-2" />
                    Individual
                  </button>
                  <button
                    onClick={() => setMode("email")}
                    className={`flex-1 px-4 py-2 rounded-lg font-medium transition-all ${
                      mode === "email"
                        ? "bg-green-500 text-white shadow-md"
                        : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                    }`}
                  >
                    <MdEmail className="inline mr-2" />
                    Email
                  </button>
                  <button
                    onClick={() => setMode("bulk")}
                    className={`flex-1 px-4 py-2 rounded-lg font-medium transition-all ${
                      mode === "bulk"
                        ? "bg-green-500 text-white shadow-md"
                        : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                    }`}
                  >
                    <MdGroups className="inline mr-2" />
                    Bulk
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {/* User Selection (Single Mode) */}
                {mode === "single" && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      User ID
                    </label>
                    <input
                      type="text"
                      value={selectedUserId}
                      onChange={(e) => setSelectedUserId(e.target.value)}
                      placeholder="Enter user ID"
                    className="w-full px-4 py-3 bg-white dark:bg-green-900/30 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900 dark:text-white"
                      disabled={!!preSelectedUserId}
                    />
                    {preSelectedUserId && (
                      <p className="mt-2 text-sm text-gray-500">
                        User pre-selected from details page
                      </p>
                    )}
                  </div>
                )}

                {/* Email Mode */}
                {mode === "email" && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Email Address
                    </label>
                    <div className="relative">
                      <input
                        type="email"
                        value={emailInput}
                        onChange={(e) => {
                          setEmailInput(e.target.value);
                          setEmailSearch(e.target.value);
                        }}
                        placeholder="user@example.com"
                        className="w-full px-4 py-3 bg-white dark:bg-green-900/30 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900 dark:text-white"
                      />
                      
                      {/* Autocomplete Suggestions */}
                      {emailSearch.length >= 2 && emailSuggestions && emailSuggestions.length > 0 && (
                        <div className="absolute z-10 w-full mt-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl max-h-60 overflow-y-auto">
                          {emailSuggestions.map((user) => (
                            <button
                              key={user.id}
                              onClick={() => {
                                setEmailInput(user.email || "");
                                setEmailSearch("");
                              }}
                              className="w-full px-4 py-3 text-left hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center justify-between border-b border-gray-100 dark:border-gray-700 last:border-0"
                            >
                              <div>
                                <div className="font-medium text-gray-900 dark:text-white">
                                  {user.email}
                                </div>
                                {user.name && (
                                  <div className="text-sm text-gray-500">{user.name}</div>
                                )}
                              </div>
                              <div className="flex items-center gap-2">
                                {user.activeMembershipPackageId && (
                                  <span className="text-xs px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 rounded-full">
                                    Active
                                  </span>
                                )}
                                {user.activated && (
                                  <MdCheckCircle className="text-green-500" size={16} />
                                )}
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Bulk Mode */}
                {mode === "bulk" && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Add Emails (comma or newline separated)
                      </label>
                      <textarea
                        value={emailInput}
                        onChange={(e) => setEmailInput(e.target.value)}
                        placeholder="user1@example.com, user2@example.com&#10;user3@example.com"
                        rows={4}
                        className="w-full px-4 py-3 bg-white dark:bg-green-900/30 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900 dark:text-white resize-none"
                      />
                      <button
                        onClick={handleParseBulkEmails}
                        className="mt-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium"
                      >
                        Parse & Add Emails
                      </button>
                    </div>

                    {/* Or search and add */}
                    <div className="relative">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Or search and add individually
                      </label>
                      <div className="relative">
                        <MdSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                        <input
                          type="text"
                          value={emailSearch}
                          onChange={(e) => setEmailSearch(e.target.value)}
                          placeholder="Search by email..."
                          className="w-full pl-10 pr-4 py-3 bg-white dark:bg-green-900/30 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900 dark:text-white"
                        />
                      </div>

                      {/* Autocomplete for bulk */}
                      {emailSearch.length >= 2 && emailSuggestions && emailSuggestions.length > 0 && (
                        <div className="absolute z-10 w-full mt-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl max-h-60 overflow-y-auto">
                          {emailSuggestions.map((user) => (
                            <button
                              key={user.id}
                              onClick={() => handleAddEmail(user.email || "")}
                              className="w-full px-4 py-3 text-left hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center justify-between border-b border-gray-100 dark:border-gray-700 last:border-0"
                            >
                              <div>
                                <div className="font-medium text-gray-900 dark:text-white">
                                  {user.email}
                                </div>
                                {user.name && (
                                  <div className="text-sm text-gray-500">{user.name}</div>
                                )}
                              </div>
                              <div className="flex items-center gap-2">
                                {user.activeMembershipPackageId && (
                                  <span className="text-xs px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 rounded-full">
                                    Active
                                  </span>
                                )}
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Email list */}
                    {bulkEmails.length > 0 && (
                      <div className="bg-gray-50 dark:bg-green-900/30 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            {bulkEmails.length} email(s) added
                          </span>
                          <button
                            onClick={() => setBulkEmails([])}
                            className="text-sm text-red-600 hover:text-red-700 font-medium"
                          >
                            Clear All
                          </button>
                        </div>
                        <div className="max-h-40 overflow-y-auto space-y-2">
                          {bulkEmails.map((email) => (
                            <div
                              key={email}
                              className="flex items-center justify-between bg-white dark:bg-gray-800 px-3 py-2 rounded-lg"
                            >
                              <span className="text-sm text-gray-700 dark:text-gray-300">
                                {email}
                              </span>
                              <button
                                onClick={() => handleRemoveEmail(email)}
                                className="text-gray-400 hover:text-red-500 transition-colors"
                              >
                                <MdDelete size={18} />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Package Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Membership Package
                  </label>
                  {packagesLoading ? (
                    <div className="text-center py-4 text-gray-500">Loading packages...</div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {packages?.map((pkg: any) => (
                        <button
                          key={pkg.id}
                          onClick={() => setSelectedPackageId(pkg.id)}
                          className={`p-4 rounded-lg border-2 transition-all text-left ${
                            selectedPackageId === pkg.id
                              ? "border-green-500 bg-green-50 dark:bg-green-900/20"
                              : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                          }`}
                        >
                          <div className="flex items-start justify-between">
                            <div>
                              <div className="font-semibold text-gray-900 dark:text-white">
                                {pkg.name}
                              </div>
                              <div className="text-sm text-gray-500 mt-1">
                                ₦{pkg.price.toLocaleString()}
                              </div>
                            </div>
                            {selectedPackageId === pkg.id && (
                              <MdCheckCircle className="text-green-500" size={24} />
                            )}
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Process Payout Toggle */}
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      id="processPayout"
                      checked={processPayout}
                      onChange={(e) => setProcessPayout(e.target.checked)}
                      className="mt-1 w-5 h-5 text-green-600 rounded focus:ring-green-500"
                    />
                    <div className="flex-1">
                      <label
                        htmlFor="processPayout"
                        className="font-medium text-gray-900 dark:text-white cursor-pointer"
                      >
                        Process Payout & Referral Flow
                      </label>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        When enabled, this will execute the full referral commission flow and
                        distribute BPT tokens. Leave unchecked to only assign the package.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Warning for existing members */}
                {selectedPackageId && (
                  <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <MdWarning className="text-yellow-600 dark:text-yellow-500 mt-0.5" size={20} />
                      <div className="flex-1 text-sm text-gray-700 dark:text-gray-300">
                        <p className="font-medium mb-1">Important Notes:</p>
                        <ul className="list-disc list-inside space-y-1">
                          <li>Existing package assignments will be overridden</li>
                          <li>Membership will be valid for 1 year from today</li>
                          <li>All actions are logged in the audit trail</li>
                          {processPayout && (
                            <li className="text-blue-600 dark:text-blue-400 font-medium">
                              Referral commissions and BPT tokens will be distributed
                            </li>
                          )}
                        </ul>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-end gap-3 bg-gray-50 dark:bg-green-900/30">
                <button
                  onClick={onClose}
                  className="px-6 py-2.5 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-800 rounded-lg font-medium transition-colors"
                  disabled={isProcessing}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={!selectedPackageId || isProcessing || (mode === "bulk" && bulkEmails.length === 0)}
                  className="px-6 py-2.5 bg-gradient-to-r from-green-500 to-blue-500 text-white rounded-lg font-medium hover:from-green-600 hover:to-blue-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
                >
                  {isProcessing ? "Processing..." : "Assign Package"}
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
                    <div className="w-12 h-12 bg-yellow-100 dark:bg-yellow-900/30 rounded-full flex items-center justify-center">
                      <MdWarning className="text-yellow-600 dark:text-yellow-500" size={24} />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                      Confirm Assignment
                    </h3>
                  </div>
                  <p className="text-gray-700 dark:text-gray-300 mb-6">
                    {confirmationMessage}
                  </p>
                  <div className="flex gap-3">
                    <button
                      onClick={() => setShowConfirm(false)}
                      className="flex-1 px-4 py-2.5 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg font-medium hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleConfirm}
                      className="flex-1 px-4 py-2.5 bg-gradient-to-r from-green-500 to-blue-500 text-white rounded-lg font-medium hover:from-green-600 hover:to-blue-600 transition-all shadow-md"
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
