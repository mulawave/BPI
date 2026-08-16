/**
 * Executive Revenue Distribution Cron Job
 * Runs weekly on Friday at 8:00 AM to distribute Executive Pool (30%) to shareholders
 */

import { prisma } from "@/lib/prisma";
import cron from "node-cron";

const REVENUE_POOL_START_DATE = new Date("2026-05-01T00:00:00.000Z");

function getWeeklyWindow(reference: Date) {
  const weekEnd = new Date(reference);
  weekEnd.setHours(23, 59, 59, 999);
  const day = weekEnd.getDay();
  const daysSinceSaturday = (day + 1) % 7;
  const weekStart = new Date(weekEnd);
  weekStart.setDate(weekStart.getDate() - daysSinceSaturday);
  weekStart.setHours(0, 0, 0, 0);
  return { weekStart, weekEnd };
}

/**
 * Distribute Executive Pool to shareholders
 * Calculates and distributes the 30% executive pool based on individual shareholder percentages
 */
async function distributeExecutivePool() {
  console.log("\n🔄 [EXECUTIVE DISTRIBUTION] Starting weekly Friday distribution...");
  console.log(`⏰ Time: ${new Date().toLocaleString()}`);

  try {
    // Get all pending executive pool allocations on or after REVENUE_POOL_START_DATE
    const pendingAllocations = await prisma.revenueAllocation.findMany({
      where: {
        destinationType: "EXECUTIVE_POOL",
        status: "PENDING",
        createdAt: { gte: REVENUE_POOL_START_DATE },
      },
      orderBy: { createdAt: "asc" },
    });

    if (pendingAllocations.length === 0) {
      console.log("ℹ️  [EXECUTIVE DISTRIBUTION] No pending allocations to distribute");
      return {
        success: true,
        message: "No pending executive allocations",
        totalAmount: 0,
        recipientCount: 0,
        allocationsProcessed: 0,
      };
    }

    // Calculate total pending amount
    const totalAmount = pendingAllocations.reduce(
      (sum: number, alloc: any) => sum + Number(alloc.amount),
      0
    );
    console.log(`💰 Total Executive Pool Amount: ₦${totalAmount.toLocaleString()}`);

    // Get all active executive shareholders with assigned users
    const shareholders = await prisma.executiveShareholder.findMany({
      where: {
        isActive: true,
        userId: { not: null },
      },
      include: {
        User: {
          select: {
            id: true,
            name: true,
            email: true,
            shareholder: true,
          },
        },
      },
    });

    if (shareholders.length === 0) {
      console.log(
        "⚠️  [EXECUTIVE DISTRIBUTION] No shareholders assigned. Pool will remain pending."
      );
      return {
        success: false,
        message: "No active executive shareholders with assignments",
        totalAmount,
        recipientCount: 0,
        allocationsProcessed: pendingAllocations.length,
      };
    }

    console.log(`👥 Active Shareholders: ${shareholders.length}`);

    // Resolve beneficiary wallets by email first, then userId fallback.
    const shareholderEmails = shareholders
      .map((shareholder: any) => shareholder.User?.email?.trim().toLowerCase())
      .filter((email: string | undefined): email is string => Boolean(email));

    const matchedUsers = shareholderEmails.length
      ? await prisma.user.findMany({
          where: {
            email: {
              in: shareholderEmails,
            },
          },
          select: {
            id: true,
            email: true,
            name: true,
          },
        })
      : [];

    const emailToUser = new Map(
      matchedUsers
        .filter((user: any) => Boolean(user.email))
        .map((user: any) => [String(user.email).trim().toLowerCase(), user])
    );

    const runAt = new Date();
    const { weekStart, weekEnd } = getWeeklyWindow(runAt);

    // Use transaction for atomicity
    const result = await prisma.$transaction(async (tx: any) => {
      const distributions = [];
      const unresolvedBeneficiaries: Array<{
        shareholderId: string;
        role: string;
        email: string | null;
      }> = [];

      // Process each allocation
      for (const allocation of pendingAllocations) {
        for (const shareholder of shareholders) {
          const beneficiaryEmail = shareholder.User?.email?.trim().toLowerCase() ?? null;
          const resolvedByEmail = beneficiaryEmail ? emailToUser.get(beneficiaryEmail) : null;
          const beneficiaryUserId = resolvedByEmail?.id ?? shareholder.userId;

          if (!beneficiaryUserId) {
            unresolvedBeneficiaries.push({
              shareholderId: shareholder.id,
              role: shareholder.role,
              email: beneficiaryEmail,
            });
            continue;
          }

          const shareAmount = (Number(allocation.amount) * Number(shareholder.percentage)) / 100;

          // Credit shareholder main wallet (User.shareholder field)
          await tx.user.update({
            where: { id: beneficiaryUserId },
            data: { shareholder: { increment: shareAmount } },
          });

          // Credit executive shareholder wallet
          await tx.executiveShareholder.update({
            where: { id: shareholder.id },
            data: {
              totalEarned: { increment: shareAmount },
              currentBalance: { increment: shareAmount },
              lastDistributionAt: new Date(),
            },
          });

          // Record distribution
          const distribution = await tx.executiveDistribution.create({
            data: {
              allocationId: allocation.id,
              shareholderId: shareholder.id,
              amount: shareAmount,
              percentage: shareholder.percentage,
              status: "COMPLETED",
              distributedAt: new Date(),
            },
          });

          // Create wallet transaction record
          await tx.executiveWalletTransaction.create({
            data: {
              shareholderId: shareholder.id,
              amount: shareAmount,
              type: "DISTRIBUTION",
              distributionId: distribution.id,
              description: `Weekly Friday executive pool payout - ${shareholder.role}`,
              metadata: {
                payoutType: "WEEKLY_FRIDAY_EXECUTIVE",
                beneficiaryEmail,
                creditedUserId: beneficiaryUserId,
                resolvedByEmail: Boolean(resolvedByEmail),
                weekStart: weekStart.toISOString(),
                weekEnd: weekEnd.toISOString(),
                runAt: runAt.toISOString(),
                allocationId: allocation.id,
              },
            },
          });

          distributions.push({
            role: shareholder.role,
            name: resolvedByEmail?.name || shareholder.User?.name,
            email: beneficiaryEmail,
            percentage: shareholder.percentage,
            amount: shareAmount,
            creditedUserId: beneficiaryUserId,
            resolvedByEmail: Boolean(resolvedByEmail),
          });

          console.log(
            `  ✅ ${shareholder.role}: ₦${shareAmount.toLocaleString()} (${shareholder.percentage}%) → ${resolvedByEmail?.name || shareholder.User?.name || beneficiaryEmail || beneficiaryUserId}`
          );
        }
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

      return { distributions, totalAmount, unresolvedBeneficiaries };
    });

    // Log unresolved beneficiaries for admin review (outside transaction)
    if (result.unresolvedBeneficiaries.length > 0) {
      const systemAdmin = await prisma.user.findFirst({
        where: { role: "admin" },
        select: { id: true },
      });
      if (systemAdmin) {
        await prisma.revenueAdminAction.create({
          data: {
            adminId: systemAdmin.id,
            actionType: "EXECUTIVE_PAYOUT_MAPPING_WARNING",
            description: `Weekly executive payout completed with ${result.unresolvedBeneficiaries.length} unresolved beneficiary mappings`,
            metadata: {
              unresolvedBeneficiaries: result.unresolvedBeneficiaries,
              weekStart: weekStart.toISOString(),
              weekEnd: weekEnd.toISOString(),
              runAt: runAt.toISOString(),
            },
          },
        });
      } else {
        console.warn("⚠️  [EXECUTIVE DISTRIBUTION] No admin user found to log unresolved beneficiary warning");
      }
    }

    console.log(`\n✅ [EXECUTIVE DISTRIBUTION] Completed successfully!`);
    console.log(`📊 Summary:`);
    console.log(`   Total Distributed: ₦${result.totalAmount.toLocaleString()}`);
    console.log(`   Recipients: ${result.distributions.length}`);
    console.log(`   Allocations Processed: ${pendingAllocations.length}`);

    return {
      success: true,
      message: "Weekly executive payout completed",
      totalAmount: result.totalAmount,
      recipientCount: result.distributions.length,
      allocationsProcessed: pendingAllocations.length,
    };
  } catch (error) {
    console.error("\n❌ [EXECUTIVE DISTRIBUTION] Error:", error);
    throw error;
  }
}

/**
 * Schedule weekly distribution every Friday at 8:00 AM
 * Cron expression: "0 8 * * 5" = At 08:00 on Friday
 */
export function startRevenueDistributionCron() {
  console.log("🚀 [CRON] Revenue distribution scheduler started");
  console.log("⏰ [CRON] Executive pool distribution scheduled for Friday 8:00 AM");

  // Run at 8:00 AM every Friday
  cron.schedule("0 8 * * 5", async () => {
    console.log("\n⏰ [CRON] Triggered: Weekly Friday Executive Pool Distribution");
    try {
      await distributeExecutivePool();
    } catch (error) {
      console.error("❌ [CRON] Distribution failed:", error);
      // TODO: Send alert to admin about failed distribution
    }
  });

  // Optional: Run immediately on startup for testing (REMOVE IN PRODUCTION)
  // distributeExecutivePool().catch(console.error);
}

// Export for manual triggering
export { distributeExecutivePool };
