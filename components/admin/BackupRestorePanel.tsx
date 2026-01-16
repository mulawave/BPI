"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  HiDownload,
  HiUpload,
  HiDatabase,
  HiCheckCircle,
  HiExclamationCircle,
  HiShieldCheck,
  HiTrash,
  HiLockClosed,
  HiUser,
} from "react-icons/hi";
import toast from "react-hot-toast";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import { api } from "@/client/trpc";

export default function BackupRestorePanel() {
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastBackup, setLastBackup] = useState<Date | null>(null);
  const [restoreFile, setRestoreFile] = useState<File | null>(null);
  const [confirmRestoreOpen, setConfirmRestoreOpen] = useState(false);
  const [confirmWipeOpen, setConfirmWipeOpen] = useState(false);
  const [superAdminEmail, setSuperAdminEmail] = useState("");
  const [superAdminPassword, setSuperAdminPassword] = useState("");
  const [superAdminName, setSuperAdminName] = useState("Super Admin");
  const [confirmPhrase, setConfirmPhrase] = useState("");
  const resetKeyword = "WIPE";

  const systemSettingsQuery = api.admin.getSystemSettings.useQuery(undefined, {
    refetchOnWindowFocus: false,
  });
  const updateSettingMutation = api.admin.updateSystemSetting.useMutation({
    onSuccess: () => {
      toast.success("Backup schedule updated");
      systemSettingsQuery.refetch();
    },
    onError: (e) => toast.error(e.message),
  });

  const createBackupMutation = api.admin.createBackup.useMutation({
    onSuccess: (data) => {
      setLastBackup(new Date(data.createdAt));
      toast.success("Database backup created successfully!");
      if (data.url) {
        const link = document.createElement("a");
        link.href = data.url;
        link.download = data.filename;
        link.click();
      }
      backupsQuery.refetch();
    },
    onError: (e) => toast.error(e.message),
  });

  const restoreMutation = api.admin.restoreDatabase.useMutation({
    onSuccess: () => {
      toast.success("Database restored successfully!");
      backupsQuery.refetch();
    },
    onError: (e) => toast.error(e.message),
  });

  const backupsQuery = api.admin.listBackups.useQuery(undefined, {
    refetchOnWindowFocus: false,
  });

  const deleteBackupMutation = api.admin.deleteBackup.useMutation({
    onSuccess: () => {
      toast.success("Backup deleted");
      backupsQuery.refetch();
    },
    onError: (e) => toast.error(e.message),
  });

  const wipeMutation = api.admin.wipeNonEssentialData.useMutation({
    onSuccess: (data) => {
      toast.success(`Data wiped. Seeded super admin at ${data.superAdminEmail}.`);
      setConfirmPhrase("");
      setSuperAdminPassword("");
      setConfirmWipeOpen(false);
      backupsQuery.refetch();
    },
    onError: (e) => toast.error(e.message),
  });
  const isWiping = wipeMutation.isLoading;
  const canWipe =
    confirmPhrase.trim().toLowerCase() === resetKeyword.toLowerCase() &&
    superAdminEmail.trim().length > 0 &&
    superAdminPassword.trim().length >= 8 &&
    superAdminName.trim().length > 0;

  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [toDeleteFilename, setToDeleteFilename] = useState<string | null>(null);

  const handleBackup = async () => {
    setIsBackingUp(true);
    try {
      const t = toast.loading("Creating backup...");
      await createBackupMutation.mutateAsync();
      toast.dismiss(t);
    } finally {
      setIsBackingUp(false);
    }
  };

  const performRestore = async (file: File) => {
    setIsRestoring(true);
    try {
      const t = toast.loading("Restoring database...");
      const text = await file.text();
      const json = JSON.parse(text);
      await restoreMutation.mutateAsync({ data: json });
      toast.dismiss(t);
    } catch (error: any) {
      toast.error(error?.message || "Failed to restore database");
    } finally {
      setIsRestoring(false);
    }
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-lg dark:border-slate-800 dark:bg-slate-950">
      <div className="mb-6 flex items-center space-x-3">
        <div className="rounded-lg bg-purple-100 p-2 dark:bg-purple-900/30">
          <HiDatabase className="h-6 w-6 text-purple-600 dark:text-purple-400" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">
            Backup & Restore
          </h3>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Manage database backups and restoration
          </p>
        </div>
      </div>

      {/* Last Backup Info */}
      {lastBackup && (
        <div className="mb-6 flex items-center space-x-2 rounded-lg border border-green-200 bg-green-50 p-3 dark:border-green-800 dark:bg-green-900/20">
          <HiCheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
          <span className="text-sm text-green-900 dark:text-green-200">
            Last backup: {lastBackup.toLocaleString()}
          </span>
        </div>
      )}

      {/* Warning */}
      <div className="mb-6 flex items-start space-x-2 rounded-lg border border-orange-200 bg-orange-50 p-3 dark:border-orange-800 dark:bg-orange-900/20">
        <HiExclamationCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-orange-600 dark:text-orange-400" />
        <div className="text-sm text-orange-900 dark:text-orange-200">
          <p className="font-medium">Important:</p>
          <ul className="mt-1 list-inside list-disc space-y-1">
            <li>Backups include all user data, payments, and settings</li>
            <li>Restoring will REPLACE all current database content</li>
            <li>Schedule regular backups to prevent data loss</li>
          </ul>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Create Backup */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleBackup}
          disabled={isBackingUp}
          className="flex items-center justify-center space-x-2 rounded-lg border border-blue-600 bg-blue-600 px-6 py-3 text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <HiDownload
            className={`h-5 w-5 ${isBackingUp ? "animate-bounce" : ""}`}
          />
          <span>{isBackingUp ? "Creating Backup..." : "Create Backup"}</span>
        </motion.button>

        {/* Restore from File */}
        <motion.label
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className={`flex cursor-pointer items-center justify-center space-x-2 rounded-lg border border-purple-600 bg-purple-600 px-6 py-3 text-white transition-colors hover:bg-purple-700 ${isRestoring ? "cursor-not-allowed opacity-50" : ""}`}
        >
          <HiUpload
            className={`h-5 w-5 ${isRestoring ? "animate-bounce" : ""}`}
          />
          <span>{isRestoring ? "Restoring..." : "Restore from File"}</span>
          <input
            type="file"
            accept=".json,.sql,.backup,.zip"
            onChange={(e) => {
              if (e.target.files?.[0]) {
                setRestoreFile(e.target.files[0]);
                setConfirmRestoreOpen(true);
              }
            }}
            disabled={isRestoring}
            className="hidden"
          />
        </motion.label>
      </div>

      <ConfirmDialog
        isOpen={confirmRestoreOpen}
        title="Restore database from backup?"
        description={
          <div className="space-y-2">
            <p>
              This will <span className="font-semibold">REPLACE</span> all current data with the
              contents of the backup file.
            </p>
            <p className="text-xs text-muted-foreground">
              File: <span className="font-medium">{restoreFile?.name || "(none)"}</span>
            </p>
          </div>
        }
        confirmText="Yes, restore"
        cancelText="Cancel"
        onClose={() => setConfirmRestoreOpen(false)}
        onConfirm={() => {
          if (!restoreFile) return;
          performRestore(restoreFile);
          setRestoreFile(null);
        }}
      />

      <div className="mt-6 overflow-hidden rounded-xl border border-red-200 bg-gradient-to-br from-red-50 via-white to-amber-50 p-5 shadow-inner dark:border-red-900/40 dark:from-red-950/40 dark:via-slate-950 dark:to-amber-950/30">
        <div className="mb-4 flex flex-wrap items-start gap-3">
          <div className="rounded-lg bg-red-100 p-2 text-red-700 shadow-sm dark:bg-red-900/50 dark:text-red-100">
            <HiShieldCheck className="h-5 w-5" />
          </div>
          <div className="flex-1 min-w-[240px] space-y-1">
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold uppercase tracking-wide text-red-700 dark:bg-red-900/60 dark:text-red-100">
                Danger Zone
              </span>
              <span className="rounded-full bg-black/5 px-2 py-0.5 text-xs text-slate-700 dark:bg-white/5 dark:text-slate-200">
                Super admin only
              </span>
            </div>
            <h4 className="text-lg font-bold text-red-800 dark:text-red-100">
              Wipe non-essential data and reseed super admin
            </h4>
            <p className="text-sm text-red-700/90 dark:text-red-200/80">
              Removes users, wallets, transactions, referrals, notifications, audit logs, sessions, and other user data. Keeps system configuration (packages, settings, wallets, rates, platforms, palliative options) intact.
            </p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-800 dark:text-slate-100">
              <HiUser className="h-4 w-4" />
              Seed super admin account
            </div>
            <div className="space-y-2">
              <input
                type="text"
                value={superAdminName}
                onChange={(e) => setSuperAdminName(e.target.value)}
                placeholder="Full name"
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
              />
              <input
                type="email"
                value={superAdminEmail}
                onChange={(e) => setSuperAdminEmail(e.target.value)}
                placeholder="super.admin@example.com"
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
              />
              <div className="relative">
                <HiLockClosed className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <input
                  type="password"
                  value={superAdminPassword}
                  onChange={(e) => setSuperAdminPassword(e.target.value)}
                  placeholder="New super admin password (min 8 chars)"
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 pl-9 text-sm text-slate-900 shadow-sm outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                />
              </div>
              <div className="rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:border-amber-800 dark:bg-amber-900/40 dark:text-amber-100">
                Use a strong password and store it securely. Existing sessions will be invalidated after the wipe.
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-800 dark:text-slate-100">
                <HiExclamationCircle className="h-4 w-4 text-red-600" />
                Type "{resetKeyword}" to confirm
              </div>
              <input
                type="text"
                value={confirmPhrase}
                onChange={(e) => setConfirmPhrase(e.target.value)}
                placeholder="Type WIPE to enable the button"
                className="w-full rounded-lg border border-red-200 bg-white px-3 py-2 text-sm text-red-900 shadow-sm outline-none transition focus:border-red-600 focus:ring-2 focus:ring-red-600/20 dark:border-red-800 dark:bg-red-950/40 dark:text-red-50"
              />
            </div>
          </div>

          <div className="grid gap-3 rounded-lg border border-slate-200 bg-white/60 p-4 text-sm text-slate-800 shadow-sm dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-100">
            <div className="rounded-lg border border-emerald-200 bg-emerald-50/70 p-3 dark:border-emerald-800 dark:bg-emerald-900/30">
              <div className="flex items-center gap-2 text-sm font-semibold text-emerald-800 dark:text-emerald-100">
                <HiShieldCheck className="h-4 w-4" />
                Kept (system configuration)
              </div>
              <ul className="mt-2 list-disc space-y-1 pl-4 text-xs text-emerald-900 dark:text-emerald-100">
                <li>Admin settings, notification settings, payment gateways</li>
                <li>Membership packages, system wallets, BPT conversion rates</li>
                <li>YouTube plans, third-party platforms, palliative options</li>
                <li>Community features, leadership pools, investor pools</li>
              </ul>
            </div>
            <div className="rounded-lg border border-red-200 bg-red-50/70 p-3 dark:border-red-800 dark:bg-red-950/30">
              <div className="flex items-center gap-2 text-sm font-semibold text-red-800 dark:text-red-100">
                <HiTrash className="h-4 w-4" />
                Wiped (non-essential)
              </div>
              <ul className="mt-2 list-disc space-y-1 pl-4 text-xs text-red-900 dark:text-red-100">
                <li>Users, credentials, sessions, passwords, referrals</li>
                <li>Wallet balances, transactions, payments, orders</li>
                <li>Notifications, audit logs, tickets, community posts</li>
                <li>Backups list reload recommended after wipe</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs text-slate-600 dark:text-slate-300">
            This operation cannot be undone. The database will be cleaned and a fresh super admin account will be created with the credentials above.
          </p>
          <motion.button
            whileHover={{ scale: canWipe && !isWiping ? 1.02 : 1 }}
            whileTap={{ scale: canWipe && !isWiping ? 0.98 : 1 }}
            onClick={() => setConfirmWipeOpen(true)}
            disabled={!canWipe || isWiping}
            className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold shadow-sm transition focus:outline-none focus:ring-2 focus:ring-red-500/50 disabled:cursor-not-allowed disabled:opacity-60 ${
              canWipe && !isWiping
                ? "bg-gradient-to-r from-red-600 to-amber-600 text-white hover:shadow-lg"
                : "bg-red-200 text-red-800"
            }`}
          >
            <HiTrash className={`h-4 w-4 ${isWiping ? "animate-pulse" : ""}`} />
            {isWiping ? "Wiping..." : "Wipe non-essential data"}
          </motion.button>
        </div>
      </div>

      {/* Automated Backups */}
      <div className="mt-6 rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-900">
        <h4 className="mb-2 font-medium text-slate-900 dark:text-white">
          Automated Backups
        </h4>
        <p className="mb-3 text-sm text-slate-600 dark:text-slate-400">
          Schedule automatic database backups
        </p>
        <select
          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
          value={
            (systemSettingsQuery.data?.["backup.schedule"]?.value as string) || "Disabled"
          }
          onChange={(e) =>
            updateSettingMutation.mutate({
              settingKey: "backup.schedule",
              settingValue: e.target.value,
            })
          }
        >
          <option>Disabled</option>
          <option>Daily at 2:00 AM</option>
          <option>Weekly on Sunday</option>
          <option>Monthly on 1st</option>
        </select>

        <div className="mt-4">
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Retention (keep last N backups)</label>
          <input
            type="number"
            min={1}
            value={parseInt((systemSettingsQuery.data?.["backup.retention.count"]?.value as string) || "5")}
            onChange={(e) =>
              updateSettingMutation.mutate({
                settingKey: "backup.retention.count",
                settingValue: String(Math.max(1, Number(e.target.value))),
              })
            }
            className="w-32 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
          />
        </div>
      </div>

      {/* Recent Backups */}
      <div className="mt-6 rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-900">
        <div className="flex items-center justify-between mb-3">
          <h4 className="font-medium text-slate-900 dark:text-white">Recent Backups</h4>
          <button
            onClick={async () => {
              setIsRefreshing(true);
              const t = toast.loading("Refreshing backups...");
              try {
                await backupsQuery.refetch();
                toast.success("Backups refreshed");
              } catch (e: any) {
                toast.error(e?.message || "Failed to refresh backups");
              } finally {
                toast.dismiss(t);
                setIsRefreshing(false);
              }
            }}
            disabled={isRefreshing || backupsQuery.isFetching}
            className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200"
          >
            {isRefreshing || backupsQuery.isFetching ? "Refreshing..." : "Refresh"}
          </button>
        </div>
        {backupsQuery.isLoading ? (
          <div className="py-6 text-sm text-slate-600 dark:text-slate-300">Loading backups...</div>
        ) : backupsQuery.error ? (
          <div className="py-6 text-sm text-red-600 dark:text-red-400">Failed to load backups. Try refreshing.</div>
        ) : backupsQuery.data && backupsQuery.data.length > 0 ? (
          <ul className="space-y-2">
            {backupsQuery.data.map((b) => (
              <li key={b.filename} className="flex items-center justify-between rounded-lg border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-800">
                <div>
                  <div className="text-sm font-medium text-slate-900 dark:text-white">{b.filename}</div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">{new Date(b.createdAt).toLocaleString()} • {(b.size / 1024 / 1024).toFixed(2)} MB</div>
                </div>
                <div className="flex items-center gap-2">
                  <a
                    href={b.url}
                    download
                    className="rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700"
                  >
                    Download
                  </a>
                  <button
                    onClick={() => { setToDeleteFilename(b.filename); setConfirmDeleteOpen(true); }}
                    className="rounded-lg bg-red-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-700"
                  >
                    Delete
                  </button>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <div className="py-6 text-sm text-slate-600 dark:text-slate-300">No backups found</div>
        )}
      </div>

      <ConfirmDialog
        isOpen={confirmWipeOpen}
        title="Wipe non-essential data?"
        description={
          <div className="space-y-2 text-sm">
            <p>Users, credentials, sessions, referrals, wallets, payments, tickets, community posts, and audit logs will be deleted.</p>
            <p className="text-xs text-muted-foreground">
              System configuration (packages, settings, wallets, rates, platforms, palliative options) stays intact. A fresh super admin will be seeded after the wipe.
            </p>
          </div>
        }
        confirmText={isWiping ? "Wiping..." : "Yes, wipe and reseed"}
        cancelText="Cancel"
        onClose={() => setConfirmWipeOpen(false)}
        onConfirm={() => {
          if (!canWipe || isWiping) return;
          wipeMutation.mutate({
            confirmPhrase,
            superAdminEmail,
            superAdminPassword,
            superAdminName,
          });
        }}
      />

      <ConfirmDialog
        isOpen={confirmDeleteOpen}
        title="Delete backup file?"
        description={
          <div className="space-y-2">
            <p>This will permanently remove the selected backup.</p>
            <p className="text-xs text-muted-foreground">File: <span className="font-medium">{toDeleteFilename || "(none)"}</span></p>
          </div>
        }
        confirmText="Delete"
        cancelText="Cancel"
        onClose={() => setConfirmDeleteOpen(false)}
        onConfirm={() => {
          if (toDeleteFilename) {
            deleteBackupMutation.mutate({ filename: toDeleteFilename });
            setToDeleteFilename(null);
          }
          setConfirmDeleteOpen(false);
        }}
      />
    </div>
  );
}
