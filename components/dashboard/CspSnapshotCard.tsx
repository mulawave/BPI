"use client";
import Link from "next/link";
import { Crown, Radio, Activity, Zap } from "lucide-react";

export function CspSnapshotCard({ cspEligibility: e, cspBroadcasts: b, cspLiveStatus: ls, formatAmount: fmt }: { cspEligibility: any; cspBroadcasts: any; cspLiveStatus: any; formatAmount: (n: number) => string }) {
  const ok = e?.categories?.national?.eligible || e?.categories?.global?.eligible;
  const checks = [
    { met: !!e?.membershipActive, label: "Membership" },
    { met: (e?.directReferrals ?? 0) >= (e?.categoryConfig?.national?.minDirects ?? 0), label: "Directs" },
    { met: (e?.cumulativeContributions ?? 0) >= (e?.minContributionRequired ?? 0), label: "Contributions" },
    { met: (e?.requestsContributed ?? 0) >= (e?.minDistinctRequests ?? 0), label: "Requests" },
    { met: !e?.tierModelEnabled || e?.kycApproved, label: "KYC" },
    { met: !e?.tierModelEnabled || !e?.cooldown?.isActive, label: "No Cooldown" },
  ];
  const met = checks.filter(c => c.met).length;
  const pct = Math.round((met / checks.length) * 100);
  const next = checks.find(c => !c.met);
  const badge = (on: boolean, txt: string, cls: string) => on
    ? <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-semibold ${cls}`}>{txt}</span>
    : <span className="px-1.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-[10px] font-semibold">{txt}</span>;
  return (
    <div className="rounded-2xl border border-amber-300/30 dark:border-amber-400/15 bg-gradient-to-br from-white to-emerald-50/20 dark:from-slate-900 dark:to-emerald-950/20 shadow-md dark:shadow-emerald-950/20 ring-1 ring-amber-300/10 overflow-hidden flex flex-col h-full">
      <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-1.5">
          <div className="w-5 h-5 rounded-md bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center ring-1 ring-amber-300/30"><Crown className="w-2.5 h-2.5 text-white" /></div>
          <h3 className="text-xs font-bold text-slate-900 dark:text-white">CSP Snapshot</h3>
        </div>
        <Link href="/csp" className="text-[10px] font-medium text-emerald-600 dark:text-emerald-400 hover:underline">Open →</Link>
      </div>
      <div className="p-4 flex-1 flex flex-col space-y-2">
        <Row label="Contributed" value={fmt(e?.cumulativeContributions ?? 0)} />
        <Row label="Tier" value={e?.currentTier?.name ?? "None"} cls="text-emerald-600 dark:text-emerald-400" />
        <Row label="Request Status" value={ls?.status ?? "No active request"} cap />
        <div className="flex items-center justify-between text-[11px]">
          <span className="text-slate-500 dark:text-slate-400">Eligible</span>
          {ok ? <span className="px-1.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 text-[10px] font-semibold">Yes</span> : <span className="px-1.5 py-0.5 rounded-full bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 text-[10px] font-semibold">No</span>}
        </div>
        <div className="flex items-center justify-between text-[11px]">
          <div className="flex items-center gap-1.5"><Radio className="w-3 h-3 text-amber-500" /><span className="text-slate-500 dark:text-slate-400">Broadcasts</span></div>
          <span className="font-semibold text-slate-900 dark:text-white">{b?.length ?? 0}</span>
        </div>
        <div className="flex items-center justify-between text-[11px]">
          <div className="flex items-center gap-1.5"><Activity className="w-3 h-3 text-emerald-500" /><span className="text-slate-500 dark:text-slate-400">Auto-Contribute</span></div>
          {badge(!!e?.autoContributeEnabled, e?.autoContributeEnabled ? "Active" : "Inactive", "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300")}
        </div>
        <div className="flex items-center justify-between text-[11px]">
          <div className="flex items-center gap-1.5"><Zap className="w-3 h-3 text-amber-500" /><span className="text-slate-500 dark:text-slate-400">Auto-Debit</span></div>
          {badge(!!e?.autoDebitEnabled, e?.autoDebitEnabled ? "Configured" : "Not Set", "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300")}
        </div>
        <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-800">
          <div className="flex items-center justify-between text-[10px] mb-1">
            <span className={ok ? "text-emerald-600 dark:text-emerald-400 font-semibold" : "text-slate-500 dark:text-slate-400"}>{ok ? "Eligibility Complete" : "Eligibility Progress"}</span>
            <span className={`font-bold ${ok ? "text-emerald-600 dark:text-emerald-400" : "text-slate-900 dark:text-white"}`}>{ok ? 100 : pct}%</span>
          </div>
          <div className="h-1.5 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
            <div className={`h-full rounded-full ${ok ? "bg-emerald-500" : "bg-gradient-to-r from-amber-400 to-emerald-500"}`} style={{ width: `${ok ? 100 : pct}%` }} />
          </div>
          {!ok && next && <p className="text-[9px] text-slate-400 dark:text-slate-500 mt-1">Next: {next.label}</p>}
        </div>
      </div>
    </div>
  );
}

function Row({ label, value, cls, cap }: { label: string; value: string; cls?: string; cap?: boolean }) {
  return (
    <div className="flex items-center justify-between text-[11px]">
      <span className="text-slate-500 dark:text-slate-400">{label}</span>
      <span className={`font-semibold ${cls ?? "text-slate-900 dark:text-white"} ${cap ? "capitalize" : ""}`}>{value}</span>
    </div>
  );
}
