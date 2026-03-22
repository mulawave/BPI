/**
 * Renewal Revenue Integration
 * Automatically records revenue from membership renewals
 */

import { prisma } from "@/lib/prisma";
import { recordRevenue } from "./revenue.service";

/**
 * Record renewal revenue when a membership is renewed
 * Call this function from the renewal flow
 */
export async function recordRenewalRevenue(params: {
  userId: string;
  packageId: string;
  packageName: string;
  renewalFee: number;
  vat: number;
  renewalHistoryId: string;
}) {
  const { userId, packageId, packageName, renewalFee, vat, renewalHistoryId } = params;
  
  const totalAmount = renewalFee + vat;

  const normalizePercent = (maybePercent: number, fallback: number) => {
    if (!Number.isFinite(maybePercent)) return fallback;
    if (maybePercent < 0) return fallback;
    return maybePercent > 1 ? maybePercent / 100 : maybePercent;
  };

  const computeProfitFiat = (params: {
    profitMode: "PERCENT" | "FIXED" | "HYBRID";
    profitPercent: number;
    profitFixedAmountFiat: number;
    baseFiat: number;
  }) => {
    const percent = normalizePercent(params.profitPercent, 0);
    const fixed = Number(params.profitFixedAmountFiat ?? 0);
    const base = Number(params.baseFiat ?? 0);

    let profit = 0;
    if (params.profitMode === "PERCENT") profit = base * percent;
    else if (params.profitMode === "FIXED") profit = fixed;
    else profit = base * percent + fixed;

    return Math.min(Math.max(profit, 0), base);
  };
  
  try {
    console.log(`[RENEWAL REVENUE] Recording renewal revenue for user ${userId}: ₦${totalAmount.toLocaleString()}`);

    const membershipPackage = await prisma.membershipPackage.findUnique({ where: { id: packageId } });
    const renewalProfitFiat = membershipPackage
      ? computeProfitFiat({
          profitMode: ((membershipPackage.profitMode ?? "PERCENT") as any) as "PERCENT" | "FIXED" | "HYBRID",
          profitPercent: Number(membershipPackage.profitPercent ?? 1),
          profitFixedAmountFiat: Number(membershipPackage.profitFixedAmountFiat ?? 0),
          baseFiat: Number(renewalFee ?? 0),
        })
      : Number(renewalFee ?? 0);
    
    // Record revenue in the revenue system
    const revenueTransaction = await recordRevenue(prisma, {
      source: "MEMBERSHIP_RENEWAL",
      amount: renewalProfitFiat,
      currency: "NGN",
      sourceId: `renewal-${renewalHistoryId}`,
      description: `Membership renewal: ${packageName}`,
      userId,
      packageId,
      programType: "MEMBERSHIP_RENEWAL",
      metadata: {
        totalPaid: totalAmount,
        renewalFee,
        vat,
        packageName,
        usedProfitConfig: Boolean(membershipPackage),
      },
    });
    
    console.log(`[RENEWAL REVENUE] Successfully recorded renewal revenue: ${revenueTransaction.id}`);
    
    return revenueTransaction;
  } catch (error: any) {
    console.error("[RENEWAL REVENUE] Error recording renewal revenue:", {
      userId,
      renewalHistoryId,
      error: error.message,
    });
    
    // Don't throw - renewal should succeed even if revenue recording fails
    // Log for manual reconciliation
    await prisma.revenueAdminAction.create({
      data: {
        adminId: "system",
        actionType: "REVENUE_RECORDING_FAILED",
        description: `Failed to record renewal revenue for user ${userId}`,
        metadata: {
          userId,
          renewalHistoryId,
          amount: totalAmount,
          error: error.message,
        },
      },
    }).catch((err: any) => {
      console.error("Failed to log revenue error:", err);
    });
  }
}

/**
 * Backfill revenue for existing renewals
 * Run this once to record revenue for renewals that happened before integration
 */
export async function backfillRenewalRevenue(params?: {
  startDate?: Date;
  endDate?: Date;
  limit?: number;
}) {
  const { startDate, endDate, limit = 1000 } = params || {};
  
  try {
    console.log("[RENEWAL BACKFILL] Starting renewal revenue backfill...");
    
    const where: any = {};
    if (startDate || endDate) {
      where.renewedAt = {};
      if (startDate) where.renewedAt.gte = startDate;
      if (endDate) where.renewedAt.lte = endDate;
    }
    
    // Get renewals without revenue records
    const renewals = await prisma.renewalHistory.findMany({
      where,
      orderBy: { renewedAt: "desc" },
      take: limit,
    });
    
    console.log(`[RENEWAL BACKFILL] Found ${renewals.length} renewals to process`);
    
    let successCount = 0;
    let failureCount = 0;
    
    for (const renewal of renewals) {
      try {
        // Check if revenue already recorded
        const existing = await prisma.revenueTransaction.findFirst({
          where: { sourceId: `renewal-${renewal.id}` },
        });
        
        if (existing) {
          console.log(`[RENEWAL BACKFILL] Skipping ${renewal.id} - already recorded`);
          continue;
        }
        
        await recordRenewalRevenue({
          userId: renewal.userId,
          packageId: renewal.packageId,
          packageName: renewal.packageName,
          renewalFee: renewal.renewalFee,
          vat: renewal.vat,
          renewalHistoryId: renewal.id,
        });
        
        successCount++;
      } catch (error) {
        console.error(`[RENEWAL BACKFILL] Failed to record revenue for ${renewal.id}:`, error);
        failureCount++;
      }
    }
    
    console.log(`[RENEWAL BACKFILL] Completed: ${successCount} success, ${failureCount} failures`);
    
    return { successCount, failureCount, totalProcessed: renewals.length };
  } catch (error) {
    console.error("[RENEWAL BACKFILL] Error:", error);
    throw error;
  }
}
