/**
 * Standalone Cron Server for VPS Deployment
 * Runs daily revenue distribution and other scheduled tasks
 * 
 * Usage:
 * - Development: npx tsx server/cron-server.ts
 * - Production: node server/cron-server.js (after build)
 * - PM2: pm2 start server/cron-server.js --name bpi-cron
 */

import cron from "node-cron";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * Distribute Executive Pool to shareholders
 * Runs daily at 8:00 AM
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
      return { success: true, message: "No pending allocations", distributed: 0 };
    }

    // Calculate total pending amount
    const totalAmount = pendingAllocations.reduce(
      (sum: number, alloc: any) => sum + alloc.amount,
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
      return { success: false, message: "No shareholders assigned", totalAmount };
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
      await prisma.executiveDistribution.create({
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

    return {
      success: true,
      totalAmount,
      distributed: distributions.length,
      allocationsProcessed: pendingAllocations.length,
    };
  } catch (error) {
    console.error("\n❌ [EXECUTIVE DISTRIBUTION] Error:", error);
    throw error;
  }
}

/**
 * Start cron jobs
 */
function startCronJobs() {
  console.log("\n🚀 ===== BPI CRON SERVER STARTED =====");
  console.log(`📅 Server Time: ${new Date().toLocaleString()}`);
  console.log(`🌍 Timezone: ${Intl.DateTimeFormat().resolvedOptions().timeZone}`);

  // Daily Executive Pool Distribution at 8:00 AM
  cron.schedule("0 8 * * *", async () => {
    console.log("\n⏰ [CRON] Triggered: Daily Executive Pool Distribution");
    try {
      await distributeExecutivePool();
    } catch (error) {
      console.error("❌ [CRON] Distribution failed:", error);
      // TODO: Send alert to admin about failed distribution
    }
  });

  console.log("\n✅ Cron jobs scheduled:");
  console.log("   • Executive Pool Distribution: Daily at 8:00 AM (0 8 * * *)");
  console.log("\n⏳ Waiting for scheduled tasks...\n");

  // Keep process alive
  process.on("SIGINT", async () => {
    console.log("\n\n🛑 Shutting down cron server...");
    await prisma.$disconnect();
    process.exit(0);
  });
}

// Start the cron server
startCronJobs();

// Export for manual testing
export { distributeExecutivePool };
