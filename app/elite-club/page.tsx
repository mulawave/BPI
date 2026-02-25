"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { api } from "@/client/trpc";
import toast from "react-hot-toast";
import {
  Crown,
  Star,
  Wallet,
  TrendingUp,
  Vote,
  ArrowRight,
  CheckCircle2,
  Clock,
  AlertTriangle,
  RefreshCw,
  ChevronRight,
  Shield,
  BarChart3,
  Target,
  DollarSign,
  Users,
  FileText,
  Plus,
  Upload,
  Info,
} from "lucide-react";
import { format } from "date-fns";

type Tier = "SILVER" | "GOLD" | "PLATINUM" | "DIAMOND";
type Tab = "overview" | "contribute" | "investments" | "credibility" | "apply";

const TIER_COLORS: Record<Tier, { gradient: string; bg: string; text: string; ring: string; badge: string }> = {
  SILVER:   { gradient: "from-slate-400 to-slate-600",   bg: "bg-slate-100 dark:bg-slate-800",   text: "text-slate-700 dark:text-slate-200",   ring: "ring-slate-300",  badge: "bg-slate-200 text-slate-800 dark:bg-slate-700 dark:text-slate-200" },
  GOLD:     { gradient: "from-amber-400 to-amber-600",   bg: "bg-amber-50 dark:bg-amber-900/20", text: "text-amber-700 dark:text-amber-300",   ring: "ring-amber-300",  badge: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200" },
  PLATINUM: { gradient: "from-violet-400 to-violet-600", bg: "bg-violet-50 dark:bg-violet-900/20", text: "text-violet-700 dark:text-violet-300", ring: "ring-violet-300", badge: "bg-violet-100 text-violet-800 dark:bg-violet-900/40 dark:text-violet-200" },
  DIAMOND:  { gradient: "from-cyan-400 to-cyan-600",     bg: "bg-cyan-50 dark:bg-cyan-900/20",   text: "text-cyan-700 dark:text-cyan-300",     ring: "ring-cyan-300",   badge: "bg-cyan-100 text-cyan-800 dark:bg-cyan-900/40 dark:text-cyan-200" },
};

const TIER_THRESHOLDS: Record<Tier, { bpt: number; pac: number; monthly: number }> = {
  SILVER:   { bpt: 1000,  pac: 500,  monthly: 50_000 },
  GOLD:     { bpt: 5000,  pac: 2000, monthly: 100_000 },
  PLATINUM: { bpt: 15000, pac: 5000, monthly: 250_000 },
  DIAMOND:  { bpt: 50000, pac: 20000, monthly: 500_000 },
};

function TierBadge({ tier }: { tier: Tier }) {
  const c = TIER_COLORS[tier];
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold ${c.badge}`}>
      <Crown size={11} />{tier}
    </span>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    ACTIVE:   "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-200",
    PENDING:  "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-200",
    PAID:     "bg-emerald-100 text-emerald-800",
    BLOCKED:  "bg-rose-100 text-rose-800",
    ACCEPTED: "bg-emerald-100 text-emerald-800",
    REJECTED: "bg-rose-100 text-rose-800",
    UNDER_REVIEW: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-200",
  };
  return <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold ${map[status] ?? "bg-gray-100 text-gray-700"}`}>{status}</span>;
}

// ─── Credibility Score Ring ───────────────────────────────────────────────────

function CredibilityRing({ score }: { score: number }) {
  const pct = Math.min(100, (score / 10) * 100);
  const color = score >= 7 ? "#059669" : score >= 4 ? "#d97706" : "#dc2626";
  const r = 36;
  const circ = 2 * Math.PI * r;
  const dash = (pct / 100) * circ;
  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width="88" height="88" className="-rotate-90">
        <circle cx="44" cy="44" r={r} fill="none" stroke="#e5e7eb" strokeWidth="7" />
        <circle cx="44" cy="44" r={r} fill="none" stroke={color} strokeWidth="7" strokeDasharray={`${dash} ${circ}`} strokeLinecap="round" />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="text-xl font-bold text-gray-900 dark:text-white">{score.toFixed(1)}</span>
        <span className="text-xs text-gray-400">/ 10</span>
      </div>
    </div>
  );
}

// ─── Overview Tab ─────────────────────────────────────────────────────────────

function OverviewTab() {
  const { data, isLoading } = api.eliteClub.myClubs.useQuery();

  if (isLoading) return (
    <div className="flex items-center gap-2 text-gray-400 py-16 justify-center">
      <RefreshCw size={20} className="animate-spin" /> Loading your clubs...
    </div>
  );

  const memberships = data?.memberships ?? [];

  if (memberships.length === 0) {
    return (
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-[#181f2a] border border-gray-200 dark:border-gray-700/60 rounded-2xl p-10 text-center shadow-sm">
        <div className="w-16 h-16 rounded-2xl bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center mx-auto mb-4">
          <Crown size={28} className="text-amber-500" />
        </div>
        <h3 className="font-semibold text-gray-900 dark:text-white text-lg mb-2">You're not in any Elite Club yet</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 max-w-sm mx-auto">
          Elite Club is an exclusive empowerment rotation programme for BPT and PACToken holders. Check your eligibility and apply today.
        </p>
        <button className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#0d3b29] text-white rounded-xl text-sm font-semibold hover:bg-[#0a2e20] transition-all">
          Check Eligibility <ArrowRight size={14} />
        </button>
      </motion.div>
    );
  }

  return (
    <div className="space-y-4">
      {memberships.map((m, i) => {
        const tier = m.club.tier as Tier;
        const c = TIER_COLORS[tier];
        return (
          <motion.div key={m.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
            className={`bg-white dark:bg-[#181f2a] border border-gray-200 dark:border-gray-700/60 rounded-2xl p-5 shadow-sm ring-1 ${c.ring}`}>
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              {/* Tier icon */}
              <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${c.gradient} flex items-center justify-center flex-shrink-0 shadow-md`}>
                <Crown size={24} className="text-white" />
              </div>

              {/* Info */}
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <TierBadge tier={tier} />
                  <StatusBadge status={m.status} />
                </div>
                <h3 className="font-semibold text-gray-900 dark:text-white">{m.club.name}</h3>
                <div className="flex flex-wrap gap-4 mt-2">
                  <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                    <Target size={12} /> Rotation #{m.rotationNumber}
                  </span>
                  <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                    <Users size={12} /> {m.club._count.members}/11 members
                  </span>
                  <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                    <Star size={12} /> Credibility {Number(m.credibilityScore).toFixed(1)}/10
                  </span>
                  {m.empowermentReceived && (
                    <span className="text-xs text-emerald-600 font-semibold flex items-center gap-1">
                      <CheckCircle2 size={12} /> Empowerment Received
                    </span>
                  )}
                  {m.empowermentPending && !m.empowermentReceived && (
                    <span className="text-xs text-amber-600 font-semibold flex items-center gap-1">
                      <Clock size={12} /> Payout Pending
                    </span>
                  )}
                </div>
              </div>

              {/* Credibility ring */}
              <div className="flex-shrink-0">
                <CredibilityRing score={Number(m.credibilityScore)} />
              </div>
            </div>

            {/* Progress bar: total contributed vs monthly target */}
            {(() => {
              const target = TIER_THRESHOLDS[tier].monthly;
              const contributed = Number(m.totalContributed);
              const cycles = Math.floor(contributed / target);
              const progress = Math.min(100, ((contributed % target) / target) * 100);
              return (
                <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                  <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mb-1.5">
                    <span>Monthly Contribution Progress</span>
                    <span>₦{(contributed % target).toLocaleString()} / ₦{target.toLocaleString()}</span>
                  </div>
                  <div className="h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                    <motion.div initial={{ width: 0 }} animate={{ width: `${progress}%` }} transition={{ duration: 0.8 }}
                      className="h-full rounded-full bg-gradient-to-r from-[#0d3b29] to-emerald-500" />
                  </div>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{cycles} full cycle(s) completed</p>
                </div>
              );
            })()}
          </motion.div>
        );
      })}
    </div>
  );
}

// ─── Contributions Tab ────────────────────────────────────────────────────────

function ContributionsTab() {
  const { data, isLoading } = api.eliteClub.myContributions.useQuery({ pageSize: 36 });

  if (isLoading) return (
    <div className="flex items-center gap-2 text-gray-400 py-16 justify-center">
      <RefreshCw size={20} className="animate-spin" /> Loading contributions...
    </div>
  );

  const contributions = data?.contributions ?? [];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-2">
        <div className="bg-white dark:bg-[#181f2a] border border-gray-200 dark:border-gray-700/60 rounded-2xl p-4 shadow-sm">
          <p className="text-xs text-gray-500 dark:text-gray-400 uppercase font-medium tracking-wide mb-1">Total Paid</p>
          <p className="text-xl font-bold text-gray-900 dark:text-white">
            {contributions.filter((c) => c.status === "PAID").length} periods
          </p>
        </div>
        <div className="bg-white dark:bg-[#181f2a] border border-gray-200 dark:border-gray-700/60 rounded-2xl p-4 shadow-sm">
          <p className="text-xs text-gray-500 dark:text-gray-400 uppercase font-medium tracking-wide mb-1">Total Amount</p>
          <p className="text-xl font-bold text-[#0d3b29] dark:text-emerald-400">
            ₦{contributions.reduce((s, c) => s + Number(c.totalAmount), 0).toLocaleString()}
          </p>
        </div>
        <div className="bg-white dark:bg-[#181f2a] border border-gray-200 dark:border-gray-700/60 rounded-2xl p-4 shadow-sm">
          <p className="text-xs text-gray-500 dark:text-gray-400 uppercase font-medium tracking-wide mb-1">Pending</p>
          <p className="text-xl font-bold text-amber-600">
            {contributions.filter((c) => c.status === "PENDING").length} period(s)
          </p>
        </div>
      </div>

      {contributions.length === 0 ? (
        <div className="bg-white dark:bg-[#181f2a] border border-gray-200 dark:border-gray-700/60 rounded-2xl p-10 text-center shadow-sm">
          <Wallet size={28} className="mx-auto mb-3 text-gray-300 dark:text-gray-600" />
          <p className="text-sm text-gray-500 dark:text-gray-400">No contributions recorded yet.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {contributions.map((c, i) => (
            <motion.div key={c.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.02 }}
              className="bg-white dark:bg-[#181f2a] border border-gray-100 dark:border-gray-700/40 rounded-xl px-5 py-3.5 flex items-center gap-4 shadow-sm">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center flex-shrink-0">
                <Wallet size={16} className="text-emerald-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-gray-900 dark:text-white">
                  {c.month}/{c.year}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Empowerment ₦{Number(c.empowermentShare).toLocaleString()} · Investment ₦{Number(c.investmentShare).toLocaleString()}
                </p>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-sm font-bold text-gray-900 dark:text-white">₦{Number(c.totalAmount).toLocaleString()}</p>
                <StatusBadge status={c.status} />
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Investments Tab ──────────────────────────────────────────────────────────

function InvestmentsTab() {
  const [clubId, setClubId] = useState("");
  const [activeClubId, setActiveClubId] = useState<string>("");
  const { data: clubsData } = api.eliteClub.myClubs.useQuery();
  const { data, isLoading, refetch } = api.eliteClub.listInvestments.useQuery(
    { clubId: activeClubId },
    { enabled: !!activeClubId },
  );
  const castVote = api.eliteClub.castVote.useMutation({
    onSuccess: () => { toast.success("Vote recorded!"); refetch(); },
    onError: (e) => toast.error(e.message),
  });
  const [voteComment, setVoteComment] = useState<Record<string, string>>({});

  const memberships = clubsData?.memberships ?? [];

  return (
    <div className="space-y-5">
      {/* Club selector */}
      {memberships.length > 0 && (
        <div className="flex gap-2 flex-wrap">
          {memberships.map((m) => (
            <button key={m.id} onClick={() => setActiveClubId(m.club.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${activeClubId === m.club.id ? "bg-[#0d3b29] text-white border-[#0d3b29]" : "bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:border-[#0d3b29]"}`}>
              <Crown size={11} />{m.club.name}
            </button>
          ))}
        </div>
      )}

      {!activeClubId && <div className="text-center py-10 text-gray-400 dark:text-gray-500 text-sm">Select a club above to view investments.</div>}

      {isLoading && <div className="flex items-center gap-2 text-gray-400 py-10 justify-center"><RefreshCw size={18} className="animate-spin" />Loading...</div>}

      {data && (
        <div className="space-y-4">
          {data.investments.map((inv, i) => {
            const myVote = inv.votes?.[0];
            return (
              <motion.div key={inv.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                className="bg-white dark:bg-[#181f2a] border border-gray-200 dark:border-gray-700/60 rounded-2xl p-5 shadow-sm">
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
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-2">{inv.description}</p>
                    <p className="text-sm font-bold text-[#0d3b29] dark:text-emerald-400 mt-1">
                      ₦{Number(inv.amountRequested).toLocaleString()} requested
                      {inv.expectedReturn && ` · ₦${Number(inv.expectedReturn).toLocaleString()} expected return`}
                    </p>
                  </div>
                </div>

                {/* Voting panel — only for UNDER_REVIEW and no existing vote */}
                {inv.status === "UNDER_REVIEW" && !myVote && (
                  <div className="pt-3 border-t border-gray-100 dark:border-gray-700">
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-2 flex items-center gap-1">
                      <Vote size={12} /> Cast your vote on this investment
                    </p>
                    <input value={voteComment[inv.id] ?? ""} onChange={(e) => setVoteComment((p) => ({ ...p, [inv.id]: e.target.value }))}
                      placeholder="Optional comment..."
                      className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-xl text-sm bg-white dark:bg-gray-800 text-[#232323] dark:text-white placeholder-[#b0b0b0] focus:border-[#0d3b29] outline-none mb-3" />
                    <div className="flex gap-2">
                      {(["ACCEPT", "ABSTAIN", "REJECT"] as const).map((v) => {
                        const colors = { ACCEPT: "bg-emerald-600 hover:bg-emerald-700", ABSTAIN: "bg-gray-500 hover:bg-gray-600", REJECT: "bg-rose-600 hover:bg-rose-700" };
                        return (
                          <button key={v} onClick={() => castVote.mutate({ investmentId: inv.id, vote: v, comment: voteComment[inv.id] })}
                            disabled={castVote.isPending}
                            className={`flex-1 py-2 rounded-xl text-white text-xs font-semibold transition-all ${colors[v]} disabled:opacity-50`}>
                            {v}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {myVote && (
                  <div className="pt-3 border-t border-gray-100 dark:border-gray-700 flex items-center gap-2">
                    <CheckCircle2 size={14} className="text-emerald-600" />
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      You voted <span className="font-semibold text-gray-900 dark:text-white">{myVote.vote}</span>
                      {myVote.comment && <> · "{myVote.comment}"</>}
                    </span>
                  </div>
                )}
              </motion.div>
            );
          })}
          {data.investments.length === 0 && (
            <div className="text-center py-10 text-gray-400 dark:text-gray-500">
              <TrendingUp size={28} className="mx-auto mb-2 opacity-30" />
              <p className="text-sm">No investments for this club yet.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Credibility Tab ──────────────────────────────────────────────────────────

function CredibilityTab() {
  const { data: clubsData } = api.eliteClub.myClubs.useQuery();
  const [activeClubId, setActiveClubId] = useState<string>("");
  const { data, isLoading } = api.eliteClub.myCredibilityHistory.useQuery(
    { clubId: activeClubId },
    { enabled: !!activeClubId },
  );

  const memberships = clubsData?.memberships ?? [];

  const EVENT_LABELS: Record<string, { label: string; color: string }> = {
    CONTRIBUTION_ON_TIME: { label: "On-time Contribution", color: "text-emerald-600" },
    CONTRIBUTION_LATE:    { label: "Late Contribution",    color: "text-amber-600" },
    DEFAULT:              { label: "Default",              color: "text-rose-600" },
    INVESTMENT_VOTE:      { label: "Investment Vote",      color: "text-indigo-600" },
    PAYOUT_RECEIVED:      { label: "Payout Received",      color: "text-emerald-600" },
    OPT_OUT:              { label: "Opted Out",            color: "text-orange-600" },
    ADMIN_ADJUSTMENT:     { label: "Admin Adjustment",     color: "text-slate-600" },
  };

  return (
    <div className="space-y-5">
      {/* Club selector */}
      {memberships.length > 0 && (
        <div className="flex gap-2 flex-wrap">
          {memberships.map((m) => (
            <button key={m.id} onClick={() => setActiveClubId(m.club.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${activeClubId === m.club.id ? "bg-[#0d3b29] text-white border-[#0d3b29]" : "bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:border-[#0d3b29]"}`}>
              <Crown size={11} />{m.club.name}
            </button>
          ))}
        </div>
      )}

      {!activeClubId && <div className="text-center py-10 text-gray-400 dark:text-gray-500 text-sm">Select a club to view your credibility history.</div>}

      {data && (
        <div className="space-y-4">
          {/* Score display */}
          <div className="bg-white dark:bg-[#181f2a] border border-gray-200 dark:border-gray-700/60 rounded-2xl p-6 shadow-sm flex items-center gap-6">
            <CredibilityRing score={data.score} />
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-1">Credibility Score</h3>
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                  <div className="w-2 h-2 rounded-full bg-emerald-500" /> 7–10: Eligible to recommend investments
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                  <div className="w-2 h-2 rounded-full bg-amber-500" /> 3–6: Standard member
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                  <div className="w-2 h-2 rounded-full bg-rose-500" /> 0–2: Payout blocked risk
                </div>
              </div>
            </div>
          </div>

          {/* History */}
          <div className="space-y-2">
            {data.events.map((evt, i) => {
              const info = EVENT_LABELS[evt.event] ?? { label: evt.event, color: "text-gray-600" };
              const deltaSign = Number(evt.delta) >= 0 ? "+" : "";
              return (
                <motion.div key={evt.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }}
                  className="bg-white dark:bg-[#181f2a] border border-gray-100 dark:border-gray-700/40 rounded-xl px-5 py-3.5 flex items-center gap-4 shadow-sm">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${Number(evt.delta) >= 0 ? "bg-emerald-50 dark:bg-emerald-900/20" : "bg-rose-50 dark:bg-rose-900/20"}`}>
                    <Star size={15} className={Number(evt.delta) >= 0 ? "text-emerald-600" : "text-rose-600"} />
                  </div>
                  <div className="flex-1">
                    <p className={`text-sm font-semibold ${info.color}`}>{info.label}</p>
                    {evt.reason && <p className="text-xs text-gray-400 dark:text-gray-500">{evt.reason}</p>}
                    <p className="text-xs text-gray-400 dark:text-gray-500">{format(new Date(evt.createdAt), "MMM d, yyyy")}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className={`font-bold text-sm ${Number(evt.delta) >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
                      {deltaSign}{Number(evt.delta).toFixed(1)}
                    </p>
                    <p className="text-xs text-gray-400">{Number(evt.scoreBefore).toFixed(1)} → {Number(evt.scoreAfter).toFixed(1)}</p>
                  </div>
                </motion.div>
              );
            })}
            {data.events.length === 0 && (
              <div className="text-center py-8 text-gray-400 text-sm">No credibility events yet.</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Apply Tab ────────────────────────────────────────────────────────────────

function ApplyTab() {
  const [selectedTier, setSelectedTier] = useState<Tier>("SILVER");
  const eligibilityQuery = api.eliteClub.checkEligibility.useQuery({ tier: selectedTier });
  const submitApp = api.eliteClub.submitApplication.useMutation({
    onSuccess: () => toast.success("Application submitted! We'll review it shortly."),
    onError: (e) => toast.error(e.message),
  });
  const [notes, setNotes] = useState("");

  const elig = eligibilityQuery.data;

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      {/* Tier selector */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {(["SILVER", "GOLD", "PLATINUM", "DIAMOND"] as Tier[]).map((t) => {
          const c = TIER_COLORS[t];
          return (
            <button key={t} onClick={() => setSelectedTier(t)}
              className={`p-4 rounded-2xl border-2 transition-all text-center ${selectedTier === t ? `border-current ${c.bg} ${c.text}` : "border-gray-200 dark:border-gray-700 hover:border-gray-300"}`}>
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${c.gradient} flex items-center justify-center mx-auto mb-2 shadow-sm`}>
                <Crown size={18} className="text-white" />
              </div>
              <p className={`text-xs font-bold ${selectedTier === t ? c.text : "text-gray-600 dark:text-gray-400"}`}>{t}</p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">₦{TIER_THRESHOLDS[t].monthly.toLocaleString()}/mo</p>
            </button>
          );
        })}
      </div>

      {/* Eligibility card */}
      {elig && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
          className={`rounded-2xl p-5 border ${elig.eligible ? "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-700" : "bg-amber-50 dark:bg-amber-900/10 border-amber-200 dark:border-amber-700"}`}>
          <div className="flex items-center gap-3 mb-3">
            {elig.eligible ? <CheckCircle2 size={20} className="text-emerald-600" /> : <AlertTriangle size={20} className="text-amber-600" />}
            <p className="font-semibold text-gray-900 dark:text-white">
              {elig.eligible ? "You are eligible to apply for " + selectedTier : "Not yet eligible for " + selectedTier}
            </p>
          </div>
          <div className="space-y-2">
            {[
              { label: `BPT: ${elig.current.bpt.toLocaleString()} / ${elig.required.bpt.toLocaleString()} required`, met: elig.hasBpt },
              { label: `PACToken: ${elig.current.pac.toLocaleString()} / ${elig.required.pac.toLocaleString()} required`, met: elig.hasPac },
              { label: "No active membership in this tier", met: !elig.alreadyMember },
              { label: "No pending application", met: !elig.hasPendingApp },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-2 text-sm">
                {item.met ? <CheckCircle2 size={14} className="text-emerald-600 flex-shrink-0" /> : <AlertTriangle size={14} className="text-amber-600 flex-shrink-0" />}
                <span className={item.met ? "text-gray-700 dark:text-gray-300" : "text-amber-700 dark:text-amber-400"}>{item.label}</span>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Notes + Submit */}
      {elig?.eligible && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">Notes (optional)</label>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} placeholder="Any additional information for the admin team..."
              className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl text-sm bg-white dark:bg-gray-800 text-[#232323] dark:text-white placeholder-[#b0b0b0] focus:border-[#0d3b29] outline-none resize-none" />
          </div>
          <button onClick={() => submitApp.mutate({ tier: selectedTier, notes })} disabled={submitApp.isPending}
            className="w-full py-3 bg-[#0d3b29] text-white rounded-xl font-semibold text-sm hover:bg-[#0a2e20] transition-all disabled:opacity-50 flex items-center justify-center gap-2">
            {submitApp.isPending ? <><RefreshCw size={15} className="animate-spin" />Submitting...</> : <><FileText size={15} />Submit Application</>}
          </button>
          <p className="text-xs text-gray-400 dark:text-gray-500 text-center">
            <Info size={11} className="inline mr-1" />After submitting, upload your documents and token holding proof to complete the application.
          </p>
        </motion.div>
      )}

      {/* Requirements info */}
      <div className="bg-white dark:bg-[#181f2a] border border-gray-200 dark:border-gray-700/60 rounded-2xl p-5 shadow-sm">
        <h4 className="font-semibold text-gray-900 dark:text-white text-sm mb-3 flex items-center gap-2">
          <Shield size={15} className="text-[#0d3b29]" /> {selectedTier} Tier Requirements
        </h4>
        <div className="grid grid-cols-2 gap-3 text-xs text-gray-600 dark:text-gray-400">
          <div><span className="font-medium text-gray-800 dark:text-gray-200">BPT Holdings:</span> {TIER_THRESHOLDS[selectedTier].bpt.toLocaleString()}</div>
          <div><span className="font-medium text-gray-800 dark:text-gray-200">PACToken:</span> {TIER_THRESHOLDS[selectedTier].pac.toLocaleString()}</div>
          <div><span className="font-medium text-gray-800 dark:text-gray-200">Monthly Contribution:</span> ₦{TIER_THRESHOLDS[selectedTier].monthly.toLocaleString()}</div>
          <div><span className="font-medium text-gray-800 dark:text-gray-200">Club Size:</span> 11 members</div>
        </div>
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-3">
          Each club runs an 11-month empowerment rotation. Members contribute monthly. Each month, one member receives the full empowerment payout per the rotation schedule. 20% of contributions go to the collective investment pool.
        </p>
      </div>
    </div>
  );
}

// ─── Root Page ────────────────────────────────────────────────────────────────

const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: "overview",      label: "My Clubs",       icon: <Crown size={15} /> },
  { id: "contribute",    label: "Contributions",   icon: <Wallet size={15} /> },
  { id: "investments",   label: "Investments",     icon: <TrendingUp size={15} /> },
  { id: "credibility",   label: "Credibility",     icon: <Star size={15} /> },
  { id: "apply",         label: "Apply",           icon: <Plus size={15} /> },
];

export default function EliteClubPage() {
  const [activeTab, setActiveTab] = useState<Tab>("overview");

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0f1621] p-4 sm:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-lg flex-shrink-0">
              <Crown size={26} className="text-white" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">Elite Club</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">Exclusive BPT/PACToken empowerment rotation programme</p>
            </div>
          </div>
        </motion.div>

        {/* Tabs */}
        <div className="flex gap-1 flex-wrap mb-6 bg-white dark:bg-[#181f2a] border border-gray-200 dark:border-gray-700/60 rounded-2xl p-1.5 shadow-sm">
          {TABS.map((tab) => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all flex-1 justify-center sm:flex-initial ${
                activeTab === tab.id
                  ? "bg-[#0d3b29] text-white shadow-sm"
                  : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700/50"
              }`}>
              {tab.icon}
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Content */}
        <AnimatePresence mode="wait">
          <motion.div key={activeTab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
            {activeTab === "overview"    && <OverviewTab />}
            {activeTab === "contribute"  && <ContributionsTab />}
            {activeTab === "investments" && <InvestmentsTab />}
            {activeTab === "credibility" && <CredibilityTab />}
            {activeTab === "apply"       && <ApplyTab />}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
