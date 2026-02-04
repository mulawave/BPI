"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { api } from "@/client/trpc";
import toast from "react-hot-toast";
import {
  Users,
  DollarSign,
  TrendingUp,
  Calendar,
  Search,
  UserPlus,
  UserMinus,
  ArrowRight,
  Activity,
  Wallet,
  BarChart3,
  Info,
  ChevronDown,
  ChevronUp,
  CheckCircle,
} from "lucide-react";
import CompanyReserveModal from "@/components/revenue/CompanyReserveModal";
import RevenueSplitChart from "@/components/revenue/RevenueSplitChart";
import ExecutiveBreakdownChart from "@/components/revenue/ExecutiveBreakdownChart";
import RevenueBySourceChart from "@/components/revenue/RevenueBySourceChart";
import RevenueTrendChart from "@/components/revenue/RevenueTrendChart";
import AllocationTimeline from "@/components/revenue/AllocationTimeline";
import AuditTrailModal from "@/components/revenue/AuditTrailModal";
import GovernancePowers from "@/components/revenue/GovernancePowers";
import SnapshotManager from "@/components/revenue/SnapshotManager";
import RevenueSourcesBreakdown from "@/components/revenue/RevenueSourcesBreakdown";
import ExecutiveWithdrawalModal from "@/components/revenue/ExecutiveWithdrawalModal";

export default function RevenuePoolsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const [selectedPool, setSelectedPool] = useState<string | null>(null);
  const [showReserveModal, setShowReserveModal] = useState(false);
  const [showAuditTrail, setShowAuditTrail] = useState(false);
  const [showUserGuide, setShowUserGuide] = useState(false);
  const [showWithdrawalModal, setShowWithdrawalModal] = useState(false);
  const [selectedShareholder, setSelectedShareholder] = useState<any>(null);

  // Queries
  const { data: stats, isLoading: statsLoading, refetch: refetchStats } = api.revenue.getDashboardStats.useQuery();
  const { data: shareholders, isLoading: shareholdersLoading, refetch: refetchShareholders } = api.revenue.getExecutiveShareholders.useQuery();
  const { data: pools, isLoading: poolsLoading, refetch: refetchPools } = api.revenue.getStrategicPools.useQuery();
  const { data: searchResults } = api.revenue.searchUsers.useQuery(
    { query: searchQuery },
    { enabled: searchQuery.length >= 2 }
  );

  // Analytics queries
  const { data: revenueBySource } = api.revenue.getRevenueBySource.useQuery({ days: 30 });
  const { data: revenueTrend } = api.revenue.getRevenueTrend.useQuery({ days: 30 });
  const { data: allocations } = api.revenue.getAllocations.useQuery({ limit: 50 });

  // Mutations
  const assignExecutive = api.revenue.assignExecutiveRole.useMutation({
    onSuccess: () => {
      toast.success("Executive role assigned successfully");
      refetchShareholders();
      setSelectedRole(null);
      setSearchQuery("");
    },
    onError: (error: any) => toast.error(error.message),
  });

  const removeExecutive = api.revenue.removeExecutiveRole.useMutation({
    onSuccess: () => {
      toast.success("Executive removed successfully");
      refetchShareholders();
    },
    onError: (error: any) => toast.error(error.message),
  });

  const addPoolMember = api.revenue.addPoolMember.useMutation({
    onSuccess: () => {
      toast.success("Member added to pool successfully");
      refetchPools();
      setSelectedPool(null);
      setSearchQuery("");
    },
    onError: (error: any) => toast.error(error.message),
  });

  const removePoolMember = api.revenue.removePoolMember.useMutation({
    onSuccess: () => {
      toast.success("Member removed from pool");
      refetchPools();
    },
    onError: (error: any) => toast.error(error.message),
  });

  const distributePool = api.revenue.distributePool.useMutation({
    onSuccess: (data) => {
      toast.success(
        `Distributed ₦${data.totalAmount.toLocaleString()} to ${data.memberCount} members`
      );
      refetchPools();
      refetchStats();
    },
    onError: (error: any) => toast.error(error.message),
  });

  const executiveRoles = [
    { role: "CEO", percentage: 30, color: "bg-purple-500" },
    { role: "CTO", percentage: 20, color: "bg-blue-500" },
    { role: "HEAD_OF_TRAVEL", percentage: 20, color: "bg-green-500" },
    { role: "CMO", percentage: 10, color: "bg-orange-500" },
    { role: "OLIVER", percentage: 5, color: "bg-pink-500" },
    { role: "MORRISON", percentage: 5, color: "bg-indigo-500" },
    { role: "ANNIE", percentage: 10, color: "bg-teal-500" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-800 dark:text-white flex items-center gap-3">
                <Activity className="w-8 h-8 text-green-600" />
                Revenue Pools & Allocation
              </h1>
              <p className="text-slate-600 dark:text-slate-300 mt-2">
                Manage revenue distribution (50/30/20 split)
              </p>
            </div>
          </div>
        </div>

        {/* User Guide */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 rounded-2xl shadow-lg border-2 border-blue-200 dark:border-blue-800 overflow-hidden"
        >
          <button
            onClick={() => setShowUserGuide(!showUserGuide)}
            className="w-full px-6 py-4 flex items-center justify-between hover:bg-blue-100/50 dark:hover:bg-blue-900/20 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500 rounded-lg">
                <Info className="w-6 h-6 text-white" />
              </div>
              <div className="text-left">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                  User Guide & Feature Overview
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Click to {showUserGuide ? "hide" : "view"} detailed instructions
                </p>
              </div>
            </div>
            {showUserGuide ? (
              <ChevronUp className="w-6 h-6 text-gray-600 dark:text-gray-400" />
            ) : (
              <ChevronDown className="w-6 h-6 text-gray-600 dark:text-gray-400" />
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
                  {/* Revenue Split Model */}
                  <div>
                    <h4 className="text-md font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      Revenue Split Model (50/30/20)
                    </h4>
                    <ul className="list-disc list-inside space-y-1 text-sm text-gray-700 dark:text-gray-300 ml-6">
                      <li><strong>Company Reserve (50%):</strong> Held for operational expenses, approved spending tracked in audit trail</li>
                      <li><strong>Executive Pool (30%):</strong> Distributed among 7 executive roles based on assigned percentages</li>
                      <li><strong>Strategic Pools (20%):</strong> 5 pools at 4% each (Leadership, State, Directors, Technology, Investors)</li>
                      <li>All revenue is automatically allocated using this split when transactions occur</li>
                    </ul>
                  </div>

                  {/* Executive Management */}
                  <div>
                    <h4 className="text-md font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                      <Users className="w-5 h-5 text-purple-600" />
                      Executive Shareholders Management
                    </h4>
                    <ul className="list-disc list-inside space-y-1 text-sm text-gray-700 dark:text-gray-300 ml-6">
                      <li>Assign users to 7 executive roles (CEO 30%, CTO 20%, Head of Travel 20%, etc.)</li>
                      <li>Each role has a fixed percentage of the 30% executive pool</li>
                      <li>Search for users by name, email, or username</li>
                      <li>Track total earned, current balance, and last distribution date</li>
                      <li>Remove executives when roles change - balance is preserved</li>
                    </ul>
                  </div>

                  {/* Strategic Pools */}
                  <div>
                    <h4 className="text-md font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                      <Wallet className="w-5 h-5 text-orange-600" />
                      Strategic Pools Management
                    </h4>
                    <ul className="list-disc list-inside space-y-1 text-sm text-gray-700 dark:text-gray-300 ml-6">
                      <li>5 pools: Leadership, State, Directors, Technology, Investors (4% each)</li>
                      <li>Add/remove members to pools - funds distributed equally among members</li>
                      <li>Distribute pool funds with one click - splits balance evenly</li>
                      <li>Track pool balance, member count, and last distribution</li>
                      <li>Members can be in multiple pools simultaneously</li>
                    </ul>
                  </div>

                  {/* Company Reserve */}
                  <div>
                    <h4 className="text-md font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                      <DollarSign className="w-5 h-5 text-blue-600" />
                      Company Reserve (50%)
                    </h4>
                    <ul className="list-disc list-inside space-y-1 text-sm text-gray-700 dark:text-gray-300 ml-6">
                      <li>Click the Company Reserve card to open fullscreen management modal</li>
                      <li>View balance, pending approvals, and complete transaction history</li>
                      <li>Record spending with category, description, and receipt upload</li>
                      <li>Filter transactions by type, category, and date range</li>
                      <li>Export transaction history to CSV for accounting</li>
                    </ul>
                  </div>

                  {/* Revenue Analytics */}
                  <div>
                    <h4 className="text-md font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                      <BarChart3 className="w-5 h-5 text-indigo-600" />
                      Revenue Analytics & Charts
                    </h4>
                    <ul className="list-disc list-inside space-y-1 text-sm text-gray-700 dark:text-gray-300 ml-6">
                      <li><strong>Revenue Split Chart:</strong> Pie chart showing 50/30/20 distribution</li>
                      <li><strong>Executive Breakdown:</strong> Bar chart of executive earnings by role</li>
                      <li><strong>Revenue by Source:</strong> Pie chart of 11 revenue streams</li>
                      <li><strong>Revenue Trend:</strong> Line chart tracking revenue over time</li>
                      <li><strong>Allocation Timeline:</strong> Recent allocation history with filters</li>
                      <li>Click revenue source cards to view detailed transaction breakdowns</li>
                    </ul>
                  </div>

                  {/* Governance Powers */}
                  <div>
                    <h4 className="text-md font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                      <Activity className="w-5 h-5 text-red-600" />
                      Governance Powers (Admin Only)
                    </h4>
                    <ul className="list-disc list-inside space-y-1 text-sm text-gray-700 dark:text-gray-300 ml-6">
                      <li><strong>Manual Revenue Allocation:</strong> Allocate from Company Reserve to executives/pools bypassing normal flow</li>
                      <li><strong>Inter-Pool Transfers:</strong> Move funds between Company Reserve and Strategic Pools</li>
                      <li><strong>Adjust Percentages:</strong> Warning modal - requires developer to modify database percentages</li>
                      <li>All governance actions are logged in audit trail with timestamp and admin ID</li>
                      <li>Requires detailed reason (minimum 10 characters) for compliance</li>
                    </ul>
                  </div>

                  {/* Monthly Snapshots */}
                  <div>
                    <h4 className="text-md font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                      <Calendar className="w-5 h-5 text-purple-600" />
                      Monthly Snapshots
                    </h4>
                    <ul className="list-disc list-inside space-y-1 text-sm text-gray-700 dark:text-gray-300 ml-6">
                      <li>Create historical snapshots of all revenue data for any month/year</li>
                      <li>Captures total revenue, allocation breakdowns, and revenue by source</li>
                      <li>Export snapshots to CSV for reporting and compliance</li>
                      <li>View up to 12 recent snapshots in grid layout</li>
                      <li>Snapshots are immutable once created - prevents data tampering</li>
                    </ul>
                  </div>

                  {/* Audit Trail */}
                  <div>
                    <h4 className="text-md font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-green-600" />
                      Audit Trail & Compliance
                    </h4>
                    <ul className="list-disc list-inside space-y-1 text-sm text-gray-700 dark:text-gray-300 ml-6">
                      <li>Click "View Audit Trail" button to open fullscreen audit modal</li>
                      <li>Every admin action is logged with timestamp, admin name, and details</li>
                      <li>Filter by action type, date range, and search by keyword</li>
                      <li>Actions tracked: assign/remove executives, pool operations, spending, transfers</li>
                      <li>Export audit logs to CSV for compliance reporting</li>
                    </ul>
                  </div>

                  {/* Revenue Sources */}
                  <div>
                    <h4 className="text-md font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                      <DollarSign className="w-5 h-5 text-green-600" />
                      11 Revenue Streams
                    </h4>
                    <div className="grid grid-cols-2 gap-2 text-sm text-gray-700 dark:text-gray-300 ml-6">
                      <div>1. Community Support (CSP)</div>
                      <div>2. Membership Registration</div>
                      <div>3. Membership Renewal</div>
                      <div>4. BPI Store</div>
                      <div>5. Withdrawal Fees</div>
                      <div>6. YouTube Subscriptions</div>
                      <div>7. Third Party Services</div>
                      <div>8. Palliative Program</div>
                      <div>9. Leadership Pool Fee</div>
                      <div>10. Training Center</div>
                      <div>11. Other Sources</div>
                    </div>
                  </div>

                  {/* Best Practices */}
                  <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                    <h4 className="text-md font-bold text-yellow-900 dark:text-yellow-100 mb-2 flex items-center gap-2">
                      ⚠️ Best Practices & Warnings
                    </h4>
                    <ul className="list-disc list-inside space-y-1 text-sm text-yellow-800 dark:text-yellow-200 ml-4">
                      <li>Always provide detailed reasons for manual allocations and transfers</li>
                      <li>Review audit trail regularly for compliance and accountability</li>
                      <li>Create monthly snapshots at end of each month for historical records</li>
                      <li>Do not change percentages without thorough testing and approval</li>
                      <li>Verify executive/pool assignments before distributing large amounts</li>
                    </ul>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Dashboard Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-gradient-to-br from-green-500 to-green-600 text-white rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm">Total Revenue</p>
                <p className="text-2xl font-bold mt-1">
                  ₦{stats?.totalRevenue.toLocaleString() || "0"}
                </p>
              </div>
              <DollarSign className="w-12 h-12 opacity-20" />
            </div>
          </div>

          <button
            onClick={() => setShowReserveModal(true)}
            className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-xl p-6 hover:from-blue-600 hover:to-blue-700 transition-all text-left w-full"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm">Company Reserve (50%)</p>
                <p className="text-2xl font-bold mt-1">
                  ₦{stats?.companyReserve.toLocaleString() || "0"}
                </p>
                <p className="text-xs text-blue-200 mt-1">Click to manage</p>
              </div>
              <Wallet className="w-12 h-12 opacity-20" />
            </div>
          </button>

          <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-sm">Executive Pending (30%)</p>
                <p className="text-2xl font-bold mt-1">
                  ₦{stats?.executivePoolPending.toLocaleString() || "0"}
                </p>
              </div>
              <Users className="w-12 h-12 opacity-20" />
            </div>
          </div>

          <div className="bg-gradient-to-br from-orange-500 to-orange-600 text-white rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-100 text-sm">Strategic Pools (20%)</p>
                <p className="text-2xl font-bold mt-1">
                  ₦
                  {stats?.strategicPools
                    .reduce((sum: any, p: any) => sum + p.balance, 0)
                    .toLocaleString() || "0"}
                </p>
              </div>
              <TrendingUp className="w-12 h-12 opacity-20" />
            </div>
          </div>
        </div>

        {/* Executive Shareholders (30% Pool) */}
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
              <Users className="w-6 h-6 text-purple-600" />
              Executive Shareholders (30%)
            </h2>
            <div className="text-sm text-slate-600 dark:text-slate-300">
              Distributed daily at 8:00 AM
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {executiveRoles.map((role) => {
              const assigned = shareholders?.find((s: any) => s.role === role.role);
              return (
                <div
                  key={role.role}
                  className="border border-slate-200 dark:border-slate-700 rounded-lg p-4"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${role.color}`} />
                      <span className="font-semibold text-slate-800 dark:text-white">
                        {role.role.replace(/_/g, " ")}
                      </span>
                    </div>
                    <span className="text-sm font-medium text-slate-600 dark:text-slate-300">
                      {role.percentage}%
                    </span>
                  </div>

                  {assigned?.User ? (
                    <div className="space-y-2">
                      <div className="text-sm text-slate-700 dark:text-slate-200">
                        <div className="font-medium">{assigned.User?.name || "No name"}</div>
                        <div className="text-xs text-slate-500">
                          {assigned.User?.email || "No email"}
                        </div>
                      </div>
                      
                      {/* Wallet Balances */}
                      <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-3 space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-600 dark:text-slate-300">Current Balance</span>
                          <span className="font-semibold text-green-600 dark:text-green-400">
                            ₦{Number((assigned as any).currentBalance || 0).toLocaleString()}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-600 dark:text-slate-300">Total Earned</span>
                          <span className="font-medium text-slate-700 dark:text-slate-200">
                            ₦{Number((assigned as any).totalEarned || 0).toLocaleString()}
                          </span>
                        </div>
                        {(assigned as any).lastDistributionAt && (
                          <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-200 dark:border-slate-600">
                            <span className="text-slate-600 dark:text-slate-300">Last Distribution</span>
                            <span className="text-slate-500">
                              {new Date((assigned as any).lastDistributionAt).toLocaleDateString()}
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            setSelectedShareholder(assigned);
                            setShowWithdrawalModal(true);
                          }}
                          disabled={Number((assigned as any).currentBalance || 0) <= 0}
                          className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/30 text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <Wallet className="w-4 h-4" />
                          Withdraw
                        </button>
                        <button
                          onClick={() => {
                            if (window.confirm(`Remove ${assigned.User?.name || "this user"} from ${role.role.replace(/_/g, ' ')} role?`)) {
                              removeExecutive.mutate({ role: role.role as any });
                            }
                          }}
                          className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 text-sm transition-colors"
                        >
                          <UserMinus className="w-4 h-4" />
                          Remove
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => setSelectedRole(role.role)}
                      className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/30 text-sm transition-colors"
                    >
                      <UserPlus className="w-4 h-4" />
                      Assign User
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Strategic Pools (20% - 4% each) */}
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
              <TrendingUp className="w-6 h-6 text-orange-600" />
              Strategic Pools (20%)
            </h2>
            <div className="text-sm text-slate-600 dark:text-slate-300">
              4% each • On-demand distribution
            </div>
          </div>

          {poolsLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-slate-600 dark:text-slate-300">Loading pools...</div>
            </div>
          ) : !pools || pools.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <TrendingUp className="w-16 h-16 text-slate-300 dark:text-slate-600 mb-4" />
              <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-2">
                No Strategic Pools Found
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-300 mb-4">
                Pools need to be initialized. Run the seed script to create the 5 strategic pools.
              </p>
              <code className="px-3 py-2 bg-slate-100 dark:bg-slate-700 rounded text-xs">
                npx tsx scripts/seedRevenuePools.ts
              </code>
            </div>
          ) : (
            <div className="space-y-4">
              {pools.map((pool: any) => (
              <div
                key={pool.id}
                className="border border-slate-200 dark:border-slate-700 rounded-lg p-4"
              >
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-slate-800 dark:text-white">
                      {pool.type} Pool
                    </h3>
                    <div className="flex items-center gap-4 mt-1">
                      <span className="text-sm text-slate-600 dark:text-slate-300">
                        {pool.Members?.length || 0} members
                      </span>
                      <span className="text-sm font-medium text-green-600 dark:text-green-400">
                        ₦{Number(pool.balance || 0).toLocaleString()} available
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setSelectedPool(pool.type)}
                      className="px-4 py-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 text-sm transition-colors"
                    >
                      <UserPlus className="w-4 h-4 inline mr-1" />
                      Add Member
                    </button>
                    {pool.balance > 0 && (pool.Members?.length || 0) > 0 && (
                      <button
                        onClick={() => {
                          if (window.confirm(`Are you sure you want to distribute the ${pool.type} pool? This will distribute ₦${Number(pool.balance).toLocaleString()} to ${pool.Members?.length || 0} members.`)) {
                            distributePool.mutate({ poolType: pool.type as any });
                          }
                        }}
                        disabled={distributePool.isPending}
                        className="px-4 py-2 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/30 text-sm transition-colors disabled:opacity-50"
                      >
                        <ArrowRight className="w-4 h-4 inline mr-1" />
                        Distribute
                      </button>
                    )}
                  </div>
                </div>

                {(pool.Members?.length || 0) > 0 && (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {pool.Members?.map((member: any) => (
                      <div
                        key={member.id}
                        className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-3 space-y-2"
                      >
                        <div className="flex items-start justify-between">
                          <div className="text-sm flex-1">
                            <div className="font-medium text-slate-800 dark:text-white">
                              {member.User?.name || "No name"}
                            </div>
                            <div className="text-xs text-slate-500">
                              {member.User?.email || "No email"}
                            </div>
                          </div>
                          <button
                            onClick={() => {
                              if (window.confirm(`Remove ${member.User?.name || "this member"} from ${pool.type} pool?`)) {
                                removePoolMember.mutate({ memberId: member.id });
                              }
                            }}
                            className="p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                          >
                            <UserMinus className="w-4 h-4" />
                          </button>
                        </div>
                        
                        {/* Member Wallet Info */}
                        <div className="bg-white dark:bg-slate-800 rounded px-2 py-1.5 space-y-0.5">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-slate-600 dark:text-slate-400">Balance</span>
                            <span className="font-semibold text-green-600 dark:text-green-400">
                              ₦{Number(member.currentBalance || 0).toLocaleString()}
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-slate-600 dark:text-slate-400">Total Earned</span>
                            <span className="text-slate-700 dark:text-slate-300">
                              ₦{Number(member.totalEarned || 0).toLocaleString()}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
            </div>
          )}
        </div>

        {/* Analytics & Charts Section */}
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
              <BarChart3 className="w-6 h-6 text-blue-600" />
              Revenue Analytics
            </h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Revenue Split Pie Chart */}
            {stats && (
              <RevenueSplitChart
                companyReserve={stats.companyReserve}
                executivePool={stats.executivePoolPending}
                strategicPools={stats.strategicPools.reduce((sum: any, p: any) => sum + p.balance, 0)}
              />
            )}

            {/* Executive Breakdown Chart */}
            {shareholders && <ExecutiveBreakdownChart shareholders={shareholders as any} />}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Revenue by Source Chart */}
            {revenueBySource && <RevenueBySourceChart data={revenueBySource} />}

            {/* Revenue Trend Chart */}
            {revenueTrend && <RevenueTrendChart data={revenueTrend} />}
          </div>

          {/* Allocation Timeline */}
          {allocations && <AllocationTimeline allocations={allocations as any} />}
        </div>

        {/* Governance Powers */}
        <GovernancePowers />

        {/* Revenue Sources Breakdown */}
        <RevenueSourcesBreakdown />

        {/* Snapshot Manager */}
        <SnapshotManager />

        {/* Audit Trail Button */}
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-1">
                System Audit Trail
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                View complete log of all administrative actions
              </p>
            </div>
            <button
              onClick={() => setShowAuditTrail(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              <Activity size={18} />
              View Audit Trail
            </button>
          </div>
        </div>

        {/* User Search Modal */}
        {(selectedRole || selectedPool) && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl max-w-md w-full p-6">
              <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-4">
                {selectedRole ? `Assign ${selectedRole.replace(/_/g, " ")}` : `Add to ${selectedPool} Pool`}
              </h3>

              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search by name, email, or username..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-800 dark:text-white focus:ring-2 focus:ring-green-500"
                />
              </div>

              {searchResults && searchResults.length > 0 ? (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {searchResults.map((user: any) => (
                    <button
                      key={user.id}
                      onClick={() => {
                        if (selectedRole) {
                          assignExecutive.mutate({
                            role: selectedRole as any,
                            userId: user.id,
                          });
                        } else if (selectedPool) {
                          addPoolMember.mutate({
                            poolType: selectedPool as any,
                            userId: user.id,
                          });
                        }
                      }}
                      className="w-full text-left p-3 bg-slate-50 dark:bg-slate-700 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-600 transition-colors"
                    >
                      <div className="font-medium text-slate-800 dark:text-white">
                        {user.name}
                      </div>
                      <div className="text-sm text-slate-500">
                        {user.email} • @{user.username}
                      </div>
                    </button>
                  ))}
                </div>
              ) : searchQuery.length >= 2 ? (
                <div className="text-center py-8 text-slate-500">
                  No users found
                </div>
              ) : (
                <div className="text-center py-8 text-slate-500">
                  Type to search users...
                </div>
              )}

              <button
                onClick={() => {
                  setSelectedRole(null);
                  setSelectedPool(null);
                  setSearchQuery("");
                }}
                className="mt-4 w-full px-4 py-2 bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-white rounded-lg hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Company Reserve Modal */}
      <CompanyReserveModal isOpen={showReserveModal} onClose={() => setShowReserveModal(false)} />

      {/* Audit Trail Modal */}
      <AuditTrailModal isOpen={showAuditTrail} onClose={() => setShowAuditTrail(false)} />

      {/* Executive Withdrawal Modal */}
      {selectedShareholder && (
        <ExecutiveWithdrawalModal
          isOpen={showWithdrawalModal}
          onClose={() => {
            setShowWithdrawalModal(false);
            setSelectedShareholder(null);
          }}
          shareholderId={selectedShareholder.id}
          currentBalance={Number(selectedShareholder.currentBalance || 0)}
          shareholderName={selectedShareholder.User?.name || selectedShareholder.role}
        />
      )}
    </div>
  );
}
