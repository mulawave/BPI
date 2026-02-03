import { z } from "zod";
import { createTRPCRouter, protectedProcedure, publicProcedure } from "../trpc";
import { TRPCError } from "@trpc/server";
import { sendEmail } from "@/lib/email";

const mapRewardConfig = (rc?: any) => {
  if (!rc) return [] as any[];
  return [
    {
      reward_id: rc.id,
      reward_type: rc.rewardType,
      reward_value: Number(rc.rewardValue ?? 0),
      reward_value_type: rc.rewardValueType,
      vesting_rule: rc.vestingRule,
      max_reward_cap: rc.maxRewardCap ? Number(rc.maxRewardCap) : null,
      utility_token_symbol: rc.utilityTokenSymbol,
      is_active: rc.isActive,
    },
  ];
};

const mapProduct = (product: any) => {
  return {
    product_id: product.id,
    name: product.name,
    description: product.description,
    product_type: product.productType?.toLowerCase?.() ?? product.productType,
    base_price_fiat: Number(product.basePriceFiat ?? 0),
    accepted_tokens: product.acceptedTokens ?? [],
    token_payment_limits: (product.tokenPaymentLimits as Record<string, number>) ?? {},
    reward_config: mapRewardConfig(product.rewardConfig),
    inventory_type: product.inventoryType?.toLowerCase?.() ?? product.inventoryType,
    status: product.status?.toLowerCase?.() ?? product.status,
    hero_badge: product.heroBadge,
    images: product.images ?? [],
    featured: product.featured,
    pickup_center_id: product.pickupCenterId,
    reward_center_id: product.rewardCenterId,
    delivery_required: product.deliveryRequired,
    created_at: product.createdAt,
    updated_at: product.updatedAt,
  };
};

const mapOrder = (order: any) => {
  return {
    id: order.id,
    product_id: order.productId,
    user_id: order.userId,
    quantity: order.quantity,
    status: order.status,
    claim_status: order.claimStatus,
    claim_code: order.claimCode,
    pickup_verified_at: order.pickupVerifiedAt,
    pickup_verified_by: order.pickupVerifiedBy,
    pickup_completion_confirmed_at: order.pickupCompletionConfirmedAt,
    pickup_completion_confirmed_by: order.pickupCompletionConfirmedBy,
    feedback_invitation_sent_at: order.feedbackInvitationSentAt,
    feedback_submitted_at: order.feedbackSubmittedAt,
    reward_settlement_state: order.rewardSettlementState,
    pricing_snapshot: order.pricingSnapshot,
    payment_breakdown: order.paymentBreakdown,
    reward_config_snapshot: order.rewardConfigSnapshot,
    token_rate_snapshot: order.tokenRateSnapshot,
    pickup_center_id: order.pickupCenterId,
    reward_center_id: order.rewardCenterId,
    pickup_center: order.pickupCenter
      ? {
          id: order.pickupCenter.id,
          name: order.pickupCenter.name,
          addressLine1: order.pickupCenter.addressLine1,
          addressLine2: order.pickupCenter.addressLine2,
          city: order.pickupCenter.city,
          state: order.pickupCenter.state,
          country: order.pickupCenter.country,
          contactName: order.pickupCenter.contactName,
          contactEmail: order.pickupCenter.contactEmail,
          contactPhone: order.pickupCenter.contactPhone,
          isActive: order.pickupCenter.isActive,
          logoUrl: order.pickupCenter.logoUrl,
        }
      : null,
    pickup_experience_rating: order.pickupExperienceRating
      ? {
          id: order.pickupExperienceRating.id,
          rating: order.pickupExperienceRating.rating,
          comment: order.pickupExperienceRating.comment,
          created_at: order.pickupExperienceRating.createdAt,
          updated_at: order.pickupExperienceRating.updatedAt,
        }
      : null,
    created_at: order.createdAt,
    updated_at: order.updatedAt,
    product: order.product ? mapProduct(order.product) : null,
  };
};

const generateClaimCode = async (prisma: any) => {
  let claimCode = "";
  let exists = true;
  // Loop until we find an unused claim code; initialization avoids TS unassigned error.
  while (exists) {
    const rand = Math.floor(100000 + Math.random() * 900000);
    claimCode = `BPI-${rand}-PC`;
    const found = await prisma.order.findFirst({ where: { claimCode } });
    exists = Boolean(found);
  }
  return claimCode;
};

const resolvePickupCenterLocations = async (centers: any[], prisma: any) => {
  const countryIds = new Set<number>();
  const stateIds = new Set<number>();
  const cityIds = new Set<number>();

  centers.forEach((c) => {
    const countryNum = Number(c.country);
    const stateNum = Number(c.state);
    const cityNum = Number(c.city);
    if (!Number.isNaN(countryNum)) countryIds.add(countryNum);
    if (!Number.isNaN(stateNum)) stateIds.add(stateNum);
    if (!Number.isNaN(cityNum)) cityIds.add(cityNum);
  });

  const [countries, states, cities] = await Promise.all([
    countryIds.size ? prisma.country.findMany({ where: { id: { in: Array.from(countryIds) } } }) : [],
    stateIds.size ? prisma.state.findMany({ where: { id: { in: Array.from(stateIds) } } }) : [],
    cityIds.size ? prisma.city.findMany({ where: { id: { in: Array.from(cityIds) } } }) : [],
  ]);

  const countryMap = new Map(countries.map((c: any) => [String(c.id), c.name]));
  const stateMap = new Map(states.map((s: any) => [String(s.id), s.name]));
  const cityMap = new Map(cities.map((c: any) => [String(c.id), c.name]));

  return centers.map((c) => ({
    ...c,
    country: countryMap.get(String(c.country)) ?? c.country,
    state: stateMap.get(String(c.state)) ?? c.state,
    city: cityMap.get(String(c.city)) ?? c.city,
  }));
};

export const storeRouter = createTRPCRouter({
  listProducts: protectedProcedure
    .input(z.object({ status: z.string().optional(), type: z.string().optional(), query: z.string().optional() }).optional())
    .query(async ({ ctx, input }) => {
      const status = input?.status ?? "all";
      const type = input?.type ?? "all";
      const query = input?.query?.toLowerCase?.() ?? "";

      const products = await (ctx.prisma as any).product.findMany({
        where: {
          AND: [
            status !== "all" ? { status: status.toUpperCase() as any } : {},
            type !== "all" ? { productType: type.toUpperCase() as any } : {},
            query
              ? {
                  OR: [
                    { name: { contains: query, mode: "insensitive" } },
                    { description: { contains: query, mode: "insensitive" } },
                  ],
                }
              : {},
          ],
        },
        include: { rewardConfig: true },
        orderBy: [{ createdAt: "desc" }],
      });

      return products.map(mapProduct);
    }),

  getProduct: protectedProcedure.input(z.object({ id: z.string() })).query(async ({ ctx, input }) => {
    const product = await (ctx.prisma as any).product.findUnique({
      where: { id: input.id },
      include: { rewardConfig: true },
    });
    return product ? mapProduct(product) : null;
  }),

  listTokenRates: protectedProcedure.query(async ({ ctx }) => {
    const rates = await (ctx.prisma as any).tokenRate.findMany({ orderBy: [{ effectiveAt: "desc" }] });
    return rates.map((r: any) => ({
      id: r.id,
      symbol: r.symbol,
      rate_to_fiat: Number(r.rateToFiat ?? 0),
      source: r.source,
      effective_at: r.effectiveAt,
    }));
  }),

  adminUpsertProduct: protectedProcedure
    .input(
      z.object({
        id: z.string().optional(),
        name: z.string().min(1),
        description: z.string().min(1),
        productType: z.enum(["PHYSICAL", "DIGITAL", "LICENSE", "SERVICE", "UTILITY"]),
        basePriceFiat: z.number().positive(),
        acceptedTokens: z.array(z.string().min(1)),
        tokenPaymentLimits: z.record(z.number().min(0).max(1)),
        rewardConfigId: z.string().optional(),
        inventoryType: z.enum(["UNLIMITED", "LIMITED", "TIME_BOUND"]).default("UNLIMITED"),
        status: z.enum(["ACTIVE", "PAUSED", "RETIRED"]).default("ACTIVE"),
        pickupCenterId: z.string().optional(),
        rewardCenterId: z.string().optional(),
        deliveryRequired: z.boolean().default(false),
        heroBadge: z.string().optional().nullable(),
        featured: z.boolean().default(false),
        images: z.array(z.string()).default([]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const data = {
        name: input.name,
        description: input.description,
        productType: input.productType,
        basePriceFiat: input.basePriceFiat,
        acceptedTokens: input.acceptedTokens,
        tokenPaymentLimits: input.tokenPaymentLimits,
        rewardConfigId: input.rewardConfigId,
        inventoryType: input.inventoryType,
        status: input.status,
        pickupCenterId: input.pickupCenterId,
        rewardCenterId: input.rewardCenterId,
        deliveryRequired: input.deliveryRequired,
        heroBadge: input.heroBadge ?? undefined,
        images: input.images ?? [],
        featured: input.featured,
      };

      const product = input.id
        ? await (ctx.prisma as any).product.update({ where: { id: input.id }, data, include: { rewardConfig: true } })
        : await (ctx.prisma as any).product.create({ data, include: { rewardConfig: true } });

      return mapProduct(product);
    }),

  adminUpsertRewardConfig: protectedProcedure
    .input(
      z.object({
        id: z.string().optional(),
        rewardType: z.enum(["CASH", "CASHBACK", "BPT", "UTILITY_TOKEN"]),
        rewardValue: z.number(),
        rewardValueType: z.enum(["FIXED", "PERCENTAGE"]),
        vestingRule: z.string(),
        maxRewardCap: z.number().nullable().optional(),
        utilityTokenSymbol: z.string().nullable().optional(),
        isActive: z.boolean().default(true),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const data = {
        rewardType: input.rewardType,
        rewardValue: input.rewardValue,
        rewardValueType: input.rewardValueType,
        vestingRule: input.vestingRule,
        maxRewardCap: input.maxRewardCap ?? undefined,
        utilityTokenSymbol: input.utilityTokenSymbol ?? undefined,
        isActive: input.isActive,
      };

      const rewardConfig = input.id
        ? await (ctx.prisma as any).rewardConfig.update({ where: { id: input.id }, data })
        : await (ctx.prisma as any).rewardConfig.create({ data });

      return {
        reward_id: rewardConfig.id,
        reward_type: rewardConfig.rewardType,
        reward_value: Number(rewardConfig.rewardValue ?? 0),
        reward_value_type: rewardConfig.rewardValueType,
        vesting_rule: rewardConfig.vestingRule,
        max_reward_cap: rewardConfig.maxRewardCap ? Number(rewardConfig.maxRewardCap) : null,
        utility_token_symbol: rewardConfig.utilityTokenSymbol,
        is_active: rewardConfig.isActive,
      };
    }),

  adminUpsertTokenRate: protectedProcedure
    .input(
      z.object({
        id: z.string().optional(),
        symbol: z.string().min(1),
        rateToFiat: z.number().positive(),
        source: z.enum(["FIXED", "ADMIN_DAILY", "ORACLE_FUTURE"]).default("FIXED"),
        effectiveAt: z.coerce.date().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const data = {
        symbol: input.symbol,
        rateToFiat: input.rateToFiat,
        source: input.source,
        effectiveAt: input.effectiveAt ?? new Date(),
      };

      const rate = input.id
        ? await (ctx.prisma as any).tokenRate.update({ where: { id: input.id }, data })
        : await (ctx.prisma as any).tokenRate.create({ data });

      return {
        id: rate.id,
        symbol: rate.symbol,
        rate_to_fiat: Number(rate.rateToFiat ?? 0),
        source: rate.source,
        effective_at: rate.effectiveAt,
      };
    }),

  adminUpsertPickupCenter: protectedProcedure
    .input(
      z.object({
        id: z.string().optional(),
        name: z.string().min(1),
        addressLine1: z.string().min(1),
        addressLine2: z.string().optional().nullable(),
        city: z.string().min(1),
        state: z.string().min(1),
        country: z.string().min(1),
        contactName: z.string().optional().nullable(),
        contactPhone: z.string().optional().nullable(),
        contactEmail: z.string().email().optional().nullable(),
        isActive: z.boolean().default(true),
        logoUrl: z.union([z.string().url(), z.string().min(1)]).optional().nullable(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const data = {
        name: input.name,
        addressLine1: input.addressLine1,
        addressLine2: input.addressLine2 ?? undefined,
        city: input.city,
        state: input.state,
        country: input.country,
        contactName: input.contactName ?? undefined,
        contactPhone: input.contactPhone ?? undefined,
        contactEmail: input.contactEmail ?? undefined,
        isActive: input.isActive,
        logoUrl: input.logoUrl ?? undefined,
      };

      const center = input.id
        ? await (ctx.prisma as any).pickupCenter.update({ where: { id: input.id }, data })
        : await (ctx.prisma as any).pickupCenter.create({ data });

      return center;
    }),

  adminUpsertRewardCenter: protectedProcedure
    .input(
      z.object({
        id: z.string().optional(),
        name: z.string().min(1),
        description: z.string().optional().nullable(),
        isActive: z.boolean().default(true),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const data = {
        name: input.name,
        description: input.description ?? undefined,
        isActive: input.isActive,
      };

      const center = input.id
        ? await (ctx.prisma as any).rewardCenter.update({ where: { id: input.id }, data })
        : await (ctx.prisma as any).rewardCenter.create({ data });

      return center;
    }),

  listPickupCenters: protectedProcedure.query(async ({ ctx }) => {
    const centers = await (ctx.prisma as any).pickupCenter.findMany({ orderBy: [{ createdAt: "desc" }] });
    return resolvePickupCenterLocations(centers, ctx.prisma as any);
  }),

  listPickupCentersPublic: publicProcedure.query(async ({ ctx }) => {
    const centers = await (ctx.prisma as any).pickupCenter.findMany({ where: { isActive: true }, orderBy: [{ createdAt: "desc" }] });
    return resolvePickupCenterLocations(centers, ctx.prisma as any);
  }),

  listRewardCenters: protectedProcedure.query(async ({ ctx }) => {
    return (ctx.prisma as any).rewardCenter.findMany({ orderBy: [{ createdAt: "desc" }] });
  }),

  listRewardConfigs: protectedProcedure.query(async ({ ctx }) => {
    const configs = await (ctx.prisma as any).rewardConfig.findMany({ orderBy: [{ createdAt: "desc" }] });
    return configs.map((rewardConfig: any) => ({
      reward_id: rewardConfig.id,
      reward_type: rewardConfig.rewardType,
      reward_value: Number(rewardConfig.rewardValue ?? 0),
      reward_value_type: rewardConfig.rewardValueType,
      vesting_rule: rewardConfig.vestingRule,
      max_reward_cap: rewardConfig.maxRewardCap ? Number(rewardConfig.maxRewardCap) : null,
      utility_token_symbol: rewardConfig.utilityTokenSymbol,
      is_active: rewardConfig.isActive,
    }));
  }),

  listOrders: protectedProcedure
    .input(
      z
        .object({
          status: z.array(z.enum(["PENDING", "PAID", "PROCESSING", "DELIVERED", "COMPLETED", "FAILED", "REFUNDED"])).optional(),
          userId: z.string().optional(),
        })
        .optional()
    )
    .query(async ({ ctx, input }) => {
      const orders = await (ctx.prisma as any).order.findMany({
        where: {
          AND: [
            input?.status ? { status: { in: input.status } } : {},
            input?.userId ? { userId: input.userId } : {},
          ],
        },
        include: { product: { include: { rewardConfig: true } }, pickupCenter: true, pickupExperienceRating: true },
        orderBy: { createdAt: "desc" },
      });

      return orders.map(mapOrder);
    }),

  adminUpdateOrderStatus: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        status: z.enum(["PENDING", "PAID", "PROCESSING", "DELIVERED", "COMPLETED", "FAILED", "REFUNDED"]),
        rewardSettlementState: z.enum(["PENDING", "ISSUED", "FAILED"]).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const order = await (ctx.prisma as any).order.update({
        where: { id: input.id },
        data: {
          status: input.status,
          rewardSettlementState: input.rewardSettlementState ?? undefined,
        },
        include: { product: { include: { rewardConfig: true } }, pickupCenter: true, pickupExperienceRating: true },
      });

      return mapOrder(order);
    }),

  createCheckoutIntent: protectedProcedure
    .input(
      z.object({
        productId: z.string(),
        quantity: z.number().int().min(1).max(10).default(1),
        tokenSymbol: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (process.env.STORE_CHECKOUT_PAUSED === "true") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Checkout is temporarily paused" });
      }

      const product = await (ctx.prisma as any).product.findUnique({ where: { id: input.productId }, include: { rewardConfig: true } });
      if (!product) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Product not found" });
      }

      if (product.status !== "ACTIVE") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Product is not available for checkout" });
      }

      const symbol = input.tokenSymbol ?? product.acceptedTokens?.[0];
      if (!symbol) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "No accepted token configured" });
      }

      const tokenLimitMap = (product.tokenPaymentLimits as Record<string, number>) || {};
      const tokenLimit = tokenLimitMap[symbol] ?? 0;

      const tokenRate = await (ctx.prisma as any).tokenRate.findFirst({ where: { symbol }, orderBy: { effectiveAt: "desc" } });
      if (!tokenRate) {
        throw new TRPCError({ code: "BAD_REQUEST", message: `No rate available for ${symbol}` });
      }

      const basePriceFiat = Number(product.basePriceFiat ?? 0);
      const quantity = input.quantity;
      const totalFiat = basePriceFiat * quantity;
      const tokenPortionFiat = Math.min(totalFiat * tokenLimit, totalFiat);
      const tokenAmount = tokenPortionFiat > 0 ? tokenPortionFiat / Number(tokenRate.rateToFiat ?? 1) : 0;
      const fiatPortion = totalFiat - tokenPortionFiat;

      const rewardSnapshot = product.rewardConfig && product.rewardConfig.isActive
        ? {
            reward_id: product.rewardConfig.id,
            reward_type: product.rewardConfig.rewardType,
            reward_value: Number(product.rewardConfig.rewardValue ?? 0),
            reward_value_type: product.rewardConfig.rewardValueType,
            vesting_rule: product.rewardConfig.vestingRule,
            max_reward_cap: product.rewardConfig.maxRewardCap ? Number(product.rewardConfig.maxRewardCap) : null,
            utility_token_symbol: product.rewardConfig.utilityTokenSymbol,
            is_active: product.rewardConfig.isActive,
          }
        : null;

      const order = await (ctx.prisma as any).order.create({
        data: {
          productId: product.id,
          userId: ctx.user.id,
          quantity,
          pricingSnapshot: {
            base_price_fiat: basePriceFiat,
            quantity,
            token_symbol: symbol,
            token_limit: tokenLimit,
            token_portion_fiat: tokenPortionFiat,
            token_amount: tokenAmount,
            fiat_portion: fiatPortion,
            total_fiat: totalFiat,
          },
          paymentBreakdown: {
            token: tokenPortionFiat > 0 ? { symbol, amount: tokenAmount, fiat_value: tokenPortionFiat } : null,
            fiat: fiatPortion,
          },
          rewardConfigSnapshot: rewardSnapshot,
          tokenRateSnapshot: {
            symbol,
            rate_to_fiat: Number(tokenRate.rateToFiat ?? 0),
            effective_at: tokenRate.effectiveAt,
          },
          pickupCenterId: product.pickupCenterId ?? null,
          rewardCenterId: product.rewardCenterId ?? null,
        },
        include: { product: true },
      });

      return {
        intentId: order.id,
        redirectUrl: `/store/${product.id}?checkout=1&intent=${order.id}`,
        orderId: order.id,
        productId: product.id,
        quantity,
        pricingSnapshot: order.pricingSnapshot,
        paymentBreakdown: order.paymentBreakdown,
        rewardConfigSnapshot: order.rewardConfigSnapshot,
        tokenRateSnapshot: order.tokenRateSnapshot,
      };
    }),

  confirmCheckoutIntent: protectedProcedure
    .input(
      z.object({
        intentId: z.string(),
        paymentMode: z.enum(["FIAT", "HYBRID", "TOKEN"]).default("FIAT"),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const existing = await (ctx.prisma as any).order.findUnique({
        where: { id: input.intentId },
        include: { product: { include: { rewardConfig: true } } },
      });

      if (!existing) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Checkout intent not found" });
      }

      if (existing.userId !== ctx.user.id) {
        throw new TRPCError({ code: "FORBIDDEN", message: "You cannot confirm this checkout" });
      }

      if (existing.status !== "PENDING") {
        return mapOrder(existing);
      }

      const paymentBreakdown = {
        ...(existing.paymentBreakdown as Record<string, unknown>),
        payment_mode: input.paymentMode,
        confirmed_at: new Date().toISOString(),
      };

      const claimCode = await generateClaimCode(ctx.prisma as any);

      const updated = await (ctx.prisma as any).order.update({
        where: { id: existing.id },
        data: {
          status: "PROCESSING",
          claimStatus: "CODE_ISSUED",
          claimCode,
          paymentBreakdown,
        },
        include: { product: { include: { rewardConfig: true, pickupCenter: true } }, user: true, pickupCenter: true },
      });

      if (ctx.user?.email) {
        await sendEmail({
          to: ctx.user.email,
          subject: "Your BPI pickup claim code",
          html: `<p>Hello ${ctx.user.name ?? ""},</p><p>Your order for <strong>${updated.product?.name ?? "your item"}</strong> is confirmed.</p><p><strong>Claim Code:</strong> ${claimCode}</p><p>Please present this code and a valid ID at the pickup center to receive your item.</p>`,
        });
      }

      const pickupEmail = updated.pickupCenter?.contactEmail;
      if (pickupEmail) {
        await sendEmail({
          to: pickupEmail,
          subject: "New pickup order assigned",
          html: `<p>A new order has been assigned to your pickup center.</p><p>Product: ${updated.product?.name ?? "Item"}</p><p>Claim Code: ${claimCode}</p>`,
        });
      }

      // Record revenue from store purchase
      const breakdown = paymentBreakdown as any;
      const fiatAmount = breakdown?.fiat_amount || breakdown?.total_fiat || 0;
      
      if (fiatAmount > 0) {
        await recordRevenue(ctx.prisma, {
          source: "STORE_PURCHASE",
          amount: fiatAmount,
          currency: "NGN",
          sourceId: updated.id,
          description: `Store purchase: ${updated.product?.name || 'Product'}`,
        });
      }

      return mapOrder(updated);
    }),

  verifyClaimCode: protectedProcedure
    .input(
      z.object({
        code: z
          .string()
          .trim()
          .regex(/^BPI-[0-9]{6}-PC$/i, "Invalid claim code format"),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const normalizedCode = input.code.toUpperCase();
      const order = await (ctx.prisma as any).order.findFirst({
        where: { claimCode: normalizedCode },
        include: { product: true, user: true, pickupCenter: true },
      });

      if (!order) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Claim code is invalid" });
      }

      if (order.claimStatus === "VERIFIED" || order.claimStatus === "COMPLETED") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Claim code already verified" });
      }

      if (order.claimStatus !== "CODE_ISSUED") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Order is not ready for verification" });
      }

      if (order.status !== "PROCESSING" && order.status !== "DELIVERED" && order.status !== "PAID") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Order state does not allow verification" });
      }

      const updated = await (ctx.prisma as any).order.update({
        where: { id: order.id },
        data: {
          claimStatus: "VERIFIED",
          status: "DELIVERED",
          pickupVerifiedAt: new Date(),
          pickupVerifiedBy: ctx.user.id,
        },
        include: { product: true, user: true, pickupCenter: true },
      });

      if (updated.user?.email) {
        await sendEmail({
          to: updated.user.email,
          subject: "Pickup verified - confirm receipt",
          html: `<p>Hello ${updated.user.name ?? ""},</p><p>Your pickup for <strong>${updated.product?.name ?? "your item"}</strong> has been verified at the center.</p><p>Please confirm receipt in your dashboard to finalize and leave a rating.</p>`,
        });
      }

      const pickupEmail = updated.pickupCenter?.contactEmail;
      if (pickupEmail) {
        await sendEmail({
          to: pickupEmail,
          subject: "Pickup verified",
          html: `<p>The claim code ${updated.claimCode ?? ""} was verified by ${ctx.user.name ?? "pickup staff"}.</p>`,
        });
      }

      return mapOrder(updated);
    }),

  completeClaim: protectedProcedure
    .input(z.object({ orderId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const order = await (ctx.prisma as any).order.findUnique({ where: { id: input.orderId }, include: { product: true, pickupCenter: true, user: true } });
      if (!order) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Order not found" });
      }
      if (order.userId !== ctx.user.id) {
        throw new TRPCError({ code: "FORBIDDEN", message: "You cannot confirm this order" });
      }
      if (order.claimStatus === "COMPLETED") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Order already completed" });
      }
      if (order.claimStatus !== "VERIFIED") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Order is not ready for completion" });
      }

      const updated = await (ctx.prisma as any).order.update({
        where: { id: order.id },
        data: {
          claimStatus: "COMPLETED",
          status: "COMPLETED",
          pickupCompletionConfirmedAt: new Date(),
          pickupCompletionConfirmedBy: ctx.user.id,
          feedbackInvitationSentAt: order.feedbackInvitationSentAt ?? new Date(),
        },
        include: { product: true, pickupCenter: true, user: true },
      });

      const pickupEmail = updated.pickupCenter?.contactEmail;
      if (pickupEmail) {
        await sendEmail({
          to: pickupEmail,
          subject: "Pickup completed",
          html: `<p>The order for ${updated.product?.name ?? "item"} (claim code ${updated.claimCode ?? ""}) has been marked completed by the customer.</p>`,
        });
      }

      if (updated.user?.email) {
        await sendEmail({
          to: updated.user.email,
          subject: "Thanks for confirming pickup — please rate",
          html: `<p>Hello ${updated.user.name ?? ""},</p><p>Thanks for confirming your pickup for <strong>${updated.product?.name ?? "your item"}</strong>.</p><p>Please share a quick rating of your pickup experience:</p><p><a href="${process.env.NEXTAUTH_URL ?? ""}/store/orders" target="_blank" rel="noreferrer">Rate pickup</a></p>`,
        });
      }

      return mapOrder(updated);
    }),

  submitPickupRating: protectedProcedure
    .input(z.object({ orderId: z.string(), rating: z.number().int().min(1).max(5), comment: z.string().max(1000).optional() }))
    .mutation(async ({ ctx, input }) => {
      const order = await (ctx.prisma as any).order.findUnique({ where: { id: input.orderId }, include: { pickupCenter: true } });
      if (!order) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Order not found" });
      }
      if (order.userId !== ctx.user.id) {
        throw new TRPCError({ code: "FORBIDDEN", message: "You cannot rate this order" });
      }
      if (order.claimStatus !== "COMPLETED") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Complete pickup before rating" });
      }

      await (ctx.prisma as any).pickupExperienceRating.upsert({
        where: { orderId: order.id },
        create: {
          orderId: order.id,
          userId: ctx.user.id,
          pickupCenterId: order.pickupCenterId ?? null,
          rating: input.rating,
          comment: input.comment ?? null,
        },
        update: {
          rating: input.rating,
          comment: input.comment ?? null,
        },
      });

      await (ctx.prisma as any).order.update({
        where: { id: order.id },
        data: { feedbackSubmittedAt: new Date() },
      });

      return { success: true };
    }),

  listMyOrders: protectedProcedure
    .input(z.object({ status: z.array(z.enum(["PENDING", "PAID", "PROCESSING", "DELIVERED", "COMPLETED", "FAILED", "REFUNDED"])).optional() }).optional())
    .query(async ({ ctx, input }) => {
      const orders = await (ctx.prisma as any).order.findMany({
        where: {
          userId: ctx.user.id,
          ...(input?.status ? { status: { in: input.status } } : {}),
        },
        include: { product: { include: { rewardConfig: true } }, pickupCenter: true, pickupExperienceRating: true },
        orderBy: { createdAt: "desc" },
      });
      return orders.map(mapOrder);
    }),
});
