"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { api } from "@/client/trpc";
import { useCurrency } from "@/contexts/CurrencyContext";
import { MdTrendingUp, MdTrendingDown, MdAttachMoney, MdPercent, MdAccountBalanceWallet } from "react-icons/md";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, Cell, AreaChart, Area } from "recharts";
import toast from "react-hot-toast";

export default function FinancialOverview() {
  const { formatAmount } = useCurrency();

  // Date range controls
  const now = React.useMemo(() => new Date(), []);
  const initialTo = React.useMemo(() => new Date().toISOString().slice(0, 10), []);
  const initialFrom = React.useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - 365);
    return d.toISOString().slice(0, 10);
  }, []);
  const [dateFrom, setDateFrom] = React.useState<string>(initialFrom);
  const [dateTo, setDateTo] = React.useState<string>(initialTo);
  const presets = [
    { label: "7d", days: 7 },
    { label: "30d", days: 30 },
    { label: "90d", days: 90 },
    { label: "1y", days: 365 },
  ];

  const { data: summary, isLoading, refetch } = api.admin.getFinancialSummary.useQuery(
    { dateFrom: new Date(dateFrom), dateTo: new Date(dateTo) },
    { refetchOnWindowFocus: false }
  );

  // Persist date range across sessions
  React.useEffect(() => {
    try {
      const savedFrom = localStorage.getItem("financials:dateFrom");
      const savedTo = localStorage.getItem("financials:dateTo");
      if (savedFrom && savedTo) {
        setDateFrom(savedFrom);
        setDateTo(savedTo);
      }
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  React.useEffect(() => {
    try {
      localStorage.setItem("financials:dateFrom", dateFrom);
      localStorage.setItem("financials:dateTo", dateTo);
    } catch {}
  }, [dateFrom, dateTo]);

  // Time series data
  const [granularity, setGranularity] = React.useState<"day" | "week" | "month">("day");
  // Persist granularity across sessions
  React.useEffect(() => {
    try {
      const savedGran = localStorage.getItem("financials:granularity");
      if (savedGran === "day" || savedGran === "week" || savedGran === "month") {
        setGranularity(savedGran);
      }
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  React.useEffect(() => {
    try {
      localStorage.setItem("financials:granularity", granularity);
    } catch {}
  }, [granularity]);

  const { data: series, error: seriesError, refetch: refetchSeries } = api.admin.getFinancialTimeSeries.useQuery(
    { dateFrom: new Date(dateFrom), dateTo: new Date(dateTo), granularity },
    { refetchOnWindowFocus: false }
  );
    // BPT activities list
    const [bptPage, setBptPage] = React.useState(1);
    const bptPageSize = 12;
    const { data: bptList, isLoading: isBptLoading, refetch: refetchBpt } = api.admin.getBptTransactions.useQuery(
      { dateFrom: new Date(dateFrom), dateTo: new Date(dateTo), page: bptPage, pageSize: bptPageSize },
      { refetchOnWindowFocus: false }
    );

    const formatDate = (d?: string | Date) => {
      if (!d) return "-";
      const date = typeof d === "string" ? new Date(d) : d;
      return date.toLocaleDateString();
    };

    const formatBpt = (value?: number) => {
      const amount = Math.abs(value || 0);
      return `${new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 }).format(amount)} BPT`;
    };

    const ngnWalletEntries = React.useMemo(() => summary ? Object.entries(summary.wallets.ngn) : [], [summary]);
    const grossNgnAssets = React.useMemo(
      () => ngnWalletEntries.reduce((acc, [, v]) => acc + (typeof v === "number" ? v : 0), 0),
      [ngnWalletEntries],
    );
    const bptRateNgn = summary?.bptRateNgn ?? 5;
    const bptNairaValue = React.useMemo(() => (summary ? (summary.wallets.bpt || 0) * bptRateNgn : 0), [summary, bptRateNgn]);
    const grossHolisticTotal = React.useMemo(
      () => (summary ? grossNgnAssets + bptNairaValue + (summary.inflows.total || 0) + (summary.outflows.total || 0) : 0),
      [summary, grossNgnAssets, bptNairaValue],
    );
    const grossParts = React.useMemo(() => ([
      { label: "NGN Wallets", value: grossNgnAssets },
      { label: "BPT (₦)", value: bptNairaValue },
      { label: "Inflows", value: summary?.inflows.total || 0 },
      { label: "Outflows", value: summary?.outflows.total || 0 },
    ]), [grossNgnAssets, bptNairaValue, summary]);
    const assetBreakdown = React.useMemo(
      () => {
        const denom = grossNgnAssets || 1;
        return ngnWalletEntries
          .map(([key, value]) => ({ key, value: value as number, share: Math.max(0, (Math.abs(value as number) / denom) * 100) }))
          .sort((a, b) => (b.value || 0) - (a.value || 0));
      },
      [grossNgnAssets, ngnWalletEntries],
    );

  React.useEffect(() => {
    if (seriesError) {
      toast.error((seriesError as any)?.message || "Failed to load time series");
    }
  }, [seriesError]);

  // Export financial summary CSV
  const exportSummaryQuery = api.admin.exportFinancialSummaryToCSV.useQuery(
    { dateFrom, dateTo },
    { enabled: false }
  );
  const onExportCSV = async () => {
    const res = await exportSummaryQuery.refetch();
    if (res.data?.data) {
      const blob = new Blob([res.data.data], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = res.data.filename || "financial-summary.csv";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast.success(`Exported ${res.data.count} rows`);
    } else {
      toast.error("Export failed");
    }
  };

  const inflowItems = [
    { label: "Deposits", value: summary?.inflows.deposits || 0 },
    { label: "Membership Revenue", value: summary?.inflows.membershipRevenue || 0 },
    { label: "VAT", value: summary?.inflows.vat || 0 },
    { label: "Withdrawal Fees", value: summary?.inflows.withdrawalFees || 0 },
  ];
  const outflowItems = [
    { label: "Cash Withdrawals", value: summary?.outflows.withdrawalsCash || 0 },
    { label: "BPT Withdrawals", value: summary?.outflows.withdrawalsBpt || 0 },
    { label: "BPT Rewards", value: summary?.outflows.rewardsBpt || 0 },
  ];

  const chartData = [
    { name: "Inflows", total: summary?.inflows.total || 0 },
    { name: "Outflows", total: summary?.outflows.total || 0 },
  ];
  const chartDataDetailed = [
    {
      name: "Inflows",
      deposits: summary?.inflows.deposits || 0,
      membershipRevenue: summary?.inflows.membershipRevenue || 0,
      vat: summary?.inflows.vat || 0,
      withdrawalFees: summary?.inflows.withdrawalFees || 0,
      withdrawalsCash: 0,
      withdrawalsBpt: 0,
      rewardsBpt: 0,
    },
    {
      name: "Outflows",
      deposits: 0,
      membershipRevenue: 0,
      vat: 0,
      withdrawalFees: 0,
      withdrawalsCash: summary?.outflows.withdrawalsCash || 0,
      withdrawalsBpt: summary?.outflows.withdrawalsBpt || 0,
      rewardsBpt: summary?.outflows.rewardsBpt || 0,
    },
  ];

  const legendLabelMap: Record<string, string> = {
    deposits: "Deposits",
    membershipRevenue: "Membership",
    vat: "VAT",
    withdrawalFees: "Withdrawal Fees",
    withdrawalsCash: "Cash Withdrawals",
    withdrawalsBpt: "BPT Withdrawals",
    rewardsBpt: "BPT Rewards",
  };

  const onExportJSON = async () => {
    try {
      if (!summary) {
        toast.error("No data to export");
        return;
      }
      const json = JSON.stringify(summary, null, 2);
      const blob = new Blob([json], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `financial-summary-${dateFrom}_to_${dateTo}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast.success("Exported JSON");
    } catch (e) {
      toast.error("JSON export failed");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="relative overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-card via-[hsl(var(--muted))] to-card p-6 shadow-xl backdrop-blur-sm"
      >
        <div className="absolute -top-16 -right-16 h-32 w-32 rounded-full bg-gradient-to-br from-[hsl(var(--secondary))] to-[hsl(var(--primary))] opacity-10 blur-2xl" />
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[hsl(var(--primary))] to-[hsl(var(--secondary))] shadow">
              <MdAttachMoney className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold">Financial Overview</h2>
              <p className="text-xs text-muted-foreground">Range: {summary ? new Date(summary.range.from).toLocaleDateString() : "..."} → {summary ? new Date(summary.range.to).toLocaleDateString() : "..."}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="date"
              className="rounded-lg border px-2 py-1.5 text-sm bg-background"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
            />
            <span className="text-xs text-muted-foreground">to</span>
            <input
              type="date"
              className="rounded-lg border px-2 py-1.5 text-sm bg-background"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
            />
            {/* Granularity selector */}
            <div className="ml-1 hidden sm:flex items-center overflow-hidden rounded-lg border text-xs">
              <button
                className={`px-2 py-1 ${granularity === "day" ? "bg-muted font-semibold" : "hover:bg-accent"}`}
                onClick={() => setGranularity("day")}
                aria-pressed={granularity === "day"}
              >
                Day
              </button>
              <button
                className={`px-2 py-1 border-l ${granularity === "week" ? "bg-muted font-semibold" : "hover:bg-accent"}`}
                onClick={() => setGranularity("week")}
                aria-pressed={granularity === "week"}
              >
                Week
              </button>
              <button
                className={`px-2 py-1 border-l ${granularity === "month" ? "bg-muted font-semibold" : "hover:bg-accent"}`}
                onClick={() => setGranularity("month")}
                aria-pressed={granularity === "month"}
              >
                Month
              </button>
            </div>
            <button onClick={() => { refetch(); refetchSeries(); }} className="rounded-lg border px-3 py-1.5 text-sm hover:bg-muted">Apply</button>
            <button onClick={onExportCSV} className="rounded-lg border px-3 py-1.5 text-sm hover:bg-muted">Export CSV</button>
            <button onClick={onExportJSON} className="rounded-lg border px-3 py-1.5 text-sm hover:bg-muted">Export JSON</button>
            <button
              onClick={async () => {
                try {
                  if (!summary) return toast.error("No data to copy");
                  await navigator.clipboard.writeText(JSON.stringify(summary, null, 2));
                  toast.success("Summary copied");
                } catch (e) {
                  toast.error("Copy failed");
                }
              }}
              className="rounded-lg border px-3 py-1.5 text-sm hover:bg-muted"
            >
              Copy Summary
            </button>
            <div className="ml-2 hidden sm:flex items-center gap-1">
              {presets.map((p) => (
                <button
                  key={p.label}
                  className="rounded-lg border px-2 py-1 text-xs hover:bg-muted"
                  onClick={() => {
                    const d = new Date(dateTo);
                    const from = new Date(d);
                    from.setDate(from.getDate() - p.days);
                    setDateFrom(from.toISOString().slice(0, 10));
                    refetch();
                    refetchSeries();
                  }}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Asset Snapshot */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="relative overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-card via-[hsl(var(--muted))] to-card p-5 backdrop-blur-xl shadow"
      >
        <div className="absolute -bottom-16 -left-16 h-32 w-32 rounded-full bg-gradient-to-br from-[hsl(var(--secondary))] to-[hsl(var(--primary))] opacity-10 blur-2xl" />
        <div className="grid gap-4 lg:grid-cols-3">
          <div className="lg:col-span-2 rounded-xl border border-border/40 bg-background/60 p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-sm font-semibold">Asset Snapshot</div>
                <p className="text-xs text-muted-foreground">Gross total of all NGN-denominated wallets with relative share.</p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold">{formatAmount(grossNgnAssets)}</div>
                <div className="text-xs text-muted-foreground">Across {ngnWalletEntries.length} wallets</div>
              </div>
            </div>
            <div className="mt-4 space-y-2">
              {assetBreakdown.map((item) => (
                <div key={item.key} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="capitalize text-muted-foreground">{item.key}</span>
                    <span className="font-semibold">{formatAmount(item.value)}</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-border">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-[hsl(var(--primary))] to-[hsl(var(--secondary))]"
                      style={{ width: `${Math.min(100, Math.round(item.share))}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="space-y-3">
            <div className="rounded-xl border border-border/50 bg-background/70 p-4 shadow-sm">
              <div className="text-sm font-semibold">BPT Holdings</div>
              <div className="mt-2 text-lg font-bold">{formatBpt(summary?.wallets.bpt || 0)}</div>
              <p className="text-xs text-muted-foreground">Token balance tracked via bpiToken wallet activity.</p>
            </div>
            <div className="rounded-xl border border-border/50 bg-background/70 p-4 shadow-sm">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="text-sm font-semibold">Range Context</div>
                  <p className="text-[11px] text-muted-foreground">
                    Completed transactions between {summary ? new Date(summary.range.from).toLocaleDateString() : "..."} and {summary ? new Date(summary.range.to).toLocaleDateString() : "..."}.
                  </p>
                  <p className="text-[11px] text-muted-foreground">BPT rate: ₦{bptRateNgn.toLocaleString(undefined, { maximumFractionDigits: 2 })}</p>
                </div>
              </div>
              <div className="mt-3 rounded-lg border border-border/70 bg-card/70 p-3 shadow-inner">
                <div className="text-xs font-semibold text-muted-foreground">Gross Total</div>
                <div className="text-3xl font-extrabold leading-tight text-foreground">{formatAmount(grossHolisticTotal)}</div>
                <div className="mt-2 text-[11px] text-muted-foreground">Summed from inflows, outflows, NGN wallets, and BPT (converted to ₦).</div>
                <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                  {grossParts.map((item) => (
                    <div key={item.label} className="rounded border border-border/70 bg-background/60 p-2">
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">{item.label}</span>
                        <span className="font-semibold">{formatAmount(item.value)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Category Breakdown Chart */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="relative overflow-hidden rounded-2xl border border-border bg-card/75 p-4 backdrop-blur-xl"
      >
        <div className="absolute -top-16 -right-16 h-32 w-32 rounded-full bg-gradient-to-br from-[hsl(var(--secondary))] to-[hsl(var(--primary))] opacity-10 blur-2xl" />
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 h-52">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartDataDetailed}>
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} tickFormatter={(v: number) => formatAmount(v || 0)} />
                <Tooltip formatter={(v?: number) => formatAmount(typeof v === "number" ? v : 0)} />
                <Legend formatter={(value) => legendLabelMap[value] || value} />
                {/* Inflows stack */}
                <Bar dataKey="deposits" stackId="a" fill="hsl(var(--primary))" radius={[6,6,0,0]} />
                <Bar dataKey="membershipRevenue" stackId="a" fill="hsl(var(--secondary))" />
                <Bar dataKey="vat" stackId="a" fill="hsl(var(--muted))" />
                <Bar dataKey="withdrawalFees" stackId="a" fill="#0d3b29" />
                {/* Outflows stack */}
                <Bar dataKey="withdrawalsCash" stackId="b" fill="#ff7f50" radius={[6,6,0,0]} />
                <Bar dataKey="withdrawalsBpt" stackId="b" fill="#ffa500" />
                <Bar dataKey="rewardsBpt" stackId="b" fill="#f0ad4e" />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl border p-4">
              <div className="text-xs font-semibold text-muted-foreground">Inflow Breakdown</div>
              <div className="mt-2 space-y-1 text-sm">
                <div className="flex justify-between"><span>Deposits</span><span>{formatAmount(summary?.inflows.deposits || 0)}</span></div>
                <div className="flex justify-between"><span>Membership</span><span>{formatAmount(summary?.inflows.membershipRevenue || 0)}</span></div>
                <div className="flex justify-between"><span>VAT</span><span>{formatAmount(summary?.inflows.vat || 0)}</span></div>
                <div className="flex justify-between"><span>Withdrawal Fees</span><span>{formatAmount(summary?.inflows.withdrawalFees || 0)}</span></div>
              </div>
            </div>
            <div className="rounded-xl border p-4">
              <div className="text-xs font-semibold text-muted-foreground">Outflow Breakdown</div>
              <div className="mt-2 space-y-1 text-sm">
                <div className="flex justify-between"><span>Cash Withdrawals</span><span>{formatAmount(summary?.outflows.withdrawalsCash || 0)}</span></div>
                <div className="flex justify-between"><span>BPT Withdrawals</span><span>{formatAmount(summary?.outflows.withdrawalsBpt || 0)}</span></div>
                <div className="flex justify-between"><span>BPT Rewards</span><span>{formatAmount(summary?.outflows.rewardsBpt || 0)}</span></div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Category Time Series */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="relative overflow-hidden rounded-2xl border border-border bg-card/75 p-4 backdrop-blur-xl"
      >
        <div className="absolute -top-16 -right-16 h-32 w-32 rounded-full bg-gradient-to-br from-[hsl(var(--secondary))] to-[hsl(var(--primary))] opacity-10 blur-2xl" />
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 h-56">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={series?.points || []} margin={{ left: 0, right: 0, top: 10, bottom: 0 }}>
                <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} tickFormatter={(v: number) => formatAmount(v || 0)} />
                <Tooltip formatter={(v?: number) => formatAmount(typeof v === "number" ? v : 0)} />
                <Legend formatter={(value) => legendLabelMap[value] || value} />
                <Area type="monotone" dataKey="deposits" stackId="1" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.25} />
                <Area type="monotone" dataKey="membershipRevenue" stackId="1" stroke="hsl(var(--secondary))" fill="hsl(var(--secondary))" fillOpacity={0.25} />
                <Area type="monotone" dataKey="vat" stackId="1" stroke="hsl(var(--muted))" fill="hsl(var(--muted))" fillOpacity={0.25} />
                <Area type="monotone" dataKey="withdrawalFees" stackId="1" stroke="#0d3b29" fill="#0d3b29" fillOpacity={0.25} />
                <Area type="monotone" dataKey="withdrawalsCash" stackId="2" stroke="#ff7f50" fill="#ff7f50" fillOpacity={0.2} />
                <Area type="monotone" dataKey="withdrawalsBpt" stackId="2" stroke="#ffa500" fill="#ffa500" fillOpacity={0.2} />
                <Area type="monotone" dataKey="rewardsBpt" stackId="2" stroke="#f0ad4e" fill="#f0ad4e" fillOpacity={0.2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl border p-4">
              <div className="text-xs font-semibold text-muted-foreground">Series Info</div>
              <p className="mt-1 text-[11px] text-muted-foreground">Completed transactions only; withdrawal fees also match service-charge descriptions.</p>
              <div className="mt-2 space-y-1 text-xs">
                <div className="flex justify-between"><span>Granularity</span><span>{series?.granularity || "day"}</span></div>
                <div className="flex justify-between"><span>Points</span><span>{series ? series.points.length : 0}</span></div>
              </div>
            </div>
            <div className="rounded-xl border p-4">
              <div className="text-xs font-semibold text-muted-foreground">Actions</div>
              <p className="mt-1 text-[11px] text-muted-foreground">Reload after tweaking dates; adjust granularity to smooth or reveal short-term spikes.</p>
              <div className="mt-2 flex gap-2">
                <button onClick={() => refetchSeries()} className="rounded-lg border px-3 py-1.5 text-xs hover:bg-muted">Reload Series</button>
                {/* Mobile granularity selector */}
                <div className="flex sm:hidden items-center overflow-hidden rounded-lg border text-[10px]">
                  <button
                    className={`px-2 py-1 ${granularity === "day" ? "bg-muted font-semibold" : "hover:bg-accent"}`}
                    onClick={() => setGranularity("day")}
                    aria-pressed={granularity === "day"}
                  >
                    Day
                  </button>
                  <button
                    className={`px-2 py-1 border-l ${granularity === "week" ? "bg-muted font-semibold" : "hover:bg-accent"}`}
                    onClick={() => setGranularity("week")}
                    aria-pressed={granularity === "week"}
                  >
                    Week
                  </button>
                  <button
                    className={`px-2 py-1 border-l ${granularity === "month" ? "bg-muted font-semibold" : "hover:bg-accent"}`}
                    onClick={() => setGranularity("month")}
                    aria-pressed={granularity === "month"}
                  >
                    Month
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Totals Chart */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="relative overflow-hidden rounded-2xl border border-border bg-card/75 p-4 backdrop-blur-xl"
      >
        <div className="absolute -top-16 -left-16 h-32 w-32 rounded-full bg-gradient-to-br from-[hsl(var(--secondary))] to-[hsl(var(--primary))] opacity-10 blur-2xl" />
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} tickFormatter={(v: number) => formatAmount(v || 0)} />
                <Tooltip formatter={(v?: number) => formatAmount(typeof v === "number" ? v : 0)} />
                <Bar dataKey="total" radius={[6,6,0,0]}>
                  <Cell fill="hsl(var(--primary))" />
                  <Cell fill="#ff7f50" />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl border p-4">
              <div className="flex items-center gap-2 text-green-600"><MdTrendingUp /> <span className="text-sm font-semibold">Inflows</span></div>
              <div className="mt-2 text-2xl font-bold">{formatAmount(summary?.inflows.total || 0)}</div>
            </div>
            <div className="rounded-xl border p-4">
              <div className="flex items-center gap-2 text-orange-600"><MdTrendingDown /> <span className="text-sm font-semibold">Outflows</span></div>
              <div className="mt-2 text-2xl font-bold">{formatAmount(summary?.outflows.total || 0)}</div>
            </div>
            {/* Compact legend */}
            <div className="col-span-2 flex items-center gap-3 text-xs text-muted-foreground">
              <div className="flex items-center gap-1"><span className="inline-block h-2 w-2 rounded-sm" style={{ backgroundColor: "hsl(var(--primary))" }} /> Inflows</div>
              <div className="flex items-center gap-1"><span className="inline-block h-2 w-2 rounded-sm" style={{ backgroundColor: "#ff7f50" }} /> Outflows</div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Breakdown */}
      <div className="grid gap-6 lg:grid-cols-2">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="rounded-2xl border border-border bg-card/75 p-6 backdrop-blur-xl">
          <div className="flex items-center gap-2"><MdAccountBalanceWallet className="text-green-600" /><h3 className="text-lg font-semibold">Inflows</h3></div>
          <div className="mt-4 space-y-3">
            {inflowItems.map((i) => (
              <div key={i.label} className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">{i.label}</span>
                <span className="text-sm font-semibold">{formatAmount(i.value)}</span>
              </div>
            ))}
          </div>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="rounded-2xl border border-border bg-card/75 p-6 backdrop-blur-xl">
          <div className="flex items-center gap-2"><MdPercent className="text-orange-600" /><h3 className="text-lg font-semibold">Outflows</h3></div>
          <div className="mt-4 space-y-3">
            {outflowItems.map((i) => (
              <div key={i.label} className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">{i.label}</span>
                <span className="text-sm font-semibold">{formatAmount(i.value)}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Wallet totals & BPT */}
      <div className="grid gap-6 lg:grid-cols-2">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="rounded-2xl border border-border bg-card/75 p-6 backdrop-blur-xl">
          <h3 className="text-lg font-semibold">Wallet Totals</h3>
          <div className="mt-4 grid grid-cols-2 gap-3">
            {summary && Object.entries(summary.wallets.ngn).map(([k, v]) => (
              <div key={k} className="rounded-lg border p-3">
                <div className="text-xs text-muted-foreground">{k}</div>
                <div className="text-sm font-semibold mt-1">{formatAmount(v as number)}</div>
              </div>
            ))}
            <div className="rounded-lg border p-3">
              <div className="text-xs text-muted-foreground">BPT (tokens)</div>
              <div className="text-sm font-semibold mt-1">{summary ? (summary.wallets.bpt || 0).toLocaleString() : "0"}</div>
            </div>
          </div>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="rounded-2xl border border-border bg-card/75 p-6 backdrop-blur-xl">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">BPT Activities</h3>
            <span className="text-xs text-muted-foreground">Convert To Contact: {formatBpt(summary?.bptActivities.convertToContact || 0)}</span>
          </div>
          <div className="mt-4 space-y-3">
            <div className="rounded-lg border bg-background/60 p-3">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Type</span>
                <span>Date</span>
              </div>
              <div className="mt-2 space-y-2 max-h-96 overflow-auto">
                {isBptLoading && <div className="text-sm text-muted-foreground">Loading BPT transactions...</div>}
                {!isBptLoading && bptList?.items.length === 0 && <div className="text-sm text-muted-foreground">No BPT transactions in range.</div>}
                {!isBptLoading && bptList?.items.map((tx) => (
                  <div key={tx.id} className="flex items-center justify-between rounded border px-3 py-2 text-sm">
                    <div className="flex flex-col">
                      <span className="font-semibold">{tx.transactionType}</span>
                      <span className="text-xs text-muted-foreground truncate max-w-[200px]">{tx.description || "-"}</span>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold">{formatBpt(tx.amount || 0)}</div>
                      <div className="text-xs text-muted-foreground">{formatDate(tx.createdAt)}</div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-3 flex items-center justify-between text-xs">
                <span className="text-muted-foreground">
                  Page {bptPage} of {bptList ? Math.max(1, Math.ceil(bptList.total / bptPageSize)) : 1} ({bptList?.total || 0} items)
                </span>
                <div className="flex gap-2">
                  <button
                    className="rounded border px-2 py-1 disabled:opacity-50"
                    onClick={() => { setBptPage((p) => Math.max(1, p - 1)); refetchBpt(); }}
                    disabled={bptPage === 1}
                  >
                    Prev
                  </button>
                  <button
                    className="rounded border px-2 py-1 disabled:opacity-50"
                    onClick={() => {
                      const maxPage = bptList ? Math.max(1, Math.ceil(bptList.total / bptPageSize)) : 1;
                      setBptPage((p) => Math.min(maxPage, p + 1));
                      refetchBpt();
                    }}
                    disabled={bptList ? bptPage >= Math.max(1, Math.ceil(bptList.total / bptPageSize)) : true}
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
