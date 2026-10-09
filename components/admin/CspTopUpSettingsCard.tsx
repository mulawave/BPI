"use client";

import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Timer } from "lucide-react";
import { api } from "@/client/trpc";

/** Admin controls for CSP time-extension (top-up) prices (follow-up Q13, 07/10/2026). */
export default function CspTopUpSettingsCard() {
  const utils = api.useUtils();
  const { data, isLoading } = api.csp.adminGetTopUpSettings.useQuery();
  const [enabled, setEnabled] = useState(false);
  const [price24h, setPrice24h] = useState(10000);
  const [price48h, setPrice48h] = useState(20000);
  const [maxExtraHours, setMaxExtraHours] = useState(48);

  useEffect(() => {
    if (!data) return;
    setEnabled(data.enabled);
    setPrice24h(data.price24h);
    setPrice48h(data.price48h);
    setMaxExtraHours(data.maxExtraHours);
  }, [data]);

  const save = api.csp.adminSaveTopUpSettings.useMutation({
    onSuccess: () => {
      toast.success("Time-extension settings saved");
      utils.csp.adminGetTopUpSettings.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  const changed =
    !!data &&
    (data.enabled !== enabled || data.price24h !== price24h || data.price48h !== price48h || data.maxExtraHours !== maxExtraHours);

  return (
    <div className="rounded-2xl border border-border bg-card/70 p-6 shadow-sm space-y-4">
      <div className="flex items-center gap-3">
        <Timer className="h-5 w-5 text-sky-600" />
        <div>
          <h2 className="text-lg font-bold text-foreground">CSP time extensions (top-up)</h2>
          <p className="text-sm text-muted-foreground">Members can buy extra broadcast time, paid from their Main Wallet.</p>
        </div>
      </div>
      {isLoading ? (
        <div className="h-20 animate-pulse rounded-lg bg-muted/40" />
      ) : (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <label className="flex items-center justify-between gap-3 rounded-lg border border-border bg-background px-3 py-2 text-sm">
            <span className="font-medium text-foreground">Enabled</span>
            <input type="checkbox" checked={enabled} onChange={(e) => setEnabled(e.target.checked)} className="h-4 w-4 rounded border-border" />
          </label>
          <div>
            <label className="text-xs font-semibold text-muted-foreground">24h price (₦)</label>
            <input type="number" min={0} value={price24h} onChange={(e) => setPrice24h(Math.max(0, Math.round(Number(e.target.value) || 0)))} className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="text-xs font-semibold text-muted-foreground">48h price (₦)</label>
            <input type="number" min={0} value={price48h} onChange={(e) => setPrice48h(Math.max(0, Math.round(Number(e.target.value) || 0)))} className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="text-xs font-semibold text-muted-foreground">Max extra hours per request</label>
            <input type="number" min={0} value={maxExtraHours} onChange={(e) => setMaxExtraHours(Math.max(0, Math.round(Number(e.target.value) || 0)))} className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" />
          </div>
        </div>
      )}
      <div className="flex justify-end">
        <button
          onClick={() => save.mutate({ enabled, price24h, price48h, maxExtraHours })}
          disabled={!changed || save.isPending}
          className="rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-700 disabled:opacity-50"
        >
          {save.isPending ? "Saving..." : "Save"}
        </button>
      </div>
    </div>
  );
}
