"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { api } from "@/client/trpc";
import toast from "react-hot-toast";
import {
  DollarSign,
  ChevronLeft,
  RefreshCw,
  CheckCircle2,
  Clock,
  Search,
  TrendingUp,
  School,
  Users,
  BadgeDollarSign,
  X,
  Wallet,
} from "lucide-react";
import Link from "next/link";

// ─── Types ──────────────────────────────────────────────────────────────────
type PayStatus = "PENDING" | "PAID" | "REFUNDED";
type SponsorType = "CHILD_PARENT" | "SCHOOL_COHORT" | "PRIZE_POOL";
type AllocPool = "SCHOOL_POOL" | "EVENT_PRIZE_POOL";

const PAY_BADGE: Record<PayStatus, string> = {
  PENDING:  "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-200",
  PAID:     "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-200",
  REFUNDED: "bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-200",
};
const SPONSOR_LABEL: Record<SponsorType, string> = {
  CHILD_PARENT:  "Child + Parent",
  SCHOOL_COHORT: "School Cohort",
  PRIZE_POOL:    "Prize Pool",
};
const POOL_LABEL: Record<AllocPool, string> = {
  SCHOOL_POOL:      "School Pool",
  EVENT_PRIZE_POOL: "Event Prize Pool",
};

function fmt(n: number) {
  return "₦" + n.toLocaleString("en-NG");
}

function StatCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string; color: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700 p-5 flex items-center gap-4"
    >
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}>{icon}</div>
      <div>
        <p className="text-xs text-slate-500 dark:text-slate-400">{label}</p>
        <p className="text-xl font-black text-slate-900 dark:text-white">{value}</p>
      </div>
    </motion.div>
  );
}

// ─── Confirm Payment Modal ────────────────────────────────────────────────────
function ConfirmPayModal({
  pkg,
  onClose,
  onConfirmed,
}: {
  pkg: { id: string; sponsor: { name: string }; totalAmount: unknown };
  onClose: () => void;
  onConfirmed: () => void;
}) {
  const [ref, setRef] = useState("");
  const confirmMut = api.techquiz.confirmSponsorshipPayment.useMutation({
    onSuccess: () => {
      toast.success("Payment confirmed");
      onConfirmed();
      onClose();
    },
    onError: (e) => toast.error(e.message),
  });

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white dark:bg-slate-900 rounded-2xl p-6 w-full max-w-sm shadow-2xl border border-slate-200 dark:border-slate-700"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-slate-900 dark:text-white">Confirm Payment</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition">
            <X size={18} />
          </button>
        </div>
        <p className="text-sm text-slate-600 dark:text-slate-300 mb-2">
          Confirm payment of <strong>{fmt(Number(pkg.totalAmount))}</strong> from{" "}
          <strong>{pkg.sponsor.name}</strong>?
        </p>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
          This will set status to <span className="font-semibold text-emerald-600">PAID</span> and allocate funds to the assigned pool.
        </p>
        <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">Payment Reference</label>
        <input
          type="text"
          value={ref}
          onChange={(e) => setRef(e.target.value)}
          placeholder="e.g. TRX-2026-00123"
          className="w-full border border-slate-300 dark:border-slate-600 rounded-xl px-3 py-2.5 text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 mb-4"
        />
        <div className="flex gap-3">
          <button
            onClick={() => confirmMut.mutate({ packageId: pkg.id, paymentReference: ref })}
            disabled={confirmMut.isPending || !ref.trim()}
            className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold transition disabled:opacity-60"
          >
            {confirmMut.isPending ? "Confirming…" : "Confirm Payment"}
          </button>
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 text-sm font-semibold transition hover:bg-slate-200 dark:hover:bg-slate-600"
          >
            Cancel
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function AdminTechQuizSponsorshipPage() {
  const [selectedEventId, setSelectedEventId] = useState("");
  const [search, setSearch] = useState("");
  const [confirmPkg, setConfirmPkg] = useState<any>(null);
  const utils = api.useUtils();

  const eventsQ = api.techquiz.adminListEvents.useQuery({ page: 1, perPage: 100 });
  const dashQ = api.techquiz.adminSponsorshipDashboard.useQuery(
    { eventId: selectedEventId },
    { enabled: !!selectedEventId }
  );

  const events = eventsQ.data?.events ?? [];
  const data = dashQ.data;
  const packages = (data?.packages ?? []).filter((p: any) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      p.sponsor?.name?.toLowerCase().includes(q) ||
      p.school?.name?.toLowerCase().includes(q)
    );
  });

  function handleConfirmed() {
    utils.techquiz.adminSponsorshipDashboard.invalidate({ eventId: selectedEventId });
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-emerald-50/20 dark:from-slate-950 dark:to-slate-900 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <Link
              href="/admin/techquiz"
              className="w-8 h-8 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center hover:bg-slate-50 dark:hover:bg-slate-700 transition"
            >
              <ChevronLeft size={16} className="text-slate-600 dark:text-slate-300" />
            </Link>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-600 to-green-700 flex items-center justify-center shadow-lg">
              <Wallet size={20} className="text-white" />
            </div>
            <div>
              <h1 className="text-xl font-black text-slate-900 dark:text-white">Sponsorship</h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">Pool balances, sponsors, and payments</p>
            </div>
          </div>
          <button
            onClick={() => dashQ.refetch()}
            disabled={dashQ.isFetching}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition"
          >
            <RefreshCw size={14} className={dashQ.isFetching ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>

        {/* Event Selector */}
        <div className="mb-6">
          <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">Select Event</label>
          <select
            value={selectedEventId}
            onChange={(e) => setSelectedEventId(e.target.value)}
            className="w-full max-w-md border border-slate-300 dark:border-slate-600 rounded-xl px-4 py-2.5 text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="">— Choose an event —</option>
            {events.map((ev: any) => (
              <option key={ev.id} value={ev.id}>
                {ev.title} ({ev.state}) — {ev.status}
              </option>
            ))}
          </select>
        </div>

        {!selectedEventId && (
          <div className="text-center py-20 text-slate-500 dark:text-slate-400">
            <Wallet size={40} className="mx-auto mb-3 opacity-30" />
            <p className="text-sm">Select an event to view sponsorship data</p>
          </div>
        )}

        {selectedEventId && dashQ.isPending && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-24 rounded-2xl bg-slate-200 dark:bg-slate-700 animate-pulse" />
            ))}
          </div>
        )}

        {selectedEventId && data && (
          <>
            {/* Pool stat cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
              <StatCard
                icon={<TrendingUp size={22} className="text-white" />}
                label="Total Raised"
                value={fmt(data.totalRaised)}
                color="bg-gradient-to-br from-emerald-500 to-emerald-700"
              />
              <StatCard
                icon={<School size={22} className="text-white" />}
                label="School Pool"
                value={fmt(data.schoolPoolTotal)}
                color="bg-gradient-to-br from-blue-500 to-blue-700"
              />
              <StatCard
                icon={<BadgeDollarSign size={22} className="text-white" />}
                label="Event Prize Pool"
                value={fmt(data.eventPrizePoolTotal)}
                color="bg-gradient-to-br from-violet-500 to-violet-700"
              />
            </div>

            {/* Search */}
            <div className="relative mb-4 max-w-sm">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                placeholder="Search sponsor or school…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            {/* Package table */}
            <div className="bg-white dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
              <div className="px-5 py-3 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
                <p className="text-sm font-bold text-slate-900 dark:text-white">
                  Sponsorship Packages
                  <span className="ml-2 text-xs text-slate-500">({packages.length})</span>
                </p>
              </div>
              {packages.length === 0 ? (
                <div className="text-center py-16 text-slate-500 dark:text-slate-400">
                  <DollarSign size={32} className="mx-auto mb-2 opacity-30" />
                  <p className="text-sm">No sponsorship packages found</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80">
                        <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400">Sponsor</th>
                        <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400">Type</th>
                        <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400">School</th>
                        <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400">Amount</th>
                        <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400">Pool</th>
                        <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400">Status</th>
                        <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      <AnimatePresence>
                        {packages.map((pkg: any) => (
                          <motion.tr
                            key={pkg.id}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="border-b border-slate-100 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition"
                          >
                            <td className="px-4 py-3">
                              <p className="font-semibold text-slate-900 dark:text-white">{pkg.sponsor?.name ?? "—"}</p>
                              <p className="text-xs text-slate-400">{pkg.sponsor?.email ?? ""}</p>
                            </td>
                            <td className="px-4 py-3 text-xs text-slate-600 dark:text-slate-300">
                              {SPONSOR_LABEL[pkg.sponsorType as SponsorType] ?? pkg.sponsorType}
                            </td>
                            <td className="px-4 py-3 text-xs text-slate-600 dark:text-slate-300">
                              {pkg.school?.name ?? <span className="text-slate-400">—</span>}
                            </td>
                            <td className="px-4 py-3 font-semibold text-slate-800 dark:text-white">
                              {fmt(Number(pkg.totalAmount))}
                            </td>
                            <td className="px-4 py-3">
                              <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200">
                                {POOL_LABEL[pkg.allocationPool as AllocPool] ?? pkg.allocationPool}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <span className={`text-xs px-2.5 py-0.5 rounded-full font-semibold ${PAY_BADGE[pkg.paymentStatus as PayStatus] ?? ""}`}>
                                {pkg.paymentStatus}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              {pkg.paymentStatus === "PENDING" && (
                                <button
                                  onClick={() => setConfirmPkg(pkg)}
                                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 text-xs font-semibold hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition"
                                >
                                  <CheckCircle2 size={13} />
                                  Confirm
                                </button>
                              )}
                              {pkg.paymentStatus !== "PENDING" && (
                                <span className="text-xs text-slate-400 flex items-center gap-1">
                                  <Clock size={12} /> {new Date(pkg.createdAt).toLocaleDateString()}
                                </span>
                              )}
                            </td>
                          </motion.tr>
                        ))}
                      </AnimatePresence>
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Confirm Payment Modal */}
      {confirmPkg && (
        <ConfirmPayModal
          pkg={confirmPkg}
          onClose={() => setConfirmPkg(null)}
          onConfirmed={handleConfirmed}
        />
      )}
    </div>
  );
}
