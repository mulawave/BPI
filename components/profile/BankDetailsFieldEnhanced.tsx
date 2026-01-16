"use client";

import { useState } from "react";
import { Check, X, Edit, Building2, Trash2, Plus, Star, AlertCircle, Lock, Shield } from "lucide-react";
import { api } from "@/client/trpc";
import toast from "react-hot-toast";
import Link from "next/link";

interface BankDetailsFieldProps {
  userId: string;
}

export function BankDetailsField({ userId }: BankDetailsFieldProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verifiedAccountName, setVerifiedAccountName] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    bankCode: "",
    bankId: "",
    accountNumber: "",
    accountName: "",
    bvn: "",
    isDefault: false,
    pin: "",
    twoFactorCode: "",
  });

  const utils = api.useUtils();

  // Check security requirements
  const { data: securityCheck, isLoading: securityLoading } = api.bank.checkSecurityRequirements.useQuery();
  
  // Fetch user's bank records
  const { data: bankRecords, isLoading } = api.bank.getUserBankRecords.useQuery();
  
  // Get Flutterwave banks (for verification)
  const { data: flutterwaveBanks } = api.bank.getFlutterwaveBanks.useQuery();

  // Get database banks (fallback)
  const { data: dbBanks } = api.bank.getBanks.useQuery();

  // Use Flutterwave banks if available, otherwise fallback to DB banks
  const banks = flutterwaveBanks || dbBanks;

  const verifyAccountMutation = api.bank.verifyBankAccount.useMutation({
    onSuccess: (data) => {
      setVerifiedAccountName(data.accountName);
      setFormData(prev => ({ ...prev, accountName: data.accountName }));
      setIsVerifying(false);
      toast.success(`Account verified: ${data.accountName}`);
    },
    onError: (error: any) => {
      setIsVerifying(false);
      toast.error(error.message || "Account verification failed");
    },
  });

  const addMutation = api.bank.addBankAccount.useMutation({
    onSuccess: () => {
      toast.success("Bank account added successfully");
      setIsAdding(false);
      resetForm();
      utils.bank.getUserBankRecords.invalidate();
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to add bank account");
    },
  });

  const setDefaultMutation = api.bank.setDefaultBankAccount.useMutation({
    onSuccess: () => {
      toast.success("Default account updated");
      utils.bank.getUserBankRecords.invalidate();
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to update default account");
    },
  });

  const deleteMutation = api.bank.deleteBankAccount.useMutation({
    onSuccess: () => {
      toast.success("Bank account deleted successfully");
      utils.bank.getUserBankRecords.invalidate();
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to delete bank account");
    },
  });

  const isPending = addMutation.isPending || deleteMutation.isPending || setDefaultMutation.isPending;

  const resetForm = () => {
    setFormData({
      bankCode: "",
      bankId: "",
      accountNumber: "",
      accountName: "",
      bvn: "",
      isDefault: false,
      pin: "",
      twoFactorCode: "",
    });
    setVerifiedAccountName(null);
  };

  const handleVerifyAccount = () => {
    if (!formData.bankCode || !formData.accountNumber) {
      toast.error("Please select a bank and enter account number");
      return;
    }

    if (formData.accountNumber.length !== 10) {
      toast.error("Account number must be 10 digits");
      return;
    }

    setIsVerifying(true);
    verifyAccountMutation.mutate({
      accountNumber: formData.accountNumber,
      bankCode: formData.bankCode,
    });
  };

  const handleSave = () => {
    if (!formData.bankId || !formData.accountNumber || !formData.accountName) {
      toast.error("Please complete all required fields");
      return;
    }

    if (!formData.pin || !formData.twoFactorCode) {
      toast.error("PIN and 2FA code are required for security");
      return;
    }

    addMutation.mutate({
      bankId: parseInt(formData.bankId),
      accountName: formData.accountName,
      accountNumber: formData.accountNumber,
      bvn: formData.bvn || undefined,
      isDefault: formData.isDefault,
      pin: formData.pin,
      twoFactorCode: formData.twoFactorCode,
    });
  };

  const handleCancel = () => {
    setIsAdding(false);
    setEditingId(null);
    resetForm();
  };

  const handleDelete = (id: number) => {
    if (confirm("Are you sure you want to delete this bank account?")) {
      deleteMutation.mutate({ id });
    }
  };

  const handleSetDefault = (id: number) => {
    setDefaultMutation.mutate({ id });
  };

  // Show loading state
  if (securityLoading || isLoading) {
    return (
      <div className="text-xs text-muted-foreground">
        Loading bank details...
      </div>
    );
  }

  // Security requirements not met
  const canAddBankAccount = securityCheck?.isComplete;
  const needsPin = !securityCheck?.hasPin;
  const needs2FA = !securityCheck?.has2FA;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-xs font-medium text-foreground">Bank Details</label>
        {!isAdding && (
          <button
            onClick={() => {
              if (!canAddBankAccount) {
                toast.error("Please complete security setup first");
                return;
              }
              setIsAdding(true);
            }}
            disabled={isPending}
            className="flex items-center gap-1 text-xs text-bpi-primary hover:text-bpi-primary/80 transition-colors disabled:opacity-50"
          >
            <Plus className="w-3 h-3" />
            Add Account
          </button>
        )}
      </div>

      {/* Security Requirements Warning */}
      {!canAddBankAccount && (
        <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded px-3 py-2">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-orange-600 dark:text-orange-400 mt-0.5" />
            <div className="flex-1">
              <p className="text-[11px] font-medium text-orange-900 dark:text-orange-200">
                Security Setup Required
              </p>
              <p className="text-[10px] text-orange-700 dark:text-orange-300 mt-0.5">
                To add bank accounts, you must:
              </p>
              <ul className="text-[10px] text-orange-700 dark:text-orange-300 mt-1 space-y-0.5 ml-3">
                {needsPin && (
                  <li className="flex items-center gap-1">
                    <Lock className="w-3 h-3" />
                    Set up a 4-digit Profile PIN
                  </li>
                )}
                {needs2FA && (
                  <li className="flex items-center gap-1">
                    <Shield className="w-3 h-3" />
                    Enable Two-Factor Authentication (2FA)
                  </li>
                )}
              </ul>
              <Link 
                href="/dashboard/settings/security" 
                className="inline-flex items-center gap-1 text-[10px] font-medium text-bpi-primary hover:underline mt-2"
              >
                Go to Security Settings →
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Existing Bank Records */}
      {bankRecords && bankRecords.length > 0 && (
        <div className="space-y-1.5">
          {bankRecords.map((record: any) => (
            <div
              key={record.id}
              className="bg-gray-50 dark:bg-bpi-dark-accent/30 rounded px-2 py-1.5 relative"
            >
              {record.isDefault && (
                <div className="absolute top-1 right-1">
                  <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                </div>
              )}
              
              <div className="flex items-start justify-between pr-6">
                <div className="flex-1">
                  <div className="text-xs font-medium text-foreground flex items-center gap-1">
                    {record.bank?.bankName || "Bank Not Set"}
                    {record.isDefault && (
                      <span className="text-[9px] bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 px-1 py-0.5 rounded">
                        Default
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-muted-foreground">
                    {record.accountName}
                  </div>
                  <div className="text-[11px] text-muted-foreground font-mono">
                    {record.accountNumber}
                  </div>
                </div>
                
                <div className="flex items-center gap-0.5">
                  {!record.isDefault && (
                    <button
                      onClick={() => handleSetDefault(record.id)}
                      disabled={isPending}
                      className="p-0.5 text-yellow-600 hover:bg-yellow-50 dark:hover:bg-yellow-900/20 rounded transition-colors disabled:opacity-50"
                      title="Set as default"
                    >
                      <Star className="w-3 h-3" />
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(record.id)}
                    disabled={isPending}
                    className="p-0.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors disabled:opacity-50"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add New Account Form */}
      {isAdding && canAddBankAccount && (
        <div className="bg-gray-50 dark:bg-bpi-dark-accent/30 rounded px-2 py-2 space-y-2">
          <p className="text-[10px] text-muted-foreground">Add New Bank Account</p>

          {/* Bank Selection */}
          <div>
            <label className="text-[10px] text-muted-foreground">Select Bank</label>
            <select
              value={formData.bankCode}
              onChange={(e) => {
                const selectedBank = banks?.find((b: any) => b.code === e.target.value);
                setFormData({ 
                  ...formData, 
                  bankCode: e.target.value,
                  bankId: selectedBank?.id?.toString() || "",
                });
                setVerifiedAccountName(null);
              }}
              disabled={isPending}
              className="w-full text-xs text-foreground bg-white dark:bg-bpi-dark-card border border-bpi-border dark:border-bpi-dark-accent rounded px-2 py-1 focus:border-bpi-primary focus:outline-none"
            >
              <option value="">Select Bank</option>
              {banks?.map((bank: any) => (
                <option key={bank.code || bank.id} value={bank.code || bank.bankCode}>
                  {bank.name || bank.bankName}
                </option>
              ))}
            </select>
          </div>

          {/* Account Number */}
          <div>
            <label className="text-[10px] text-muted-foreground">Account Number</label>
            <div className="flex gap-1">
              <input
                type="text"
                value={formData.accountNumber}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, "").slice(0, 10);
                  setFormData({ ...formData, accountNumber: value });
                  setVerifiedAccountName(null);
                }}
                disabled={isPending || isVerifying}
                maxLength={10}
                className="flex-1 text-xs text-foreground bg-white dark:bg-bpi-dark-card border border-bpi-border dark:border-bpi-dark-accent rounded px-2 py-1 focus:border-bpi-primary focus:outline-none"
                placeholder="10-digit account number"
              />
              <button
                onClick={handleVerifyAccount}
                disabled={isPending || isVerifying || !formData.bankCode || formData.accountNumber.length !== 10}
                className="px-2 py-1 text-xs bg-bpi-primary text-white rounded hover:bg-bpi-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isVerifying ? "Verifying..." : "Verify"}
              </button>
            </div>
          </div>

          {/* Verified Account Name */}
          {verifiedAccountName && (
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded px-2 py-1.5">
              <p className="text-[10px] text-green-700 dark:text-green-300">
                ✓ Account Name: <span className="font-medium">{verifiedAccountName}</span>
              </p>
            </div>
          )}

          {/* Account Name (Manual Entry if verification fails) */}
          <div>
            <label className="text-[10px] text-muted-foreground">Account Name</label>
            <input
              type="text"
              value={formData.accountName}
              onChange={(e) => setFormData({ ...formData, accountName: e.target.value })}
              disabled={isPending || !!verifiedAccountName}
              className="w-full text-xs text-foreground bg-white dark:bg-bpi-dark-card border border-bpi-border dark:border-bpi-dark-accent rounded px-2 py-1 focus:border-bpi-primary focus:outline-none"
              placeholder="Full name as on account"
            />
          </div>

          {/* BVN */}
          <div>
            <label className="text-[10px] text-muted-foreground">BVN (Optional)</label>
            <input
              type="text"
              value={formData.bvn}
              onChange={(e) => {
                const value = e.target.value.replace(/\D/g, "").slice(0, 11);
                setFormData({ ...formData, bvn: value });
              }}
              disabled={isPending}
              maxLength={11}
              className="w-full text-xs text-foreground bg-white dark:bg-bpi-dark-card border border-bpi-border dark:border-bpi-dark-accent rounded px-2 py-1 focus:border-bpi-primary focus:outline-none"
              placeholder="11-digit BVN"
            />
          </div>

          {/* Set as Default */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isDefault"
              checked={formData.isDefault}
              onChange={(e) => setFormData({ ...formData, isDefault: e.target.checked })}
              disabled={isPending}
              className="w-3 h-3 text-bpi-primary focus:ring-bpi-primary border-gray-300 rounded"
            />
            <label htmlFor="isDefault" className="text-[10px] text-muted-foreground cursor-pointer">
              Set as default withdrawal account
            </label>
          </div>

          {/* Security Fields */}
          <div className="border-t border-bpi-border dark:border-bpi-dark-accent pt-2 mt-2">
            <p className="text-[10px] text-muted-foreground mb-2">Security Verification Required</p>
            
            <div className="space-y-2">
              <div>
                <label className="text-[10px] text-muted-foreground">Profile PIN</label>
                <input
                  type="password"
                  value={formData.pin}
                  onChange={(e) => setFormData({ ...formData, pin: e.target.value.slice(0, 4) })}
                  disabled={isPending}
                  maxLength={4}
                  className="w-full text-xs text-foreground bg-white dark:bg-bpi-dark-card border border-bpi-border dark:border-bpi-dark-accent rounded px-2 py-1 focus:border-bpi-primary focus:outline-none"
                  placeholder="Enter 4-digit PIN"
                />
              </div>

              <div>
                <label className="text-[10px] text-muted-foreground">2FA Code</label>
                <input
                  type="text"
                  value={formData.twoFactorCode}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, "").slice(0, 6);
                    setFormData({ ...formData, twoFactorCode: value });
                  }}
                  disabled={isPending}
                  maxLength={6}
                  className="w-full text-xs text-foreground bg-white dark:bg-bpi-dark-card border border-bpi-border dark:border-bpi-dark-accent rounded px-2 py-1 focus:border-bpi-primary focus:outline-none"
                  placeholder="Enter 6-digit code from authenticator"
                />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-1 justify-end pt-1">
            <button
              onClick={handleSave}
              disabled={isPending || !verifiedAccountName || !formData.pin || !formData.twoFactorCode}
              className="px-3 py-1 text-xs bg-bpi-primary text-white rounded hover:bg-bpi-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isPending ? "Saving..." : "Save Account"}
            </button>
            <button
              onClick={handleCancel}
              disabled={isPending}
              className="px-3 py-1 text-xs text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded disabled:opacity-50"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!bankRecords || bankRecords.length === 0 && !isAdding && (
        <div className="text-[11px] text-muted-foreground italic">
          No bank accounts added yet
        </div>
      )}
    </div>
  );
}
