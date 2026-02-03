"use client";

import { motion } from "framer-motion";
import { api } from "@/client/trpc";
import { useState } from "react";
import {
  MdSearch,
  MdFilterList,
  MdRefresh,
  MdCheckCircle,
  MdError,
  MdInfo,
  MdChevronLeft,
  MdChevronRight,
  MdFirstPage,
  MdLastPage,
} from "react-icons/md";
import { format } from "date-fns";
import StatsCard from "@/components/admin/StatsCard";
import AdminPageGuide from "@/components/admin/AdminPageGuide";

export default function AuditLogsPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState("");
  const [entityFilter, setEntityFilter] = useState("");
  const [selectedLog, setSelectedLog] = useState<any>(null);

  const { data, isLoading, refetch } = api.admin.getAuditLogs.useQuery({
    page,
    limit: 50,
    action: actionFilter || undefined,
    entity: entityFilter || undefined,
    search: search || undefined,
  });

  const getActionIcon = (action: string) => {
    if (action.includes("CREATE")) return <MdInfo className="text-blue-600" size={20} />;
    if (action.includes("UPDATE") || action.includes("EDIT"))
      return <MdInfo className="text-orange-600" size={20} />;
    if (action.includes("DELETE")) return <MdError className="text-red-600" size={20} />;
    if (action.includes("APPROVE") || action.includes("ACTIVATE"))
      return <MdCheckCircle className="text-green-600" size={20} />;
    return <MdInfo className="text-gray-600" size={20} />;
  };

  const getActionColor = (action: string) => {
    if (action.includes("CREATE")) return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300";
    if (action.includes("UPDATE") || action.includes("EDIT"))
      return "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300";
    if (action.includes("DELETE")) return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300";
    if (action.includes("APPROVE") || action.includes("ACTIVATE"))
      return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300";
    return "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300";
  };

  const uniqueActions = [
    "CREATE_USER",
    "UPDATE_USER",
    "DELETE_USER",
    "APPROVE_PAYMENT",
    "REJECT_PAYMENT",
    "CREATE_PACKAGE",
    "UPDATE_PACKAGE",
    "ACTIVATE_PACKAGE",
    "DEACTIVATE_PACKAGE",
    "DELETE_PACKAGE",
  ];

  const uniqueEntities = ["User", "PendingPayment", "MembershipPackage", "AuditLog"];

  return (
    <div className="min-h-screen pb-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-7xl mx-auto"
      >
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="premium-gradient-text text-4xl font-bold">Audit Logs</h1>
              <p className="text-muted-foreground mt-1 font-medium">
                Complete activity history and system changes
              </p>
            </div>
            <button
              onClick={() => refetch()}
              className="flex items-center gap-2 rounded-xl border border-border bg-background/60 px-4 py-2.5 font-semibold text-foreground/80 shadow-sm transition-all hover:bg-background hover:text-foreground"
            >
              <MdRefresh size={20} />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* User Guide */}
        <AdminPageGuide
          title="Audit Logs Guide"
          sections={[
            {
              title: "Audit Logs Overview",
              icon: <MdInfo className="w-5 h-5 text-blue-600" />,
              items: [
                "Track <strong>all admin actions and system changes</strong>",
                "<strong>Complete activity history</strong> for accountability",
                "View <strong>who did what, when</strong> with detailed context",
                "<strong>Filter by action type</strong> (create, update, delete, approve)",
                "<strong>Search logs</strong> by keyword, user, or entity",
                "<strong>Pagination support</strong> for large audit trails (50 logs per page)"
              ]
            },
            {
              title: "Action Types",
              icon: <MdCheckCircle className="w-5 h-5 text-green-600" />,
              items: [
                { label: "CREATE", text: "New records created (users, packages, posts, etc.)" },
                { label: "UPDATE / EDIT", text: "Existing records modified or updated" },
                { label: "DELETE", text: "Records permanently removed from system" },
                { label: "APPROVE / ACTIVATE", text: "Approval actions (payments, withdrawals, packages)" },
                { label: "REJECT / DEACTIVATE", text: "Denial or deactivation actions" }
              ]
            },
            {
              title: "Using Audit Logs",
              icon: <MdSearch className="w-5 h-5 text-orange-600" />,
              type: "ol",
              items: [
                "<strong>Search by keyword</strong> - Enter user email, entity name, or action description",
                "<strong>Filter by action</strong> - Select specific action type from dropdown",
                "<strong>Filter by entity</strong> - Choose entity type (User, Payment, Package, etc.)",
                "<strong>Review log details</strong> - Click on log entry to see full JSON payload",
                "<strong>Navigate pages</strong> - Use pagination controls to browse historical logs",
                "<strong>Export logs</strong> - Download filtered results for compliance reporting"
              ]
            },
            {
              title: "Audit Log Information",
              icon: <MdInfo className="w-5 h-5 text-purple-600" />,
              items: [
                "<strong>Action</strong> - What operation was performed",
                "<strong>Entity</strong> - Type of record affected (User, Payment, etc.)",
                "<strong>Actor</strong> - Admin user who performed the action",
                "<strong>Timestamp</strong> - Exact date and time of action",
                "<strong>Changes</strong> - Before/after values for updates",
                "<strong>IP Address</strong> - Source IP of the admin (if logged)",
                "<strong>Status</strong> - Success or failure of the action"
              ]
            },
            {
              title: "Security & Compliance",
              icon: <MdError className="w-5 h-5 text-red-600" />,
              items: [
                "<strong>Accountability</strong> - Every admin action is tracked and attributed",
                "<strong>Compliance</strong> - Meet regulatory requirements for audit trails",
                "<strong>Dispute resolution</strong> - Verify what happened in user disputes",
                "<strong>Security investigations</strong> - Identify unauthorized access or changes",
                "<strong>Performance review</strong> - Analyze admin efficiency and patterns",
                "<strong>Data retention</strong> - Logs stored indefinitely for historical analysis"
              ]
            }
          ]}
          features={[
            "Complete admin action logging",
            "Action type filtering (create/update/delete)",
            "Entity type filtering (users/payments/packages)",
            "Keyword search across logs",
            "Pagination (50 logs per page)",
            "Detailed log view with JSON payload",
            "Timestamp and actor tracking",
            "Export filtered results"
          ]}
          proTip="For <strong>security audits</strong>, filter by <strong>DELETE actions</strong> to review all data removals. Use <strong>date range filters</strong> (if available) to investigate specific incidents. <strong>Search by admin email</strong> to review individual performance. <strong>Export logs monthly</strong> for compliance archives. Set up <strong>anomaly detection</strong> to alert on unusual action patterns (e.g., mass deletions)."
          warning="Audit logs are <strong>read-only and cannot be deleted</strong> to maintain integrity. <strong>High log volume</strong> may slow page loads - use specific filters to narrow results. <strong>Sensitive data may appear in logs</strong> (passwords are masked, but other PII may be visible) - restrict access to authorized admins only. <strong>Logs do not capture database-level changes</strong> made outside the app - use database audit logs for full coverage."
        />

        {/* Summary Cards */}
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-6">
          <StatsCard
            title="Total Logs"
            value={data?.total || 0}
            icon={MdInfo}
            color="green"
          />
          <StatsCard
            title="Showing"
            value={data?.logs?.length || 0}
            icon={MdSearch}
            color="blue"
            badge={`Page ${data?.page || page}/${data?.totalPages || 1}`}
          />
          <StatsCard
            title="Filters"
            value={(search ? 1 : 0) + (actionFilter ? 1 : 0) + (entityFilter ? 1 : 0)}
            icon={MdFilterList}
            color="orange"
            badge={actionFilter || entityFilter || search ? "Filtered" : "All"}
          />
          <StatsCard
            title="Page Size"
            value={data?.limit || 50}
            icon={MdChevronRight}
            color="purple"
          />
        </div>

        {/* Filters */}
        <div className="rounded-2xl border border-border bg-card/75 p-4 shadow-lg shadow-black/5 backdrop-blur-xl dark:shadow-black/20 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search */}
            <div className="relative">
              <MdSearch
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                size={20}
              />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search logs..."
                className="w-full rounded-xl border-2 border-border bg-background/50 py-3 pl-10 pr-4 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-[hsl(var(--primary))] focus:ring-4 focus:ring-[hsl(var(--secondary))]/20 transition-all"
              />
            </div>

            {/* Action Filter */}
            <div className="relative">
              <MdFilterList
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                size={20}
              />
              <select
                value={actionFilter}
                onChange={(e) => {
                  setActionFilter(e.target.value);
                  setPage(1);
                }}
                className="w-full rounded-xl border-2 border-border bg-background/50 py-3 pl-10 pr-4 text-foreground focus:outline-none focus:border-[hsl(var(--primary))] focus:ring-4 focus:ring-[hsl(var(--secondary))]/20 transition-all appearance-none"
              >
                <option value="">All Actions</option>
                {uniqueActions.map((action) => (
                  <option key={action} value={action}>
                    {action.replace(/_/g, " ")}
                  </option>
                ))}
              </select>
            </div>

            {/* Entity Filter */}
            <div className="relative">
              <MdFilterList
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                size={20}
              />
              <select
                value={entityFilter}
                onChange={(e) => {
                  setEntityFilter(e.target.value);
                  setPage(1);
                }}
                className="w-full rounded-xl border-2 border-border bg-background/50 py-3 pl-10 pr-4 text-foreground focus:outline-none focus:border-[hsl(var(--primary))] focus:ring-4 focus:ring-[hsl(var(--secondary))]/20 transition-all appearance-none"
              >
                <option value="">All Entities</option>
                {uniqueEntities.map((entity) => (
                  <option key={entity} value={entity}>
                    {entity}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Stats Bar */}
        {data && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Logs</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {data.total.toLocaleString()}
              </p>
            </div>
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Current Page</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {data.page} / {data.totalPages}
              </p>
            </div>
            <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-4">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Showing</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {data.logs.length} logs
              </p>
            </div>
            <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-4">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Per Page</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{data.limit}</p>
            </div>
          </div>
        )}

        {/* Logs Table */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="w-12 h-12 border-4 border-green-600 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : data && data.logs.length > 0 ? (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Action
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Entity
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        User
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Timestamp
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Details
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {data.logs.map((log: any, idx: number) => (
                      <motion.tr
                        key={log.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.02 }}
                        className="hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer"
                        onClick={() => setSelectedLog(log)}
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            {getActionIcon(log.action)}
                            <span
                              className={`px-2 py-1 text-xs font-medium rounded-full ${getActionColor(
                                log.action
                              )}`}
                            >
                              {log.action.replace(/_/g, " ")}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm font-medium text-gray-900 dark:text-white">
                            {log.entity}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm">
                            <div className="font-medium text-gray-900 dark:text-white">
                              {log.User?.name || "System"}
                            </div>
                            <div className="text-gray-500 dark:text-gray-400 truncate max-w-xs">
                              {log.User?.email || log.userId}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-2 py-1 text-xs font-medium rounded-full ${
                              log.status === "success"
                                ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
                                : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300"
                            }`}
                          >
                            {log.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                          {format(new Date(log.createdAt), "MMM d, yyyy HH:mm:ss")}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <button className="text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300 font-medium">
                            View
                          </button>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Showing {(page - 1) * data.limit + 1} to{" "}
                  {Math.min(page * data.limit, data.total)} of {data.total} results
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPage(1)}
                    disabled={page === 1}
                    className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <MdFirstPage size={20} />
                  </button>
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <MdChevronLeft size={20} />
                  </button>
                  <span className="px-4 py-2 text-sm font-medium text-gray-900 dark:text-white">
                    {page} / {data.totalPages}
                  </span>
                  <button
                    onClick={() => setPage((p) => Math.min(data.totalPages, p + 1))}
                    disabled={page === data.totalPages}
                    className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <MdChevronRight size={20} />
                  </button>
                  <button
                    onClick={() => setPage(data.totalPages)}
                    disabled={page === data.totalPages}
                    className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <MdLastPage size={20} />
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-16">
              <MdInfo className="mx-auto text-gray-400 mb-4" size={48} />
              <p className="text-gray-600 dark:text-gray-400">No audit logs found</p>
            </div>
          )}
        </div>

        {/* Log Details Modal */}
        {selectedLog && (
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setSelectedLog(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden"
            >
              <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">Log Details</h3>
                <button
                  onClick={() => setSelectedLog(null)}
                  className="p-2 text-gray-600 hover:text-red-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-red-400 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  ✕
                </button>
              </div>
              <div className="p-6 overflow-y-auto max-h-[calc(80vh-80px)]">
                <dl className="space-y-4">
                  <div>
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      Action
                    </dt>
                    <dd className="mt-1">
                      <span className={`px-3 py-1 text-sm font-medium rounded-full ${getActionColor(selectedLog.action)}`}>
                        {selectedLog.action.replace(/_/g, " ")}
                      </span>
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      Entity
                    </dt>
                    <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                      {selectedLog.entity} {selectedLog.entityId && `(${selectedLog.entityId})`}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">User</dt>
                    <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                      {selectedLog.User?.name || "System"} ({selectedLog.User?.email || selectedLog.userId})
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      Timestamp
                    </dt>
                    <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                      {format(new Date(selectedLog.createdAt), "PPpp")}
                    </dd>
                  </div>
                  {selectedLog.changes && (
                    <div>
                      <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                        Changes
                      </dt>
                      <dd className="mt-1">
                        <pre className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg text-xs text-gray-900 dark:text-white overflow-x-auto">
                          {JSON.stringify(selectedLog.changes, null, 2)}
                        </pre>
                      </dd>
                    </div>
                  )}
                </dl>
              </div>
            </motion.div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
