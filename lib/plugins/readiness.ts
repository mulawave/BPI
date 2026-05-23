import { normalizeRequestedCapabilities } from "@/lib/plugins/permissions";

export type PluginReadinessState = "READY" | "CONFIG_REQUIRED" | "BLOCKED";

export type PluginReadinessReport = {
  state: PluginReadinessState;
  ready: boolean;
  reasons: string[];
  checks: {
    hasInstalledVersion: boolean;
    hasCapabilityApprovals: boolean;
    hasRequiredSecrets: boolean;
    hasNoBlockingStatus: boolean;
  };
};

const TERMINAL_PLUGIN_STATUSES = new Set(["REJECTED", "REMOVED", "ERROR"]);
const PRESERVED_PLUGIN_STATUSES = new Set(["DISABLED", "REJECTED", "REMOVED", "ERROR"]);

type PluginReadinessInput = {
  status: string;
  installedVersionId?: string | null;
  requestedCapabilities: unknown;
  approvedCapabilities: unknown;
  manifestSnapshot?: unknown;
  settings?: Array<{ key: string; valueJson: unknown; isSecretRef?: boolean }>;
  secrets?: Array<{ secretKey: string }>;
};

function parseRequiredSecretsFromManifest(manifestSnapshot: unknown): string[] {
  if (!manifestSnapshot || typeof manifestSnapshot !== "object") return [];
  const manifest = manifestSnapshot as {
    settings?: {
      requiredSecrets?: unknown;
    };
  };

  if (!Array.isArray(manifest.settings?.requiredSecrets)) return [];
  return manifest.settings?.requiredSecrets.filter((value): value is string => typeof value === "string") ?? [];
}

export function evaluatePluginReadiness(input: PluginReadinessInput): PluginReadinessReport {
  const reasons: string[] = [];

  const hasNoBlockingStatus = !TERMINAL_PLUGIN_STATUSES.has(input.status);
  if (!hasNoBlockingStatus) {
    reasons.push(`Plugin status ${input.status} blocks enablement.`);
  }

  const hasInstalledVersion = Boolean(input.installedVersionId);
  if (!hasInstalledVersion) {
    reasons.push("No installed plugin version is set.");
  }

  // Before installation, capability approvals and secret checks are not actionable yet.
  // We keep readiness blocked only on missing installation or terminal status.
  if (!hasInstalledVersion) {
    const ready = false;
    return {
      state: hasNoBlockingStatus ? "BLOCKED" : "CONFIG_REQUIRED",
      ready,
      reasons,
      checks: {
        hasInstalledVersion,
        hasCapabilityApprovals: true,
        hasRequiredSecrets: true,
        hasNoBlockingStatus,
      },
    };
  }

  const requestedCapabilities = normalizeRequestedCapabilities(
    Array.isArray(input.requestedCapabilities) ? input.requestedCapabilities : [],
  );
  const approvedSet = new Set(Array.isArray(input.approvedCapabilities) ? input.approvedCapabilities : []);
  const missingApprovals = requestedCapabilities.filter((capability) => !approvedSet.has(capability));
  const hasCapabilityApprovals = missingApprovals.length === 0;
  if (!hasCapabilityApprovals) {
    reasons.push(`Missing capability approvals: ${missingApprovals.join(", ")}.`);
  }

  const requiredSecrets = parseRequiredSecretsFromManifest(input.manifestSnapshot);
  const secretKeys = new Set((input.secrets ?? []).map((entry) => entry.secretKey));
  const missingSecrets = requiredSecrets.filter((secretKey) => !secretKeys.has(secretKey));

  const secretRefSettings = (input.settings ?? [])
    .filter((setting) => setting.isSecretRef)
    .map((setting) => ({
      key: setting.key,
      value: typeof setting.valueJson === "string" ? setting.valueJson : "",
    }));
  const missingSecretRefs = secretRefSettings
    .filter((setting) => setting.value.startsWith("secret://"))
    .map((setting) => setting.value.replace("secret://", ""))
    .filter((secretAlias) => !secretKeys.has(secretAlias));

  const hasRequiredSecrets = missingSecrets.length === 0 && missingSecretRefs.length === 0;
  if (missingSecrets.length > 0) {
    reasons.push(`Missing required secrets from manifest: ${missingSecrets.join(", ")}.`);
  }
  if (missingSecretRefs.length > 0) {
    reasons.push(`Secret references unresolved in settings: ${missingSecretRefs.join(", ")}.`);
  }

  const ready = hasNoBlockingStatus && hasInstalledVersion && hasCapabilityApprovals && hasRequiredSecrets;
  const state: PluginReadinessState = ready
    ? "READY"
    : !hasRequiredSecrets
      ? "CONFIG_REQUIRED"
      : "BLOCKED";

  return {
    state,
    ready,
    reasons,
    checks: {
      hasInstalledVersion,
      hasCapabilityApprovals,
      hasRequiredSecrets,
      hasNoBlockingStatus,
    },
  };
}

export function derivePluginStatusFromReadiness(input: {
  currentStatus: string;
  installedVersionId?: string | null;
  readiness: PluginReadinessReport;
}): string {
  if (PRESERVED_PLUGIN_STATUSES.has(input.currentStatus)) {
    return input.currentStatus;
  }

  if (!input.installedVersionId) {
    return input.currentStatus === "DRAFT" ? "DRAFT" : "VALIDATED";
  }

  return input.readiness.state === "CONFIG_REQUIRED" ? "CONFIG_REQUIRED" : "INSTALLED";
}
