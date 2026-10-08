/**
 * Healthcare card router (corporate decision, follow-up Q16, 07/10/2026).
 */
import { z } from "zod";
import { randomUUID } from "crypto";
import * as QRCode from "qrcode";
import { prisma } from "@/lib/prisma";
import { createTRPCRouter, protectedProcedure, adminProcedure } from "../trpc";
import {
  loadHealthcareSettings,
  subscribeHealthcareCard,
  loadMemberHealthcareProfile,
  membershipMeetsHealthcareRequirement,
  discountPctForTier,
  redeemHealthcareCard,
  HEALTHCARE_SETTINGS_KEYS,
} from "@/server/services/healthcareCard.service";

export const healthcareRouter = createTRPCRouter({
  getSettings: protectedProcedure.query(async () => {
    return loadHealthcareSettings(prisma);
  }),

  /** The member's own card, eligibility and current discount. */
  getMyCard: protectedProcedure.query(async ({ ctx }) => {
    const userId = (ctx.session?.user as any)?.id as string | undefined;
    if (!userId) throw new Error("UNAUTHORIZED");
    const [card, settings, profile] = await Promise.all([
      prisma.healthcareCard.findUnique({ where: { userId } }),
      loadHealthcareSettings(prisma),
      loadMemberHealthcareProfile(prisma, userId),
    ]);
    const eligible = membershipMeetsHealthcareRequirement(settings, profile.membershipName, profile.tierNumber);
    const discountPct = discountPctForTier(settings, profile.tierNumber);
    const qrDataUrl = card ? await QRCode.toDataURL(card.sscCode) : null;
    return {
      card,
      qrDataUrl,
      eligible,
      discountPct,
      tierNumber: profile.tierNumber,
      membershipName: profile.membershipName,
      price: settings.price,
      coverAmount: settings.coverAmount,
    };
  }),

  subscribe: protectedProcedure.mutation(async ({ ctx }) => {
    const userId = (ctx.session?.user as any)?.id as string | undefined;
    if (!userId) throw new Error("UNAUTHORIZED");
    const settings = await loadHealthcareSettings(prisma);
    const profile = await loadMemberHealthcareProfile(prisma, userId);
    if (!membershipMeetsHealthcareRequirement(settings, profile.membershipName, profile.tierNumber)) {
      throw new Error("Regular Plus or a higher package is required for the healthcare card at your tier.");
    }
    const result = await subscribeHealthcareCard(prisma, { userId });
    return { success: true, ...result };
  }),

  // ── Admin: settings ──────────────────────────────────────────────
  adminGetSettings: adminProcedure.query(async () => loadHealthcareSettings(prisma)),

  adminSaveSettings: adminProcedure
    .input(z.object({
      price: z.number().int().min(0),
      coverAmount: z.number().int().min(0),
      communityShare: z.number().int().min(0),
      monthlyMinPct: z.number().int().min(0).max(100),
      monthlyMaxPct: z.number().int().min(0).max(100),
      discountTier1to3Pct: z.number().int().min(0).max(100),
      discountTier4to6Pct: z.number().int().min(0).max(100),
      discountTier7PlusPct: z.number().int().min(0).max(100),
      requireRegularPlusFromTier: z.number().int().min(1),
    }))
    .mutation(async ({ input }) => {
      const values: Array<[string, string]> = Object.entries(HEALTHCARE_SETTINGS_KEYS).map(([field, settingKey]) => [
        settingKey,
        String((input as any)[field]),
      ]);
      await prisma.$transaction(values.map(([settingKey, settingValue]) =>
        prisma.adminSettings.upsert({
          where: { settingKey },
          update: { settingValue, updatedAt: new Date() },
          create: { id: randomUUID(), settingKey, settingValue, updatedAt: new Date() },
        }),
      ));
      return { success: true };
    }),

  // ── Admin: centres and services ──────────────────────────────────
  adminListCentres: adminProcedure.query(async () => {
    return prisma.healthcareCentre.findMany({
      orderBy: { createdAt: "desc" },
      include: { Services: { orderBy: { createdAt: "desc" } } },
    });
  }),

  adminCreateCentre: adminProcedure
    .input(z.object({ name: z.string().min(2), location: z.string().optional() }))
    .mutation(async ({ input }) => {
      return prisma.healthcareCentre.create({
        data: { id: randomUUID(), name: input.name, location: input.location },
      });
    }),

  adminToggleCentre: adminProcedure
    .input(z.object({ centreId: z.string(), isActive: z.boolean() }))
    .mutation(async ({ input }) => {
      await prisma.healthcareCentre.update({ where: { id: input.centreId }, data: { isActive: input.isActive } });
      return { success: true };
    }),

  adminCreateService: adminProcedure
    .input(z.object({
      centreId: z.string(),
      name: z.string().min(2),
      price: z.number().int().min(0),
      discountOnly: z.boolean().default(false),
    }))
    .mutation(async ({ input }) => {
      return prisma.healthcareService.create({
        data: {
          id: randomUUID(),
          centreId: input.centreId,
          name: input.name,
          price: input.price,
          discountOnly: input.discountOnly,
        },
      });
    }),

  adminToggleService: adminProcedure
    .input(z.object({ serviceId: z.string(), isActive: z.boolean() }))
    .mutation(async ({ input }) => {
      await prisma.healthcareService.update({ where: { id: input.serviceId }, data: { isActive: input.isActive } });
      return { success: true };
    }),

  // ── Admin / centre staff: redemption (SSC / QR scan) ─────────────
  adminLookupCard: adminProcedure
    .input(z.object({ sscCode: z.string().min(3) }))
    .query(async ({ input }) => {
      const card = await prisma.healthcareCard.findUnique({
        where: { sscCode: input.sscCode.trim().toUpperCase() },
        include: { User: { select: { id: true, name: true, email: true } } },
      });
      if (!card) return null;
      const settings = await loadHealthcareSettings(prisma);
      const profile = await loadMemberHealthcareProfile(prisma, card.userId);
      return {
        card,
        discountPct: discountPctForTier(settings, profile.tierNumber),
        tierNumber: profile.tierNumber,
      };
    }),

  adminRedeemCard: adminProcedure
    .input(z.object({ sscCode: z.string().min(3), centreId: z.string(), serviceId: z.string().optional() }))
    .mutation(async ({ ctx, input }) => {
      const adminId = (ctx.session?.user as any)?.id as string | undefined;
      return redeemHealthcareCard(prisma, {
        sscCode: input.sscCode.trim().toUpperCase(),
        centreId: input.centreId,
        serviceId: input.serviceId,
        recordedByUserId: adminId,
      });
    }),
});
