"use client";
import { Users, TrendingUp, ArrowUp, ArrowDown, Flag, Target, Sparkles, Grid3x3, Clock, ChevronRight } from "lucide-react";

interface CommunityStatsCardProps {
  communityStats: any;
  onShowDetails?: () => void;
}

export function CommunityStatsCard({ communityStats, onShowDetails }: CommunityStatsCardProps) {
  const cs: any = communityStats as any;
  const dailySignups = cs?.dailySignups || [];
  const lastSignup = dailySignups[dailySignups.length - 1]?.signups || 0;
  const prevSignup = dailySignups[dailySignups.length - 2]?.signups || 0;
  const growthDelta = lastSignup - prevSignup;
  const growthPct = prevSignup > 0 ? (growthDelta / prevSignup) * 100 : (lastSignup > 0 ? 100 : 0);
  const topRegion = cs?.topRegion?.name || cs?.platform?.topRegion || cs?.platform?.topCountry;
  const topReferrer = cs?.topReferrer?.name || cs?.platform?.topReferrer;
  const totalMembers = cs?.platform?.totalUsers || 0;

  const todayMetrics = [
    { label: "New signups", value: cs?.platform?.todaySignups ?? lastSignup ?? 0, delta: growthDelta, icon: Users },
    { label: "Active members", value: cs?.platform?.activeMembers || 0, delta: (cs?.platform?.activeMembers || 0) - (cs?.platform?.prevActiveMembers || 0), icon: TrendingUp },
    { label: "Palliative active", value: cs?.platform?.palliativeActiveUsers || 0, delta: cs?.platform?.palliativeChange || 0, icon: Users },
    { label: "New this month", value: cs?.platform?.newUsersThisMonth || 0, delta: (cs?.platform?.newUsersThisMonth || 0) - (cs?.platform?.prevMonthUsers || 0), icon: TrendingUp },
  ];

  const regionBreakdownRaw = Array.isArray(cs?.topRegions) ? cs.topRegions : Array.isArray(cs?.platform?.topRegions) ? cs.platform.topRegions : [];
  const fallbackRegions = !regionBreakdownRaw?.length && topRegion ? [{ name: topRegion, count: cs?.platform?.topRegionCount || cs?.platform?.topCountryCount || 0 }] : [];
  const regionBreakdown = (regionBreakdownRaw?.length ? regionBreakdownRaw : fallbackRegions).slice(0, 3).map((r: any) => {
    const count = r?.count || r?.value || r?.total || 0;
    return { name: r?.name || r?.region || r?.label || "Region", count, share: totalMembers > 0 ? (count / totalMembers) * 100 : 0 };
  });

  const referrerBreakdownRaw = Array.isArray(cs?.topReferrers) ? cs.topReferrers : Array.isArray(cs?.platform?.topReferrers) ? cs.platform.topReferrers : [];
  const fallbackReferrers = !referrerBreakdownRaw?.length && topReferrer ? [{ name: topReferrer, count: cs?.platform?.topReferrerCount || 0 }] : [];
  const referrerBreakdown = (referrerBreakdownRaw?.length ? referrerBreakdownRaw : fallbackReferrers).slice(0, 3).map((r: any) => {
    const count = r?.count || r?.value || r?.total || 0;
    return { name: r?.name || r?.referrer || r?.label || "Referrer", count, share: totalMembers > 0 ? (count / totalMembers) * 100 : 0 };
  });

  const funnelSteps = [
    { label: "Signups", value: totalMembers, color: "from-emerald-500 to-green-500" },
    { label: "Verified", value: cs?.platform?.verifiedUsers || cs?.platform?.kycVerified || cs?.platform?.activeMembers || 0, color: "from-blue-500 to-cyan-500" },
    { label: "Active", value: cs?.platform?.activeMembers || 0, color: "from-orange-500 to-amber-500" },
  ];

  const signupSeries = dailySignups.slice(-7);
  const activeRateSeries = (cs?.activeRateHistory || cs?.platform?.activeRateHistory || (dailySignups.length ? dailySignups.map(() => cs?.platform?.activeRate || 0) : [cs?.platform?.activeRate || 0])).slice(-7);

  return (
    <div className="rounded-2xl border border-slate-200/80 dark:border-emerald-800/40 bg-white dark:bg-slate-900/50 shadow-md dark:shadow-emerald-950/20 ring-1 ring-amber-300/10">
      <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2 flex-wrap">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white">Community Statistics</h2>
          <span className="px-2 py-1 text-[10px] font-semibold rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-200 border border-emerald-100/60 dark:border-emerald-800/60">
            Active Rate: {cs?.platform?.activeRate || 0}%
          </span>
          <span className={`px-2 py-1 text-[10px] font-semibold rounded-full border ${growthDelta >= 0 ? "bg-green-50 text-green-700 border-green-100 dark:bg-green-900/30 dark:text-green-200 dark:border-green-800/60" : "bg-red-50 text-red-700 border-red-100 dark:bg-red-900/30 dark:text-red-200 dark:border-red-800/60"}`}>
            {growthDelta >= 0 ? "+" : ""}{growthDelta} ({growthPct.toFixed(1)}%)
          </span>
        </div>
        {onShowDetails && (
          <button onClick={onShowDetails} className="text-xs font-medium text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1">
            Details <ChevronRight className="w-3 h-3" />
          </button>
        )}
      </div>
      <div className="p-5 space-y-5">
        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-900/20 dark:to-green-900/20 rounded-xl">
            <Users className="w-5 h-5 text-emerald-600 mb-2" />
            <p className="text-xs text-slate-500 dark:text-slate-400">Total Network</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">{totalMembers}</p>
          </div>
          <div className="p-3 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl">
            <TrendingUp className="w-5 h-5 text-green-600 mb-2" />
            <p className="text-xs text-slate-500 dark:text-slate-400">Level 1</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">{cs?.levels?.level1 || 0}</p>
          </div>
        </div>

        {/* Today metrics */}
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
          {todayMetrics.map((m) => {
            const Icon = m.icon;
            const positive = (m.delta || 0) >= 0;
            return (
              <div key={m.label} className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 shadow-sm">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{m.label}</p>
                    <p className="text-xl font-semibold text-slate-900 dark:text-white">{m.value}</p>
                  </div>
                  <div className="w-8 h-8 rounded-full border border-emerald-200 dark:border-emerald-800 bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-900/20 dark:to-green-900/20 flex items-center justify-center">
                    <Icon className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400" />
                  </div>
                </div>
                <div className="mt-1.5 flex items-center gap-1 text-[11px] font-semibold">
                  {positive ? <ArrowUp className="w-3 h-3 text-green-600" /> : <ArrowDown className="w-3 h-3 text-red-600" />}
                  <span className={positive ? "text-green-700 dark:text-green-400" : "text-red-700 dark:text-red-400"}>{positive ? "+" : ""}{m.delta || 0}</span>
                  <span className="text-slate-400">vs prior</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Regions & Referrers */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-slate-50 dark:bg-slate-800/30 rounded-xl p-3 border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Top Regions</p>
              <Flag className="w-4 h-4 text-blue-500" />
            </div>
            <div className="space-y-2">
              {(regionBreakdown.length ? regionBreakdown : [{ name: "No data", count: 0, share: 0 }]).map((r: any, i: number) => (
                <div key={i} className="p-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-slate-700 dark:text-slate-200">{r.name}</span>
                    <span className="text-slate-400">{Math.round(r.share)}%</span>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="flex-1 h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-blue-500 to-cyan-500" style={{ width: `${Math.min(100, Math.max(0, r.share))}%` }} />
                    </div>
                    <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-200">{r.count}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-slate-50 dark:bg-slate-800/30 rounded-xl p-3 border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Top Referrers</p>
              <Target className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="space-y-2">
              {(referrerBreakdown.length ? referrerBreakdown : [{ name: "No data", count: 0, share: 0 }]).map((r: any, i: number) => (
                <div key={i} className="p-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-slate-700 dark:text-slate-200">{r.name}</span>
                    <span className="text-slate-400">{Math.round(r.share)}%</span>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="flex-1 h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-purple-500 to-pink-500" style={{ width: `${Math.min(100, Math.max(0, r.share))}%` }} />
                    </div>
                    <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-200">{r.count}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Funnel + 7-day signals */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-slate-50 dark:bg-slate-800/30 rounded-xl p-3 border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Referral Funnel</p>
              <Target className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="space-y-3">
              {funnelSteps.map((step, idx) => {
                const base = funnelSteps[0]?.value || 1;
                const pct = base ? (step.value / base) * 100 : 0;
                return (
                  <div key={step.label} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-slate-700 dark:text-slate-200">{step.label}</span>
                      <span className="text-slate-400">{step.value}</span>
                    </div>
                    <div className="h-3 bg-white dark:bg-slate-900 rounded-full border border-slate-200 dark:border-slate-800 overflow-hidden">
                      <div className={`h-full bg-gradient-to-r ${step.color}`} style={{ width: `${Math.min(100, Math.max(8, pct))}%` }} />
                    </div>
                    {idx < funnelSteps.length - 1 && (
                      <div className="text-[11px] text-slate-400 flex items-center gap-1">
                        <ArrowDown className="w-3 h-3" />
                        <span>{step.value === 0 ? "No flow yet" : `${Math.max(0, Math.round(pct))}% carry-over`}</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
          <div className="bg-slate-50 dark:bg-slate-800/30 rounded-xl p-3 border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">7-Day Signups</p>
              <Sparkles className="w-4 h-4 text-amber-500" />
            </div>
            <div className="flex items-end gap-1 h-16 mb-3">
              {(signupSeries.length ? signupSeries : [{ signups: 0 }]).map((day: any, idx: number) => {
                const maxVal = Math.max(...(signupSeries.length ? signupSeries : [1]).map((s: any) => s.signups || 0), 1);
                const height = (day.signups / maxVal) * 100;
                return <div key={idx} className="flex-1 bg-gradient-to-t from-emerald-500 to-green-400 rounded-sm" style={{ height: `${Math.max(8, height)}%` }} title={`${day.date || ""}: ${day.signups || 0}`} />;
              })}
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-400">
              <span>Active rate</span>
              <span>{Math.min(...activeRateSeries) || 0}% - {Math.max(...activeRateSeries) || 0}%</span>
            </div>
          </div>
        </div>

        {/* Level distribution + Growth trend */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-slate-50 dark:bg-slate-800/30 rounded-xl p-3 border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Level Distribution</p>
              <Grid3x3 className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="space-y-2">
              {[
                { label: "L1", value: cs?.levels?.level1 || 0, color: "from-orange-500 to-yellow-500" },
                { label: "L2", value: cs?.levels?.level2 || 0, color: "from-emerald-500 to-lime-500" },
                { label: "L3", value: cs?.levels?.level3 || 0, color: "from-blue-500 to-cyan-500" },
                { label: "L4", value: cs?.levels?.level4 || 0, color: "from-purple-500 to-pink-500" },
              ].map((level) => {
                const total = (cs?.levels?.level1 || 0) + (cs?.levels?.level2 || 0) + (cs?.levels?.level3 || 0) + (cs?.levels?.level4 || 0);
                const pct = total > 0 ? (level.value / total) * 100 : 0;
                return (
                  <div key={level.label} className="flex items-center gap-2">
                    <span className="text-xs font-medium text-slate-500 w-6">{level.label}</span>
                    <div className="flex-1 h-3 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                      <div className={`h-full bg-gradient-to-r ${level.color}`} style={{ width: `${pct}%` }} />
                    </div>
                    <span className="text-xs font-medium text-slate-700 dark:text-slate-200 w-8 text-right">{level.value}</span>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="bg-slate-50 dark:bg-slate-800/30 rounded-xl p-3 border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Growth Trend</p>
              <Clock className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="flex items-end justify-between h-16 gap-1">
              {(cs?.dailySignups || []).map((day: any, i: number) => {
                const maxValue = Math.max(...(cs?.dailySignups || []).map((d: any) => d.signups), 1);
                const height = (day.signups / maxValue) * 100;
                return (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1">
                    <div className="w-full bg-gradient-to-t from-green-500 to-emerald-500 rounded-t" style={{ height: `${Math.max(height, 5)}%` }} title={`${day.date}: ${day.signups} signups`} />
                    <span className="text-[9px] text-slate-400">{day.date?.substring(0, 1) || ""}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
