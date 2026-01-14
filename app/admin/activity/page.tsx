"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { MdFilterList, MdSearch, MdCalendarToday, MdFileDownload, MdContentCopy } from "react-icons/md";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { api } from "@/client/trpc";

type Filters = {
  action?: string;
  entity?: string;
  status?: string;
  userId?: string;
  search?: string;
  dateFrom?: string;
  dateTo?: string;
};

export default function AdminActivityPage() {
  const router = useRouter();
  const [filters, setFilters] = React.useState<Filters>({});
  const [cursor, setCursor] = React.useState<string | undefined>(undefined);
  const [items, setItems] = React.useState<any[]>([]);

  const { data, isFetching, refetch, error } = api.admin.getRecentActivity.useQuery(
    { limit: 20, cursor, ...filters }
  );

  React.useEffect(() => {
    if (error) {
      toast.error((error as any)?.message || "Failed to load activity");
    }
  }, [error]);

  React.useEffect(() => {
    if (data?.items) {
      // If cursor exists, append; else replace
      setItems((prev) => (cursor ? [...prev, ...data.items] : data.items));
    }
  }, [data, cursor]);

  const onApplyFilters = () => {
    setCursor(undefined);
    setItems([]);
    refetch();
  };

  const onLoadMore = () => {
    if (data?.nextCursor) setCursor(data.nextCursor);
  };

  // Export CSV hook (disabled until triggered)
  const exportQuery = api.admin.exportAuditLogsToCSV.useQuery(
    { filters },
    { enabled: false }
  );

  const onExportCSV = async () => {
    const res = await exportQuery.refetch();
    if (res.data?.data) {
      const blob = new Blob([res.data.data], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = res.data.filename || "audit-logs.csv";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast.success(`Exported ${res.data.count} records`);
    } else {
      toast.error("Export failed");
    }
  };

  const onCopyResults = async () => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(items, null, 2));
      toast.success("Results copied to clipboard");
    } catch (e) {
      toast.error("Copy failed");
    }
  };

  return (
    <div className="min-h-screen space-y-6 pb-12">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
        className="relative overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-card via-[hsl(var(--muted))] to-card p-6 shadow-xl backdrop-blur-sm">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="premium-gradient-text text-2xl font-bold">Activity: View All</h1>
            <p className="text-sm text-muted-foreground">Audit logs with filters, search, and pagination</p>
          </div>
        </div>
      </motion.div>

      {/* Filters */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.05 }}
        className="relative overflow-hidden rounded-2xl border border-border bg-card/75 backdrop-blur-xl shadow-xl">
        <div className="relative p-4 grid gap-3 md:grid-cols-6">
          <div className="flex items-center gap-2 md:col-span-2">
            <MdSearch className="h-5 w-5 text-muted-foreground" />
            <input
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-[hsl(var(--accent))]"
              placeholder="Search (action/entity/id)"
              value={filters.search || ""}
              onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))}
            />
          </div>
          <div className="md:col-span-1">
            <select
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
              value={filters.action || ""}
              onChange={(e) => setFilters((f) => ({ ...f, action: e.target.value || undefined }))}
            >
              <option value="">Action</option>
              <option value="UPDATE_USER">UPDATE_USER</option>
              <option value="BULK_UPDATE_ROLES">BULK_UPDATE_ROLES</option>
              <option value="PAYMENT_APPROVE">PAYMENT_APPROVE</option>
              <option value="PAYMENT_REJECT">PAYMENT_REJECT</option>
              <option value="CREATE_PACKAGE">CREATE_PACKAGE</option>
              <option value="UPDATE_PACKAGE">UPDATE_PACKAGE</option>
            </select>
          </div>
          <div className="md:col-span-1">
            <select
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
              value={filters.entity || ""}
              onChange={(e) => setFilters((f) => ({ ...f, entity: e.target.value || undefined }))}
            >
              <option value="">Entity</option>
              <option value="User">User</option>
              <option value="PendingPayment">PendingPayment</option>
              <option value="MembershipPackage">MembershipPackage</option>
              <option value="CommunityUpdate">CommunityUpdate</option>
              <option value="BestDeal">BestDeal</option>
            </select>
          </div>
          <div className="md:col-span-1">
            <select
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
              value={filters.status || ""}
              onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value || undefined }))}
            >
              <option value="">Status</option>
              <option value="success">success</option>
              <option value="error">error</option>
            </select>
          </div>
          <div className="flex items-center gap-2 md:col-span-1">
            <MdCalendarToday className="h-5 w-5 text-muted-foreground" />
            <input
              type="date"
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
              value={filters.dateFrom || ""}
              onChange={(e) => setFilters((f) => ({ ...f, dateFrom: e.target.value }))}
            />
          </div>
          <div className="flex items-center gap-2 md:col-span-1">
            <MdCalendarToday className="h-5 w-5 text-muted-foreground" />
            <input
              type="date"
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
              value={filters.dateTo || ""}
              onChange={(e) => setFilters((f) => ({ ...f, dateTo: e.target.value }))}
            />
          </div>

          <div className="md:col-span-6 flex items-center justify-end gap-2">
            <button
              onClick={() => setFilters({})}
              className="inline-flex items-center gap-2 rounded-md border border-border bg-background px-3 py-2 text-sm hover:bg-muted"
            >
              Reset
            </button>
            <button
              onClick={onApplyFilters}
              className="inline-flex items-center gap-2 rounded-md bg-[hsl(var(--primary))] px-3 py-2 text-sm text-white hover:opacity-90"
            >
              <MdFilterList className="h-4 w-4" /> Apply Filters
            </button>
          </div>
        </div>
      </motion.div>

      {/* Results */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.1 }}
        className="relative overflow-hidden rounded-2xl border border-border bg-card/75 backdrop-blur-xl shadow-xl">
        <div className="relative">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Time</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Action</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Entity</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">User</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Status</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Details</th>
                </tr>
              </thead>
              <tbody>
                {items.map((row) => (
                  <tr key={row.id} className="border-t border-border">
                    <td className="px-4 py-3">{new Date(row.createdAt).toLocaleString()}</td>
                    <td className="px-4 py-3 font-medium">{row.action}</td>
                    <td className="px-4 py-3">
                      <button
                        className="text-[hsl(var(--primary))] hover:underline"
                        onClick={() => {
                          const id = row.entityId;
                          const entity = (row.entity || "").toString();
                          const routeMap: Record<string, string> = {
                            User: "/admin/users",
                            PendingPayment: "/admin/payments",
                            MembershipPackage: "/admin/packages",
                            CommunityUpdate: "/admin/community",
                            BestDeal: "/admin/deals",
                          };
                          const base = routeMap[entity] || "/admin";
                          router.push(id ? `${base}?id=${id}` : base);
                        }}
                      >
                        {row.entity} {row.entityId ? `#${row.entityId}` : ""}
                      </button>
                    </td>
                    <td className="px-4 py-3">{row.User?.name || row.User?.email || row.userId}</td>
                    <td className="px-4 py-3">{row.status}</td>
                    <td className="px-4 py-3"><pre className="max-w-[40ch] whitespace-pre-wrap break-words text-xs text-muted-foreground">{row.changes}</pre></td>
                  </tr>
                ))}
                {isFetching && (
                  <tr>
                    <td colSpan={6} className="px-4 py-3">
                      <div className="h-6 w-full animate-pulse rounded bg-muted" />
                    </td>
                  </tr>
                )}
                {!isFetching && items.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-6 text-center text-muted-foreground">No activity found for the selected filters.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
        <div className="flex items-center justify-between border-t border-border p-4 gap-2">
          <span className="text-xs text-muted-foreground">{items.length} records</span>
          <div className="flex items-center gap-2">
            <button
              onClick={onCopyResults}
              className="inline-flex items-center gap-2 rounded-md border border-border bg-background px-3 py-2 text-sm hover:bg-muted"
            >
              <MdContentCopy className="h-4 w-4" /> Copy Results
            </button>
            <button
              onClick={onExportCSV}
              className="inline-flex items-center gap-2 rounded-md border border-border bg-background px-3 py-2 text-sm hover:bg-muted"
            >
              <MdFileDownload className="h-4 w-4" /> Export CSV
            </button>
            <button
              disabled={!data?.nextCursor || isFetching}
              onClick={onLoadMore}
              className="inline-flex items-center gap-2 rounded-md border border-border bg-background px-3 py-2 text-sm hover:bg-muted disabled:opacity-50"
            >
              Load More
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
