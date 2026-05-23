import path from "path";
import { buildPluginBundleFromSource } from "./lib/samplePluginBundle";

const targets = [
  {
    label: "existing plugin update",
    sourceDir: path.resolve(__dirname, "..", "seed-exports", "plugins", "crm-insights-console-v1_1_0", "source"),
    distDir: path.resolve(__dirname, "..", "seed-exports", "plugins", "crm-insights-console-v1_1_0", "dist"),
    artifactFileName: "crm-insights-console-1.1.0.zip",
    artifactSummaryFileName: "artifact-summary.json",
  },
  {
    label: "new plugin",
    sourceDir: path.resolve(__dirname, "..", "seed-exports", "plugins", "revenue-anomaly-watch", "source"),
    distDir: path.resolve(__dirname, "..", "seed-exports", "plugins", "revenue-anomaly-watch", "dist"),
    artifactFileName: "revenue-anomaly-watch-1.0.0.zip",
    artifactSummaryFileName: "artifact-summary.json",
  },
] as const;

for (const target of targets) {
  const result = buildPluginBundleFromSource({
    sourceDir: target.sourceDir,
    distDir: target.distDir,
    artifactFileName: target.artifactFileName,
    artifactSummaryFileName: target.artifactSummaryFileName,
    appVersion: "1.0.0",
    hostPluginSdkVersion: "1.0.0",
  });

  console.log(`Built ${target.label}: ${result.artifactPath}`);
  console.log(`  SHA-256: ${result.archiveSha256}`);
}
