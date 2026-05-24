/**
 * Executive Revenue Distribution Cron Job
 * Runs weekly on Friday at 8:00 AM to distribute Executive Pool (30%) to shareholders
 */

import { prisma } from "@/lib/prisma";
import cron from "node-cron";

/**
 * Distribute Executive Pool to shareholders
 * Calculates and distributes the 30% executive pool based on individual shareholder percentages
 */
async function distributeExecutivePool() {
  console.log("\n🔄 [EXECUTIVE DISTRIBUTION] Starting weekly Friday distribution...");
  console.log(`⏰ Time: ${new Date().toLocaleString()}`);

  try {
    // Get all pending executive pool allocations
    const pendingAllocations = await prisma.revenueAllocation.findMany({
      where: {
        destinationType: "EXECUTIVE_POOL",
        status: "PENDING",
      },
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
      (sum: any, alloc: any) => sum + alloc.amount,
      0
    );
    console.log(`💰 Total Executive Pool Amount: ₦${totalAmount.toLocaleString()}`);

    // Get all executive shareholders with assigned users
    const shareholders = await prisma.executiveShareholder.findMany({
      where: {
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

    // Create a revenue transaction for this distribution
    const revenueTransaction = await prisma.revenueTransaction.create({
      data: {
        source: "OTHER",
        amount: totalAmount,
        currency: "NGN",
        description: `Weekly Friday executive pool distribution for ${new Date().toLocaleDateString()}`,
      },
    });

    // Create a master allocation for this distribution
    const masterAllocation = await prisma.revenueAllocation.create({
      data: {
        revenueTransactionId: revenueTransaction.id,
        amount: totalAmount,
        percentage: 30, // Executive pool is 30% of revenue
        destinationType: "EXECUTIVE_POOL",
        status: "DISTRIBUTED",
        distributedAt: new Date(),
      },
    });

    // Calculate and distribute to each shareholder
    const distributions = [];
    for (const shareholder of shareholders) {
      const beneficiaryEmail = shareholder.User?.email?.trim().toLowerCase() ?? null;
      const resolvedByEmail = beneficiaryEmail ? emailToUser.get(beneficiaryEmail) : null;
      const beneficiaryUserId = resolvedByEmail?.id ?? shareholder.userId;

      if (!beneficiaryUserId) {
        continue;
      }

      // Calculate shareholder's share
      const shareAmount = (totalAmount * Number(shareholder.percentage)) / 100;

      // Credit shareholder wallet
      await prisma.user.update({
        where: { id: beneficiaryUserId },
        data: {
          shareholder: {
            increment: shareAmount,
          },
        },
      });

      // Record distribution
      const distribution = await prisma.executiveDistribution.create({
        data: {
          allocationId: masterAllocation.id,
          shareholderId: shareholder.id,
          amount: shareAmount,
          percentage: shareholder.percentage,
          distributedAt: new Date(),
          status: "COMPLETED",
        },
      });

      distributions.push({
        role: shareholder.role,
        name: resolvedByEmail?.name || shareholder.User?.name,
        email: beneficiaryEmail,
        percentage: shareholder.percentage,
        amount: shareAmount,
      });

      console.log(
        `  ✅ ${shareholder.role}: ₦${shareAmount.toLocaleString()} (${shareholder.percentage}%) → ${resolvedByEmail?.name || shareholder.User?.name || beneficiaryEmail || beneficiaryUserId}`
      );
    }

    // Mark allocations as distributed
    await prisma.revenueAllocation.updateMany({
      where: {
        id: {
          in: pendingAllocations.map((a: any) => a.id),
        },
      },
      data: {
        status: "DISTRIBUTED",
      },
    });

    console.log(`\n✅ [EXECUTIVE DISTRIBUTION] Completed successfully!`);
    console.log(`📊 Summary:`);
    console.log(`   Total Distributed: ₦${totalAmount.toLocaleString()}`);
    console.log(`   Recipients: ${distributions.length}`);
    console.log(`   Allocations Processed: ${pendingAllocations.length}`);

    return {
      success: true,
      message: "Weekly executive payout completed",
      totalAmount,
      recipientCount: distributions.length,
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
