import { randomUUID } from "crypto";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { requireAdmin } from "../../utils/adminAuth";

const adminReferralProcedure = protectedProcedure.use(async ({ ctx, next }) => {
  requireAdmin(ctx);
  return next();
});

const sortOptions = ["registration", "package"] as const;

export const adminReferralsRouter = createTRPCRouter({
  getReferralNetwork: adminReferralProcedure
    .input(
      z.object({
        rootUserId: z.string().optional(),
        email: z.string().email().optional(),
        depth: z.number().min(1).max(10).default(5),
        packageIds: z.array(z.string()).optional(),
        registrationFrom: z.string().optional(),
        registrationTo: z.string().optional(),
        sortBy: z.enum(sortOptions).default("registration"),
        sortOrder: z.enum(["asc", "desc"]).default("desc"),
        limitPerLevel: z.number().min(10).max(500).default(200),
      })
    )
    .query(async ({ input }) => {
      const registrationFrom = parseDate(input.registrationFrom);
      const registrationTo = parseDate(input.registrationTo);
      const packageFilter = input.packageIds?.length ? input.packageIds : undefined;

      const packages = await prisma.membershipPackage.findMany({
        orderBy: { name: "asc" },
        select: { id: true, name: true, packageType: true, price: true, isActive: true },
      });
      const packageMap = new Map(packages.map((p) => [p.id, p]));

      const rootUser = await resolveRootUser({ rootUserId: input.rootUserId, email: input.email });
      if (!rootUser) {
        throw new Error("Root user not found. Provide a userId or email to start the tree.");
      }

      const levels = await buildReferralLevels({
        rootId: rootUser.id,
        depth: input.depth,
        packageFilter,
        registrationFrom,
        registrationTo,
        sortBy: input.sortBy,
        sortOrder: input.sortOrder,
        limitPerLevel: input.limitPerLevel,
        packageMap,
      });

      const shapedRoot = shapeUser(rootUser, packageMap, 0, 0);

      return {
        root: shapedRoot,
        levels,
        totals: {
          totalNodes: levels.reduce((acc, lvl) => acc + lvl.nodes.length, 1),
          levels: levels.length,
        },
        packages,
      };
    }),

  searchReferralUsers: adminReferralProcedure
    .input(
      z.object({
        query: z.string().min(1),
        limit: z.number().min(1).max(25).default(10),
      })
    )
    .query(async ({ input }) => {
      const term = input.query.trim();
      const users = await prisma.user.findMany({
        where: {
          OR: [
            { email: { contains: term, mode: "insensitive" } },
            { name: { contains: term, mode: "insensitive" } },
            { legacyId: { contains: term } },
          ],
        },
        take: input.limit,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          name: true,
          email: true,
          legacyId: true,
          activeMembershipPackageId: true,
          createdAt: true,
        },
      });
      return users;
    }),

  getMissingReferralUsers: adminReferralProcedure
    .input(
      z.object({
        page: z.number().min(1).default(1),
        pageSize: z.number().min(5).max(100).default(25),
        search: z.string().optional(),
        packageIds: z.array(z.string()).optional(),
        registrationFrom: z.string().optional(),
        registrationTo: z.string().optional(),
      })
    )
    .query(async ({ input }) => {
      const where: any = { sponsorId: null };
      const registrationFrom = parseDate(input.registrationFrom);
      const registrationTo = parseDate(input.registrationTo);
      if (registrationFrom || registrationTo) {
        where.createdAt = {
          ...(registrationFrom ? { gte: registrationFrom } : {}),
          ...(registrationTo ? { lte: registrationTo } : {}),
        };
      }
      if (input.search) {
        where.OR = [
          { email: { contains: input.search, mode: "insensitive" } },
          { name: { contains: input.search, mode: "insensitive" } },
          { legacyId: { contains: input.search } },
        ];
      }
      if (input.packageIds?.length) {
        where.activeMembershipPackageId = { in: input.packageIds };
      }

      const skip = (input.page - 1) * input.pageSize;
      const [users, total] = await prisma.$transaction([
        prisma.user.findMany({
          where,
          skip,
          take: input.pageSize,
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            name: true,
            email: true,
            legacyId: true,
            createdAt: true,
            activeMembershipPackageId: true,
            activated: true,
          },
        }),
        prisma.user.count({ where }),
      ]);

      const packages = await prisma.membershipPackage.findMany({
        orderBy: { name: "asc" },
        select: { id: true, name: true },
      });
      const packageMap = new Map(packages.map((p) => [p.id, p]));

      return {
        items: users.map((u) => shapeUser(u, packageMap, 0, 0)),
        total,
        pages: Math.ceil(total / input.pageSize),
        page: input.page,
      };
    }),

  reassignSponsor: adminReferralProcedure
    .input(
      z.object({
        userId: z.string(),
        newSponsorId: z.string(),
        reason: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      if (input.userId === input.newSponsorId) {
        throw new Error("A user cannot sponsor themselves.");
      }

      const [user, sponsor] = await Promise.all([
        prisma.user.findUnique({ where: { id: input.userId }, select: { id: true } }),
        prisma.user.findUnique({ where: { id: input.newSponsorId }, select: { id: true } }),
      ]);

      if (!user) throw new Error("Target user not found");
      if (!sponsor) throw new Error("Sponsor not found");

      const descendants = await collectDescendants(input.userId, 2000);
      if (descendants.has(input.newSponsorId)) {
        throw new Error("Cannot assign a sponsor from the user's downline.");
      }

      await prisma.$transaction([
        prisma.referral.deleteMany({ where: { referredId: input.userId } }),
        prisma.referral.create({
          data: {
            id: randomUUID(),
            referrerId: input.newSponsorId,
            referredId: input.userId,
            status: "completed",
            rewardPaid: false,
            updatedAt: new Date(),
          },
        }),
        prisma.user.update({ where: { id: input.userId }, data: { sponsorId: input.newSponsorId } }),
        prisma.auditLog.create({
          data: {
            id: randomUUID(),
            userId: input.userId,
            action: "REASSIGN_SPONSOR",
            entity: "Referral",
            entityId: input.userId,
            changes: JSON.stringify({ newSponsorId: input.newSponsorId, reason: input.reason || "" }),
            status: "success",
            createdAt: new Date(),
          },
        }),
      ]);

      return { ok: true };
    }),

  resolveMissingReferral: adminReferralProcedure
    .input(
      z.object({
        userId: z.string(),
        sponsorId: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      if (input.userId === input.sponsorId) {
        throw new Error("A user cannot be their own sponsor.");
      }

      const [user, sponsor] = await Promise.all([
        prisma.user.findUnique({ where: { id: input.userId } }),
        prisma.user.findUnique({ where: { id: input.sponsorId } }),
      ]);

      if (!user) throw new Error("User not found");
      if (!sponsor) throw new Error("Sponsor not found");

      const descendants = await collectDescendants(input.userId, 2000);
      if (descendants.has(input.sponsorId)) {
        throw new Error("Cannot assign sponsor from the user's downline.");
      }

      await prisma.$transaction([
        prisma.referral.deleteMany({ where: { referredId: input.userId } }),
        prisma.referral.create({
          data: {
            id: randomUUID(),
            referrerId: input.sponsorId,
            referredId: input.userId,
            status: "completed",
            rewardPaid: false,
            updatedAt: new Date(),
          },
        }),
        prisma.user.update({ where: { id: input.userId }, data: { sponsorId: input.sponsorId } }),
        prisma.auditLog.create({
          data: {
            id: randomUUID(),
            userId: input.userId,
            action: "RESOLVE_MISSING_REFERRAL",
            entity: "Referral",
            entityId: input.userId,
            changes: JSON.stringify({ sponsorId: input.sponsorId }),
            status: "success",
            createdAt: new Date(),
          },
        }),
      ]);

      return { ok: true };
    }),
});

async function resolveRootUser({ rootUserId, email }: { rootUserId?: string; email?: string }) {
  if (rootUserId) {
    const byId = await prisma.user.findUnique({ where: { id: rootUserId } });
    if (byId) return byId;
  }
  if (email) {
    const byEmail = await prisma.user.findUnique({ where: { email } });
    if (byEmail) return byEmail;
  }
  const fallback = await prisma.user.findFirst({ orderBy: { createdAt: "asc" } });
  return fallback;
}

async function buildReferralLevels(params: {
  rootId: string;
  depth: number;
  packageFilter?: string[];
  registrationFrom?: Date;
  registrationTo?: Date;
  sortBy: (typeof sortOptions)[number];
  sortOrder: "asc" | "desc";
  limitPerLevel: number;
  packageMap: Map<string, any>;
}) {
  const levels: Array<{ level: number; nodes: any[] }> = [];
  let frontier = [params.rootId];
  const visited = new Set<string>([params.rootId]);

  for (let level = 1; level <= params.depth; level++) {
    if (frontier.length === 0) break;

    const referralRows = await prisma.referral.findMany({
      where: { referrerId: { in: frontier } },
      select: { referrerId: true, referredId: true, createdAt: true },
    });

    const referredIds = Array.from(new Set(referralRows.map((r) => r.referredId))).filter(
      (id) => !visited.has(id)
    );

    if (referredIds.length === 0) {
      frontier = [];
      continue;
    }

    const where: any = { id: { in: referredIds } };
    if (params.packageFilter) {
      where.activeMembershipPackageId = { in: params.packageFilter };
    }
    if (params.registrationFrom || params.registrationTo) {
      where.createdAt = {
        ...(params.registrationFrom ? { gte: params.registrationFrom } : {}),
        ...(params.registrationTo ? { lte: params.registrationTo } : {}),
      };
    }

    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        legacyId: true,
        createdAt: true,
        sponsorId: true,
        activeMembershipPackageId: true,
        activated: true,
      },
    });

    const eligibleIds = new Set(users.map((u) => u.id));
    const filteredRows = referralRows.filter((r) => eligibleIds.has(r.referredId));

    const childCounts = await prisma.referral.groupBy({
      by: ["referrerId"],
      where: { referrerId: { in: users.map((u) => u.id) } },
      _count: { _all: true },
    });
    const childCountMap = new Map(childCounts.map((c) => [c.referrerId, c._count._all]));

    const nodes = users.map((u) => {
      const referralMeta = filteredRows.find((r) => r.referredId === u.id);
      const shaped = shapeUser(u, params.packageMap, level, childCountMap.get(u.id) || 0);
      return {
        ...shaped,
        referrerId: referralMeta?.referrerId ?? null,
        referredAt: referralMeta?.createdAt ?? u.createdAt,
      };
    });

    nodes.sort((a, b) => {
      if (params.sortBy === "registration") {
        return params.sortOrder === "asc"
          ? a.createdAt.getTime() - b.createdAt.getTime()
          : b.createdAt.getTime() - a.createdAt.getTime();
      }
      const aPackage = a.package?.name || "";
      const bPackage = b.package?.name || "";
      if (aPackage === bPackage) return 0;
      return params.sortOrder === "asc"
        ? aPackage.localeCompare(bPackage)
        : bPackage.localeCompare(aPackage);
    });

    levels.push({ level, nodes });

    const nextFrontier = nodes.slice(0, params.limitPerLevel).map((n) => n.id);
    nextFrontier.forEach((id) => visited.add(id));
    frontier = nextFrontier;
  }

  return levels;
}

function parseDate(value?: string | null) {
  if (!value) return undefined;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? undefined : d;
}

function shapeUser(user: any, packageMap: Map<string, any>, level: number, downlineCount: number) {
  const pkg = user.activeMembershipPackageId ? packageMap.get(user.activeMembershipPackageId) : null;
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    legacyId: user.legacyId,
    createdAt: user.createdAt,
    sponsorId: user.sponsorId,
    activated: user.activated,
    level,
    downlineCount,
    package: pkg
      ? {
          id: pkg.id,
          name: pkg.name,
          type: pkg.packageType,
          price: pkg.price,
          isActive: pkg.isActive,
        }
      : null,
  };
}

async function collectDescendants(rootId: string, guard: number) {
  const visited = new Set<string>();
  const queue = [rootId];
  while (queue.length && visited.size < guard) {
    const current = queue.shift();
    if (!current || visited.has(current)) continue;
    visited.add(current);
    const children = await prisma.referral.findMany({
      where: { referrerId: current },
      select: { referredId: true },
    });
    children.forEach((child) => {
      if (!visited.has(child.referredId)) queue.push(child.referredId);
    });
  }
  return visited;
}
