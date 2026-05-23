"use client";

import { getPluginCapabilityCatalog } from "@/lib/plugins/capabilities";
import { FiAlertTriangle } from "react-icons/fi";

const RISK_STYLE = {
  LOW: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/35 dark:text-emerald-300",
  MEDIUM: "bg-amber-100 text-amber-700 dark:bg-amber-900/35 dark:text-amber-300",
  HIGH: "bg-rose-100 text-rose-700 dark:bg-rose-900/35 dark:text-rose-300",
} as const;

export default function PluginCapabilityReview({
  requestedCapabilities,
  approvedCapabilities,
  onChange,
  disabled,
}: {
  requestedCapabilities: string[];
  approvedCapabilities: string[];
  onChange: (next: string[]) => void;
  disabled?: boolean;
}) {
  const definitions = getPluginCapabilityCatalog().filter((item) => requestedCapabilities.includes(item.id));

  const toggle = (capability: string) => {
    if (disabled) return;
    const nextSet = new Set(approvedCapabilities);
    if (nextSet.has(capability)) {
      nextSet.delete(capability);
    } else {
      nextSet.add(capability);
    }
    onChange(Array.from(nextSet));
  };

  if (!requestedCapabilities.length) {
    return (
      <div className="rounded-2xl border border-border bg-card/70 p-5 shadow-lg shadow-black/5 backdrop-blur-sm dark:shadow-black/20">
        <h3 className="text-base font-semibold text-foreground">Capability Review</h3>
        <p className="mt-2 text-sm text-muted-foreground">This plugin did not request additional capabilities.</p>
      </div>
    );
  }

  return (
    <div className="w-full min-w-0 rounded-2xl border border-border bg-card/70 p-5 shadow-lg shadow-black/5 backdrop-blur-sm dark:shadow-black/20">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold text-foreground">Capability Review</h3>
          <p className="mt-1 text-xs text-muted-foreground">
            Review each declared capability before installation approval.
          </p>
        </div>
        {definitions.some((item) => item.riskLevel === "HIGH") ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 px-2.5 py-1 text-xs font-semibold text-rose-700 dark:bg-rose-900/35 dark:text-rose-300">
            <FiAlertTriangle className="h-3.5 w-3.5" />
            High Risk Present
          </span>
        ) : null}
      </div>

      <div className="space-y-2">
        {definitions.map((capability) => {
          const checked = approvedCapabilities.includes(capability.id);

          return (
            <label
              key={capability.id}
              className="flex cursor-pointer items-start gap-3 rounded-xl border border-border bg-background/40 px-3 py-3 transition-colors hover:bg-background/60"
            >
              <input
                type="checkbox"
                checked={checked}
                onChange={() => toggle(capability.id)}
                disabled={disabled}
                className="mt-1 h-4 w-4 rounded border-border text-[hsl(var(--primary))] focus:ring-[hsl(var(--primary))]"
              />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-semibold text-foreground">{capability.id}</span>
                  <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold ${RISK_STYLE[capability.riskLevel]}`}>
                    {capability.riskLevel}
                  </span>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">{capability.summary}</p>
              </div>
            </label>
          );
        })}
      </div>
    </div>
  );
}
