export const PLUGIN_VALIDATION_SEVERITY = ["error", "warning", "info"] as const;

export type PluginValidationSeverity = (typeof PLUGIN_VALIDATION_SEVERITY)[number];

export type PluginValidationIssue = {
  code: string;
  path: string;
  message: string;
  severity: PluginValidationSeverity;
};

export type PluginValidationReport = {
  valid: boolean;
  generatedAt: string;
  pluginId?: string;
  slug?: string;
  version?: string;
  issueCount: {
    error: number;
    warning: number;
    info: number;
  };
  issues: PluginValidationIssue[];
};
