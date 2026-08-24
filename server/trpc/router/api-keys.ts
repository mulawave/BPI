import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, adminProcedure } from "../trpc";
import { prisma } from "@/lib/prisma";
import { generateApiKey } from "@/server/services/api-key.service";

export const apiKeysRouter = createTRPCRouter({
  /** Create a new API key. The raw key is returned ONCE and never stored. */
  create: adminProcedure
    .input(z.object({
      name: z.string().trim().min(2).max(100),
      rateLimit: z.number().int().min(1).max(10000).default(60),
    }))
    .mutation(async ({ ctx, input }) => {
      const adminId = (ctx.session!.user as any).id as string;
      const { rawKey, keyHash, keyPrefix } = generateApiKey();

      const apiKey = await prisma.apiKey.create({
        data: {
          name: input.name,
          keyHash,
          keyPrefix,
          rateLimit: input.rateLimit,
          createdBy: adminId,
        },
      });

      return {
        id: apiKey.id,
        name: apiKey.name,
        rawKey, // shown once
        keyPrefix: apiKey.keyPrefix,
        rateLimit: apiKey.rateLimit,
      };
    }),

  /** List all API keys with usage counts. */
  list: adminProcedure.query(async () => {
    const keys = await prisma.apiKey.findMany({
      orderBy: { createdAt: "desc" },
      include: { _count: { select: { requests: true } } },
    });

    const creatorIds = [...new Set(keys.map((k) => k.createdBy))];
    const creators = creatorIds.length > 0
      ? await prisma.user.findMany({
          where: { id: { in: creatorIds } },
          select: { id: true, name: true, email: true },
        })
      : [];
    const creatorMap = new Map(creators.map((c) => [c.id, c]));

    return keys.map((k) => ({
      id: k.id,
      name: k.name,
      keyPrefix: k.keyPrefix,
      isActive: k.isActive,
      rateLimit: k.rateLimit,
      createdAt: k.createdAt,
      lastUsedAt: k.lastUsedAt,
      revokedAt: k.revokedAt,
      totalRequests: k._count.requests,
      createdByName: creatorMap.get(k.createdBy)?.name ?? "Unknown",
      createdByEmail: creatorMap.get(k.createdBy)?.email ?? null,
    }));
  }),

  /** Revoke an API key (immediate). */
  revoke: adminProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      const key = await prisma.apiKey.findUnique({ where: { id: input.id } });
      if (!key) throw new TRPCError({ code: "NOT_FOUND", message: "API key not found." });
      await prisma.apiKey.update({
        where: { id: input.id },
        data: { isActive: false, revokedAt: new Date() },
      });
      return { success: true };
    }),

  /** Reactivate a previously revoked API key. */
  reactivate: adminProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      const key = await prisma.apiKey.findUnique({ where: { id: input.id } });
      if (!key) throw new TRPCError({ code: "NOT_FOUND", message: "API key not found." });
      await prisma.apiKey.update({
        where: { id: input.id },
        data: { isActive: true, revokedAt: null },
      });
      return { success: true };
    }),

  /** Update a key's rate limit or name. */
  update: adminProcedure
    .input(z.object({
      id: z.string(),
      name: z.string().trim().min(2).max(100).optional(),
      rateLimit: z.number().int().min(1).max(10000).optional(),
    }))
    .mutation(async ({ input }) => {
      const key = await prisma.apiKey.findUnique({ where: { id: input.id } });
      if (!key) throw new TRPCError({ code: "NOT_FOUND", message: "API key not found." });
      await prisma.apiKey.update({
        where: { id: input.id },
        data: {
          ...(input.name !== undefined ? { name: input.name } : {}),
          ...(input.rateLimit !== undefined ? { rateLimit: input.rateLimit } : {}),
        },
      });
      return { success: true };
    }),

  /** Paginated request logs, optionally filtered by key. */
  getRequestLogs: adminProcedure
    .input(z.object({
      apiKeyId: z.string().optional(),
      page: z.number().int().min(1).default(1),
      pageSize: z.number().int().min(1).max(100).default(20),
    }))
    .query(async ({ input }) => {
      const where = input.apiKeyId ? { apiKeyId: input.apiKeyId } : {};
      const [logs, total] = await Promise.all([
        prisma.apiRequestLog.findMany({
          where,
          orderBy: { createdAt: "desc" },
          skip: (input.page - 1) * input.pageSize,
          take: input.pageSize,
          include: { ApiKey: { select: { name: true, keyPrefix: true } } },
        }),
        prisma.apiRequestLog.count({ where }),
      ]);

      const matchedUserIds = [...new Set(logs.map((l) => l.matchedUserId).filter((id): id is string => id != null))];
      const matchedUsers = matchedUserIds.length > 0
        ? await prisma.user.findMany({
            where: { id: { in: matchedUserIds } },
            select: { id: true, name: true, email: true },
          })
        : [];
      const userMap = new Map(matchedUsers.map((u) => [u.id, u]));

      return {
        logs: logs.map((l) => ({
          id: l.id,
          keyName: l.ApiKey?.name ?? "Unknown",
          keyPrefix: l.ApiKey?.keyPrefix ?? "—",
          endpoint: l.endpoint,
          sscQueried: l.sscQueried,
          matchedUserName: l.matchedUserId ? (userMap.get(l.matchedUserId)?.name ?? "Unknown") : null,
          matchedUserEmail: l.matchedUserId ? (userMap.get(l.matchedUserId)?.email ?? null) : null,
          status: l.status,
          ipAddress: l.ipAddress,
          createdAt: l.createdAt,
        })),
        total,
        totalPages: Math.max(1, Math.ceil(total / input.pageSize)),
        page: input.page,
      };
    }),
});
