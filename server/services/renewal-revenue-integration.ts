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
  const { userId, packageName, renewalFee, vat, renewalHistoryId } = params;
  
  const totalAmount = renewalFee + vat;
  
  try {
    console.log(`[RENEWAL REVENUE] Recording renewal revenue for user ${userId}: ₦${totalAmount.toLocaleString()}`);
    
    // Record revenue in the revenue system
    const revenueTransaction = await recordRevenue(prisma, {
      source: "MEMBERSHIP_RENEWAL",
      amount: totalAmount,
      currency: "NGN",
      sourceId: `renewal-${renewalHistoryId}`,
      description: `Membership renewal: ${packageName}`,
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
