"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  HiDownload,
  HiUpload,
  HiDatabase,
  HiCheckCircle,
  HiExclamationCircle,
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
