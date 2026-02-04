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
import { prisma } from "@/lib/prisma";

// Set timezone to Nigeria (WAT = UTC+1)
process.env.TZ = 'Africa/Lagos';

/**
 * Send error notification to admin
 */
async function notifyAdminOfError(error: any, context: string) {
  try {
    console.error(`\n🚨 [ADMIN ALERT] ${context}:`, error);
    
    // Log to database for admin dashboard
    await prisma.revenueAdminAction.create({
      data: {
        adminId: "system",
        actionType: "DISTRIBUTION_ERROR",
        description: `Error in ${context}: ${error.message}`,
        metadata: {
          error: error.message,
          stack: error.stack,
          timestamp: new Date().toISOString(),
        },
      },
    }).catch((err: any) => {
      console.error("Failed to log error to database:", err);
    });
    
    // TODO: Add email/SMS notification here
    // await sendEmail({
    //   to: process.env.ADMIN_EMAIL,
    //   subject: `Revenue Distribution Error: ${context}`,
    //   body: error.message,
    // });
  } catch (notifyError) {
    console.error("Failed to send error notification:", notifyError);
  }
}

/**
 * Retry a function with exponential backoff
 */
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  initialDelay = 1000
): Promise<T> {
  let lastError;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      
      if (attempt < maxRetries - 1) {
        const delay = initialDelay * Math.pow(2, attempt);
        console.log(`⏳ [RETRY] Attempt ${attempt + 1} failed, retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  throw lastError;
}

/**
 * Distribute Executive Pool to shareholders
 * Runs daily at 8:00 AM
 */
async function distributeExecutivePool() {
  console.log("\n🔄 [EXECUTIVE DISTRIBUTION] Starting daily distribution...");
  console.log(`⏰ Time: ${new Date().toLocaleString()}`);

  try {
    // Get ALL pending executive pool allocations (not just yesterday's)
    // This ensures that if the cron job misses a day, funds are still distributed
    const pendingAllocations = await prisma.revenueAllocation.findMany({
      where: {
        destinationType: "EXECUTIVE_POOL",
        status: "PENDING",
      },
      orderBy: {
        createdAt: "asc", // Process oldest first
      },
    });

    if (pendingAllocations.length === 0) {
      console.log("ℹ️  [EXECUTIVE DISTRIBUTION] No pending allocations to distribute");
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
    const result = await prisma.$transaction(async (tx: any) => {
      const distributions = [];

      // Process each allocation
      for (const allocation of pendingAllocations) {
        // Distribute to each shareholder
        for (const shareholder of shareholders) {
          if (!shareholder.User) continue;

          // Calculate shareholder's share of this allocation
          const shareAmount = (Number(allocation.amount) * Number(shareholder.percentage)) / 100;

          // Credit shareholder main wallet (User.shareholder field)
          await tx.user.update({
            where: { id: shareholder.userId! },
            data: {
              shareholder: {
                increment: shareAmount,
              },
            },
          });

          // Credit executive shareholder wallet (new fields)
          await tx.executiveShareholder.update({
            where: { id: shareholder.id },
            data: {
              totalEarned: {
                increment: shareAmount,
              },
              currentBalance: {
                increment: shareAmount,
              },
              lastDistributionAt: new Date(),
            },
          });

          // Record distribution with all required fields
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
              description: `Daily executive pool distribution - ${shareholder.role}`,
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
      recipientCount: result.distributions.length,
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
      // Retry with exponential backoff (3 attempts, starting at 2s delay)
      await retryWithBackoff(distributeExecutivePool, 3, 2000);
    } catch (error) {
      console.error("❌ [CRON] Distribution failed after retries:", error);
      await notifyAdminOfError(error, "Daily Executive Pool Distribution");
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
