import { prisma } from "@/lib/prisma";
import { defaultPluginEventSummary, type PluginEventType } from "@/lib/plugins/events";

export async function recordPluginInstallEvent(input: {
  pluginRegistryId: string;
  pluginVersionId?: string | null;
  eventType: PluginEventType;
  actorAdminId?: string | null;
  summary?: string;
  detailsJson?: Record<string, unknown>;
}) {
  return (prisma as any).pluginInstallEvent.create({
    data: {
      pluginRegistryId: input.pluginRegistryId,
      pluginVersionId: input.pluginVersionId ?? null,
      eventType: input.eventType,
      actorAdminId: input.actorAdminId ?? null,
      summary: input.summary ?? defaultPluginEventSummary(input.eventType),
      detailsJson: input.detailsJson ?? null,
    },
  });
}

export async function listPluginInstallEvents(input: {
  pluginRegistryId: string;
  page: number;
  perPage: number;
}) {
  const skip = (input.page - 1) * input.perPage;

  const [total, events] = await Promise.all([
    (prisma as any).pluginInstallEvent.count({
      where: { pluginRegistryId: input.pluginRegistryId },
    }),
    (prisma as any).pluginInstallEvent.findMany({
      where: { pluginRegistryId: input.pluginRegistryId },
      orderBy: { createdAt: "desc" },
      skip,
      take: input.perPage,
    }),
  ]);

  return {
    total,
    page: input.page,
    perPage: input.perPage,
    totalPages: Math.max(1, Math.ceil(total / input.perPage)),
    events,
  };
}
