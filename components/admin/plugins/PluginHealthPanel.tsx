"use client";

type HealthSummary = {
  state: "UNKNOWN" | "READY" | "CONFIG_MISSING" | "DEGRADED" | "FAILED";
  summary: string;
  checkedAt: string | null;
  details?: unknown;
};

type ReadinessReport = {
  state: "READY" | "CONFIG_REQUIRED" | "BLOCKED";
  ready: boolean;
  reasons: string[];
  checks: {
    hasInstalledVersion: boolean;
    hasCapabilityApprovals: boolean;
    hasRequiredSecrets: boolean;
    hasNoBlockingStatus: boolean;
  };
};

const HEALTH_STYLE = {
  UNKNOWN: "bg-zinc-100 text-zinc-700 dark:bg-zinc-900/35 dark:text-zinc-300",
  READY: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/35 dark:text-emerald-300",
  CONFIG_MISSING: "bg-amber-100 text-amber-700 dark:bg-amber-900/35 dark:text-amber-300",
  DEGRADED: "bg-orange-100 text-orange-700 dark:bg-orange-900/35 dark:text-orange-300",
  FAILED: "bg-rose-100 text-rose-700 dark:bg-rose-900/35 dark:text-rose-300",
} as const;

const READINESS_STYLE = {
  READY: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/35 dark:text-emerald-300",
  CONFIG_REQUIRED: "bg-amber-100 text-amber-700 dark:bg-amber-900/35 dark:text-amber-300",
  BLOCKED: "bg-rose-100 text-rose-700 dark:bg-rose-900/35 dark:text-rose-300",
} as const;

export default function PluginHealthPanel({
  health,
  readiness,
}: {
  health: HealthSummary;
  readiness: ReadinessReport;
}) {
  return (
    <div className="w-full min-w-0 rounded-2xl border border-border bg-card/70 p-5 shadow-lg shadow-black/5 backdrop-blur-sm dark:shadow-black/20">
      <div className="mb-3 flex items-start justify-between gap-3">
        <h3 className="text-base font-semibold text-foreground">Health and Readiness</h3>
        <div className="flex items-center gap-2">
          <span className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${HEALTH_STYLE[health.state]}`}>
            Health: {health.state}
          </span>
          <span className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${READINESS_STYLE[readiness.state]}`}>
            Readiness: {readiness.state}
          </span>
        </div>
      </div>

      <p className="text-xs text-muted-foreground">{health.summary}</p>
      {health.checkedAt ? <p className="mt-1 text-[11px] text-muted-foreground">Last check: {new Date(health.checkedAt).toLocaleString()}</p> : null}

      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        <div className="rounded-xl border border-border bg-background/40 px-3 py-2 text-xs text-foreground">
          Installed version: {readiness.checks.hasInstalledVersion ? "Yes" : "No"}
        </div>
        <div className="rounded-xl border border-border bg-background/40 px-3 py-2 text-xs text-foreground">
          Capability approvals: {readiness.checks.hasCapabilityApprovals ? "Complete" : "Pending"}
        </div>
        <div className="rounded-xl border border-border bg-background/40 px-3 py-2 text-xs text-foreground">
          Secrets resolved: {readiness.checks.hasRequiredSecrets ? "Yes" : "Missing"}
        </div>
        <div className="rounded-xl border border-border bg-background/40 px-3 py-2 text-xs text-foreground">
          Blocking status: {readiness.checks.hasNoBlockingStatus ? "None" : "Present"}
        </div>
      </div>

      {!readiness.ready ? (
        <div className="mt-3 rounded-xl border border-amber-300/50 bg-amber-50 px-3 py-2 text-xs text-amber-700 dark:border-amber-700/40 dark:bg-amber-900/20 dark:text-amber-300">
          <p className="font-semibold">Readiness blockers</p>
          <ul className="mt-1 list-disc space-y-1 pl-4">
            {readiness.reasons.length ? readiness.reasons.map((reason) => <li key={reason}>{reason}</li>) : <li>Plugin is not yet ready.</li>}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
