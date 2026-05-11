"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { api } from "@/client/trpc";
import { Monitor, Clock, CheckCircle2, Trophy, ArrowRight, AlertTriangle, RefreshCcw, Info } from "lucide-react";
import toast from "react-hot-toast";

const roundLabels: Record<string, string> = {
  ROUND1: "Round 1 — Intra-School CBT",
  ROUND2: "Round 2 — State CBT",
};

const statusMeta: Record<string, { label: string; color: string }> = {
  ROUND1_ELIGIBLE: { label: "CBT Access Granted", color: "text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 dark:text-emerald-300" },
  ROUND2_ELIGIBLE: { label: "Round 2 Access Granted", color: "text-blue-600 bg-blue-50 dark:bg-blue-900/20 dark:text-blue-300" },
  QUALIFIER: { label: "Qualified for Round 2", color: "text-violet-600 bg-violet-50 dark:bg-violet-900/20 dark:text-violet-300" },
  VERIFIED: { label: "Awaiting CBT Access", color: "text-amber-600 bg-amber-50 dark:bg-amber-900/20 dark:text-amber-300" },
  SLOT_RESERVED: { label: "Pending School Verification", color: "text-slate-600 bg-slate-50 dark:bg-slate-700 dark:text-slate-300" },
  REJECTED: { label: "Rejected", color: "text-red-600 bg-red-50 dark:bg-red-900/20 dark:text-red-300" },
};

function MockCBTSession({
  applicationId,
  round,
  onClose,
}: {
  applicationId: string;
  round: "ROUND1" | "ROUND2";
  onClose: () => void;
}) {
  const [started, setStarted] = useState(false);
  const [score, setScore] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const startMutation = api.techquiz.startCBTSession.useMutation({
    onSuccess: () => setStarted(true),
    onError: (e) => toast.error(e.message),
  });

  const submitMutation = api.techquiz.submitCBTSession.useMutation({
    onSuccess: () => {
      toast.success("CBT session submitted successfully!");
      onClose();
    },
    onError: (e) => toast.error(e.message),
  });

  if (!started) {
    return (
      <div className="text-center space-y-5">
        <div className="mx-auto w-14 h-14 rounded-2xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
          <Monitor className="w-7 h-7 text-emerald-600 dark:text-emerald-400" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">{roundLabels[round]}</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            You are about to start your CBT session. Once started, ensure you complete within the window.
          </p>
        </div>
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-xl p-4 text-sm text-amber-700 dark:text-amber-300 text-left flex gap-2.5">
          <AlertTriangle size={16} className="flex-shrink-0 mt-0.5" />
          <span>Ensure you have a stable internet connection and remain on this page until submission.</span>
        </div>
        <button
          onClick={() => startMutation.mutate({ applicationId, round })}
          disabled={startMutation.isPending}
          className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-sm transition disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {startMutation.isPending ? (
            <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Starting…</>
          ) : (
            <><ArrowRight size={15} /> Start CBT Session</>
          )}
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <div className="flex-1 h-2 rounded-full bg-slate-100 dark:bg-slate-700 overflow-hidden">
          <motion.div
            initial={{ width: "0%" }}
            animate={{ width: score !== null ? "100%" : "60%" }}
            transition={{ duration: 1.5 }}
            className="h-full rounded-full bg-emerald-500"
          />
        </div>
        <span className="text-xs text-slate-500">In Progress</span>
      </div>

      <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-5 space-y-4">
        <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
          Your CBT session is in progress. Enter your final score below to submit.
        </p>
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-xl p-4 flex gap-2.5 text-sm text-blue-700 dark:text-blue-300">
          <Info size={15} className="flex-shrink-0 mt-0.5" />
          <span>Questions are delivered via the TechQuiz Portal. Return here to submit your score after completing all questions.</span>
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide mb-1.5">
            Score (as reported by CBT portal)
          </label>
          <input
            type="number"
            min={0}
            max={100}
            value={score ?? ""}
            onChange={(e) => setScore(e.target.value ? parseFloat(e.target.value) : null)}
            placeholder="e.g. 72"
            className="w-full px-3 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-slate-800 dark:text-white focus:outline-none focus:border-emerald-500"
          />
        </div>
      </div>

      <button
        onClick={() => {
          if (score === null) return toast.error("Enter your score");
          submitMutation.mutate({ applicationId, round, score });
        }}
        disabled={submitMutation.isPending}
        className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-sm transition disabled:opacity-50 flex items-center justify-center gap-2"
      >
        {submitMutation.isPending ? (
          <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Submitting…</>
        ) : (
          <><CheckCircle2 size={15} /> Submit CBT Session</>
        )}
      </button>
    </div>
  );
}

export default function CBTPortalContent() {
  const [activeSession, setActiveSession] = useState<{
    applicationId: string;
    childName: string;
    round: "ROUND1" | "ROUND2";
    eventTitle: string;
  } | null>(null);

  const availabilityQuery = api.techquiz.getCbtPortalAvailability.useQuery();
  const childrenQuery = api.techquiz.myChildBeneficiaries.useQuery();
  const childrenData = childrenQuery.data ?? [];

  // Flatten all applications needing CBT access
  const cbtEligible: Array<{
    applicationId: string;
    childName: string;
    eventTitle: string;
    eventId: string;
    round: "ROUND1" | "ROUND2";
    status: string;
  }> = [];

  for (const child of childrenData) {
    for (const app of child.applications ?? []) {
      if (app.status === "ROUND1_ELIGIBLE") {
        cbtEligible.push({
          applicationId: app.id,
          childName: child.childName,
          eventTitle: app.event?.title ?? "—",
          eventId: app.eventId,
          round: "ROUND1",
          status: app.status,
        });
      }
      if (app.status === "ROUND2_ELIGIBLE") {
        cbtEligible.push({
          applicationId: app.id,
          childName: child.childName,
          eventTitle: app.event?.title ?? "—",
          eventId: app.eventId,
          round: "ROUND2",
          status: app.status,
        });
      }
    }
  }

  // Pending / non-cbt apps summary
  const pendingApps = childrenData.flatMap((c) =>
    (c.applications ?? [])
      .filter((a) => !["ROUND1_ELIGIBLE", "ROUND2_ELIGIBLE"].includes(a.status))
      .map((a) => ({ ...a, childName: c.childName }))
  );

  if (childrenQuery.isLoading || availabilityQuery.isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const cbtPortalEnabled = availabilityQuery.data?.enabled ?? false;
  const availabilityMessage =
    availabilityQuery.data?.message ||
    "The TechQuiz CBT portal is not currently live. You will be notified when verified CBT access opens.";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">CBT Portal</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-0.5 text-sm">Start or continue your child&apos;s Computer-Based Test sessions</p>
        </div>
        <button
          onClick={() => {
            void availabilityQuery.refetch();
            void childrenQuery.refetch();
          }}
          className="flex items-center gap-1.5 px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition"
        >
          <RefreshCcw size={13} /> Refresh
        </button>
      </div>

      {!cbtPortalEnabled && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-50 via-white to-orange-50 p-6 shadow-lg dark:border-amber-800/60 dark:from-amber-950/30 dark:via-slate-900 dark:to-orange-950/20"
        >
          <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-amber-200/40 blur-3xl dark:bg-amber-500/10" />
          <div className="relative flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div className="flex gap-4">
              <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">
                <AlertTriangle className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">CBT Portal Not Yet Live</h2>
                <p className="mt-1 text-sm leading-6 text-slate-600 dark:text-slate-300">
                  {availabilityMessage}
                </p>
                <div className="mt-4 rounded-xl border border-slate-200/80 bg-white/80 p-4 text-sm text-slate-600 shadow-sm dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-300">
                  <p className="font-semibold text-slate-800 dark:text-slate-100">What this means right now</p>
                  <ul className="mt-2 space-y-1.5 text-sm">
                    <li>Verified CBT sessions cannot be started from this portal yet.</li>
                    <li>Eligible children will remain visible in TechQuiz workflows, but assessment access is paused until activation.</li>
                    <li>You do not need to submit any manual CBT score here while the portal is disabled.</li>
                  </ul>
                </div>
              </div>
            </div>
            <div className="rounded-xl border border-slate-200/80 bg-white/80 px-4 py-3 text-sm text-slate-600 shadow-sm dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-300 lg:min-w-[240px]">
              <p className="font-semibold text-slate-800 dark:text-slate-100">Portal status</p>
              <p className="mt-1 text-amber-700 dark:text-amber-300">Unavailable</p>
              <p className="mt-2 text-xs leading-5 text-slate-500 dark:text-slate-400">
                Once the verified CBT delivery flow is approved, this page will reopen session access automatically.
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Active sessions */}
      {cbtPortalEnabled && cbtEligible.length > 0 ? (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide">Active CBT Access</h2>
          {cbtEligible.map((item, i) => (
            <motion.div
              key={`${item.applicationId}-${item.round}`}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="bg-white dark:bg-slate-800/50 rounded-2xl border border-emerald-200 dark:border-emerald-800 p-5 flex items-center gap-4"
            >
              <div className="w-11 h-11 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center flex-shrink-0">
                <Monitor className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-slate-900 dark:text-white">{item.childName}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {item.eventTitle} · {roundLabels[item.round]}
                </p>
              </div>
              <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${statusMeta[item.status]?.color ?? ""}`}>
                {statusMeta[item.status]?.label ?? item.status}
              </span>
              <button
                onClick={() => setActiveSession(item)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-semibold transition"
              >
                Start <ArrowRight size={13} />
              </button>
            </motion.div>
          ))}
        </div>
      ) : cbtPortalEnabled ? (
        <div className="bg-white dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700 p-10 text-center">
          <div className="mx-auto w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-700 flex items-center justify-center mb-4">
            <Clock className="w-7 h-7 text-slate-400" />
          </div>
          <h3 className="font-semibold text-slate-700 dark:text-slate-200 mb-1">No Active CBT Sessions</h3>
          <p className="text-sm text-slate-400 dark:text-slate-500">
            CBT access will appear here once your school confirms eligibility and the exam window opens.
          </p>
        </div>
      ) : null}

      {!cbtPortalEnabled && cbtEligible.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide">Paused CBT Access</h2>
          {cbtEligible.map((item, i) => (
            <motion.div
              key={`${item.applicationId}-${item.round}`}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="bg-white dark:bg-slate-800/50 rounded-2xl border border-amber-200 dark:border-amber-900/60 p-5 flex items-center gap-4"
            >
              <div className="w-11 h-11 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center flex-shrink-0">
                <Monitor className="w-5 h-5 text-amber-700 dark:text-amber-300" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-slate-900 dark:text-white">{item.childName}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {item.eventTitle} · {roundLabels[item.round]}
                </p>
              </div>
              <span className="px-2.5 py-1 rounded-full text-xs font-semibold text-amber-700 bg-amber-50 dark:bg-amber-900/20 dark:text-amber-300">
                Access Paused
              </span>
            </motion.div>
          ))}
        </div>
      )}

      {/* Other application statuses */}
      {pendingApps.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide">Application Status</h2>
          {pendingApps.map((app: any, i: number) => (
            <motion.div
              key={app.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              className="bg-white dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 px-5 py-4 flex items-center gap-4"
            >
              <div className="w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-sm font-bold text-slate-700 dark:text-slate-200 flex-shrink-0">
                {app.childName[0].toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-slate-800 dark:text-white text-sm">{app.childName}</p>
                <p className="text-xs text-slate-400 dark:text-slate-500 truncate">
                  {(app as any).event?.title ?? "—"}
                </p>
              </div>
              <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${statusMeta[app.status]?.color ?? "bg-slate-100 text-slate-600"}`}>
                {statusMeta[app.status]?.label ?? app.status.replace(/_/g, " ")}
              </span>
              {app.status === "QUALIFIER" && (
                <Trophy size={15} className="text-violet-500 flex-shrink-0" />
              )}
            </motion.div>
          ))}
        </div>
      )}

      {/* CBT Session modal */}
      <AnimatePresence>
        {activeSession && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
            onClick={(e) => e.target === e.currentTarget && setActiveSession(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-lg border border-slate-200 dark:border-slate-700 p-6"
            >
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white">{activeSession.childName}</h2>
                  <p className="text-sm text-slate-500 dark:text-slate-400">{activeSession.eventTitle}</p>
                </div>
                <button
                  onClick={() => setActiveSession(null)}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xl leading-none"
                >
                  ×
                </button>
              </div>
              <MockCBTSession
                applicationId={activeSession.applicationId}
                round={activeSession.round}
                onClose={() => setActiveSession(null)}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
