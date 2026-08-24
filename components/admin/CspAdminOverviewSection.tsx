"use client";
import React from "react";
import { RefreshCw, Wallet, Users, RadioTower, CheckCircle2, TrendingUp, Award, ShieldCheck, ChevronLeft, ChevronRight } from "lucide-react";
import { format } from "date-fns";

function fmt(n: number) { return `\u20a6${n.toLocaleString()}`; }

export default function CspAdminOverviewSection({ data, isLoading, onRefresh, auditPage, onAuditPageChange }: { data: any; isLoading: boolean; onRefresh: () => void; auditPage: number; onAuditPageChange: (p: number) => void }) {
  if (isLoading && !data) return <div className="rounded-2xl border border-border bg-card p-8 text-center"><RefreshCw className="mx-auto h-6 w-6 animate-spin text-muted-foreground" /></div>;
  if (!data) return null;
  const { stats, topDonators, auditTrail, auditPagination } = data;
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-7 w-1 rounded-full bg-gradient-to-b from-emerald-500 to-amber-400" />
          <h2 className="text-xl font-bold text-foreground">CSP Overview</h2>
        </div>
        <button onClick={onRefresh} className="flex items-center gap-2 rounded-xl border border-border bg-muted px-3 py-1.5 text-sm font-medium hover:bg-accent"><RefreshCw className="h-3.5 w-3.5" /> Refresh</button>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <SC icon={Wallet} label="Total Donated" value={fmt(stats.totalDonated)} tone="text-emerald-600 dark:text-emerald-400" />
        <SC icon={RadioTower} label="Ongoing" value={String(stats.ongoingBroadcastsCount)} tone="text-blue-600 dark:text-blue-400" />
        <SC icon={TrendingUp} label="Ongoing Raised" value={fmt(stats.ongoingTotalRaised)} tone="text-amber-600 dark:text-amber-400" />
        <SC icon={CheckCircle2} label="Released" value={String(stats.releasedRequests)} tone="text-emerald-600 dark:text-emerald-400" />
        <SC icon={Users} label="Total Requests" value={String(stats.totalRequests)} tone="text-slate-600 dark:text-slate-400" />
        <SC icon={ShieldCheck} label="Ongoing Target" value={fmt(stats.ongoingTotalTarget)} tone="text-indigo-600 dark:text-indigo-400" />
      </div>
      <div className="rounded-2xl border border-border bg-card p-5">
        <div className="flex items-center gap-2 mb-4"><Award className="h-5 w-5 text-amber-500" /><h3 className="text-lg font-bold text-foreground">Top Donors</h3></div>
        {topDonators.length === 0 ? <p className="text-sm text-muted-foreground py-4 text-center">No donations recorded yet.</p> : (
          <div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="border-b border-border text-left text-xs uppercase text-muted-foreground"><th className="pb-2 pr-3">#</th><th className="pb-2 pr-3">Donor</th><th className="pb-2 pr-3">Cash Wallet</th><th className="pb-2 pr-3">Community Wallet</th><th className="pb-2 pr-3">Membership</th><th className="pb-2 pr-3">Auto-Debit</th><th className="pb-2 pr-3">Auto-Contribute</th><th className="pb-2 pr-3 text-right">Total Donated</th><th className="pb-2 pr-3 text-right">Count</th></tr></thead><tbody>
          {topDonators.map((d: any, i: number) => (
            <tr key={d.userId} className="border-b border-border/50 hover:bg-muted/30">
              <td className="py-3 pr-3 font-bold text-muted-foreground">{i + 1}</td>
              <td className="py-3 pr-3"><div className="flex items-center gap-2">{d.avatar ? <img src={d.avatar} alt="" className="h-8 w-8 rounded-full object-cover" /> : <div className="h-8 w-8 rounded-full bg-emerald-500/20 flex items-center justify-center text-xs font-bold text-emerald-700 dark:text-emerald-300">{d.name.charAt(0).toUpperCase()}</div>}<div><p className="font-semibold text-foreground">{d.name}</p><p className="text-xs text-muted-foreground">{d.email}</p></div></div></td>
              <td className="py-3 pr-3 text-muted-foreground">{fmt(d.cashWalletBalance)}</td>
              <td className="py-3 pr-3 text-muted-foreground">{fmt(d.communityWalletBalance)}</td>
              <td className="py-3 pr-3"><span className="rounded-full px-2 py-0.5 text-xs font-medium bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">{d.membershipPlan}</span></td>
              <td className="py-3 pr-3"><span className={`text-xs font-semibold ${d.isAutoDebit ? "text-emerald-600" : "text-muted-foreground"}`}>{d.isAutoDebit ? "ON" : "OFF"}</span></td>
              <td className="py-3 pr-3"><span className={`text-xs font-semibold ${d.isAutoContribute ? "text-emerald-600" : "text-muted-foreground"}`}>{d.isAutoContribute ? "ON" : "OFF"}</span></td>
              <td className="py-3 pr-3 text-right font-bold text-emerald-600 dark:text-emerald-400">{fmt(d.totalDonated)}</td>
              <td className="py-3 pr-3 text-right text-muted-foreground">{d.contributionCount}</td>
            </tr>
          ))}
          </tbody></table></div>
        )}
      </div>
      <div className="rounded-2xl border border-border bg-card p-5">
        <div className="flex items-center gap-2 mb-4"><ShieldCheck className="h-5 w-5 text-emerald-600" /><h3 className="text-lg font-bold text-foreground">CSP Release Audit Trail</h3><span className="ml-auto text-xs text-muted-foreground">{auditPagination.total} total releases</span></div>
        {auditTrail.length === 0 ? <p className="text-sm text-muted-foreground py-4 text-center">No release audit logs yet.</p> : (
          <div className="space-y-3">
            {auditTrail.map((a: any) => (
              <div key={a.auditLogId} className="rounded-xl border border-border/60 p-4 hover:bg-muted/20">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${a.status === "success" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300" : "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300"}`}>{a.status}</span>
                      {a.fullyFunded != null && <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${a.fullyFunded ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300" : "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300"}`}>{a.fullyFunded ? "Fully Funded" : "Partial"}</span>}
                      <span className="text-xs text-muted-foreground">{format(new Date(a.createdAt), "MMM d, yyyy HH:mm")}</span>
                    </div>
                    {a.request && <div className="text-sm"><span className="font-semibold text-foreground">{a.request.beneficiaryName}</span><span className="text-muted-foreground"> ({a.request.beneficiaryEmail})</span><span className="text-muted-foreground"> &mdash; {a.request.category}</span></div>}
                    <p className="text-xs text-muted-foreground">Admin: {a.adminName} ({a.adminEmail})</p>
                    {a.errorMessage && <p className="text-xs text-rose-500">{a.errorMessage}</p>}
                  </div>
                  {a.totalReleased != null && <div className="text-right"><p className="text-xs text-muted-foreground">Total Released</p><p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">{fmt(a.totalReleased)}</p></div>}
                </div>
                {a.distribution && <div className="mt-3 grid grid-cols-2 md:grid-cols-6 gap-2 text-xs"><DI label="Recipient" value={a.distribution.recipient} tone="text-emerald-600 dark:text-emerald-400" /><DI label="BPI Profit" value={a.distribution.admin} tone="text-amber-600 dark:text-amber-400" /><DI label="Sponsor" value={a.distribution.sponsor} tone="text-blue-600 dark:text-blue-400" /><DI label="State" value={a.distribution.state} tone="text-indigo-600 dark:text-indigo-400" /><DI label="Management" value={a.distribution.management} tone="text-purple-600 dark:text-purple-400" /><DI label="Reserve" value={a.distribution.reserve} tone="text-slate-600 dark:text-slate-400" /></div>}
                {a.request && <div className="mt-2 flex flex-wrap gap-3 text-xs text-muted-foreground"><span>Requested: {fmt(a.request.requestedAmount ?? 0)}</span><span>Threshold: {fmt(a.request.thresholdAmount)}</span><span>Raised: {fmt(a.request.raisedAmount)}</span></div>}
              </div>
            ))}
          </div>
        )}
        {auditPagination.totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 pt-3">
            <button onClick={() => onAuditPageChange(Math.max(1, auditPage - 1))} disabled={auditPage <= 1} className="rounded-lg border border-border p-1.5 disabled:opacity-40"><ChevronLeft className="h-4 w-4" /></button>
            <span className="text-sm text-muted-foreground">Page {auditPage} of {auditPagination.totalPages}</span>
            <button onClick={() => onAuditPageChange(Math.min(auditPagination.totalPages, auditPage + 1))} disabled={auditPage >= auditPagination.totalPages} className="rounded-lg border border-border p-1.5 disabled:opacity-40"><ChevronRight className="h-4 w-4" /></button>
          </div>
        )}
      </div>
    </div>
  );
}

function SC({ icon: Icon, label, value, tone }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string; tone: string }) {
  return <div className="rounded-xl border border-border bg-card p-3"><div className="flex items-center gap-2"><div className="rounded-lg bg-muted p-1.5"><Icon className={`h-4 w-4 ${tone}`} /></div><span className="text-lg font-bold text-foreground">{value}</span></div><p className="mt-1.5 text-xs font-medium text-muted-foreground">{label}</p></div>;
}

function DI({ label, value, tone }: { label: string; value: number; tone: string }) {
  return <div className="rounded-lg border border-border/40 bg-muted/20 px-2 py-1.5"><p className="text-muted-foreground">{label}</p><p className={`font-semibold ${tone}`}>{fmt(value)}</p></div>;
}
