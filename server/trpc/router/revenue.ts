import { z } from "zod";
import { TRPCError } from "@trpc/server";
import {
  createTRPCRouter,
  protectedProcedure,
} from "../trpc";
import { randomUUID } from "crypto";
import type { RevenueSource } from "@prisma/client";

/**
 * Revenue Allocation Router
 * Handles all revenue tracking, allocation (50/30/20), and distribution
 */

// Helper to check if user is admin
function requireAdmin(session: any) {
  const userRole = (session?.user as any)?.role;
  if (userRole !== "admin") {
    throw new TRPCError({ 
      code: "FORBIDDEN", 
      message: "Admin access required" 
    });
  }
}

const revenueAnalyticsFiltersSchema = z
  .object({
    source: z
      .enum([
        "COMMUNITY_SUPPORT",
        "MEMBERSHIP_REGISTRATION",
        "MEMBERSHIP_RENEWAL",
        "STORE_PURCHASE",
        "WITHDRAWAL_FEE",
        "YOUTUBE_SUBSCRIPTION",
        "THIRD_PARTY_SERVICES",
        "PALLIATIVE_PROGRAM",
        "LEADERSHIP_POOL_FEE",
        "TRAINING_CENTER",
        "OTHER",
      ])
      .optional(),
    sourceKey: z.string().min(1).optional(),
    userId: z.string().min(1).optional(),
    programType: z.string().min(1).optional(),
    productId: z.string().min(1).optional(),
    orderId: z.string().min(1).optional(),
    packageId: z.string().min(1).optional(),
    country: z.string().min(1).optional(),
    state: z.string().min(1).optional(),
    region: z.string().min(1).optional(),
    tokenSymbol: z.string().min(1).optional(),
  })
  .strict();

function buildRevenueTransactionFilter(filters?: z.infer<typeof revenueAnalyticsFiltersSchema>) {
  if (!filters) return {};

  const where: Record<string, unknown> = {};

  if (filters.source) where.source = filters.source;
  if (filters.sourceKey) where.sourceKey = filters.sourceKey;
  if (filters.userId) where.userId = filters.userId;
  if (filters.programType) where.programType = filters.programType;
  if (filters.productId) where.productId = filters.productId;
  if (filters.orderId) where.orderId = filters.orderId;
  if (filters.packageId) where.packageId = filters.packageId;
  if (filters.country) where.country = filters.country;
  if (filters.state) where.state = filters.state;
  if (filters.region) where.region = filters.region;
  if (filters.tokenSymbol) where.tokenSymbol = filters.tokenSymbol;

  return where;
}

export const revenueRouter = createTRPCRouter({
  /**
   * Get revenue split settings (Company/Executive/Strategic)
   */
  getProfitSplitSettings: protectedProcedure.query(async ({ ctx }) => {
    requireAdmin(ctx.session);

    const activeVersion = await (ctx.prisma as any).profitPoolConfigVersion.findFirst({
      where: { isActive: true },
      orderBy: { version: "desc" },
    });

    if (activeVersion) {
      return {
        companyPercent: Number(activeVersion.companyPercent ?? 50),
        executivePercent: Number(activeVersion.executivePercent ?? 30),
        strategicPercent: Number(activeVersion.strategicPercent ?? 20),
        versionId: String(activeVersion.id),
        version: Number(activeVersion.version ?? 0),
      };
    }

    const keys = [
      "revenue_split_company_percent",
      "revenue_split_executive_percent",
      "revenue_split_strategic_percent",
    ] as const;

    const settings = await ctx.prisma.adminSettings.findMany({
      where: { settingKey: { in: [...keys] } },
      select: { settingKey: true, settingValue: true },
    });

    const map = new Map(
      settings.map((s: { settingKey: string; settingValue: string | null }) => [
        s.settingKey,
        s.settingValue,
      ])
    );

    const companyPercent = parseFloat(
      String(map.get("revenue_split_company_percent") ?? "50")
    );
    const executivePercent = parseFloat(
      String(map.get("revenue_split_executive_percent") ?? "30")
    );
    const strategicPercent = parseFloat(
      String(map.get("revenue_split_strategic_percent") ?? "20")
    );

    return {
      companyPercent: Number.isFinite(companyPercent) ? companyPercent : 50,
      executivePercent: Number.isFinite(executivePercent) ? executivePercent : 30,
      strategicPercent: Number.isFinite(strategicPercent) ? strategicPercent : 20,
      versionId: null,
      version: null,
    };
  }),

  /**
   * Update revenue split settings (must sum to 100)
   */
  updateProfitSplitSettings: protectedProcedure
    .input(
      z
        .object({
          companyPercent: z.number().min(0).max(100),
          executivePercent: z.number().min(0).max(100),
          strategicPercent: z.number().min(0).max(100),
        })
        .refine(
          (v) => Math.abs(v.companyPercent + v.executivePercent + v.strategicPercent - 100) < 0.0001,
          {
            message: "Percentages must sum to 100",
          }
        )
    )
    .mutation(async ({ ctx, input }) => {
      requireAdmin(ctx.session);

      const rows = [
        {
          settingKey: "revenue_split_company_percent",
          settingValue: String(input.companyPercent),
          description: "Revenue split: Company Reserve percent",
        },
        {
          settingKey: "revenue_split_executive_percent",
          settingValue: String(input.executivePercent),
          description: "Revenue split: Executive Pool percent",
        },
        {
          settingKey: "revenue_split_strategic_percent",
          settingValue: String(input.strategicPercent),
          description: "Revenue split: Strategic Pools total percent",
        },
      ];

      const created = await ctx.prisma.$transaction(async (tx) => {
        await Promise.all(
          rows.map((r) =>
            tx.adminSettings.upsert({
              where: { settingKey: r.settingKey },
              update: {
                settingValue: r.settingValue,
                description: r.description,
                updatedAt: new Date(),
              },
              create: {
                id: randomUUID(),
                settingKey: r.settingKey,
                settingValue: r.settingValue,
                description: r.description,
                updatedAt: new Date(),
              },
            })
          )
        );

        const maxVersion = await (tx as any).profitPoolConfigVersion.aggregate({
          _max: { version: true },
        });
        const nextVersion = Number(maxVersion?._max?.version ?? 0) + 1;

        await (tx as any).profitPoolConfigVersion.updateMany({
          where: { isActive: true },
          data: { isActive: false },
        });

        return (tx as any).profitPoolConfigVersion.create({
          data: {
            version: nextVersion,
            isActive: true,
            companyPercent: input.companyPercent,
            executivePercent: input.executivePercent,
            strategicPercent: input.strategicPercent,
          },
        });
      });

      return { success: true, versionId: String(created.id), version: Number(created.version ?? 0) };
    }),

  /**
   * Record a revenue transaction and allocate it
   * Called by various revenue sources (payments, CSP, store, etc.)
   */
  recordRevenue: protectedProcedure
    .input(
      z.object({
        source: z.enum([
          "COMMUNITY_SUPPORT",
          "MEMBERSHIP_REGISTRATION",
          "MEMBERSHIP_RENEWAL",
          "STORE_PURCHASE",
          "WITHDRAWAL_FEE",
          "YOUTUBE_SUBSCRIPTION",
          "THIRD_PARTY_SERVICES",
          "PALLIATIVE_PROGRAM",
          "LEADERSHIP_POOL_FEE",
          "TRAINING_CENTER",
          "OTHER",
        ]),
        amount: z.number().positive(),
        currency: z.enum(["NGN", "USD"]).default("NGN"),
        sourceId: z.string().optional(), // Reference to source transaction
        description: z.string().optional(),
        sourceKey: z.string().optional(),
        userId: z.string().optional(),
        programType: z.string().optional(),
        productId: z.string().optional(),
        orderId: z.string().optional(),
        packageId: z.string().optional(),
        country: z.string().optional(),
        state: z.string().optional(),
        region: z.string().optional(),
        tokenSymbol: z.string().optional(),
        metadata: z.unknown().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Use the centralized service instead
      const { recordRevenue } = await import("../../services/revenue.service");

      const normalizedMetadata =
        input.metadata && typeof input.metadata === "object" && !Array.isArray(input.metadata)
          ? (input.metadata as Record<string, unknown>)
          : undefined;
      
      const revenueTransaction = await recordRevenue(ctx.prisma, {
        source: input.source,
        amount: input.amount,
        currency: input.currency,
        sourceId: input.sourceId,
        description: input.description,
        sourceKey: input.sourceKey,
        userId: input.userId,
        programType: input.programType,
        productId: input.productId,
        orderId: input.orderId,
        packageId: input.packageId,
        country: input.country,
        state: input.state,
        region: input.region,
        tokenSymbol: input.tokenSymbol,
        metadata: normalizedMetadata,
      });

      return {
        success: true,
        transactionId: revenueTransaction.id,
        amount: Number(revenueTransaction.amount),
      };
    }),

  /**
   * Get executive shareholders with their assignments
   */
  getExecutiveShareholders: protectedProcedure.query(async ({ ctx }) => {
    requireAdmin(ctx.session);

    return ctx.prisma.executiveShareholder.findMany({
      include: {
        User: {
          select: {
            id: true,
            name: true,
            email: true,
            username: true,
          },
        },
      },
      orderBy: { percentage: "desc" },
    });
  }),

  /**
   * Create a new executive position (dynamic role)
   */
  createExecutivePosition: protectedProcedure
    .input(
      z.object({
        role: z.string().min(2).max(50),
        percentage: z.number().min(0).max(100),
      })
    )
    .mutation(async ({ ctx, input }) => {
      requireAdmin(ctx.session);

      const roleKey = normalizeRoleName(input.role);
      const normalizedRole = roleKey;

      const existingRole = await ctx.prisma.executiveShareholder.findUnique({
        where: { role: roleKey },
      });

      if (existingRole) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Role ${normalizedRole} already exists.`,
        });
      }

      // Admin override: allow creating roles even if totals temporarily exceed 100%.

      const shareholder = await ctx.prisma.executiveShareholder.create({
        data: {
          role: roleKey,
          percentage: input.percentage,
          userId: null,
        },
      });

      await ctx.prisma.revenueAdminAction.create({
        data: {
          adminId: ctx.session!.user.id,
          actionType: "CREATE_EXECUTIVE",
          description: `Created executive position ${normalizedRole} at ${input.percentage}%`,
          metadata: {
            role: normalizedRole,
            percentage: input.percentage,
          },
        },
      });

      return shareholder;
    }),

  /**
   * Assign user to executive role
   */
  assignExecutiveRole: protectedProcedure
    .input(
      z
        .object({
          shareholderId: z.string().optional(),
          role: z.string().optional(),
          userId: z.string(),
        })
        .refine((data) => data.shareholderId || data.role, {
          message: "Provide role or shareholderId",
        })
    )
    .mutation(async ({ ctx, input }) => {
      // Admin check
      if ((ctx.session?.user as any)?.role !== 'admin') {
        throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required" });
      }

      const roleKey = input.role ? normalizeRoleName(input.role) : undefined;

      const shareholder = await ctx.prisma.executiveShareholder.findUnique({
        where: input.shareholderId
          ? { id: input.shareholderId }
          : { role: roleKey },
        include: {
          User: {
            select: {
              id: true,
              name: true,
              email: true,
              username: true,
            },
          },
        },
      });

      if (!shareholder) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Executive position not found. Create it first.",
        });
      }

      if (shareholder.userId && shareholder.userId !== input.userId) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `${shareholder.role} is already assigned to another user`,
        });
      }

      const updatedShareholder = await ctx.prisma.executiveShareholder.update({
        where: { id: shareholder.id },
        data: { userId: input.userId },
        include: {
          User: {
            select: {
              id: true,
              name: true,
              email: true,
              username: true,
            },
          },
        },
      });

      // Log admin action
      await ctx.prisma.revenueAdminAction.create({
        data: {
          adminId: ctx.session!.user.id,
          actionType: "ASSIGN_EXECUTIVE",
          description: `Assigned ${shareholder.role} to user ${updatedShareholder.User?.name || updatedShareholder.User?.email || input.userId}`,
          metadata: {
            role: shareholder.role,
            userId: input.userId,
          },
        },
      });

      return updatedShareholder;
    }),

  /**
   * Remove user from executive role
   */
  removeExecutiveRole: protectedProcedure
    .input(
      z
        .object({
          shareholderId: z.string().optional(),
          role: z.string().optional(),
        })
        .refine((data) => data.shareholderId || data.role, {
          message: "Provide role or shareholderId",
        })
    )
    .mutation(async ({ ctx, input }) => {
      // Admin check
      if ((ctx.session?.user as any)?.role !== 'admin') {
        throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required" });
      }

      const roleKey = input.role ? normalizeRoleName(input.role) : undefined;

      const shareholder = await ctx.prisma.executiveShareholder.findUnique({
        where: input.shareholderId ? { id: input.shareholderId } : { role: roleKey },
      });

      if (!shareholder) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Executive position not found" });
      }

      await ctx.prisma.executiveShareholder.update({
        where: { id: shareholder.id },
        data: { userId: null },
      });

      // Log admin action
      await ctx.prisma.revenueAdminAction.create({
        data: {
          adminId: ctx.session!.user.id,
          actionType: "REMOVE_EXECUTIVE",
          description: `Removed ${shareholder.role}`,
          metadata: { role: shareholder.role, shareholderId: shareholder.id },
        },
      });

      return { success: true };
    }),

  /**
   * Delete executive position entirely
   */
  deleteExecutivePosition: protectedProcedure
    .input(
      z.object({
        shareholderId: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Admin check
      if ((ctx.session?.user as any)?.role !== 'admin') {
        throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required" });
      }

      const shareholder = await ctx.prisma.executiveShareholder.findUnique({
        where: { id: input.shareholderId },
      });

      if (!shareholder) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Executive position not found" });
      }

      // Can't delete if user is currently assigned
      if (shareholder.userId) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Cannot delete position with assigned user. Clear user first.",
        });
      }

      // Can't delete if position has balance
      if (Number(shareholder.currentBalance || 0) > 0) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Cannot delete position with outstanding balance. Withdraw funds first.",
        });
      }

      // Delete the position
      await ctx.prisma.executiveShareholder.delete({
        where: { id: input.shareholderId },
      });

      // Log admin action
      await ctx.prisma.revenueAdminAction.create({
        data: {
          adminId: ctx.session!.user.id,
          actionType: "DELETE_EXECUTIVE_POSITION",
          description: `Deleted executive position: ${shareholder.role}`,
          metadata: { role: shareholder.role, shareholderId: shareholder.id },
        },
      });

      return { success: true };
    }),

  /**
   * Get all strategic pools with members
   */
  getStrategicPools: protectedProcedure
    .input(
      z.object({
        limit: z.number().default(10),
        offset: z.number().default(0),
      }).optional()
    )
    .query(async ({ ctx, input }) => {
      requireAdmin(ctx.session);
      const { limit = 10, offset = 0 } = input || {};

      return ctx.prisma.strategyPool.findMany({
        include: {
          Members: {
            include: {
              User: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  username: true,
                },
              },
            },
            take: limit,
            skip: offset,
          },
        },
      });
    }),

  /**
   * Add member to strategic pool
   */
  addPoolMember: protectedProcedure
    .input(
      z.object({
        poolType: z.enum([
          "LEADERSHIP",
          "STATE",
          "DIRECTORS",
          "TECHNOLOGY",
          "INVESTORS",
        ]),
        userId: z.string(),
        eligibilityCriteria: z.string().optional(),
        qualificationNote: z.string().optional(),
        qualificationStatus: z.string().optional(),
        customPercentage: z.number().min(0).max(100).nullable().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      requireAdmin(ctx.session);

      // Check if user is already in this pool
      const pool = await ctx.prisma.strategyPool.findUnique({
        where: { type: input.poolType },
        include: {
          Members: { where: { isActive: true } },
        },
      });

      if (!pool) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Pool not found",
        });
      }

      const alreadyMember = (pool.Members as any[]).some(
        (m) => m.userId === input.userId
      );
      if (alreadyMember) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "User is already a member of this pool",
        });
      }

      // Enforce max member cap (configurable per pool; defaults: LEADERSHIP=1000, others=unlimited)
      const maxMembers = (pool as any).maxMembers;
      if (maxMembers != null && (pool.Members as any[]).length >= maxMembers) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `${input.poolType} pool is at the maximum capacity of ${maxMembers} members`,
        });
      }

      // Add member
      const member = await ctx.prisma.poolMember.create({
        data: {
          poolId: pool.id,
          userId: input.userId,
          addedBy: ctx.session!.user.id,
          ...(input.eligibilityCriteria ? { eligibilityCriteria: input.eligibilityCriteria } : {}),
          ...(input.qualificationNote ? { qualificationNote: input.qualificationNote } : {}),
          ...(input.qualificationStatus ? { qualificationStatus: input.qualificationStatus } : {}),
          ...(input.customPercentage != null ? { customPercentage: input.customPercentage } : {}),
        },
        include: {
          User: {
            select: {
              id: true,
              name: true,
              email: true,
              username: true,
            },
          },
        },
      });

      // Log admin action
      await ctx.prisma.poolAdminAction.create({
        data: {
          poolId: pool.id,
          adminId: ctx.session!.user.id,
          actionType: "MEMBER_ADDED",
          description: `Added user ${input.userId} to ${input.poolType} pool`,
          metadata: {
            poolType: input.poolType,
            userId: input.userId,
          },
        },
      });

      return member;
    }),

  /**
   * Remove member from strategic pool
   */
  removePoolMember: protectedProcedure
    .input(
      z.object({
        memberId: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      requireAdmin(ctx.session);

      const member = await ctx.prisma.poolMember.findUnique({
        where: { id: input.memberId },
        include: { Pool: true },
      });

      if (!member) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Member not found",
        });
      }

      // Soft delete (mark as inactive)
      await ctx.prisma.poolMember.update({
        where: { id: input.memberId },
        data: {
          isActive: false,
          leftAt: new Date(),
        },
      });

      // Log admin action
      await ctx.prisma.poolAdminAction.create({
        data: {
          poolId: member.Pool.id,
          adminId: ctx.session!.user.id,
          actionType: "MEMBER_REMOVED",
          description: `Removed user ${member.userId} from ${member.Pool.type} pool`,
          metadata: {
            poolType: member.Pool.type,
            userId: member.userId,
          },
        },
      });

      return { success: true };
    }),

  /**
   * Update pool configuration (frequency, max members, percentage, description)
   */
  updatePoolConfig: protectedProcedure    .input(
      z.object({
        poolType: z.enum(["LEADERSHIP", "STATE", "DIRECTORS", "TECHNOLOGY", "INVESTORS"]),
        distributionFrequency: z.enum(["MANUAL", "MONTHLY", "QUARTERLY", "BI_ANNUAL", "ANNUAL"]).optional(),
        maxMembers: z.number().int().min(1).nullable().optional(),
        percentage: z.number().min(0).max(100).optional(),
        description: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      requireAdmin(ctx.session);
      const { poolType, ...rest } = input;
      const data: Record<string, unknown> = {};
      if (rest.distributionFrequency !== undefined) data.distributionFrequency = rest.distributionFrequency;
      if (rest.maxMembers !== undefined) data.maxMembers = rest.maxMembers;
      if (rest.percentage !== undefined) data.percentage = rest.percentage;
      if (rest.description !== undefined) data.description = rest.description;
      const pool = await ctx.prisma.strategyPool.update({
        where: { type: poolType },
        data,
      });
      await ctx.prisma.poolAdminAction.create({
        data: {
          poolId: pool.id,
          adminId: ctx.session!.user.id,
          actionType: "CONFIG_UPDATED",
          description: `Updated config for ${poolType} pool`,
          metadata: JSON.parse(JSON.stringify({ changes: data })),
        },
      });
      return pool;
    }),

  /**
   * Update an existing pool member's eligibility / qualification fields
   */
  updatePoolMember: protectedProcedure
    .input(
      z.object({
        memberId: z.string(),
        eligibilityCriteria: z.string().nullable().optional(),
        qualificationNote: z.string().nullable().optional(),
        qualificationStatus: z.string().nullable().optional(),
        customPercentage: z.number().min(0).max(100).nullable().optional(),
        isActive: z.boolean().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      requireAdmin(ctx.session);
      const { memberId, ...fields } = input;
      const data: Record<string, unknown> = {};
      if (fields.eligibilityCriteria !== undefined) data.eligibilityCriteria = fields.eligibilityCriteria;
      if (fields.qualificationNote !== undefined) data.qualificationNote = fields.qualificationNote;
      if (fields.qualificationStatus !== undefined) data.qualificationStatus = fields.qualificationStatus;
      if (fields.customPercentage !== undefined) data.customPercentage = fields.customPercentage;
      if (fields.isActive !== undefined) {
        data.isActive = fields.isActive;
        if (!fields.isActive) data.leftAt = new Date();
      }
      const member = await ctx.prisma.poolMember.update({ where: { id: memberId }, data });
      return member;
    }),

  // ─── Technology Pool: Project Budget Tracking ────────────────────────────────

  /**
   * Create a new Technology Pool project proposal
   */
  createTechProject: protectedProcedure
    .input(
      z.object({
        title: z.string().min(3).max(200),
        description: z.string().optional(),
        category: z.enum(["PRODUCT_DEV", "INFRASTRUCTURE", "SECURITY", "R_AND_D", "TOOLING", "OTHER"]).optional(),
        approvedBudget: z.number().positive(),
        startDate: z.string().optional(),
        endDate: z.string().optional(),
        milestones: z.array(z.string()).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      requireAdmin(ctx.session);
      const techPool = await ctx.prisma.strategyPool.findUnique({ where: { type: "TECHNOLOGY" } });
      if (!techPool) throw new TRPCError({ code: "NOT_FOUND", message: "Technology pool not found" });
      const project = await (ctx.prisma as any).techPoolProject.create({
        data: {
          poolId: techPool.id,
          title: input.title,
          description: input.description ?? null,
          category: input.category ?? "OTHER",
          approvedBudget: input.approvedBudget,
          status: "PROPOSED",
          proposedBy: ctx.session!.user.id,
          startDate: input.startDate ? new Date(input.startDate) : null,
          endDate: input.endDate ? new Date(input.endDate) : null,
          milestones: input.milestones ? JSON.stringify(input.milestones) : null,
        },
      });
      return project;
    }),

  /**
   * Approve or reject a Technology Pool project
   */
  approveTechProject: protectedProcedure
    .input(
      z.object({
        projectId: z.string(),
        action: z.enum(["APPROVE", "REJECT", "ON_HOLD"]),
        roiNotes: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      requireAdmin(ctx.session);
      const statusMap: Record<string, string> = { APPROVE: "APPROVED", REJECT: "REJECTED", ON_HOLD: "ON_HOLD" };
      const project = await (ctx.prisma as any).techPoolProject.update({
        where: { id: input.projectId },
        data: {
          status: statusMap[input.action],
          approvedBy: input.action === "APPROVE" ? ctx.session!.user.id : undefined,
          approvedAt: input.action === "APPROVE" ? new Date() : undefined,
          ...(input.roiNotes ? { roiNotes: input.roiNotes } : {}),
        },
      });
      return project;
    }),

  /**
   * Record spend against an approved Technology Pool project
   */
  recordTechSpend: protectedProcedure
    .input(
      z.object({
        projectId: z.string(),
        amount: z.number().positive(),
        description: z.string().min(5),
        receipt: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      requireAdmin(ctx.session);
      const project = await (ctx.prisma as any).techPoolProject.findUnique({ where: { id: input.projectId } });
      if (!project) throw new TRPCError({ code: "NOT_FOUND", message: "Project not found" });
      if (project.status !== "APPROVED" && project.status !== "IN_PROGRESS") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Project must be APPROVED before recording spend" });
      }
      const remaining = Number(project.approvedBudget) - Number(project.totalSpent);
      if (input.amount > remaining) {
        throw new TRPCError({ code: "BAD_REQUEST", message: `Spend exceeds remaining budget (₦${remaining.toLocaleString()})` });
      }
      const [spend] = await ctx.prisma.$transaction([
        (ctx.prisma as any).techPoolSpend.create({
          data: {
            projectId: input.projectId,
            amount: input.amount,
            description: input.description,
            receipt: input.receipt ?? null,
            spentBy: ctx.session!.user.id,
          },
        }),
        (ctx.prisma as any).techPoolProject.update({
          where: { id: input.projectId },
          data: {
            totalSpent: { increment: input.amount },
            status: "IN_PROGRESS",
          },
        }),
      ]);
      return spend;
    }),

  /**
   * List Technology Pool projects
   */
  listTechProjects: protectedProcedure
    .input(z.object({
      status: z.enum(["PROPOSED", "APPROVED", "IN_PROGRESS", "COMPLETED", "REJECTED", "ON_HOLD"]).optional(),
    }).optional())
    .query(async ({ ctx, input }) => {
      requireAdmin(ctx.session);
      const projects = await (ctx.prisma as any).techPoolProject.findMany({
        where: input?.status ? { status: input.status } : undefined,
        orderBy: { createdAt: "desc" },
        include: {
          Spends: { orderBy: { createdAt: "desc" } },
          ProposedBy: { select: { id: true, name: true, email: true } },
          ApprovedBy: { select: { id: true, name: true, email: true } },
        },
      });
      return projects;
    }),

  /**
   * Update Tech Pool project ROI notes / milestones / status to COMPLETED
   */
  updateTechProject: protectedProcedure
    .input(
      z.object({
        projectId: z.string(),
        roiNotes: z.string().optional(),
        milestones: z.array(z.string()).optional(),
        status: z.enum(["PROPOSED", "APPROVED", "IN_PROGRESS", "COMPLETED", "REJECTED", "ON_HOLD"]).optional(),
        endDate: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      requireAdmin(ctx.session);
      const data: Record<string, unknown> = {};
      if (input.roiNotes !== undefined) data.roiNotes = input.roiNotes;
      if (input.milestones !== undefined) data.milestones = JSON.stringify(input.milestones);
      if (input.status !== undefined) data.status = input.status;
      if (input.endDate !== undefined) data.endDate = new Date(input.endDate);
      return (ctx.prisma as any).techPoolProject.update({ where: { id: input.projectId }, data });
    }),

  /**
   * Distribute strategic pool to members
   */
  distributePool: protectedProcedure
    .input(
      z.object({
        poolType: z.enum([
          "LEADERSHIP",
          "STATE",
          "DIRECTORS",
          "TECHNOLOGY",
          "INVESTORS",
        ]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      requireAdmin(ctx.session);

      const pool = await ctx.prisma.strategyPool.findUnique({
        where: { type: input.poolType },
        include: {
          Members: {
            where: { isActive: true },
            include: {
              User: {
                select: { id: true, name: true, email: true },
              },
            },
          },
        },
      });

      if (!pool) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Pool not found",
        });
      }

      if (pool.Members.length === 0) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Cannot distribute to pool with no members",
        });
      }

      // --- DIRECTORS POOL: validate no suspended members before distribution ---
      if (input.poolType === "DIRECTORS") {
        const suspended = pool.Members.filter((m: any) => m.qualificationStatus === "SUSPENDED");
        if (suspended.length > 0) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: `Cannot distribute: ${suspended.length} director(s) have SUSPENDED status (${suspended.map((m: any) => m.User?.name || m.userId).join(", ")}) — review eligibility before distributing`,
          });
        }
      }

      // --- INVESTORS POOL: filter to non-suspended members only ---
      let eligibleMembers = pool.Members;
      if (input.poolType === "INVESTORS") {
        eligibleMembers = pool.Members.filter((m: any) => m.qualificationStatus !== "SUSPENDED");
        if (eligibleMembers.length === 0) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "No eligible investors — all members have SUSPENDED status",
          });
        }
      }

      // --- STATE / DIRECTORS POOL: capture beneficiary snapshot for audit ---
      const beneficiarySnapshot = (input.poolType === "STATE" || input.poolType === "DIRECTORS")
        ? pool.Members.map((m: any) => ({
            userId: m.userId,
            name: m.User?.name || "Unknown",
            email: m.User?.email || "Unknown",
            qualificationStatus: m.qualificationStatus ?? "ACTIVE",
            customPercentage: m.customPercentage != null ? Number(m.customPercentage) : null,
          }))
        : undefined;

      // Get pending allocations for this pool
      const pendingAllocations = await ctx.prisma.revenueAllocation.findMany({
        where: {
          destinationId: pool.id,
          destinationType: "STRATEGY_POOL",
          status: "PENDING",
        },
      });

      const totalAmount = pendingAllocations.reduce(
        (sum: number, alloc: any) => sum + Number(alloc.amount),
        0
      );

      if (totalAmount <= 0) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "No funds available to distribute",
        });
      }

      // Calculate distribution based on custom percentages or equal split
      // (eligibleMembers already excludes SUSPENDED investors/etc.)
      const hasCustomPercentages = eligibleMembers.some((m: any) => m.customPercentage != null);
      
      let memberShares: { userId: string; amount: number; percentage: number }[] = [];
      
      if (hasCustomPercentages) {
        // Use custom percentages
        const totalCustomPercentage = eligibleMembers.reduce(
          (sum: number, m: any) => sum + (Number(m.customPercentage) || 0),
          0
        );
        
        if (Math.abs(totalCustomPercentage - 100) > 0.01) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: `Custom percentages must sum to 100% (current: ${totalCustomPercentage}%)`,
          });
        }
        
        memberShares = eligibleMembers.map((m: any) => ({
          userId: m.userId,
          amount: (totalAmount * Number(m.customPercentage)) / 100,
          percentage: Number(m.customPercentage),
        }));
      } else {
        // Equal split
        const sharePerMember = totalAmount / eligibleMembers.length;
        const percentagePerMember = 100 / eligibleMembers.length;
        
        memberShares = eligibleMembers.map((m: any) => ({
          userId: m.userId,
          amount: sharePerMember,
          percentage: percentagePerMember,
        }));
      }

      // Use transaction for atomicity
      const result = await ctx.prisma.$transaction(async (tx: any) => {
        const distributions = [];

        // Create pool distributions for each allocation
        for (const allocation of pendingAllocations) {
          const poolDist = await tx.poolDistribution.create({
            data: {
              allocationId: allocation.id,
              poolId: pool.id,
              totalAmount: Number(allocation.amount),
              memberCount: eligibleMembers.length,
              amountPerMember: totalAmount / eligibleMembers.length,
              status: "COMPLETED",
              distributedAt: new Date(),
              distributedBy: ctx.session!.user.id,
            },
          });
          distributions.push(poolDist);
        }

        // Distribute to each member's shareholder wallet based on shares
        for (const share of memberShares) {
          // Credit user's main shareholder wallet
          await tx.user.update({
            where: { id: share.userId },
            data: {
              shareholder: {
                increment: share.amount,
              },
            },
          });

          // Credit pool member wallet balances
          await tx.poolMember.updateMany({
            where: {
              poolId: pool.id,
              userId: share.userId,
              isActive: true,
            },
            data: {
              totalEarned: {
                increment: share.amount,
              },
              currentBalance: {
                increment: share.amount,
              },
              lastDistributionAt: new Date(),
            },
          });
        }

        // Mark allocations as distributed
        await tx.revenueAllocation.updateMany({
          where: {
            id: { in: pendingAllocations.map((a: any) => a.id) },
          },
          data: {
            status: "DISTRIBUTED",
            distributedAt: new Date(),
          },
        });

        // Update pool balance and distribution tracking
        const now = new Date();
        const freq = (pool as any).distributionFrequency ?? "MANUAL";
        let nextDistributionAt: Date | null = null;
        if (freq === "MONTHLY") {
          nextDistributionAt = new Date(now.getFullYear(), now.getMonth() + 1, 1);
        } else if (freq === "QUARTERLY") {
          nextDistributionAt = new Date(now.getFullYear(), now.getMonth() + 3, 1);
        } else if (freq === "BI_ANNUAL") {
          nextDistributionAt = new Date(now.getFullYear(), now.getMonth() + 6, 1);
        } else if (freq === "ANNUAL") {
          nextDistributionAt = new Date(now.getFullYear() + 1, 0, 1);
        }
        await tx.strategyPool.update({
          where: { id: pool.id },
          data: {
            balance: { decrement: totalAmount },
            lastDistributedAt: now,
            ...(nextDistributionAt ? { nextDistributionAt } : {}),
          },
        });

        const averageSharePerMember = totalAmount / memberShares.length;
        return { distributions, totalAmount, sharePerMember: averageSharePerMember, memberCount: memberShares.length };
      });

      // Log admin action
      await ctx.prisma.poolAdminAction.create({
        data: {
          poolId: pool.id,
          adminId: ctx.session!.user.id,
          actionType: "POOL_DISTRIBUTED",
          description: `Distributed ₦${result.totalAmount.toLocaleString()} to ${result.memberCount} members`,
          metadata: JSON.parse(JSON.stringify({
            poolType: input.poolType,
            totalAmount: result.totalAmount,
            memberCount: result.memberCount,
            sharePerMember: result.sharePerMember,
            ...(beneficiarySnapshot ? { beneficiarySnapshot } : {}),
            distributedAt: new Date().toISOString(),
          })),
        },
      });

      return {
        success: true,
        totalAmount: result.totalAmount,
        memberCount: result.memberCount,
        sharePerMember: result.sharePerMember,
        distributions: result.distributions.length,
      };
    }),

  /**
   * Get revenue dashboard stats
   */
  getDashboardStats: protectedProcedure.query(async ({ ctx }) => {
    requireAdmin(ctx.session);

    const [totalRevenue, companyReserve, executivePool, strategicPools, recentTransactions, recentDistributions] =
      await Promise.all([
        // Total revenue
        ctx.prisma.revenueTransaction.aggregate({
          _sum: { amount: true },
          where: { allocationStatus: "ALLOCATED" },
        }),
        // Company reserve
        ctx.prisma.companyReserve.findFirst({
          orderBy: { updatedAt: "desc" },
        }),
        // Executive pool pending
        ctx.prisma.revenueAllocation.aggregate({
          _sum: { amount: true },
          where: {
            destinationType: "EXECUTIVE_POOL",
            status: "PENDING",
          },
        }),
        // Strategic pools
        ctx.prisma.strategyPool.findMany({
          select: {
            type: true,
            name: true,
            balance: true,
          },
        }),
        // Recent transactions
        ctx.prisma.revenueTransaction.findMany({
          where: { allocationStatus: "ALLOCATED" },
          orderBy: { createdAt: "desc" },
          take: 10,
        }),
        // Recent distributions
        ctx.prisma.executiveDistribution.findMany({
          include: {
            Shareholder: {
              include: {
                User: {
                  select: { name: true, email: true },
                },
              },
            },
          },
          orderBy: { createdAt: "desc" },
          take: 10,
        }),
      ]);

    return {
      totalRevenue: Number(totalRevenue._sum.amount) || 0,
      companyReserve: Number(companyReserve?.balance) || 0,
      companyTotalReceived: Number(companyReserve?.totalReceived) || 0,
      companyTotalSpent: Number(companyReserve?.totalSpent) || 0,
      executivePoolPending: Number(executivePool._sum.amount) || 0,
      strategicPools: strategicPools.map((p: any) => ({
        type: p.type,
        name: p.name,
        balance: Number(p.balance),
      })),
      recentTransactions: recentTransactions.map((t: any) => ({
        ...t,
        amount: Number(t.amount),
      })),
      recentDistributions: recentDistributions.map((d: any) => ({
        ...d,
        amount: Number(d.amount),
        percentage: Number(d.percentage),
      })),
    };
  }),

  /**
   * Get revenue breakdown by source
   */
  getRevenueBreakdown: protectedProcedure
    .input(
      z.object({
        startDate: z.date().optional(),
        endDate: z.date().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      requireAdmin(ctx.session);

      const where: any = {
        allocationStatus: "ALLOCATED",
      };

      if (input.startDate || input.endDate) {
        where.createdAt = {};
        if (input.startDate) where.createdAt.gte = input.startDate;
        if (input.endDate) where.createdAt.lte = input.endDate;
      }

      const breakdown = await ctx.prisma.revenueTransaction.groupBy({
        by: ["source"],
        _sum: { amount: true },
        _count: true,
        where,
      });

      return breakdown.map((item: any) => ({
        source: item.source,
        totalAmount: item._sum.amount || 0,
        transactionCount: item._count,
      }));
    }),

  /**
   * Search users for pool assignment
   */
  /**
   * Get company reserve details with transaction history
   */
  getCompanyReserve: protectedProcedure
    .input(
      z.object({
        includeTransactions: z.boolean().default(false),
        limit: z.number().default(50),
      }).optional()
    )
    .query(async ({ ctx, input }): Promise<any> => {
      requireAdmin(ctx.session);
      const { includeTransactions = false, limit = 50 } = input || {};

      if (includeTransactions) {
        return await ctx.prisma.companyReserve.findFirst({
          orderBy: { updatedAt: "desc" },
          include: {
            Transactions: {
              include: {
                ApprovedBy: {
                  select: {
                    id: true,
                    name: true,
                    email: true,
                  },
                },
              },
              orderBy: { createdAt: "desc" },
              take: limit,
            },
          },
        });
      }

      return await ctx.prisma.companyReserve.findFirst({
        orderBy: { updatedAt: "desc" },
      });
    }),

  /**
   * Record a spend from company reserve
   */
  spendFromReserve: protectedProcedure
    .input(
      z.object({
        amount: z.number().positive(),
        category: z.enum([
          "SALARIES",
          "INFRASTRUCTURE",
          "MARKETING",
          "LEGAL",
          "OPERATIONS",
          "OTHER",
        ]),
        description: z.string().min(5),
      })
    )
    .mutation(async ({ ctx, input }) => {
      requireAdmin(ctx.session);

      const reserve = await ctx.prisma.companyReserve.findFirst({
        orderBy: { updatedAt: "desc" },
      });

      if (!reserve) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Company reserve not found",
        });
      }

      if (Number(reserve.balance) < input.amount) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Insufficient balance. Available: ₦${Number(reserve.balance).toLocaleString()}`,
        });
      }

      const result = await ctx.prisma.$transaction(async (tx: any) => {
        // Deduct from reserve
        const updated = await tx.companyReserve.update({
          where: { id: reserve.id },
          data: {
            balance: { decrement: input.amount },
            totalSpent: { increment: input.amount },
          },
        });

        // Record transaction
        const transaction = await tx.companyReserveTransaction.create({
          data: {
            reserveId: reserve.id,
            amount: input.amount,
            type: "OPERATIONAL_SPEND",
            category: input.category,
            description: input.description,
            approvedBy: ctx.session!.user.id,
          },
        });

        return { reserve: updated, transaction };
      });

      // Log admin action
      await ctx.prisma.revenueAdminAction.create({
        data: {
          adminId: ctx.session!.user.id,
          actionType: "SPEND_FROM_RESERVE",
          description: `Spent ₦${input.amount.toLocaleString()} on ${input.category}: ${input.description}`,
          metadata: {
            amount: input.amount,
            category: input.category,
            transactionId: result.transaction.id,
          },
        },
      });

      return result;
    }),

  searchUsers: protectedProcedure
    .input(
      z.object({
        query: z.string().min(2),
      })
    )
    .query(async ({ ctx, input }) => {
      requireAdmin(ctx.session);

      return ctx.prisma.user.findMany({
        where: {
          OR: [
            { email: { contains: input.query, mode: "insensitive" } },
            { name: { contains: input.query, mode: "insensitive" } },
            { username: { contains: input.query, mode: "insensitive" } },
          ],
        },
        select: {
          id: true,
          name: true,
          email: true,
          username: true,
        },
        take: 20,
      });
    }),

  /**
   * Get admin action history
   */
  getAdminActions: protectedProcedure
    .input(
      z.object({
        limit: z.number().default(50),
      })
    )
    .query(async ({ ctx, input }) => {
      requireAdmin(ctx.session);

      return ctx.prisma.revenueAdminAction.findMany({
        include: {
          Admin: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        take: input.limit,
      });
    }),

  /**
   * Get revenue breakdown by source for charts
   */
  getRevenueBySource: protectedProcedure
    .input(
      z.object({
        days: z.number().default(30),
        filters: revenueAnalyticsFiltersSchema.optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      requireAdmin(ctx.session);

      const startDate = new Date();
      startDate.setDate(startDate.getDate() - input.days);

      const transactions = await ctx.prisma.revenueTransaction.groupBy({
        by: ["source"],
        where: {
          createdAt: {
            gte: startDate,
          },
          ...buildRevenueTransactionFilter(input.filters),
        },
        _sum: {
          amount: true,
        },
        _count: {
          id: true,
        },
      });

      return transactions.map(
        (t: { source: string; _sum: { amount: unknown }; _count: { id: number } }) => ({
          source: t.source,
          amount: Number(t._sum.amount || 0),
          count: t._count.id,
        })
      );
    }),

  /**
   * Get revenue trend over time (last N days)
   */
  getRevenueTrend: protectedProcedure
    .input(
      z.object({
        days: z.number().default(30),
        filters: revenueAnalyticsFiltersSchema.optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      requireAdmin(ctx.session);

      const startDate = new Date();
      startDate.setDate(startDate.getDate() - input.days);

      // Get allocations
      const allocations = await ctx.prisma.revenueAllocation.findMany({
        where: {
          createdAt: {
            gte: startDate,
          },
          ...(input.filters
            ? {
                RevenueTransaction: {
                  createdAt: {
                    gte: startDate,
                  },
                  ...buildRevenueTransactionFilter(input.filters),
                },
              }
            : undefined),
        },
        select: {
          createdAt: true,
          amount: true,
          destinationType: true,
        },
        orderBy: {
          createdAt: "asc",
        },
      });

      // Group by date and destination type
      const dailyData = new Map<string, {
        total: number;
        companyReserve: number;
        executivePool: number;
        strategicPools: number;
      }>();

      allocations.forEach(
        (allocation: { createdAt: Date; amount: unknown; destinationType: string }) => {
        const dateKey = allocation.createdAt.toISOString().split("T")[0];
        const existing = dailyData.get(dateKey!) || {
          total: 0,
          companyReserve: 0,
          executivePool: 0,
          strategicPools: 0,
        };

        const amount = Number(allocation.amount);
        existing.total += amount;

        if (allocation.destinationType === "COMPANY_RESERVE") {
          existing.companyReserve += amount;
        } else if (allocation.destinationType === "EXECUTIVE_POOL") {
          existing.executivePool += amount;
        } else if (allocation.destinationType === "STRATEGIC_POOL") {
          existing.strategicPools += amount;
        }

        dailyData.set(dateKey!, existing);
        }
      );

      // Fill in missing dates with zeros
      const result: Array<{
        date: Date;
        total: number;
        companyReserve: number;
        executivePool: number;
        strategicPools: number;
      }> = [];

      for (let i = input.days - 1; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateKey = date.toISOString().split("T")[0];
        const data = dailyData.get(dateKey!) || {
          total: 0,
          companyReserve: 0,
          executivePool: 0,
          strategicPools: 0,
        };

        result.push({
          date,
          ...data,
        });
      }

      return result;
    }),

  /**
   * Get all allocations for timeline
   */
  getAllocations: protectedProcedure
    .input(
      z.object({
        limit: z.number().default(50),
        source: z.string().optional(),
        filters: revenueAnalyticsFiltersSchema.optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      requireAdmin(ctx.session);

      // Get allocations with transaction info
      const allocations = await ctx.prisma.revenueAllocation.findMany({
        where:
          input.source || input.filters
            ? {
                RevenueTransaction: {
                  ...(input.source
                    ? { source: input.source as RevenueSource }
                    : undefined),
                  ...buildRevenueTransactionFilter(input.filters),
                },
              }
            : undefined,
        include: {
          RevenueTransaction: {
            select: {
              source: true,
              description: true,
              amount: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
        take: input.limit,
      });

      // Transform to expected format with split amounts
      return allocations.map(
        (alloc: {
          id: string;
          createdAt: Date;
          amount: unknown;
          destinationType: string;
          RevenueTransaction?: { source: string; description: string | null; amount: unknown } | null;
        }) => ({
          id: alloc.id,
          createdAt: alloc.createdAt,
          totalAmount: Number(alloc.RevenueTransaction?.amount || 0),
          companyReserveAmount:
            alloc.destinationType === "COMPANY_RESERVE" ? Number(alloc.amount) : 0,
          executivePoolAmount:
            alloc.destinationType === "EXECUTIVE_POOL" ? Number(alloc.amount) : 0,
          strategicPoolsAmount:
            alloc.destinationType === "STRATEGIC_POOL" ? Number(alloc.amount) : 0,
          source: alloc.RevenueTransaction?.source || "OTHER",
          Transaction: {
            description: alloc.RevenueTransaction?.description,
          },
        })
      );
    }),

  /**
   * Create monthly snapshot (manually or via cron)
   */
  createSnapshot: protectedProcedure
    .input(
      z.object({
        month: z.number().min(1).max(12),
        year: z.number().min(2020),
      })
    )
    .mutation(async ({ ctx, input }) => {
      requireAdmin(ctx.session);

      // Check if snapshot already exists
      const existing = await ctx.prisma.revenueSnapshot.findUnique({
        where: {
          month_year: {
            month: input.month,
            year: input.year,
          },
        },
      });

      if (existing) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Snapshot for ${input.month}/${input.year} already exists`,
        });
      }

      // Calculate start and end dates for the month
      const startDate = new Date(input.year, input.month - 1, 1);
      const endDate = new Date(input.year, input.month, 0, 23, 59, 59);

      // Get all transactions for the month
      const transactions = await ctx.prisma.revenueTransaction.findMany({
        where: {
          createdAt: {
            gte: startDate,
            lte: endDate,
          },
        },
      });

      // Calculate totals by source
      const bySource: Record<string, number> = {
        COMMUNITY_SUPPORT: 0,
        MEMBERSHIP_REGISTRATION: 0,
        MEMBERSHIP_RENEWAL: 0,
        STORE_PURCHASE: 0,
        WITHDRAWAL_FEE: 0,
        YOUTUBE_SUBSCRIPTION: 0,
        THIRD_PARTY_SERVICES: 0,
        PALLIATIVE_PROGRAM: 0,
        LEADERSHIP_POOL_FEE: 0,
        TRAINING_CENTER: 0,
        ELITE_CLUB_OPS: 0,
        ELITE_CLUB_INVESTMENT_PROFIT: 0,
        OTHER: 0,
      };

      let totalRevenue = 0;
      transactions.forEach((t: { amount: unknown; source: string }) => {
        const amount = Number(t.amount);
        totalRevenue += amount;
        bySource[t.source as keyof typeof bySource] += amount;
      });

      // Get allocations for the month
      const allocations = await ctx.prisma.revenueAllocation.findMany({
        where: {
          createdAt: {
            gte: startDate,
            lte: endDate,
          },
        },
      });

      // Calculate totals by destination type
      const companyReserveTotal = allocations
        .filter((a: { destinationType: string }) => a.destinationType === "COMPANY_RESERVE")
        .reduce((sum: number, a: { amount: unknown }) => sum + Number(a.amount), 0);
      const executivePoolTotal = allocations
        .filter((a: { destinationType: string }) => a.destinationType === "EXECUTIVE_POOL")
        .reduce((sum: number, a: { amount: unknown }) => sum + Number(a.amount), 0);
      const strategicPoolsTotal = allocations
        .filter((a: { destinationType: string }) => a.destinationType === "STRATEGIC_POOL")
        .reduce((sum: number, a: { amount: unknown }) => sum + Number(a.amount), 0);

      // Get distributions
      const execDistributions = await ctx.prisma.executiveDistribution.findMany({
        where: {
          createdAt: {
            gte: startDate,
            lte: endDate,
          },
        },
      });

      const poolDistributions = await ctx.prisma.poolDistribution.findMany({
        where: {
          createdAt: {
            gte: startDate,
            lte: endDate,
          },
        },
      });

      const executivesDistributed = execDistributions.reduce(
        (sum: number, d: { amount: unknown }) => sum + Number(d.amount),
        0
      );
      const poolsDistributed = poolDistributions.reduce(
        (sum: number, d: { totalAmount: unknown }) => sum + Number(d.totalAmount),
        0
      );

      // Create snapshot
      const snapshot = await ctx.prisma.revenueSnapshot.create({
        data: {
          month: input.month,
          year: input.year,
          totalRevenue,
          companyReserveTotal,
          executivePoolTotal,
          strategicPoolsTotal,
          communitySupport: bySource.COMMUNITY_SUPPORT,
          membershipRegistration: bySource.MEMBERSHIP_REGISTRATION,
          membershipRenewal: bySource.MEMBERSHIP_RENEWAL,
          storePurchase: bySource.STORE_PURCHASE,
          withdrawalFee: bySource.WITHDRAWAL_FEE,
          youtubeSubscription: bySource.YOUTUBE_SUBSCRIPTION,
          thirdPartyServices: bySource.THIRD_PARTY_SERVICES,
          palliativeProgram: bySource.PALLIATIVE_PROGRAM,
          leadershipPoolFee: bySource.LEADERSHIP_POOL_FEE,
          trainingCenter: bySource.TRAINING_CENTER,
          other: bySource.OTHER,
          executivesDistributed,
          poolsDistributed,
          transactionCount: transactions.length,
          createdBy: (ctx.session!.user as any).id,
        },
      });

      // Log action
      await ctx.prisma.revenueAdminAction.create({
        data: {
          adminId: (ctx.session!.user as any).id,
          actionType: "CREATE_SNAPSHOT",
          description: `Created revenue snapshot for ${input.month}/${input.year}`,
          metadata: { snapshotId: snapshot.id, totalRevenue },
        },
      });

      return snapshot;
    }),

  /**
   * Get all snapshots
   */
  getSnapshots: protectedProcedure
    .input(
      z.object({
        limit: z.number().default(12),
      })
    )
    .query(async ({ ctx, input }) => {
      requireAdmin(ctx.session);

      return ctx.prisma.revenueSnapshot.findMany({
        orderBy: [{ year: "desc" }, { month: "desc" }],
        take: input.limit,
      });
    }),

  /**
   * Get detailed revenue source breakdown
   */
  getRevenueSourceDetails: protectedProcedure
    .input(
      z.object({
        source: z.enum([
          "COMMUNITY_SUPPORT",
          "MEMBERSHIP_REGISTRATION",
          "MEMBERSHIP_RENEWAL",
          "STORE_PURCHASE",
          "WITHDRAWAL_FEE",
          "YOUTUBE_SUBSCRIPTION",
          "THIRD_PARTY_SERVICES",
          "PALLIATIVE_PROGRAM",
          "LEADERSHIP_POOL_FEE",
          "TRAINING_CENTER",
          "OTHER",
        ]),
        days: z.number().default(30),
        filters: revenueAnalyticsFiltersSchema.optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      requireAdmin(ctx.session);

      const startDate = new Date();
      startDate.setDate(startDate.getDate() - input.days);

      const transactions = await ctx.prisma.revenueTransaction.findMany({
        where: {
          source: input.source,
          createdAt: {
            gte: startDate,
          },
          ...buildRevenueTransactionFilter(input.filters),
        },
        orderBy: {
          createdAt: "desc",
        },
        take: 100,
      });

      const total = transactions.reduce(
        (sum: number, t: { amount: unknown }) => sum + Number(t.amount),
        0
      );
      const count = transactions.length;
      const average = count > 0 ? total / count : 0;

      return {
        source: input.source,
        total,
        count,
        average,
        transactions,
      };
    }),

  /**
   * Manual Revenue Allocation
   * Allows admin to manually allocate revenue from Company Reserve to Executive or Pool
   */
  manualAllocation: protectedProcedure
    .input(
      z.object({
        destinationType: z.enum(["EXECUTIVE", "POOL"]),
        destinationId: z.string(), // Executive shareholder ID or Pool ID
        amount: z.number().positive(),
        reason: z.string().min(10),
      })
    )
    .mutation(async ({ ctx, input }) => {
      requireAdmin(ctx.session);

      const userId = (ctx.session?.user as any)?.id;

      // Deduct from company reserve
      await ctx.prisma.companyReserveTransaction.create({
        data: {
          reserveId: "1",
          amount: -input.amount, // Negative = spending
          type: "OPERATIONAL_SPEND",
          category: "MANUAL_ALLOCATION",
          description: `Manual allocation to ${input.destinationType}: ${input.reason}`,
          approvedBy: userId,
          metadata: {
            destinationType: input.destinationType,
            destinationId: input.destinationId,
          },
        },
      });

      // Add to destination
      if (input.destinationType === "EXECUTIVE") {
        const shareholder = await ctx.prisma.executiveShareholder.update({
          where: { id: input.destinationId },
          data: {
            currentBalance: { increment: input.amount },
            totalEarned: { increment: input.amount },
          },
        });

        await ctx.prisma.executiveWalletTransaction.create({
          data: {
            shareholderId: input.destinationId,
            amount: input.amount,
            type: "ADJUSTMENT",
            description: `Manual allocation: ${input.reason}`,
            metadata: { approvedBy: userId },
          },
        });

        return {
          success: true,
          message: `₦${input.amount.toLocaleString()} allocated to executive`,
        };
      } else {
        // Pool allocation
        const pool = await ctx.prisma.strategyPool.update({
          where: { id: input.destinationId },
          data: {
            balance: { increment: input.amount },
          },
        });

        return {
          success: true,
          message: `₦${input.amount.toLocaleString()} allocated to ${pool.name}`,
        };
      }
    }),

  /**
   * Inter-Pool Transfer
   * Transfer funds between Company Reserve and Strategic Pools
   */
  poolTransfer: protectedProcedure
    .input(
      z.object({
        from: z.string(), // "COMPANY_RESERVE" or pool ID
        to: z.string(), // "COMPANY_RESERVE" or pool ID
        amount: z.number().positive(),
        reason: z.string().min(10),
      })
    )
    .mutation(async ({ ctx, input }) => {
      requireAdmin(ctx.session);

      const userId = (ctx.session?.user as any)?.id;

      // Handle transfers
      if (input.from === "COMPANY_RESERVE") {
        // From reserve to pool
        await ctx.prisma.companyReserveTransaction.create({
          data: {
            reserveId: "1",
            amount: -input.amount,
            type: "TRANSFER_TO_POOL",
            category: "POOL_TRANSFER",
            description: `Transfer to pool: ${input.reason}`,
            approvedBy: userId,
            metadata: { to: input.to },
          },
        });

        await ctx.prisma.strategyPool.update({
          where: { id: input.to },
          data: { balance: { increment: input.amount } },
        });
      } else if (input.to === "COMPANY_RESERVE") {
        // From pool to reserve
        await ctx.prisma.strategyPool.update({
          where: { id: input.from },
          data: { balance: { decrement: input.amount } },
        });

        await ctx.prisma.companyReserveTransaction.create({
          data: {
            reserveId: "1",
            amount: input.amount,
            type: "TRANSFER_FROM_POOL",
            category: "POOL_TRANSFER",
            description: `Transfer from pool: ${input.reason}`,
            approvedBy: userId,
            metadata: { from: input.from },
          },
        });
      } else {
        // Between pools
        await ctx.prisma.strategyPool.update({
          where: { id: input.from },
          data: { balance: { decrement: input.amount } },
        });

        await ctx.prisma.strategyPool.update({
          where: { id: input.to },
          data: { balance: { increment: input.amount } },
        });
      }

      return {
        success: true,
        message: `₦${input.amount.toLocaleString()} transferred successfully`,
      };
    }),

  /**
   * Adjust Executive Percentages
   * Update percentage allocations for executive roles
   */
  adjustExecutivePercentages: protectedProcedure
    .input(
      z.object({
        percentages: z.array(
          z.object({
            shareholderId: z.string(),
            percentage: z.number().min(0).max(100),
          })
        ),
        reason: z.string().min(10),
      })
    )
    .mutation(async ({ ctx, input }) => {
      requireAdmin(ctx.session);

      const userId = (ctx.session?.user as any)?.id;

      const existing = await ctx.prisma.executiveShareholder.findMany({
        select: { id: true, role: true },
      });

      if (existing.length === 0) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "No executive positions found" });
      }

      // Ensure all positions are covered
      if (input.percentages.length !== existing.length) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Provide percentages for every executive position",
        });
      }

      const total = input.percentages.reduce((sum, p) => sum + p.percentage, 0);
      if (Math.abs(total - 100) > 0.01) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Executive percentages must sum to 100%. Current total: ${total}%`,
        });
      }

      // Update each shareholder's percentage
      for (const { shareholderId, percentage } of input.percentages) {
        await ctx.prisma.executiveShareholder.update({
          where: { id: shareholderId },
          data: { percentage },
        });
      }

      // Log admin action
      await ctx.prisma.revenueAdminAction.create({
        data: {
          adminId: userId,
          actionType: "ADJUST_PERCENTAGES",
          description: `Adjusted executive percentages: ${input.reason}`,
          metadata: {
            percentages: input.percentages,
            reason: input.reason,
          },
        },
      });

      return {
        success: true,
        message: "Executive percentages updated successfully",
      };
    }),

  /**
   * Executive Wallet Withdrawal
   * Allow executives to withdraw from their current balance
   */
  requestWithdrawal: protectedProcedure
    .input(
      z.object({
        shareholderId: z.string(),
        amount: z.number().positive(),
        reason: z.string().min(10),
        bankDetails: z.object({
          bankName: z.string(),
          accountNumber: z.string(),
          accountName: z.string(),
        }).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const userId = (ctx.session?.user as any)?.id;

      // Get shareholder
      const shareholder = await ctx.prisma.executiveShareholder.findUnique({
        where: { id: input.shareholderId },
        include: { User: true },
      });

      if (!shareholder) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Executive shareholder not found",
        });
      }

      // Check if user is admin or the shareholder themselves
      const isAdmin = (ctx.session?.user as any)?.role === "admin";
      const isOwner = shareholder.userId === userId;

      if (!isAdmin && !isOwner) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You can only withdraw from your own wallet",
        });
      }

      // Check sufficient balance
      if (Number(shareholder.currentBalance) < input.amount) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Insufficient balance. Available: ₦${Number(shareholder.currentBalance).toLocaleString()}`,
        });
      }

      // Deduct from balance
      await ctx.prisma.executiveShareholder.update({
        where: { id: input.shareholderId },
        data: {
          currentBalance: { decrement: input.amount },
        },
      });

      // Record withdrawal transaction
      await ctx.prisma.executiveWalletTransaction.create({
        data: {
          shareholderId: input.shareholderId,
          amount: -input.amount, // Negative for withdrawal
          type: "WITHDRAWAL",
          description: input.reason,
          metadata: {
            requestedBy: userId,
            bankDetails: input.bankDetails,
            status: input.amount >= 100000 ? "PENDING_APPROVAL" : "APPROVED",
          },
        },
      });

      // Log admin action
      await ctx.prisma.revenueAdminAction.create({
        data: {
          adminId: userId,
          actionType: "EXECUTIVE_WITHDRAWAL",
          description: `Withdrawal request: ₦${input.amount.toLocaleString()} by ${shareholder.User?.name || shareholder.role}`,
          metadata: {
            shareholderId: input.shareholderId,
            amount: input.amount,
            reason: input.reason,
          },
        },
      });

      return {
        success: true,
        message: input.amount >= 100000
          ? `Withdrawal request of ₦${input.amount.toLocaleString()} submitted for admin approval`
          : `₦${input.amount.toLocaleString()} withdrawn successfully`,
        requiresApproval: input.amount >= 100000,
      };
    }),

  /**
   * Get pools with overdue scheduled distributions (nextDistributionAt <= now)
   */
  getOverduePools: protectedProcedure.query(async ({ ctx }) => {
    requireAdmin(ctx.session);
    const now = new Date();
    // Cast to any because nextDistributionAt / distributionFrequency are new schema fields
    // not yet reflected in generated Prisma TS types
    return (ctx.prisma as any).strategyPool.findMany({
      where: {
        nextDistributionAt: { lte: now },
        isActive: true,
        distributionFrequency: { not: "MANUAL" },
      },
      select: {
        id: true,
        type: true,
        name: true,
        nextDistributionAt: true,
        distributionFrequency: true,
        balance: true,
        Members: {
          where: { isActive: true },
          select: { id: true },
        },
      },
    });
  }),

  /**
   * Sync LEADERSHIP pool member active/inactive status from LeadershipPoolQualification records.
   * Activates members whose isQualified=true and deactivates those with isQualified=false.
   */
  syncLeadershipQualifications: protectedProcedure.mutation(async ({ ctx }) => {
    requireAdmin(ctx.session);

    const pool = await ctx.prisma.strategyPool.findUnique({
      where: { type: "LEADERSHIP" },
      include: { Members: true },
    });

    if (!pool) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Leadership pool not found" });
    }

    const memberUserIds = pool.Members.map((m: any) => m.userId);
    if (memberUserIds.length === 0) {
      return { success: true, activated: 0, deactivated: 0 };
    }

    const qualifications = await ctx.prisma.leadershipPoolQualification.findMany({
      where: { userId: { in: memberUserIds } },
      select: { userId: true, isQualified: true },
    });

    const qualMap = new Map(qualifications.map((q: any) => [q.userId, q.isQualified]));

    let activated = 0;
    let deactivated = 0;

    for (const member of pool.Members) {
      const isQualified = qualMap.get(member.userId);
      if (isQualified === undefined) continue; // No qualification record — leave as-is

      if (isQualified && !member.isActive) {
        await ctx.prisma.poolMember.update({
          where: { id: member.id },
          data: { isActive: true, leftAt: null },
        });
        activated++;
      } else if (!isQualified && member.isActive) {
        await ctx.prisma.poolMember.update({
          where: { id: member.id },
          data: { isActive: false, leftAt: new Date() },
        });
        deactivated++;
      }
    }

    // Audit log
    await ctx.prisma.poolAdminAction.create({
      data: {
        poolId: pool.id,
        adminId: ctx.session!.user.id,
        actionType: "QUALIFICATIONS_SYNCED",
        description: `Synced leadership qualifications: ${activated} activated, ${deactivated} deactivated`,
        metadata: JSON.parse(JSON.stringify({ activated, deactivated, syncedAt: new Date().toISOString() })),
      },
    });

    return { success: true, activated, deactivated };
  }),

  /**
   * Get executive wallet transactions (for the logged-in executive or admin)
   */
  getMyWalletTransactions: protectedProcedure
    .input(
      z.object({
        limit: z.number().default(50),
      })
    )
    .query(async ({ ctx, input }) => {
      const userId = (ctx.session?.user as any)?.id;
      const isAdmin = (ctx.session?.user as any)?.role === "admin";

      // Find shareholder for this user
      const shareholder = await ctx.prisma.executiveShareholder.findUnique({
        where: { userId },
      });

      if (!shareholder && !isAdmin) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "You are not an executive shareholder",
        });
      }

      // If admin, return all transactions; otherwise only user's transactions
      const transactions = await ctx.prisma.executiveWalletTransaction.findMany({
        where: isAdmin ? {} : { shareholderId: shareholder!.id },
        include: {
          Shareholder: {
            include: {
              User: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: "desc" },
        take: input.limit,
      });

      return transactions;
    }),
});

/**
 * Helper: Get percentage for executive role
 */
function getRolePercentage(
  role: string
): number {
  const normalized = normalizeRoleName(role);
  const percentages = {
    CEO: 30,
    CTO: 20,
    HEAD_OF_TRAVEL: 20,
    CMO: 10,
    OLIVER: 5,
    MORRISON: 5,
    ANNIE: 10,
  } as Record<string, number>;
  return percentages[normalized] ?? 0;
}

/**
 * Normalize role display string into a consistent key
 */
function normalizeRoleName(role: string): string {
  return role.trim().toUpperCase().replace(/\s+/g, "_");
}
