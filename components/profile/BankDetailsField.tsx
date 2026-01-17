"use client";

import { useState } from "react";
import { Check, X, Edit, Building2, Trash2, Plus } from "lucide-react";
import { api } from "@/client/trpc";
import toast from "react-hot-toast";
import Link from "next/link";

interface BankDetailsFieldProps {
  userId: string;
}

export function BankDetailsField({ userId }: BankDetailsFieldProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    bankId: "",
    accountName: "",
    accountNumber: "",
    bvn: "",
    pin: "",
    twoFactorCode: "",
  });

  const utils = api.useUtils();

  // Fetch user's bank records
  const { data: bankRecords, isLoading } = api.bank.getUserBankRecords.useQuery();
  const { data: banks } = api.bank.getBanks.useQuery();
  const { data: securityReqs } = api.bank.checkSecurityRequirements.useQuery();

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

  const updateMutation = api.bank.updateBankAccount.useMutation({
    onSuccess: () => {
      toast.success("Bank account updated successfully");
      setEditingId(null);
      resetForm();
      utils.bank.getUserBankRecords.invalidate();
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to update bank account");
    },
  });

  const deleteMutation = api.bank.deleteBankAccount.useMutation({
    onSuccess: () => {
      toast.success("Bank account deleted successfully");
      setDeletingId(null);
      utils.bank.getUserBankRecords.invalidate();
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to delete bank account");
      setDeletingId(null);
    },
  });

  const resetForm = () => {
    setFormData({
      bankId: "",
      accountName: "",
      accountNumber: "",
      bvn: "",
      pin: "",
      twoFactorCode: "",
    });
  };

  const handleEdit = (record: any) => {
    setEditingId(record.id);
    setFormData({
      bankId: record.bankId?.toString() || "",
      accountName: record.accountName,
      accountNumber: record.accountNumber,
      bvn: record.bvn || "",
      pin: "",
      twoFactorCode: "",
    });
  };

  const handleSave = () => {
    if (!formData.bankId) {
      toast.error("Please select a bank");
      return;
    }

    if (!formData.accountName || !formData.accountNumber) {
      toast.error("Account name and number are required");
      return;
    }

    const bankId = Number(formData.bankId);

    if (editingId !== null) {
      updateMutation.mutate({
        id: editingId,
        bankId,
        accountName: formData.accountName,
        accountNumber: formData.accountNumber,
        bvn: formData.bvn || undefined,
      });
    } else {
      // Check security requirements before adding
      if (securityReqs?.pinRequired && !formData.pin) {
        toast.error("PIN is required");
        return;
      }

      if (securityReqs?.twoFARequired && !formData.twoFactorCode) {
        toast.error("Two-factor code is required");
        return;
      }

      addMutation.mutate({
        bankId,
        accountName: formData.accountName,
        accountNumber: formData.accountNumber,
        pin: securityReqs?.pinRequired ? formData.pin : undefined,
        twoFactorCode: securityReqs?.twoFARequired ? formData.twoFactorCode : undefined,
        bvn: formData.bvn || undefined,
      });
    }
  };

  const handleCancel = () => {
    setIsAdding(false);
    setEditingId(null);
    resetForm();
  };

  const handleDelete = (id: number) => {
    toast.custom((t) => (
      <div className="w-full max-w-sm rounded-lg border border-bpi-border bg-white p-3 shadow-lg dark:border-bpi-dark-accent dark:bg-bpi-dark-card">
        <div className="text-sm text-foreground">Delete this bank account?</div>
        <div className="mt-2 flex items-center justify-end gap-2">
          <button
            onClick={() => toast.dismiss(t.id)}
            className="rounded px-2 py-1 text-xs text-muted-foreground hover:bg-gray-50 dark:hover:bg-bpi-dark-accent/30"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              toast.dismiss(t.id);
              setDeletingId(id);
              deleteMutation.mutate({ id });
            }}
            className="rounded bg-red-600 px-2 py-1 text-xs text-white hover:bg-red-700"
          >
            Delete
          </button>
        </div>
      </div>
    ));
  };

  const isPending = addMutation.isPending || updateMutation.isPending || deleteMutation.isPending;

  if (isLoading) {
    return (
      <div className="py-2 border-b border-gray-100 dark:border-bpi-dark-accent">
        <div className="text-xs text-muted-foreground">Loading bank details...</div>
      </div>
    );
  }

  return (
    <div className="py-2 space-y-2 border-b border-gray-100 dark:border-bpi-dark-accent">
      <div className="flex items-center justify-between">
        <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
          <Building2 className="w-3 h-3 text-bpi-primary" />
          Bank Details (Withdrawal)
        </label>
        {!isAdding && !editingId && (
          <button
            onClick={() => setIsAdding(true)}
            className="p-0.5 text-bpi-primary hover:bg-bpi-primary/10 rounded transition-colors"
          >
            <Plus className="w-3 h-3" />
          </button>
        )}
      </div>

      {/* Existing Bank Records */}
      {bankRecords && bankRecords.length > 0 && (
        <div className="space-y-1.5">
          {bankRecords.map((record: any) => (
            <div
              key={record.id}
              className="bg-gray-50 dark:bg-bpi-dark-accent/30 rounded px-2 py-1.5"
            >
              {editingId === record.id ? (
                <div className="space-y-1.5">
                  {/* Edit Form */}
                  <div>
                    <label className="text-[10px] text-muted-foreground">Bank</label>
                    <select
                      value={formData.bankId}
                      onChange={(e) => setFormData({ ...formData, bankId: e.target.value })}
                      disabled={isPending}
                      className="w-full text-xs text-foreground bg-white dark:bg-bpi-dark-card border border-bpi-border dark:border-bpi-dark-accent rounded px-2 py-1 focus:border-bpi-primary focus:outline-none"
                    >
                      <option value="">Select Bank</option>
                      {banks?.map((bank: any) => (
                        <option key={bank.id} value={bank.id}>
                          {bank.bankName}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] text-muted-foreground">Account Name</label>
                    <input
                      type="text"
                      value={formData.accountName}
                      onChange={(e) => setFormData({ ...formData, accountName: e.target.value })}
                      disabled={isPending}
                      className="w-full text-xs text-foreground bg-white dark:bg-bpi-dark-card border border-bpi-border dark:border-bpi-dark-accent rounded px-2 py-1 focus:border-bpi-primary focus:outline-none"
                      placeholder="Full name as on account"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] text-muted-foreground">Account Number</label>
                    <input
                      type="text"
                      value={formData.accountNumber}
                      onChange={(e) => setFormData({ ...formData, accountNumber: e.target.value })}
                      disabled={isPending}
                      maxLength={10}
                      className="w-full text-xs text-foreground bg-white dark:bg-bpi-dark-card border border-bpi-border dark:border-bpi-dark-accent rounded px-2 py-1 focus:border-bpi-primary focus:outline-none"
                      placeholder="10-digit account number"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] text-muted-foreground">BVN (Optional)</label>
                    <input
                      type="text"
                      value={formData.bvn}
                      onChange={(e) => setFormData({ ...formData, bvn: e.target.value })}
                      disabled={isPending}
                      maxLength={11}
                      className="w-full text-xs text-foreground bg-white dark:bg-bpi-dark-card border border-bpi-border dark:border-bpi-dark-accent rounded px-2 py-1 focus:border-bpi-primary focus:outline-none"
                      placeholder="11-digit BVN"
                    />
                  </div>

                  <div className="flex items-center gap-1 justify-end">
                    <button
                      onClick={handleSave}
                      disabled={isPending}
                      className="p-1 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded transition-colors disabled:opacity-50 flex items-center gap-1"
                    >
                      {isPending ? (
                        <div className="w-3 h-3 border-2 border-green-600 border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <Check className="w-3 h-3" />
                      )}
                    </button>
                    <button
                      onClick={handleCancel}
                      disabled={isPending}
                      className="p-1 text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-900/20 rounded transition-colors disabled:opacity-50"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="text-xs font-medium text-foreground">
                      {record.bank?.bankName || record.bankName || "Bank Not Set"}
                    </div>
                    <div className="text-[11px] text-muted-foreground">
                      {record.accountName}
                    </div>
                    <div className="text-[11px] text-muted-foreground">
                      {record.accountNumber}
                    </div>
                  </div>
                  <div className="flex items-center gap-0.5">
                    <button
                      onClick={() => handleEdit(record)}
                      disabled={isPending || deletingId === record.id}
                      className="p-0.5 text-bpi-primary hover:bg-bpi-primary/10 rounded transition-colors disabled:opacity-50"
                    >
                      <Edit className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => handleDelete(record.id)}
                      disabled={deletingId === record.id}
                      className="p-0.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors disabled:opacity-50"
                    >
                      {deletingId === record.id ? (
                        <div className="w-3 h-3 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <Trash2 className="w-3 h-3" />
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Add New Form */}
      {isAdding && (
        <div className="bg-gray-50 dark:bg-bpi-dark-accent/30 rounded px-2 py-1.5 space-y-1.5">
          <div>
            <label className="text-[10px] text-muted-foreground">Bank</label>
            <select
              value={formData.bankId}
              onChange={(e) => setFormData({ ...formData, bankId: e.target.value })}
              disabled={isPending}
              className="w-full text-xs text-foreground bg-white dark:bg-bpi-dark-card border border-bpi-border dark:border-bpi-dark-accent rounded px-2 py-1 focus:border-bpi-primary focus:outline-none"
            >
              <option value="">Select Bank</option>
              {banks?.map((bank: any) => (
                <option key={bank.id} value={bank.id}>
                  {bank.bankName}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[10px] text-muted-foreground">Account Name</label>
            <input
              type="text"
              value={formData.accountName}
              onChange={(e) => setFormData({ ...formData, accountName: e.target.value })}
              disabled={isPending}
              className="w-full text-xs text-foreground bg-white dark:bg-bpi-dark-card border border-bpi-border dark:border-bpi-dark-accent rounded px-2 py-1 focus:border-bpi-primary focus:outline-none"
              placeholder="Full name as on account"
            />
          </div>

          <div>
            <label className="text-[10px] text-muted-foreground">Account Number</label>
            <input
              type="text"
              value={formData.accountNumber}
              onChange={(e) => setFormData({ ...formData, accountNumber: e.target.value })}
              disabled={isPending}
              maxLength={10}
              className="w-full text-xs text-foreground bg-white dark:bg-bpi-dark-card border border-bpi-border dark:border-bpi-dark-accent rounded px-2 py-1 focus:border-bpi-primary focus:outline-none"
              placeholder="10-digit account number"
            />
          </div>

          {securityReqs?.pinRequired && (
            <div>
              <label className="text-[10px] text-muted-foreground">
                PIN {!securityReqs.hasPin && <span className="text-red-500">(Setup required)</span>}
              </label>
              <input
                type="password"
                value={formData.pin}
                onChange={(e) => setFormData({ ...formData, pin: e.target.value })}
                disabled={isPending}
                className="w-full text-xs text-foreground bg-white dark:bg-bpi-dark-card border border-bpi-border dark:border-bpi-dark-accent rounded px-2 py-1 focus:border-bpi-primary focus:outline-none"
                placeholder="Enter your PIN"
              />
            </div>
          )}

          {securityReqs?.twoFARequired && (
            <div>
              <label className="text-[10px] text-muted-foreground">
                Two-Factor Code {!securityReqs.has2FA && <span className="text-red-500">(Setup required)</span>}
              </label>
              <input
                type="text"
                value={formData.twoFactorCode}
                onChange={(e) => setFormData({ ...formData, twoFactorCode: e.target.value })}
                disabled={isPending}
                className="w-full text-xs text-foreground bg-white dark:bg-bpi-dark-card border border-bpi-border dark:border-bpi-dark-accent rounded px-2 py-1 focus:border-bpi-primary focus:outline-none"
                placeholder="Enter your 2FA code"
              />
            </div>
          )}

          {(securityReqs?.needsPinSetup || securityReqs?.needs2FASetup) && (
            <div className="text-[10px] text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/20 p-1.5 rounded">
              ⚠️ Please set up your security features in{' '}
              <Link href="/settings" className="underline font-medium">Account Settings</Link> first
            </div>
          )}

          <div>
            <label className="text-[10px] text-muted-foreground">BVN (Optional)</label>
            <input
              type="text"
              value={formData.bvn}
              onChange={(e) => setFormData({ ...formData, bvn: e.target.value })}
              disabled={isPending}
              maxLength={11}
              className="w-full text-xs text-foreground bg-white dark:bg-bpi-dark-card border border-bpi-border dark:border-bpi-dark-accent rounded px-2 py-1 focus:border-bpi-primary focus:outline-none"
              placeholder="11-digit BVN"
            />
          </div>

          <div className="flex items-center gap-1 justify-end">
            <button
              onClick={handleSave}
              disabled={isPending}
              className="p-1 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded transition-colors disabled:opacity-50 flex items-center gap-1"
            >
              {isPending ? (
                <div className="w-3 h-3 border-2 border-green-600 border-t-transparent rounded-full animate-spin" />
              ) : (
                <Check className="w-3 h-3" />
              )}
            </button>
            <button
              onClick={handleCancel}
              disabled={isPending}
              className="p-1 text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-900/20 rounded transition-colors disabled:opacity-50"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        </div>
      )}

      {!bankRecords?.length && !isAdding && (
        <div className="text-xs text-muted-foreground italic">
          No bank account added yet
        </div>
      )}
    </div>
  );
}
