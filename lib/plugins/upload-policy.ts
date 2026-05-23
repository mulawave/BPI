export const MAX_PLUGIN_ARCHIVE_BYTES = 25 * 1024 * 1024;

export const PLUGIN_ARCHIVE_MIME_TYPES = [
  "application/zip",
  "application/x-zip-compressed",
  "application/octet-stream",
] as const;

export type PluginUploadPolicyFile = {
  name: string;
  type: string;
  size: number;
};

export type PluginUploadPolicyResult = {
  ok: boolean;
  errors: string[];
};

export function isPluginArchiveExtension(filename: string): boolean {
  return filename.toLowerCase().endsWith(".zip");
}

export function isPluginArtifactMimeType(mimeType: string): boolean {
  return (PLUGIN_ARCHIVE_MIME_TYPES as readonly string[]).includes(mimeType);
}

export function hasZipMagicBytes(buffer: Buffer): boolean {
  if (buffer.length < 4) return false;
  const signature = buffer.subarray(0, 4).toString("hex").toUpperCase();
  return signature === "504B0304" || signature === "504B0506" || signature === "504B0708";
}

export function validatePluginUploadPolicy(input: {
  file: PluginUploadPolicyFile;
  buffer: Buffer;
}): PluginUploadPolicyResult {
  const { file, buffer } = input;
  const errors: string[] = [];

  if (!file.name.trim()) {
    errors.push("File name is required.");
  }

  if (!isPluginArchiveExtension(file.name)) {
    errors.push("Only .zip plugin archives are allowed in phase one.");
  }

  if (file.type && !isPluginArtifactMimeType(file.type)) {
    errors.push("Unsupported plugin archive MIME type.");
  }

  if (file.size <= 0) {
    errors.push("Plugin archive cannot be empty.");
  }

  if (file.size > MAX_PLUGIN_ARCHIVE_BYTES) {
    errors.push(`Plugin archive exceeds ${MAX_PLUGIN_ARCHIVE_BYTES} bytes.`);
  }

  if (!hasZipMagicBytes(buffer)) {
    errors.push("File content does not match a zip archive signature.");
  }

  return {
    ok: errors.length === 0,
    errors,
  };
}
