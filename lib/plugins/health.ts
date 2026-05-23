type PluginHealthState = "UNKNOWN" | "READY" | "CONFIG_MISSING" | "DEGRADED" | "FAILED";

type HealthStatusRow = {
  healthState: PluginHealthState;
  statusSummary: string | null;
  detailsJson?: unknown;
  updatedAt?: string | Date;
  lastCheckedAt?: string | Date | null;
};

type PluginHealthInput = {
  pluginStatus?: string;
  healthStatuses?: HealthStatusRow[];
};

export type PluginHealthSummary = {
  state: PluginHealthState;
  summary: string;
  details: unknown;
  checkedAt: string | null;
};

function defaultSummaryForState(state: PluginHealthState) {
  switch (state) {
    case "READY":
      return "Plugin health checks are passing.";
    case "CONFIG_MISSING":
      return "Plugin is missing required configuration values.";
    case "DEGRADED":
      return "Plugin is running with degraded health signals.";
    case "FAILED":
      return "Plugin health checks are failing.";
    case "UNKNOWN":
    default:
      return "Plugin health has not been evaluated yet.";
  }
}

export function buildPluginHealthSummary(input: PluginHealthInput): PluginHealthSummary {
  const latest = Array.isArray(input.healthStatuses) && input.healthStatuses.length > 0
    ? input.healthStatuses[0]
    : null;

  if (latest) {
    return {
      state: latest.healthState,
      summary: latest.statusSummary || defaultSummaryForState(latest.healthState),
      details: latest.detailsJson ?? null,
      checkedAt: (latest.lastCheckedAt || latest.updatedAt)
        ? new Date((latest.lastCheckedAt || latest.updatedAt) as string | Date).toISOString()
        : null,
    };
  }

  if (input.pluginStatus === "ERROR") {
    return {
      state: "FAILED",
      summary: "Plugin is in error state and requires administrator action.",
      details: null,
      checkedAt: null,
    };
  }

  if (input.pluginStatus === "CONFIG_REQUIRED") {
    return {
      state: "CONFIG_MISSING",
      summary: "Plugin requires additional configuration before enablement.",
      details: null,
      checkedAt: null,
    };
  }

  return {
    state: "UNKNOWN",
    summary: defaultSummaryForState("UNKNOWN"),
    details: null,
    checkedAt: null,
  };
}
