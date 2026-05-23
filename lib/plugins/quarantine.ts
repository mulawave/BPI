import { sha256Hex } from "@/lib/plugins/checksums";
import {
  buildPluginStorageKey,
  storePluginArchiveInQuarantine,
  storePluginQuarantineMetadata,
} from "@/lib/plugins/storage";

export type PluginQuarantineResult = {
  storageKey: string;
  archiveSha256: string;
  quarantineArchivePath: string;
  quarantineMetadataPath: string;
  uploadedAt: string;
};

export async function quarantinePluginUpload(input: {
  archiveBuffer: Buffer;
  originalFileName: string;
  mimeType: string;
  uploadedByAdminId: string;
}): Promise<PluginQuarantineResult> {
  const storageKey = buildPluginStorageKey();
  const archiveSha256 = sha256Hex(input.archiveBuffer);
  const uploadedAt = new Date().toISOString();

  const archive = await storePluginArchiveInQuarantine({
    archiveBuffer: input.archiveBuffer,
    storageKey,
  });

  const quarantineMetadataPath = await storePluginQuarantineMetadata({
    storageKey,
    metadata: {
      storageKey,
      originalFileName: input.originalFileName,
      mimeType: input.mimeType,
      archiveSha256,
      uploadedByAdminId: input.uploadedByAdminId,
      uploadedAt,
      validationStatus: "PENDING",
      phase: "phase-one",
      executionMode: "metadata-only",
    },
  });

  return {
    storageKey,
    archiveSha256,
    quarantineArchivePath: archive.relativeArchivePath,
    quarantineMetadataPath,
    uploadedAt,
  };
}
