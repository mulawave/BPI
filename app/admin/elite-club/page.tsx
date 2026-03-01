"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { api } from "@/client/trpc";
import toast from "react-hot-toast";
import {
  Crown,
  Users,
  BarChart3,
  Settings,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  RefreshCw,
  Search,
  ChevronRight,
  Shield,
  DollarSign,
  TrendingUp,
  Vote,
  Star,
  Gavel,
  Plus,
  Eye,
  Ban,
  ArrowRight,
  Wallet,
  Building2,
  FileText,
  Activity,
  Download,
} from "lucide-react";
import { format } from "date-fns";

type Tab = "overview" | "clubs" | "applications" | "contributions" | "payouts" | "investments" | "legal" | "settings";
type Tier = "SILVER" | "GOLD" | "PLATINUM" | "DIAMOND";

const TIER_COLORS: Record<Tier, { bg: string; text: string; border: string; badge: string }> = {
  SILVER:   { bg: "bg-slate-100 dark:bg-slate-800",  text: "text-slate-700 dark:text-slate-200",  border: "border-slate-300", badge: "bg-slate-200 text-slate-800 dark:bg-slate-700 dark:text-slate-200" },
  GOLD:     { bg: "bg-amber-50 dark:bg-amber-900/20", text: "text-amber-700 dark:text-amber-300",  border: "border-amber-300", badge: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200" },
  PLATINUM: { bg: "bg-violet-50 dark:bg-violet-900/20", text: "text-violet-700 dark:text-violet-300", border: "border-violet-300", badge: "bg-violet-100 text-violet-800 dark:bg-violet-900/40 dark:text-violet-200" },
  DIAMOND:  { bg: "bg-cyan-50 dark:bg-cyan-900/20",  text: "text-cyan-700 dark:text-cyan-300",    border: "border-cyan-300",   badge: "bg-cyan-100 text-cyan-800 dark:bg-cyan-900/40 dark:text-cyan-200" },
};

const STATUS_BADGE: Record<string, string> = {
  PENDING:      "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-200",
  APPROVED:     "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-200",
  REJECTED:     "bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-200",
  FORMING:      "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200",
  ACTIVE:       "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-200",
  SUSPENDED:    "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-200",
  DISSOLVED:    "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
  PAID:         "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-200",
  BLOCKED:      "bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-200",
  UNDER_REVIEW: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-200",
  DRAFT:        "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
  FUNDED:       "bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-200",
  COMPLETED:    "bg-emerald-100 text-emerald-800",
};

const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: "overview",      label: "Overview",      icon: <BarChart3 size={16} /> },
  { id: "clubs",         label: "Clubs",         icon: <Crown size={16} /> },
  { id: "applications",  label: "Applications",  icon: <FileText size={16} /> },
  { id: "contributions", label: "Contributions", icon: <Wallet size={16} /> },
  { id: "payouts",       label: "Payouts",       icon: <DollarSign size={16} /> },
  { id: "investments",   label: "Investments",   icon: <TrendingUp size={16} /> },
  { id: "legal",         label: "Legal",         icon: <Gavel size={16} /> },
  { id: "settings",      label: "Settings",      icon: <Settings size={16} /> },
];

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatCard({ icon, label, value, sub, color }: { icon: React.ReactNode; label: string; value: number | string; sub?: string; color: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-[#181f2a] border border-gray-200 dark:border-gray-700/60 rounded-2xl p-5 flex gap-4 items-center shadow-sm"
    >
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>{icon}</div>
      <div>
        <p className="text-xs text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wide">{label}</p>
        <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
        {sub && <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{sub}</p>}
      </div>
    </motion.div>
  );
}

function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold ${STATUS_BADGE[status] ?? "bg-gray-100 text-gray-700"}`}>
      {status}
    </span>
  );
}

function TierBadge({ tier }: { tier: Tier }) {
  const c = TIER_COLORS[tier] ?? TIER_COLORS.SILVER;
  return (
    <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-bold ${c.badge}`}>
      <Crown size={11} className="inline mr-1" />{tier}
    </span>
  );
}

// ─── Overview Tab ─────────────────────────────────────────────────────────────

function OverviewTab() {
  const { data, isLoading, refetch } = api.eliteClub.adminDashboardStats.useQuery();
  const formationQuery = api.eliteClub.getFormationStatus.useQuery();
  const setStatus = api.eliteClub.setFormationStatus.useMutation({
    onSuccess: () => {
      toast.success("Formation status updated.");
      formationQuery.refetch();
    },
    onError: (e) => toast.error(e.message),
  });

  if (isLoading) return <div className="flex items-center gap-2 text-gray-400 py-12 justify-center"><RefreshCw size={20} className="animate-spin" /> Loading...</div>;

  const stats = data!;
  return (
    <div className="space-y-8">
      {/* Stats grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <StatCard icon={<Crown size={22} className="text-amber-600" />} label="Total Clubs" value={stats.totalClubs} color="bg-amber-50 dark:bg-amber-900/20" />
        <StatCard icon={<CheckCircle2 size={22} className="text-emerald-600" />} label="Active Clubs" value={stats.activeClubs} color="bg-emerald-50 dark:bg-emerald-900/20" />
        <StatCard icon={<Users size={22} className="text-blue-600" />} label="Active Members" value={stats.totalMembers} color="bg-blue-50 dark:bg-blue-900/20" />
        <StatCard icon={<FileText size={22} className="text-violet-600" />} label="Pending Apps" value={stats.pendingApplications} color="bg-violet-50 dark:bg-violet-900/20" />
        <StatCard icon={<DollarSign size={22} className="text-rose-600" />} label="Pending Payouts" value={stats.pendingPayouts} color="bg-rose-50 dark:bg-rose-900/20" />
        <StatCard icon={<Vote size={22} className="text-indigo-600" />} label="Open Votes" value={stats.openInvestments} color="bg-indigo-50 dark:bg-indigo-900/20" />
      </div>

      {/* Formation status card — per-tier controls */}
      <div className="bg-white dark:bg-[#181f2a] border border-gray-200 dark:border-gray-700/60 rounded-2xl p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center">
            <Activity size={20} className="text-amber-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white">Club Formation Status</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">Controls whether new applications can be submitted per tier</p>
          </div>
        </div>

        {/* Global row */}
        <div className="mb-4 pb-4 border-b border-gray-100 dark:border-gray-700">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Global (all tiers)</span>
              <StatusBadge status={formationQuery.data?.formationStatus ?? "—"} />
            </div>
            <div className="flex gap-2">
              {(["OPEN", "PAUSED", "CLOSED"] as const).map((s) => (
                <button key={s} onClick={() => setStatus.mutate({ status: s })}
                  disabled={setStatus.isPending || formationQuery.data?.formationStatus === s}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border ${formationQuery.data?.formationStatus === s ? "bg-[#0d3b29] text-white border-[#0d3b29]" : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:border-[#0d3b29] hover:text-[#0d3b29]"}`}>
                  {s}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Per-tier rows */}
        <div className="space-y-3">
          {(["SILVER", "GOLD", "PLATINUM", "DIAMOND"] as const).map((tier) => {
            const tierStatus = formationQuery.data?.tierFormationStatus?.[tier] ?? "OPEN";
            return (
              <div key={tier} className="flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-2">
                  <TierBadge tier={tier} />
                  <StatusBadge status={tierStatus} />
                </div>
                <div className="flex gap-2">
                  {(["OPEN", "PAUSED", "CLOSED"] as const).map((s) => (
                    <button key={s} onClick={() => setStatus.mutate({ status: s, tier })}
                      disabled={setStatus.isPending || tierStatus === s}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border ${tierStatus === s ? "bg-[#0d3b29] text-white border-[#0d3b29]" : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:border-[#0d3b29] hover:text-[#0d3b29]"}`}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── Clubs Tab ────────────────────────────────────────────────────────────────

function ClubsTab() {
  const [tier, setTier] = useState<Tier | undefined>();
  const [status, setStatus] = useState<string | undefined>();
  const [page, setPage] = useState(1);
  const [showCreate, setShowCreate] = useState(false);
  const [newTier, setNewTier] = useState<Tier>("SILVER");
  const [newName, setNewName] = useState("");
  const [activateId, setActivateId] = useState<string | null>(null);

  const { data, isLoading, refetch } = api.eliteClub.adminListClubs.useQuery({ tier, status: status as any, page, pageSize: 20 });
  const activate = api.eliteClub.activateClub.useMutation({
    onSuccess: () => { toast.success("Club activated!"); setActivateId(null); refetch(); },
    onError: (e) => toast.error(e.message),
  });
  const createClub = api.eliteClub.createClub.useMutation({
    onSuccess: () => { toast.success("Club created!"); setShowCreate(false); setNewName(""); refetch(); },
    onError: (e) => toast.error(e.message),
  });
  const updateStatus = api.eliteClub.updateClubStatus.useMutation({
    onSuccess: () => { toast.success("Club status updated."); refetch(); },
    onError: (e) => toast.error(e.message),
  });

  return (
    <div className="space-y-6">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex gap-2 flex-wrap">
          {([undefined, "SILVER", "GOLD", "PLATINUM", "DIAMOND"] as const).map((t) => (
            <button key={t ?? "all"} onClick={() => setTier(t)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${tier === t ? "bg-[#0d3b29] text-white border-[#0d3b29]" : "bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:border-[#0d3b29]"}`}>
              {t ?? "All Tiers"}
            </button>
          ))}
        </div>
        <div className="ml-auto">
          <button onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#0d3b29] text-white text-sm font-semibold hover:bg-[#0a2e20] transition-all">
            <Plus size={15} /> New Club
          </button>
        </div>
      </div>

      {/* Create Club Modal */}
      <AnimatePresence>
        {showCreate && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="bg-white dark:bg-[#181f2a] border border-gray-200 dark:border-gray-700/60 rounded-2xl p-6 shadow-lg">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Create New Club</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">Tier</label>
                <select value={newTier} onChange={(e) => setNewTier(e.target.value as Tier)}
                  className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-900 dark:text-white">
                  {(["SILVER", "GOLD", "PLATINUM", "DIAMOND"] as Tier[]).map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">Club Name</label>
                <input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="e.g. Diamond Club Alpha"
                  className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-[#232323] dark:text-white placeholder-[#b0b0b0] focus:border-[#0d3b29] outline-none" />
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => createClub.mutate({ tier: newTier, name: newName })} disabled={createClub.isPending || !newName.trim()}
                className="px-5 py-2 bg-[#0d3b29] text-white rounded-xl text-sm font-semibold disabled:opacity-50">
                {createClub.isPending ? "Creating..." : "Create"}
              </button>
              <button onClick={() => setShowCreate(false)} className="px-5 py-2 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-600 dark:text-gray-300">Cancel</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Clubs list */}
      {isLoading ? (
        <div className="flex items-center gap-2 text-gray-400 py-10 justify-center"><RefreshCw size={18} className="animate-spin" /> Loading clubs...</div>
      ) : (
        <div className="space-y-3">
          {(data?.clubs ?? []).map((club) => (
            <motion.div key={club.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="bg-white dark:bg-[#181f2a] border border-gray-200 dark:border-gray-700/60 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center gap-4 shadow-sm">
              <div className="flex items-center gap-3 flex-1">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${TIER_COLORS[club.tier as Tier]?.bg}`}>
                  <Crown size={18} className={TIER_COLORS[club.tier as Tier]?.text} />
                </div>
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white text-sm">{club.name}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <TierBadge tier={club.tier as Tier} />
                    <StatusBadge status={club.status} />
                    <span className="text-xs text-gray-400 dark:text-gray-500">{club._count.members}/11 members</span>
                  </div>
                </div>
              </div>
              <div className="flex gap-2 flex-shrink-0">
                {club.status === "FORMING" && club._count.members >= 11 && (
                  <button onClick={() => activate.mutate({ clubId: club.id })} disabled={activate.isPending}
                    className="px-3 py-1.5 bg-emerald-600 text-white rounded-xl text-xs font-semibold hover:bg-emerald-700 transition-all">
                    Activate
                  </button>
                )}
                {club.status === "ACTIVE" && (
                  <button onClick={() => updateStatus.mutate({ clubId: club.id, status: "SUSPENDED" })}
                    className="px-3 py-1.5 bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300 rounded-xl text-xs font-semibold hover:bg-orange-200 transition-all">
                    Suspend
                  </button>
                )}
                {club.status === "SUSPENDED" && (
                  <button onClick={() => updateStatus.mutate({ clubId: club.id, status: "ACTIVE" })}
                    className="px-3 py-1.5 bg-emerald-100 text-emerald-700 rounded-xl text-xs font-semibold hover:bg-emerald-200 transition-all">
                    Re-activate
                  </button>
                )}
              </div>
            </motion.div>
          ))}
          {(data?.clubs ?? []).length === 0 && (
            <div className="text-center py-10 text-gray-400 dark:text-gray-500">No clubs found.</div>
          )}
        </div>
      )}
      {(data?.total ?? 0) > 20 && (
        <div className="flex items-center justify-between pt-2">
          <button disabled={page === 1} onClick={() => setPage((p) => p - 1)} className="px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-xl text-sm disabled:opacity-40">Previous</button>
          <span className="text-sm text-gray-500 dark:text-gray-400">Page {page} · {data?.total} total</span>
          <button disabled={page * 20 >= (data?.total ?? 0)} onClick={() => setPage((p) => p + 1)} className="px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-xl text-sm disabled:opacity-40">Next</button>
        </div>
      )}
    </div>
  );
}

// ─── Applications Tab ─────────────────────────────────────────────────────────

function ApplicationsTab() {
  const [statusFilter, setStatusFilter] = useState<"PENDING" | "APPROVED" | "REJECTED" | undefined>("PENDING");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<string | null>(null);
  const [clubId, setClubId] = useState("");
  const [rotation, setRotation] = useState("");
  const [rejectReason, setRejectReason] = useState("");

  const { data, isLoading, refetch } = api.eliteClub.adminListApplications.useQuery({ status: statusFilter, page, pageSize: 20 });
  const approve = api.eliteClub.approveApplication.useMutation({
    onSuccess: () => { toast.success("Application approved!"); setSelected(null); setClubId(""); setRotation(""); refetch(); },
    onError: (e) => toast.error(e.message),
  });
  const reject = api.eliteClub.rejectApplication.useMutation({
    onSuccess: () => { toast.success("Application rejected."); setSelected(null); setRejectReason(""); refetch(); },
    onError: (e) => toast.error(e.message),
  });

  const apps = data?.applications ?? [];
  const selectedApp = apps.find((a) => a.id === selected);

  return (
    <div className="space-y-5">
      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        {([undefined, "PENDING", "APPROVED", "REJECTED"] as const).map((s) => (
          <button key={s ?? "all"} onClick={() => { setStatusFilter(s); setPage(1); }}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${statusFilter === s ? "bg-[#0d3b29] text-white border-[#0d3b29]" : "bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:border-[#0d3b29]"}`}>
            {s ?? "All"}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex items-center gap-2 text-gray-400 py-10 justify-center"><RefreshCw size={18} className="animate-spin" /> Loading...</div>
      ) : (
        <div className="space-y-3">
          {apps.map((app) => (
            <motion.div key={app.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="bg-white dark:bg-[#181f2a] border border-gray-200 dark:border-gray-700/60 rounded-2xl p-5 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <TierBadge tier={app.tier as Tier} />
                    <StatusBadge status={app.status} />
                    <span className="text-xs text-gray-400">{format(new Date(app.submittedAt), "MMM d, yyyy")}</span>
                  </div>
                  <p className="font-semibold text-gray-900 dark:text-white text-sm">{app.user?.name ?? "—"}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{app.user?.email}</p>
                  <div className="flex gap-3 mt-2">
                    <span className={`text-xs px-2 py-0.5 rounded-lg ${app.bptVerified ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-500"}`}>
                      BPT {app.bptVerified ? "✓" : "—"}
                    </span>
                    <span className={`text-xs px-2 py-0.5 rounded-lg ${app.pacTokenVerified ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-500"}`}>
                      PAC {app.pacTokenVerified ? "✓" : "—"}
                    </span>
                    <span className="text-xs text-gray-400">{app.documents.length} doc(s)</span>
                  </div>
                </div>
                {app.status === "PENDING" && (
                  <div className="flex gap-2 flex-shrink-0">
                    <button onClick={() => setSelected(app.id)}
                      className="px-3 py-1.5 bg-[#0d3b29] text-white rounded-xl text-xs font-semibold hover:bg-[#0a2e20] transition-all">
                      Review
                    </button>
                  </div>
                )}
              </div>

              {/* Approval/Rejection panel */}
              <AnimatePresence>
                {selected === app.id && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
                    className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700 space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">Assign to Club ID</label>
                        <input value={clubId} onChange={(e) => setClubId(e.target.value)} placeholder="cuid..."
                          className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-xl text-sm bg-white dark:bg-gray-800 text-[#232323] dark:text-white placeholder-[#b0b0b0] focus:border-[#0d3b29] outline-none" />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">Rotation Number (1–11)</label>
                        <input type="number" min="1" max="11" value={rotation} onChange={(e) => setRotation(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-xl text-sm bg-white dark:bg-gray-800 text-[#232323] dark:text-white placeholder-[#b0b0b0] focus:border-[#0d3b29] outline-none" />
                      </div>
                    </div>
                    <button onClick={() => approve.mutate({ applicationId: app.id, clubId, rotationNumber: parseInt(rotation) })}
                      disabled={approve.isPending || !clubId || !rotation}
                      className="px-5 py-2 bg-emerald-600 text-white rounded-xl text-sm font-semibold hover:bg-emerald-700 transition-all disabled:opacity-50">
                      {approve.isPending ? "Approving..." : "✓ Approve & Assign"}
                    </button>

                    <div>
                      <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">Rejection Reason</label>
                      <input value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} placeholder="Reason..."
                        className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-xl text-sm bg-white dark:bg-gray-800 text-[#232323] dark:text-white placeholder-[#b0b0b0] focus:border-[#0d3b29] outline-none" />
                    </div>
                    <div className="flex gap-3">
                      <button onClick={() => reject.mutate({ applicationId: app.id, reason: rejectReason })}
                        disabled={reject.isPending || rejectReason.length < 5}
                        className="px-5 py-2 bg-rose-600 text-white rounded-xl text-sm font-semibold hover:bg-rose-700 transition-all disabled:opacity-50">
                        {reject.isPending ? "Rejecting..." : "✗ Reject"}
                      </button>
                      <button onClick={() => setSelected(null)} className="px-5 py-2 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-600 dark:text-gray-300">Cancel</button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
          {apps.length === 0 && <div className="text-center py-10 text-gray-400">No applications found.</div>}
        </div>
      )}
    </div>
  );
}

// ─── Payouts Tab ──────────────────────────────────────────────────────────────

function PayoutsTab() {
  const [clubId, setClubId] = useState("");
  const [payoutClubId, setPayoutClubId] = useState("__placeholder__");
  const { data, isLoading, refetch } = api.eliteClub.listEmpowermentPayouts.useQuery(
    { clubId: payoutClubId },
    { enabled: payoutClubId !== "__placeholder__" },
  );
  const release = api.eliteClub.releasePayout.useMutation({
    onSuccess: () => { toast.success("Payout released!"); refetch(); },
    onError: (e) => toast.error(e.message),
  });

  return (
    <div className="space-y-5">
      <div className="flex gap-3">
        <input value={clubId} onChange={(e) => setClubId(e.target.value)} placeholder="Enter Club ID..."
          className="flex-1 px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-xl text-sm bg-white dark:bg-gray-800 text-[#232323] dark:text-white placeholder-[#b0b0b0] focus:border-[#0d3b29] outline-none max-w-xs" />
        <button onClick={() => setPayoutClubId(clubId)} disabled={!clubId}
          className="px-4 py-2 bg-[#0d3b29] text-white rounded-xl text-sm font-semibold disabled:opacity-50">
          Load
        </button>
      </div>

      {isLoading && <div className="flex items-center gap-2 text-gray-400 py-8 justify-center"><RefreshCw size={18} className="animate-spin" />Loading...</div>}
      {data && (
        <div className="space-y-3">
          {data.payouts.map((payout) => (
            <div key={payout.id} className="bg-white dark:bg-[#181f2a] border border-gray-200 dark:border-gray-700/60 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center gap-4 shadow-sm">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <StatusBadge status={payout.status} />
                  <span className="text-xs text-gray-400">Rotation #{payout.rotationNumber}</span>
                  <span className="text-xs text-gray-400">{payout.scheduledMonth}/{payout.scheduledYear}</span>
                </div>
                <p className="font-semibold text-gray-900 dark:text-white">₦{Number(payout.amount).toLocaleString()}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{payout.member?.user?.name} · {payout.member?.user?.email}</p>
                {payout.blockedReason && <p className="text-xs text-rose-500 mt-1">{payout.blockedReason}</p>}
              </div>
              {payout.status === "PENDING" && (
                <button onClick={() => release.mutate({ payoutId: payout.id })} disabled={release.isPending}
                  className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-sm font-semibold hover:bg-emerald-700 transition-all disabled:opacity-50 flex-shrink-0">
                  Release
                </button>
              )}
            </div>
          ))}
          {data.payouts.length === 0 && <div className="text-center py-8 text-gray-400">No payouts for this club.</div>}
        </div>
      )}
    </div>
  );
}

// ─── Investments Tab ──────────────────────────────────────────────────────────

function InvestmentsTab() {
  const [clubId, setClubId] = useState("");
  const [searchClubId, setSearchClubId] = useState("__placeholder__");
  const [poolClubId, setPoolClubId] = useState("__placeholder__");
  const [statusFilter, setStatusFilter] = useState<string | undefined>();
  const { data, isLoading, refetch } = api.eliteClub.listInvestments.useQuery(
    { clubId: searchClubId, status: statusFilter as any },
    { enabled: searchClubId !== "__placeholder__" },
  );
  const { data: poolHistoryData, isLoading: poolHistoryLoading } = api.eliteClub.getInvestmentPoolHistory.useQuery(
    { clubId: poolClubId },
    { enabled: poolClubId !== "__placeholder__" },
  );
  const { data: opsData } = api.eliteClub.getEliteOpsBalance.useQuery(
    { clubId: poolClubId !== "__placeholder__" ? poolClubId : undefined },
  );
  const submitLegal = api.eliteClub.submitLegalReview.useMutation({
    onSuccess: () => { toast.success("Legal review submitted — voting opened."); refetch(); },
    onError: (e) => toast.error(e.message),
  });
  const approveInv = api.eliteClub.approveInvestment.useMutation({
    onSuccess: () => { toast.success("Investment approved!"); refetch(); },
    onError: (e) => toast.error(e.message),
  });
  const rejectInv = api.eliteClub.rejectInvestment.useMutation({
    onSuccess: () => { toast.success("Investment rejected."); refetch(); },
    onError: (e) => toast.error(e.message),
  });

  const [legalUrl, setLegalUrl] = useState<Record<string, string>>({});

  const pools = poolHistoryData?.pools ?? [];
  const latestPool = pools[0] ?? null;
  const opsBalances = opsData?.balances ?? [];
  const totalEliteOps = opsBalances.reduce((sum, b) => sum + Number(b._sum.eliteShare ?? 0), 0);

  return (
    <div className="space-y-6">
      {/* Club selector for pool data */}
      <div className="flex gap-3 flex-wrap">
        <input value={clubId} onChange={(e) => setClubId(e.target.value)} placeholder="Enter Club ID..."
          className="px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-xl text-sm bg-white dark:bg-gray-800 text-[#232323] dark:text-white placeholder-[#b0b0b0] focus:border-[#0d3b29] outline-none max-w-xs" />
        <button onClick={() => { setSearchClubId(clubId); setPoolClubId(clubId); }} disabled={!clubId}
          className="px-4 py-2 bg-[#0d3b29] text-white rounded-xl text-sm font-semibold disabled:opacity-50">Load</button>
      </div>

      {/* Investment Pool Balance + Breakdown */}
      {poolClubId !== "__placeholder__" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Current pool balance */}
          <div className="bg-white dark:bg-[#181f2a] border border-gray-200 dark:border-gray-700/60 rounded-2xl p-5 shadow-sm">
            <h3 className="font-semibold text-gray-900 dark:text-white text-sm mb-4 flex items-center gap-2">
              <BarChart3 size={15} className="text-indigo-600" /> Current Month Pool
            </h3>
            {poolHistoryLoading ? (
              <div className="flex items-center gap-2 text-gray-400 text-sm"><RefreshCw size={14} className="animate-spin" />Loading...</div>
            ) : latestPool ? (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-3">
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Gross Contributed</p>
                    <p className="font-bold text-gray-900 dark:text-white text-sm">₦{Number(latestPool.grossAmount).toLocaleString()}</p>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-3">
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Net Available</p>
                    <p className="font-bold text-emerald-600 dark:text-emerald-400 text-sm">₦{Number(latestPool.netAmount).toLocaleString()}</p>
                  </div>
                  <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-xl p-3">
                    <p className="text-xs text-indigo-600 dark:text-indigo-400 mb-1">Digital / Web3</p>
                    <p className="font-bold text-indigo-700 dark:text-indigo-300 text-sm">₦{Number(latestPool.digitalBalance).toLocaleString()}</p>
                  </div>
                  <div className="bg-amber-50 dark:bg-amber-900/20 rounded-xl p-3">
                    <p className="text-xs text-amber-600 dark:text-amber-400 mb-1">Offline</p>
                    <p className="font-bold text-amber-700 dark:text-amber-300 text-sm">₦{Number(latestPool.offlineBalance).toLocaleString()}</p>
                  </div>
                </div>
                <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-xl p-3">
                  <p className="text-xs text-emerald-600 dark:text-emerald-400 mb-1">Total Available (unallocated)</p>
                  <p className="font-bold text-emerald-700 dark:text-emerald-300">₦{Number(latestPool.available).toLocaleString()}</p>
                </div>
                <p className="text-xs text-gray-400 dark:text-gray-500">Period: {latestPool.month}/{latestPool.year}</p>
              </div>
            ) : (
              <p className="text-sm text-gray-400 py-4 text-center">No pool data for this club.</p>
            )}
          </div>

          {/* Elite Ops Wallet */}
          <div className="bg-white dark:bg-[#181f2a] border border-gray-200 dark:border-gray-700/60 rounded-2xl p-5 shadow-sm">
            <h3 className="font-semibold text-gray-900 dark:text-white text-sm mb-4 flex items-center gap-2">
              <Wallet size={15} className="text-rose-600" /> Elite Ops Wallet
            </h3>
            <div className="space-y-3">
              <div className="bg-rose-50 dark:bg-rose-900/20 rounded-xl p-4">
                <p className="text-xs text-rose-600 dark:text-rose-400 mb-1">Accumulated Elite Ops Fee</p>
                <p className="text-2xl font-bold text-rose-700 dark:text-rose-300">₦{totalEliteOps.toLocaleString()}</p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">5% ops share from all contributions</p>
              </div>
              {opsBalances.length > 1 && (
                <div className="space-y-2">
                  {opsBalances.map((b) => (
                    <div key={b.clubId} className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-800/50 rounded-lg px-3 py-2">
                      <span className="font-mono text-gray-400 truncate max-w-[120px]">{b.clubId}</span>
                      <span className="font-semibold text-gray-900 dark:text-white">₦{Number(b._sum.eliteShare ?? 0).toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              )}
              <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-700/40 rounded-xl px-3 py-2.5">
                <p className="text-xs text-amber-700 dark:text-amber-300 flex items-start gap-1.5">
                  <AlertTriangle size={12} className="mt-0.5 flex-shrink-0" />
                  Disbursement to elite members is managed off-platform. Use this balance for reconciliation.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Monthly Inflow History */}
      {pools.length > 0 && (
        <div className="bg-white dark:bg-[#181f2a] border border-gray-200 dark:border-gray-700/60 rounded-2xl p-5 shadow-sm">
          <h3 className="font-semibold text-gray-900 dark:text-white text-sm mb-4 flex items-center gap-2">
            <TrendingUp size={15} className="text-[#0d3b29]" /> Monthly Inflow History
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800/50 border-b border-gray-100 dark:border-gray-700">
                  <th className="text-left px-3 py-2 font-medium">Period</th>
                  <th className="text-right px-3 py-2 font-medium">Gross</th>
                  <th className="text-right px-3 py-2 font-medium">Net</th>
                  <th className="text-right px-3 py-2 font-medium">Digital</th>
                  <th className="text-right px-3 py-2 font-medium">Offline</th>
                  <th className="text-right px-3 py-2 font-medium">Available</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-gray-700/40">
                {pools.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                    <td className="px-3 py-2.5 font-medium text-gray-900 dark:text-white">{p.month}/{p.year}</td>
                    <td className="px-3 py-2.5 text-right text-gray-700 dark:text-gray-300">₦{Number(p.grossAmount).toLocaleString()}</td>
                    <td className="px-3 py-2.5 text-right text-emerald-700 dark:text-emerald-400">₦{Number(p.netAmount).toLocaleString()}</td>
                    <td className="px-3 py-2.5 text-right text-indigo-700 dark:text-indigo-400">₦{Number(p.digitalBalance).toLocaleString()}</td>
                    <td className="px-3 py-2.5 text-right text-amber-700 dark:text-amber-400">₦{Number(p.offlineBalance).toLocaleString()}</td>
                    <td className="px-3 py-2.5 text-right font-semibold text-gray-900 dark:text-white">₦{Number(p.available).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Filter bar for investments list */}
      <div className="flex gap-3 flex-wrap">
        {(["DRAFT","UNDER_REVIEW","APPROVED","FUNDED","COMPLETED","REJECTED"] as const).map((s) => (
          <button key={s} onClick={() => setStatusFilter(statusFilter === s ? undefined : s)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${statusFilter === s ? "bg-[#0d3b29] text-white border-[#0d3b29]" : "bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-700"}`}>
            {s}
          </button>
        ))}
      </div>

      {isLoading && <div className="flex items-center gap-2 text-gray-400 py-8 justify-center"><RefreshCw size={18} className="animate-spin" />Loading...</div>}
      {data && (
        <div className="space-y-4">
          {data.investments.map((inv) => (
            <div key={inv.id} className="bg-white dark:bg-[#181f2a] border border-gray-200 dark:border-gray-700/60 rounded-2xl p-5 shadow-sm">
              <div className="flex items-start gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center flex-shrink-0">
                  <TrendingUp size={18} className="text-indigo-600" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <StatusBadge status={inv.status} />
                    <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">{inv.category}</span>
                    <span className="text-xs text-gray-400">{inv._count.votes} votes</span>
                  </div>
                  <p className="font-semibold text-gray-900 dark:text-white">{inv.title}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2">{inv.description}</p>
                  <p className="text-sm font-semibold text-[#0d3b29] dark:text-emerald-400 mt-1">₦{Number(inv.amountRequested).toLocaleString()} requested</p>
                </div>
              </div>

              {/* Legal review input for DRAFT */}
              {inv.status === "DRAFT" && (
                <div className="flex gap-3 pt-3 border-t border-gray-100 dark:border-gray-700">
                  <input value={legalUrl[inv.id] ?? ""} onChange={(e) => setLegalUrl((p) => ({ ...p, [inv.id]: e.target.value }))}
                    placeholder="Legal review document URL..."
                    className="flex-1 px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-xl text-sm bg-white dark:bg-gray-800 text-[#232323] dark:text-white placeholder-[#b0b0b0] focus:border-[#0d3b29] outline-none" />
                  <button onClick={() => submitLegal.mutate({ investmentId: inv.id, legalReviewUrl: legalUrl[inv.id] ?? "" })}
                    disabled={submitLegal.isPending || !legalUrl[inv.id]}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-semibold disabled:opacity-50">
                    Submit Legal Review
                  </button>
                </div>
              )}

              {/* Approve/Reject for UNDER_REVIEW */}
              {inv.status === "UNDER_REVIEW" && (
                <div className="flex gap-3 pt-3 border-t border-gray-100 dark:border-gray-700">
                  <button onClick={() => approveInv.mutate({ investmentId: inv.id })} disabled={approveInv.isPending}
                    className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-sm font-semibold hover:bg-emerald-700 disabled:opacity-50">
                    Approve Investment
                  </button>
                  <button onClick={() => rejectInv.mutate({ investmentId: inv.id })} disabled={rejectInv.isPending}
                    className="px-4 py-2 bg-rose-600 text-white rounded-xl text-sm font-semibold hover:bg-rose-700 disabled:opacity-50">
                    Reject
                  </button>
                </div>
              )}
            </div>
          ))}
          {data.investments.length === 0 && <div className="text-center py-8 text-gray-400">No investments found.</div>}
        </div>
      )}
    </div>
  );
}

// ─── Contributions Tab ───────────────────────────────────────────────────────

function downloadCSV(filename: string, rows: string[][]): void {
  const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

function ContributionsTab() {
  const [clubId, setClubId] = useState("");
  const [monthFilter, setMonthFilter] = useState<number | undefined>();
  const [yearFilter, setYearFilter] = useState<number>(new Date().getFullYear());
  const [statusFilter, setStatusFilter] = useState<string | undefined>();

  const { data, isLoading, refetch } = api.eliteClub.adminListContributions.useQuery({
    clubId: clubId || undefined,
    month: monthFilter,
    year: yearFilter,
    status: statusFilter as any,
  });

  const rows = data?.contributions ?? [];

  function handleExport() {
    const headers = ["ID", "Member", "Email", "Club", "Month", "Year", "Total", "Empowerment", "Investment", "Status", "Paid At"];
    const csvRows = rows.map((c) => [
      c.id, c.member?.user?.name ?? "", c.member?.user?.email ?? "", c.clubId,
      String(c.month), String(c.year), String(Number(c.totalAmount)),
      String(Number(c.empowermentShare)), String(Number(c.investmentShare)),
      c.status, c.paidAt ? new Date(c.paidAt).toISOString() : "",
    ]);
    downloadCSV(`contributions_${Date.now()}.csv`, [headers, ...csvRows]);
  }

  return (
    <div className="space-y-5">
      {/* Filters */}
      <div className="flex gap-3 flex-wrap items-end">
        <div>
          <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">Club ID</label>
          <input value={clubId} onChange={(e) => setClubId(e.target.value)} placeholder="Leave blank for all..."
            className="px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-xl text-sm bg-white dark:bg-gray-800 text-[#232323] dark:text-white placeholder-[#b0b0b0] focus:border-[#0d3b29] outline-none w-48" />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">Month</label>
          <select value={monthFilter ?? ""} onChange={(e) => setMonthFilter(e.target.value ? Number(e.target.value) : undefined)}
            className="px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-xl text-sm bg-white dark:bg-gray-800 text-[#232323] dark:text-white focus:border-[#0d3b29] outline-none">
            <option value="">All</option>
            {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">Year</label>
          <input type="number" value={yearFilter} onChange={(e) => setYearFilter(Number(e.target.value))}
            className="px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-xl text-sm bg-white dark:bg-gray-800 text-[#232323] dark:text-white focus:border-[#0d3b29] outline-none w-24" />
        </div>
        <div className="flex gap-1">
          {(["PAID", "PENDING", "MISSED", "PARTIAL"] as const).map((s) => (
            <button key={s} onClick={() => setStatusFilter(statusFilter === s ? undefined : s)}
              className={`px-3 py-2 rounded-xl text-xs font-semibold border transition-all ${
                statusFilter === s ? "bg-[#0d3b29] text-white border-[#0d3b29]" : "bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-700"
              }`}>
              {s}
            </button>
          ))}
        </div>
        {rows.length > 0 && (
          <button onClick={handleExport}
            className="ml-auto flex items-center gap-2 px-4 py-2 border border-[#0d3b29] text-[#0d3b29] rounded-xl text-sm font-semibold hover:bg-[#0d3b29] hover:text-white transition-all">
            <Download size={14} /> Export CSV
          </button>
        )}
      </div>

      {isLoading && <div className="flex items-center gap-2 text-gray-400 py-8 justify-center"><RefreshCw size={18} className="animate-spin" />Loading contributions...</div>}

      {!isLoading && (
        <div className="bg-white dark:bg-[#181f2a] border border-gray-200 dark:border-gray-700/60 rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800/50 border-b border-gray-100 dark:border-gray-700">
                  <th className="text-left px-4 py-3 font-medium">Member</th>
                  <th className="text-left px-4 py-3 font-medium">Period</th>
                  <th className="text-right px-4 py-3 font-medium">Total</th>
                  <th className="text-right px-4 py-3 font-medium">Empowerment</th>
                  <th className="text-right px-4 py-3 font-medium">Investment</th>
                  <th className="text-left px-4 py-3 font-medium">Status</th>
                  <th className="text-left px-4 py-3 font-medium">Paid At</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-gray-700/40">
                {rows.map((c) => (
                  <tr key={c.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900 dark:text-white">{c.member?.user?.name ?? "—"}</div>
                      <div className="text-xs text-gray-400">{c.member?.user?.email}</div>
                    </td>
                    <td className="px-4 py-3 text-gray-700 dark:text-gray-300">{c.month}/{c.year}</td>
                    <td className="px-4 py-3 text-right font-semibold text-gray-900 dark:text-white">₦{Number(c.totalAmount).toLocaleString()}</td>
                    <td className="px-4 py-3 text-right text-emerald-700 dark:text-emerald-400">₦{Number(c.empowermentShare).toLocaleString()}</td>
                    <td className="px-4 py-3 text-right text-indigo-700 dark:text-indigo-400">₦{Number(c.investmentShare).toLocaleString()}</td>
                    <td className="px-4 py-3"><StatusBadge status={c.status} /></td>
                    <td className="px-4 py-3 text-xs text-gray-500 dark:text-gray-400">
                      {c.paidAt ? format(new Date(c.paidAt), "MMM d, yyyy") : "—"}
                    </td>
                  </tr>
                ))}
                {rows.length === 0 && (
                  <tr><td colSpan={7} className="px-4 py-10 text-center text-gray-400">No contributions found.</td></tr>
                )}
              </tbody>
            </table>
          </div>
          {data && data.total > rows.length && (
            <div className="px-4 py-3 text-xs text-gray-400 border-t border-gray-100 dark:border-gray-700 text-right">
              Showing {rows.length} of {data.total} records
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Legal Tab ────────────────────────────────────────────────────────────────

function LegalTab() {
  const [clubIdFilter, setClubIdFilter] = useState("");
  const [page, setPage] = useState(1);
  const { data, isLoading, refetch } = api.eliteClub.adminListLegalEvents.useQuery({
    clubId: clubIdFilter || undefined,
    page,
    pageSize: 30,
  });
  const resolve = api.eliteClub.adminResolveDefault.useMutation({
    onSuccess: () => { toast.success("Legal event resolved."); void refetch(); },
    onError: (e) => toast.error(e.message),
  });
  const [resolveNotes, setResolveNotes] = useState<Record<string, string>>({});

  const events = (data?.events ?? []) as any[];

  function handleExport() {
    const headers = ["ID", "Member", "Email", "Event Type", "Defaults", "Defaulted Amount", "Notes", "Created At", "Resolved At"];
    const csvRows = events.map((e) => [
      e.id, e.member?.user?.name ?? "", e.member?.user?.email ?? "", e.eventType,
      String(e.defaultCount ?? 0), String(Number(e.defaultedAmount ?? 0)),
      e.notes ?? "", new Date(e.createdAt).toISOString(),
      e.resolvedAt ? new Date(e.resolvedAt).toISOString() : "",
    ]);
    downloadCSV(`legal_events_${Date.now()}.csv`, [headers, ...csvRows]);
  }

  return (
    <div className="space-y-5">
      <div className="flex gap-3 items-end flex-wrap">
        <div>
          <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">Filter by Club ID</label>
          <input value={clubIdFilter} onChange={(e) => { setClubIdFilter(e.target.value); setPage(1); }}
            placeholder="Leave blank for all..."
            className="px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-xl text-sm bg-white dark:bg-gray-800 text-[#232323] dark:text-white placeholder-[#b0b0b0] focus:border-[#0d3b29] outline-none w-56" />
        </div>
        {events.length > 0 && (
          <button onClick={handleExport}
            className="ml-auto flex items-center gap-2 px-4 py-2 border border-[#0d3b29] text-[#0d3b29] rounded-xl text-sm font-semibold hover:bg-[#0d3b29] hover:text-white transition-all">
            <Download size={14} /> Export CSV
          </button>
        )}
      </div>

      {isLoading && <div className="flex items-center gap-2 text-gray-400 py-8 justify-center"><RefreshCw size={18} className="animate-spin" />Loading legal events...</div>}

      {!isLoading && (
        <div className="space-y-3">
          {events.map((e) => (
            <div key={e.id} className="bg-white dark:bg-[#181f2a] border border-gray-200 dark:border-gray-700/60 rounded-2xl p-5 shadow-sm">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1.5">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${STATUS_BADGE[e.eventType as string] ?? "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300"}`}>
                      {e.eventType}
                    </span>
                    {e.resolvedAt ? (
                      <span className="flex items-center gap-1 text-xs text-emerald-600"><CheckCircle2 size={12} />Resolved</span>
                    ) : (
                      <span className="flex items-center gap-1 text-xs text-rose-600"><AlertTriangle size={12} />Open</span>
                    )}
                    <span className="text-xs text-gray-400">{format(new Date(e.createdAt), "MMM d, yyyy")}</span>
                  </div>
                  <p className="font-medium text-gray-900 dark:text-white">{e.member?.user?.name ?? "Unknown"}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{e.member?.user?.email}</p>
                  {e.defaultCount > 0 && (
                    <p className="text-xs text-rose-600 mt-1">{e.defaultCount} default(s) · ₦{Number(e.defaultedAmount ?? 0).toLocaleString()}</p>
                  )}
                  {e.notes && <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 italic">{e.notes}</p>}
                  {e.resolvedAt && (
                    <p className="text-xs text-emerald-600 mt-1">Resolved {format(new Date(e.resolvedAt), "MMM d, yyyy")}</p>
                  )}
                </div>
                {!e.resolvedAt && (
                  <div className="flex gap-2 items-end">
                    <input value={resolveNotes[e.id] ?? ""} onChange={(ev) => setResolveNotes((p) => ({ ...p, [e.id]: ev.target.value }))}
                      placeholder="Resolution notes..."
                      className="px-3 py-1.5 border border-gray-200 dark:border-gray-700 rounded-xl text-xs bg-white dark:bg-gray-800 text-[#232323] dark:text-white placeholder-[#b0b0b0] focus:border-[#0d3b29] outline-none w-48" />
                    <button onClick={() => resolve.mutate({ legalEventId: e.id, notes: resolveNotes[e.id] })}
                      disabled={resolve.isPending}
                      className="px-4 py-1.5 bg-emerald-600 text-white rounded-xl text-xs font-semibold hover:bg-emerald-700 disabled:opacity-50 whitespace-nowrap">
                      Mark Resolved
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
          {events.length === 0 && (
            <div className="bg-white dark:bg-[#181f2a] border border-gray-200 dark:border-gray-700/60 rounded-2xl p-10 text-center text-gray-400 shadow-sm">
              <Gavel size={28} className="mx-auto mb-3 opacity-40" />
              <p className="text-sm">No legal events found.</p>
            </div>
          )}
          {data && data.total > events.length && (
            <div className="flex justify-center gap-3 pt-2">
              <button disabled={page === 1} onClick={() => setPage((p) => p - 1)}
                className="px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-xl text-sm disabled:opacity-50">Prev</button>
              <span className="flex items-center text-sm text-gray-500 dark:text-gray-400">Page {page}</span>
              <button onClick={() => setPage((p) => p + 1)} disabled={events.length < 30}
                className="px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-xl text-sm disabled:opacity-50">Next</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Settings Tab ─────────────────────────────────────────────────────────────

function SettingsTab() {
  const { data, isLoading } = api.eliteClub.getCmsSettings.useQuery();
  const updateSetting = api.eliteClub.updateCmsSetting.useMutation({
    onSuccess: () => toast.success("Setting saved."),
    onError: (e) => toast.error(e.message),
  });
  const [edits, setEdits] = useState<Record<string, string>>({});

  if (isLoading) return <div className="flex items-center gap-2 text-gray-400 py-10 justify-center"><RefreshCw size={18} className="animate-spin" />Loading settings...</div>;

  const settings = data?.settings ?? {};
  const keys = data?.keys ?? [];

  const SETTING_LABELS: Record<string, string> = {
    "elite_club_formation_status": "Formation Status (OPEN/PAUSED/CLOSED)",
    "elite_club_silver_bpt_min": "SILVER: Min BPT Holdings",
    "elite_club_silver_pac_min": "SILVER: Min PACToken Holdings",
    "elite_club_silver_monthly": "SILVER: Monthly Contribution (₦)",
    "elite_club_gold_bpt_min": "GOLD: Min BPT Holdings",
    "elite_club_gold_pac_min": "GOLD: Min PACToken Holdings",
    "elite_club_gold_monthly": "GOLD: Monthly Contribution (₦)",
    "elite_club_platinum_bpt_min": "PLATINUM: Min BPT Holdings",
    "elite_club_platinum_pac_min": "PLATINUM: Min PACToken Holdings",
    "elite_club_platinum_monthly": "PLATINUM: Monthly Contribution (₦)",
    "elite_club_diamond_bpt_min": "DIAMOND: Min BPT Holdings",
    "elite_club_diamond_pac_min": "DIAMOND: Min PACToken Holdings",
    "elite_club_diamond_monthly": "DIAMOND: Monthly Contribution (₦)",
    "elite_club_investment_quorum": "Investment Vote Quorum (default 8)",
    "elite_club_recommender_min_credibility": "Min Credibility to Recommend Investment",
    "elite_club_payout_min_credibility": "Min Credibility to Receive Payout",
    "elite_club_ops_fee_bpi_pct": "BPI Ops Fee % (of investment share)",
    "elite_club_ops_fee_elite_pct": "Elite Ops Fee % (of investment share)",
    "elite_gold_invite_gate_enabled": "Gold Plus Invite Gate Enabled (true = required, false = optional)",
    "elite_min_gold_plus_invites": "Min Gold Plus Invites Required (only enforced when gate enabled)",
    "elite_recommender_min_coop_size": "Min Gold Plus Co-op Count to Recommend Investment (default 2)",
    "elite_token_gate_enabled_silver": "SILVER: Token Gate Enabled (true/false)",
    "elite_token_gate_enabled_gold": "GOLD: Token Gate Enabled (true/false)",
    "elite_token_gate_enabled_platinum": "PLATINUM: Token Gate Enabled (true/false)",
    "elite_token_gate_enabled_diamond": "DIAMOND: Token Gate Enabled (true/false)",
    "elite_empowerment_share_pct": "Empowerment Share % (default 80)",
    "elite_credibility_delta_paid": "Credibility Delta: Paid Contribution (+, default 0.2)",
    "elite_credibility_delta_payout": "Credibility Delta: Payout Received (+, default 0.5)",
    "elite_credibility_delta_vote": "Credibility Delta: Investment Vote (+, default 0.1)",
    "elite_credibility_delta_optout": "Credibility Delta: Opt-Out (applied as −, default 1)",
    "elite_credibility_delta_missed": "Credibility Delta: Missed Contribution (applied as −, default 0.3)",
    "elite_vote_deadline_hours": "Vote Deadline Hours (0 = no deadline)",
    "elite_contribution_deadline_day": "Contribution Deadline Day of Month (default 15)",
    // Credibility — previously hardcoded
    "elite_credibility_init": "Credibility Init Score for New Members (default 5.0)",
    "elite_credibility_delta_default": "Credibility Delta: Default (applied as −, default 2)",
    "elite_credibility_delta_guarantee_default": "Credibility Delta: Guarantee Default (applied as −, default 1)",
    "elite_credibility_repeated_default_threshold": "Auto-Suspend Threshold: defaults before suspension (default 3)",
    // Guarantor thresholds
    "elite_guarantor_l1_min_credibility": "Guarantor L1: Min Credibility Score (default 7.0)",
    "elite_guarantor_l1_min_coop_size": "Guarantor L1: Min Gold Plus Co-op Members (default 0)",
    "elite_guarantor_l1_bpt_min": "Guarantor L1: Min BPT Holdings (default 0)",
    "elite_guarantor_l1_pactoken_min": "Guarantor L1: Min PACToken Holdings (default 0)",
    "elite_guarantor_l2_min_credibility": "Guarantor L2: Min Credibility Score (default 7.5)",
    "elite_guarantor_l2_min_coop_size": "Guarantor L2: Min Gold Plus Co-op Members (default 0)",
    "elite_guarantor_l2_bpt_min": "Guarantor L2: Min BPT Holdings (default 0)",
    "elite_guarantor_l2_pactoken_min": "Guarantor L2: Min PACToken Holdings (default 0)",
    "elite_guarantor_l3_min_credibility": "Guarantor L3: Min Credibility Score (default 8.0)",
    "elite_guarantor_l3_min_coop_size": "Guarantor L3: Min Gold Plus Co-op Members (default 0)",
    "elite_guarantor_l3_bpt_min": "Guarantor L3: Min BPT Holdings (default 0)",
    "elite_guarantor_l3_pactoken_min": "Guarantor L3: Min PACToken Holdings (default 0)",
    "elite_guarantor_l4_min_credibility": "Guarantor L4 (Senior): Min Credibility Score (default 9.0)",
    "elite_guarantor_l4_min_coop_size": "Guarantor L4 (Senior): Min Gold Plus Co-op Members (default 0)",
    "elite_guarantor_l4_bpt_min": "Guarantor L4 (Senior): Min BPT Holdings (default 0)",
    "elite_guarantor_l4_pactoken_min": "Guarantor L4 (Senior): Min PACToken Holdings (default 0)",
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {keys.map((key) => {
          const current = edits[key] ?? settings[key] ?? "";
          return (
            <div key={key} className="bg-white dark:bg-[#181f2a] border border-gray-200 dark:border-gray-700/60 rounded-2xl p-4 shadow-sm">
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">
                {SETTING_LABELS[key] ?? key}
              </label>
              <div className="flex gap-2">
                <input
                  value={current}
                  onChange={(e) => setEdits((p) => ({ ...p, [key]: e.target.value }))}
                  className="flex-1 px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-xl text-sm bg-white dark:bg-gray-800 text-[#232323] dark:text-white placeholder-[#b0b0b0] focus:border-[#0d3b29] outline-none"
                />
                <button
                  onClick={() => updateSetting.mutate({ key, value: edits[key] ?? settings[key] ?? "" })}
                  disabled={updateSetting.isPending || (edits[key] === undefined || edits[key] === settings[key])}
                  className="px-3 py-2 bg-[#0d3b29] text-white rounded-xl text-xs font-semibold disabled:opacity-40"
                >
                  Save
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Root Page ────────────────────────────────────────────────────────────────

export default function AdminEliteClubPage() {
  const [activeTab, setActiveTab] = useState<Tab>("overview");

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0f1621] p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <div className="flex items-center gap-4 mb-2">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-lg">
              <Crown size={24} className="text-white" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">Elite Club CMS</h1>
              <p className="text-gray-500 dark:text-gray-400 text-sm">Manage tiers, clubs, members, payouts and investments</p>
            </div>
          </div>
        </motion.div>

        {/* Tab navigation */}
        <div className="flex gap-1 flex-wrap mb-6 bg-white dark:bg-[#181f2a] border border-gray-200 dark:border-gray-700/60 rounded-2xl p-1.5 shadow-sm">
          {TABS.map((tab) => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                activeTab === tab.id
                  ? "bg-[#0d3b29] text-white shadow-sm"
                  : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700/50"
              }`}>
              {tab.icon}
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Tab content */}
        <AnimatePresence mode="wait">
          <motion.div key={activeTab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
            {activeTab === "overview"      && <OverviewTab />}
            {activeTab === "clubs"         && <ClubsTab />}
            {activeTab === "applications"  && <ApplicationsTab />}
            {activeTab === "payouts"       && <PayoutsTab />}
            {activeTab === "investments"   && <InvestmentsTab />}
            {activeTab === "settings"      && <SettingsTab />}
            {activeTab === "contributions" && <ContributionsTab />}
            {activeTab === "legal"          && <LegalTab />}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
