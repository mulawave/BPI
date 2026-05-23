import { buildPermissionGrantDrafts, normalizeRequestedCapabilities } from "../lib/plugins/permissions";
import { prisma } from "../lib/prisma";
import { buildSamplePluginBundle, SAMPLE_PLUGIN_ID, SAMPLE_PLUGIN_SLUG } from "./lib/samplePluginBundle";

async function main() {
  const bundle = buildSamplePluginBundle();
  const manifest = bundle.manifest;
  const pageSchema = bundle.pageSchema;
  const settingsSchema = bundle.settingsSchema;
  const validationReport = bundle.validationReport;

  if (!manifest || !pageSchema || !settingsSchema || !validationReport) {
    throw new Error("Sample plugin bundle is incomplete and cannot be seeded.");
  }

  const requestedCapabilities = normalizeRequestedCapabilities(manifest.capabilities);
  const approvedCapabilities = [...requestedCapabilities];
  const permissionGrants = buildPermissionGrantDrafts({
    requestedCapabilities,
    approvedCapabilities,
  });

  await (prisma as any).pluginRegistry.deleteMany({
    where: {
      OR: [{ pluginId: SAMPLE_PLUGIN_ID }, { slug: SAMPLE_PLUGIN_SLUG }],
    },
  });

  const pluginRegistry = await (prisma as any).pluginRegistry.create({
    data: {
      pluginId: manifest.pluginId,
      slug: manifest.slug,
      name: manifest.name,
      description: manifest.description,
      category: manifest.category,
      status: "INSTALLED",
      requestedCapabilities,
      approvedCapabilities,
      manifestSnapshot: {
        ...manifest,
        checksums: {
          ...manifest.checksums,
          manifestSha256: bundle.manifestSha256,
          archiveSha256: bundle.archiveSha256,
        },
      },
      configSchemaSnapshot: settingsSchema,
      pageSchemaSnapshot: pageSchema,
      isEnabledRequested: true,
      installedAt: new Date(),
      removedAt: null,
    },
  });

  const pluginVersion = await (prisma as any).pluginVersion.create({
    data: {
      pluginRegistryId: pluginRegistry.id,
      version: manifest.version,
      sdkVersion: manifest.compatibility.pluginSdkVersion,
      minAppVersion: manifest.compatibility.minAppVersion,
      maxAppVersion: manifest.compatibility.maxAppVersion,
      artifactStorageKey: bundle.artifactPath,
      artifactSha256: bundle.archiveSha256,
      manifestSha256: bundle.manifestSha256,
      manifestJson: {
        ...manifest,
        checksums: {
          ...manifest.checksums,
          manifestSha256: bundle.manifestSha256,
          archiveSha256: bundle.archiveSha256,
        },
      },
      readmeMarkdown: bundle.readmeMarkdown,
      changelogMarkdown: bundle.changelogMarkdown,
      signatureKeyId: manifest.signature?.keyId ?? null,
      signatureAlgorithm: manifest.signature?.algorithm ?? null,
      validationPassed: validationReport.valid,
      validationErrors: validationReport,
      uploadedByAdminId: "sample-plugin-seed",
    },
  });

  await (prisma as any).pluginRegistry.update({
    where: { id: pluginRegistry.id },
    data: {
      installedVersionId: pluginVersion.id,
      latestVersionId: pluginVersion.id,
    },
  });

  await (prisma as any).pluginPermissionGrant.createMany({
    data: permissionGrants.map((grant) => ({
      pluginRegistryId: pluginRegistry.id,
      capability: grant.capability,
      riskLevel: grant.riskLevel,
      approved: grant.approved,
      approvedByAdminId: "sample-plugin-seed",
      approvedAt: new Date(),
      notes: "Seeded for phase-one plugin UX testing.",
    })),
  });

  await (prisma as any).pluginSetting.createMany({
    data: [
      {
        pluginRegistryId: pluginRegistry.id,
        key: "workspaceId",
        valueJson: "workspace-primary",
        valueType: "string",
        isSecretRef: false,
      },
      {
        pluginRegistryId: pluginRegistry.id,
        key: "syncWindowDays",
        valueJson: 14,
        valueType: "number",
        isSecretRef: false,
      },
      {
        pluginRegistryId: pluginRegistry.id,
        key: "enableLeadScoring",
        valueJson: true,
        valueType: "boolean",
        isSecretRef: false,
      },
      {
        pluginRegistryId: pluginRegistry.id,
        key: "apiBaseUrl",
        valueJson: "https://api.crm-insights.example.com",
        valueType: "string",
        isSecretRef: false,
      }
    ]
  });

  await (prisma as any).pluginRouteRegistration.create({
    data: {
      pluginRegistryId: pluginRegistry.id,
      routeType: "admin-page",
      navLabel: manifest.ui?.adminNav?.label ?? manifest.name,
      iconKey: manifest.ui?.adminNav?.icon ?? "bar-chart",
      placement: manifest.ui?.adminNav?.placement ?? "plugins",
      pageTitle: manifest.ui?.adminPage?.title ?? manifest.name,
      schemaPath: manifest.ui?.adminPage?.schemaPath ?? null,
      schemaSnapshot: pageSchema,
    },
  });

  await (prisma as any).pluginJobRegistration.create({
    data: {
      pluginRegistryId: pluginRegistry.id,
      jobKey: "nightly-crm-refresh",
      displayName: "Nightly CRM refresh",
      schedule: "0 2 * * *",
      jobDefinitionJson: {
        mode: "phase-one-metadata-only",
        owner: "host",
        expectedDurationSeconds: 180,
      },
      isActive: true,
    },
  });

  await (prisma as any).pluginWebhookRegistration.create({
    data: {
      pluginRegistryId: pluginRegistry.id,
      webhookKey: "crm-insights-events",
      direction: "inbound",
      pathOrUrl: "/api/plugins/crm-insights/webhooks/events",
      signatureMode: "hmac-sha256",
      webhookDefinitionJson: {
        mode: "phase-one-metadata-only",
        retries: 3,
      },
      isActive: true,
    },
  });

  await (prisma as any).pluginHealthStatus.create({
    data: {
      pluginRegistryId: pluginRegistry.id,
      healthState: "READY",
      statusSummary: "Sample plugin is installed and passing readiness checks.",
      detailsJson: {
        sampleMode: true,
        syncedWorkspaceCount: 1,
        lastSyncWindowDays: 14,
      },
      lastCheckedAt: new Date(),
    },
  });

  await (prisma as any).pluginInstallEvent.createMany({
    data: [
      {
        pluginRegistryId: pluginRegistry.id,
        pluginVersionId: pluginVersion.id,
        eventType: "UPLOADED",
        actorAdminId: "sample-plugin-seed",
        summary: "Sample plugin artifact built and staged locally.",
        detailsJson: {
          artifactStorageKey: bundle.artifactPath,
        },
      },
      {
        pluginRegistryId: pluginRegistry.id,
        pluginVersionId: pluginVersion.id,
        eventType: "VALIDATED",
        actorAdminId: "sample-plugin-seed",
        summary: "Manifest, schema references, and archive structure validated.",
        detailsJson: {
          issueCount: validationReport.issueCount,
        },
      },
      {
        pluginRegistryId: pluginRegistry.id,
        pluginVersionId: pluginVersion.id,
        eventType: "CONFIG_UPDATED",
        actorAdminId: "sample-plugin-seed",
        summary: "Seeded sample settings and secret references.",
        detailsJson: {
          settingsKeys: ["workspaceId", "syncWindowDays", "enableLeadScoring", "apiBaseUrl", "apiTokenRef", "webhookSecretRef"],
        },
      },
      {
        pluginRegistryId: pluginRegistry.id,
        pluginVersionId: pluginVersion.id,
        eventType: "INSTALLED",
        actorAdminId: "sample-plugin-seed",
        summary: "Installed sample plugin version for local admin UX testing.",
        detailsJson: {
          approvedCapabilities,
        },
      }
    ]
  });

  console.log(`Seeded sample plugin: ${pluginRegistry.slug}`);
  console.log(`Artifact: ${bundle.artifactPath}`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
    process.exit(0);
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });