-- CreateEnum
CREATE TYPE "PluginStatus" AS ENUM (
  'DRAFT',
  'VALIDATED',
  'REJECTED',
  'INSTALLED',
  'CONFIG_REQUIRED',
  'DISABLED',
  'ENABLED',
  'ERROR',
  'REMOVED'
);

-- CreateEnum
CREATE TYPE "PluginCapabilityRisk" AS ENUM ('LOW', 'MEDIUM', 'HIGH');

-- CreateEnum
CREATE TYPE "PluginInstallEventType" AS ENUM (
  'UPLOADED',
  'VALIDATED',
  'VALIDATION_FAILED',
  'INSTALLED',
  'CONFIG_UPDATED',
  'DISABLED',
  'REMOVED',
  'ERROR_RECORDED'
);

-- CreateEnum
CREATE TYPE "PluginHealthState" AS ENUM ('UNKNOWN', 'READY', 'CONFIG_MISSING', 'DEGRADED', 'FAILED');

-- CreateTable
CREATE TABLE "PluginRegistry" (
  "id" TEXT NOT NULL,
  "pluginId" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "category" TEXT NOT NULL,
  "status" "PluginStatus" NOT NULL DEFAULT 'DRAFT',
  "installedVersionId" TEXT,
  "latestVersionId" TEXT,
  "requestedCapabilities" JSONB NOT NULL,
  "approvedCapabilities" JSONB NOT NULL,
  "manifestSnapshot" JSONB NOT NULL,
  "configSchemaSnapshot" JSONB,
  "pageSchemaSnapshot" JSONB,
  "isEnabledRequested" BOOLEAN NOT NULL DEFAULT false,
  "installedAt" TIMESTAMP(3),
  "removedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "PluginRegistry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PluginVersion" (
  "id" TEXT NOT NULL,
  "pluginRegistryId" TEXT NOT NULL,
  "version" TEXT NOT NULL,
  "sdkVersion" TEXT NOT NULL,
  "minAppVersion" TEXT NOT NULL,
  "maxAppVersion" TEXT NOT NULL,
  "artifactStorageKey" TEXT NOT NULL,
  "artifactSha256" TEXT NOT NULL,
  "manifestSha256" TEXT NOT NULL,
  "manifestJson" JSONB NOT NULL,
  "readmeMarkdown" TEXT,
  "changelogMarkdown" TEXT,
  "signatureKeyId" TEXT,
  "signatureAlgorithm" TEXT,
  "validationPassed" BOOLEAN NOT NULL DEFAULT false,
  "validationErrors" JSONB,
  "uploadedByAdminId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "PluginVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PluginSetting" (
  "id" TEXT NOT NULL,
  "pluginRegistryId" TEXT NOT NULL,
  "key" TEXT NOT NULL,
  "valueJson" JSONB,
  "valueType" TEXT NOT NULL,
  "isSecretRef" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "PluginSetting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PluginSecret" (
  "id" TEXT NOT NULL,
  "pluginRegistryId" TEXT NOT NULL,
  "secretKey" TEXT NOT NULL,
  "secretRef" TEXT NOT NULL,
  "lastValidatedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "PluginSecret_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PluginInstallEvent" (
  "id" TEXT NOT NULL,
  "pluginRegistryId" TEXT NOT NULL,
  "pluginVersionId" TEXT,
  "eventType" "PluginInstallEventType" NOT NULL,
  "actorAdminId" TEXT,
  "summary" TEXT NOT NULL,
  "detailsJson" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "PluginInstallEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PluginPermissionGrant" (
  "id" TEXT NOT NULL,
  "pluginRegistryId" TEXT NOT NULL,
  "capability" TEXT NOT NULL,
  "riskLevel" "PluginCapabilityRisk" NOT NULL,
  "approved" BOOLEAN NOT NULL DEFAULT false,
  "approvedByAdminId" TEXT,
  "approvedAt" TIMESTAMP(3),
  "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "PluginPermissionGrant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PluginRouteRegistration" (
  "id" TEXT NOT NULL,
  "pluginRegistryId" TEXT NOT NULL,
  "routeType" TEXT NOT NULL,
  "navLabel" TEXT,
  "iconKey" TEXT,
  "placement" TEXT,
  "pageTitle" TEXT,
  "schemaPath" TEXT,
  "schemaSnapshot" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "PluginRouteRegistration_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PluginJobRegistration" (
  "id" TEXT NOT NULL,
  "pluginRegistryId" TEXT NOT NULL,
  "jobKey" TEXT NOT NULL,
  "displayName" TEXT NOT NULL,
  "schedule" TEXT,
  "jobDefinitionJson" JSONB NOT NULL,
  "isActive" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "PluginJobRegistration_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PluginWebhookRegistration" (
  "id" TEXT NOT NULL,
  "pluginRegistryId" TEXT NOT NULL,
  "webhookKey" TEXT NOT NULL,
  "direction" TEXT NOT NULL,
  "pathOrUrl" TEXT NOT NULL,
  "signatureMode" TEXT,
  "webhookDefinitionJson" JSONB NOT NULL,
  "isActive" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "PluginWebhookRegistration_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PluginHealthStatus" (
  "id" TEXT NOT NULL,
  "pluginRegistryId" TEXT NOT NULL,
  "healthState" "PluginHealthState" NOT NULL DEFAULT 'UNKNOWN',
  "statusSummary" TEXT,
  "detailsJson" JSONB,
  "lastCheckedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "PluginHealthStatus_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PluginRegistry_pluginId_key" ON "PluginRegistry"("pluginId");
CREATE UNIQUE INDEX "PluginRegistry_slug_key" ON "PluginRegistry"("slug");
CREATE INDEX "PluginRegistry_status_idx" ON "PluginRegistry"("status");
CREATE INDEX "PluginRegistry_category_idx" ON "PluginRegistry"("category");

CREATE UNIQUE INDEX "PluginVersion_pluginRegistryId_version_key" ON "PluginVersion"("pluginRegistryId", "version");
CREATE INDEX "PluginVersion_pluginRegistryId_createdAt_idx" ON "PluginVersion"("pluginRegistryId", "createdAt");

CREATE UNIQUE INDEX "PluginSetting_pluginRegistryId_key_key" ON "PluginSetting"("pluginRegistryId", "key");
CREATE INDEX "PluginSetting_pluginRegistryId_idx" ON "PluginSetting"("pluginRegistryId");

CREATE UNIQUE INDEX "PluginSecret_pluginRegistryId_secretKey_key" ON "PluginSecret"("pluginRegistryId", "secretKey");

CREATE INDEX "PluginInstallEvent_pluginRegistryId_createdAt_idx" ON "PluginInstallEvent"("pluginRegistryId", "createdAt");
CREATE INDEX "PluginInstallEvent_eventType_idx" ON "PluginInstallEvent"("eventType");

CREATE UNIQUE INDEX "PluginPermissionGrant_pluginRegistryId_capability_key" ON "PluginPermissionGrant"("pluginRegistryId", "capability");

CREATE INDEX "PluginRouteRegistration_pluginRegistryId_idx" ON "PluginRouteRegistration"("pluginRegistryId");

CREATE UNIQUE INDEX "PluginJobRegistration_pluginRegistryId_jobKey_key" ON "PluginJobRegistration"("pluginRegistryId", "jobKey");

CREATE UNIQUE INDEX "PluginWebhookRegistration_pluginRegistryId_webhookKey_key" ON "PluginWebhookRegistration"("pluginRegistryId", "webhookKey");

CREATE INDEX "PluginHealthStatus_pluginRegistryId_healthState_idx" ON "PluginHealthStatus"("pluginRegistryId", "healthState");

-- AddForeignKey
ALTER TABLE "PluginVersion"
  ADD CONSTRAINT "PluginVersion_pluginRegistryId_fkey"
  FOREIGN KEY ("pluginRegistryId") REFERENCES "PluginRegistry"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "PluginRegistry"
  ADD CONSTRAINT "PluginRegistry_installedVersionId_fkey"
  FOREIGN KEY ("installedVersionId") REFERENCES "PluginVersion"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "PluginRegistry"
  ADD CONSTRAINT "PluginRegistry_latestVersionId_fkey"
  FOREIGN KEY ("latestVersionId") REFERENCES "PluginVersion"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "PluginSetting"
  ADD CONSTRAINT "PluginSetting_pluginRegistryId_fkey"
  FOREIGN KEY ("pluginRegistryId") REFERENCES "PluginRegistry"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "PluginSecret"
  ADD CONSTRAINT "PluginSecret_pluginRegistryId_fkey"
  FOREIGN KEY ("pluginRegistryId") REFERENCES "PluginRegistry"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "PluginInstallEvent"
  ADD CONSTRAINT "PluginInstallEvent_pluginRegistryId_fkey"
  FOREIGN KEY ("pluginRegistryId") REFERENCES "PluginRegistry"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "PluginInstallEvent"
  ADD CONSTRAINT "PluginInstallEvent_pluginVersionId_fkey"
  FOREIGN KEY ("pluginVersionId") REFERENCES "PluginVersion"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "PluginPermissionGrant"
  ADD CONSTRAINT "PluginPermissionGrant_pluginRegistryId_fkey"
  FOREIGN KEY ("pluginRegistryId") REFERENCES "PluginRegistry"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "PluginRouteRegistration"
  ADD CONSTRAINT "PluginRouteRegistration_pluginRegistryId_fkey"
  FOREIGN KEY ("pluginRegistryId") REFERENCES "PluginRegistry"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "PluginJobRegistration"
  ADD CONSTRAINT "PluginJobRegistration_pluginRegistryId_fkey"
  FOREIGN KEY ("pluginRegistryId") REFERENCES "PluginRegistry"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "PluginWebhookRegistration"
  ADD CONSTRAINT "PluginWebhookRegistration_pluginRegistryId_fkey"
  FOREIGN KEY ("pluginRegistryId") REFERENCES "PluginRegistry"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "PluginHealthStatus"
  ADD CONSTRAINT "PluginHealthStatus_pluginRegistryId_fkey"
  FOREIGN KEY ("pluginRegistryId") REFERENCES "PluginRegistry"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
