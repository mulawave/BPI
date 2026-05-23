import fs from "fs";
import path from "path";
import { createPluginArchiveBuffer, type PluginArchiveSourceEntry } from "../../lib/plugins/archive";
import { sha256Hex } from "../../lib/plugins/checksums";
import { validatePluginArchiveContents } from "../../lib/plugins/archive-validation";

export const SAMPLE_PLUGIN_ID = "com.bpi.crm-insights-console";
export const SAMPLE_PLUGIN_SLUG = "crm-insights-console";
export const SAMPLE_PLUGIN_VERSION = "1.0.0";

type BuildPluginBundleFromSourceInput = {
  sourceDir: string;
  distDir: string;
  artifactFileName: string;
  artifactSummaryFileName?: string;
  appVersion?: string;
  hostPluginSdkVersion?: string;
};

export function getSamplePluginPaths() {
  const rootDir = path.resolve(__dirname, "..", "..", "seed-exports", "plugins", SAMPLE_PLUGIN_SLUG);
  return {
    rootDir,
    sourceDir: path.join(rootDir, "source"),
    distDir: path.join(rootDir, "dist"),
    artifactPath: path.join(rootDir, "dist", `${SAMPLE_PLUGIN_SLUG}-${SAMPLE_PLUGIN_VERSION}.zip`),
    manifestTemplatePath: path.join(rootDir, "source", "bpi-plugin.template.json"),
    artifactSummaryPath: path.join(rootDir, "dist", "artifact-summary.json"),
  };
}

export function buildPluginBundleFromSource(input: BuildPluginBundleFromSourceInput) {
  const sourceDir = path.resolve(input.sourceDir);
  const distDir = path.resolve(input.distDir);
  const artifactPath = path.join(distDir, input.artifactFileName);
  const artifactSummaryPath = path.join(distDir, input.artifactSummaryFileName ?? "artifact-summary.json");
  const manifestTemplatePath = path.join(sourceDir, "bpi-plugin.template.json");

  fs.mkdirSync(distDir, { recursive: true });

  const manifestTemplate = JSON.parse(fs.readFileSync(manifestTemplatePath, "utf8")) as Record<string, unknown>;
  const staticEntries = collectSourceEntries(sourceDir).filter((entry) => entry.path !== "bpi-plugin.template.json");
  const contractDigest = sha256Hex(
    Buffer.from(
      staticEntries
        .map((entry) => `${entry.path}:${sha256Hex(entry.data)}`)
        .join("\n"),
      "utf8",
    ),
  );

  const manifest = {
    ...manifestTemplate,
    checksums: {
      manifestSha256: contractDigest,
      archiveSha256: contractDigest,
    },
  };

  const manifestBuffer = Buffer.from(`${JSON.stringify(manifest, null, 2)}\n`, "utf8");
  const inArchiveEntries: PluginArchiveSourceEntry[] = [
    {
      path: "bpi-plugin.json",
      data: manifestBuffer,
    },
    ...staticEntries,
  ];

  const archiveBuffer = createPluginArchiveBuffer(inArchiveEntries);
  fs.writeFileSync(artifactPath, archiveBuffer);

  const validation = validatePluginArchiveContents({
    archiveBuffer,
    appVersion: input.appVersion ?? "1.0.0",
    hostPluginSdkVersion: input.hostPluginSdkVersion ?? "1.0.0",
  });

  if (!validation.ok || !validation.manifest) {
    throw new Error(`Generated plugin bundle is invalid: ${validation.issues.map((issue) => issue.message).join("; ")}`);
  }

  const artifactSummary = {
    pluginId: validation.manifest.pluginId,
    slug: validation.manifest.slug,
    version: validation.manifest.version,
    artifactPath,
    archiveSha256: sha256Hex(archiveBuffer),
    extractedManifestSha256: validation.manifestSha256,
    sourceContractDigest: contractDigest,
    builtAt: new Date().toISOString(),
  };

  fs.writeFileSync(artifactSummaryPath, `${JSON.stringify(artifactSummary, null, 2)}\n`, "utf8");

  return {
    rootDir: path.resolve(sourceDir, ".."),
    sourceDir,
    distDir,
    artifactPath,
    manifestTemplatePath,
    artifactSummaryPath,
    archiveBuffer,
    archiveSha256: artifactSummary.archiveSha256,
    manifestSha256: validation.manifestSha256 || artifactSummary.extractedManifestSha256,
    manifest: validation.manifest,
    pageSchema: validation.pageSchema,
    settingsSchema: validation.settingsSchema,
    readmeMarkdown: validation.readmeMarkdown,
    changelogMarkdown: validation.changelogMarkdown,
    validationReport: validation.validationReport,
  };
}

export function buildSamplePluginBundle() {
  const paths = getSamplePluginPaths();
  return buildPluginBundleFromSource({
    sourceDir: paths.sourceDir,
    distDir: paths.distDir,
    artifactFileName: `${SAMPLE_PLUGIN_SLUG}-${SAMPLE_PLUGIN_VERSION}.zip`,
    artifactSummaryFileName: "artifact-summary.json",
    appVersion: "1.0.0",
    hostPluginSdkVersion: "1.0.0",
  });
}

function collectSourceEntries(sourceDir: string): PluginArchiveSourceEntry[] {
  const relativePaths = walkFiles(sourceDir).map((absolutePath) => path.relative(sourceDir, absolutePath).replace(/\\/g, "/"));
  return relativePaths.map((relativePath) => ({
    path: relativePath,
    data: fs.readFileSync(path.join(sourceDir, relativePath)),
  }));
}

function walkFiles(dirPath: string): string[] {
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });
  const files: string[] = [];

  for (const entry of entries) {
    const absolutePath = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      files.push(...walkFiles(absolutePath));
    } else {
      files.push(absolutePath);
    }
  }

  return files;
}