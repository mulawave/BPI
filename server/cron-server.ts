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

// Set timezone to Nigeria (WAT = UTC+1)
process.env.TZ = 'Africa/Lagos';

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
      return { success: false, message: "No shareholders assigned", totalAmount };
    }

    console.log(`👥 Active Shareholders: ${shareholders.length}`);

    // Use transaction for atomicity
    const result = await prisma.$transaction(async (tx) => {
      const distributions = [];

      // Process each allocation
      for (const allocation of pendingAllocations) {
        // Distribute to each shareholder
        for (const shareholder of shareholders) {
          if (!shareholder.User) continue;

          // Calculate shareholder's share of this allocation
          const shareAmount = (Number(allocation.amount) * Number(shareholder.percentage)) / 100;

          // Credit shareholder wallet
          await tx.user.update({
            where: { id: shareholder.userId! },
            data: {
              shareholder: {
                increment: shareAmount,
              },
            },
          });

          // Record distribution with all required fields
          await tx.executiveDistribution.create({
            data: {
              allocationId: allocation.id,
              shareholderId: shareholder.id,
              amount: shareAmount,
              percentage: shareholder.percentage,
              status: "COMPLETED",
              distributedAt: new Date(),
            },
          });

          distributions.push({
            role: shareholder.role,
            name: shareholder.User.name,
            email: shareholder.User.email,
            percentage: shareholder.percentage,
            amount: shareAmount,
          });

          console.log(
            `  ✅ ${shareholder.role}: ₦${shareAmount.toLocaleString()} (${shareholder.percentage}%) → ${shareholder.User.name || shareholder.User.email}`
          );
        }
      }

      // Mark allocations as distributed
      await tx.revenueAllocation.updateMany({
        where: {
          id: {
            in: pendingAllocations.map((a: any) => a.id),
          },
        },
        data: {
          status: "DISTRIBUTED",
          distributedAt: new Date(),
        },
      });

      return { distributions, totalAmount };
    });

    console.log(`\n✅ [EXECUTIVE DISTRIBUTION] Completed successfully!`);
    console.log(`📊 Summary:`);
    console.log(`   Total Distributed: ₦${result.totalAmount.toLocaleString()}`);
    console.log(`   Recipients: ${result.distributions.length}`);
    console.log(`   Allocations Processed: ${pendingAllocations.length}`);

    return {
      success: true,
      totalAmount: result.totalAmount,
      distributed: result.distributions.length,
      allocationsProcessed: pendingAllocations.length,
    };
  } catch (error) {
    console.error("\n❌ [EXECUTIVE DISTRIBUTION] Error:", error);
    
    // Log error for admin review
    try {
      await prisma.revenueAdminAction.create({
        data: {
          adminId: "system", // System user
          actionType: "DISTRIBUTION_ERROR",
          description: `Executive distribution failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
          metadata: {
            error: error instanceof Error ? error.stack : String(error),
            timestamp: new Date().toISOString(),
          },
        },
      });
    } catch (logError) {
      console.error("Failed to log error:", logError);
    }

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

  // Daily Executive Pool Distribution at 8:00 AM WAT (Nigeria Time)
  cron.schedule("0 8 * * *", async () => {
    console.log("\n⏰ [CRON] Triggered: Daily Executive Pool Distribution");
    try {
      await distributeExecutivePool();
    } catch (error) {
      console.error("❌ [CRON] Distribution failed:", error);
      // Error is already logged in distributeExecutivePool
    }
  }, {
    timezone: "Africa/Lagos"
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
