"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import { X, Wallet, ArrowDownCircle, AlertCircle } from "lucide-react";
import { api } from "@/client/trpc";

interface ExecutiveWithdrawalModalProps {
  isOpen: boolean;
  onClose: () => void;
  shareholderId: string;
  currentBalance: number;
  shareholderName: string;
}

export default function ExecutiveWithdrawalModal({
  isOpen,
  onClose,
  shareholderId,
  currentBalance,
  shareholderName,
}: ExecutiveWithdrawalModalProps) {
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");
  const [bankName, setBankName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [accountName, setAccountName] = useState("");

  const utils = api.useUtils();

  const withdrawal = api.revenue.requestWithdrawal.useMutation({
    onSuccess: (data) => {
      toast.success(data.message);
      onClose();
      setAmount("");
      setReason("");
      setBankName("");
      setAccountNumber("");
      setAccountName("");
      utils.revenue.getExecutiveShareholders.invalidate();
      utils.revenue.getMyWalletTransactions.invalidate();
    },
    onError: (error: any) => toast.error(error.message),
  });

  const handleSubmit = () => {
    if (!amount || Number(amount) <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    if (Number(amount) > currentBalance) {
      toast.error(`Amount exceeds available balance of ₦${currentBalance.toLocaleString()}`);
      return;
    }

    if (!reason || reason.length < 10) {
      toast.error("Please provide a detailed reason (min 10 characters)");
      return;
    }

    if (!bankName || !accountNumber || !accountName) {
      toast.error("Please provide complete bank details");
      return;
    }

    withdrawal.mutate({
      shareholderId,
      amount: Number(amount),
      reason,
      bankDetails: {
        bankName,
        accountNumber,
        accountName,
      },
    });
  };

  if (!isOpen) return null;

  const numAmount = Number(amount) || 0;
  const requiresApproval = numAmount >= 100000;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-green-600 to-green-700 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-lg">
              <ArrowDownCircle className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">Wallet Withdrawal</h2>
              <p className="text-green-100 text-sm">{shareholderName}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-lg transition-colors"
          >
            <X className="w-6 h-6 text-white" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Balance Display */}
          <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border-2 border-green-200 dark:border-green-800 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-2">
              <Wallet className="w-6 h-6 text-green-600 dark:text-green-400" />
              <span className="text-sm font-medium text-green-700 dark:text-green-300">
                Available Balance
              </span>
            </div>
            <p className="text-4xl font-bold text-green-900 dark:text-green-100">
              ₦{currentBalance.toLocaleString()}
            </p>
          </div>

          {/* Withdrawal Amount */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Withdrawal Amount (₦)
            </label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Enter amount to withdraw"
              className="w-full px-4 py-3 border-2 border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-800 dark:text-white focus:border-green-500 dark:focus:border-green-400 transition-colors"
            />
            {numAmount > 0 && (
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                After withdrawal: ₦{(currentBalance - numAmount).toLocaleString()}
              </p>
            )}
          </div>

          {/* Approval Warning */}
          {requiresApproval && (
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border-2 border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mt-0.5" />
                <div>
                  <p className="font-semibold text-yellow-900 dark:text-yellow-100">
                    Admin Approval Required
                  </p>
                  <p className="text-sm text-yellow-800 dark:text-yellow-200 mt-1">
                    Withdrawals over ₦100,000 require admin approval before processing
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Reason */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Reason for Withdrawal
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Explain the reason for this withdrawal (minimum 10 characters)"
              rows={3}
              className="w-full px-4 py-3 border-2 border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-800 dark:text-white focus:border-green-500 dark:focus:border-green-400 transition-colors"
            />
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              {reason.length}/10 characters minimum
            </p>
          </div>

          {/* Bank Details */}
          <div className="border-t border-slate-200 dark:border-slate-700 pt-6">
            <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4">
              Bank Account Details
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Bank Name
                </label>
                <input
                  type="text"
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  placeholder="e.g., Access Bank, GTBank"
                  className="w-full px-4 py-3 border-2 border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-800 dark:text-white focus:border-green-500 dark:focus:border-green-400 transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Account Number
                </label>
                <input
                  type="text"
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value)}
                  placeholder="10-digit account number"
                  maxLength={10}
                  className="w-full px-4 py-3 border-2 border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-800 dark:text-white focus:border-green-500 dark:focus:border-green-400 transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Account Name
                </label>
                <input
                  type="text"
                  value={accountName}
                  onChange={(e) => setAccountName(e.target.value)}
                  placeholder="Account holder's name"
                  className="w-full px-4 py-3 border-2 border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-800 dark:text-white focus:border-green-500 dark:focus:border-green-400 transition-colors"
                />
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <button
              onClick={handleSubmit}
              disabled={withdrawal.isPending}
              className="flex-1 px-6 py-3 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white rounded-lg font-medium transition-colors"
            >
              {withdrawal.isPending
                ? "Processing..."
                : requiresApproval
                ? "Submit for Approval"
                : "Withdraw Now"}
            </button>
            <button
              onClick={onClose}
              className="flex-1 px-6 py-3 bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-white rounded-lg hover:bg-slate-300 dark:hover:bg-slate-600 font-medium transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
