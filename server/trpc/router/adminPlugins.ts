import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { buildPermissionGrantDrafts, normalizeRequestedCapabilities } from "@/lib/plugins/permissions";
import { isKnownPluginCapability } from "@/lib/plugins/capabilities";
import { recordPluginInstallEvent, listPluginInstallEvents } from "@/server/services/plugins/pluginEvents.service";
import { assertPluginLifecycleAccess } from "@/lib/adminAuth";
import { derivePluginStatusFromReadiness, evaluatePluginReadiness } from "@/lib/plugins/readiness";

const adminProcedure = protectedProcedure.use(async ({ ctx, next }) => {
  const role = (ctx.session?.user as any)?.role;
  if (role !== "admin" && role !== "super_admin") {
    throw new Error("FORBIDDEN: Admin access required");
  }
  return next();
});

const statusEnum = z.enum([
  "DRAFT",
  "VALIDATED",
  "REJECTED",
  "INSTALLED",
  "CONFIG_REQUIRED",
  "DISABLED",
  "ENABLED",
  "ERROR",
  "REMOVED",
]);

async function resolvePluginRegistry(prismaLike: any, input: {
  pluginRegistryId?: string | null;
  pluginSlug?: string | null;
  pluginId?: string | null;
  pluginVersionId?: string | null;
}) {
  if (input.pluginRegistryId) {
    const registry = await prismaLike.pluginRegistry.findUnique({
      where: { id: input.pluginRegistryId },
    });

    if (registry) {
      return registry;
    }
  }

  if (input.pluginVersionId) {
    const version = await prismaLike.pluginVersion.findUnique({
      where: { id: input.pluginVersionId },
      select: { pluginRegistryId: true },
    });

    if (version?.pluginRegistryId) {
      const registry = await prismaLike.pluginRegistry.findUnique({
        where: { id: version.pluginRegistryId },
      });

      if (registry) {
        return registry;
      }
    }
  }

  const lookupClauses = [
    ...(input.pluginSlug ? [{ slug: input.pluginSlug }] : []),
    ...(input.pluginId ? [{ pluginId: input.pluginId }] : []),
  ];

  if (!lookupClauses.length) {
    return null;
  }

  return prismaLike.pluginRegistry.findFirst({
    where: {
      OR: lookupClauses,
    },
  });
}

async function reconcilePluginOperationalState(prismaLike: any, pluginRegistryId: string) {
  const plugin = await prismaLike.pluginRegistry.findUnique({
    where: { id: pluginRegistryId },
    include: {
      settings: true,
      secrets: true,
    },
  });

  if (!plugin) return;

  const readiness = evaluatePluginReadiness({
    status: plugin.status,
    installedVersionId: plugin.installedVersionId,
    requestedCapabilities: plugin.requestedCapabilities,
    approvedCapabilities: plugin.approvedCapabilities,
    manifestSnapshot: plugin.manifestSnapshot,
    settings: plugin.settings ?? [],
    secrets: plugin.secrets ?? [],
  });

  const nextStatus = derivePluginStatusFromReadiness({
    currentStatus: plugin.status,
    installedVersionId: plugin.installedVersionId,
    readiness,
  });

  if (nextStatus !== plugin.status) {
    await prismaLike.pluginRegistry.update({
      where: { id: pluginRegistryId },
      data: { status: nextStatus },
    });
  }

  const missingInstall = !readiness.checks.hasInstalledVersion;
  const hasTerminalFailure = ["ERROR", "REJECTED"].includes(nextStatus);
  const healthState = hasTerminalFailure
    ? "FAILED"
    : readiness.ready
      ? "READY"
      : missingInstall || readiness.state === "CONFIG_REQUIRED"
        ? "CONFIG_MISSING"
        : "DEGRADED";

  const summary = nextStatus === "DISABLED"
    ? "Plugin is disabled by an administrator."
    : readiness.ready
      ? "Plugin is installed and readiness checks are passing."
      : readiness.reasons[0] ?? "Plugin requires additional setup before ready state.";

  await prismaLike.pluginHealthStatus.create({
    data: {
      pluginRegistryId,
      healthState,
      statusSummary: summary,
      detailsJson: {
        readiness,
      },
      lastCheckedAt: new Date(),
    },
  });

  return {
    readiness,
    status: nextStatus,
  };
}

export const adminPluginsRouter = createTRPCRouter({
  getPluginOperationalReadiness: adminProcedure
    .input(
      z.object({
        pluginRegistryId: z.string().optional(),
        pluginSlug: z.string().optional(),
        pluginId: z.string().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      assertPluginLifecycleAccess({ user: (ctx.session?.user as any) ?? null, action: "inspect" });

      const registry = await resolvePluginRegistry(ctx.prisma as any, {
        pluginRegistryId: input.pluginRegistryId,
        pluginSlug: input.pluginSlug,
        pluginId: input.pluginId,
      });

      if (!registry) {
        throw new Error("Plugin not found");
      }

      const operationalState = await reconcilePluginOperationalState(ctx.prisma as any, registry.id);

      const [health, events] = await Promise.all([
        (ctx.prisma as any).pluginHealthStatus.findFirst({
          where: { pluginRegistryId: registry.id },
          orderBy: { updatedAt: "desc" },
        }),
        listPluginInstallEvents({
          pluginRegistryId: registry.id,
          page: 1,
          perPage: 50,
        }),
      ]);

      return {
        readiness: operationalState?.readiness ?? ((health?.detailsJson as any)?.readiness ?? null),
        health,
        events: events.events ?? [],
      };
    }),

  listPlugins: adminProcedure
    .input(
      z
        .object({
          page: z.number().min(1).default(1),
          perPage: z.number().min(1).max(100).default(20),
          status: statusEnum.optional(),
          category: z.string().optional(),
          search: z.string().optional(),
        })
        .optional(),
    )
    .query(async ({ ctx, input }) => {
      assertPluginLifecycleAccess({ user: (ctx.session?.user as any) ?? null, action: "inspect" });

      const page = input?.page ?? 1;
      const perPage = input?.perPage ?? 20;
      const pluginRegistry = (ctx.prisma as any)?.pluginRegistry;

      // If plugin lifecycle tables are not available yet (e.g., migration not applied),
      // keep admin page stable by returning an empty inventory instead of crashing.
      if (!pluginRegistry || typeof pluginRegistry.count !== "function" || typeof pluginRegistry.findMany !== "function") {
        return {
          total: 0,
          page,
          perPage,
          totalPages: 1,
          plugins: [],
        };
      }

      const where: Record<string, unknown> = {
        ...(input?.status ? { status: input.status } : { status: { not: "REMOVED" } }),
        ...(input?.category ? { category: input.category } : {}),
        ...(input?.search
          ? {
              OR: [
                { name: { contains: input.search, mode: "insensitive" } },
                { pluginId: { contains: input.search, mode: "insensitive" } },
                { slug: { contains: input.search, mode: "insensitive" } },
              ],
            }
          : {}),
      };

      const [total, plugins] = await Promise.all([
        pluginRegistry.count({ where }),
        pluginRegistry.findMany({
          where,
          orderBy: { updatedAt: "desc" },
          skip: (page - 1) * perPage,
          take: perPage,
          include: {
            installedVersion: {
              select: { id: true, version: true, createdAt: true },
            },
            latestVersion: {
              select: { id: true, version: true, createdAt: true },
            },
          },
        }),
      ]);

      return {
        total,
        page,
        perPage,
        totalPages: Math.max(1, Math.ceil(total / perPage)),
        plugins,
      };
    }),

  getPluginById: adminProcedure
    .input(
      z.object({
        id: z.string().optional(),
        slug: z.string().optional(),
        pluginId: z.string().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      assertPluginLifecycleAccess({ user: (ctx.session?.user as any) ?? null, action: "inspect" });

      if (!input.id && !input.slug && !input.pluginId) {
        throw new Error("At least one identifier is required");
      }

      const plugin = await (ctx.prisma as any).pluginRegistry.findFirst({
        where: {
          OR: [
            ...(input.id ? [{ id: input.id }] : []),
            ...(input.slug ? [{ slug: input.slug }] : []),
            ...(input.pluginId ? [{ pluginId: input.pluginId }] : []),
          ],
        },
        include: {
          installedVersion: true,
          latestVersion: true,
          versions: { orderBy: { createdAt: "desc" } },
          permissionGrants: { orderBy: { capability: "asc" } },
          settings: { orderBy: { key: "asc" } },
          secrets: { orderBy: { secretKey: "asc" } },
          healthStatuses: { orderBy: { updatedAt: "desc" }, take: 5 },
        },
      });

      if (!plugin) {
        throw new Error("Plugin not found");
      }

      if (plugin.status === "REMOVED") {
        throw new Error("Plugin not found");
      }

      const events = await listPluginInstallEvents({
        pluginRegistryId: plugin.id,
        page: 1,
        perPage: 50,
      });

      return {
        ...plugin,
        settings: (plugin.settings ?? []).map((item: any) => ({
          ...item,
          valueJson: item.isSecretRef ? "[MASKED_SECRET_REF]" : item.valueJson,
        })),
        secrets: (plugin.secrets ?? []).map((item: any) => ({
          ...item,
          secretRef: "[MASKED_SECRET_REF]",
        })),
        eventTimeline: events,
      };
    }),

  installPluginVersion: adminProcedure
    .input(
      z.object({
        pluginRegistryId: z.string().optional(),
        pluginSlug: z.string().optional(),
        pluginId: z.string().optional(),
        pluginVersionId: z.string(),
        approvedCapabilities: z.array(z.string()).default([]),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      assertPluginLifecycleAccess({ user: (ctx.session?.user as any) ?? null, action: "install" });

      const registry = await resolvePluginRegistry(ctx.prisma as any, {
        pluginRegistryId: input.pluginRegistryId,
        pluginSlug: input.pluginSlug,
        pluginId: input.pluginId,
        pluginVersionId: input.pluginVersionId,
      });

      if (!registry) throw new Error("Plugin registry not found");

      const version = await (ctx.prisma as any).pluginVersion.findUnique({
        where: { id: input.pluginVersionId },
      });

      if (!version || version.pluginRegistryId !== registry.id) {
        throw new Error("Plugin version does not belong to the specified plugin registry");
      }

      const requested = normalizeRequestedCapabilities(
        Array.isArray(registry.requestedCapabilities) ? registry.requestedCapabilities : [],
      );
      const approved = input.approvedCapabilities.filter((capability) => isKnownPluginCapability(capability));
      const grants = buildPermissionGrantDrafts({
        requestedCapabilities: requested,
        approvedCapabilities: approved,
      });

      await (ctx.prisma as any).$transaction(async (tx: any) => {
        await tx.pluginRegistry.update({
          where: { id: registry.id },
          data: {
            installedVersionId: version.id,
            approvedCapabilities: approved,
            status: "INSTALLED",
            installedAt: new Date(),
            removedAt: null,
          },
        });

        for (const grant of grants) {
          await tx.pluginPermissionGrant.upsert({
            where: {
              pluginRegistryId_capability: {
                pluginRegistryId: registry.id,
                capability: grant.capability,
              },
            },
            create: {
              pluginRegistryId: registry.id,
              capability: grant.capability,
              riskLevel: grant.riskLevel,
              approved: grant.approved,
              approvedByAdminId: (ctx.session?.user as any)?.id ?? null,
              approvedAt: grant.approved ? new Date() : null,
            },
            update: {
              riskLevel: grant.riskLevel,
              approved: grant.approved,
              approvedByAdminId: (ctx.session?.user as any)?.id ?? null,
              approvedAt: grant.approved ? new Date() : null,
            },
          });
        }
      });

      await recordPluginInstallEvent({
        pluginRegistryId: registry.id,
        pluginVersionId: version.id,
        eventType: "INSTALLED",
        actorAdminId: (ctx.session?.user as any)?.id ?? null,
        detailsJson: {
          approvedCapabilities: approved,
        },
      });

      const operationalState = await reconcilePluginOperationalState(ctx.prisma as any, registry.id);

      return {
        success: true,
        pluginRegistryId: registry.id,
        installedVersionId: version.id,
        status: operationalState?.status ?? "INSTALLED",
      };
    }),

  rejectPluginVersion: adminProcedure
    .input(
      z.object({
        pluginRegistryId: z.string().optional(),
        pluginSlug: z.string().optional(),
        pluginId: z.string().optional(),
        pluginVersionId: z.string(),
        reason: z.string().min(1).max(1000),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      assertPluginLifecycleAccess({ user: (ctx.session?.user as any) ?? null, action: "configure" });

      const registry = await resolvePluginRegistry(ctx.prisma as any, {
        pluginRegistryId: input.pluginRegistryId,
        pluginSlug: input.pluginSlug,
        pluginId: input.pluginId,
        pluginVersionId: input.pluginVersionId,
      });
      if (!registry) throw new Error("Plugin registry not found");

      await (ctx.prisma as any).$transaction(async (tx: any) => {
        await tx.pluginVersion.update({
          where: { id: input.pluginVersionId },
          data: {
            validationPassed: false,
            validationErrors: {
              code: "MANUAL_REJECTION",
              message: input.reason,
              rejectedAt: new Date().toISOString(),
            },
          },
        });

        await tx.pluginRegistry.update({
          where: { id: registry.id },
          data: {
            status: "REJECTED",
            latestVersionId: input.pluginVersionId,
          },
        });
      });

      await recordPluginInstallEvent({
        pluginRegistryId: registry.id,
        pluginVersionId: input.pluginVersionId,
        eventType: "VALIDATION_FAILED",
        actorAdminId: (ctx.session?.user as any)?.id ?? null,
        detailsJson: { reason: input.reason },
      });

      return { success: true, pluginRegistryId: registry.id, status: "REJECTED" };
    }),

  updatePluginSettings: adminProcedure
    .input(
      z.object({
        pluginRegistryId: z.string(),
        values: z.record(z.string(), z.any()),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      assertPluginLifecycleAccess({ user: (ctx.session?.user as any) ?? null, action: "configure" });

      const registry = await (ctx.prisma as any).pluginRegistry.findUnique({ where: { id: input.pluginRegistryId } });
      if (!registry) throw new Error("Plugin registry not found");

      const entries = Object.entries(input.values);

      await (ctx.prisma as any).$transaction(async (tx: any) => {
        for (const [key, value] of entries) {
          const isSecretRef = typeof value === "string" && value.startsWith("secret://");

          await tx.pluginSetting.upsert({
            where: {
              pluginRegistryId_key: {
                pluginRegistryId: input.pluginRegistryId,
                key,
              },
            },
            create: {
              pluginRegistryId: input.pluginRegistryId,
              key,
              valueJson: value,
              valueType: Array.isArray(value) ? "array" : value === null ? "null" : typeof value,
              isSecretRef,
            },
            update: {
              valueJson: value,
              valueType: Array.isArray(value) ? "array" : value === null ? "null" : typeof value,
              isSecretRef,
            },
          });

          if (isSecretRef) {
            const secretKey = String(value).replace("secret://", "").trim();
            if (secretKey) {
              await tx.pluginSecret.upsert({
                where: {
                  pluginRegistryId_secretKey: {
                    pluginRegistryId: input.pluginRegistryId,
                    secretKey,
                  },
                },
                create: {
                  pluginRegistryId: input.pluginRegistryId,
                  secretKey,
                  secretRef: String(value),
                  lastValidatedAt: new Date(),
                },
                update: {
                  secretRef: String(value),
                  lastValidatedAt: new Date(),
                },
              });
            }
          }
        }
      });

      await recordPluginInstallEvent({
        pluginRegistryId: registry.id,
        eventType: "CONFIG_UPDATED",
        actorAdminId: (ctx.session?.user as any)?.id ?? null,
        detailsJson: {
          updatedKeys: entries.map(([key]) => key),
          secretAliases: entries
            .map(([, value]) => (typeof value === "string" && value.startsWith("secret://") ? value.replace("secret://", "") : null))
            .filter(Boolean),
        },
      });

      const operationalState = await reconcilePluginOperationalState(ctx.prisma as any, registry.id);

      return {
        success: true,
        pluginRegistryId: registry.id,
        updatedKeys: entries.map(([key]) => key),
        status: operationalState?.status ?? registry.status,
      };
    }),

  disablePlugin: adminProcedure
    .input(
      z.object({
        pluginRegistryId: z.string().optional(),
        pluginSlug: z.string().optional(),
        pluginId: z.string().optional(),
        pluginVersionId: z.string().optional(),
        reason: z.string().max(1000).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      assertPluginLifecycleAccess({ user: (ctx.session?.user as any) ?? null, action: "disable" });

      const registry = await resolvePluginRegistry(ctx.prisma as any, {
        pluginRegistryId: input.pluginRegistryId,
        pluginSlug: input.pluginSlug,
        pluginId: input.pluginId,
        pluginVersionId: input.pluginVersionId,
      });
      if (!registry) throw new Error("Plugin registry not found");

      await (ctx.prisma as any).pluginRegistry.update({
        where: { id: registry.id },
        data: {
          status: "DISABLED",
          isEnabledRequested: false,
        },
      });

      await recordPluginInstallEvent({
        pluginRegistryId: registry.id,
        pluginVersionId: registry.installedVersionId ?? null,
        eventType: "DISABLED",
        actorAdminId: (ctx.session?.user as any)?.id ?? null,
        detailsJson: { reason: input.reason ?? null },
      });

      const operationalState = await reconcilePluginOperationalState(ctx.prisma as any, registry.id);

      return { success: true, pluginRegistryId: registry.id, status: operationalState?.status ?? "DISABLED" };
    }),

  uninstallPlugin: adminProcedure
    .input(
      z.object({
        pluginRegistryId: z.string().optional(),
        pluginSlug: z.string().optional(),
        pluginId: z.string().optional(),
        pluginVersionId: z.string().optional(),
        reason: z.string().max(1000).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      assertPluginLifecycleAccess({ user: (ctx.session?.user as any) ?? null, action: "uninstall" });

      const registry = await resolvePluginRegistry(ctx.prisma as any, {
        pluginRegistryId: input.pluginRegistryId,
        pluginSlug: input.pluginSlug,
        pluginId: input.pluginId,
        pluginVersionId: input.pluginVersionId,
      });
      if (!registry) throw new Error("Plugin registry not found");

      if (!registry.installedVersionId) {
        return { success: true, pluginRegistryId: registry.id, status: registry.status, uninstalled: false };
      }

      await (ctx.prisma as any).pluginRegistry.update({
        where: { id: registry.id },
        data: {
          installedVersionId: null,
          installedAt: null,
          isEnabledRequested: false,
          status: "VALIDATED",
        },
      });

      await recordPluginInstallEvent({
        pluginRegistryId: registry.id,
        pluginVersionId: registry.installedVersionId,
        eventType: "DISABLED",
        actorAdminId: (ctx.session?.user as any)?.id ?? null,
        summary: "Plugin uninstalled",
        detailsJson: { reason: input.reason ?? null, uninstalled: true },
      });

      const operationalState = await reconcilePluginOperationalState(ctx.prisma as any, registry.id);

      return {
        success: true,
        pluginRegistryId: registry.id,
        status: operationalState?.status ?? "VALIDATED",
        uninstalled: true,
      };
    }),

  removePlugin: adminProcedure
    .input(
      z.object({
        pluginRegistryId: z.string().optional(),
        pluginSlug: z.string().optional(),
        pluginId: z.string().optional(),
        pluginVersionId: z.string().optional(),
        reason: z.string().max(1000).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      assertPluginLifecycleAccess({ user: (ctx.session?.user as any) ?? null, action: "remove" });

      const registry = await resolvePluginRegistry(ctx.prisma as any, {
        pluginRegistryId: input.pluginRegistryId,
        pluginSlug: input.pluginSlug,
        pluginId: input.pluginId,
        pluginVersionId: input.pluginVersionId,
      });
      if (!registry) throw new Error("Plugin registry not found");

      // "Delete" in dashboard semantics means full removal from plugin registry.
      await (ctx.prisma as any).pluginRegistry.delete({
        where: { id: registry.id },
      });

      return { success: true, pluginRegistryId: registry.id, status: "DELETED" };
    }),

  listPluginInstallEvents: adminProcedure
    .input(
      z.object({
        pluginRegistryId: z.string(),
        page: z.number().min(1).default(1),
        perPage: z.number().min(1).max(100).default(25),
      }),
    )
    .query(async ({ input }) => {
      // Explicit inspect guard is enforced by middleware; timeline remains inspect-scoped.
      return listPluginInstallEvents({
        pluginRegistryId: input.pluginRegistryId,
        page: input.page,
        perPage: input.perPage,
      });
    }),
});
