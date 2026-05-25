// @ts-nocheck
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, protectedProcedure } from "@/server/trpc/trpc";
import { prisma } from "@/lib/prisma";
import {
  getActivePromo,
  claimPromoActivation,
} from "@/server/services/promoActivation.service";

function requireAdmin(ctx: any) {
  const role = (ctx.session?.user as any)?.role as string;
  const isAdmin = role === "admin" || role === "super_admin";
  if (!isAdmin) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: "Admins only" });
  }
}

export const promoCampaignRouter = createTRPCRouter({
  // ── User-facing ──────────────────────────────────────────────────────────

  /** Returns the currently active promo if one exists with quota remaining. */
  getActivePromo: protectedProcedure.query(async () => {
    return getActivePromo(prisma);
  }),

  /**
   * Claim a free membership activation from a promo campaign.
   * The revenue pipeline is completely bypassed.
   */
  claimPromo: protectedProcedure
    .input(
      z.object({
        campaignId: z.string().min(1),
        packageId: z.string().min(1),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const userId = (ctx.session?.user as any)?.id as string;
      if (!userId) throw new TRPCError({ code: "UNAUTHORIZED" });

      try {
        const result = await claimPromoActivation(prisma, {
          userId,
          campaignId: input.campaignId,
          packageId: input.packageId,
        });
        return result;
      } catch (err: any) {
        const MSG: Record<string, string> = {
          PROMO_NOT_ACTIVE: "This promotion is no longer active.",
          PROMO_QUOTA_EXHAUSTED: "All promo slots have been claimed.",
          PROMO_NOT_STARTED: "This promotion has not started yet.",
          PROMO_EXPIRED: "This promotion has expired.",
          PROMO_PACKAGE_MISMATCH:
            "This promotion is not valid for the selected package.",
          PROMO_ALREADY_CLAIMED:
            "You have already used a promo activation.",
          MEMBERSHIP_ALREADY_ACTIVE:
            "Your membership is already active.",
          USER_NOT_FOUND: "User account not found.",
        };
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: MSG[err.message] ?? "Failed to claim promo activation.",
        });
      }
    }),

  // ── Admin ────────────────────────────────────────────────────────────────

  /** List all campaigns with claim counts. */
  adminListCampaigns: protectedProcedure.query(async ({ ctx }) => {
    requireAdmin(ctx);
    return prisma.promoCampaign.findMany({
      orderBy: { createdAt: "desc" },
    });
  }),

  /** Create a new promo campaign. */
  adminCreateCampaign: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1).max(100),
        quota: z.number().int().min(1).max(100_000),
        isActive: z.boolean().optional(),
        targetPackageId: z.string().optional(),
        startDate: z.string().optional(),
        endDate: z.string().optional(),
        notes: z.string().max(500).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      requireAdmin(ctx);
      const adminId = (ctx.session?.user as any)?.id as string;

      return prisma.promoCampaign.create({
        data: {
          name: input.name,
          type: "FREE_MEMBERSHIP_ACTIVATION",
          quota: input.quota,
          isActive: input.isActive ?? true,
          targetPackageId: input.targetPackageId ?? null,
          startDate: input.startDate ? new Date(input.startDate) : null,
          endDate: input.endDate ? new Date(input.endDate) : null,
          notes: input.notes ?? null,
          createdByAdminId: adminId,
        },
      });
    }),

  /** Toggle the isActive flag on a campaign. */
  adminToggleActive: protectedProcedure
    .input(z.object({ id: z.string().min(1), isActive: z.boolean() }))
    .mutation(async ({ ctx, input }) => {
      requireAdmin(ctx);
      return prisma.promoCampaign.update({
        where: { id: input.id },
        data: { isActive: input.isActive },
      });
    }),

  /** Delete a campaign (only if it has 0 claims). */
  adminDeleteCampaign: protectedProcedure
    .input(z.object({ id: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      requireAdmin(ctx);

      const campaign = await prisma.promoCampaign.findUnique({
        where: { id: input.id },
        include: { _count: { select: { Claims: true } } },
      });
      if (!campaign) throw new TRPCError({ code: "NOT_FOUND" });
      if (campaign._count.Claims > 0) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Cannot delete a campaign that has claims.",
        });
      }
      return prisma.promoCampaign.delete({ where: { id: input.id } });
    }),

  /** List all claims for a campaign with user details. */
  adminGetClaims: protectedProcedure
    .input(z.object({ campaignId: z.string().min(1) }))
    .query(async ({ ctx, input }) => {
      requireAdmin(ctx);
      return prisma.promoActivationClaim.findMany({
        where: { campaignId: input.campaignId },
        include: {
          User: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
              createdAt: true,
              membershipExpiresAt: true,
            },
          },
        },
        orderBy: { claimedAt: "desc" },
      });
    }),
});
