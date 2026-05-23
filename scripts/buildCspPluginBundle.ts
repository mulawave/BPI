import { buildPluginBundleFromSource } from "./lib/samplePluginBundle";
import path from "path";

const CSP_PLUGIN_SLUG = "csp-lifecycle-suite";
const CSP_PLUGIN_VERSION = "1.0.0";

function buildCspPluginBundle() {
  const rootDir = path.resolve(__dirname, "..", "seed-exports", "plugins", CSP_PLUGIN_SLUG);
  const sourceDir = path.join(rootDir, "source");
  const distDir = path.join(rootDir, "dist");

  console.log(`Building CSP Lifecycle Suite Plugin v${CSP_PLUGIN_VERSION}...`);
  console.log(`Source Directory: ${sourceDir}`);
  console.log(`Output Directory: ${distDir}`);

  const result = buildPluginBundleFromSource({
    sourceDir,
    distDir,
    artifactFileName: `${CSP_PLUGIN_SLUG}-${CSP_PLUGIN_VERSION}.zip`,
    artifactSummaryFileName: "artifact-summary.json",
    appVersion: "1.0.0",
    hostPluginSdkVersion: "1.0.0",
  });

  console.log("\n✅ Plugin bundle built successfully!");
  console.log(`\nPlugin Details:`);
  console.log(`  ID: ${result.manifest.pluginId}`);
  console.log(`  Name: ${result.manifest.name}`);
  console.log(`  Version: ${result.manifest.version}`);
  console.log(`  Artifact: ${path.basename(result.artifactPath)}`);
  console.log(`  Archive SHA-256: ${result.archiveSha256}`);
  console.log(`  Manifest SHA-256: ${result.manifestSha256}`);

  console.log(`\nCapabilities (${result.manifest.capabilities.length}):`);
  result.manifest.capabilities.forEach((cap) => {
    console.log(`  - ${cap}`);
  });

  console.log(`\n📦 Ready for deployment:`);
  console.log(`   Upload to Admin Panel: plugins-inventory > upload > ${path.basename(result.artifactPath)}`);
  console.log(`\n✨ Installation: Admin > Plugins > Upload > Select ZIP > Approve > Install`);

  return result;
}

try {
  buildCspPluginBundle();
  process.exit(0);
} catch (error) {
  console.error("\n❌ Failed to build CSP plugin bundle:");
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
}
