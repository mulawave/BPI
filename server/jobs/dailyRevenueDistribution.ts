/**
 * Daily Revenue Distribution Cron Job
 * Runs daily at 8:00 AM to distribute Executive Pool (30%) to shareholders
 */

import { prisma } from "@/lib/prisma";
import cron from "node-cron";

/**
 * Distribute Executive Pool to shareholders
 * Calculates and distributes the 30% executive pool based on individual shareholder percentages
 */
async function distributeExecutivePool() {
  console.log("\n🔄 [EXECUTIVE DISTRIBUTION] Starting daily distribution...");
  console.log(`⏰ Time: ${new Date().toLocaleString()}`);

  try {
    // Get all pending executive pool allocations from yesterday
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(0, 0, 0, 0);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const pendingAllocations = await prisma.revenueAllocation.findMany({
      where: {
        destinationType: "EXECUTIVE_POOL",
        status: "PENDING",
        createdAt: {
          gte: yesterday,
          lt: today,
        },
      },
    });

    if (pendingAllocations.length === 0) {
      console.log("ℹ️  [EXECUTIVE DISTRIBUTION] No pending allocations for yesterday");
      return;
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
        user: {
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
      return;
    }

    console.log(`👥 Active Shareholders: ${shareholders.length}`);

    // Calculate and distribute to each shareholder
    const distributions = [];
    for (const shareholder of shareholders) {
      if (!shareholder.user) continue;

      // Calculate shareholder's share
      const shareAmount = (totalAmount * shareholder.percentage) / 100;

      // Credit shareholder wallet
      await prisma.user.update({
        where: { id: shareholder.userId! },
        data: {
          shareholder: {
            increment: shareAmount,
          },
        },
      });

      // Record distribution
      const distribution = await prisma.executiveDistribution.create({
        data: {
          shareholderId: shareholder.id,
          amount: shareAmount,
          distributionDate: new Date(),
          status: "COMPLETED",
        },
      });

      distributions.push({
        role: shareholder.role,
        name: shareholder.user.name,
        email: shareholder.user.email,
        percentage: shareholder.percentage,
        amount: shareAmount,
      });

      console.log(
        `  ✅ ${shareholder.role}: ₦${shareAmount.toLocaleString()} (${shareholder.percentage}%) → ${shareholder.user.name || shareholder.user.email}`
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
  } catch (error) {
    console.error("\n❌ [EXECUTIVE DISTRIBUTION] Error:", error);
    throw error;
  }
}

/**
 * Schedule daily distribution at 8:00 AM
 * Cron expression: "0 8 * * *" = At 08:00 every day
 */
export function startRevenueDistributionCron() {
  console.log("🚀 [CRON] Revenue distribution scheduler started");
  console.log("⏰ [CRON] Executive pool distribution scheduled for 8:00 AM daily");

  // Run at 8:00 AM every day
  cron.schedule("0 8 * * *", async () => {
    console.log("\n⏰ [CRON] Triggered: Daily Executive Pool Distribution");
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
