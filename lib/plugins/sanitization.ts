const FORBIDDEN_PLUGIN_PATH_SEGMENTS = ["node_modules/", "__macosx/", ".git/"];

export const FORBIDDEN_PLUGIN_FILE_EXTENSIONS = [
  ".js",
  ".mjs",
  ".cjs",
  ".ts",
  ".tsx",
  ".jsx",
  ".sh",
  ".bash",
  ".zsh",
  ".bat",
  ".cmd",
  ".ps1",
  ".exe",
  ".dll",
  ".so",
  ".dylib",
  ".wasm",
  ".node",
] as const;

const SECRET_REF_PREFIX = "secret://";
const SECRET_ALIAS_REGEX = /^[A-Z][A-Z0-9_]*$/;

export function sanitizePluginPath(value: string): string {
  return value.trim().replace(/\\/g, "/").replace(/^\.\//, "").toLowerCase();
}

export function hasForbiddenPathSegment(pathValue: string): boolean {
  const normalized = sanitizePluginPath(pathValue);
  return FORBIDDEN_PLUGIN_PATH_SEGMENTS.some((segment) => normalized.includes(segment));
}

export function hasForbiddenExecutableExtension(pathValue: string): boolean {
  const normalized = sanitizePluginPath(pathValue);
  return FORBIDDEN_PLUGIN_FILE_EXTENSIONS.some((extension) => normalized.endsWith(extension));
}

export function sanitizeExternalUrl(urlValue: string): string | null {
  try {
    const parsed = new URL(urlValue.trim());
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return null;
    }
    return parsed.toString();
  } catch {
    return null;
  }
}

export function sanitizeSecretReference(secretRef: string): string | null {
  const trimmed = secretRef.trim();
  if (!trimmed.startsWith(SECRET_REF_PREFIX)) {
    return null;
  }

  const alias = trimmed.slice(SECRET_REF_PREFIX.length);
  if (!SECRET_ALIAS_REGEX.test(alias)) {
    return null;
  }

  return `${SECRET_REF_PREFIX}${alias}`;
}

export function maskSecretReference(value: unknown): string {
  if (typeof value !== "string") {
    return "[MASKED_SECRET_REF]";
  }

  return value.startsWith(SECRET_REF_PREFIX) ? "[MASKED_SECRET_REF]" : value;
}

export function sanitizePluginTextValue(value: string, maxLength = 1000): string {
  return value.replace(/\u0000/g, "").trim().slice(0, maxLength);
}
