"use client";

import { useEffect, useMemo, useState } from "react";
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
  Trash2,
  Clock,
  Cpu,
  AlertTriangle,
  RefreshCw,
  PlusCircle,
  CheckSquare,
  XCircle,
  PauseCircle,
  Receipt,
  Settings2,
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
  const [selectedPool, setSelectedPool] = useState<string | null>(null);
  const [showReserveModal, setShowReserveModal] = useState(false);
  const [showAuditTrail, setShowAuditTrail] = useState(false);
  const [showUserGuide, setShowUserGuide] = useState(false);
  const [showWithdrawalModal, setShowWithdrawalModal] = useState(false);
  const [selectedShareholder, setSelectedShareholder] = useState<any>(null);
  const [selectedExecutive, setSelectedExecutive] = useState<{ id: string; role: string } | null>(null);
  const [newRoleName, setNewRoleName] = useState("");
  const [newRolePercent, setNewRolePercent] = useState("");
  const [percentageReason, setPercentageReason] = useState("");
  const [percentages, setPercentages] = useState<Record<string, number>>({});
  const [splitCompany, setSplitCompany] = useState("50");
  const [splitExecutive, setSplitExecutive] = useState("30");
  const [splitStrategic, setSplitStrategic] = useState("20");

  // Pool config editing
  const [editingPoolConfig, setEditingPoolConfig] = useState<{ poolType: string; freq: string; maxMembers: string } | null>(null);

  // Tech Pool project state
  const [showTechPanel, setShowTechPanel] = useState(false);
  const [techProjectForm, setTechProjectForm] = useState<{ title: string; description: string; category: string; approvedBudget: string; startDate: string; endDate: string; milestones: string }>({ title: "", description: "", category: "", approvedBudget: "", startDate: "", endDate: "", milestones: "" });
  const [showTechProjectForm, setShowTechProjectForm] = useState(false);
  const [spendForm, setSpendForm] = useState<{ projectId: string; amount: string; description: string; receipt: string } | null>(null);
  const [editingTechProject, setEditingTechProject] = useState<{ id: string; roiNotes: string; milestones: string } | null>(null);

  const [analyticsFilters, setAnalyticsFilters] = useState({
    programType: "",
    sourceKey: "",
    productId: "",
    orderId: "",
    packageId: "",
    tokenSymbol: "",
    country: "",
    state: "",
    region: "",
    userId: "",
  });

  const analyticsFiltersPayload = useMemo(() => {
    const trimmed: Record<string, string> = {
      programType: analyticsFilters.programType.trim(),
      sourceKey: analyticsFilters.sourceKey.trim(),
      productId: analyticsFilters.productId.trim(),
      orderId: analyticsFilters.orderId.trim(),
      packageId: analyticsFilters.packageId.trim(),
      tokenSymbol: analyticsFilters.tokenSymbol.trim(),
      country: analyticsFilters.country.trim(),
      state: analyticsFilters.state.trim(),
      region: analyticsFilters.region.trim(),
      userId: analyticsFilters.userId.trim(),
    };

    const out: Record<string, string> = {};
    (Object.keys(trimmed) as Array<keyof typeof trimmed>).forEach((key) => {
      if (trimmed[key]) out[key] = trimmed[key];
    });

    return Object.keys(out).length ? out : undefined;
  }, [analyticsFilters]);

  // Queries
  const { data: stats, isLoading: statsLoading, refetch: refetchStats } = api.revenue.getDashboardStats.useQuery();
  const { data: splitSettings, isLoading: splitLoading, refetch: refetchSplit } = api.revenue.getProfitSplitSettings.useQuery();
  const { data: shareholders, isLoading: shareholdersLoading, refetch: refetchShareholders } = api.revenue.getExecutiveShareholders.useQuery();
  const { data: pools, isLoading: poolsLoading, refetch: refetchPools } = api.revenue.getStrategicPools.useQuery();
  const { data: techProjects, refetch: refetchTechProjects } = api.revenue.listTechProjects.useQuery();
  const { data: searchResults } = api.revenue.searchUsers.useQuery(
    { query: searchQuery },
    { enabled: searchQuery.length >= 2 }
  );

  // Analytics queries
  const { data: revenueBySource } = api.revenue.getRevenueBySource.useQuery({
    days: 30,
    filters: analyticsFiltersPayload,
  });
  const { data: revenueTrend } = api.revenue.getRevenueTrend.useQuery({
    days: 30,
    filters: analyticsFiltersPayload,
  });
  const { data: allocations } = api.revenue.getAllocations.useQuery({
    limit: 50,
    filters: analyticsFiltersPayload,
  });

  // Mutations
  const createExecutive = api.revenue.createExecutivePosition.useMutation({
    onSuccess: () => {
      toast.success("Executive position created");
      refetchShareholders();
      setNewRoleName("");
      setNewRolePercent("");
    },
    onError: (error: any) => toast.error(error.message),
  });

  const assignExecutive = api.revenue.assignExecutiveRole.useMutation({
    onSuccess: () => {
      toast.success("Executive role assigned successfully");
      refetchShareholders();
      setSelectedExecutive(null);
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

  const deleteExecutivePosition = api.revenue.deleteExecutivePosition.useMutation({
    onSuccess: () => {
      toast.success("Executive position deleted");
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

  const adjustPercentages = api.revenue.adjustExecutivePercentages.useMutation({
    onSuccess: () => {
      toast.success("Executive percentages updated");
      refetchShareholders();
      setPercentageReason("");
    },
    onError: (error: any) => toast.error(error.message),
  });

  const updateSplit = api.revenue.updateProfitSplitSettings.useMutation({
    onSuccess: () => {
      toast.success("Revenue split updated");
      refetchSplit();
      refetchStats();
    },
    onError: (error: any) => toast.error(error.message || "Failed to update split"),
  });

  const updatePoolConfig = api.revenue.updatePoolConfig.useMutation({
    onSuccess: () => {
      toast.success("Pool configuration updated");
      refetchPools();
      setEditingPoolConfig(null);
    },
    onError: (error: any) => toast.error(error.message),
  });

  const createTechProject = api.revenue.createTechProject.useMutation({
    onSuccess: () => {
      toast.success("Technology project created");
      refetchTechProjects();
      setShowTechProjectForm(false);
      setTechProjectForm({ title: "", description: "", category: "", approvedBudget: "", startDate: "", endDate: "", milestones: "" });
    },
    onError: (error: any) => toast.error(error.message),
  });

  const approveTechProject = api.revenue.approveTechProject.useMutation({
    onSuccess: (_, vars) => {
      toast.success(`Project ${vars.action.toLowerCase().replace("_", " ")}`);
      refetchTechProjects();
    },
    onError: (error: any) => toast.error(error.message),
  });

  const recordTechSpend = api.revenue.recordTechSpend.useMutation({
    onSuccess: () => {
      toast.success("Spend recorded");
      refetchTechProjects();
      setSpendForm(null);
    },
    onError: (error: any) => toast.error(error.message),
  });

  const updateTechProject = api.revenue.updateTechProject.useMutation({
    onSuccess: () => {
      toast.success("Project updated");
      refetchTechProjects();
      setEditingTechProject(null);
    },
    onError: (error: any) => toast.error(error.message),
  });

  const syncLeadershipQualifications = api.revenue.syncLeadershipQualifications.useMutation({
    onSuccess: (data) => {
      toast.success(`Qualifications synced: ${data.activated} activated, ${data.deactivated} deactivated`);
      refetchPools();
    },
    onError: (error: any) => toast.error(error.message),
  });

  const { data: overduePools, refetch: refetchOverdue } = api.revenue.getOverduePools.useQuery(undefined, {
    refetchInterval: 60_000, // re-check every minute while page is open
  });

  useEffect(() => {
    if (shareholders) {
      const next: Record<string, number> = {};
      shareholders.forEach((s: any) => {
        next[s.id] = Number(s.percentage || 0);
      });
      setPercentages(next);
    }
  }, [shareholders]);

  useEffect(() => {
    if (!splitSettings) return;
    setSplitCompany(String(splitSettings.companyPercent));
    setSplitExecutive(String(splitSettings.executivePercent));
    setSplitStrategic(String(splitSettings.strategicPercent));
  }, [splitSettings]);

  const splitLabel = useMemo(() => {
    const c = splitSettings?.companyPercent ?? 50;
    const e = splitSettings?.executivePercent ?? 30;
    const s = splitSettings?.strategicPercent ?? 20;
    return `${c}/${e}/${s}`;
  }, [splitSettings]);

  const totalPercentage = useMemo(
    () => Object.values(percentages).reduce((sum, val) => sum + Number(val || 0), 0),
    [percentages]
  );

  const execLoading = shareholdersLoading || !shareholders;

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
                Manage revenue distribution ({splitLabel} split)
              </p>
            </div>
          </div>
        </div>

        {/* Revenue Split Settings */}
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-bold text-slate-800 dark:text-white">Allocation Split Settings</h2>
              <p className="text-sm text-slate-600 dark:text-slate-300">
                Updates apply to new revenue transactions going forward.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">
                Company Reserve (%)
              </label>
              <input
                value={splitCompany}
                onChange={(e) => setSplitCompany(e.target.value)}
                inputMode="decimal"
                className="w-full px-4 py-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-600"
                placeholder="50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">
                Executive Pool (%)
              </label>
              <input
                value={splitExecutive}
                onChange={(e) => setSplitExecutive(e.target.value)}
                inputMode="decimal"
                className="w-full px-4 py-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-600"
                placeholder="30"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">
                Strategic Pools (%)
              </label>
              <input
                value={splitStrategic}
                onChange={(e) => setSplitStrategic(e.target.value)}
                inputMode="decimal"
                className="w-full px-4 py-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-600"
                placeholder="20"
              />
            </div>
          </div>

          <div className="flex items-center justify-between mt-4">
            <div className="text-sm text-slate-600 dark:text-slate-300">
              {splitLoading ? "Loading current split..." : `Current: ${splitLabel}`}
            </div>
            <button
              onClick={() => {
                const company = parseFloat(splitCompany);
                const executive = parseFloat(splitExecutive);
                const strategic = parseFloat(splitStrategic);

                if (![company, executive, strategic].every((v) => Number.isFinite(v))) {
                  toast.error("Please enter valid numbers for all percentages");
                  return;
                }
                if (company < 0 || executive < 0 || strategic < 0) {
                  toast.error("Percentages cannot be negative");
                  return;
                }
                if (Math.abs(company + executive + strategic - 100) > 0.0001) {
                  toast.error("Percentages must sum to 100");
                  return;
                }

                updateSplit.mutate({
                  companyPercent: company,
                  executivePercent: executive,
                  strategicPercent: strategic,
                });
              }}
              disabled={updateSplit.isPending}
              className="px-5 py-3 rounded-lg bg-green-600 hover:bg-green-700 text-white font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {updateSplit.isPending ? "Saving..." : "Save Split"}
            </button>
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
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
            <div>
              <h2 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                <Users className="w-6 h-6 text-purple-600" />
                Executive Shareholders (30%)
              </h2>
              <div className="text-sm text-slate-600 dark:text-slate-300">Distributed daily at 8:00 AM</div>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <div className="px-3 py-2 bg-slate-100 dark:bg-slate-700 rounded-lg text-sm text-slate-700 dark:text-slate-200">
                Total Allocation: <span className={Math.abs(totalPercentage - 100) < 0.01 ? "text-green-600" : "text-red-600"}>{totalPercentage.toFixed(2)}%</span>
              </div>
              <div className="px-3 py-2 bg-purple-50 dark:bg-purple-900/20 rounded-lg text-sm text-purple-700 dark:text-purple-200">
                Positions: {shareholders?.length || 0}
              </div>
            </div>
          </div>

          {/* Create Position */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
            <div className="lg:col-span-1 bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-950/30 dark:to-indigo-950/30 border border-purple-200 dark:border-purple-800 rounded-lg p-4 shadow-sm">
              <h4 className="font-semibold text-slate-800 dark:text-white mb-2 flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-purple-600" />
                Create Executive Position
              </h4>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">Role Name</label>
                  <input
                    value={newRoleName}
                    onChange={(e) => setNewRoleName(e.target.value)}
                    placeholder="e.g. VP OPERATIONS"
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-slate-800 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">Allocation (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={newRolePercent}
                    onChange={(e) => setNewRolePercent(e.target.value)}
                    placeholder="e.g. 5"
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-slate-800 dark:text-white"
                  />
                </div>
                <button
                  onClick={() => {
                    const pct = Number(newRolePercent);
                    if (!newRoleName.trim()) {
                      toast.error("Enter a role name");
                      return;
                    }
                    if (isNaN(pct) || pct <= 0) {
                      toast.error("Enter a valid percentage");
                      return;
                    }
                    createExecutive.mutate({ role: newRoleName, percentage: pct });
                  }}
                  disabled={createExecutive.isPending}
                  className="w-full px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors disabled:opacity-60"
                >
                  {createExecutive.isPending ? "Creating..." : "Add Position"}
                </button>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Add new executive positions beyond the defaults. Keep total at 100%.
                </p>
              </div>
            </div>

            <div className="lg:col-span-2 bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-700 rounded-lg p-4">
              <h4 className="font-semibold text-slate-800 dark:text-white mb-2 flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-blue-600" />
                Rebalance Percentages
              </h4>
              <p className="text-xs text-slate-600 dark:text-slate-400 mb-3">Update allocations for each position. Total must equal 100%.</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3 max-h-52 overflow-y-auto pr-1">
                {shareholders?.map((s: any, idx: number) => (
                  <div key={s.id} className="flex items-center gap-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2">
                    <div className={`w-2 h-10 rounded-full ${["bg-purple-500","bg-blue-500","bg-green-500","bg-orange-500","bg-pink-500","bg-indigo-500","bg-teal-500"][idx % 7]}`} />
                    <div className="flex-1">
                      <div className="text-sm font-semibold text-slate-800 dark:text-white">{s.role.replace(/_/g, " ")}</div>
                      <div className="text-xs text-slate-500">{s.User?.name || "Unassigned"}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="0.01"
                        value={percentages[s.id] ?? s.percentage}
                        onChange={(e) => {
                          const nextVal = parseFloat(e.target.value) || 0;
                          setPercentages((prev) => ({ ...prev, [s.id]: nextVal }));
                        }}
                        className="w-24 px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-right text-sm text-slate-800 dark:text-white"
                      />
                      <span className="text-xs text-slate-600 dark:text-slate-400">%</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 items-start">
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Reason (required)</label>
                  <textarea
                    value={percentageReason}
                    onChange={(e) => setPercentageReason(e.target.value)}
                    rows={2}
                    placeholder="Explain why percentages are being updated"
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-sm text-slate-800 dark:text-white"
                  />
                </div>
                <div className="flex flex-col gap-2 justify-end">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-700 dark:text-slate-300">Total</span>
                    <span className={`font-bold ${Math.abs(totalPercentage - 100) < 0.01 ? "text-green-600" : "text-red-600"}`}>
                      {totalPercentage.toFixed(2)}%
                    </span>
                  </div>
                  <button
                    onClick={() => {
                      if (Math.abs(totalPercentage - 100) > 0.01) {
                        toast.error("Percentages must sum to 100%");
                        return;
                      }
                      if (!percentageReason || percentageReason.length < 10) {
                        toast.error("Provide a reason (min 10 characters)");
                        return;
                      }
                      adjustPercentages.mutate({
                        percentages: Object.entries(percentages).map(([shareholderId, percentage]) => ({ shareholderId, percentage: Number(percentage) })),
                        reason: percentageReason,
                      });
                    }}
                    disabled={adjustPercentages.isPending}
                    className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-60"
                  >
                    {adjustPercentages.isPending ? "Updating..." : "Save Percentages"}
                  </button>
                  <p className="text-xs text-slate-500 dark:text-slate-400">All positions must be included. Changes affect future distributions.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Positions */}
          {execLoading ? (
            <div className="flex items-center justify-center py-8 text-slate-600 dark:text-slate-300">Loading executive positions...</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {shareholders?.map((shareholder: any, idx: number) => {
                const color = ["bg-purple-500","bg-blue-500","bg-green-500","bg-orange-500","bg-pink-500","bg-indigo-500","bg-teal-500"][idx % 7];
                return (
                  <div key={shareholder.id} className="border border-slate-200 dark:border-slate-700 rounded-lg p-4 shadow-sm">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${color}`} />
                        <span className="font-semibold text-slate-800 dark:text-white">{shareholder.role.replace(/_/g, " ")}</span>
                      </div>
                      <span className="text-sm font-medium text-slate-600 dark:text-slate-300">{Number(shareholder.percentage).toFixed(2)}%</span>
                    </div>

                    {shareholder?.User ? (
                      <div className="space-y-2">
                        <div className="text-sm text-slate-700 dark:text-slate-200">
                          <div className="font-medium">{shareholder.User?.name || "No name"}</div>
                          <div className="text-xs text-slate-500">{shareholder.User?.email || "No email"}</div>
                        </div>

                        <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-3 space-y-1">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-slate-600 dark:text-slate-300">Current Balance</span>
                            <span className="font-semibold text-green-600 dark:text-green-400">₦{Number(shareholder.currentBalance || 0).toLocaleString()}</span>
                          </div>
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-slate-600 dark:text-slate-300">Total Earned</span>
                            <span className="text-slate-700 dark:text-slate-300">₦{Number(shareholder.totalEarned || 0).toLocaleString()}</span>
                          </div>
                          {shareholder.lastDistributionAt && (
                            <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-200 dark:border-slate-600">
                              <span className="text-slate-600 dark:text-slate-300">Last Distribution</span>
                              <span className="text-slate-500">{new Date(shareholder.lastDistributionAt).toLocaleDateString()}</span>
                            </div>
                          )}
                        </div>

                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              setSelectedShareholder(shareholder);
                              setShowWithdrawalModal(true);
                            }}
                            disabled={Number(shareholder.currentBalance || 0) <= 0}
                            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/30 text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <Wallet className="w-4 h-4" />
                            Withdraw
                          </button>
                          <button
                            onClick={() => removeExecutive.mutate({ shareholderId: shareholder.id })}
                            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 text-sm transition-colors"
                          >
                            <UserMinus className="w-4 h-4" />
                            Clear User
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <button
                          onClick={() => setSelectedExecutive({ id: shareholder.id, role: shareholder.role })}
                          className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/30 text-sm transition-colors"
                        >
                          <UserPlus className="w-4 h-4" />
                          Assign User
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`Delete "${shareholder.role.replace(/_/g, " ")}" position? This cannot be undone.`)) {
                              deleteExecutivePosition.mutate({ shareholderId: shareholder.id });
                            }
                          }}
                          disabled={deleteExecutivePosition.isPending}
                          className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 text-sm transition-colors disabled:opacity-50"
                        >
                          <Trash2 className="w-4 h-4" />
                          Delete Position
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
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
              {/* Overdue distribution warning banner */}
              {overduePools && overduePools.length > 0 && (
                <div className="flex items-start gap-3 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-300 dark:border-amber-700 rounded-lg">
                  <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">
                      {overduePools.length} pool{overduePools.length > 1 ? "s" : ""} overdue for scheduled distribution
                    </p>
                    <p className="text-xs text-amber-700 dark:text-amber-400 mt-1">
                      {overduePools.map((p: any) => `${p.type} (was due ${new Date(p.nextDistributionAt).toLocaleDateString()})`).join(" · ")}
                    </p>
                  </div>
                </div>
              )}

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
                        {pool.Members?.length || 0} members {pool.maxMembers ? `/ ${pool.maxMembers} max` : ""}
                      </span>
                      <span className="text-sm font-medium text-green-600 dark:text-green-400">
                        ₦{Number(pool.balance || 0).toLocaleString()} available
                      </span>
                      {pool.distributionFrequency && pool.distributionFrequency !== "MANUAL" && (
                        <span className="flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-2 py-0.5 rounded-full">
                          <Clock className="w-3 h-3" />
                          {pool.distributionFrequency.toLowerCase()}
                        </span>
                      )}
                      {pool.lastDistributedAt && (
                        <span className="text-xs text-slate-400">
                          Last distributed: {new Date(pool.lastDistributedAt).toLocaleDateString()}
                        </span>
                      )}
                      {pool.nextDistributionAt && (() => {
                        const isOverdue = new Date(pool.nextDistributionAt) <= new Date();
                        return (
                          <span className={`text-xs ${
                            isOverdue
                              ? "text-red-600 dark:text-red-400 font-semibold"
                              : "text-amber-600 dark:text-amber-400"
                          }`}>
                            {isOverdue ? "⚠ OVERDUE — " : "Next: "}
                            {new Date(pool.nextDistributionAt).toLocaleDateString()}
                          </span>
                        );
                      })()}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setEditingPoolConfig({ poolType: pool.type, freq: pool.distributionFrequency ?? "MANUAL", maxMembers: pool.maxMembers ? String(pool.maxMembers) : "" })}
                      className="px-3 py-2 bg-slate-50 dark:bg-slate-700/50 text-slate-600 dark:text-slate-300 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-sm transition-colors"
                      title="Configure pool"
                    >
                      <Settings2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setSelectedPool(pool.type)}
                      className="px-4 py-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 text-sm transition-colors"
                    >
                      <UserPlus className="w-4 h-4 inline mr-1" />
                      Add Member
                    </button>
                    {pool.type === "LEADERSHIP" && (
                      <button
                        onClick={() => {
                          if (window.confirm("Sync LEADERSHIP pool members with their LeadershipPoolQualification records? Members who no longer qualify will be deactivated.")) {
                            syncLeadershipQualifications.mutate();
                          }
                        }}
                        disabled={syncLeadershipQualifications.isPending}
                        className="px-3 py-2 bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 rounded-lg hover:bg-purple-100 dark:hover:bg-purple-900/30 text-sm transition-colors disabled:opacity-50"
                        title="Sync qualification status from LeadershipPoolQualification"
                      >
                        <RefreshCw className={`w-4 h-4 ${syncLeadershipQualifications.isPending ? "animate-spin" : ""}`} />
                      </button>
                    )}
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

                {/* Pool Config Editor */}
{editingPoolConfig?.poolType === pool.type && (() => { const epc = editingPoolConfig!; return (
                  <div className="mb-4 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-lg">
                    <div className="flex items-center gap-2 mb-3">
                      <Settings2 className="w-4 h-4 text-amber-600" />
                      <span className="text-sm font-semibold text-amber-800 dark:text-amber-300">Configure {pool.type} Pool</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Distribution Frequency</label>
                        <select
                          value={epc.freq}
                          onChange={(e) => setEditingPoolConfig((p) => p ? { ...p, freq: e.target.value } : p)}
                          className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none"
                        >
                          <option value="MANUAL">Manual</option>
                          <option value="MONTHLY">Monthly</option>
                          <option value="QUARTERLY">Quarterly</option>
                          <option value="BI_ANNUAL">Bi-Annual</option>
                          <option value="ANNUAL">Annual</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Max Members (optional)</label>
                        <input
                          type="number"
                          placeholder="Unlimited"
                          value={epc.maxMembers}
                          onChange={(e) => setEditingPoolConfig((p) => p ? { ...p, maxMembers: e.target.value } : p)}
                          className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none"
                        />
                      </div>
                    </div>
                    <div className="flex gap-2 mt-3">
                      <button
                        onClick={() => updatePoolConfig.mutate({
                          poolType: epc.poolType as any,
                          distributionFrequency: epc.freq as any,
                          maxMembers: epc.maxMembers ? parseInt(epc.maxMembers) : undefined,
                        })}
                        disabled={updatePoolConfig.isPending}
                        className="px-4 py-2 bg-amber-600 text-white rounded-lg text-sm hover:bg-amber-700 disabled:opacity-50 transition-colors"
                      >
                        Save Config
                      </button>
                      <button onClick={() => setEditingPoolConfig(null)} className="px-4 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-lg text-sm hover:bg-slate-50 transition-colors">
                        Cancel
                      </button>
                    </div>
                  </div>
                ); })()}

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
                            {member.qualificationStatus && (
                              <span className={`inline-block mt-1 px-1.5 py-0.5 rounded text-xs font-medium ${
                                member.qualificationStatus === "SUSPENDED" ? "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300" :
                                member.qualificationStatus === "PENDING_REVIEW" ? "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300" :
                                "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300"
                              }`}>
                                {member.qualificationStatus}
                              </span>
                            )}
                            {member.eligibilityCriteria && (
                              <div className="text-xs text-slate-400 mt-0.5 truncate" title={member.eligibilityCriteria}>
                                {member.eligibilityCriteria}
                              </div>
                            )}
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

        {/* Technology Pool Projects Section */}
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full border-2 border-blue-200 dark:border-blue-700 flex items-center justify-center">
                <Cpu className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Technology Pool Projects</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">Budget allocation, spend tracking and ROI reporting</p>
              </div>
            </div>
            <button
              onClick={() => setShowTechProjectForm((v) => !v)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
            >
              <PlusCircle className="w-4 h-4" />
              Propose Project
            </button>
          </div>

          {/* New Project Form */}
          {showTechProjectForm && (
            <motion.div
              initial={{ opacity: 0, y: -12 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 p-5 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-xl"
            >
              <h3 className="text-base font-semibold text-blue-800 dark:text-blue-300 mb-4">New Technology Project Proposal</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Title *</label>
                  <input value={techProjectForm.title} onChange={(e) => setTechProjectForm((p) => ({ ...p, title: e.target.value }))} className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:border-blue-500" placeholder="Project title" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Category *</label>
                  <input value={techProjectForm.category} onChange={(e) => setTechProjectForm((p) => ({ ...p, category: e.target.value }))} className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:border-blue-500" placeholder="e.g. Infrastructure, Software, Security" />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Description</label>
                  <textarea value={techProjectForm.description} onChange={(e) => setTechProjectForm((p) => ({ ...p, description: e.target.value }))} rows={3} className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:border-blue-500 resize-none" placeholder="Project description and goals" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Approved Budget (₦) *</label>
                  <input type="number" value={techProjectForm.approvedBudget} onChange={(e) => setTechProjectForm((p) => ({ ...p, approvedBudget: e.target.value }))} className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:border-blue-500" placeholder="0" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Milestones (comma-separated)</label>
                  <input value={techProjectForm.milestones} onChange={(e) => setTechProjectForm((p) => ({ ...p, milestones: e.target.value }))} className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:border-blue-500" placeholder="Design, Development, Testing, Launch" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Start Date</label>
                  <input type="date" value={techProjectForm.startDate} onChange={(e) => setTechProjectForm((p) => ({ ...p, startDate: e.target.value }))} className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:border-blue-500" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">End Date</label>
                  <input type="date" value={techProjectForm.endDate} onChange={(e) => setTechProjectForm((p) => ({ ...p, endDate: e.target.value }))} className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:border-blue-500" />
                </div>
              </div>
              <div className="flex gap-3 mt-4">
                <button
                  onClick={() => createTechProject.mutate({
                    title: techProjectForm.title,
                    description: techProjectForm.description,
                    category: techProjectForm.category as any,
                    approvedBudget: parseFloat(techProjectForm.approvedBudget) || 0,
                    milestones: techProjectForm.milestones ? techProjectForm.milestones.split(",").map((m) => m.trim()).filter(Boolean) : undefined,
                    startDate: techProjectForm.startDate || undefined,
                    endDate: techProjectForm.endDate || undefined,
                  })}
                  disabled={createTechProject.isPending || !techProjectForm.title || !techProjectForm.category || !techProjectForm.approvedBudget}
                  className="px-5 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
                >
                  {createTechProject.isPending ? "Creating..." : "Create Project"}
                </button>
                <button onClick={() => setShowTechProjectForm(false)} className="px-4 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-lg text-sm hover:bg-slate-50 transition-colors">
                  Cancel
                </button>
              </div>
            </motion.div>
          )}

          {/* Projects List */}
          {!techProjects || techProjects.length === 0 ? (
            <div className="text-center py-10 text-slate-400">
              <Cpu className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="text-sm">No technology projects yet. Propose the first one above.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {(techProjects as any[]).map((proj: any) => {
                const budgetPct = proj.approvedBudget > 0 ? Math.min(100, (proj.totalSpent / proj.approvedBudget) * 100) : 0;
                const statusColors: Record<string, string> = {
                  PROPOSED: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300",
                  APPROVED: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
                  IN_PROGRESS: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300",
                  COMPLETED: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
                  REJECTED: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
                  ON_HOLD: "bg-slate-100 text-slate-700 dark:bg-slate-700/50 dark:text-slate-300",
                };
                return (
                  <motion.div key={proj.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="border border-slate-200 dark:border-slate-700 rounded-xl p-5">
                    <div className="flex items-start justify-between gap-4 mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${statusColors[proj.status] ?? ""}`}>{proj.status.replace("_", " ")}</span>
                          {proj.category && <span className="text-xs text-slate-400 bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded-full">{proj.category}</span>}
                        </div>
                        <h4 className="text-base font-semibold text-slate-800 dark:text-white">{proj.title}</h4>
                        {proj.description && <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{proj.description}</p>}
                        <div className="flex items-center gap-4 mt-2 text-xs text-slate-500">
                          {proj.proposedBy && <span>Proposed by: {proj.proposedBy.name ?? proj.proposedBy.email}</span>}
                          {proj.approvedBy && <span>Approved by: {proj.approvedBy.name ?? proj.approvedBy.email}</span>}
                          {proj.startDate && <span>Start: {new Date(proj.startDate).toLocaleDateString()}</span>}
                          {proj.endDate && <span>End: {new Date(proj.endDate).toLocaleDateString()}</span>}
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="text-lg font-bold text-slate-800 dark:text-white">₦{Number(proj.approvedBudget || 0).toLocaleString()}</div>
                        <div className="text-xs text-slate-500">Budget</div>
                        <div className="text-sm font-semibold text-red-600 dark:text-red-400 mt-1">₦{Number(proj.totalSpent || 0).toLocaleString()} spent</div>
                      </div>
                    </div>

                    {/* Budget progress bar */}
                    <div className="mb-3">
                      <div className="flex justify-between text-xs text-slate-500 mb-1">
                        <span>Budget utilization</span>
                        <span>{budgetPct.toFixed(1)}%</span>
                      </div>
                      <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full transition-all ${budgetPct > 90 ? "bg-red-500" : budgetPct > 70 ? "bg-amber-400" : "bg-blue-500"}`}
                          style={{ width: `${budgetPct}%` }}
                        />
                      </div>
                    </div>

                    {/* Milestones */}
                    {proj.milestones && (() => {
                      try {
                        const ms = typeof proj.milestones === "string" ? JSON.parse(proj.milestones) : proj.milestones;
                        if (Array.isArray(ms) && ms.length > 0) return (
                          <div className="flex flex-wrap gap-1.5 mb-3">
                            {ms.map((m: string, i: number) => (
                              <span key={i} className="text-xs bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded">{m}</span>
                            ))}
                          </div>
                        );
                      } catch {}
                      return null;
                    })()}

                    {/* ROI Notes */}
                    {proj.roiNotes && (
                      <div className="text-xs text-slate-500 dark:text-slate-400 italic mb-3 border-l-2 border-green-300 pl-3">
                        ROI: {proj.roiNotes}
                      </div>
                    )}

                    {/* Spend history */}
                    {proj.Spends && proj.Spends.length > 0 && (
                      <div className="mb-3 bg-slate-50 dark:bg-slate-700/30 rounded-lg p-3">
                        <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-2">Spend History</p>
                        <div className="space-y-1">
                          {proj.Spends.map((s: any) => (
                            <div key={s.id} className="flex justify-between text-xs text-slate-600 dark:text-slate-300">
                              <span>{s.description}</span>
                              <span className="font-medium">₦{Number(s.amount).toLocaleString()}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex flex-wrap gap-2 mt-2">
                      {proj.status === "PROPOSED" && (
                        <>
                          <button
                            onClick={() => approveTechProject.mutate({ projectId: proj.id, action: "APPROVE" })}
                            disabled={approveTechProject.isPending}
                            className="flex items-center gap-1 px-3 py-1.5 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 rounded-lg text-xs hover:bg-green-100 transition-colors disabled:opacity-50"
                          >
                            <CheckSquare className="w-3 h-3" /> Approve
                          </button>
                          <button
                            onClick={() => approveTechProject.mutate({ projectId: proj.id, action: "REJECT" })}
                            disabled={approveTechProject.isPending}
                            className="flex items-center gap-1 px-3 py-1.5 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 rounded-lg text-xs hover:bg-red-100 transition-colors disabled:opacity-50"
                          >
                            <XCircle className="w-3 h-3" /> Reject
                          </button>
                          <button
                            onClick={() => approveTechProject.mutate({ projectId: proj.id, action: "ON_HOLD" })}
                            disabled={approveTechProject.isPending}
                            className="flex items-center gap-1 px-3 py-1.5 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-lg text-xs hover:bg-slate-200 transition-colors disabled:opacity-50"
                          >
                            <PauseCircle className="w-3 h-3" /> On Hold
                          </button>
                        </>
                      )}
                      {(proj.status === "APPROVED" || proj.status === "IN_PROGRESS") && (
                        <button
                          onClick={() => setSpendForm({ projectId: proj.id, amount: "", description: "", receipt: "" })}
                          className="flex items-center gap-1 px-3 py-1.5 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded-lg text-xs hover:bg-blue-100 transition-colors"
                        >
                          <Receipt className="w-3 h-3" /> Record Spend
                        </button>
                      )}
                      <button
                        onClick={() => setEditingTechProject({ id: proj.id, roiNotes: proj.roiNotes ?? "", milestones: proj.milestones ? (typeof proj.milestones === "string" ? (() => { try { return JSON.parse(proj.milestones).join(", "); } catch { return proj.milestones; } })() : proj.milestones.join(", ")) : "" })}
                        className="flex items-center gap-1 px-3 py-1.5 bg-slate-50 dark:bg-slate-700/50 text-slate-600 dark:text-slate-300 rounded-lg text-xs hover:bg-slate-100 transition-colors"
                      >
                        <Settings2 className="w-3 h-3" /> Edit ROI/Milestones
                      </button>
                    </div>

                    {/* Spend Form */}
                    {spendForm?.projectId === proj.id && (() => { const sf = spendForm!; return (
                      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="mt-3 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg">
                        <p className="text-xs font-semibold text-blue-700 dark:text-blue-300 mb-3">Record Spend for: {proj.title}</p>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          <div>
                            <label className="block text-xs text-slate-500 mb-1">Amount (₦) *</label>
                            <input type="number" value={sf.amount} onChange={(e) => setSpendForm((p) => p ? { ...p, amount: e.target.value } : p)} className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none" />
                          </div>
                          <div>
                            <label className="block text-xs text-slate-500 mb-1">Description *</label>
                            <input value={sf.description} onChange={(e) => setSpendForm((p) => p ? { ...p, description: e.target.value } : p)} className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none" placeholder="What was purchased" />
                          </div>
                          <div>
                            <label className="block text-xs text-slate-500 mb-1">Receipt URL</label>
                            <input value={sf.receipt} onChange={(e) => setSpendForm((p) => p ? { ...p, receipt: e.target.value } : p)} className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none" placeholder="Optional receipt link" />
                          </div>
                        </div>
                        <div className="flex gap-2 mt-3">
                          <button
                            onClick={() => recordTechSpend.mutate({ projectId: sf.projectId, amount: parseFloat(sf.amount) || 0, description: sf.description, receipt: sf.receipt || undefined })}
                            disabled={recordTechSpend.isPending || !sf.amount || !sf.description}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50 transition-colors"
                          >
                            {recordTechSpend.isPending ? "Saving..." : "Save Spend"}
                          </button>
                          <button onClick={() => setSpendForm(null)} className="px-4 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-lg text-sm hover:bg-slate-50 transition-colors">Cancel</button>
                        </div>
                      </motion.div>
                    ); })()}

                    {/* Edit ROI / Milestones Form */}
                    {editingTechProject?.id === proj.id && (() => { const etp = editingTechProject!; return (
                      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="mt-3 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-lg">
                        <p className="text-xs font-semibold text-green-700 dark:text-green-300 mb-3">Edit: {proj.title}</p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs text-slate-500 mb-1">ROI Notes</label>
                            <textarea rows={2} value={etp.roiNotes} onChange={(e) => setEditingTechProject((p) => p ? { ...p, roiNotes: e.target.value } : p)} className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none resize-none" placeholder="Return on investment notes" />
                          </div>
                          <div>
                            <label className="block text-xs text-slate-500 mb-1">Milestones (comma-separated)</label>
                            <textarea rows={2} value={etp.milestones} onChange={(e) => setEditingTechProject((p) => p ? { ...p, milestones: e.target.value } : p)} className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none resize-none" placeholder="Phase 1, Phase 2, Launch" />
                          </div>
                        </div>
                        <div className="flex gap-2 mt-3">
                          <button
                            onClick={() => updateTechProject.mutate({ projectId: etp.id, roiNotes: etp.roiNotes || undefined, milestones: etp.milestones ? etp.milestones.split(",").map((m) => m.trim()).filter(Boolean) : undefined })}
                            disabled={updateTechProject.isPending}
                            className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 disabled:opacity-50 transition-colors"
                          >
                            {updateTechProject.isPending ? "Saving..." : "Save"}
                          </button>
                          <button onClick={() => setEditingTechProject(null)} className="px-4 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-lg text-sm hover:bg-slate-50 transition-colors">Cancel</button>
                        </div>
                      </motion.div>
                    ); })()}
                  </motion.div>
                );
              })}
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

          {/* Analytics Filters */}
          <div className="mb-6 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-900/40 p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Search className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">Filters</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  (optional)
                </p>
              </div>
              <button
                onClick={() =>
                  setAnalyticsFilters({
                    programType: "",
                    sourceKey: "",
                    productId: "",
                    orderId: "",
                    packageId: "",
                    tokenSymbol: "",
                    country: "",
                    state: "",
                    region: "",
                    userId: "",
                  })
                }
                className="text-xs px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
              >
                Clear
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
                  Program Type
                </label>
                <input
                  value={analyticsFilters.programType}
                  onChange={(e) =>
                    setAnalyticsFilters((p) => ({ ...p, programType: e.target.value }))
                  }
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-600"
                  placeholder="e.g. MEMBERSHIP / STORE"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
                  Source Key
                </label>
                <input
                  value={analyticsFilters.sourceKey}
                  onChange={(e) =>
                    setAnalyticsFilters((p) => ({ ...p, sourceKey: e.target.value }))
                  }
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-600"
                  placeholder="e.g. EXTERNAL_TOKEN"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
                  Token Symbol
                </label>
                <input
                  value={analyticsFilters.tokenSymbol}
                  onChange={(e) =>
                    setAnalyticsFilters((p) => ({ ...p, tokenSymbol: e.target.value }))
                  }
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-600"
                  placeholder="e.g. BPT / USDT"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
                  Product ID
                </label>
                <input
                  value={analyticsFilters.productId}
                  onChange={(e) =>
                    setAnalyticsFilters((p) => ({ ...p, productId: e.target.value }))
                  }
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-600"
                  placeholder="Product ID"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
                  Order ID
                </label>
                <input
                  value={analyticsFilters.orderId}
                  onChange={(e) =>
                    setAnalyticsFilters((p) => ({ ...p, orderId: e.target.value }))
                  }
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-600"
                  placeholder="Order ID"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
                  Package ID
                </label>
                <input
                  value={analyticsFilters.packageId}
                  onChange={(e) =>
                    setAnalyticsFilters((p) => ({ ...p, packageId: e.target.value }))
                  }
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-600"
                  placeholder="Package ID"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
                  Country
                </label>
                <input
                  value={analyticsFilters.country}
                  onChange={(e) =>
                    setAnalyticsFilters((p) => ({ ...p, country: e.target.value }))
                  }
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-600"
                  placeholder="Country"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
                  State
                </label>
                <input
                  value={analyticsFilters.state}
                  onChange={(e) =>
                    setAnalyticsFilters((p) => ({ ...p, state: e.target.value }))
                  }
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-600"
                  placeholder="State"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
                  Region
                </label>
                <input
                  value={analyticsFilters.region}
                  onChange={(e) =>
                    setAnalyticsFilters((p) => ({ ...p, region: e.target.value }))
                  }
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-600"
                  placeholder="Region"
                />
              </div>

              <div className="md:col-span-2 lg:col-span-3">
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
                  User ID
                </label>
                <input
                  value={analyticsFilters.userId}
                  onChange={(e) =>
                    setAnalyticsFilters((p) => ({ ...p, userId: e.target.value }))
                  }
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-600"
                  placeholder="User ID (optional)"
                />
              </div>
            </div>

            <p className="mt-3 text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2">
              <Info className="w-4 h-4" />
              Filters apply to Source, Trend, and Allocation Timeline (last 30 days for charts).
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Revenue Split Pie Chart */}
            {stats && (
              <RevenueSplitChart
                companyReserve={stats.companyReserve}
                executivePool={stats.executivePoolPending}
                strategicPools={stats.strategicPools.reduce((sum: any, p: any) => sum + p.balance, 0)}
                companyPercent={splitSettings?.companyPercent}
                executivePercent={splitSettings?.executivePercent}
                strategicPercent={splitSettings?.strategicPercent}
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
        {(selectedExecutive || selectedPool) && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl max-w-md w-full p-6">
              <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-4">
                {selectedExecutive ? `Assign ${selectedExecutive.role.replace(/_/g, " ")}` : `Add to ${selectedPool} Pool`}
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
                        if (selectedExecutive) {
                          assignExecutive.mutate({
                            shareholderId: selectedExecutive.id,
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
                  setSelectedExecutive(null);
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
