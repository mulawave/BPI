import { z } from "zod";
import { createTRPCRouter, protectedProcedure, publicProcedure, adminProcedure } from "../trpc";
import { TRPCError } from "@trpc/server";
import { sendEmail } from "@/lib/email";
import { PAYMENT_FULFILLMENT_TYPES } from "@/server/services/payment/paymentMetadata";
import { recordRevenue } from "@/server/services/revenue.service";
import { randomUUID } from "crypto";
import { canActOnCenter, resolvePickupAccess } from "@/server/services/pickup-access.service";

async function getAdminSettingNumber(prisma: any, key: string, defaultValue: number): Promise<number> {
  try {
    const setting = await prisma.adminSettings.findUnique({ where: { settingKey: key } });
    if (!setting?.settingValue) return defaultValue;
    const parsed = Number(setting.settingValue);
    return Number.isFinite(parsed) ? parsed : defaultValue;
  } catch {
    return defaultValue;
  }
}

function normalizePercent(maybePercent: number, fallback: number): number {
  if (!Number.isFinite(maybePercent) || maybePercent < 0) return fallback;
  if (maybePercent > 1) return maybePercent / 100;
  return maybePercent;
}

function clampNumber(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return min;
  return Math.min(max, Math.max(min, value));
}

function normalizeRewardPercent(value: number): number {
  if (!Number.isFinite(value)) return 0;
  const normalized = value > 1 ? value / 100 : value;
  return clampNumber(normalized, 0, 1);
}

async function resolveSponsorChain(prisma: any, buyerUserId: string, maxLevels = 4): Promise<string[]> {
  const chain: string[] = [];
  let current = buyerUserId;

  for (let i = 0; i < maxLevels; i++) {
    const referral = await prisma.referral.findFirst({
      where: { referredId: current },
      select: { referrerId: true },
    });

    const next = referral?.referrerId;
    if (!next) break;
    if (chain.includes(next)) break;

    chain.push(next);
    current = next;
  }

  return chain;
}

type SettlementResult = {
  success: boolean;
  configFound: boolean;
  levelsCount: number;
  sponsorChainLength: number;
  payoutsIssued: number;
  skippedReasons: string[];
  message: string;
};

async function settleStoreReferralRewards(prisma: any, orderId: string): Promise<SettlementResult> {
  const report: SettlementResult = {
    success: false,
    configFound: false,
    levelsCount: 0,
    sponsorChainLength: 0,
    payoutsIssued: 0,
    skippedReasons: [],
    message: "",
  };

  try {
    await prisma.$transaction(async (tx: any) => {
      const order = await tx.order.findUnique({
        where: { id: orderId },
        select: {
          id: true,
          productId: true,
          userId: true,
          createdAt: true,
          pricingSnapshot: true,
          rewardSettlementState: true,
          claimStatus: true,
          status: true,
        },
      });

      if (!order) {
        report.message = "Order not found.";
        return;
      }
      if (order.rewardSettlementState === "ISSUED") {
        report.message = "Rewards already issued for this order.";
        report.success = true;
        return;
      }
      if (order.claimStatus !== "COMPLETED" || order.status !== "COMPLETED") {
        report.skippedReasons.push(`Order status is ${order.status}, claimStatus is ${order.claimStatus}. Both must be COMPLETED.`);
        report.message = `Order is not COMPLETED (status: ${order.status}, claim: ${order.claimStatus}).`;
        return;
      }

      const now = new Date();
      const commonWhere: any = {
        isActive: true,
        OR: [{ startsAt: null }, { startsAt: { lte: now } }],
        AND: [{ OR: [{ endsAt: null }, { endsAt: { gte: now } }] }],
      };

      const productScopedConfig = order.productId
        ? await tx.storeRewardConfig.findFirst({
            where: { ...commonWhere, productId: order.productId },
            include: { levels: true },
            orderBy: { updatedAt: "desc" },
          })
        : null;

      const globalConfig = await tx.storeRewardConfig.findFirst({
        where: { ...commonWhere, productId: null },
        include: { levels: true },
        orderBy: { updatedAt: "desc" },
      });

      const activeConfig = productScopedConfig ?? globalConfig;

      const levels = (activeConfig?.levels ?? [])
        .filter((l: any) => Number.isFinite(l.level) && l.level >= 1 && l.level <= 4)
        .sort((a: any, b: any) => a.level - b.level);

      // No active config means nothing to pay yet; leave as PENDING so a future config addition can trigger settlement.
      if (!activeConfig || levels.length === 0) {
        report.skippedReasons.push("No active reward config with levels found for this product or globally.");
        report.message = "No active reward config found. Create and activate a config with levels, then retry.";
        return;
      }

      report.configFound = true;
      report.levelsCount = levels.length;

      const pricing = (order.pricingSnapshot as any) ?? {};
      const grossFiat = Number(pricing.total_fiat ?? pricing.totalFiat ?? pricing.base_price_fiat ?? 0);
      const profitFiat = Number(pricing.profit_fiat ?? 0);

      const sponsorChain = await resolveSponsorChain(tx, order.userId, 4);
      report.sponsorChainLength = sponsorChain.length;

      if (sponsorChain.length === 0) {
        report.skippedReasons.push("No sponsor chain found for this buyer. Ensure the buyer has a referrer.");
        report.message = "No sponsor chain found for this buyer. Ensure the buyer has an active referrer.";
      }

      for (const levelConfig of levels) {
        const level = Number(levelConfig.level);
        const recipientUserId = sponsorChain[level - 1];
        if (!recipientUserId) {
          report.skippedReasons.push(`Level ${level}: no recipient in sponsor chain.`);
          continue;
        }

        const basis = levelConfig.rewardBasis;
        const basisAmountFiat = basis === "PROFIT" ? profitFiat : grossFiat;
        if (!Number.isFinite(basisAmountFiat) || basisAmountFiat <= 0) {
          report.skippedReasons.push(`Level ${level}: basis amount is zero or invalid.`);
          continue;
        }

        let payoutFiat = 0;
        if (levelConfig.rewardValueType === "PERCENTAGE") {
          const pct = normalizeRewardPercent(Number(levelConfig.rewardValue));
          payoutFiat = basisAmountFiat * pct;
        } else {
          payoutFiat = Number(levelConfig.rewardValue);
        }

        if (levelConfig.maxRewardCap != null) {
          payoutFiat = Math.min(payoutFiat, Number(levelConfig.maxRewardCap));
        }

        payoutFiat = clampNumber(payoutFiat, 0, Number.MAX_SAFE_INTEGER);
        if (payoutFiat <= 0) {
          report.skippedReasons.push(`Level ${level}: calculated payout is zero.`);
          continue;
        }

        // Idempotency guard: only credit if we successfully create the ledger row.
        let createdLedger = false;
        try {
          await tx.storeReferralRewardLedger.create({
            data: {
              orderId: order.id,
              buyerUserId: order.userId,
              recipientUserId,
              level,
              basis,
              basisAmountFiat: basisAmountFiat.toFixed(2),
              payoutType: levelConfig.payoutType,
              payoutAmountFiat: ["CASH", "CASHBACK"].includes(levelConfig.payoutType) ? payoutFiat.toFixed(2) : null,
              tokenSymbol: null,
              tokenAmount: null,
            },
          });
          createdLedger = true;
        } catch (e: any) {
          if (e?.code === "P2002") {
            createdLedger = false;
          } else {
            throw e;
          }
        }

        if (!createdLedger) continue;

        if (levelConfig.payoutType === "CASH") {
          await tx.user.update({
            where: { id: recipientUserId },
            data: { wallet: { increment: payoutFiat } },
          });

          await tx.transaction.create({
            data: {
              userId: recipientUserId,
              transactionType: "STORE_REFERRAL_REWARD_CASH",
              amount: payoutFiat,
              description: `Store referral reward (L${level}) for order ${order.id}`,
              status: "completed",
              reference: `STORE-REF-${order.id}-L${level}-${Date.now()}`,
              walletType: "wallet",
            },
          });
          report.payoutsIssued += 1;
        } else if (levelConfig.payoutType === "CASHBACK") {
          await tx.user.update({
            where: { id: recipientUserId },
            data: { cashback: { increment: payoutFiat } },
          });

          await tx.transaction.create({
            data: {
              userId: recipientUserId,
              transactionType: "STORE_REFERRAL_REWARD_CASHBACK",
              amount: payoutFiat,
              description: `Store referral reward cashback (L${level}) for order ${order.id}`,
              status: "completed",
              reference: `STORE-REF-CB-${order.id}-L${level}-${Date.now()}`,
              walletType: "cashback",
            },
          });
          report.payoutsIssued += 1;
        } else if (levelConfig.payoutType === "BPT") {
          const symbol = "BPT";
          const rate = await tx.tokenRate.findFirst({
            where: { symbol },
            orderBy: { effectiveAt: "desc" },
          });
          const rateToFiat = Number(rate?.rateToFiat ?? 0);
          if (!Number.isFinite(rateToFiat) || rateToFiat <= 0) {
            console.error(`[store.settleStoreReferralRewards] Missing token rate for ${symbol}, skipping level ${level}`);
            report.skippedReasons.push(`Level ${level}: missing token rate for ${symbol}.`);
            continue;
          }

          const tokenAmount = payoutFiat / rateToFiat;
          await tx.user.update({
            where: { id: recipientUserId },
            data: { bpiTokenWallet: { increment: tokenAmount } },
          });

          await tx.storeReferralRewardLedger.update({
            where: { orderId_recipientUserId_level: { orderId: order.id, recipientUserId, level } },
            data: { tokenSymbol: symbol, tokenAmount: tokenAmount.toFixed(8) },
          });

          await tx.transaction.create({
            data: {
              userId: recipientUserId,
              transactionType: "STORE_REFERRAL_REWARD_BPT",
              amount: tokenAmount,
              description: `Store referral reward BPT (L${level}) for order ${order.id}`,
              status: "completed",
              reference: `STORE-REF-BPT-${order.id}-L${level}-${Date.now()}`,
              walletType: "bpiToken",
            },
          });
          report.payoutsIssued += 1;
        } else if (levelConfig.payoutType === "UTILITY_TOKEN") {
          const symbol = levelConfig.utilityTokenSymbol;
          if (!symbol) {
            console.error(`[store.settleStoreReferralRewards] UTILITY_TOKEN payout missing utilityTokenSymbol, skipping level ${level}`);
            report.skippedReasons.push(`Level ${level}: UTILITY_TOKEN payout missing utilityTokenSymbol.`);
            continue;
          }

          const rate = await tx.tokenRate.findFirst({
            where: { symbol },
            orderBy: { effectiveAt: "desc" },
          });
          const rateToFiat = Number(rate?.rateToFiat ?? 0);
          if (!Number.isFinite(rateToFiat) || rateToFiat <= 0) {
            console.error(`[store.settleStoreReferralRewards] Missing token rate for ${symbol}, skipping level ${level}`);
            report.skippedReasons.push(`Level ${level}: missing token rate for ${symbol}.`);
            continue;
          }
          const tokenAmount = payoutFiat / rateToFiat;

          const existing = await tx.walletBalance.findFirst({
            where: { userId: recipientUserId, walletType: "UTILITY", symbol },
          });

          if (existing) {
            await tx.walletBalance.update({
              where: { id: existing.id },
              data: { balance: { increment: tokenAmount.toFixed(8) } },
            });
          } else {
            await tx.walletBalance.create({
              data: {
                userId: recipientUserId,
                walletType: "UTILITY",
                symbol,
                balance: tokenAmount.toFixed(8),
              },
            });
          }

          await tx.storeReferralRewardLedger.update({
            where: { orderId_recipientUserId_level: { orderId: order.id, recipientUserId, level } },
            data: { tokenSymbol: symbol, tokenAmount: tokenAmount.toFixed(8) },
          });

          await tx.transaction.create({
            data: {
              userId: recipientUserId,
              transactionType: "STORE_REFERRAL_REWARD_UTILITY_TOKEN",
              amount: tokenAmount,
              description: `Store referral reward ${symbol} (L${level}) for order ${order.id}`,
              status: "completed",
              reference: `STORE-REF-UTIL-${order.id}-L${level}-${Date.now()}`,
              walletType: "utility",
            },
          });
          report.payoutsIssued += 1;
        }
      }

      await tx.order.update({
        where: { id: order.id },
        data: { rewardSettlementState: "ISSUED" },
      });

      report.success = true;
      if (report.payoutsIssued > 0) {
        report.message = `Settlement succeeded — ${report.payoutsIssued} payout(s) issued to ${new Set(sponsorChain.slice(0, report.payoutsIssued)).size} recipient(s).`;
      } else if (report.skippedReasons.length > 0) {
        report.message = `No payouts issued. ${report.skippedReasons.length} level(s) skipped: ${report.skippedReasons.join("; ")}`;
      } else {
        report.message = "Settlement completed but no payouts were issued.";
      }
    });
  } catch (e) {
    console.error("[store.settleStoreReferralRewards] Failed", e);
    report.success = false;
    report.message = "Settlement failed. Check server logs for details.";
    try {
      await prisma.order.update({
        where: { id: orderId },
        data: { rewardSettlementState: "FAILED" },
      });
    } catch (e2) {
      console.error("[store.settleStoreReferralRewards] Failed to mark FAILED", e2);
    }
  }

  return report;
}

async function sendPickupCompletionEmails(order: any) {
  const pickupEmail = order.pickupCenter?.contactEmail;
  if (pickupEmail) {
    await sendEmail({
      to: pickupEmail,
      subject: "Pickup completed",
      html: `<p>The order for ${order.product?.name ?? "item"} (claim code ${order.claimCode ?? ""}) has been marked completed.</p>`,
    });
  }

  if (order.user?.email) {
    await sendEmail({
      to: order.user.email,
      subject: "Thanks for confirming pickup — please rate",
      html: `<p>Hello ${order.user.name ?? ""},</p><p>Thanks for confirming your pickup for <strong>${order.product?.name ?? "your item"}</strong>.</p><p>Please share a quick rating of your pickup experience:</p><p><a href="${process.env.NEXTAUTH_URL ?? ""}/store/orders" target="_blank" rel="noreferrer">Rate pickup</a></p>`,
    });
  }
}

const mapStoreRewardLevel = (level: any) => {
  return {
    id: level.id,
    config_id: level.configId,
    level: level.level,
    reward_basis: level.rewardBasis,
    reward_value_type: level.rewardValueType,
    reward_value: Number(level.rewardValue ?? 0),
    payout_type: level.payoutType,
    max_reward_cap: level.maxRewardCap == null ? null : Number(level.maxRewardCap ?? 0),
    utility_token_symbol: level.utilityTokenSymbol ?? null,
    created_at: level.createdAt,
    updated_at: level.updatedAt,
  };
};

const mapStoreRewardConfig = (config: any) => {
  return {
    id: config.id,
    product_id: config.productId ?? null,
    is_active: Boolean(config.isActive),
    starts_at: config.startsAt ?? null,
    ends_at: config.endsAt ?? null,
    created_at: config.createdAt,
    updated_at: config.updatedAt,
    levels: (config.levels ?? []).slice().sort((a: any, b: any) => a.level - b.level).map(mapStoreRewardLevel),
  };
};

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
    vendor: product.vendor ?? null,
    category: product.category ?? null,
    product_type: product.productType?.toLowerCase?.() ?? product.productType,
    pricing_mode: product.pricingMode?.toLowerCase?.() ?? product.pricingMode ?? "fiat",
    base_price_fiat: Number(product.basePriceFiat ?? 0),
    token_unit_symbol: product.tokenUnitSymbol ?? null,
    token_unit_amount: product.tokenUnitAmount == null ? null : Number(product.tokenUnitAmount ?? 0),
    profit_mode: product.profitMode?.toLowerCase?.() ?? product.profitMode,
    profit_percent: Number(product.profitPercent ?? 0),
    profit_fixed_amount_fiat: Number(product.profitFixedAmountFiat ?? 0),
    min_token_percent: product.minTokenPercent == null ? null : Number(product.minTokenPercent ?? 0),
    accepted_tokens: product.acceptedTokens ?? [],
    token_payment_limits: (product.tokenPaymentLimits as Record<string, number>) ?? {},
    reward_config: mapRewardConfig(product.rewardConfig),
    store_reward_config_id: product.storeRewardConfigs?.[0]?.id ?? null,
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
    .input(z.object({ status: z.string().optional(), type: z.string().optional(), query: z.string().optional(), vendor: z.string().optional(), category: z.string().optional() }).optional())
    .query(async ({ ctx, input }) => {
      const status = input?.status ?? "all";
      const type = input?.type ?? "all";
      const query = input?.query?.toLowerCase?.() ?? "";
      const vendor = input?.vendor?.trim() ?? "";
      const category = input?.category?.trim() ?? "";

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
            vendor ? { vendor: { contains: vendor, mode: "insensitive" } } : {},
            category ? { category: { contains: category, mode: "insensitive" } } : {},
          ],
        },
        include: { rewardConfig: true, storeRewardConfigs: { include: { levels: true } } },
        orderBy: [{ createdAt: "desc" }],
      });

      return products.map(mapProduct);
    }),

  getProduct: protectedProcedure.input(z.object({ id: z.string() })).query(async ({ ctx, input }) => {
    const product = await (ctx.prisma as any).product.findUnique({
      where: { id: input.id },
      include: { rewardConfig: true, storeRewardConfigs: { include: { levels: true } } },
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

  listStoreRewardConfigs: protectedProcedure.query(async ({ ctx }) => {
    const configs = await (ctx.prisma as any).storeRewardConfig.findMany({
      include: { levels: true },
      orderBy: [{ updatedAt: "desc" }],
    });
    return configs.map(mapStoreRewardConfig);
  }),

  adminUpsertStoreRewardConfig: adminProcedure
    .input(
      z.object({
        id: z.string().optional(),
        productId: z.string().nullable().optional(),
        isActive: z.boolean().default(false),
        startsAt: z.coerce.date().nullable().optional(),
        endsAt: z.coerce.date().nullable().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const startsAt = input.startsAt ?? null;
      const endsAt = input.endsAt ?? null;
      if (startsAt && endsAt && startsAt > endsAt) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "startsAt must be before endsAt" });
      }

      const config = await (ctx.prisma as any).$transaction(async (tx: any) => {
        const existing = input.id
          ? await tx.storeRewardConfig.findUnique({ where: { id: input.id }, select: { productId: true } })
          : null;

        const scopeProductId = input.productId !== undefined
          ? input.productId
          : existing?.productId ?? null;

        const data: any = {
          startsAt,
          endsAt,
          isActive: Boolean(input.isActive),
        };

        // Only change product scope when explicitly provided.
        if (input.productId !== undefined) {
          data.productId = input.productId;
        }

        const createdOrUpdated = input.id
          ? await tx.storeRewardConfig.update({ where: { id: input.id }, data, include: { levels: true } })
          : await tx.storeRewardConfig.create({ data, include: { levels: true } });

        return createdOrUpdated;
      });

      return mapStoreRewardConfig(config);
    }),

  adminDeleteStoreRewardConfig: adminProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await (ctx.prisma as any).storeRewardConfig.delete({ where: { id: input.id } });
      return { ok: true };
    }),

  adminLinkProductReferralConfig: adminProcedure
    .input(
      z.object({
        productId: z.string(),
        configId: z.string().nullable(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Unlink all currently linked configs for this product
      await (ctx.prisma as any).storeRewardConfig.updateMany({
        where: { productId: input.productId },
        data: { productId: null },
      });
      // Link the chosen config if provided
      if (input.configId) {
        await (ctx.prisma as any).storeRewardConfig.update({
          where: { id: input.configId },
          data: { productId: input.productId },
        });
      }
      return { ok: true };
    }),

  adminUpsertStoreRewardLevel: adminProcedure
    .input(
      z.object({
        id: z.string().optional(),
        configId: z.string(),
        level: z.number().int().min(1).max(4),
        rewardBasis: z.enum(["GROSS", "PROFIT"]),
        rewardValueType: z.enum(["FIXED", "PERCENTAGE"]),
        rewardValue: z.number().min(0),
        payoutType: z.enum(["CASH", "CASHBACK", "BPT", "UTILITY_TOKEN"]),
        maxRewardCap: z.number().min(0).nullable().optional(),
        utilityTokenSymbol: z.string().min(1).nullable().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (input.payoutType === "UTILITY_TOKEN" && !input.utilityTokenSymbol) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "utilityTokenSymbol is required for UTILITY_TOKEN payouts" });
      }

      const data: any = {
        configId: input.configId,
        level: input.level,
        rewardBasis: input.rewardBasis,
        rewardValueType: input.rewardValueType,
        rewardValue: input.rewardValue,
        payoutType: input.payoutType,
        maxRewardCap: input.maxRewardCap ?? undefined,
        utilityTokenSymbol: input.utilityTokenSymbol ?? undefined,
      };

      const saved = await (ctx.prisma as any).storeRewardLevel.upsert({
        where: input.id
          ? { id: input.id }
          : { configId_level: { configId: input.configId, level: input.level } },
        create: data,
        update: data,
      });

      return mapStoreRewardLevel(saved);
    }),

  adminDeleteStoreRewardLevel: adminProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await (ctx.prisma as any).storeRewardLevel.delete({ where: { id: input.id } });
      return { ok: true };
    }),

  adminUpsertProduct: adminProcedure
    .input(
      z
        .object({
          id: z.string().optional(),
          name: z.string().min(1),
          description: z.string().min(1),
          vendor: z.string().optional().nullable(),
          category: z.string().optional().nullable(),
          productType: z.enum(["PHYSICAL", "DIGITAL", "LICENSE", "SERVICE", "UTILITY"]),
          pricingMode: z.enum(["FIAT", "TOKEN_UNIT"]).default("FIAT"),
          basePriceFiat: z.number().min(0),
          tokenUnitSymbol: z.string().trim().min(1).nullable().optional(),
          tokenUnitAmount: z.number().positive().nullable().optional(),
          profitMode: z.enum(["PERCENT", "FIXED", "HYBRID"]).optional(),
          // Accept 0-1 (preferred) or 0-100; normalized server-side.
          profitPercent: z.number().min(0).optional(),
          // Per-unit fixed profit component in fiat.
          profitFixedAmountFiat: z.number().min(0).optional(),
          // Optional min token percent (0-1 or 0-100; normalized). Applies to HYBRID.
          minTokenPercent: z.number().min(0).nullable().optional(),
          acceptedTokens: z.array(z.string().min(1)).optional().default([]),
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
        .superRefine((val, ctx) => {
          if (val.pricingMode === "TOKEN_UNIT") {
            if (!val.tokenUnitSymbol) {
              ctx.addIssue({ code: z.ZodIssueCode.custom, message: "tokenUnitSymbol is required for TOKEN_UNIT pricing", path: ["tokenUnitSymbol"] });
            }
            if (val.tokenUnitAmount == null || !Number.isFinite(val.tokenUnitAmount) || val.tokenUnitAmount <= 0) {
              ctx.addIssue({ code: z.ZodIssueCode.custom, message: "tokenUnitAmount must be > 0 for TOKEN_UNIT pricing", path: ["tokenUnitAmount"] });
            }
          }
        })
    )
    .mutation(async ({ ctx, input }) => {
      const normalizedTokenPaymentLimits = Object.fromEntries(
        Object.entries(input.tokenPaymentLimits ?? {}).map(([symbol, limit]) => [
          symbol,
          clampNumber(Number(limit ?? 0), 0, 1),
        ])
      );
      const tokensWithLimit = Object.entries(normalizedTokenPaymentLimits)
        .filter(([, limit]) => Number(limit) > 0)
        .map(([symbol]) => symbol);

      const data: any = {
        name: input.name,
        description: input.description,
        vendor: input.vendor ?? null,
        category: input.category ?? null,
        productType: input.productType,
        pricingMode: input.pricingMode,
        basePriceFiat: input.basePriceFiat,
        tokenUnitSymbol: input.pricingMode === "TOKEN_UNIT" ? (input.tokenUnitSymbol ?? undefined) : null,
        tokenUnitAmount: input.pricingMode === "TOKEN_UNIT" ? (input.tokenUnitAmount ?? undefined) : null,
        acceptedTokens: tokensWithLimit.length > 0
          ? (input.acceptedTokens.length > 0 ? input.acceptedTokens.filter((symbol) => tokensWithLimit.includes(symbol)) : tokensWithLimit)
          : [],
        tokenPaymentLimits: tokensWithLimit.length > 0 ? normalizedTokenPaymentLimits : {},
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

      if (input.profitMode) data.profitMode = input.profitMode;
      if (input.profitPercent !== undefined) data.profitPercent = normalizePercent(input.profitPercent, 1);
      if (input.profitFixedAmountFiat !== undefined) data.profitFixedAmountFiat = input.profitFixedAmountFiat;
      if (tokensWithLimit.length === 0) {
        data.minTokenPercent = null;
      } else if (input.minTokenPercent !== undefined) {
        data.minTokenPercent = input.minTokenPercent === null ? null : normalizePercent(input.minTokenPercent, 0);
      }

      const product = input.id
        ? await (ctx.prisma as any).product.update({ where: { id: input.id }, data, include: { rewardConfig: true, storeRewardConfigs: { include: { levels: true } } } })
        : await (ctx.prisma as any).product.create({ data, include: { rewardConfig: true, storeRewardConfigs: { include: { levels: true } } } });

      return mapProduct(product);
    }),

  adminDeleteProduct: adminProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const deletableStatuses = ["PENDING", "FAILED", "REFUNDED"];

      const nonDeletableCount = await (ctx.prisma as any).order.count({
        where: { productId: input.id, status: { notIn: deletableStatuses } },
      });

      if (nonDeletableCount > 0) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Cannot permanently delete a product with active orders (PAID, PROCESSING, DELIVERED, or COMPLETED). Retire it instead.",
        });
      }

      // Delete any deletable orders (PENDING/FAILED/REFUNDED) along with related records, then the product
      await (ctx.prisma as any).$transaction(async (tx: any) => {
        const deletableOrders = await tx.order.findMany({
          where: { productId: input.id, status: { in: deletableStatuses } },
          select: { id: true },
        });
        const orderIds = deletableOrders.map((o: any) => o.id);

        if (orderIds.length > 0) {
          // PickupExperienceRating has no onDelete: Cascade on Order, so delete explicitly
          await tx.pickupExperienceRating.deleteMany({ where: { orderId: { in: orderIds } } });
          // StoreReferralRewardLedger has onDelete: Cascade but explicit delete is safer in transaction
          await tx.storeReferralRewardLedger.deleteMany({ where: { orderId: { in: orderIds } } });
          await tx.order.deleteMany({ where: { id: { in: orderIds } } });
        }

        await tx.product.delete({ where: { id: input.id } });
      });

      return { ok: true, deletedOrders: true };
    }),

  adminRetireProduct: adminProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const product = await (ctx.prisma as any).product.update({
        where: { id: input.id },
        data: { status: "RETIRED" },
        include: { rewardConfig: true, storeRewardConfigs: { include: { levels: true } } },
      });
      return mapProduct(product);
    }),

  adminUpsertRewardConfig: adminProcedure
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

  adminUpsertTokenRate: adminProcedure
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

  adminUpsertPickupCenter: adminProcedure
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

  adminUpsertRewardCenter: adminProcedure
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

  getPickupAccess: protectedProcedure.query(async ({ ctx }) => {
    const access = await resolvePickupAccess(ctx.prisma as any, ctx.user);
    return {
      isAdmin: access.isAdmin,
      isOperator: access.isOperator,
      centers: access.centers,
    };
  }),

  listPickupQueue: protectedProcedure.query(async ({ ctx }) => {
    const access = await resolvePickupAccess(ctx.prisma as any, ctx.user);
    if (!access.isAdmin && !access.isOperator) {
      throw new TRPCError({ code: "FORBIDDEN", message: "You are not authorized for this pickup center" });
    }

    const where = access.isAdmin
      ? { claimStatus: { in: ["CODE_ISSUED", "VERIFIED"] } }
      : {
          claimStatus: { in: ["CODE_ISSUED", "VERIFIED"] },
          pickupCenterId: { in: access.centerIds ?? [] },
        };

    const orders = await (ctx.prisma as any).order.findMany({
      where,
      include: { product: true, user: true, pickupCenter: true },
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    return orders.map((order: any) => ({
      ...mapOrder(order),
      customer: order.user
        ? {
            id: order.user.id,
            name: order.user.name ?? null,
            email: order.user.email ?? null,
          }
        : null,
    }));
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

  adminUpdateOrderStatus: adminProcedure
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
          // Advance claimStatus so the settlement guard is satisfied for non-physical orders.
          ...(input.status === "COMPLETED" ? { claimStatus: "COMPLETED" } : {}),
        },
        include: { product: { include: { rewardConfig: true } }, pickupCenter: true, pickupExperienceRating: true },
      });

      // Settle store referral rewards when any order is marked COMPLETED (covers external-token / manual orders).
      if (input.status === "COMPLETED" && order.rewardSettlementState === "PENDING") {
        await settleStoreReferralRewards(ctx.prisma, order.id);
      }

      return mapOrder(order);
    }),

  adminRetryRewardSettlement: adminProcedure
    .input(z.object({ orderId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const order = await (ctx.prisma as any).order.findUnique({
        where: { id: input.orderId },
        select: { id: true, status: true, claimStatus: true, rewardSettlementState: true },
      });

      if (!order) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Order not found" });
      }

      if (order.rewardSettlementState === "ISSUED") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Rewards already issued for this order" });
      }

      // Auto-advance order to COMPLETED + claimStatus COMPLETED so settlement can proceed
      await (ctx.prisma as any).order.update({
        where: { id: input.orderId },
        data: {
          rewardSettlementState: "PENDING",
          status: "COMPLETED",
          claimStatus: "COMPLETED",
        },
      });

      const settlementReport = await settleStoreReferralRewards(ctx.prisma, input.orderId);

      const refreshed = await (ctx.prisma as any).order.findUnique({
        where: { id: input.orderId },
        include: { product: { include: { rewardConfig: true } }, pickupCenter: true, pickupExperienceRating: true },
      });

      return { ...mapOrder(refreshed), settlementReport };
    }),

  adminBulkDeleteOrders: adminProcedure
    .input(z.object({ orderIds: z.array(z.string()).min(1) }))
    .mutation(async ({ ctx, input }) => {
      const deletableStatuses = ["PENDING", "FAILED", "REFUNDED"];

      const orders = await (ctx.prisma as any).order.findMany({
        where: { id: { in: input.orderIds } },
        select: { id: true, status: true },
      });

      const nonDeletable = orders.filter((o: any) => !deletableStatuses.includes(o.status));
      if (nonDeletable.length > 0) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Cannot delete orders with status: ${nonDeletable.map((o: any) => o.status).join(", ")}. Only PENDING, FAILED, and REFUNDED orders can be deleted.`,
        });
      }

      const validIds = orders.map((o: any) => o.id);

      await (ctx.prisma as any).$transaction(async (tx: any) => {
        await tx.pickupExperienceRating.deleteMany({ where: { orderId: { in: validIds } } });
        await tx.storeReferralRewardLedger.deleteMany({ where: { orderId: { in: validIds } } });
        await tx.order.deleteMany({ where: { id: { in: validIds } } });
      });

      return { deleted: validIds.length, skipped: input.orderIds.length - validIds.length };
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

      const tokenLimitMap = (product.tokenPaymentLimits as Record<string, number>) || {};
      const tokenEnabledSymbols = Object.entries(tokenLimitMap)
        .filter(([, limit]) => Number(limit) > 0)
        .map(([symbol]) => symbol);

      const defaultSymbol = tokenEnabledSymbols.includes("BPT")
        ? "BPT"
        : tokenEnabledSymbols[0] ?? null;
      const symbol = tokenEnabledSymbols.length > 0
        ? (input.tokenSymbol ?? defaultSymbol)
        : null;

      if (symbol && (tokenLimitMap[symbol] ?? 0) <= 0) {
        throw new TRPCError({ code: "BAD_REQUEST", message: `Token ${symbol} is not enabled for this product` });
      }

      if (symbol && symbol !== "BPT") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Only BPT token payments are supported at this time.",
        });
      }

      const tokenLimit = symbol ? (tokenLimitMap[symbol] ?? 0) : 0;

      const tokenRate = tokenLimit > 0 && symbol
        ? await (ctx.prisma as any).tokenRate.findFirst({ where: { symbol }, orderBy: { effectiveAt: "desc" } })
        : null;
      if (tokenLimit > 0 && !tokenRate) {
        throw new TRPCError({ code: "BAD_REQUEST", message: `No rate available for ${symbol}` });
      }

      const basePriceFiat = Number(product.basePriceFiat ?? 0);
      const quantity = input.quantity;
      const totalFiat = basePriceFiat * quantity;

      const profitMode = (product.profitMode ?? "PERCENT") as "PERCENT" | "FIXED" | "HYBRID";
      const profitPercent = normalizePercent(Number(product.profitPercent ?? 1), 1);
      const profitFixedPerUnitFiat = Number(product.profitFixedAmountFiat ?? 0);
      const minTokenPercent = product.minTokenPercent == null ? null : normalizePercent(Number(product.minTokenPercent ?? 0), 0);

      let profitFiat = 0;
      if (profitMode === "PERCENT") {
        profitFiat = totalFiat * profitPercent;
      } else if (profitMode === "FIXED") {
        profitFiat = profitFixedPerUnitFiat * quantity;
      } else {
        profitFiat = totalFiat * profitPercent + profitFixedPerUnitFiat * quantity;
      }
      profitFiat = clampNumber(profitFiat, 0, totalFiat);
      const tokenPortionFiat = Math.min(totalFiat * tokenLimit, totalFiat);
      const tokenAmount = tokenPortionFiat > 0 ? tokenPortionFiat / Number(tokenRate?.rateToFiat ?? 1) : 0;
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
            profit_mode: profitMode,
            profit_percent: profitPercent,
            profit_fixed_per_unit_fiat: profitFixedPerUnitFiat,
            profit_fiat: profitFiat,
            min_token_percent: minTokenPercent,
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
          tokenRateSnapshot: tokenRate && symbol
            ? {
                symbol,
                rate_to_fiat: Number(tokenRate.rateToFiat ?? 0),
                effective_at: tokenRate.effectiveAt,
              }
            : null,
          pickupCenterId: product.pickupCenterId ?? null,
          rewardCenterId: product.rewardCenterId ?? null,
        },
        include: { product: true },
      });

      return {
        intentId: order.id,
        redirectUrl: `/checkout?intent=${order.id}&productId=${product.id}&quantity=${quantity}`,
        orderId: order.id,
        productId: product.id,
        quantity,
        pricingSnapshot: order.pricingSnapshot,
        paymentBreakdown: order.paymentBreakdown,
        rewardConfigSnapshot: order.rewardConfigSnapshot,
        tokenRateSnapshot: order.tokenRateSnapshot,
      };
    }),

  createExternalTokenCheckoutIntent: protectedProcedure
    .input(
      z.object({
        productId: z.string(),
        quantity: z.number().int().min(1).max(10).default(1),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (process.env.STORE_CHECKOUT_PAUSED === "true") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Checkout is temporarily paused" });
      }

      const product = await (ctx.prisma as any).product.findUnique({
        where: { id: input.productId },
        include: { rewardConfig: true },
      });
      if (!product) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Product not found" });
      }

      if (product.status !== "ACTIVE") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Product is not available for checkout" });
      }

      const cryptoGateway = await (ctx.prisma as any).paymentGatewayConfig.findFirst({
        where: { gatewayName: "crypto", isActive: true },
      });

      const depositAddress = cryptoGateway?.cryptoPublicKey;
      if (!depositAddress) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Crypto payments are not configured yet. Please contact admin.",
        });
      }

      const pricingMode = String(product.pricingMode ?? "FIAT").toUpperCase() as "FIAT" | "TOKEN_UNIT";
      const externalTokenSymbol = (
        (pricingMode === "TOKEN_UNIT" ? product.tokenUnitSymbol : null) ||
        cryptoGateway?.tokenSymbol ||
        "USDT"
      ).toUpperCase();
      const tokenRate = await (ctx.prisma as any).tokenRate.findFirst({
        where: { symbol: externalTokenSymbol },
        orderBy: { effectiveAt: "desc" },
      });

      if (!tokenRate) {
        throw new TRPCError({ code: "BAD_REQUEST", message: `No rate available for ${externalTokenSymbol}` });
      }

      const basePriceFiat = Number(product.basePriceFiat ?? 0);
      const quantity = input.quantity;
      const tokenUnitAmountPerUnit = pricingMode === "TOKEN_UNIT" ? Number(product.tokenUnitAmount ?? 0) : null;

      const profitMode = (product.profitMode ?? "PERCENT") as "PERCENT" | "FIXED" | "HYBRID";
      const profitPercent = normalizePercent(Number(product.profitPercent ?? 1), 1);
      const profitFixedPerUnitFiat = Number(product.profitFixedAmountFiat ?? 0);
      const minTokenPercent = product.minTokenPercent == null ? null : normalizePercent(Number(product.minTokenPercent ?? 0), 0);

      const rateToFiat = Number(tokenRate.rateToFiat ?? 0);
      if (!Number.isFinite(rateToFiat) || rateToFiat <= 0) {
        throw new TRPCError({ code: "BAD_REQUEST", message: `Invalid rate for ${externalTokenSymbol}` });
      }

      let expectedTokenAmount = 0;
      let totalFiat = 0;
      if (pricingMode === "TOKEN_UNIT") {
        if (!tokenUnitAmountPerUnit || !Number.isFinite(tokenUnitAmountPerUnit) || tokenUnitAmountPerUnit <= 0) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Token-unit pricing is not configured for this product" });
        }
        expectedTokenAmount = tokenUnitAmountPerUnit * quantity;
        totalFiat = expectedTokenAmount * rateToFiat;
      } else {
        totalFiat = basePriceFiat * quantity;
        expectedTokenAmount = totalFiat > 0 ? totalFiat / rateToFiat : 0;
      }

      let profitFiat = 0;
      if (profitMode === "PERCENT") {
        profitFiat = totalFiat * profitPercent;
      } else if (profitMode === "FIXED") {
        profitFiat = profitFixedPerUnitFiat * quantity;
      } else {
        profitFiat = totalFiat * profitPercent + profitFixedPerUnitFiat * quantity;
      }
      profitFiat = clampNumber(profitFiat, 0, totalFiat);

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
            pricing_mode: pricingMode,
            token_unit_symbol: pricingMode === "TOKEN_UNIT" ? externalTokenSymbol : null,
            token_unit_amount_per_unit: pricingMode === "TOKEN_UNIT" ? tokenUnitAmountPerUnit : null,
            profit_mode: profitMode,
            profit_percent: profitPercent,
            profit_fixed_per_unit_fiat: profitFixedPerUnitFiat,
            profit_fiat: profitFiat,
            min_token_percent: minTokenPercent,
            token_symbol: externalTokenSymbol,
            token_rate_to_fiat: rateToFiat,
            token_amount_expected: expectedTokenAmount,
            total_fiat: totalFiat,
            payment_mode: "EXTERNAL_TOKEN",
          },
          paymentBreakdown: {
            token: null,
            fiat: 0,
            payment_mode: "EXTERNAL_TOKEN",
            external_token: {
              symbol: externalTokenSymbol,
              expected_amount: expectedTokenAmount,
              expected_fiat: totalFiat,
              deposit_address: depositAddress,
              pricing_mode: pricingMode,
              token_unit_amount_per_unit: pricingMode === "TOKEN_UNIT" ? tokenUnitAmountPerUnit : null,
            },
          },
          rewardConfigSnapshot: rewardSnapshot,
          tokenRateSnapshot: {
            symbol: externalTokenSymbol,
            rate_to_fiat: rateToFiat,
            effective_at: tokenRate.effectiveAt,
          },
          pickupCenterId: product.pickupCenterId ?? null,
          rewardCenterId: product.rewardCenterId ?? null,
        },
        include: { product: true },
      });

      const now = new Date();
      const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000);
      const gatewayReference = `STORE-EXT-${order.id}`;

      const pendingPayment = await (ctx.prisma as any).pendingPayment.create({
        data: {
          id: randomUUID(),
          userId: ctx.user.id,
          transactionType: "STORE_PURCHASE",
          amount: totalFiat,
          currency: "NGN",
          paymentMethod: "crypto",
          gatewayReference,
          status: "pending",
          metadata: {
            fulfillmentType: PAYMENT_FULFILLMENT_TYPES.STORE_PURCHASE,
            purpose: PAYMENT_FULFILLMENT_TYPES.STORE_PURCHASE,
            orderId: order.id,
            productId: order.productId,
            quantity: order.quantity,
            depositAddress,
            tokenSymbol: externalTokenSymbol,
            tokenRateToFiat: rateToFiat,
            expectedTokenAmount,
            totalFiat,
            profitFiat,
            pricingMode,
            tokenUnitAmountPerUnit: pricingMode === "TOKEN_UNIT" ? tokenUnitAmountPerUnit : null,
            pricingSnapshot: order.pricingSnapshot ?? null,
          },
          expiresAt,
          updatedAt: now,
        },
      });

      return {
        intentId: order.id,
        orderId: order.id,
        pendingPaymentId: pendingPayment.id,
        gatewayReference,
        depositAddress,
        tokenSymbol: externalTokenSymbol,
        expectedTokenAmount,
        expectedFiat: totalFiat,
        expiresAt,
        redirectUrl: `/checkout/external-token?orderId=${order.id}`,
      };
    }),

  getExternalTokenCheckoutIntent: protectedProcedure
    .input(z.object({ orderId: z.string() }))
    .query(async ({ ctx, input }) => {
      const order = await (ctx.prisma as any).order.findUnique({
        where: { id: input.orderId },
        include: { product: true },
      });

      if (!order) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Order not found" });
      }

      if (order.userId !== ctx.user.id) {
        throw new TRPCError({ code: "FORBIDDEN", message: "You cannot access this order" });
      }

      const gatewayReference = `STORE-EXT-${order.id}`;
      const pendingPayment = await (ctx.prisma as any).pendingPayment.findFirst({
        where: {
          userId: ctx.user.id,
          gatewayReference,
          paymentMethod: "crypto",
        },
        orderBy: { createdAt: "desc" },
      });

      if (!pendingPayment) {
        throw new TRPCError({ code: "NOT_FOUND", message: "External payment intent not found" });
      }

      const meta = (pendingPayment.metadata ?? {}) as any;
      const externalToken = ((order.paymentBreakdown as any)?.external_token ?? {}) as any;

      return {
        orderId: order.id,
        status: order.status,
        claimStatus: order.claimStatus,
        pendingPaymentId: pendingPayment.id,
        pendingPaymentStatus: pendingPayment.status,
        gatewayReference: pendingPayment.gatewayReference,
        expiresAt: pendingPayment.expiresAt,
        depositAddress: meta.depositAddress ?? externalToken.deposit_address ?? null,
        tokenSymbol: meta.tokenSymbol ?? externalToken.symbol ?? null,
        expectedTokenAmount: meta.expectedTokenAmount ?? externalToken.expected_amount ?? null,
        expectedFiat: meta.totalFiat ?? externalToken.expected_fiat ?? null,
        txHash: pendingPayment.proofOfPayment ?? meta.txHash ?? null,
      };
    }),

  submitExternalTokenPaymentTxHash: protectedProcedure
    .input(
      z.object({
        pendingPaymentId: z.string(),
        txHash: z.string().trim().min(6),
        note: z.string().max(500).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const payment = await (ctx.prisma as any).pendingPayment.findUnique({
        where: { id: input.pendingPaymentId },
      });

      if (!payment) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Pending payment not found" });
      }

      const transactionType = String(payment.transactionType ?? "").toUpperCase();
      if (transactionType !== "STORE_PURCHASE") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Unsupported payment type" });
      }

      const paymentMethod = String(payment.paymentMethod ?? "").toLowerCase();
      if (paymentMethod !== "crypto") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Unsupported payment method" });
      }

      if (payment.userId !== ctx.user.id) {
        throw new TRPCError({ code: "FORBIDDEN", message: "You cannot update this payment" });
      }

      const status = String(payment.status ?? "").toLowerCase();
      if (status !== "pending") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Payment has already been reviewed" });
      }

      if (payment.expiresAt && new Date(payment.expiresAt).getTime() < Date.now()) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Payment request has expired" });
      }

      const existingMetadata = (payment.metadata ?? {}) as Record<string, unknown>;
      const now = new Date();

      const updated = await (ctx.prisma as any).pendingPayment.update({
        where: { id: payment.id },
        data: {
          proofOfPayment: input.txHash,
          metadata: {
            ...existingMetadata,
            txHash: input.txHash,
            note: input.note ?? null,
            submittedAt: now.toISOString(),
          },
          updatedAt: now,
        },
      });

      return {
        success: true,
        pendingPaymentId: updated.id,
        status: updated.status,
        message: "Transaction hash submitted. Awaiting admin verification.",
      };
    }),

  confirmCheckoutIntent: protectedProcedure
    .input(
      z.object({
        intentId: z.string(),
        paymentMode: z.enum(["FIAT", "HYBRID", "TOKEN"]).default("FIAT"),
        // CTO policy: Store fiat spending uses Cashback Wallet; Main Wallet is funding-only.
        paymentSource: z.enum(["cashback"]).default("cashback"),
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

      if (existing.product?.status !== "ACTIVE") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "This product is no longer available for checkout." });
      }

      const existingPaymentMode =
        (existing.pricingSnapshot as any)?.payment_mode ??
        (existing.paymentBreakdown as any)?.payment_mode ??
        null;
      if (existingPaymentMode === "EXTERNAL_TOKEN") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "This order uses external token payment. Submit your transaction hash and await admin verification.",
        });
      }

      const paymentBreakdown = {
        ...(existing.paymentBreakdown as Record<string, unknown>),
        payment_mode: input.paymentMode,
        payment_source: input.paymentSource,
        confirmed_at: new Date().toISOString(),
      } as any;

      const fiatPortion = Number(
        paymentBreakdown?.fiat?.amount ??
        paymentBreakdown?.fiat ??
        paymentBreakdown?.fiat_portion ??
        paymentBreakdown?.total_fiat ?? 0
      );

      const tokenPortion = Number(paymentBreakdown?.token?.amount ?? 0);
      const tokenSymbol = paymentBreakdown?.token?.symbol ?? null;

      if (tokenPortion > 0 && tokenSymbol && tokenSymbol !== "BPT") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Only BPT token payments are supported at this time.",
        });
      }

      const tokenPortionFiat = Number(
        paymentBreakdown?.token?.fiat_value ??
        (existing.pricingSnapshot as any)?.token_portion_fiat ??
        0
      );
      const configuredTokenLimit = Number((existing.pricingSnapshot as any)?.token_limit ?? 0);
      const isCashOnlyProduct = configuredTokenLimit <= 0;

      if (isCashOnlyProduct && input.paymentMode !== "FIAT") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "This product is configured for cashback-only checkout.",
        });
      }

      if (isCashOnlyProduct && tokenPortionFiat > 0) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Token contribution is not allowed for cashback-only products.",
        });
      }

      const grossFiat = Number(
        (existing.pricingSnapshot as any)?.total_fiat ??
        (existing.pricingSnapshot as any)?.totalFiat ??
        (existing.pricingSnapshot as any)?.base_price_fiat ??
        0
      );

      const snapMinTokenPercent = (existing.pricingSnapshot as any)?.min_token_percent;
      const productMinTokenPercent = existing.product?.minTokenPercent;
      const minTokenPercentOverride = productMinTokenPercent == null
        ? (snapMinTokenPercent == null ? null : normalizePercent(Number(snapMinTokenPercent), 0))
        : normalizePercent(Number(productMinTokenPercent), 0);

      const minBptPercentSetting = await getAdminSettingNumber(ctx.prisma, "STORE_MIN_BPT_PERCENT", 0.2);
      const minBptPercent = normalizePercent(minBptPercentSetting, 0.2);
      const effectiveMinTokenPercent = minTokenPercentOverride ?? minBptPercent;

      if (input.paymentMode === "TOKEN" && fiatPortion > 0) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Token-only checkout cannot include a fiat portion.",
        });
      }

      if (input.paymentMode === "HYBRID") {
        const gross = grossFiat > 0 ? grossFiat : Math.max(0, fiatPortion + tokenPortionFiat);
        const requiredTokenFiat = gross * effectiveMinTokenPercent;

        if (requiredTokenFiat > 0 && tokenPortionFiat + 1e-9 < requiredTokenFiat) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: `Mixed checkout requires at least ${(effectiveMinTokenPercent * 100).toFixed(0)}% in BPT. Increase your token portion or choose 100% Cashback / 100% BPT.`,
          });
        }
      }

      const user = await (ctx.prisma as any).user.findUnique({
        where: { id: ctx.user.id },
        select: { wallet: true, cashback: true, bpiTokenWallet: true },
      });

      if (!user) {
        throw new TRPCError({ code: "NOT_FOUND", message: "User not found" });
      }

      const sourceField = "cashback";
      const sourceBalance = (user as any)[sourceField] ?? 0;

      if (fiatPortion > 0 && sourceBalance < fiatPortion) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Insufficient balance for purchase" });
      }

      if (tokenPortion > 0 && typeof user.bpiTokenWallet !== "number") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Token wallet not available" });
      }

      // Non-physical products (DIGITAL, LICENSE, SERVICE, UTILITY) complete immediately on payment;
      // physical products follow the CODE_ISSUED → VERIFIED → COMPLETED pickup flow.
      const productType = (existing.product?.productType ?? "PHYSICAL").toUpperCase();
      const isPhysical = productType === "PHYSICAL";

      const claimCode = isPhysical ? await generateClaimCode(ctx.prisma as any) : null;

      const updated = await (ctx.prisma as any).$transaction(async (tx: any) => {
        // Deduct fiat portion from selected source
        if (fiatPortion > 0) {
          await tx.user.update({
            where: { id: ctx.user.id },
            data: { [sourceField]: { decrement: fiatPortion } },
          });

          await tx.transaction.create({
            data: {
              id: randomUUID(),
              userId: ctx.user.id,
              transactionType: "STORE_PURCHASE",
              amount: -fiatPortion,
              description: `Store purchase: ${existing.product?.name || "Product"} (source: ${sourceField}, order: ${existing.id})`,
              status: "completed",
              reference: `STORE-${existing.id}-${Date.now()}`,
              walletType: sourceField,
            },
          });
        }

        // Deduct token portion from BPT wallet
        if (tokenPortion > 0) {
          await tx.user.update({
            where: { id: ctx.user.id },
            data: { bpiTokenWallet: { decrement: tokenPortion } },
          });

          await tx.transaction.create({
            data: {
              id: randomUUID(),
              userId: ctx.user.id,
              transactionType: "STORE_PURCHASE_TOKEN",
              amount: -tokenPortion,
              description: `Store purchase token payment${tokenSymbol ? ` (${tokenSymbol})` : ""} (order: ${existing.id})`,
              status: "completed",
              reference: `STORE-TOKEN-${existing.id}-${Date.now()}`,
              walletType: "bpiToken",
            },
          });
        }

        // Update order status — non-physical products auto-complete on payment; physical products get a claim code.
        const order = await tx.order.update({
          where: { id: existing.id },
          data: {
            status: isPhysical ? "PROCESSING" : "COMPLETED",
            claimStatus: isPhysical ? "CODE_ISSUED" : "COMPLETED",
            claimCode: isPhysical ? claimCode : null,
            paymentBreakdown,
          },
          include: { product: { include: { rewardConfig: true, pickupCenter: true } }, user: true, pickupCenter: true },
        });

        return order;
      });

      // Settle referral rewards immediately for non-physical products since they are already COMPLETED.
      if (!isPhysical && updated.rewardSettlementState === "PENDING") {
        await settleStoreReferralRewards(ctx.prisma, updated.id);
      }

      if (ctx.user?.email) {
        if (isPhysical) {
          await sendEmail({
            to: ctx.user.email,
            subject: "Your BPI pickup claim code",
            html: `<p>Hello ${ctx.user.name ?? ""},</p><p>Your order for <strong>${updated.product?.name ?? "your item"}</strong> is confirmed.</p><p><strong>Claim Code:</strong> ${claimCode}</p><p>Please present this code and a valid ID at the pickup center to receive your item.</p>`,
          });
        } else {
          await sendEmail({
            to: ctx.user.email,
            subject: "Order confirmed — thank you!",
            html: `<p>Hello ${ctx.user.name ?? ""},</p><p>Your order for <strong>${updated.product?.name ?? "your item"}</strong> is confirmed and completed.</p><p>Thank you for your purchase!</p>`,
          });
        }
      }

      const pickupEmail = updated.pickupCenter?.contactEmail;
      if (isPhysical && pickupEmail) {
        await sendEmail({
          to: pickupEmail,
          subject: "New pickup order assigned",
          html: `<p>A new order has been assigned to your pickup center.</p><p>Product: ${updated.product?.name ?? "Item"}</p><p>Claim Code: ${claimCode}</p>`,
        });
      }

      // Record profit from store purchase (not gross).
      const profitFiat = Number(
        (updated.pricingSnapshot as any)?.profit_fiat ??
        (existing.pricingSnapshot as any)?.profit_fiat ??
        0
      );
      const amountForPools = profitFiat > 0
        ? profitFiat
        : Number((updated.pricingSnapshot as any)?.total_fiat ?? fiatPortion ?? paymentBreakdown?.total_fiat ?? 0);

      if (amountForPools > 0) {
        await recordRevenue(ctx.prisma, {
          source: "STORE_PURCHASE",
          amount: amountForPools,
          currency: "NGN",
          sourceId: updated.id,
          description: `Store purchase profit: ${updated.product?.name || 'Product'}`,
          userId: updated.userId,
          orderId: updated.id,
          productId: updated.productId,
          programType: "STORE",
          country: updated.user?.country ?? undefined,
          state: updated.user?.state ?? undefined,
          region: updated.user?.region ?? undefined,
          tokenSymbol:
            (updated.pricingSnapshot as any)?.token_symbol ??
            (existing.pricingSnapshot as any)?.token_symbol ??
            (updated.paymentBreakdown as any)?.token?.symbol ??
            undefined,
          metadata: {
            quantity: updated.quantity,
            profitFiat,
            pricingSnapshot: updated.pricingSnapshot ?? null,
            paymentBreakdown: updated.paymentBreakdown ?? null,
          },
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

      const access = await resolvePickupAccess(ctx.prisma as any, ctx.user);
      if (!canActOnCenter(access, order.pickupCenterId ?? null)) {
        throw new TRPCError({ code: "FORBIDDEN", message: "You are not authorized for this pickup center" });
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

      if (updated.rewardSettlementState === "PENDING") {
        await settleStoreReferralRewards(ctx.prisma, updated.id);
      }

      const refreshed = await (ctx.prisma as any).order.findUnique({
        where: { id: updated.id },
        include: { product: true, pickupCenter: true, user: true },
      });

      await sendPickupCompletionEmails(refreshed ?? updated);

      return mapOrder(refreshed ?? updated);
    }),

  staffCompletePickup: protectedProcedure
    .input(z.object({ orderId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const order = await (ctx.prisma as any).order.findUnique({
        where: { id: input.orderId },
        include: { product: true, user: true, pickupCenter: true },
      });

      if (!order) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Order not found" });
      }

      const access = await resolvePickupAccess(ctx.prisma as any, ctx.user);
      if (!canActOnCenter(access, order.pickupCenterId ?? null)) {
        throw new TRPCError({ code: "FORBIDDEN", message: "You are not authorized for this pickup center" });
      }

      if (order.claimStatus !== "VERIFIED") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Verify the claim code before completing" });
      }

      const now = new Date();
      const updated = await (ctx.prisma as any).order.update({
        where: { id: order.id },
        data: {
          claimStatus: "COMPLETED",
          status: "COMPLETED",
          pickupCompletionConfirmedAt: now,
          pickupCompletionConfirmedBy: ctx.user.id,
          feedbackInvitationSentAt: order.feedbackInvitationSentAt ?? now,
        },
        include: { product: true, user: true, pickupCenter: true },
      });

      if (updated.rewardSettlementState === "PENDING") {
        await settleStoreReferralRewards(ctx.prisma, updated.id);
      }

      const refreshed = await (ctx.prisma as any).order.findUnique({
        where: { id: updated.id },
        include: { product: true, pickupCenter: true, user: true },
      });

      await sendPickupCompletionEmails(refreshed ?? updated);

      return mapOrder(refreshed ?? updated);
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
