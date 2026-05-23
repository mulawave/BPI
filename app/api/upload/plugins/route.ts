import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authConfig } from "@/server/auth";
import { applyRateLimit, pluginUploadLimiter } from "@/lib/rateLimit";
import { validatePluginArchiveContents } from "@/lib/plugins/archive-validation";
import { validatePluginUploadPolicy } from "@/lib/plugins/upload-policy";
import { quarantinePluginUpload } from "@/lib/plugins/quarantine";
import { validatePluginArchiveSecurity } from "@/lib/plugins/security";
import { sha256Hex } from "@/lib/plugins/checksums";
import { verifyPluginSignatureContract } from "@/lib/plugins/signature";
import { prisma } from "@/lib/prisma";
import { recordPluginInstallEvent } from "@/server/services/plugins/pluginEvents.service";

const HOST_APP_VERSION = process.env.npm_package_version || "1.0.0";
const HOST_PLUGIN_SDK_VERSION = "1.0.0";

export async function POST(request: NextRequest) {
  const blocked = applyRateLimit(request, pluginUploadLimiter);
  if (blocked) return blocked;

  try {
    const session = await getServerSession(authConfig);

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const actor = session.user as { id?: string; role?: string; email?: string | null };
    if (actor.role !== "admin" && actor.role !== "super_admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No plugin archive provided" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const archiveContents = validatePluginArchiveContents({
      archiveBuffer: buffer,
      appVersion: HOST_APP_VERSION,
      hostPluginSdkVersion: HOST_PLUGIN_SDK_VERSION,
    });

    if (!archiveContents.ok) {
      return NextResponse.json(
        {
          error: "Plugin archive failed content validation",
          issues: archiveContents.issues,
        },
        { status: 400 },
      );
    }

    const policy = validatePluginUploadPolicy({
      file: {
        name: file.name,
        type: file.type,
        size: file.size,
      },
      buffer,
    });

    if (!policy.ok) {
      return NextResponse.json(
        {
          error: "Plugin archive failed upload policy checks",
          issues: policy.errors,
        },
        { status: 400 },
      );
    }

    const archiveSecurity = validatePluginArchiveSecurity({
      archiveBuffer: buffer,
      extractedEntries: archiveContents.entries,
    });
    if (!archiveSecurity.ok) {
      return NextResponse.json(
        {
          error: "Plugin archive failed security checks",
          issues: archiveSecurity.issues,
        },
        { status: 400 },
      );
    }

    const archiveSha256 = sha256Hex(buffer);
    const signatureCheck = verifyPluginSignatureContract({
      archiveSha256,
      manifestSha256: archiveContents.manifestSha256 || archiveSha256,
      keyId:
        (typeof formData.get("signatureKeyId") === "string" ? String(formData.get("signatureKeyId")) : undefined) ||
        archiveContents.manifest?.signature?.keyId ||
        (typeof archiveContents.signatureMetadata?.keyId === "string" ? archiveContents.signatureMetadata.keyId : undefined),
      algorithm:
        (typeof formData.get("signatureAlgorithm") === "string" ? String(formData.get("signatureAlgorithm")) : undefined) ||
        archiveContents.manifest?.signature?.algorithm ||
        (typeof archiveContents.signatureMetadata?.algorithm === "string" ? archiveContents.signatureMetadata.algorithm : undefined),
      signatureContent:
        (typeof formData.get("signature") === "string" ? String(formData.get("signature")) : undefined) ||
        (typeof archiveContents.signatureMetadata?.signature === "string" ? archiveContents.signatureMetadata.signature : undefined) ||
        (typeof archiveContents.signatureMetadata?.detachedSignature === "string" ? archiveContents.signatureMetadata.detachedSignature : undefined),
      publisherPublicKey:
        (typeof formData.get("publisherPublicKey") === "string" ? String(formData.get("publisherPublicKey")) : undefined) ||
        (typeof archiveContents.signatureMetadata?.publisherPublicKey === "string" ? archiveContents.signatureMetadata.publisherPublicKey : undefined),
    });

    if (!signatureCheck.valid) {
      return NextResponse.json(
        {
          error: "Plugin signature contract verification failed",
          issue: signatureCheck.reason,
        },
        { status: 400 },
      );
    }

    const result = await quarantinePluginUpload({
      archiveBuffer: buffer,
      originalFileName: file.name,
      mimeType: file.type || "application/octet-stream",
      uploadedByAdminId: actor.id ?? actor.email ?? "unknown",
    });

    const manifest = archiveContents.manifest;
    const settingsSchema = archiveContents.settingsSchema ?? null;
    const pageSchema = archiveContents.pageSchema ?? null;
    const validationReport = archiveContents.validationReport ?? null;

    if (!manifest) {
      return NextResponse.json({ error: "Manifest was not available after validation" }, { status: 400 });
    }

    const registry = await (prisma as any).pluginRegistry.upsert({
      where: { pluginId: manifest.pluginId },
      update: {
        slug: manifest.slug,
        name: manifest.name,
        description: manifest.description,
        category: manifest.category,
        status: "VALIDATED",
        requestedCapabilities: manifest.capabilities,
        manifestSnapshot: {
          ...manifest,
          checksums: {
            ...manifest.checksums,
            archiveSha256: result.archiveSha256,
            manifestSha256: archiveContents.manifestSha256 || manifest.checksums.manifestSha256,
          },
        },
        configSchemaSnapshot: settingsSchema,
        pageSchemaSnapshot: pageSchema,
        removedAt: null,
      },
      create: {
        pluginId: manifest.pluginId,
        slug: manifest.slug,
        name: manifest.name,
        description: manifest.description,
        category: manifest.category,
        status: "VALIDATED",
        requestedCapabilities: manifest.capabilities,
        approvedCapabilities: [],
        manifestSnapshot: {
          ...manifest,
          checksums: {
            ...manifest.checksums,
            archiveSha256: result.archiveSha256,
            manifestSha256: archiveContents.manifestSha256 || manifest.checksums.manifestSha256,
          },
        },
        configSchemaSnapshot: settingsSchema,
        pageSchemaSnapshot: pageSchema,
        isEnabledRequested: false,
      },
    });

    const version = await (prisma as any).pluginVersion.upsert({
      where: {
        pluginRegistryId_version: {
          pluginRegistryId: registry.id,
          version: manifest.version,
        },
      },
      update: {
        sdkVersion: manifest.compatibility.pluginSdkVersion,
        minAppVersion: manifest.compatibility.minAppVersion,
        maxAppVersion: manifest.compatibility.maxAppVersion,
        artifactStorageKey: result.storageKey,
        artifactSha256: result.archiveSha256,
        manifestSha256: archiveContents.manifestSha256 || manifest.checksums.manifestSha256,
        manifestJson: {
          ...manifest,
          checksums: {
            ...manifest.checksums,
            archiveSha256: result.archiveSha256,
            manifestSha256: archiveContents.manifestSha256 || manifest.checksums.manifestSha256,
          },
        },
        readmeMarkdown: archiveContents.readmeMarkdown || null,
        changelogMarkdown: archiveContents.changelogMarkdown || null,
        signatureKeyId: manifest.signature?.keyId || null,
        signatureAlgorithm: manifest.signature?.algorithm || null,
        validationPassed: true,
        validationErrors: validationReport,
        uploadedByAdminId: actor.id ?? actor.email ?? null,
      },
      create: {
        pluginRegistryId: registry.id,
        version: manifest.version,
        sdkVersion: manifest.compatibility.pluginSdkVersion,
        minAppVersion: manifest.compatibility.minAppVersion,
        maxAppVersion: manifest.compatibility.maxAppVersion,
        artifactStorageKey: result.storageKey,
        artifactSha256: result.archiveSha256,
        manifestSha256: archiveContents.manifestSha256 || manifest.checksums.manifestSha256,
        manifestJson: {
          ...manifest,
          checksums: {
            ...manifest.checksums,
            archiveSha256: result.archiveSha256,
            manifestSha256: archiveContents.manifestSha256 || manifest.checksums.manifestSha256,
          },
        },
        readmeMarkdown: archiveContents.readmeMarkdown || null,
        changelogMarkdown: archiveContents.changelogMarkdown || null,
        signatureKeyId: manifest.signature?.keyId || null,
        signatureAlgorithm: manifest.signature?.algorithm || null,
        validationPassed: true,
        validationErrors: validationReport,
        uploadedByAdminId: actor.id ?? actor.email ?? null,
      },
    });

    await (prisma as any).pluginRegistry.update({
      where: { id: registry.id },
      data: { latestVersionId: version.id },
    });

    await recordPluginInstallEvent({
      pluginRegistryId: registry.id,
      pluginVersionId: version.id,
      eventType: "UPLOADED",
      actorAdminId: actor.id ?? null,
      detailsJson: {
        storageKey: result.storageKey,
        archiveSha256: result.archiveSha256,
      },
    });

    await recordPluginInstallEvent({
      pluginRegistryId: registry.id,
      pluginVersionId: version.id,
      eventType: "VALIDATED",
      actorAdminId: actor.id ?? null,
      detailsJson: {
        issueCount: archiveContents.validationReport?.issueCount ?? null,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Plugin archive uploaded to quarantine. Validation is pending.",
      artifact: {
        storageKey: result.storageKey,
        archiveSha256: result.archiveSha256,
        uploadedAt: result.uploadedAt,
      },
      signature: {
        mode: signatureCheck.mode,
        digest: signatureCheck.digest,
        reason: signatureCheck.reason,
      },
      validation: {
        pluginId: manifest.pluginId,
        slug: manifest.slug,
        version: manifest.version,
        manifestSha256: archiveContents.manifestSha256,
        issueCount: archiveContents.validationReport?.issueCount,
        referencedFiles: archiveContents.entries.map((entry) => entry.path),
      },
      registry: {
        id: registry.id,
        slug: registry.slug,
        status: registry.status,
        latestVersionId: version.id,
      },
    });
  } catch (error) {
    console.error("Plugin upload error:", error);
    return NextResponse.json({ error: "Plugin upload failed" }, { status: 500 });
  }
}
