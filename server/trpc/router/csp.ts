import { z } from "zod";
import { randomUUID } from "crypto";
import { prisma } from "@/lib/prisma";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { recordRevenue } from "@/server/services/revenue.service";
import {
  notifyCspBroadcastExtended,
  notifyCspContributionReceived,
  notifyCspContributionSent,
  notifyCspRequestApproved,
  notifyCspRequestRejected,
  notifyCspRequestSubmitted,
} from "@/server/services/notification.service";

const MIN_PER_CONTRIBUTION = 500;
const MIN_CUMULATIVE_CONTRIBUTION = 10000;

const CATEGORY_RULES = {
  national: { label: "National", minMembership: "regular plus", minDirects: 10, minThreshold: 10000, broadcastHours: 48 },
  global: { label: "Global", minMembership: "gold", minDirects: 20, minThreshold: 20000, broadcastHours: 48 },
} as const;

type CategoryKey = keyof typeof CATEGORY_RULES;

const MEMBERSHIP_ORDER = ["basic", "regular", "regular plus", "gold", "platinum", "platinum plus"] as const;

type MembershipOrder = typeof MEMBERSHIP_ORDER[number];

function assertAdmin(session: any) {
  const role = session?.user?.role;
  if (!role || (role !== "admin" && role !== "superadmin")) {
    throw new Error("FORBIDDEN");
  }
}

const SYSTEM_WALLET_SPLITS: Array<{ name: string; pct: number; walletType: string }> = [
  { name: "CSP Admin Wallet", pct: 0.05, walletType: "CSP_ADMIN" },
  { name: "CSP Sponsor Wallet", pct: 0.01, walletType: "CSP_SPONSOR" },
  { name: "CSP State Wallet", pct: 0.02, walletType: "CSP_STATE" },
  { name: "CSP Management Wallet", pct: 0.05, walletType: "CSP_MANAGEMENT" },
  { name: "CSP Reserve Wallet", pct: 0.07, walletType: "CSP_RESERVE" },
];

function normalizeMembership(value?: string | null): MembershipOrder | null {
  if (!value) return null;
  const normalized = value.trim().toLowerCase();
  return MEMBERSHIP_ORDER.find((m) => m === normalized) ?? null;
}

function meetsMembership(current: MembershipOrder | null, required: MembershipOrder) {
  if (!current) return false;
  const currentIndex = MEMBERSHIP_ORDER.indexOf(current);
  const requiredIndex = MEMBERSHIP_ORDER.indexOf(required);
  return currentIndex >= requiredIndex;
}

async function ensureSystemWallet(tx: any, name: string, walletType: string) {
  return tx.systemWallet.upsert({
    where: { name },
    update: {},
    create: {
      id: randomUUID(),
      name,
      walletType,
      balanceNgn: 0,
      balanceUsd: 0,
      balanceBpt: 0,
    },
  });
}

function computeEligibilityFlags(params: {
  category: CategoryKey;
  membership: MembershipOrder | null;
  membershipActive: boolean;
  directReferrals: number;
  cumulativeContributions: number;
}) {
  const { category, membership, membershipActive, directReferrals, cumulativeContributions } = params;
  const rules = CATEGORY_RULES[category];
  const hasMembership = membershipActive && meetsMembership(membership, rules.minMembership as MembershipOrder);
  const hasDirects = directReferrals >= rules.minDirects;
  const hasContrib = cumulativeContributions >= MIN_CUMULATIVE_CONTRIBUTION;
  const eligible = hasMembership && hasDirects && hasContrib;
  return { eligible, hasMembership, hasDirects, hasContrib, rules };
}

export const cspRouter = createTRPCRouter({
  getEligibility: protectedProcedure.query(async ({ ctx }) => {
    const userId = (ctx.session?.user as any)?.id as string | undefined;
    if (!userId) throw new Error("UNAUTHORIZED");

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        activeMembershipPackageId: true,
        membershipActivatedAt: true,
      },
    });

    const membershipName = user?.activeMembershipPackageId
      ? (await prisma.membershipPackage.findUnique({
          where: { id: user.activeMembershipPackageId },
          select: { name: true },
        }))?.name ?? null
      : null;

    const membership = normalizeMembership(membershipName);
    const membershipActive = Boolean(user?.membershipActivatedAt && membershipName);

    const directReferrals = await prisma.referral.count({ where: { referrerId: userId } });
    const contributionAggregate = await prisma.cspContribution.aggregate({
      where: { contributorId: userId },
      _sum: { amount: true },
    });
    const cumulativeContributions = contributionAggregate._sum.amount ?? 0;

    const categories = {
      national: computeEligibilityFlags({ category: "national", membership, membershipActive, directReferrals, cumulativeContributions }),
      global: computeEligibilityFlags({ category: "global", membership, membershipActive, directReferrals, cumulativeContributions }),
    } as const;

    return {
      membershipName,
      membershipLabel: membershipName ?? "No active membership",
      membershipActive,
      directReferrals,
      cumulativeContributions,
      minContributionRequired: MIN_CUMULATIVE_CONTRIBUTION,
      minPerContribution: MIN_PER_CONTRIBUTION,
      categories,
    };
  }),

  submitRequest: protectedProcedure
    .input(z.object({
      category: z.enum(["national", "global"]),
      amount: z.number().int().positive(),
      purpose: z.string().min(3),
      notes: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const userId = (ctx.session?.user as any)?.id as string | undefined;
      if (!userId) throw new Error("UNAUTHORIZED");

      const eligibility = await prisma.user.findUnique({
        where: { id: userId },
        select: { activeMembershipPackageId: true, membershipActivatedAt: true },
      });

      const membershipName = eligibility?.activeMembershipPackageId
        ? (await prisma.membershipPackage.findUnique({ where: { id: eligibility.activeMembershipPackageId }, select: { name: true } }))?.name ?? null
        : null;

      const membership = normalizeMembership(membershipName);
      const membershipActive = Boolean(eligibility?.membershipActivatedAt && membershipName);

      const directReferrals = await prisma.referral.count({ where: { referrerId: userId } });
      const contributionAggregate = await prisma.cspContribution.aggregate({ where: { contributorId: userId }, _sum: { amount: true } });
      const cumulativeContributions = contributionAggregate._sum.amount ?? 0;

      const eligibilityFlags = computeEligibilityFlags({
        category: input.category,
        membership,
        membershipActive,
        directReferrals,
        cumulativeContributions,
      });

      if (!eligibilityFlags.eligible) {
        throw new Error("You do not meet the eligibility requirements for this category.");
      }

      const rule = CATEGORY_RULES[input.category];
      const thresholdAmount = Math.max(input.amount, rule.minThreshold);

      const existingActive = await prisma.cspSupportRequest.findFirst({
        where: {
          userId,
          status: { in: ["pending", "broadcasting", "approved"] },
        },
      });

      if (existingActive) {
        throw new Error("You already have an active or pending support request.");
      }

      const request = await prisma.cspSupportRequest.create({
        data: {
          userId,
          category: input.category,
          amount: thresholdAmount,
          purpose: input.purpose,
          notes: input.notes,
          status: "pending",
          thresholdAmount,
          raisedAmount: 0,
          contributorsCount: 0,
        },
      });

      await notifyCspRequestSubmitted(userId, input.category, thresholdAmount);

      return { requestId: request.id, status: request.status };
    }),

  approveRequest: protectedProcedure
    .input(z.object({ requestId: z.string(), broadcastHours: z.number().int().positive().optional() }))
    .mutation(async ({ ctx, input }) => {
      assertAdmin(ctx.session);

      const request = await prisma.cspSupportRequest.findUnique({ where: { id: input.requestId } });
      if (!request) throw new Error("Request not found");

      const rule = CATEGORY_RULES[request.category as CategoryKey] ?? CATEGORY_RULES.national;
      const hours = input.broadcastHours ?? rule.broadcastHours;
      const broadcastExpiresAt = new Date(Date.now() + hours * 60 * 60 * 1000);

      const updated = await prisma.cspSupportRequest.update({
        where: { id: request.id },
        data: {
          status: "broadcasting",
          broadcastExpiresAt,
          approvedAt: new Date(),
          approvedBy: (ctx.session?.user as any)?.id ?? "admin",
        },
      });

      await notifyCspRequestApproved(request.userId, request.category, request.thresholdAmount, broadcastExpiresAt);

      return { requestId: updated.id, status: updated.status, broadcastExpiresAt: updated.broadcastExpiresAt };
    }),

  adminListRequests: protectedProcedure
    .input(
      z
        .object({
          status: z.array(z.enum(["pending", "approved", "broadcasting", "closed", "rejected"])).optional(),
          page: z.number().int().positive().optional(),
          pageSize: z.number().int().positive().max(100).optional(),
        })
        .optional()
    )
    .query(async ({ ctx, input }) => {
      assertAdmin(ctx.session);

      const page = input?.page ?? 1;
      const pageSize = input?.pageSize ?? 20;
      const skip = (page - 1) * pageSize;
      const statusFilter = input?.status ?? ["pending", "approved", "broadcasting"];

      const [items, total] = await prisma.$transaction([
        prisma.cspSupportRequest.findMany({
          where: { 
            status: { in: statusFilter },
            // Include both user requests and active admin defaults
          },
          include: {
            User: { select: { id: true, name: true, email: true, activeMembershipPackageId: true } },
            Contributions: { select: { amount: true } },
          },
          orderBy: [
            { isAdminDefault: "desc" }, // Admin defaults first
            { createdAt: "desc" }
          ],
          skip,
          take: pageSize,
        }),
        prisma.cspSupportRequest.count({ where: { status: { in: statusFilter } } }),
      ]);

      return { items, total, page, pageSize };
    }),

  getLiveStatus: protectedProcedure
    .input(z.object({ requestId: z.string().optional() }).optional())
    .query(async ({ ctx, input }) => {
      const userId = (ctx.session?.user as any)?.id as string | undefined;
      if (!userId) throw new Error("UNAUTHORIZED");

      const request = input?.requestId
        ? await prisma.cspSupportRequest.findFirst({ where: { id: input.requestId, userId } })
        : await prisma.cspSupportRequest.findFirst({
            where: { userId, status: { in: ["broadcasting", "approved", "pending"] } },
            orderBy: { createdAt: "desc" },
          });

      if (!request) return null;

      const remainingSeconds = request.broadcastExpiresAt
        ? Math.max(0, Math.floor((request.broadcastExpiresAt.getTime() - Date.now()) / 1000))
        : null;

      return {
        requestId: request.id,
        category: request.category,
        status: request.status,
        amount: request.amount,
        thresholdAmount: request.thresholdAmount,
        raisedAmount: request.raisedAmount,
        contributorsCount: request.contributorsCount,
        broadcastExpiresAt: request.broadcastExpiresAt,
        approvedAt: request.approvedAt,
        remainingSeconds,
        remainingAmount: Math.max(0, request.thresholdAmount - request.raisedAmount),
      };
    }),

  listHistory: protectedProcedure
    .input(z.object({ page: z.number().int().positive().optional(), pageSize: z.number().int().positive().max(50).optional() }).optional())
    .query(async ({ ctx, input }) => {
      const userId = (ctx.session?.user as any)?.id as string | undefined;
      if (!userId) throw new Error("UNAUTHORIZED");

      const page = input?.page ?? 1;
      const pageSize = input?.pageSize ?? 10;
      const skip = (page - 1) * pageSize;

      const [items, total] = await prisma.$transaction([
        prisma.cspSupportRequest.findMany({
          where: { userId },
          orderBy: { createdAt: "desc" },
          skip,
          take: pageSize,
        }),
        prisma.cspSupportRequest.count({ where: { userId } }),
      ]);

      return { items, total, page, pageSize };
    }),

  contribute: protectedProcedure
    .input(
      z.object({
        requestId: z.string(),
        amount: z.number().int().positive(),
        walletType: z.enum(["community", "wallet"]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const contributorId = (ctx.session?.user as any)?.id as string | undefined;
      if (!contributorId) throw new Error("UNAUTHORIZED");

      if (input.amount < MIN_PER_CONTRIBUTION) {
        throw new Error(`Minimum contribution is ₦${MIN_PER_CONTRIBUTION.toLocaleString()}`);
      }

      const request = await prisma.cspSupportRequest.findUnique({
        where: { id: input.requestId },
        include: { User: true },
      });

      if (!request) throw new Error("Support request not found");
      if (request.status !== "broadcasting") throw new Error("This request is not currently accepting contributions");
      
      // Admin default requests don't have expiry, regular requests do
      if (!request.isAdminDefault && request.broadcastExpiresAt && request.broadcastExpiresAt.getTime() < Date.now()) {
        await prisma.cspSupportRequest.update({ where: { id: request.id }, data: { status: "closed" } });
        throw new Error("Broadcast window has expired");
      }
      
      if (request.userId === contributorId) {
        throw new Error("You cannot contribute to your own support request");
      }

      const contributor = await prisma.user.findUnique({
        where: { id: contributorId },
        select: { wallet: true, community: true },
      });

      if (!contributor) throw new Error("Contributor not found");
      const sourceBalance = input.walletType === "community" ? contributor.community : contributor.wallet;
      if (sourceBalance < input.amount) {
        throw new Error("Insufficient balance in selected wallet");
      }

      const recipientShare = Math.floor(input.amount * 0.8);
      const splitPool = input.amount - recipientShare;

      const result = await prisma.$transaction(async (tx) => {
        await tx.user.update({
          where: { id: contributorId },
          data: { [input.walletType]: { decrement: input.amount } },
        });

        await tx.user.update({
          where: { id: request.userId },
          data: { community: { increment: recipientShare } },
        });

        const contribution = await tx.cspContribution.create({
          data: {
            requestId: request.id,
            contributorId,
            amount: input.amount,
            walletType: input.walletType,
          },
        });

        const updatedRequest = await tx.cspSupportRequest.update({
          where: { id: request.id },
          data: {
            raisedAmount: { increment: input.amount },
            contributorsCount: { increment: 1 },
          },
        });

        await tx.transaction.create({
          data: {
            id: randomUUID(),
            userId: contributorId,
            transactionType: "CSP_CONTRIBUTION",
            amount: -input.amount,
            description: `CSP contribution to request ${request.id}`,
            status: "completed",
            walletType: input.walletType,
          },
        });

        await tx.transaction.create({
          data: {
            id: randomUUID(),
            userId: request.userId,
            transactionType: "CSP_SUPPORT_INFLOW",
            amount: recipientShare,
            description: `CSP support received from contributor ${contributorId}`,
            status: "completed",
            walletType: "community",
          },
        });

        for (const split of SYSTEM_WALLET_SPLITS) {
          const share = Math.floor(splitPool * split.pct);
          if (share <= 0) continue;
          const systemWallet = await ensureSystemWallet(tx, split.name, split.walletType);
          await tx.systemWallet.update({
            where: { id: systemWallet.id },
            data: { balanceNgn: { increment: share } },
          });
        }

        if (updatedRequest.raisedAmount >= updatedRequest.thresholdAmount) {
          await tx.cspSupportRequest.update({ where: { id: updatedRequest.id }, data: { status: "closed" } });
        }

        return { contribution, updatedRequest };
      });

      await notifyCspContributionSent(contributorId, input.amount, input.walletType);
      await notifyCspContributionReceived(request.userId, input.amount);

      // Record revenue from CSP contribution (system wallet share)
      await recordRevenue(prisma, {
        source: "COMMUNITY_SUPPORT",
        amount: splitPool, // The 20% that went to system wallets
        currency: "NGN",
        sourceId: result.contribution.id,
        description: `CSP system share from contribution ${result.contribution.id}`,
      });

      return {
        success: true,
        contributionId: result.contribution.id,
        requestId: request.id,
      };
    }),

  extendBroadcast: protectedProcedure
    .input(z.object({ requestId: z.string(), hours: z.number().int().positive().max(168), reason: z.enum(["paid", "referrals"]), value: z.number().int().optional() }))
    .mutation(async ({ ctx, input }) => {
      assertAdmin(ctx.session);

      const updated = await prisma.$transaction(async (tx) => {
        const request = await tx.cspSupportRequest.findUnique({ where: { id: input.requestId } });
        if (!request) throw new Error("Request not found");
        if (request.status !== "broadcasting") throw new Error("Only broadcasting requests can be extended");

        const baseDate = request.broadcastExpiresAt && request.broadcastExpiresAt > new Date() ? request.broadcastExpiresAt : new Date();
        const broadcastExpiresAt = new Date(baseDate.getTime() + input.hours * 60 * 60 * 1000);

        const saved = await tx.cspSupportRequest.update({ where: { id: request.id }, data: { broadcastExpiresAt } });

        await tx.cspBroadcastExtension.create({
          data: {
            requestId: request.id,
            type: input.reason,
            value: input.value,
            hoursGranted: input.hours,
          },
        });

        return saved;
      });

      await notifyCspBroadcastExtended(updated.userId, input.hours);

      return { requestId: updated.id, broadcastExpiresAt: updated.broadcastExpiresAt, reason: input.reason, value: input.value };
    }),

  // Admin-only: Create default/base CSP requests that bypass all criteria
  createAdminDefaultRequest: protectedProcedure
    .input(z.object({
      userId: z.string().optional(), // Can use system user or specific user
      category: z.enum(["national", "global"]),
      amount: z.number().int().positive(),
      purpose: z.string().min(3),
      notes: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      assertAdmin(ctx.session);

      // Use provided userId or create a system CSP user
      let targetUserId = input.userId;
      if (!targetUserId) {
        // Check if system CSP user exists
        let systemUser = await prisma.user.findFirst({
          where: { email: "csp-system@beepagroafrica.com" },
        });

        if (!systemUser) {
          // Create system CSP user
          systemUser = await prisma.user.create({
            data: {
              id: randomUUID(),
              email: "csp-system@beepagroafrica.com",
              name: "CSP System",
              userType: "user",
              activated: true,
            },
          });
        }
        targetUserId = systemUser.id;
      }

      const rule = CATEGORY_RULES[input.category];
      const thresholdAmount = Math.max(input.amount, rule.minThreshold);

      const request = await prisma.cspSupportRequest.create({
        data: {
          userId: targetUserId,
          category: input.category,
          amount: thresholdAmount,
          purpose: input.purpose,
          notes: input.notes,
          status: "broadcasting", // Auto-approved
          thresholdAmount,
          raisedAmount: 0,
          contributorsCount: 0,
          isAdminDefault: true,
          isActive: true,
          approvedBy: (ctx.session?.user as any)?.id ?? "admin",
          approvedAt: new Date(),
          // No broadcast expiry - remains until goal met or admin turns off
          broadcastExpiresAt: null,
        },
      });

      return { requestId: request.id, status: request.status };
    }),

  // Admin-only: Toggle active status of default requests
  toggleAdminDefaultRequest: protectedProcedure
    .input(z.object({
      requestId: z.string(),
      isActive: z.boolean(),
    }))
    .mutation(async ({ ctx, input }) => {
      assertAdmin(ctx.session);

      const request = await prisma.cspSupportRequest.findUnique({
        where: { id: input.requestId },
      });

      if (!request) throw new Error("Request not found");
      if (!request.isAdminDefault) throw new Error("Only admin default requests can be toggled");

      const updated = await prisma.cspSupportRequest.update({
        where: { id: input.requestId },
        data: {
          isActive: input.isActive,
          status: input.isActive ? "broadcasting" : "closed",
        },
      });

      return { requestId: updated.id, isActive: updated.isActive, status: updated.status };
    }),

  // Admin-only: Mark default request as complete
  markAdminDefaultComplete: protectedProcedure
    .input(z.object({
      requestId: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      assertAdmin(ctx.session);

      const request = await prisma.cspSupportRequest.findUnique({
        where: { id: input.requestId },
      });

      if (!request) throw new Error("Request not found");
      if (!request.isAdminDefault) throw new Error("Only admin default requests can be marked complete");

      const updated = await prisma.cspSupportRequest.update({
        where: { id: input.requestId },
        data: {
          status: "closed",
          isActive: false,
        },
      });

      return { requestId: updated.id, status: updated.status };
    }),

  // Reject a CSP request with reason
  rejectRequest: protectedProcedure
    .input(z.object({ requestId: z.string().uuid(), reason: z.string().min(10).max(500) }))
    .mutation(async ({ input, ctx }) => {
      assertAdmin(ctx.session);

      const request = await prisma.cspSupportRequest.findUnique({
        where: { id: input.requestId },
        include: { User: true },
      });

      if (!request) throw new Error("Request not found");
      if (request.status !== "pending") throw new Error("Only pending requests can be rejected");

      // Delete the request from database
      await prisma.cspSupportRequest.delete({
        where: { id: input.requestId },
      });

      // Send email and notification to user
      await notifyCspRequestRejected(
        request.userId,
        request.category,
        input.reason
      );

      return { success: true };
    }),

  // List all admin default requests
  listAdminDefaultRequests: protectedProcedure
    .query(async ({ ctx }) => {
      assertAdmin(ctx.session);

      const requests = await prisma.cspSupportRequest.findMany({
        where: { isAdminDefault: true },
        include: {
          User: { select: { id: true, name: true, email: true } },
          Contributions: { select: { amount: true, contributorId: true, createdAt: true } },
        },
        orderBy: { createdAt: "desc" },
      });

      return requests;
    }),
});
