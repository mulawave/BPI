"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { api } from "@/client/trpc";
import {
  MdSearch,
  MdRefresh,
  MdPeople,
  MdCheckCircle,
  MdCancel,
  MdCardMembership,
} from "react-icons/md";
type SscFilter = "with_ssc" | "without_ssc" | undefined;

export default function CustomerRepPage() {
  const [page, setPage] = useState(1);
  const [pageSize] = useState(50);
  const [search, setSearch] = useState("");
  const [sscFilter, setSscFilter] = useState<SscFilter>(undefined);

  const { data, isLoading, refetch, isFetching } = api.customerRep.getUsers.useQuery({
    page,
    pageSize,
    search: search || undefined,
    sscFilter,
  }, {
    refetchOnWindowFocus: false,
    staleTime: 30000,
    gcTime: 300000,
  });

  useEffect(() => {
    setPage(1);
  }, [search, sscFilter]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
  };

  const fullName = (u: any) => {
    const parts = [u.firstname, u.lastname].filter(Boolean).join(" ");
    return parts || u.name || "—";
  };

  const kycBadge = (status: string | null) => {
    if (!status || status === "none") {
      return <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-600 dark:bg-gray-700 dark:text-gray-300">None</span>;
    }
    const colors: Record<string, string> = {
      approved: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
      pending: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
      under_review: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
      rejected: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
      expired: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
    };
    const cls = colors[status] || colors.pending;
    return <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${cls}`}>{status.replace("_", " ")}</span>;
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col gap-2"
      >
        <div className="flex items-center gap-2">
          <div className="h-7 w-1 rounded-full bg-gradient-to-b from-emerald-500 to-amber-400" />
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Customer Rep Dashboard</h1>
        </div>
        <p className="text-sm text-slate-500 dark:text-slate-400 ml-3">
          View user information — read-only access
        </p>
      </motion.div>

      {/* Summary Cards */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.04 }}
        className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4"
      >
        <div className="rounded-2xl border border-amber-300/30 dark:border-amber-400/15 bg-gradient-to-br from-white to-emerald-50/20 dark:from-slate-900 dark:to-emerald-950/20 shadow-md dark:shadow-emerald-950/20 ring-1 ring-amber-300/10 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Total Users</p>
              <p className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">{data?.total || 0}</p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10">
              <MdPeople className="text-emerald-500" size={22} />
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-amber-300/30 dark:border-amber-400/15 bg-gradient-to-br from-white to-emerald-50/20 dark:from-slate-900 dark:to-emerald-950/20 shadow-md dark:shadow-emerald-950/20 ring-1 ring-amber-300/10 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Showing</p>
              <p className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">{data?.users?.length || 0}</p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10">
              <MdSearch className="text-blue-500" size={22} />
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-amber-300/30 dark:border-amber-400/15 bg-gradient-to-br from-white to-emerald-50/20 dark:from-slate-900 dark:to-emerald-950/20 shadow-md dark:shadow-emerald-950/20 ring-1 ring-amber-300/10 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">With SSC</p>
              <p className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">
                {data?.users?.filter((u: any) => u.ssc).length || 0}
              </p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10">
              <MdCardMembership className="text-amber-500" size={22} />
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-amber-300/30 dark:border-amber-400/15 bg-gradient-to-br from-white to-emerald-50/20 dark:from-slate-900 dark:to-emerald-950/20 shadow-md dark:shadow-emerald-950/20 ring-1 ring-amber-300/10 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Activated</p>
              <p className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">
                {data?.users?.filter((u: any) => u.activated).length || 0}
              </p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-500/10">
              <MdCheckCircle className="text-green-500" size={22} />
            </div>
          </div>
        </div>
      </motion.div>

      {/* Search + SSC Filter Bar */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.06 }}
        className="rounded-2xl border border-amber-300/30 dark:border-amber-400/15 bg-gradient-to-br from-white to-emerald-50/20 dark:from-slate-900 dark:to-emerald-950/20 shadow-md dark:shadow-emerald-950/20 ring-1 ring-amber-300/10 p-5"
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <form onSubmit={handleSearch} className="relative flex-1 max-w-md">
            <MdSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, email, or phone..."
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 pl-10 pr-4 py-2.5 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
            />
          </form>

          <div className="flex items-center gap-2">
            {/* SSC Filter Tabs */}
            <div className="flex rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
              <button
                onClick={() => setSscFilter(undefined)}
                className={`px-4 py-2 text-sm font-medium transition-colors ${
                  sscFilter === undefined
                    ? "bg-emerald-500 text-white"
                    : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700"
                }`}
              >
                All
              </button>
              <button
                onClick={() => setSscFilter("with_ssc")}
                className={`px-4 py-2 text-sm font-medium transition-colors ${
                  sscFilter === "with_ssc"
                    ? "bg-emerald-500 text-white"
                    : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700"
                }`}
              >
                With SSC
              </button>
              <button
                onClick={() => setSscFilter("without_ssc")}
                className={`px-4 py-2 text-sm font-medium transition-colors ${
                  sscFilter === "without_ssc"
                    ? "bg-emerald-500 text-white"
                    : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700"
                }`}
              >
                Without SSC
              </button>
            </div>

            <button
              onClick={() => refetch()}
              disabled={isFetching}
              className="flex items-center gap-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors disabled:opacity-50"
            >
              <MdRefresh size={18} className={isFetching ? "animate-spin" : ""} />
              Refresh
            </button>
          </div>
        </div>
      </motion.div>

      {/* Users Table */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.08 }}
        className="rounded-2xl border border-amber-300/30 dark:border-amber-400/15 bg-gradient-to-br from-white to-emerald-50/20 dark:from-slate-900 dark:to-emerald-950/20 shadow-md dark:shadow-emerald-950/20 ring-1 ring-amber-300/10 overflow-hidden"
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50">
                <th className="px-4 py-3 font-semibold text-slate-700 dark:text-slate-300">Full Name</th>
                <th className="px-4 py-3 font-semibold text-slate-700 dark:text-slate-300">Email</th>
                <th className="px-4 py-3 font-semibold text-slate-700 dark:text-slate-300">Phone</th>
                <th className="px-4 py-3 font-semibold text-slate-700 dark:text-slate-300">KYC Status</th>
                <th className="px-4 py-3 font-semibold text-slate-700 dark:text-slate-300">Membership</th>
                <th className="px-4 py-3 font-semibold text-slate-700 dark:text-slate-300">SSC</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="h-8 w-8 animate-spin rounded-full border-3 border-emerald-500 border-t-transparent" />
                      <p className="text-sm text-slate-500 dark:text-slate-400">Loading users...</p>
                    </div>
                  </td>
                </tr>
              ) : data?.users?.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center">
                    <p className="text-sm text-slate-500 dark:text-slate-400">No users found.</p>
                  </td>
                </tr>
              ) : (
                data?.users?.map((user: any) => (
                  <tr
                    key={user.id}
                    className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <span className="font-medium text-slate-900 dark:text-white">
                        {fullName(user)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-slate-600 dark:text-slate-300">{user.email || "—"}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-slate-600 dark:text-slate-300">{user.mobile || "—"}</span>
                    </td>
                    <td className="px-4 py-3">
                      {kycBadge(user.kyc)}
                    </td>
                    <td className="px-4 py-3">
                      {user.activated ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-700 dark:bg-green-900/30 dark:text-green-400">
                          <MdCheckCircle size={14} />
                          Activated
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-600 dark:bg-gray-700 dark:text-gray-300">
                          <MdCancel size={14} />
                          Not Activated
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {user.ssc ? (
                        <span className="font-mono text-xs text-emerald-600 dark:text-emerald-400">{user.ssc}</span>
                      ) : (
                        <span className="text-slate-400 dark:text-slate-500">—</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {data && data.pages > 1 && (
          <div className="flex items-center justify-between border-t border-slate-200 dark:border-slate-700 px-4 py-3">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Page {data.currentPage} of {data.pages} ({data.total} users)
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1.5 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <button
                onClick={() => setPage((p) => Math.min(data.pages, p + 1))}
                disabled={page === data.pages}
                className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1.5 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
