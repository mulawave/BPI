// @ts-nocheck
"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { api } from "@/client/trpc";
import toast from "react-hot-toast";
import {
  Zap,
  RefreshCw,
  Search,
  Users,
  ToggleLeft,
  ToggleRight,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Shield,
  Ban,
  CheckCircle2,
  History,
} from "lucide-react";
import { format } from "date-fns";
import Link from "next/link";

export default function AdminCspAutoContributePage() {
  const [page, setPage] = useState(1);
  const [enabledOnly, setEnabledOnly] = useState(false);
  const [search, setSearch] = useState("");
  const [showLogs, setShowLogs] = useState(false);
  const [logsUserId, setLogsUserId] = useState<string | undefined>(undefined);
  const [logsPage, setLogsPage] = useState(1);

  const { data, isLoading, refetch } = api.csp.adminGetAutoContributeUsers.useQuery({
    page,
    limit: 20,
    enabledOnly,
  });

  const { data: logsData } = api.csp.adminGetAutoContributeLogs.useQuery(
    { userId: logsUserId, page: logsPage, limit: 50 },
    { enabled: showLogs }
  );

  const toggleGlobalMutation = api.csp.adminToggleAutoContributeGlobal.useMutation({
    onSuccess: (data) => {
      toast.success(data.globalDisabled ? "Auto-contribute disabled globally" : "Auto-contribute enabled globally");
      refetch();
    },
    onError: (err) => toast.error(err.message),
  });

  const toggleUserMutation = api.csp.adminToggleAutoContributeUser.useMutation({
    onSuccess: () => {
      toast.success("User auto-contribute status updated");
      refetch();
    },
    onError: (err) => toast.error(err.message),
  });

  const filteredSettings = data?.settings?.filter((s: any) => {
    if (!search) return true;
    const name = (s.User?.firstname || "") + " " + (s.User?.lastname || "") + " " + (s.User?.name || "") + " " + (s.User?.email || "");
    return name.toLowerCase().includes(search.toLowerCase());
  }) ?? [];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-1">
              <Link href="/admin" className="hover:text-gray-700 dark:hover:text-gray-200">
                Admin
              </Link>
              <span>/</span>
              <span className="text-gray-900 dark:text-white">CSP Auto-Contribute</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Zap className="w-6 h-6 text-purple-500" />
              Auto-Contribute Management
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Monitor and manage auto-contribute settings for all users
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => refetch()}
              className="p-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <RefreshCw className="w-4 h-4 text-gray-600 dark:text-gray-300" />
            </button>
          </div>
        </div>

        {/* Global Control */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Shield className="w-6 h-6 text-purple-500" />
              <div>
                <h2 className="font-semibold text-gray-900 dark:text-white">Global Auto-Contribute</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {data?.globalDisabled
                    ? "Auto-contribute is currently DISABLED site-wide"
                    : "Auto-contribute is currently ENABLED site-wide"}
                </p>
              </div>
            </div>
            <button
              onClick={() => toggleGlobalMutation.mutate({ disabled: !data?.globalDisabled })}
              disabled={toggleGlobalMutation.isPending}
              className="focus:outline-none"
            >
              {data?.globalDisabled ? (
                <ToggleLeft className="w-12 h-12 text-red-500" />
              ) : (
                <ToggleRight className="w-12 h-12 text-emerald-500" />
              )}
            </button>
          </div>
        </motion.div>

        {/* Stats */}
        <div className="grid sm:grid-cols-3 gap-4">
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Users className="w-4 h-4 text-gray-500" />
              <p className="text-sm text-gray-500 dark:text-gray-400">Total Users</p>
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{data?.total ?? 0}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              <p className="text-sm text-gray-500 dark:text-gray-400">Active</p>
            </div>
            <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
              {data?.settings?.filter((s: any) => s.isEnabled).length ?? 0}
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Ban className="w-4 h-4 text-red-500" />
              <p className="text-sm text-gray-500 dark:text-gray-400">Disabled</p>
            </div>
            <p className="text-2xl font-bold text-red-600 dark:text-red-400">
              {data?.settings?.filter((s: any) => !s.isEnabled).length ?? 0}
            </p>
          </div>
        </div>

        {/* Controls */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search users..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-purple-500"
            />
          </div>
          <button
            onClick={() => setEnabledOnly(!enabledOnly)}
            className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
              enabledOnly
                ? "bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800 text-purple-700 dark:text-purple-300"
                : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300"
            }`}
          >
            {enabledOnly ? "Showing Active Only" : "Show All"}
          </button>
          <button
            onClick={() => { setShowLogs(!showLogs); setLogsUserId(undefined); }}
            className="px-4 py-2 rounded-lg text-sm font-medium border bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2"
          >
            <History className="w-4 h-4" />
            {showLogs ? "Hide Logs" : "View All Logs"}
          </button>
        </div>

        {/* Users Table */}
        {!showLogs && (
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
            {isLoading ? (
              <div className="p-8 text-center text-gray-500 dark:text-gray-400">Loading...</div>
            ) : filteredSettings.length === 0 ? (
              <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                <AlertCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                No auto-contribute users found
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
                    <tr>
                      <th className="text-left px-4 py-3 font-medium text-gray-600 dark:text-gray-400">User</th>
                      <th className="text-left px-4 py-3 font-medium text-gray-600 dark:text-gray-400">Status</th>
                      <th className="text-left px-4 py-3 font-medium text-gray-600 dark:text-gray-400">Min/Request</th>
                      <th className="text-left px-4 py-3 font-medium text-gray-600 dark:text-gray-400">Max/Request</th>
                      <th className="text-left px-4 py-3 font-medium text-gray-600 dark:text-gray-400">Community Balance</th>
                      <th className="text-left px-4 py-3 font-medium text-gray-600 dark:text-gray-400">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                    {filteredSettings.map((setting: any) => (
                      <tr key={setting.id} className="hover:bg-gray-50 dark:hover:bg-gray-900/50">
                        <td className="px-4 py-3">
                          <p className="font-medium text-gray-900 dark:text-white">
                            {setting.User?.firstname || setting.User?.name || "—"} {setting.User?.lastname || ""}
                          </p>
                          <p className="text-xs text-gray-500">{setting.User?.email}</p>
                        </td>
                        <td className="px-4 py-3">
                          {setting.isEnabled ? (
                            <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300 rounded-full">
                              <CheckCircle2 className="w-3 h-3" /> Active
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400 rounded-full">
                              Disabled
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-gray-700 dark:text-gray-300">
                          ₦{setting.minAmountPerRequest?.toLocaleString()}
                        </td>
                        <td className="px-4 py-3 text-gray-700 dark:text-gray-300">
                          ₦{setting.maxAmountPerRequest?.toLocaleString()}
                        </td>
                        <td className="px-4 py-3 text-gray-700 dark:text-gray-300">
                          ₦{(setting.User?.community ?? 0).toLocaleString()}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => toggleUserMutation.mutate({ userId: setting.User?.id, disabled: setting.isEnabled })}
                              disabled={toggleUserMutation.isPending}
                              className={`px-3 py-1 text-xs font-medium rounded-lg border transition-colors ${
                                setting.isEnabled
                                  ? "border-red-200 text-red-700 hover:bg-red-50 dark:border-red-800 dark:text-red-400"
                                  : "border-emerald-200 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-800 dark:text-emerald-400"
                              }`}
                            >
                              {setting.isEnabled ? "Disable" : "Enable"}
                            </button>
                            <button
                              onClick={() => { setShowLogs(true); setLogsUserId(setting.User?.id); setLogsPage(1); }}
                              className="px-3 py-1 text-xs font-medium rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300"
                            >
                              Logs
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination */}
            {data && data.totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 dark:border-gray-700">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Page {data.page} of {data.totalPages} ({data.total} total)
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPage(Math.max(1, page - 1))}
                    disabled={page === 1}
                    className="p-1 rounded disabled:opacity-30"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setPage(Math.min(data.totalPages, page + 1))}
                    disabled={page === data.totalPages}
                    className="p-1 rounded disabled:opacity-30"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Logs View */}
        {showLogs && (
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <History className="w-4 h-4" />
                Auto-Contribute Logs {logsUserId && "(Filtered by user)"}
              </h3>
              {logsUserId && (
                <button
                  onClick={() => setLogsUserId(undefined)}
                  className="text-sm text-purple-600 dark:text-purple-400 hover:underline"
                >
                  Show All
                </button>
              )}
            </div>
            {!logsData?.logs?.length ? (
              <div className="p-8 text-center text-gray-500 dark:text-gray-400">No logs found</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
                    <tr>
                      <th className="text-left px-4 py-3 font-medium text-gray-600 dark:text-gray-400">Date</th>
                      <th className="text-left px-4 py-3 font-medium text-gray-600 dark:text-gray-400">User</th>
                      <th className="text-left px-4 py-3 font-medium text-gray-600 dark:text-gray-400">Amount</th>
                      <th className="text-left px-4 py-3 font-medium text-gray-600 dark:text-gray-400">Request</th>
                      <th className="text-left px-4 py-3 font-medium text-gray-600 dark:text-gray-400">Balance Before</th>
                      <th className="text-left px-4 py-3 font-medium text-gray-600 dark:text-gray-400">Balance After</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                    {logsData.logs.map((log: any) => (
                      <tr key={log.id} className="hover:bg-gray-50 dark:hover:bg-gray-900/50">
                        <td className="px-4 py-3 text-gray-600 dark:text-gray-300">
                          {format(new Date(log.createdAt), "MMM d, HH:mm")}
                        </td>
                        <td className="px-4 py-3">
                          <p className="font-medium text-gray-900 dark:text-white">
                            {log.User?.firstname || log.User?.name || "—"}
                          </p>
                          <p className="text-xs text-gray-500">{log.User?.email}</p>
                        </td>
                        <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">
                          ₦{log.amount.toLocaleString()}
                        </td>
                        <td className="px-4 py-3 text-gray-600 dark:text-gray-300">
                          {log.Request?.purpose?.slice(0, 30) || log.requestId.slice(0, 8)}
                        </td>
                        <td className="px-4 py-3 text-gray-600 dark:text-gray-300">
                          ₦{log.balanceBefore.toLocaleString()}
                        </td>
                        <td className="px-4 py-3 text-gray-600 dark:text-gray-300">
                          ₦{log.balanceAfter.toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {logsData && logsData.totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 dark:border-gray-700">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Page {logsData.page} of {logsData.totalPages}
                </p>
                <div className="flex items-center gap-2">
                  <button onClick={() => setLogsPage(Math.max(1, logsPage - 1))} disabled={logsPage === 1} className="p-1 rounded disabled:opacity-30">
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button onClick={() => setLogsPage(Math.min(logsData.totalPages, logsPage + 1))} disabled={logsPage === logsData.totalPages} className="p-1 rounded disabled:opacity-30">
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
