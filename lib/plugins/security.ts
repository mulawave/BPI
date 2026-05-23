import { hasZipMagicBytes } from "@/lib/plugins/upload-policy";
import {
  hasForbiddenExecutableExtension,
  hasForbiddenPathSegment,
  sanitizePluginPath,
} from "@/lib/plugins/sanitization";

export const MAX_PLUGIN_ARCHIVE_FILE_COUNT = 1000;
export const MAX_PLUGIN_ARCHIVE_UNPACKED_BYTES = 120 * 1024 * 1024;

export type PluginArchiveSecurityIssue = {
  code: string;
  message: string;
};

export type PluginArchiveSecurityResult = {
  ok: boolean;
  issues: PluginArchiveSecurityIssue[];
};

export type PluginArchiveFileEntry = {
  path: string;
  sizeBytes: number;
};

export function inspectArchiveEntries(entries: PluginArchiveFileEntry[]): PluginArchiveSecurityResult {
  const issues: PluginArchiveSecurityIssue[] = [];

  if (entries.length > MAX_PLUGIN_ARCHIVE_FILE_COUNT) {
    issues.push({
      code: "ARCHIVE_FILE_COUNT_EXCEEDED",
      message: `Archive contains too many files (${entries.length}).`,
    });
  }

  const totalUnpackedBytes = entries.reduce((sum, entry) => sum + Math.max(0, entry.sizeBytes), 0);
  if (totalUnpackedBytes > MAX_PLUGIN_ARCHIVE_UNPACKED_BYTES) {
    issues.push({
      code: "ARCHIVE_UNPACKED_SIZE_EXCEEDED",
      message: `Archive unpacked size exceeds ${MAX_PLUGIN_ARCHIVE_UNPACKED_BYTES} bytes.`,
    });
  }

  for (const entry of entries) {
    const normalizedPath = sanitizePluginPath(entry.path);

    if (normalizedPath.includes("../") || normalizedPath.startsWith("/")) {
      issues.push({
        code: "ARCHIVE_PATH_TRAVERSAL",
        message: `Archive path traversal is not allowed: ${entry.path}`,
      });
    }

    if (hasForbiddenPathSegment(normalizedPath)) {
      issues.push({
        code: "ARCHIVE_FORBIDDEN_PATH_SEGMENT",
        message: `Forbidden archive path segment detected: ${entry.path}`,
      });
    }

    if (hasForbiddenExecutableExtension(normalizedPath)) {
      issues.push({
        code: "ARCHIVE_EXECUTABLE_FILE_FORBIDDEN",
        message: `Executable bundle file is forbidden in phase one: ${entry.path}`,
      });
    }
  }

  return {
    ok: issues.length === 0,
    issues,
  };
}

export function scanArchiveBufferForUnsafePatterns(buffer: Buffer): PluginArchiveSecurityResult {
  const issues: PluginArchiveSecurityIssue[] = [];

  if (!hasZipMagicBytes(buffer)) {
    issues.push({
      code: "ARCHIVE_NOT_ZIP_SIGNATURE",
      message: "Archive does not have a valid zip signature.",
    });
  }

  const content = buffer.toString("latin1").toLowerCase();

  const suspiciousPatterns = [
    { code: "PATTERN_PATH_TRAVERSAL", regex: /\.\.\//, message: "Archive contains traversal markers." },
    { code: "PATTERN_NODE_MODULES", regex: /node_modules\//, message: "Archive contains node_modules content." },
    {
      code: "PATTERN_EXEC_JS",
      regex: /\.(?:js|cjs|mjs|jsx|ts|tsx)(?:[^a-z0-9]|$)/,
      message: "Archive references JavaScript bundles, which are forbidden in phase one.",
    },
    { code: "PATTERN_EXEC_WASM", regex: /\.wasm(?:[^a-z0-9]|$)/, message: "Archive references WebAssembly content, which are forbidden in phase one." },
    { code: "PATTERN_SHELL_SCRIPT", regex: /\.sh(?:[^a-z0-9]|$)/, message: "Archive references shell scripts, which are forbidden in phase one." },
  ];

  for (const pattern of suspiciousPatterns) {
    if (pattern.regex.test(content)) {
      issues.push({
        code: pattern.code,
        message: pattern.message,
      });
    }
  }

  return {
    ok: issues.length === 0,
    issues,
  };
}

export function validatePluginArchiveSecurity(input: {
  archiveBuffer: Buffer;
  extractedEntries?: PluginArchiveFileEntry[];
}): PluginArchiveSecurityResult {
  const bufferScan = scanArchiveBufferForUnsafePatterns(input.archiveBuffer);
  const entryInspection = input.extractedEntries ? inspectArchiveEntries(input.extractedEntries) : { ok: true, issues: [] as PluginArchiveSecurityIssue[] };

  const issues = [...bufferScan.issues, ...entryInspection.issues];

  return {
    ok: issues.length === 0,
    issues,
  };
}
