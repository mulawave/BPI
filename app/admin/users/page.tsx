"use client";

import { useState, useEffect, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { api } from "@/client/trpc";
import {
  MdSearch,
  MdFilterList,
  MdPersonAdd,
  MdRefresh,
  MdEdit,
  MdDelete,
  MdCheckCircle,
  MdCancel,
  MdMoreVert,
  MdPeople,
  MdSync,
  MdCardMembership,
  MdInfo,
  MdExpandMore,
  MdExpandLess,
} from "react-icons/md";
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  type ColumnDef,
} from "@tanstack/react-table";
import toast from "react-hot-toast";
import { format } from "date-fns";
import UserDetailsModal from "@/components/admin/UserDetailsModal";
import UserEditModal from "@/components/admin/UserEditModal";
import AssignMembershipModal from "@/components/admin/AssignMembershipModal";
import ExportButton from "@/components/admin/ExportButton";
import BulkActionsBar from "@/components/admin/BulkActionsBar";
import StatsCard from "@/components/admin/StatsCard";
import { HiCheckCircle as HiCheck, HiXCircle, HiTrash, HiMail } from "react-icons/hi";

type User = {
  id: string;
  name: string | null;
  email: string | null;
  username: string | null;
  role: string;
  activated: boolean;
  verified: boolean;
  createdAt: Date;
  lastLogin: Date | null;
  wallet: number;
  spendable: number;
  bpiTokenWallet: number;
  level1Count: number;
  level2Count: number;
  level3Count: number;
  rank: string;
};

type SscUser = {
  id: string;
  firstname: string | null;
  lastname: string | null;
  email: string | null;
  membershipName: string | null;
  membershipActivatedAt: string | Date | null;
  membershipExpiresAt: string | Date | null;
  ssc: string | null;
  name?: string | null;
};

type MembershipExpiryRepairCandidate = {
  id: string;
  name: string | null;
  email: string | null;
  packageName: string;
  renewalCycleDays: number;
  membershipActivatedAt: string | Date | null;
  derivedMembershipExpiresAt: string | Date;
};

export default function UsersPage() {
  const searchParams = useSearchParams();
  const urlSearch = searchParams.get("search") ?? "";
  const [page, setPage] = useState(1);
  const [pageSize] = useState(50);
  const [search, setSearch] = useState(urlSearch);
  const [roleFilter, setRoleFilter] = useState<"user" | "admin" | "super_admin" | "customer_rep" | undefined>();
  const [activatedFilter, setActivatedFilter] = useState<boolean | undefined>();
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const [showFilters, setShowFilters] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [showActivateAllModal, setShowActivateAllModal] = useState(false);
  const [showSyncReferralModal, setShowSyncReferralModal] = useState(false);
  const [showBulkAssignModal, setShowBulkAssignModal] = useState(false);
  const [selectAllMode, setSelectAllMode] = useState<'page' | 'all' | 'none'>('none');
  const [showUserGuide, setShowUserGuide] = useState(false);

  // SSC state
  const [sscPage, setSscPage] = useState(1);
  const [sscSearch, setSscSearch] = useState("");
  const [editingSscUser, setEditingSscUser] = useState<SscUser | null>(null);
  const [sscInput, setSscInput] = useState("");

  const { data, isLoading, refetch, isFetching } = api.admin.getUsers.useQuery({
    page,
    pageSize,
    search: search || undefined,
    role: roleFilter,
    activated: activatedFilter,
    sortBy: "createdAt",
    sortOrder: "desc",
  }, {
    refetchOnWindowFocus: false,
    staleTime: 30000,
    gcTime: 300000,
  });

  useEffect(() => {
    setSearch(urlSearch);
  }, [urlSearch]);

  useEffect(() => {
    setPage(1);
  }, [search, roleFilter, activatedFilter]);

  useEffect(() => {
    setSscPage(1);
  }, [sscSearch]);

  const { data: sscSummary, refetch: refetchSscSummary, isFetching: isFetchingSsc } =
    api.admin.getSscSummary.useQuery(undefined, { refetchOnWindowFocus: false });

  const {
    data: sscUsers,
    refetch: refetchSscUsers,
    isFetching: isFetchingSscUsers,
  } = api.admin.getSscUsers.useQuery(
    { page: sscPage, search: sscSearch || undefined },
    { refetchOnWindowFocus: false }
  );

  const membershipResetOverview = api.admin.getMembershipResetOverview.useQuery(
    { windowDays: 14, limit: 25 },
    { refetchOnWindowFocus: false }
  );

  const membershipExpiryRepairOverview = api.admin.getMembershipExpiryRepairOverview.useQuery(
    { limit: 25 },
    { refetchOnWindowFocus: false }
  );

  const resetMembershipPlanMutation = api.admin.resetMembershipPlan.useMutation({
    onSuccess: () => {
      toast.success("Membership reset completed");
      membershipResetOverview.refetch();
      refetch();
    },
    onError: (error) => toast.error(error.message),
  });

  const autoResetExpiredMembershipsMutation = api.admin.autoResetExpiredMemberships.useMutation({
    onSuccess: (result) => {
      if (result.dryRun) {
        toast.success(`Dry run complete: ${result.matched} user(s) would be reset`);
      } else {
        toast.success(`Auto reset complete: ${result.reset} user(s) reset`);
      }
      membershipResetOverview.refetch();
      refetch();
    },
    onError: (error) => toast.error(error.message),
  });

  const backfillMembershipExpiryDatesMutation = api.admin.backfillMembershipExpiryDates.useMutation({
    onSuccess: (result) => {
      if (result.dryRun) {
        toast.success(`Repair preview complete: ${result.candidates?.length ?? 0} membership expiry date(s) can be restored`);
      } else {
        toast.success(`Membership expiry repair complete: ${result.repaired} user(s) updated`);
      }
      membershipExpiryRepairOverview.refetch();
      membershipResetOverview.refetch();
      refetch();
    },
    onError: (error) => toast.error(error.message),
  });

  const generateSscMutation = api.admin.generateSscForActiveMembers.useMutation({
    onSuccess: (res) => {
      toast.success(`Generated ${res.generated} SSC codes`);
      refetchSscSummary();
      refetchSscUsers();
    },
    onError: (error) => toast.error(error.message),
  });

  const stripSscMutation = api.admin.stripSsc.useMutation({
    onSuccess: () => {
      toast.success("SSC stripped successfully");
      refetchSscSummary();
      refetchSscUsers();
    },
    onError: (error) => toast.error(error.message),
  });

  const updateUserSscMutation = api.admin.updateUserSsc.useMutation({
    onSuccess: () => {
      toast.success("SSC updated");
      setEditingSscUser(null);
      setSscInput("");
      refetchSscSummary();
      refetchSscUsers();
    },
    onError: (error) => toast.error(error.message),
  });

  // Memoize row selection to prevent infinite re-renders
  const rowSelection = useMemo(() => {
    if (!data?.users) return {};
    return Object.fromEntries(
      data.users.map((user, idx) => [idx, selectedUsers.has(user.id)])
    );
  }, [data?.users, selectedUsers]);

  const activeFiltersCount =
    (search ? 1 : 0) + (roleFilter ? 1 : 0) + (activatedFilter !== undefined ? 1 : 0);

  const formatDate = (value?: string | Date | null) => {
    if (!value) return "—";
    return format(new Date(value), "MMM d, yyyy");
  };

  const describeRelativeDays = (value?: string | Date | null) => {
    if (!value) return "";
    const target = new Date(value);
    const now = new Date();
    const days = Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    if (days === 0) return "today";
    if (days > 0) return `in ${days}d`;
    return `${Math.abs(days)}d ago`;
  };

  const bulkUpdateMutation = api.admin.bulkUpdateUsers.useMutation({
    onSuccess: () => {
      toast.success("Users updated successfully");
      setSelectedUsers(new Set());
      setSelectAllMode('none');
      refetch();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const activateAllMutation = api.admin.activateAllUsers.useMutation({
    onSuccess: (data) => {
      toast.success(`Successfully activated ${data.count} users (${data.previousInactiveCount} were inactive)`);
      setShowActivateAllModal(false);
      setSelectedUsers(new Set());
      setSelectAllMode('none');
      refetch();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const syncReferralMutation = api.admin.syncReferralData.useMutation({
    onSuccess: (data) => {
      toast.success(`Synced ${data.created} referrals (${data.existingCount} existing, ${data.skipped} skipped)${data.errorCount > 0 ? `, ${data.errorCount} errors` : ''}`);
      setShowSyncReferralModal(false);
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const columns: ColumnDef<User>[] = [
    {
      id: "select",
      header: ({ table }) => (
        <input
          type="checkbox"
          checked={table.getIsAllRowsSelected()}
          onChange={table.getToggleAllRowsSelectedHandler()}
          className="w-4 h-4 text-green-600 rounded focus:ring-green-500"
        />
      ),
      cell: ({ row }) => (
        <input
          type="checkbox"
          checked={row.getIsSelected()}
          onChange={row.getToggleSelectedHandler()}
          className="w-4 h-4 text-green-600 rounded focus:ring-green-500"
        />
      ),
    },
    {
      accessorKey: "name",
      header: "Name",
      cell: ({ row }) => (
        <div className="flex flex-col">
          <span className="font-medium text-gray-900 dark:text-white">
            {row.original.name || "N/A"}
          </span>
          <span className="text-sm text-gray-500">{row.original.username}</span>
        </div>
      ),
    },
    {
      accessorKey: "email",
      header: "Email",
      cell: ({ row }) => (
        <span className="text-gray-700 dark:text-gray-300">{row.original.email}</span>
      ),
    },
    {
      accessorKey: "role",
      header: "Role",
      cell: ({ row }) => {
        const role = row.original.role;
        const colors = {
          user: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
          admin: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
          super_admin: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
        };
        return (
          <span
            className={`px-2 py-1 text-xs font-medium rounded-full ${
              colors[role as keyof typeof colors] || colors.user
            }`}
          >
            {role.replace("_", " ").toUpperCase()}
          </span>
        );
      },
    },
    {
      accessorKey: "activated",
      header: "Status",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          {row.original.activated ? (
            <MdCheckCircle className="text-green-500" size={18} />
          ) : (
            <MdCancel className="text-red-500" size={18} />
          )}
          <span className="text-sm text-gray-700 dark:text-gray-300">
            {row.original.activated ? "Active" : "Inactive"}
          </span>
        </div>
      ),
    },
    {
      accessorKey: "wallet",
      header: "Wallet",
      cell: ({ row }) => (
        <span className="text-gray-700 dark:text-gray-300">
          ₦{row.original.wallet.toLocaleString()}
        </span>
      ),
    },
    {
      accessorKey: "createdAt",
      header: "Joined",
      cell: ({ row }) => (
        <span className="text-sm text-gray-600 dark:text-gray-400">
          {format(new Date(row.original.createdAt), "MMM d, yyyy")}
        </span>
      ),
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => (
        <button
          onClick={() => {
            setSelectedUser(row.original);
            setShowDetailsModal(true);
          }}
          className="p-2 text-gray-600 hover:text-green-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-green-400 dark:hover:bg-gray-800 rounded-lg transition-colors"
        >
          <MdMoreVert size={20} />
        </button>
      ),
    },
  ];

  const table = useReactTable({
    data: data?.users || [],
    columns,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    enableRowSelection: true,
    onRowSelectionChange: (updater) => {
      const currentSelection = rowSelection;
      const newSelection =
        typeof updater === "function" ? updater(currentSelection) : updater;
      
      const selectedIds = new Set(
        Object.keys(newSelection)
          .filter((key) => newSelection[key])
          .map((idx) => data?.users[Number(idx)]?.id)
          .filter((id): id is string => Boolean(id))
      );
      setSelectedUsers(selectedIds);
    },
    state: {
      rowSelection,
    },
  });

  const handleBulkAction = (action: "activate" | "deactivate" | "delete") => {
    if (selectedUsers.size === 0) {
      toast.error("No users selected");
      return;
    }

    bulkUpdateMutation.mutate({
      userIds: Array.from(selectedUsers),
      action,
    });
  };

  const handleSelectAll = () => {
    if (selectAllMode === 'all' || selectAllMode === 'page') {
      // Deselect all
      setSelectedUsers(new Set());
      setSelectAllMode('none');
    } else {
      // Select all on current page
      const currentPageIds = new Set(data?.users.map(u => u.id) || []);
      setSelectedUsers(currentPageIds);
      setSelectAllMode('page');
    }
  };

  const handleSelectAllAcrossPages = () => {
    // This would select all user IDs across all pages
    // For now, we'll use the activate all functionality
    setShowActivateAllModal(true);
  };

  const handleActivateAll = () => {
    activateAllMutation.mutate({ confirmed: true });
  };

  return (
    <div className="min-h-screen pb-12">
      {/* Premium Background */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-40 -right-40 h-96 w-96 rounded-full bg-gradient-to-br from-[hsl(var(--secondary))] to-[hsl(var(--primary))] opacity-10 blur-3xl dark:opacity-5" />
        <div className="absolute bottom-0 -left-40 h-96 w-96 rounded-full bg-gradient-to-br from-[hsl(var(--primary))] to-[hsl(var(--secondary))] opacity-10 blur-3xl dark:opacity-5" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-7xl mx-auto space-y-6"
      >
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="relative overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-card via-[hsl(var(--muted))] to-card p-8 shadow-xl shadow-black/5 backdrop-blur-sm dark:shadow-black/20"
        >
          <div className="absolute -top-20 -right-20 h-40 w-40 rounded-full bg-gradient-to-br from-[hsl(var(--secondary))] to-[hsl(var(--primary))] opacity-10 blur-2xl" />
          <div className="relative flex items-center justify-between">
            <div className="flex items-center gap-4">
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", delay: 0.2 }}
                className="flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-[hsl(var(--primary))] to-[hsl(var(--secondary))] shadow-lg shadow-black/10"
              >
                <MdPeople className="h-8 w-8 text-white" />
              </motion.div>
              <div>
                <h1 className="premium-gradient-text text-4xl font-bold">
                  User Management
                </h1>
                <p className="text-muted-foreground mt-1 font-medium">
                  Manage all platform users, roles, and permissions
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <ExportButton
                type="users"
                filters={{
                  search: search || undefined,
                  role: roleFilter,
                  status: activatedFilter !== undefined ? (activatedFilter ? "active" : "inactive") : undefined,
                }}
              />
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowBulkAssignModal(true)}
                className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl shadow-lg font-semibold hover:from-purple-600 hover:to-pink-600 transition-all"
              >
                <MdCardMembership size={20} />
                <span>Bulk Assign</span>
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="premium-button flex items-center gap-2 px-5 py-2.5 text-white rounded-xl shadow-lg font-semibold"
              >
                <MdPersonAdd size={20} />
                <span>Add User</span>
              </motion.button>
            </div>
          </div>
        </motion.div>

        {/* User Guide */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.03 }}
          className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 rounded-2xl shadow-lg border-2 border-blue-200 dark:border-blue-800 overflow-hidden"
        >
          <button
            onClick={() => setShowUserGuide(!showUserGuide)}
            className="w-full px-6 py-4 flex items-center justify-between hover:bg-blue-100/50 dark:hover:bg-blue-900/20 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500 rounded-lg">
                <MdInfo className="w-6 h-6 text-white" />
              </div>
              <div className="text-left">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                  User Management Guide
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Click to {showUserGuide ? "hide" : "view"} features & instructions
                </p>
              </div>
            </div>
            {showUserGuide ? (
              <MdExpandLess className="w-6 h-6 text-gray-600 dark:text-gray-400" />
            ) : (
              <MdExpandMore className="w-6 h-6 text-gray-600 dark:text-gray-400" />
            )}
          </button>

          <AnimatePresence>
            {showUserGuide && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="border-t border-blue-200 dark:border-blue-800"
              >
                <div className="px-6 py-6 space-y-6">
                  {/* User Management Features */}
                  <div>
                    <h4 className="text-md font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                      <MdPeople className="w-5 h-5 text-blue-600" />
                      User Management Features
                    </h4>
                    <ul className="list-disc list-inside space-y-1 text-sm text-gray-700 dark:text-gray-300 ml-6">
                      <li>View all registered users with detailed information</li>
                      <li>Search users by name, email, or username</li>
                      <li>Filter by role (User, Admin, Super Admin)</li>
                      <li>Filter by activation status</li>
                      <li>Export user data to CSV or Excel</li>
                      <li>Paginated view for optimal performance</li>
                    </ul>
                  </div>

                  {/* User Actions */}
                  <div>
                    <h4 className="text-md font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                      <MdEdit className="w-5 h-5 text-green-600" />
                      User Actions
                    </h4>
                    <ul className="list-disc list-inside space-y-1 text-sm text-gray-700 dark:text-gray-300 ml-6">
                      <li><span className="font-semibold">View Details</span> - Click any row to see full user profile</li>
                      <li><span className="font-semibold">Edit User</span> - Modify user information, role, or status</li>
                      <li><span className="font-semibold">Delete User</span> - Permanently remove a user from the system</li>
                      <li><span className="font-semibold">Activate/Deactivate</span> - Enable or disable user accounts</li>
                      <li><span className="font-semibold">Assign Membership</span> - Grant membership packages to users</li>
                      <li><span className="font-semibold">Sync Referrals</span> - Update referral tree connections</li>
                    </ul>
                  </div>

                  {/* Bulk Operations */}
                  <div>
                    <h4 className="text-md font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                      <MdCardMembership className="w-5 h-5 text-purple-600" />
                      Bulk Operations
                    </h4>
                    <ul className="list-disc list-inside space-y-1 text-sm text-gray-700 dark:text-gray-300 ml-6">
                      <li>Select multiple users using checkboxes</li>
                      <li><span className="font-semibold">Bulk Assign</span> - Assign membership packages to selected users</li>
                      <li><span className="font-semibold">Bulk Activate</span> - Activate multiple users at once</li>
                      <li><span className="font-semibold">Bulk Delete</span> - Remove multiple users simultaneously</li>
                      <li>Select all on current page or all matching filter criteria</li>
                    </ul>
                  </div>

                  {/* Displayed Information */}
                  <div>
                    <h4 className="text-md font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                      <MdSearch className="w-5 h-5 text-orange-600" />
                      User Information Displayed
                    </h4>
                    <ul className="list-disc list-inside space-y-1 text-sm text-gray-700 dark:text-gray-300 ml-6">
                      <li>Name, email, username</li>
                      <li>Role and activation status</li>
                      <li>Wallet balances (NGN & BPTokens)</li>
                      <li>Spendable balance</li>
                      <li>Referral network size (Level 1, 2, 3 counts)</li>
                      <li>Current rank/level</li>
                      <li>Registration date and last login</li>
                    </ul>
                  </div>

                  {/* Features */}
                  <div className="pt-4 border-t border-blue-200 dark:border-blue-700">
                    <h4 className="text-md font-bold text-gray-900 dark:text-white mb-3">
                      ✨ Advanced Features
                    </h4>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        Real-time search & filtering
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        Export to CSV/Excel
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        Paginated data loading
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        Bulk operations
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        Detailed user modals
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        Dark mode support
                      </div>
                    </div>
                  </div>

                  {/* Pro Tip */}
                  <div className="bg-white dark:bg-bpi-dark-card rounded-lg p-4">
                    <h5 className="font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                      💡 Pro Tip
                    </h5>
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      Use the <span className="font-bold">search bar</span> for quick lookups, and combine <span className="font-bold">multiple filters</span> to narrow down specific user groups. 
                      The <span className="font-bold">Export button</span> respects your active filters, so you can export exactly the data you need.
                    </p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Summary Cards */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.06 }}
          className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4"
        >
          <StatsCard
            title="Total Users"
            value={data?.total || 0}
            icon={MdPeople}
            color="green"
          />
          <StatsCard
            title="Showing"
            value={data?.users?.length || 0}
            icon={MdSearch}
            color="blue"
            badge={`Page ${data?.currentPage || page}/${data?.pages || 1}`}
          />
          <StatsCard
            title="Active Filters"
            value={activeFiltersCount}
            icon={MdFilterList}
            color="orange"
            badge={activeFiltersCount > 0 ? "Filtered" : "All"}
          />
          <StatsCard
            title="Selected"
            value={selectedUsers.size}
            icon={MdCheckCircle}
            color="purple"
          />
        </motion.div>

        {/* SSC issuance panel */}
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08 }}
          className="mt-5 grid grid-cols-1"
        >
          <div className="premium-stat-card relative overflow-hidden rounded-2xl border border-border bg-card/80 p-6 shadow-xl shadow-black/5 backdrop-blur-sm dark:shadow-black/20">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-2 text-sm font-semibold text-muted-foreground">
                  <MdCardMembership className="text-teal-500" size={18} />
                  SSC issuance
                  {isFetchingSsc && <span className="text-xs text-muted-foreground">· Refreshing</span>}
                </div>
                <h3 className="text-2xl font-bold text-foreground mb-1">
                  {sscSummary?.pending ?? 0} pending
                </h3>
                <p className="text-sm text-muted-foreground">
                  Active members: {sscSummary?.totalActive ?? 0} · With SSC: {sscSummary?.activeWithCodes ?? 0}
                </p>
              </div>

              <button
                onClick={() => generateSscMutation.mutate()}
                disabled={generateSscMutation.isPending || (sscSummary?.pending ?? 0) === 0}
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-500 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-emerald-500/25 transition hover:shadow-emerald-500/35 disabled:opacity-60"
              >
                {generateSscMutation.isPending ? (
                  <span className="flex items-center gap-2">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Generating...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <MdSync size={16} />
                    Generate SSC for active members
                  </span>
                )}
              </button>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-3 text-sm text-muted-foreground sm:grid-cols-3">
              <div className="rounded-lg bg-muted/60 px-4 py-3">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Pending</p>
                <p className="text-lg font-semibold text-foreground">{sscSummary?.pending ?? 0}</p>
              </div>
              <div className="rounded-lg bg-muted/60 px-4 py-3">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">With SSC</p>
                <p className="text-lg font-semibold text-foreground">{sscSummary?.activeWithCodes ?? 0}</p>
              </div>
              <div className="rounded-lg bg-muted/60 px-4 py-3">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Active members</p>
                <p className="text-lg font-semibold text-foreground">{sscSummary?.totalActive ?? 0}</p>
              </div>
            </div>

            {isFetchingSsc && (
              <div className="mt-3 text-xs text-muted-foreground">Refreshing SSC stats...</div>
            )}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.095 }}
          className="mt-4 premium-stat-card relative overflow-hidden rounded-2xl border border-border bg-card/80 p-6 shadow-xl shadow-black/5 backdrop-blur-sm dark:shadow-black/20"
        >
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
                <MdCheckCircle className="text-emerald-500" size={18} /> Membership expiry repair
              </p>
              <h3 className="text-xl font-bold text-foreground">
                {membershipExpiryRepairOverview.data?.summary?.repairableCount ?? 0} repairable membership record{(membershipExpiryRepairOverview.data?.summary?.repairableCount ?? 0) === 1 ? "" : "s"}
              </h3>
              <p className="text-sm text-muted-foreground">
                Restore missing expiry dates from the activation date plus the membership renewal cycle.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => membershipExpiryRepairOverview.refetch()}
                disabled={membershipExpiryRepairOverview.isFetching}
                className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm font-semibold text-foreground hover:bg-muted/60 disabled:opacity-60"
              >
                <MdRefresh size={16} className={membershipExpiryRepairOverview.isFetching ? "animate-spin" : ""} />
                Refresh
              </button>
              <button
                onClick={() => backfillMembershipExpiryDatesMutation.mutate({ dryRun: true, limit: 200 })}
                disabled={backfillMembershipExpiryDatesMutation.isPending}
                className="inline-flex items-center gap-2 rounded-lg border border-blue-300 bg-blue-50 px-3 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-100 disabled:opacity-60 dark:border-blue-900/60 dark:bg-blue-900/20 dark:text-blue-300"
              >
                {backfillMembershipExpiryDatesMutation.isPending ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" /> : <MdInfo size={16} />}
                Dry run repair
              </button>
              <button
                onClick={() => backfillMembershipExpiryDatesMutation.mutate({ dryRun: false, limit: 200 })}
                disabled={backfillMembershipExpiryDatesMutation.isPending}
                className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 px-3 py-2 text-sm font-semibold text-white shadow-lg shadow-emerald-500/20 hover:from-emerald-700 hover:to-teal-700 disabled:opacity-60"
              >
                {backfillMembershipExpiryDatesMutation.isPending ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" /> : <MdSync size={16} />}
                Backfill missing expiries
              </button>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="rounded-xl bg-muted/60 px-4 py-3">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Missing expiry</p>
              <p className="text-lg font-semibold text-foreground">{membershipExpiryRepairOverview.data?.summary?.missingExpiryCount ?? 0}</p>
            </div>
            <div className="rounded-xl bg-muted/60 px-4 py-3">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Repairable now</p>
              <p className="text-lg font-semibold text-foreground">{membershipExpiryRepairOverview.data?.summary?.repairableCount ?? 0}</p>
            </div>
            <div className="rounded-xl bg-muted/60 px-4 py-3">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Missing activation date</p>
              <p className="text-lg font-semibold text-foreground">{membershipExpiryRepairOverview.data?.summary?.unrecoverableCount ?? 0}</p>
            </div>
          </div>

          <div className="mt-4 overflow-x-auto rounded-xl border border-border">
            <table className="min-w-full divide-y divide-border">
              <thead className="bg-muted/60 text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 text-left">User</th>
                  <th className="px-4 py-3 text-left">Package</th>
                  <th className="px-4 py-3 text-left">Activated</th>
                  <th className="px-4 py-3 text-left">Derived expiry</th>
                  <th className="px-4 py-3 text-left">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border text-sm">
                {membershipExpiryRepairOverview.data?.candidates?.length ? (
                  membershipExpiryRepairOverview.data.candidates.map((candidate: MembershipExpiryRepairCandidate) => (
                    <tr key={candidate.id} className="hover:bg-muted/40 transition">
                      <td className="px-4 py-3 text-foreground">
                        <p className="font-semibold">{candidate.name || "Unnamed user"}</p>
                        <p className="text-xs text-muted-foreground">{candidate.email || "No email"}</p>
                      </td>
                      <td className="px-4 py-3 text-foreground">
                        <p>{candidate.packageName}</p>
                        <p className="text-xs text-muted-foreground">{candidate.renewalCycleDays} day cycle</p>
                      </td>
                      <td className="px-4 py-3 text-foreground">{formatDate(candidate.membershipActivatedAt)}</td>
                      <td className="px-4 py-3 text-foreground">
                        {formatDate(candidate.derivedMembershipExpiresAt)}
                        <span className="ml-2 text-xs font-semibold text-emerald-600 dark:text-emerald-400">{describeRelativeDays(candidate.derivedMembershipExpiresAt)}</span>
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => backfillMembershipExpiryDatesMutation.mutate({ dryRun: false, userId: candidate.id })}
                          disabled={backfillMembershipExpiryDatesMutation.isPending}
                          className="inline-flex items-center gap-2 rounded-lg border border-emerald-300 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-100 disabled:opacity-60 dark:border-emerald-900/60 dark:bg-emerald-900/20 dark:text-emerald-300"
                        >
                          {backfillMembershipExpiryDatesMutation.isPending ? <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" /> : <MdCheckCircle size={14} />}
                          Backfill now
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="px-4 py-6 text-center text-muted-foreground">
                      {membershipExpiryRepairOverview.isFetching ? "Loading repair candidates..." : "No repairable missing expiry dates found."}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </motion.div>

        {/* Membership expiry tracking and reset panel */}
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.09 }}
          className="mt-4 premium-stat-card relative overflow-hidden rounded-2xl border border-border bg-card/80 p-6 shadow-xl shadow-black/5 backdrop-blur-sm dark:shadow-black/20"
        >
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
                <MdCardMembership className="text-rose-500" size={18} /> Membership reset governance
              </p>
              <h3 className="text-xl font-bold text-foreground">
                {membershipResetOverview.data?.summary?.dueResetCount ?? 0} expired membership{(membershipResetOverview.data?.summary?.dueResetCount ?? 0) === 1 ? "" : "s"}
              </h3>
              <p className="text-sm text-muted-foreground">
                Track expiring plans and trigger manual or automated reset actions.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => membershipResetOverview.refetch()}
                disabled={membershipResetOverview.isFetching}
                className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm font-semibold text-foreground hover:bg-muted/60 disabled:opacity-60"
              >
                <MdRefresh size={16} className={membershipResetOverview.isFetching ? "animate-spin" : ""} />
                Refresh
              </button>
              <button
                onClick={() => autoResetExpiredMembershipsMutation.mutate({ dryRun: true, limit: 200 })}
                disabled={autoResetExpiredMembershipsMutation.isPending}
                className="inline-flex items-center gap-2 rounded-lg border border-blue-300 bg-blue-50 px-3 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-100 disabled:opacity-60 dark:border-blue-900/60 dark:bg-blue-900/20 dark:text-blue-300"
              >
                {autoResetExpiredMembershipsMutation.isPending ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" /> : <MdInfo size={16} />}
                Dry run auto reset
              </button>
              <button
                onClick={() => autoResetExpiredMembershipsMutation.mutate({ dryRun: false, limit: 200 })}
                disabled={autoResetExpiredMembershipsMutation.isPending}
                className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-rose-600 to-orange-600 px-3 py-2 text-sm font-semibold text-white shadow-lg shadow-rose-500/20 hover:from-rose-700 hover:to-orange-700 disabled:opacity-60"
              >
                {autoResetExpiredMembershipsMutation.isPending ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" /> : <MdSync size={16} />}
                Execute auto reset
              </button>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-4">
            <div className="rounded-xl bg-muted/60 px-4 py-3">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Expired</p>
              <p className="text-lg font-semibold text-foreground">{membershipResetOverview.data?.summary?.expiredCount ?? 0}</p>
            </div>
            <div className="rounded-xl bg-muted/60 px-4 py-3">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Expiring soon (14d)</p>
              <p className="text-lg font-semibold text-foreground">{membershipResetOverview.data?.summary?.expiringSoonCount ?? 0}</p>
            </div>
            <div className="rounded-xl bg-muted/60 px-4 py-3">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">No expiry date</p>
              <p className="text-lg font-semibold text-foreground">{membershipResetOverview.data?.summary?.noExpiryCount ?? 0}</p>
            </div>
            <div className="rounded-xl bg-muted/60 px-4 py-3">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Due reset</p>
              <p className="text-lg font-semibold text-foreground">{membershipResetOverview.data?.summary?.dueResetCount ?? 0}</p>
            </div>
          </div>

          <div className="mt-4 overflow-x-auto rounded-xl border border-border">
            <table className="min-w-full divide-y divide-border">
              <thead className="bg-muted/60 text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 text-left">User</th>
                  <th className="px-4 py-3 text-left">Package</th>
                  <th className="px-4 py-3 text-left">Expired</th>
                  <th className="px-4 py-3 text-left">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border text-sm">
                {membershipResetOverview.data?.dueResetUsers?.length ? (
                  membershipResetOverview.data.dueResetUsers.map((user: any) => (
                    <tr key={user.id} className="hover:bg-muted/40 transition">
                      <td className="px-4 py-3 text-foreground">
                        <p className="font-semibold">{user.name || "Unnamed user"}</p>
                        <p className="text-xs text-muted-foreground">{user.email || "No email"}</p>
                      </td>
                      <td className="px-4 py-3 text-foreground">{user.packageName || "Unknown"}</td>
                      <td className="px-4 py-3 text-foreground">
                        {user.membershipExpiresAt ? formatDate(user.membershipExpiresAt) : "-"}
                        {typeof user.daysExpired === "number" && (
                          <span className="ml-2 text-xs font-semibold text-rose-600 dark:text-rose-400">{user.daysExpired}d ago</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => resetMembershipPlanMutation.mutate({ userId: user.id })}
                          disabled={resetMembershipPlanMutation.isPending}
                          className="inline-flex items-center gap-2 rounded-lg border border-rose-300 bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-100 disabled:opacity-60 dark:border-rose-900/60 dark:bg-rose-900/20 dark:text-rose-300"
                        >
                          {resetMembershipPlanMutation.isPending ? <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-rose-500 border-t-transparent" /> : <MdCancel size={14} />}
                          Reset membership
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="px-4 py-6 text-center text-muted-foreground">
                      {membershipResetOverview.isFetching ? "Loading reset candidates..." : "No expired memberships found for reset."}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </motion.div>

        {/* SSC holders table */}
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mt-4 premium-stat-card relative overflow-hidden rounded-2xl border border-border bg-card/80 p-6 shadow-xl shadow-black/5 backdrop-blur-sm dark:shadow-black/20"
        >
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
                <MdCardMembership className="text-teal-500" size={18} /> Users with SSC
              </p>
              <h3 className="text-xl font-bold text-foreground">
                {sscUsers?.total ?? 0} users
              </h3>
            </div>
            <div className="relative w-full sm:w-80">
              <MdSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
              <input
                type="text"
                value={sscSearch}
                onChange={(e) => setSscSearch(e.target.value)}
                placeholder="Search by name, email, or SSC"
                className="w-full rounded-xl border-2 border-border bg-background/60 pl-10 pr-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-[hsl(var(--primary))] focus:outline-none focus:ring-4 focus:ring-[hsl(var(--secondary))]/20"
              />
            </div>
          </div>

          <div className="mt-4 overflow-x-auto rounded-xl border border-border">
            <table className="min-w-full divide-y divide-border">
              <thead className="bg-muted/60 text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 text-left">First name</th>
                  <th className="px-4 py-3 text-left">Last name</th>
                  <th className="px-4 py-3 text-left">Email</th>
                  <th className="px-4 py-3 text-left">Membership plan</th>
                  <th className="px-4 py-3 text-left">Start</th>
                  <th className="px-4 py-3 text-left">End</th>
                  <th className="px-4 py-3 text-left">SSC</th>
                  <th className="px-4 py-3 text-left">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border text-sm">
                {sscUsers?.users?.length ? (
                  sscUsers.users.map((u) => (
                    <tr key={u.id} className="hover:bg-muted/40 transition">
                      <td className="px-4 py-3 text-foreground">{u.firstname || "-"}</td>
                      <td className="px-4 py-3 text-foreground">{u.lastname || "-"}</td>
                      <td className="px-4 py-3 text-foreground">{u.email || "-"}</td>
                      <td className="px-4 py-3 text-foreground">{u.membershipName || ""}</td>
                      <td className="px-4 py-3 text-foreground">{u.membershipActivatedAt ? format(new Date(u.membershipActivatedAt), "MMM d, yyyy") : "-"}</td>
                      <td className="px-4 py-3 text-foreground">{u.membershipExpiresAt ? format(new Date(u.membershipExpiresAt), "MMM d, yyyy") : "-"}</td>
                      <td className="px-4 py-3 font-semibold text-foreground">{u.ssc}</td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-2">
                          <button
                            onClick={() => stripSscMutation.mutate({ userId: u.id })}
                            disabled={stripSscMutation.isPending}
                            className="inline-flex items-center gap-1 rounded-lg border border-border px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 disabled:opacity-60"
                          >
                            <MdDelete size={16} /> Strip SSC
                          </button>
                          <button
                            onClick={() => {
                              setEditingSscUser(u);
                              setSscInput(u.ssc || "");
                            }}
                            className="inline-flex items-center gap-1 rounded-lg border border-border px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-muted/60"
                          >
                            <MdEdit size={16} /> Edit SSC
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={8} className="px-4 py-6 text-center text-muted-foreground">
                      {isFetchingSscUsers ? "Loading SSC users..." : "No users with SSC found."}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between text-sm text-muted-foreground">
            <div>
              Page {sscUsers?.currentPage || 1} of {sscUsers?.pages || 1} · {sscUsers?.total || 0} total
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setSscPage((p) => Math.max(1, p - 1))}
                disabled={sscPage <= 1 || isFetchingSscUsers}
                className="rounded-lg border border-border px-3 py-1.5 text-foreground disabled:opacity-50"
              >
                Prev
              </button>
              <button
                onClick={() => {
                  const nextPage = (sscUsers?.currentPage || 1) + 1;
                  if (sscUsers && nextPage <= (sscUsers.pages || 1)) setSscPage(nextPage);
                }}
                disabled={isFetchingSscUsers || (sscUsers?.currentPage || 1) >= (sscUsers?.pages || 1)}
                className="rounded-lg border border-border px-3 py-1.5 text-foreground disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        </motion.div>

        {/* Search and Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="relative overflow-hidden rounded-2xl border border-border bg-card/75 backdrop-blur-xl shadow-lg shadow-black/5 dark:shadow-black/20 p-6"
        >
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative group">
              <MdSearch
                className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-[hsl(var(--primary))] transition-colors"
                size={20}
              />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name, email, or username..."
                className="w-full pl-11 pr-4 py-3 border-2 border-border rounded-xl bg-background/50 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-[hsl(var(--primary))] focus:ring-4 focus:ring-[hsl(var(--secondary))]/20 transition-all"
              />
            </div>

            {/* Filter Toggle */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 px-5 py-3 border-2 border-border rounded-xl hover:bg-background/60 transition-all font-medium"
            >
              <MdFilterList size={20} />
              <span>Filters</span>
            </motion.button>

            {/* Refresh */}
            <motion.button
              whileHover={{ scale: 1.02, rotate: 180 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => refetch()}
              className="flex items-center gap-2 px-5 py-3 border-2 border-border rounded-xl hover:bg-background/60 transition-all font-medium"
            >
              <MdRefresh size={20} />
              <span>Refresh</span>
            </motion.button>
          </div>

          {/* Filters Panel */}
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6 pt-6 border-t border-gray-200 dark:border-gray-700"
            >
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Role
                </label>
                <select
                  value={roleFilter || ""}
                  onChange={(e) =>
                    setRoleFilter(
                      e.target.value as "user" | "admin" | "super_admin" | "customer_rep" | undefined
                    )
                  }
                  className="w-full px-4 py-2.5 border-2 border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 transition-all"
                >
                  <option value="">All Roles</option>
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                  <option value="super_admin">Super Admin</option>
                  <option value="customer_rep">Customer Rep</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Status
                </label>
                <select
                  value={activatedFilter === undefined ? "" : String(activatedFilter)}
                  onChange={(e) =>
                    setActivatedFilter(
                      e.target.value === "" ? undefined : e.target.value === "true"
                    )
                  }
                  className="w-full px-4 py-2.5 border-2 border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 transition-all"
                >
                  <option value="">All Status</option>
                  <option value="true">Active</option>
                  <option value="false">Inactive</option>
                </select>
              </div>

              <div className="flex items-end">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    setRoleFilter(undefined);
                    setActivatedFilter(undefined);
                    setSearch("");
                  }}
                  className="w-full px-4 py-2.5 text-gray-700 dark:text-gray-300 border-2 border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 font-medium transition-all"
                >
                  Clear Filters
                </motion.button>
              </div>
            </motion.div>
          )}
        </motion.div>

        {/* Global Actions Bar */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-2xl border border-border bg-card/75 backdrop-blur-xl shadow-lg shadow-black/5 dark:shadow-black/20 p-5 flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleSelectAll}
              className="px-4 py-2.5 border-2 border-border rounded-xl hover:bg-background/60 transition-all font-semibold flex items-center gap-2"
            >
              <MdCheckCircle size={18} />
              {selectAllMode === 'none' ? 'Select All on Page' : 'Deselect All'}
            </motion.button>
            <span className="text-muted-foreground text-sm">
              {selectedUsers.size > 0 && `${selectedUsers.size} selected`}
            </span>
          </div>
          <div className="flex gap-3">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowActivateAllModal(true)}
              className="px-5 py-2.5 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:from-green-700 hover:to-emerald-700 shadow-lg shadow-green-500/30 font-semibold transition-all flex items-center gap-2"
            >
              <MdCheckCircle size={18} />
              Activate All Users
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowSyncReferralModal(true)}
              className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 shadow-lg shadow-blue-500/30 font-semibold transition-all flex items-center gap-2"
            >
              <MdSync size={18} />
              Sync Referral Data
            </motion.button>
          </div>
        </motion.div>

        {/* Bulk Actions */}
        {selectedUsers.size > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative overflow-hidden rounded-2xl border border-blue-200/50 bg-gradient-to-r from-blue-50 via-blue-50/50 to-emerald-50/30 dark:from-blue-950/30 dark:via-blue-900/20 dark:to-emerald-950/20 dark:border-blue-900/30 p-5 flex items-center justify-between backdrop-blur-sm shadow-lg shadow-blue-500/10"
          >
            <div className="absolute -top-10 -left-10 h-32 w-32 rounded-full bg-gradient-to-br from-blue-500 to-emerald-500 opacity-10 blur-2xl" />
            <div className="relative flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white font-bold shadow-lg shadow-blue-500/30">
                {selectedUsers.size}
              </div>
              <span className="text-blue-900 dark:text-blue-200 font-semibold text-lg">
                user{selectedUsers.size > 1 ? "s" : ""} selected
              </span>
            </div>
            <div className="flex gap-3">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleBulkAction("activate")}
                className="px-5 py-2.5 bg-green-600 text-white rounded-xl hover:bg-green-700 shadow-lg shadow-green-500/30 font-semibold transition-all"
              >
                Activate Selected
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleBulkAction("deactivate")}
                className="px-5 py-2.5 bg-orange-600 text-white rounded-xl hover:bg-orange-700 shadow-lg shadow-orange-500/30 font-semibold transition-all"
              >
                Deactivate
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleBulkAction("delete")}
                className="px-5 py-2.5 bg-red-600 text-white rounded-xl hover:bg-red-700 shadow-lg shadow-red-500/30 font-semibold flex items-center gap-2 transition-all"
              >
                <MdDelete size={18} />
                Delete
              </motion.button>
            </div>
          </motion.div>
        )}

        {/* Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="relative overflow-hidden rounded-2xl border border-gray-200/50 bg-white/80 backdrop-blur-xl shadow-xl dark:border-gray-800/50 dark:bg-green-900/30/80"
        >
          <div className="absolute -top-20 right-1/4 h-40 w-40 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 opacity-5 blur-3xl" />
          <div className="relative overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-gray-50 to-gray-100/50 dark:from-gray-900 dark:to-gray-800/50 border-b-2 border-gray-200 dark:border-gray-700">
                {table.getHeaderGroups().map((headerGroup) => (
                  <tr key={headerGroup.id}>
                    {headerGroup.headers.map((header) => (
                      <th
                        key={header.id}
                        className="px-6 py-4 text-left text-xs font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wider"
                      >
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )}
                      </th>
                    ))}
                  </tr>
                ))}
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {isLoading || isFetching ? (
                  <tr>
                    <td colSpan={columns.length} className="px-6 py-16 text-center">
                      <div className="flex flex-col items-center gap-4">
                        <div className="relative">
                          <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-500 to-emerald-500 opacity-20 blur-xl animate-pulse" />
                          <div className="relative w-12 h-12 border-4 border-blue-200 dark:border-blue-900 border-t-blue-600 dark:border-t-blue-400 rounded-full animate-spin" />
                        </div>
                        <p className="text-gray-500 dark:text-gray-400 font-medium">
                          {isLoading ? "Loading users..." : "Switching page..."}
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : table.getRowModel().rows.length === 0 ? (
                  <tr>
                    <td
                      colSpan={columns.length}
                      className="px-6 py-16 text-center"
                    >
                      <div className="flex flex-col items-center gap-3">
                        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-100 dark:bg-gray-800">
                          <MdPeople className="h-8 w-8 text-gray-400" />
                        </div>
                        <p className="text-gray-500 dark:text-gray-400 font-medium">No users found</p>
                        <p className="text-sm text-gray-400 dark:text-gray-500">Try adjusting your search or filters</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  table.getRowModel().rows.map((row, idx) => (
                    <motion.tr
                      key={row.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.03 }}
                      whileHover={{ backgroundColor: "rgba(59, 130, 246, 0.05)" }}
                      className="transition-colors border-b border-gray-50 dark:border-gray-800/50"
                    >
                      {row.getVisibleCells().map((cell) => (
                        <td key={cell.id} className="px-6 py-4 whitespace-nowrap">
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </td>
                      ))}
                    </motion.tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {data && data.pages > 1 && (
            <div className="px-6 py-5 border-t-2 border-gray-200 dark:border-gray-700 bg-gradient-to-r from-gray-50/50 to-transparent dark:from-gray-900/50 flex items-center justify-between">
              <div className="text-sm text-gray-700 dark:text-gray-300 font-medium">
                Showing <span className="font-bold text-blue-600 dark:text-blue-400">{(page - 1) * pageSize + 1}</span> to{" "}
                <span className="font-bold text-blue-600 dark:text-blue-400">{Math.min(page * pageSize, data.total)}</span> of{" "}
                <span className="font-bold text-blue-600 dark:text-blue-400">{data.total}</span> users
                {isFetching && <span className="ml-2 text-blue-500 animate-pulse">Loading...</span>}
              </div>
              <div className="flex gap-2">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setPage(page - 1)}
                  disabled={page === 1 || isFetching}
                  className="px-5 py-2.5 border-2 border-gray-200 dark:border-gray-700 rounded-xl hover:bg-white dark:hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed font-semibold transition-all shadow-sm"
                >
                  {isFetching ? "..." : "Previous"}
                </motion.button>
                <div className="flex items-center px-4 py-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
                  Page {page} of {data.pages}
                </div>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setPage(page + 1)}
                  disabled={page >= data.pages || isFetching}
                  className="px-5 py-2.5 border-2 border-gray-200 dark:border-gray-700 rounded-xl hover:bg-white dark:hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed font-semibold transition-all shadow-sm"
                >
                  {isFetching ? "..." : "Next"}
                </motion.button>
              </div>
            </div>
          )}
        </motion.div>

        {/* Modals */}
        {selectedUser && (
          <>
            <UserDetailsModal
              userId={selectedUser.id}
              isOpen={showDetailsModal}
              onClose={() => {
                setShowDetailsModal(false);
                setSelectedUser(null);
              }}
              onEdit={(userId) => {
                setShowDetailsModal(false);
                setEditingUserId(userId);
                setShowEditModal(true);
              }}
            />
            <UserEditModal
              userId={editingUserId || selectedUser.id}
              isOpen={showEditModal}
              onClose={() => {
                setShowEditModal(false);
                setEditingUserId(null);
              }}
              onSuccess={() => {
                refetch();
                setShowEditModal(false);
                setEditingUserId(null);
              }}
            />
          </>
        )}

        {/* Activate All Confirmation Modal */}
        {showActivateAllModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-md mx-4"
            >
              <div className="relative overflow-hidden rounded-2xl border border-border bg-card shadow-2xl">
                <div className="absolute -top-20 -right-20 h-40 w-40 rounded-full bg-gradient-to-br from-green-500 to-emerald-500 opacity-10 blur-3xl" />
                
                <div className="relative p-6">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-green-600 to-emerald-600 text-white shadow-lg">
                      <MdCheckCircle size={28} />
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-foreground">Activate All Users</h3>
                      <p className="text-sm text-muted-foreground">Global activation action</p>
                    </div>
                  </div>

                  <div className="space-y-4 mb-6">
                    <div className="rounded-xl bg-yellow-50 dark:bg-yellow-950/30 border border-yellow-200 dark:border-yellow-900/50 p-4">
                      <p className="text-sm font-semibold text-yellow-800 dark:text-yellow-200 mb-2">
                        ⚠️ Warning: This is a global action
                      </p>
                      <p className="text-xs text-yellow-700 dark:text-yellow-300">
                        This will activate ALL inactive users in the entire database, regardless of filters or pagination.
                      </p>
                    </div>

                    <div className="rounded-xl bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-900/50 p-4">
                      <p className="text-sm font-medium text-green-800 dark:text-green-200">
                        This action will:
                      </p>
                      <ul className="mt-2 space-y-1 text-xs text-green-700 dark:text-green-300">
                        <li className="flex items-center gap-2">
                          <MdCheckCircle className="text-green-600" />
                          Activate all currently inactive users
                        </li>
                        <li className="flex items-center gap-2">
                          <MdCheckCircle className="text-green-600" />
                          Log the action in audit trail
                        </li>
                        <li className="flex items-center gap-2">
                          <MdCheckCircle className="text-green-600" />
                          Cannot be undone (requires manual deactivation)
                        </li>
                      </ul>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setShowActivateAllModal(false)}
                      className="flex-1 px-4 py-3 border-2 border-border rounded-xl hover:bg-muted font-semibold transition-all"
                    >
                      Cancel
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleActivateAll}
                      disabled={activateAllMutation.isPending}
                      className="flex-1 px-4 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:from-green-700 hover:to-emerald-700 shadow-lg shadow-green-500/30 font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {activateAllMutation.isPending ? (
                        <>
                          <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                          Activating...
                        </>
                      ) : (
                        <>
                          <MdCheckCircle size={18} />
                          Confirm & Activate All
                        </>
                      )}
                    </motion.button>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}

        {/* Sync Referral Data Modal */}
        {showSyncReferralModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-md mx-4"
            >
              <div className="relative overflow-hidden rounded-2xl border border-border bg-card shadow-2xl">
                <div className="absolute -top-20 -right-20 h-40 w-40 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 opacity-10 blur-3xl" />
                
                <div className="relative p-6">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-lg">
                      <MdSync size={28} />
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-foreground">Sync Referral Data</h3>
                      <p className="text-sm text-muted-foreground">Rebuild referral records</p>
                    </div>
                  </div>

                  <div className="space-y-4 mb-6">
                    <div className="rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 p-4">
                      <p className="text-sm font-semibold text-red-800 dark:text-red-200 mb-2">
                        ⚠️ Warning: Data will be rebuilt
                      </p>
                      <p className="text-xs text-red-700 dark:text-red-300">
                        This will truncate and rebuild the entire Referral table based on User.sponsorId relationships.
                      </p>
                    </div>

                    <div className="rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/50 p-4">
                      <p className="text-sm font-medium text-blue-800 dark:text-blue-200">
                        This action will:
                      </p>
                      <ul className="mt-2 space-y-1 text-xs text-blue-700 dark:text-blue-300">
                        <li className="flex items-center gap-2">
                          <MdSync className="text-blue-600" />
                          Delete all existing referral records
                        </li>
                        <li className="flex items-center gap-2">
                          <MdSync className="text-blue-600" />
                          Recreate records from sponsorId data
                        </li>
                        <li className="flex items-center gap-2">
                          <MdSync className="text-blue-600" />
                          Sync admin panel with user dashboard
                        </li>
                        <li className="flex items-center gap-2">
                          <MdSync className="text-blue-600" />
                          Log the action in audit trail
                        </li>
                      </ul>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setShowSyncReferralModal(false)}
                      className="flex-1 px-4 py-3 border-2 border-border rounded-xl hover:bg-muted font-semibold transition-all"
                    >
                      Cancel
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => syncReferralMutation.mutate({ confirmed: true })}
                      disabled={syncReferralMutation.isPending}
                      className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 shadow-lg shadow-blue-500/30 font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {syncReferralMutation.isPending ? (
                        <>
                          <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                          Syncing...
                        </>
                      ) : (
                        <>
                          <MdSync size={18} />
                          Confirm & Sync
                        </>
                      )}
                    </motion.button>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}

        {/* Edit SSC Modal */}
        {editingSscUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
            <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl">
              <h3 className="text-lg font-semibold text-foreground mb-2">Edit SSC</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Update SSC for {editingSscUser.firstname || editingSscUser.lastname || editingSscUser.email || "user"}.
              </p>
              <div className="space-y-2">
                <label className="text-xs font-semibold text-muted-foreground">SSC (format: XXX-XXXX-XXX)</label>
                <input
                  value={sscInput}
                  onChange={(e) => setSscInput(e.target.value.toUpperCase())}
                  placeholder="ABC-1234-XYZ"
                  className="w-full rounded-xl border-2 border-border bg-background/70 px-3 py-2 text-foreground focus:border-[hsl(var(--primary))] focus:outline-none focus:ring-4 focus:ring-[hsl(var(--secondary))]/20"
                />
              </div>
              <div className="mt-5 flex justify-end gap-3">
                <button
                  onClick={() => {
                    setEditingSscUser(null);
                    setSscInput("");
                  }}
                  className="rounded-lg border border-border px-4 py-2 text-sm font-semibold text-foreground hover:bg-muted/60"
                  disabled={updateUserSscMutation.isPending}
                >
                  Cancel
                </button>
                <button
                  onClick={() => updateUserSscMutation.mutate({ userId: editingSscUser.id, ssc: sscInput })}
                  disabled={updateUserSscMutation.isPending}
                  className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-teal-500 to-emerald-500 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-emerald-500/30 disabled:opacity-60"
                >
                  {updateUserSscMutation.isPending ? (
                    <span className="flex items-center gap-2">
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      Saving...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <MdEdit size={16} />
                      Save SSC
                    </span>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Bulk Assignment Modal */}
        <AssignMembershipModal
          isOpen={showBulkAssignModal}
          onClose={() => setShowBulkAssignModal(false)}
          onSuccess={() => {
            refetch();
            setShowBulkAssignModal(false);
          }}
          mode="bulk"
        />

        {/* Bulk Actions Bar */}
        <BulkActionsBar
          selectedCount={selectedUsers.size}
          onClear={() => {
            setSelectedUsers(new Set());
            setSelectAllMode('none');
          }}
          actions={[
            {
              label: "Activate",
              icon: HiCheck,
              variant: "success",
              onClick: () => handleBulkAction("activate"),
              confirmMessage: `Activate ${selectedUsers.size} user(s)?`,
            },
            {
              label: "Deactivate",
              icon: HiXCircle,
              variant: "warning",
              onClick: () => handleBulkAction("deactivate"),
              confirmMessage: `Deactivate ${selectedUsers.size} user(s)?`,
            },
            {
              label: "Delete",
              icon: HiTrash,
              variant: "danger",
              onClick: () => handleBulkAction("delete"),
              confirmMessage: `Permanently delete ${selectedUsers.size} user(s)? This action cannot be undone!`,
            },
          ]}
        />
      </motion.div>
    </div>
  );
}
