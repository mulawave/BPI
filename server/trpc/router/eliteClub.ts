/**
 * BPI Elite Club tRPC Router
 * Covers all spec sections from v1.3 + v1.4:
 *  – Club Formation & Lifecycle
 *  – Eligibility Checks & Applications
 *  – Document & Token Verification
 *  – Member Contributions
 *  – Rotation Scheduling & Payouts
 *  – Rotation Swaps & Opt-Outs
 *  – Investment Pool Allocation
 *  – Investment Recommendation & Governance
 *  – Credibility Score System
 *  – Guarantor Eligibility & Assignment
 *  – Defaults, Legal Events & Suspension
 *  – Admin CMS Settings
 */

import { z } from "zod";
import { randomUUID } from "crypto";
import { prisma } from "@/lib/prisma";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { recordRevenue } from "@/server/services/revenue.service";
import {
  sendNotification,
} from "@/server/services/notification.service";
import {
  EliteClubTier,
  EliteClubFormationStatus,
  EliteClubStatus,
  EliteClubMemberStatus,
  EliteClubAppStatus,
  EliteClubDocType,
  EliteClubContribStatus,
  EliteClubPayoutStatus,
  EliteClubSwapStatus,
  EliteClubInvestmentCategory,
  EliteClubInvestmentStatus,
  EliteClubVoteChoice,
  EliteClubCredEventType,
  EliteClubTokenVerifMethod,
} from "@prisma/client";

// ─── Helpers ────────────────────────────────────────────────────────────────

function assertAdmin(session: any) {
  const role = session?.user?.role;
  if (!role || (role !== "admin" && role !== "superadmin")) {
    throw new Error("FORBIDDEN");
  }
}

function assertMember(session: any) {
  if (!session?.user?.id) throw new Error("UNAUTHORIZED");
}

/** Load numeric CMS setting with fallback */
async function loadNumericSetting(key: string, fallback: number): Promise<number> {
  const row = await prisma.adminSettings.findUnique({ where: { settingKey: key } });
  if (!row) return fallback;
  const v = parseFloat(row.settingValue ?? "");
  return isFinite(v) && v > 0 ? v : fallback;
}

/** Load string CMS setting with fallback */
async function loadStringSetting(key: string, fallback: string): Promise<string> {
  const row = await prisma.adminSettings.findUnique({ where: { settingKey: key } });
  return row?.settingValue ?? fallback;
}

/** Adjust credibility score and write audit event (clamped 0–10) */
async function adjustCredibility(
  tx: any,
  memberId: string,
  event: EliteClubCredEventType,
  delta: number,
  reason?: string,
  referenceId?: string,
) {
  const member = await tx.eliteClubMember.findUnique({ where: { id: memberId } });
  if (!member) return;
  const scoreBefore = Number(member.credibilityScore);
  const scoreAfter = Math.min(10, Math.max(0, scoreBefore + delta));
  await tx.eliteClubMember.update({
    where: { id: memberId },
    data: { credibilityScore: scoreAfter },
  });
  await tx.eliteClubCredibilityEvent.create({
    data: {
      id: randomUUID(),
      memberId,
      event,
      delta,
      scoreBefore,
      scoreAfter,
      reason,
      referenceId,
    },
  });
}

// ─── Tier thresholds (from spec) ─────────────────────────────────────────────

const TIER_THRESHOLDS: Record<EliteClubTier, { bpt: number; pac: number; monthly: number; clubSize: number }> = {
  SILVER:   { bpt: 1000,  pac: 500,  monthly: 50_000,  clubSize: 11 },
  GOLD:     { bpt: 5000,  pac: 2000, monthly: 100_000, clubSize: 11 },
  PLATINUM: { bpt: 15000, pac: 5000, monthly: 250_000, clubSize: 11 },
  DIAMOND:  { bpt: 50000, pac: 20000, monthly: 500_000, clubSize: 11 },
};

// ─── Router ──────────────────────────────────────────────────────────────────

export const eliteClubRouter = createTRPCRouter({

  // ── 1. CLUB FORMATION & LIFECYCLE ─────────────────────────────────────────

  /** Get overall formation status + tier-specific club counts */
  getFormationStatus: protectedProcedure.query(async ({ ctx }) => {
    const [formationSetting, clubs] = await Promise.all([
      prisma.adminSettings.findUnique({ where: { settingKey: "elite_club_formation_status" } }),
      prisma.eliteClub.groupBy({
        by: ["tier", "status"],
        _count: { id: true },
      }),
    ]);
    const status = (formationSetting?.settingValue as EliteClubFormationStatus) ?? "OPEN";
    return { formationStatus: status, tierBreakdown: clubs };
  }),

  /** Admin: set formation open/paused/closed */
  setFormationStatus: protectedProcedure
    .input(z.object({ status: z.enum(["OPEN", "PAUSED", "CLOSED"]) }))
    .mutation(async ({ ctx, input }) => {
      assertAdmin(ctx.session);
      await prisma.adminSettings.upsert({
        where: { settingKey: "elite_club_formation_status" },
        create: {
          id: randomUUID(),
          settingKey: "elite_club_formation_status",
          settingValue: input.status,
          updatedAt: new Date(),
        },
        update: { settingValue: input.status, updatedAt: new Date() },
      });
      return { success: true };
    }),

  /** Admin: create a new club for a tier */
  createClub: protectedProcedure
    .input(z.object({
      tier: z.nativeEnum(EliteClubTier),
      name: z.string().min(3).max(80),
    }))
    .mutation(async ({ ctx, input }) => {
      assertAdmin(ctx.session);
      const club = await prisma.eliteClub.create({
        data: {
          id: randomUUID(),
          tier: input.tier,
          name: input.name,
          status: "FORMING",
          formationStatus: "OPEN",
          membersCount: 0,
        },
      });
      return { club };
    }),

  /** Admin: activate a club once 11 members are confirmed */
  activateClub: protectedProcedure
    .input(z.object({ clubId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      assertAdmin(ctx.session);
      const club = await prisma.eliteClub.findUnique({ where: { id: input.clubId } });
      if (!club) throw new Error("Club not found");
      if (club.membersCount < 11) throw new Error("Club must have exactly 11 members to activate");
      const updated = await prisma.eliteClub.update({
        where: { id: input.clubId },
        data: { status: "ACTIVE", activatedAt: new Date(), formationStatus: "CLOSED" },
      });
      // Notify all members
      const members = await prisma.eliteClubMember.findMany({ where: { clubId: input.clubId } });
      await Promise.all(
        members.map((m) =>
          sendNotification({
            userId: m.userId,
            type: "ELITE_CLUB_ACTIVATED" as any,
            title: "Your Elite Club is now Active!",
            message: `Your ${club.tier} tier Elite Club "${club.name}" has been activated. Your empowerment rotation journey begins!`,
            actionUrl: "/elite-club",
          }),
        ),
      );
      return { club: updated };
    }),

  /** Admin: suspend or dissolve a club */
  updateClubStatus: protectedProcedure
    .input(z.object({
      clubId: z.string(),
      status: z.enum(["ACTIVE", "SUSPENDED", "DISSOLVED"]),
      reason: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      assertAdmin(ctx.session);
      const updated = await prisma.eliteClub.update({
        where: { id: input.clubId },
        data: { status: input.status as EliteClubStatus },
      });
      return { club: updated };
    }),

  /** Admin: list all clubs with filters */
  adminListClubs: protectedProcedure
    .input(z.object({
      tier: z.nativeEnum(EliteClubTier).optional(),
      status: z.nativeEnum(EliteClubStatus).optional(),
      page: z.number().int().min(1).default(1),
      pageSize: z.number().int().min(1).max(100).default(20),
    }))
    .query(async ({ ctx, input }) => {
      assertAdmin(ctx.session);
      const where: any = {};
      if (input.tier) where.tier = input.tier;
      if (input.status) where.status = input.status;
      const [clubs, total] = await Promise.all([
        prisma.eliteClub.findMany({
          where,
          skip: (input.page - 1) * input.pageSize,
          take: input.pageSize,
          orderBy: { createdAt: "desc" },
          include: { _count: { select: { members: true, applications: true } } },
        }),
        prisma.eliteClub.count({ where }),
      ]);
      return { clubs, total, page: input.page, pageSize: input.pageSize };
    }),

  /** Member: get clubs I'm in */
  myClubs: protectedProcedure.query(async ({ ctx }) => {
    assertMember(ctx.session);
    const userId = ctx.session!.user.id;
    const memberships = await prisma.eliteClubMember.findMany({
      where: { userId, status: { notIn: [EliteClubMemberStatus.OPTED_OUT, EliteClubMemberStatus.REPLACED] } },
      include: {
        club: { include: { _count: { select: { members: true } } } },
      },
    });
    return { memberships };
  }),

  // ── 2. ELIGIBILITY & APPLICATION ──────────────────────────────────────────

  /** Check if current user is eligible to apply for a tier */
  checkEligibility: protectedProcedure
    .input(z.object({ tier: z.nativeEnum(EliteClubTier) }))
    .query(async ({ ctx, input }) => {
      assertMember(ctx.session);
      const userId = ctx.session!.user.id;
      const thresholds = TIER_THRESHOLDS[input.tier];

      // Check token holdings
      const holdings = await prisma.eliteClubTokenHolding.findFirst({
        where: { userId, tier: input.tier, adminApproved: true },
      });
      const hasBpt = holdings ? Number(holdings.bptAmount) >= thresholds.bpt : false;
      const hasPac = holdings ? Number(holdings.pacTokenAmount) >= thresholds.pac : false;

      // Check existing membership (no duplicate clubs)
      const existingMember = await prisma.eliteClubMember.findFirst({
        where: { userId, club: { tier: input.tier }, status: "ACTIVE" },
      });
      const alreadyMember = !!existingMember;

      // Check pending application
      const pendingApp = await prisma.eliteClubApplication.findFirst({
        where: { userId, tier: input.tier, status: "PENDING" },
      });
      const hasPendingApp = !!pendingApp;

      const eligible = hasBpt && hasPac && !alreadyMember && !hasPendingApp;
      return {
        eligible,
        hasBpt,
        hasPac,
        alreadyMember,
        hasPendingApp,
        required: thresholds,
        current: holdings
          ? { bpt: Number(holdings.bptAmount), pac: Number(holdings.pacTokenAmount) }
          : { bpt: 0, pac: 0 },
      };
    }),

  /** Submit an application to join a tier club */
  submitApplication: protectedProcedure
    .input(z.object({
      tier: z.nativeEnum(EliteClubTier),
      notes: z.string().max(500).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      assertMember(ctx.session);
      const userId = ctx.session!.user.id;

      // Block duplicate pending
      const existing = await prisma.eliteClubApplication.findFirst({
        where: { userId, tier: input.tier, status: { in: ["PENDING", "APPROVED"] } },
      });
      if (existing) throw new Error("You already have an active application for this tier.");

      const app = await prisma.eliteClubApplication.create({
        data: {
          id: randomUUID(),
          userId,
          tier: input.tier,
          status: "PENDING",
          notes: input.notes,
          submittedAt: new Date(),
          updatedAt: new Date(),
        },
      });
      await sendNotification({
        userId,
        type: "ELITE_CLUB_APP_SUBMITTED" as any,
        title: "Elite Club Application Submitted",
        message: `Your ${input.tier} tier application is under review. You will be notified once a decision is made.`,
        actionUrl: "/elite-club/application",
      });
      return { application: app };
    }),

  /** Upload a document for an application */
  uploadDocument: protectedProcedure
    .input(z.object({
      applicationId: z.string(),
      docType: z.nativeEnum(EliteClubDocType),
      fileUrl: z.string().url(),
    }))
    .mutation(async ({ ctx, input }) => {
      assertMember(ctx.session);
      const userId = ctx.session!.user.id;
      const app = await prisma.eliteClubApplication.findUnique({ where: { id: input.applicationId } });
      if (!app || app.userId !== userId) throw new Error("Application not found.");
      const doc = await prisma.eliteClubDocument.create({
        data: {
          id: randomUUID(),
          applicationId: input.applicationId,
          docType: input.docType,
          fileUrl: input.fileUrl,
          uploadedAt: new Date(),
        },
      });
      return { document: doc };
    }),

  /** Submit token holding proof */
  submitTokenHolding: protectedProcedure
    .input(z.object({
      tier: z.nativeEnum(EliteClubTier),
      applicationId: z.string().optional(),
      bptAmount: z.number().min(0),
      pacTokenAmount: z.number().min(0),
      verificationMethod: z.nativeEnum(EliteClubTokenVerifMethod),
      proofUrl: z.string().url().optional(),
      walletAddress: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      assertMember(ctx.session);
      const userId = ctx.session!.user.id;
      const holding = await prisma.eliteClubTokenHolding.create({
        data: {
          id: randomUUID(),
          userId,
          applicationId: input.applicationId,
          tier: input.tier,
          bptAmount: input.bptAmount,
          pacTokenAmount: input.pacTokenAmount,
          verificationMethod: input.verificationMethod,
          proofUrl: input.proofUrl,
          walletAddress: input.walletAddress,
          adminApproved: false,
          createdAt: new Date(),
        },
      });
      return { holding };
    }),

  /** Admin: approve token holding */
  adminApproveTokenHolding: protectedProcedure
    .input(z.object({ holdingId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      assertAdmin(ctx.session);
      const updated = await prisma.eliteClubTokenHolding.update({
        where: { id: input.holdingId },
        data: {
          adminApproved: true,
          adminApprovedBy: ctx.session!.user.id,
          verifiedAt: new Date(),
        },
      });
      // Update linked application
      if (updated.applicationId) {
        await prisma.eliteClubApplication.update({
          where: { id: updated.applicationId },
          data: { bptVerified: true, pacTokenVerified: true, updatedAt: new Date() },
        });
      }
      await sendNotification({
        userId: updated.userId,
        type: "ELITE_CLUB_TOKEN_VERIFIED" as any,
        title: "Token Holdings Verified",
        message: `Your BPT/PACToken holdings for ${updated.tier} tier have been verified by admin.`,
        actionUrl: "/elite-club/application",
      });
      return { success: true };
    }),

  /** Admin: list pending applications */
  adminListApplications: protectedProcedure
    .input(z.object({
      status: z.nativeEnum(EliteClubAppStatus).optional(),
      tier: z.nativeEnum(EliteClubTier).optional(),
      page: z.number().int().min(1).default(1),
      pageSize: z.number().int().min(1).max(100).default(20),
    }))
    .query(async ({ ctx, input }) => {
      assertAdmin(ctx.session);
      const where: any = {};
      if (input.status) where.status = input.status;
      if (input.tier) where.tier = input.tier;
      const [apps, total] = await Promise.all([
        prisma.eliteClubApplication.findMany({
          where,
          skip: (input.page - 1) * input.pageSize,
          take: input.pageSize,
          orderBy: { submittedAt: "desc" },
          include: {
            user: { select: { id: true, name: true, email: true } },
            documents: true,
            tokenHoldings: true,
          },
        }),
        prisma.eliteClubApplication.count({ where }),
      ]);
      return { applications: apps, total, page: input.page, pageSize: input.pageSize };
    }),

  /** Admin: approve application and assign to a club + rotation number */
  approveApplication: protectedProcedure
    .input(z.object({
      applicationId: z.string(),
      clubId: z.string(),
      rotationNumber: z.number().int().min(1).max(11),
    }))
    .mutation(async ({ ctx, input }) => {
      assertAdmin(ctx.session);
      const adminId = ctx.session!.user.id;

      const app = await prisma.eliteClubApplication.findUnique({ where: { id: input.applicationId } });
      if (!app) throw new Error("Application not found.");
      if (app.status !== "PENDING") throw new Error("Application is not pending.");

      // Verify rotation slot is available
      const existingMember = await prisma.eliteClubMember.findUnique({
        where: { clubId_rotationNumber: { clubId: input.clubId, rotationNumber: input.rotationNumber } },
      });
      if (existingMember) throw new Error(`Rotation #${input.rotationNumber} is already taken.`);

      await prisma.$transaction(async (tx) => {
        // Update application
        await tx.eliteClubApplication.update({
          where: { id: input.applicationId },
          data: { status: "APPROVED", clubId: input.clubId, reviewedAt: new Date(), reviewedBy: adminId, updatedAt: new Date() },
        });
        // Create member record
        await tx.eliteClubMember.create({
          data: {
            id: randomUUID(),
            userId: app.userId,
            clubId: input.clubId,
            rotationNumber: input.rotationNumber,
            status: "ACTIVE",
            credibilityScore: 5,
            joinedAt: new Date(),
            updatedAt: new Date(),
          },
        });
        // Increment club member count
        await tx.eliteClub.update({
          where: { id: input.clubId },
          data: { membersCount: { increment: 1 } },
        });
      });

      const club = await prisma.eliteClub.findUnique({ where: { id: input.clubId } });
      await sendNotification({
        userId: app.userId,
        type: "ELITE_CLUB_APP_APPROVED" as any,
        title: "Elite Club Application Approved!",
        message: `Congratulations! You have been assigned rotation #${input.rotationNumber} in the "${club?.name}" Elite Club.`,
        actionUrl: "/elite-club",
      });
      return { success: true };
    }),

  /** Admin: reject application */
  rejectApplication: protectedProcedure
    .input(z.object({
      applicationId: z.string(),
      reason: z.string().min(5),
    }))
    .mutation(async ({ ctx, input }) => {
      assertAdmin(ctx.session);
      const adminId = ctx.session!.user.id;
      const app = await prisma.eliteClubApplication.findUnique({ where: { id: input.applicationId } });
      if (!app) throw new Error("Application not found.");
      await prisma.eliteClubApplication.update({
        where: { id: input.applicationId },
        data: { status: "REJECTED", rejectionReason: input.reason, reviewedAt: new Date(), reviewedBy: adminId, updatedAt: new Date() },
      });
      await sendNotification({
        userId: app.userId,
        type: "ELITE_CLUB_APP_REJECTED" as any,
        title: "Elite Club Application Rejected",
        message: `Your ${app.tier} tier Elite Club application was not approved. Reason: ${input.reason}`,
        actionUrl: "/elite-club/application",
      });
      return { success: true };
    }),

  // ── 3. CONTRIBUTIONS ──────────────────────────────────────────────────────

  /** Admin/system: record a monthly contribution for a member */
  recordContribution: protectedProcedure
    .input(z.object({
      memberId: z.string(),
      month: z.number().int().min(1).max(12),
      year: z.number().int().min(2024),
      totalAmount: z.number().positive(),
    }))
    .mutation(async ({ ctx, input }) => {
      assertAdmin(ctx.session);

      const member = await prisma.eliteClubMember.findUnique({
        where: { id: input.memberId },
        include: { club: true },
      });
      if (!member) throw new Error("Member not found.");

      // Investment pool split: 20% ops deducted by spec → 80% to payout empowerment pool, 20% investment
      // Empowerment share: 80%, Investment share: 20%
      const empowermentShare = input.totalAmount * 0.8;
      const investmentShare = input.totalAmount * 0.2;

      const contribution = await prisma.$transaction(async (tx) => {
        // Upsert contribution
        const existing = await tx.eliteClubContribution.findUnique({
          where: { memberId_month_year: { memberId: input.memberId, month: input.month, year: input.year } },
        });
        if (existing && existing.status === "PAID") throw new Error("Contribution for this period already recorded as paid.");

        const contrib = await tx.eliteClubContribution.upsert({
          where: { memberId_month_year: { memberId: input.memberId, month: input.month, year: input.year } },
          create: {
            id: randomUUID(),
            memberId: input.memberId,
            clubId: member.clubId,
            userId: member.userId,
            month: input.month,
            year: input.year,
            totalAmount: input.totalAmount,
            empowermentShare,
            investmentShare,
            status: "PAID",
            paidAt: new Date(),
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          update: {
            totalAmount: input.totalAmount,
            empowermentShare,
            investmentShare,
            status: "PAID",
            paidAt: new Date(),
            updatedAt: new Date(),
          },
        });

        // Update member total contributed
        await tx.eliteClubMember.update({
          where: { id: input.memberId },
          data: { totalContributed: { increment: input.totalAmount } },
        });

        // Update investment pool
        const bpiOps = investmentShare * 0.05;
        const eliteOps = investmentShare * 0.05;
        const netInvestment = investmentShare * 0.9;
        await tx.eliteClubInvestmentPool.upsert({
          where: { clubId_month_year: { clubId: member.clubId, month: input.month, year: input.year } },
          create: {
            id: randomUUID(),
            clubId: member.clubId,
            month: input.month,
            year: input.year,
            grossAmount: investmentShare,
            netAmount: netInvestment,
            opsFeeBpi: bpiOps,
            opsFeeElite: eliteOps,
            available: netInvestment,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          update: {
            grossAmount: { increment: investmentShare },
            netAmount: { increment: netInvestment },
            opsFeeBpi: { increment: bpiOps },
            opsFeeElite: { increment: eliteOps },
            available: { increment: netInvestment },
            updatedAt: new Date(),
          },
        });

        // Credibility: on-time contribution +0.2
        await adjustCredibility(tx, input.memberId, "CONTRIBUTION_PAID", 0.2, "On-time monthly contribution", contrib.id);

        return contrib;
      });

      // Record ops revenue for BPI (outside transaction to avoid nesting)
      if (contribution) {
        const bpiOps = input.totalAmount * 0.2 * 0.05;
        await recordRevenue(prisma, {
          source: "ELITE_CLUB_OPS",
          amount: bpiOps,
          userId: member.userId,
          sourceId: contribution.id,
          description: `Elite Club ops fee – ${member.club!.tier} club ${member.clubId} M${input.month}/${input.year}`,
        });
      }

      await sendNotification({
        userId: member.userId,
        type: "ELITE_CLUB_CONTRIBUTION_RECORDED" as any,
        title: "Monthly Contribution Recorded",
        message: `Your ₦${input.totalAmount.toLocaleString()} Elite Club contribution for ${input.month}/${input.year} has been recorded.`,
        actionUrl: "/elite-club",
      });

      return { contribution };
    }),

  /** Member: view my contributions */
  myContributions: protectedProcedure
    .input(z.object({
      clubId: z.string().optional(),
      page: z.number().int().min(1).default(1),
      pageSize: z.number().int().min(1).max(100).default(24),
    }))
    .query(async ({ ctx, input }) => {
      assertMember(ctx.session);
      const userId = ctx.session!.user.id;
      const where: any = { userId };
      if (input.clubId) where.clubId = input.clubId;
      const [contributions, total] = await Promise.all([
        prisma.eliteClubContribution.findMany({
          where,
          skip: (input.page - 1) * input.pageSize,
          take: input.pageSize,
          orderBy: [{ year: "desc" }, { month: "desc" }],
        }),
        prisma.eliteClubContribution.count({ where }),
      ]);
      return { contributions, total };
    }),

  /** Admin: list all contributions with filters */
  adminListContributions: protectedProcedure
    .input(z.object({
      clubId: z.string().optional(),
      month: z.number().int().min(1).max(12).optional(),
      year: z.number().int().min(2024).optional(),
      status: z.nativeEnum(EliteClubContribStatus).optional(),
      page: z.number().int().min(1).default(1),
      pageSize: z.number().int().min(1).max(100).default(50),
    }))
    .query(async ({ ctx, input }) => {
      assertAdmin(ctx.session);
      const where: any = {};
      if (input.clubId) where.clubId = input.clubId;
      if (input.month) where.month = input.month;
      if (input.year) where.year = input.year;
      if (input.status) where.status = input.status;
      const [contributions, total] = await Promise.all([
        prisma.eliteClubContribution.findMany({
          where,
          skip: (input.page - 1) * input.pageSize,
          take: input.pageSize,
          orderBy: [{ year: "desc" }, { month: "desc" }],
          include: { member: { include: { user: { select: { id: true, name: true, email: true } } } } },
        }),
        prisma.eliteClubContribution.count({ where }),
      ]);
      return { contributions, total };
    }),

  // ── 4. ROTATION SCHEDULING & PAYOUTS ──────────────────────────────────────

  /** Get rotation queue for a club */
  getRotationQueue: protectedProcedure
    .input(z.object({ clubId: z.string() }))
    .query(async ({ ctx, input }) => {
      assertMember(ctx.session);
      const members = await prisma.eliteClubMember.findMany({
        where: { clubId: input.clubId, status: { notIn: [EliteClubMemberStatus.OPTED_OUT, EliteClubMemberStatus.REPLACED] } },
        orderBy: { rotationNumber: "asc" },
        include: {
          user: { select: { id: true, name: true, email: true } },
          payouts: { orderBy: { scheduledMonth: "desc" }, take: 1 },
        },
      });
      return { members };
    }),

  /** Admin: schedule an empowerment payout for a rotation slot */
  scheduleEmpowermentPayout: protectedProcedure
    .input(z.object({
      clubId: z.string(),
      memberId: z.string(),
      rotationNumber: z.number().int().min(1).max(11),
      amount: z.number().positive(),
      scheduledMonth: z.number().int().min(1).max(12),
      scheduledYear: z.number().int().min(2024),
    }))
    .mutation(async ({ ctx, input }) => {
      assertAdmin(ctx.session);

      const existing = await prisma.eliteClubEmpowermentPayout.findUnique({
        where: { clubId_scheduledMonth_scheduledYear: {
          clubId: input.clubId,
          scheduledMonth: input.scheduledMonth,
          scheduledYear: input.scheduledYear,
        }},
      });
      if (existing) throw new Error("A payout is already scheduled for this club and month.");

      const payout = await prisma.eliteClubEmpowermentPayout.create({
        data: {
          id: randomUUID(),
          clubId: input.clubId,
          memberId: input.memberId,
          rotationNumber: input.rotationNumber,
          amount: input.amount,
          scheduledMonth: input.scheduledMonth,
          scheduledYear: input.scheduledYear,
          status: "PENDING",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });

      const member = await prisma.eliteClubMember.findUnique({ where: { id: input.memberId } });
      if (member) {
        await prisma.eliteClubMember.update({ where: { id: input.memberId }, data: { empowermentPending: true } });
        await sendNotification({
          userId: member.userId,
          type: "ELITE_CLUB_PAYOUT_SCHEDULED" as any,
          title: "Empowerment Payout Scheduled",
          message: `Your empowerment payout of ₦${input.amount.toLocaleString()} is scheduled for ${input.scheduledMonth}/${input.scheduledYear}.`,
          actionUrl: "/elite-club",
        });
      }
      return { payout };
    }),

  /** Admin: release an empowerment payout */
  releasePayout: protectedProcedure
    .input(z.object({
      payoutId: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      assertAdmin(ctx.session);
      const payout = await prisma.eliteClubEmpowermentPayout.findUnique({ where: { id: input.payoutId } });
      if (!payout) throw new Error("Payout not found.");
      if (payout.status !== "PENDING") throw new Error("Payout is not pending.");

      // Check member credibility (must be ≥ 3 to receive payout)
      const member = await prisma.eliteClubMember.findUnique({ where: { id: payout.memberId } });
      if (!member) throw new Error("Member not found.");
      if (Number(member.credibilityScore) < 3) {
        await prisma.eliteClubEmpowermentPayout.update({
          where: { id: input.payoutId },
          data: { status: "BLOCKED", blockedReason: `Credibility score ${member.credibilityScore} below minimum 3.0`, updatedAt: new Date() },
        });
        throw new Error(`Payout blocked: member credibility score ${member.credibilityScore} is below 3.0.`);
      }

      await prisma.$transaction(async (tx) => {
        await tx.eliteClubEmpowermentPayout.update({
          where: { id: input.payoutId },
          data: { status: "PAID", paidAt: new Date(), updatedAt: new Date() },
        });
        await tx.eliteClubMember.update({
          where: { id: payout.memberId },
          data: { empowermentReceived: true, empowermentPending: false },
        });
        await adjustCredibility(tx, payout.memberId, EliteClubCredEventType.PAYOUT_RECEIVED, 0.5, "Empowerment payout received", payout.id);
      });

      await sendNotification({
        userId: member.userId,
        type: "ELITE_CLUB_PAYOUT_RELEASED" as any,
        title: "Empowerment Payout Released!",
        message: `Your empowerment payout of ₦${Number(payout.amount).toLocaleString()} has been released to your wallet.`,
        actionUrl: "/elite-club",
      });
      return { success: true };
    }),

  /** List empowerment payouts for a club (admin or member) */
  listEmpowermentPayouts: protectedProcedure
    .input(z.object({
      clubId: z.string(),
      status: z.nativeEnum(EliteClubPayoutStatus).optional(),
    }))
    .query(async ({ ctx, input }) => {
      assertMember(ctx.session);
      const where: any = { clubId: input.clubId };
      if (input.status) where.status = input.status;
      const payouts = await prisma.eliteClubEmpowermentPayout.findMany({
        where,
        orderBy: [{ scheduledYear: "asc" }, { scheduledMonth: "asc" }],
        include: {
          member: { include: { user: { select: { id: true, name: true, email: true } } } },
        },
      });
      return { payouts };
    }),

  // ── 5. ROTATION SWAPS & OPT-OUTS ─────────────────────────────────────────

  /** Request a rotation number swap */
  requestSwap: protectedProcedure
    .input(z.object({
      clubId: z.string(),
      targetMemberId: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      assertMember(ctx.session);
      const userId = ctx.session!.user.id;

      const requester = await prisma.eliteClubMember.findFirst({
        where: { userId, clubId: input.clubId, status: "ACTIVE" },
      });
      if (!requester) throw new Error("You are not an active member of this club.");

      const target = await prisma.eliteClubMember.findUnique({
        where: { id: input.targetMemberId },
      });
      if (!target || target.clubId !== input.clubId) throw new Error("Target member not found in this club.");

      // No pending swap already
      const pendingSwap = await prisma.eliteClubSwapRequest.findFirst({
        where: { requesterId: requester.id, status: "PENDING" },
      });
      if (pendingSwap) throw new Error("You already have a pending swap request.");

      const swap = await prisma.eliteClubSwapRequest.create({
        data: {
          id: randomUUID(),
          clubId: input.clubId,
          requesterId: requester.id,
          targetId: target.id,
          fromRotation: requester.rotationNumber,
          toRotation: target.rotationNumber,
          status: "PENDING",
          requestedAt: new Date(),
        },
      });

      await sendNotification({
        userId: target.userId,
        type: "ELITE_CLUB_SWAP_REQUEST" as any,
        title: "Rotation Swap Request",
        message: `A club member has requested to swap rotation numbers with you (their #${requester.rotationNumber} ↔ your #${target.rotationNumber}).`,
        actionUrl: "/elite-club",
      });

      return { swap };
    }),

  /** Respond to a swap request */
  respondToSwap: protectedProcedure
    .input(z.object({
      swapId: z.string(),
      accept: z.boolean(),
    }))
    .mutation(async ({ ctx, input }) => {
      assertMember(ctx.session);
      const userId = ctx.session!.user.id;

      const swap = await prisma.eliteClubSwapRequest.findUnique({
        where: { id: input.swapId },
        include: { target: true, requester: true },
      });
      if (!swap) throw new Error("Swap request not found.");
      if (swap.target.userId !== userId) throw new Error("You are not the target of this swap.");
      if (swap.status !== "PENDING") throw new Error("Swap request is no longer pending.");

      if (input.accept) {
        await prisma.$transaction(async (tx) => {
          await tx.eliteClubSwapRequest.update({
            where: { id: input.swapId },
            data: { status: "ACCEPTED", resolvedAt: new Date() },
          });
          // Swap rotation numbers
          await tx.eliteClubMember.update({
            where: { id: swap.requesterId },
            data: { rotationNumber: swap.toRotation },
          });
          await tx.eliteClubMember.update({
            where: { id: swap.targetId },
            data: { rotationNumber: swap.fromRotation },
          });
        });
        await sendNotification({
          userId: swap.requester.userId,
          type: "ELITE_CLUB_SWAP_ACCEPTED" as any,
          title: "Swap Request Accepted",
          message: `Your rotation swap request was accepted. You are now at rotation #${swap.toRotation}.`,
          actionUrl: "/elite-club",
        });
      } else {
        await prisma.eliteClubSwapRequest.update({
          where: { id: input.swapId },
          data: { status: "REJECTED", resolvedAt: new Date() },
        });
        await sendNotification({
          userId: swap.requester.userId,
          type: "ELITE_CLUB_SWAP_REJECTED" as any,
          title: "Swap Request Declined",
          message: `Your rotation swap request was declined.`,
          actionUrl: "/elite-club",
        });
      }
      return { success: true };
    }),

  /** Admin: cancel/reject swap */
  adminCancelSwap: protectedProcedure
    .input(z.object({ swapId: z.string(), reason: z.string().optional() }))
    .mutation(async ({ ctx, input }) => {
      assertAdmin(ctx.session);
      await prisma.eliteClubSwapRequest.update({
        where: { id: input.swapId },
        data: { status: "REJECTED", resolvedAt: new Date(), resolvedBy: ctx.session!.user.id },
      });
      return { success: true };
    }),

  /** Member: opt out of rotation (admin must assign replacement) */
  optOut: protectedProcedure
    .input(z.object({ clubId: z.string(), reason: z.string().optional() }))
    .mutation(async ({ ctx, input }) => {
      assertMember(ctx.session);
      const userId = ctx.session!.user.id;
      const member = await prisma.eliteClubMember.findFirst({
        where: { userId, clubId: input.clubId, status: "ACTIVE" },
      });
      if (!member) throw new Error("You are not an active member of this club.");
      await prisma.eliteClubMember.update({
        where: { id: member.id },
        data: { status: "OPTED_OUT", updatedAt: new Date() },
      });
      await adjustCredibility(undefined as any, member.id, EliteClubCredEventType.OPT_OUT, -1, input.reason ?? "Member opted out");
      return { success: true };
    }),

  /** Admin: replace a member who opted out */
  replaceOptedOutMember: protectedProcedure
    .input(z.object({
      oldMemberId: z.string(),
      newUserId: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      assertAdmin(ctx.session);
      const oldMember = await prisma.eliteClubMember.findUnique({ where: { id: input.oldMemberId } });
      if (!oldMember) throw new Error("Original member not found.");

      await prisma.$transaction(async (tx) => {
        await tx.eliteClubMember.update({
          where: { id: input.oldMemberId },
          data: { status: "REPLACED", replacedAt: new Date() },
        });
        await tx.eliteClubMember.create({
          data: {
            id: randomUUID(),
            userId: input.newUserId,
            clubId: oldMember.clubId,
            rotationNumber: oldMember.rotationNumber,
            status: "ACTIVE",
            credibilityScore: 5,
            joinedAt: new Date(),
            updatedAt: new Date(),
          },
        });
      });
      return { success: true };
    }),

  // ── 6. INVESTMENT POOL ────────────────────────────────────────────────────

  /** Get investment pool for a club and month */
  getInvestmentPool: protectedProcedure
    .input(z.object({
      clubId: z.string(),
      month: z.number().int().min(1).max(12),
      year: z.number().int().min(2024),
    }))
    .query(async ({ ctx, input }) => {
      assertMember(ctx.session);
      const pool = await prisma.eliteClubInvestmentPool.findUnique({
        where: { clubId_month_year: { clubId: input.clubId, month: input.month, year: input.year } },
        include: { investments: { orderBy: { createdAt: "desc" } } },
      });
      return { pool };
    }),

  /** Admin: update digital/offline split for a pool */
  updatePoolSplit: protectedProcedure
    .input(z.object({
      poolId: z.string(),
      digitalBalance: z.number().min(0),
      offlineBalance: z.number().min(0),
    }))
    .mutation(async ({ ctx, input }) => {
      assertAdmin(ctx.session);
      const updated = await prisma.eliteClubInvestmentPool.update({
        where: { id: input.poolId },
        data: {
          digitalBalance: input.digitalBalance,
          offlineBalance: input.offlineBalance,
          updatedAt: new Date(),
        },
      });
      return { pool: updated };
    }),

  // ── 7. INVESTMENT RECOMMENDATION & GOVERNANCE ─────────────────────────────

  /** Check if member is eligible to recommend an investment */
  checkRecommenderEligibility: protectedProcedure
    .input(z.object({ clubId: z.string() }))
    .query(async ({ ctx, input }) => {
      assertMember(ctx.session);
      const userId = ctx.session!.user.id;
      const member = await prisma.eliteClubMember.findFirst({
        where: { userId, clubId: input.clubId, status: "ACTIVE" },
      });
      if (!member) return { eligible: false, reason: "Not an active member." };
      if (Number(member.credibilityScore) < 7) {
        return { eligible: false, reason: `Credibility score ${member.credibilityScore} below minimum 7.0` };
      }
      const guarantorRecords = await prisma.eliteClubGuarantor.count({
        where: { memberId: member.id, isActive: true },
      });
      if (guarantorRecords < 1) {
        return { eligible: false, reason: "No active guarantor assignment." };
      }
      return { eligible: true, reason: null, member };
    }),

  /** Submit investment recommendation */
  submitInvestmentRecommendation: protectedProcedure
    .input(z.object({
      clubId: z.string(),
      poolId: z.string(),
      title: z.string().min(5).max(120),
      description: z.string().min(20).max(2000),
      category: z.nativeEnum(EliteClubInvestmentCategory),
      amountRequested: z.number().positive(),
      expectedReturn: z.number().optional(),
      durationMonths: z.number().int().positive().optional(),
      riskNotes: z.string().max(500).optional(),
      bpiProfitShareEnabled: z.boolean().default(false),
      bpiProfitSharePct: z.number().min(0).max(5).default(0),
    }))
    .mutation(async ({ ctx, input }) => {
      assertMember(ctx.session);
      const userId = ctx.session!.user.id;

      const member = await prisma.eliteClubMember.findFirst({
        where: { userId, clubId: input.clubId, status: "ACTIVE" },
      });
      if (!member) throw new Error("Not an active member.");
      if (Number(member.credibilityScore) < 7) throw new Error("Credibility score below 7.0 required to recommend investments.");

      // Verify pool availability
      const pool = await prisma.eliteClubInvestmentPool.findUnique({ where: { id: input.poolId } });
      if (!pool) throw new Error("Investment pool not found.");
      if (Number(pool.available) < input.amountRequested) throw new Error("Insufficient available funds in pool.");

      const investment = await prisma.eliteClubInvestment.create({
        data: {
          id: randomUUID(),
          clubId: input.clubId,
          poolId: input.poolId,
          recommendedBy: member.id,
          title: input.title,
          description: input.description,
          category: input.category,
          amountRequested: input.amountRequested,
          expectedReturn: input.expectedReturn,
          durationMonths: input.durationMonths,
          riskNotes: input.riskNotes,
          bpiProfitShareEnabled: input.bpiProfitShareEnabled,
          bpiProfitSharePct: Math.min(5, input.bpiProfitSharePct),
          status: "DRAFT",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });
      return { investment };
    }),

  /** Admin: submit legal review URL and advance investment to UNDER_REVIEW */
  submitLegalReview: protectedProcedure
    .input(z.object({
      investmentId: z.string(),
      legalReviewUrl: z.string().url(),
    }))
    .mutation(async ({ ctx, input }) => {
      assertAdmin(ctx.session);
      const updated = await prisma.eliteClubInvestment.update({
        where: { id: input.investmentId },
        data: {
          legalReviewUrl: input.legalReviewUrl,
          legalReviewedAt: new Date(),
          legalReviewedBy: ctx.session!.user.id,
          status: "UNDER_REVIEW",
          updatedAt: new Date(),
        },
      });
      // Notify all club members to vote
      const members = await prisma.eliteClubMember.findMany({
        where: { clubId: updated.clubId, status: "ACTIVE" },
      });
      await Promise.all(members.map((m) =>
        sendNotification({
          userId: m.userId,
          type: "ELITE_CLUB_VOTE_OPEN" as any,
          title: "Investment Vote Open",
          message: `A new investment "${updated.title}" is open for member vote. Legal review is available.`,
          actionUrl: "/elite-club/investments",
        }),
      ));
      return { investment: updated };
    }),

  /** Member: cast vote on investment */
  castVote: protectedProcedure
    .input(z.object({
      investmentId: z.string(),
      vote: z.nativeEnum(EliteClubVoteChoice),
      comment: z.string().max(500).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      assertMember(ctx.session);
      const userId = ctx.session!.user.id;

      const investment = await prisma.eliteClubInvestment.findUnique({ where: { id: input.investmentId } });
      if (!investment) throw new Error("Investment not found.");
      if (investment.status !== "UNDER_REVIEW") throw new Error("Voting is not open for this investment.");

      const member = await prisma.eliteClubMember.findFirst({
        where: { userId, clubId: investment.clubId, status: "ACTIVE" },
      });
      if (!member) throw new Error("You are not an active member of this club.");

      const existingVote = await prisma.eliteClubVote.findUnique({
        where: { investmentId_memberId: { investmentId: input.investmentId, memberId: member.id } },
      });
      if (existingVote) throw new Error("You have already voted on this investment.");

      const voteRecord = await prisma.eliteClubVote.create({
        data: {
          id: randomUUID(),
          investmentId: input.investmentId,
          memberId: member.id,
          userId,
          vote: input.vote,
          comment: input.comment,
          votedAt: new Date(),
        },
      });

      // Credibility: participation in governance
      await prisma.$transaction(async (tx) => {
        await adjustCredibility(tx, member.id, EliteClubCredEventType.POSITIVE_VOTE, 0.1, "Voted on investment proposal", input.investmentId);
      });

      return { vote: voteRecord };
    }),

  /** Get vote results for an investment */
  getVoteResults: protectedProcedure
    .input(z.object({ investmentId: z.string() }))
    .query(async ({ ctx, input }) => {
      assertMember(ctx.session);
      const investment = await prisma.eliteClubInvestment.findUnique({ where: { id: input.investmentId } });
      if (!investment) throw new Error("Investment not found.");
      const votes = await prisma.eliteClubVote.findMany({ where: { investmentId: input.investmentId } });
      const accept = votes.filter((v) => v.vote === "ACCEPT").length;
      const reject = votes.filter((v) => v.vote === "REJECT").length;
      const abstain = votes.filter((v) => v.vote === "ABSTAIN").length;
      const total = votes.length;
      const quorum = 8; // 8 of 11 required
      const passed = total >= quorum && accept > reject;
      return { accept, reject, abstain, total, quorum, passed, votes };
    }),

  /** Admin: approve investment, deduct from pool, set APPROVED */
  approveInvestment: protectedProcedure
    .input(z.object({ investmentId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      assertAdmin(ctx.session);

      const investment = await prisma.eliteClubInvestment.findUnique({
        where: { id: input.investmentId },
        include: { pool: true },
      });
      if (!investment) throw new Error("Investment not found.");
      if (investment.status !== "UNDER_REVIEW") throw new Error("Investment is not under review.");

      // Check votes passed
      const votes = await prisma.eliteClubVote.findMany({ where: { investmentId: input.investmentId } });
      const accept = votes.filter((v) => v.vote === "ACCEPT").length;
      const reject = votes.filter((v) => v.vote === "REJECT").length;
      if (votes.length < 8) throw new Error("Quorum not reached (8 votes required).");
      if (accept <= reject) throw new Error("Majority not reached.");

      await prisma.$transaction(async (tx) => {
        await tx.eliteClubInvestment.update({
          where: { id: input.investmentId },
          data: { status: "APPROVED", approvedAt: new Date(), updatedAt: new Date() },
        });
        // Reserve funds
        await tx.eliteClubInvestmentPool.update({
          where: { id: investment.poolId },
          data: { available: { decrement: Number(investment.amountRequested) } },
        });
      });

      return { success: true };
    }),

  /** Admin: mark investment funded, upload proof of deposit */
  fundInvestment: protectedProcedure
    .input(z.object({
      investmentId: z.string(),
      proofOfDepositUrl: z.string().url(),
    }))
    .mutation(async ({ ctx, input }) => {
      assertAdmin(ctx.session);
      const updated = await prisma.eliteClubInvestment.update({
        where: { id: input.investmentId },
        data: {
          status: "FUNDED",
          proofOfDepositUrl: input.proofOfDepositUrl,
          proofUploadedAt: new Date(),
          proofUploadedBy: ctx.session!.user.id,
          fundedAt: new Date(),
          updatedAt: new Date(),
        },
      });
      return { investment: updated };
    }),

  /** Admin: record investment return */
  recordInvestmentReturn: protectedProcedure
    .input(z.object({
      investmentId: z.string(),
      actualReturn: z.number().min(0),
    }))
    .mutation(async ({ ctx, input }) => {
      assertAdmin(ctx.session);

      const investment = await prisma.eliteClubInvestment.findUnique({ where: { id: input.investmentId } });
      if (!investment) throw new Error("Investment not found.");

      let bpiShare = 0;
      if (investment.bpiProfitShareEnabled) {
        const profit = Math.max(0, input.actualReturn - Number(investment.amountRequested));
        bpiShare = profit * (Number(investment.bpiProfitSharePct) / 100);
      }

      await prisma.$transaction(async (tx) => {
        await tx.eliteClubInvestment.update({
          where: { id: input.investmentId },
          data: {
            status: "COMPLETED",
            actualReturn: input.actualReturn,
            bpiProfitShareAmount: bpiShare,
            completedAt: new Date(),
            updatedAt: new Date(),
          },
        });
        // Return funds to pool available
        await tx.eliteClubInvestmentPool.update({
          where: { id: investment.poolId },
          data: { available: { increment: input.actualReturn - bpiShare } },
        });
      });

      // Record BPI profit share revenue (outside transaction)
      if (bpiShare > 0) {
        await recordRevenue(prisma, {
          source: "ELITE_CLUB_INVESTMENT_PROFIT",
          amount: bpiShare,
          sourceId: input.investmentId,
          description: `BPI profit share from Elite Club investment: ${investment.title}`,
        });
      }

      return { success: true, bpiShare };
    }),

  /** Admin: reject an investment */
  rejectInvestment: protectedProcedure
    .input(z.object({ investmentId: z.string(), reason: z.string().optional() }))
    .mutation(async ({ ctx, input }) => {
      assertAdmin(ctx.session);
      const investment = await prisma.eliteClubInvestment.findUnique({ where: { id: input.investmentId } });
      if (!investment) throw new Error("Investment not found.");
      await prisma.$transaction(async (tx) => {
        await tx.eliteClubInvestment.update({
          where: { id: input.investmentId },
          data: { status: "REJECTED", updatedAt: new Date() },
        });
        // Unblock pool funds if previously reserved
        if (investment.status === "APPROVED") {
          await tx.eliteClubInvestmentPool.update({
            where: { id: investment.poolId },
            data: { available: { increment: Number(investment.amountRequested) } },
          });
        }
      });
      // Notify recommender
      const recommenderMember = await prisma.eliteClubMember.findUnique({ where: { id: investment.recommendedBy } });
      if (recommenderMember) {
        await sendNotification({
          userId: recommenderMember.userId,
          type: "ELITE_CLUB_INVESTMENT_REJECTED" as any,
          title: "Investment Recommendation Rejected",
          message: `Your investment recommendation "${investment.title}" was not approved.${input.reason ? ` Reason: ${input.reason}` : ""}`,
          actionUrl: "/elite-club/investments",
        });
      }
      return { success: true };
    }),

  /** List investments for a club */
  listInvestments: protectedProcedure
    .input(z.object({
      clubId: z.string(),
      status: z.nativeEnum(EliteClubInvestmentStatus).optional(),
      page: z.number().int().min(1).default(1),
      pageSize: z.number().int().min(1).max(50).default(20),
    }))
    .query(async ({ ctx, input }) => {
      assertMember(ctx.session);
      const where: any = { clubId: input.clubId };
      if (input.status) where.status = input.status;
      const [investments, total] = await Promise.all([
        prisma.eliteClubInvestment.findMany({
          where,
          skip: (input.page - 1) * input.pageSize,
          take: input.pageSize,
          orderBy: { createdAt: "desc" },
          include: {
            _count: { select: { votes: true, guarantors: true } },
            votes: { where: { userId: ctx.session!.user.id }, take: 1 },
          },
        }),
        prisma.eliteClubInvestment.count({ where }),
      ]);
      return { investments, total };
    }),

  // ── 8. CREDIBILITY SCORE ──────────────────────────────────────────────────

  /** Member: view own credibility history */
  myCredibilityHistory: protectedProcedure
    .input(z.object({ clubId: z.string() }))
    .query(async ({ ctx, input }) => {
      assertMember(ctx.session);
      const userId = ctx.session!.user.id;
      const member = await prisma.eliteClubMember.findFirst({ where: { userId, clubId: input.clubId } });
      if (!member) return { events: [], score: 5 };
      const events = await prisma.eliteClubCredibilityEvent.findMany({
        where: { memberId: member.id },
        orderBy: { createdAt: "desc" },
      });
      return { events, score: Number(member.credibilityScore) };
    }),

  /** Admin: manually adjust credibility */
  adminAdjustCredibility: protectedProcedure
    .input(z.object({
      memberId: z.string(),
      event: z.nativeEnum(EliteClubCredEventType),
      delta: z.number().min(-10).max(10),
      reason: z.string().min(5),
    }))
    .mutation(async ({ ctx, input }) => {
      assertAdmin(ctx.session);
      await prisma.$transaction(async (tx) => {
        await adjustCredibility(tx, input.memberId, input.event, input.delta, input.reason);
      });
      return { success: true };
    }),

  // ── 9. GUARANTORS ─────────────────────────────────────────────────────────

  /** Check guarantor eligibility (must have credibility ≥ level threshold) */
  checkGuarantorEligibility: protectedProcedure
    .input(z.object({ clubId: z.string(), level: z.number().int().min(1).max(4) }))
    .query(async ({ ctx, input }) => {
      assertMember(ctx.session);
      const userId = ctx.session!.user.id;
      const member = await prisma.eliteClubMember.findFirst({
        where: { userId, clubId: input.clubId, status: "ACTIVE" },
      });
      if (!member) return { eligible: false, reason: "Not an active member." };
      const minScore = [0, 7, 7.5, 8, 9][input.level] ?? 9;
      const eligible = Number(member.credibilityScore) >= minScore;
      return {
        eligible,
        reason: eligible ? null : `Credibility score ${member.credibilityScore} below minimum ${minScore} for level ${input.level}`,
        score: Number(member.credibilityScore),
        minScore,
      };
    }),

  /** Admin: assign guarantor to investment */
  assignGuarantor: protectedProcedure
    .input(z.object({
      memberId: z.string(),
      investmentId: z.string(),
      level: z.number().int().min(1).max(4),
    }))
    .mutation(async ({ ctx, input }) => {
      assertAdmin(ctx.session);
      const member = await prisma.eliteClubMember.findUnique({ where: { id: input.memberId } });
      if (!member) throw new Error("Member not found.");
      const guarantor = await prisma.eliteClubGuarantor.create({
        data: {
          id: randomUUID(),
          memberId: input.memberId,
          userId: member.userId,
          investmentId: input.investmentId,
          level: input.level,
          qualifiedAt: new Date(),
          isActive: true,
        },
      });
      return { guarantor };
    }),

  // ── 10. DEFAULTS & LEGAL ─────────────────────────────────────────────────

  /** Admin: flag a member default */
  flagDefault: protectedProcedure
    .input(z.object({
      memberId: z.string(),
      notes: z.string().optional(),
      moustRef: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      assertAdmin(ctx.session);
      const member = await prisma.eliteClubMember.findUnique({ where: { id: input.memberId } });
      if (!member) throw new Error("Member not found.");

      await prisma.$transaction(async (tx) => {
        await tx.eliteClubLegalEvent.create({
          data: {
            id: randomUUID(),
            memberId: input.memberId,
            eventType: "DEFAULT",
            notes: input.notes,
            moustRef: input.moustRef,
            raisedBy: ctx.session!.user.id,
            createdAt: new Date(),
          },
        });
        await tx.eliteClubMember.update({
          where: { id: input.memberId },
          data: {
            defaultCount: { increment: 1 },
            legalFlaggedAt: new Date(),
            updatedAt: new Date(),
          },
        });
        await adjustCredibility(tx, input.memberId, "DEFAULT", -2, input.notes ?? "Default flagged by admin");
      });

      // Auto-suspend if 3 defaults
      const updatedMember = await prisma.eliteClubMember.findUnique({ where: { id: input.memberId } });
      if (updatedMember && updatedMember.defaultCount >= 3) {
        await prisma.eliteClubMember.update({
          where: { id: input.memberId },
          data: { status: "SUSPENDED", suspendedAt: new Date() },
        });
        await sendNotification({
          userId: updatedMember.userId,
          type: "ELITE_CLUB_SUSPENDED" as any,
          title: "Elite Club Membership Suspended",
          message: `Your Elite Club membership has been suspended due to ${updatedMember.defaultCount} recorded defaults.`,
          actionUrl: "/elite-club",
        });
      }

      return { success: true };
    }),

  /** Admin: resolve a default */
  adminResolveDefault: protectedProcedure
    .input(z.object({
      legalEventId: z.string(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      assertAdmin(ctx.session);
      await prisma.eliteClubLegalEvent.update({
        where: { id: input.legalEventId },
        data: {
          resolvedAt: new Date(),
          resolvedBy: ctx.session!.user.id,
          notes: input.notes,
        },
      });
      return { success: true };
    }),

  /** Admin: re-activate a suspended member */
  reinstateMember: protectedProcedure
    .input(z.object({ memberId: z.string(), notes: z.string().optional() }))
    .mutation(async ({ ctx, input }) => {
      assertAdmin(ctx.session);
      const member = await prisma.eliteClubMember.findUnique({ where: { id: input.memberId } });
      if (!member) throw new Error("Member not found.");
      await prisma.eliteClubMember.update({
        where: { id: input.memberId },
        data: { status: "ACTIVE", suspendedAt: null, updatedAt: new Date() },
      });
      await sendNotification({
        userId: member.userId,
        type: "ELITE_CLUB_REINSTATED" as any,
        title: "Elite Club Membership Reinstated",
        message: `Your Elite Club membership has been reinstated. Welcome back!`,
        actionUrl: "/elite-club",
      });
      return { success: true };
    }),

  /** List legal events for a member (admin) */
  adminListLegalEvents: protectedProcedure
    .input(z.object({
      memberId: z.string().optional(),
      clubId: z.string().optional(),
      page: z.number().int().min(1).default(1),
      pageSize: z.number().int().min(1).max(100).default(30),
    }))
    .query(async ({ ctx, input }) => {
      assertAdmin(ctx.session);
      const where: any = {};
      if (input.memberId) where.memberId = input.memberId;
      if (input.clubId) where.member = { clubId: input.clubId };
      const [events, total] = await Promise.all([
        prisma.eliteClubLegalEvent.findMany({
          where,
          skip: (input.page - 1) * input.pageSize,
          take: input.pageSize,
          orderBy: { createdAt: "desc" },
          include: { member: { include: { user: { select: { id: true, name: true, email: true } } } } },
        }),
        prisma.eliteClubLegalEvent.count({ where }),
      ]);
      return { events, total };
    }),

  // ── 11. CMS SETTINGS ─────────────────────────────────────────────────────

  /** Get all Elite Club CMS settings */
  getCmsSettings: protectedProcedure.query(async ({ ctx }) => {
    assertAdmin(ctx.session);
    const keys = [
      "elite_club_formation_status",
      "elite_club_silver_bpt_min",
      "elite_club_silver_pac_min",
      "elite_club_silver_monthly",
      "elite_club_gold_bpt_min",
      "elite_club_gold_pac_min",
      "elite_club_gold_monthly",
      "elite_club_platinum_bpt_min",
      "elite_club_platinum_pac_min",
      "elite_club_platinum_monthly",
      "elite_club_diamond_bpt_min",
      "elite_club_diamond_pac_min",
      "elite_club_diamond_monthly",
      "elite_club_investment_quorum",
      "elite_club_recommender_min_credibility",
      "elite_club_payout_min_credibility",
      "elite_club_ops_fee_bpi_pct",
      "elite_club_ops_fee_elite_pct",
    ];
    const rows = await prisma.adminSettings.findMany({ where: { settingKey: { in: keys } } });
    const map = Object.fromEntries(rows.map((r) => [r.settingKey, r.settingValue]));
    return { settings: map, keys };
  }),

  /** Admin: update a single CMS setting */
  updateCmsSetting: protectedProcedure
    .input(z.object({
      key: z.string(),
      value: z.string(),
      description: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      assertAdmin(ctx.session);
      await prisma.adminSettings.upsert({
        where: { settingKey: input.key },
        create: {
          id: randomUUID(),
          settingKey: input.key,
          settingValue: input.value,
          description: input.description,
          updatedAt: new Date(),
        },
        update: {
          settingValue: input.value,
          description: input.description,
          updatedAt: new Date(),
        },
      });
      return { success: true };
    }),

  // ── 12. ADMIN DASHBOARD SUMMARY ──────────────────────────────────────────

  /** Admin: overall Elite Club dashboard stats */
  adminDashboardStats: protectedProcedure.query(async ({ ctx }) => {
    assertAdmin(ctx.session);
    const [
      totalClubs,
      activeClubs,
      totalMembers,
      pendingApplications,
      pendingPayouts,
      openInvestments,
    ] = await Promise.all([
      prisma.eliteClub.count(),
      prisma.eliteClub.count({ where: { status: "ACTIVE" } }),
      prisma.eliteClubMember.count({ where: { status: "ACTIVE" } }),
      prisma.eliteClubApplication.count({ where: { status: "PENDING" } }),
      prisma.eliteClubEmpowermentPayout.count({ where: { status: "PENDING" } }),
      prisma.eliteClubInvestment.count({ where: { status: "UNDER_REVIEW" } }),
    ]);
    return {
      totalClubs,
      activeClubs,
      totalMembers,
      pendingApplications,
      pendingPayouts,
      openInvestments,
    };
  }),
});
