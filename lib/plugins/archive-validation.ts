import { findArchiveEntry, listArchiveFileRefs, parsePluginArchive, type PluginArchiveEntry } from "@/lib/plugins/archive";
import { sha256Hex } from "@/lib/plugins/checksums";
import { parsePluginManifest } from "@/lib/plugins/manifest";
import { validatePluginManifest } from "@/lib/plugins/validation";
import type { PluginManifest } from "@/types/plugin-manifest";
import type { PluginPageSchema } from "@/types/plugin-page-schema";
import type { PluginSettingsSchema } from "@/types/plugin-settings-schema";
import type { PluginValidationReport } from "@/types/plugin-validation";

const ROOT_MANIFEST_PATH = "bpi-plugin.json";

export type PluginArchiveValidationIssue = {
  code: string;
  message: string;
};

export type PluginArchiveValidationResult = {
  ok: boolean;
  issues: PluginArchiveValidationIssue[];
  entries: Array<{ path: string; sizeBytes: number }>;
  manifest?: PluginManifest;
  pageSchema?: PluginPageSchema;
  settingsSchema?: PluginSettingsSchema;
  readmeMarkdown?: string;
  changelogMarkdown?: string;
  manifestSha256?: string;
  validationReport?: PluginValidationReport;
  signatureMetadata?: Record<string, unknown>;
};

export function validatePluginArchiveContents(input: {
  archiveBuffer: Buffer;
  appVersion: string;
  hostPluginSdkVersion: string;
}): PluginArchiveValidationResult {
  const issues: PluginArchiveValidationIssue[] = [];
  let archiveEntries: PluginArchiveEntry[] = [];

  try {
    archiveEntries = parsePluginArchive(input.archiveBuffer);
  } catch (error) {
    return {
      ok: false,
      issues: [
        {
          code: "ARCHIVE_PARSE_FAILED",
          message: error instanceof Error ? error.message : "Plugin archive could not be parsed.",
        },
      ],
      entries: [],
    };
  }

  const entries = listArchiveFileRefs(archiveEntries).filter((entry) => !entry.path.endsWith("/"));
  const manifestEntries = archiveEntries.filter((entry) => entry.path === ROOT_MANIFEST_PATH && !entry.isDirectory);
  const nestedManifestEntries = archiveEntries.filter(
    (entry) => entry.path !== ROOT_MANIFEST_PATH && entry.path.endsWith(`/${ROOT_MANIFEST_PATH}`) && !entry.isDirectory,
  );

  if (manifestEntries.length !== 1) {
    issues.push({
      code: "ARCHIVE_MANIFEST_MISSING",
      message: "Archive must contain exactly one bpi-plugin.json file at the root.",
    });
  }

  if (nestedManifestEntries.length > 0) {
    issues.push({
      code: "ARCHIVE_NESTED_MANIFEST_FORBIDDEN",
      message: "Nested bpi-plugin.json files are not allowed in phase one archives.",
    });
  }

  if (issues.length > 0 || !manifestEntries[0]) {
    return {
      ok: false,
      issues,
      entries,
    };
  }

  const manifestEntry = manifestEntries[0];
  const manifestSha256 = sha256Hex(manifestEntry.data);
  const manifestPayload = parseJsonEntry(manifestEntry.data, ROOT_MANIFEST_PATH, issues);

  if (!manifestPayload) {
    return {
      ok: false,
      issues,
      entries,
      manifestSha256,
    };
  }

  const parsedManifest = parsePluginManifest(manifestPayload);
  if (!parsedManifest.success) {
    for (const error of parsedManifest.errors) {
      issues.push({
        code: "MANIFEST_SCHEMA_INVALID",
        message: error,
      });
    }

    return {
      ok: false,
      issues,
      entries,
      manifestSha256,
    };
  }

  const manifest = parsedManifest.manifest;
  const validationReport = validatePluginManifest({
    manifestInput: manifest,
    appVersion: input.appVersion,
    hostPluginSdkVersion: input.hostPluginSdkVersion,
  });

  if (!validationReport.valid) {
    for (const issue of validationReport.issues) {
      issues.push({
        code: issue.code,
        message: `${issue.path}: ${issue.message}`,
      });
    }
  }

  let pageSchema: PluginPageSchema | undefined;
  let settingsSchema: PluginSettingsSchema | undefined;
  let signatureMetadata: Record<string, unknown> | undefined;

  if (manifest.ui?.adminPage?.schemaPath) {
    const pageSchemaEntry = findArchiveEntry(archiveEntries, manifest.ui.adminPage.schemaPath);
    if (!pageSchemaEntry || pageSchemaEntry.isDirectory) {
      issues.push({
        code: "PAGE_SCHEMA_MISSING",
        message: `Referenced page schema was not found: ${manifest.ui.adminPage.schemaPath}`,
      });
    } else {
      const parsedPageSchema = parseJsonEntry(pageSchemaEntry.data, pageSchemaEntry.path, issues);
      if (parsedPageSchema) {
        if (!Array.isArray((parsedPageSchema as Record<string, unknown>).blocks)) {
          issues.push({
            code: "PAGE_SCHEMA_INVALID",
            message: `Referenced page schema must define a blocks array: ${pageSchemaEntry.path}`,
          });
        } else {
          pageSchema = parsedPageSchema as PluginPageSchema;
        }
      }
    }
  }

  if (manifest.settings?.schemaPath) {
    const settingsSchemaEntry = findArchiveEntry(archiveEntries, manifest.settings.schemaPath);
    if (!settingsSchemaEntry || settingsSchemaEntry.isDirectory) {
      issues.push({
        code: "SETTINGS_SCHEMA_MISSING",
        message: `Referenced settings schema was not found: ${manifest.settings.schemaPath}`,
      });
    } else {
      const parsedSettingsSchema = parseJsonEntry(settingsSchemaEntry.data, settingsSchemaEntry.path, issues);
      if (parsedSettingsSchema) {
        const candidate = parsedSettingsSchema as Record<string, unknown>;
        if (candidate.type !== "object" || !candidate.properties || typeof candidate.properties !== "object") {
          issues.push({
            code: "SETTINGS_SCHEMA_INVALID",
            message: `Referenced settings schema must be an object schema: ${settingsSchemaEntry.path}`,
          });
        } else {
          settingsSchema = parsedSettingsSchema as PluginSettingsSchema;
        }
      }
    }
  }

  if (manifest.signature?.signaturePath) {
    const signatureEntry = findArchiveEntry(archiveEntries, manifest.signature.signaturePath);
    if (!signatureEntry || signatureEntry.isDirectory) {
      issues.push({
        code: "SIGNATURE_METADATA_MISSING",
        message: `Referenced signature metadata was not found: ${manifest.signature.signaturePath}`,
      });
    } else {
      const parsedSignatureMetadata = parseJsonEntry(signatureEntry.data, signatureEntry.path, issues);
      if (parsedSignatureMetadata && typeof parsedSignatureMetadata === "object" && !Array.isArray(parsedSignatureMetadata)) {
        signatureMetadata = parsedSignatureMetadata as Record<string, unknown>;
      } else if (parsedSignatureMetadata) {
        issues.push({
          code: "SIGNATURE_METADATA_INVALID",
          message: `Signature metadata must be a JSON object: ${signatureEntry.path}`,
        });
      }
    }
  }

  const readmeMarkdown = findArchiveEntry(archiveEntries, "README.md")?.data.toString("utf8");
  const changelogMarkdown = findArchiveEntry(archiveEntries, "CHANGELOG.md")?.data.toString("utf8");

  return {
    ok: issues.length === 0,
    issues,
    entries,
    manifest,
    pageSchema,
    settingsSchema,
    readmeMarkdown,
    changelogMarkdown,
    manifestSha256,
    validationReport,
    signatureMetadata,
  };
}

function parseJsonEntry(data: Buffer, path: string, issues: PluginArchiveValidationIssue[]): unknown {
  try {
    return JSON.parse(data.toString("utf8"));
  } catch {
    issues.push({
      code: "ARCHIVE_JSON_INVALID",
      message: `Archive file is not valid JSON: ${path}`,
    });
    return undefined;
  }
}