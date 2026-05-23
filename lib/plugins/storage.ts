import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { randomBytes } from "crypto";

const PLUGIN_ARTIFACT_ROOT_DIR = path.join(process.cwd(), ".plugin-artifacts");
const PLUGIN_QUARANTINE_DIR = path.join(PLUGIN_ARTIFACT_ROOT_DIR, "quarantine");

export type PluginQuarantineStorageResult = {
  storageKey: string;
  relativeArchivePath: string;
  absoluteArchivePath: string;
};

export async function ensurePluginQuarantineDir(): Promise<void> {
  await mkdir(PLUGIN_QUARANTINE_DIR, { recursive: true });
}

export function buildPluginStorageKey(): string {
  const entropy = randomBytes(8).toString("hex");
  return `${Date.now()}-${entropy}`;
}

export async function storePluginArchiveInQuarantine(input: {
  archiveBuffer: Buffer;
  storageKey: string;
}): Promise<PluginQuarantineStorageResult> {
  await ensurePluginQuarantineDir();

  const fileName = `${input.storageKey}.zip`;
  const relativeArchivePath = path.join("quarantine", fileName);
  const absoluteArchivePath = path.join(PLUGIN_ARTIFACT_ROOT_DIR, relativeArchivePath);

  await writeFile(absoluteArchivePath, input.archiveBuffer);

  return {
    storageKey: input.storageKey,
    relativeArchivePath,
    absoluteArchivePath,
  };
}

export async function storePluginQuarantineMetadata(input: {
  storageKey: string;
  metadata: Record<string, unknown>;
}): Promise<string> {
  await ensurePluginQuarantineDir();

  const fileName = `${input.storageKey}.json`;
  const relativeMetadataPath = path.join("quarantine", fileName);
  const absoluteMetadataPath = path.join(PLUGIN_ARTIFACT_ROOT_DIR, relativeMetadataPath);

  await writeFile(absoluteMetadataPath, JSON.stringify(input.metadata, null, 2), "utf8");

  return relativeMetadataPath;
}
