"use client";

import { useState } from "react";
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
} from "lucide-react";

export default function RevenuePoolsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const [selectedPool, setSelectedPool] = useState<string | null>(null);

  // Queries
  const { data: stats, refetch: refetchStats } = api.revenue.getDashboardStats.useQuery();
  const { data: shareholders, refetch: refetchShareholders } = api.revenue.getExecutiveShareholders.useQuery();
  const { data: pools, refetch: refetchPools } = api.revenue.getStrategicPools.useQuery();
  const { data: searchResults } = api.revenue.searchUsers.useQuery(
    { query: searchQuery },
    { enabled: searchQuery.length >= 2 }
  );

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

          <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm">Company Reserve (50%)</p>
                <p className="text-2xl font-bold mt-1">
                  ₦{stats?.companyReserve.toLocaleString() || "0"}
                </p>
              </div>
              <Wallet className="w-12 h-12 opacity-20" />
            </div>
          </div>

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

                  {assigned?.user ? (
                    <div className="space-y-2">
                      <div className="text-sm text-slate-700 dark:text-slate-200">
                        <div className="font-medium">{assigned.user.name}</div>
                        <div className="text-xs text-slate-500">
                          {assigned.user.email}
                        </div>
                      </div>
                      <button
                        onClick={() =>
                          removeExecutive.mutate({ role: role.role as any })
                        }
                        className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 text-sm transition-colors"
                      >
                        <UserMinus className="w-4 h-4" />
                        Remove
                      </button>
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

          <div className="space-y-4">
            {pools?.map((pool: any) => (
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
                        {pool.members.length} members
                      </span>
                      <span className="text-sm font-medium text-green-600 dark:text-green-400">
                        ₦{pool.balance.toLocaleString()} available
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
                    {pool.balance > 0 && pool.members.length > 0 && (
                      <button
                        onClick={() =>
                          distributePool.mutate({ poolType: pool.type as any })
                        }
                        disabled={distributePool.isPending}
                        className="px-4 py-2 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/30 text-sm transition-colors disabled:opacity-50"
                      >
                        <ArrowRight className="w-4 h-4 inline mr-1" />
                        Distribute
                      </button>
                    )}
                  </div>
                </div>

                {pool.members.length > 0 && (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                    {pool.members.map((member: any) => (
                      <div
                        key={member.id}
                        className="flex items-center justify-between bg-slate-50 dark:bg-slate-700/50 rounded-lg p-2"
                      >
                        <div className="text-sm">
                          <div className="font-medium text-slate-800 dark:text-white">
                            {member.user.name}
                          </div>
                          <div className="text-xs text-slate-500">
                            {member.user.email}
                          </div>
                        </div>
                        <button
                          onClick={() =>
                            removePoolMember.mutate({ memberId: member.id })
                          }
                          className="p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                        >
                          <UserMinus className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
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
    </div>
  );
}
