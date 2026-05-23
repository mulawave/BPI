export const PLUGIN_CAPABILITIES = [
  "register-admin-nav-item",
  "register-admin-page",
  "register-admin-settings-section",
  "read-users-summary",
  "read-referrals-summary",
  "read-payments-summary",
  "read-analytics-summary",
  "read-plugin-settings",
  "write-plugin-settings",
  "access-third-party-api",
  "declare-webhook-endpoint",
  "declare-background-job",
  "emit-plugin-health",
  "write-plugin-audit-log",
] as const;

export type PluginCapability = (typeof PLUGIN_CAPABILITIES)[number];

export const PLUGIN_CAPABILITY_RISK_LEVELS = ["LOW", "MEDIUM", "HIGH"] as const;

export type PluginCapabilityRiskLevel = (typeof PLUGIN_CAPABILITY_RISK_LEVELS)[number];

export type PluginCapabilityDefinition = {
  id: PluginCapability;
  riskLevel: PluginCapabilityRiskLevel;
  approvalRequired: boolean;
  auditRequired: boolean;
  summary: string;
};
