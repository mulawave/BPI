import { sortByStringKey } from "@/lib/utils";
import { isKnownPluginCapability } from "@/lib/plugins/capabilities";
import { parsePluginManifest } from "@/lib/plugins/manifest";
import { isAppVersionCompatible, isPluginSdkCompatible } from "@/lib/plugins/compatibility";
import type { PluginValidationIssue, PluginValidationReport } from "@/types/plugin-validation";

export function validatePluginManifest(input: {
  manifestInput: unknown;
  appVersion: string;
  hostPluginSdkVersion: string;
}): PluginValidationReport {
  const { manifestInput, appVersion, hostPluginSdkVersion } = input;
  const issues: PluginValidationIssue[] = [];

  const parsed = parsePluginManifest(manifestInput);

  if (!parsed.success) {
    for (const error of parsed.errors) {
      issues.push({
        code: "MANIFEST_SCHEMA_INVALID",
        path: "$",
        message: error,
        severity: "error",
      });
    }

    return buildValidationReport(undefined, issues);
  }

  const manifest = parsed.manifest;

  if (!isPluginSdkCompatible({
    hostPluginSdkVersion,
    pluginSdkVersion: manifest.compatibility.pluginSdkVersion,
  })) {
    issues.push({
      code: "PLUGIN_SDK_INCOMPATIBLE",
      path: "compatibility.pluginSdkVersion",
      message: "Plugin SDK version is not compatible with host SDK version.",
      severity: "error",
    });
  }

  if (!isAppVersionCompatible({
    appVersion,
    minAppVersion: manifest.compatibility.minAppVersion,
    maxAppVersion: manifest.compatibility.maxAppVersion,
  })) {
    issues.push({
      code: "APP_VERSION_INCOMPATIBLE",
      path: "compatibility",
      message: "Plugin app version range is incompatible with current host app version.",
      severity: "error",
    });
  }

  for (const capability of manifest.capabilities) {
    if (!isKnownPluginCapability(capability)) {
      issues.push({
        code: "UNKNOWN_CAPABILITY",
        path: "capabilities",
        message: `Unsupported capability requested: ${capability}`,
        severity: "error",
      });
    }
  }

  return buildValidationReport(manifest, issues);
}

function buildValidationReport(
  manifest: { pluginId: string; slug: string; version: string } | undefined,
  issues: PluginValidationIssue[],
): PluginValidationReport {
  const sortedIssues = sortByStringKey(
    [...issues].sort((left, right) => left.code.localeCompare(right.code)),
    "path",
  );

  const counters = sortedIssues.reduce(
    (acc, issue) => {
      acc[issue.severity] += 1;
      return acc;
    },
    { error: 0, warning: 0, info: 0 },
  );

  return {
    valid: counters.error === 0,
    generatedAt: new Date().toISOString(),
    pluginId: manifest?.pluginId,
    slug: manifest?.slug,
    version: manifest?.version,
    issueCount: counters,
    issues: sortedIssues,
  };
}
