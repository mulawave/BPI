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

      {/* Formation status card */}
      <div className="bg-white dark:bg-[#181f2a] border border-gray-200 dark:border-gray-700/60 rounded-2xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center">
              <Activity size={20} className="text-amber-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white">Club Formation Status</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">Controls whether new members can apply to form clubs</p>
            </div>
          </div>
          <StatusBadge status={formationQuery.data?.formationStatus ?? "..."} />
        </div>
        <div className="flex gap-3 flex-wrap">
          {(["OPEN", "PAUSED", "CLOSED"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setStatus.mutate({ status: s })}
              disabled={setStatus.isPending || formationQuery.data?.formationStatus === s}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all border ${
                formationQuery.data?.formationStatus === s
                  ? "bg-[#0d3b29] text-white border-[#0d3b29]"
                  : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:border-[#0d3b29] hover:text-[#0d3b29]"
              }`}
            >
              {s}
            </button>
          ))}
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
  const [statusFilter, setStatusFilter] = useState<string | undefined>();
  const { data, isLoading, refetch } = api.eliteClub.listInvestments.useQuery(
    { clubId: searchClubId, status: statusFilter as any },
    { enabled: searchClubId !== "__placeholder__" },
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

  return (
    <div className="space-y-5">
      <div className="flex gap-3 flex-wrap">
        <input value={clubId} onChange={(e) => setClubId(e.target.value)} placeholder="Enter Club ID..."
          className="px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-xl text-sm bg-white dark:bg-gray-800 text-[#232323] dark:text-white placeholder-[#b0b0b0] focus:border-[#0d3b29] outline-none max-w-xs" />
        <button onClick={() => setSearchClubId(clubId)} disabled={!clubId}
          className="px-4 py-2 bg-[#0d3b29] text-white rounded-xl text-sm font-semibold disabled:opacity-50">Load</button>
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
            {(activeTab === "contributions" || activeTab === "legal") && (
              <div className="bg-white dark:bg-[#181f2a] border border-gray-200 dark:border-gray-700/60 rounded-2xl p-10 text-center text-gray-400 dark:text-gray-500 shadow-sm">
                <Activity size={32} className="mx-auto mb-3 opacity-40" />
                <p className="text-sm">This section is accessible via the full admin panel. Use the Clubs and Payouts tabs to manage {activeTab}.</p>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
