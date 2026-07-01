/**
 * Standalone Cron Server for VPS Deployment
 * Runs scheduled revenue distribution and other scheduled tasks
 * 
 * Usage:
 * - Development: npx tsx server/cron-server.ts
 * - Production: node server/cron-server.js (after build)
 * - PM2: pm2 start server/cron-server.js --name bpi-cron
 */

import cron from "node-cron";
import { prisma } from "@/lib/prisma";
import { startNewsletterRuntime } from "@/server/trpc/router/admin";
import { runCspAutoContributeSweep } from "@/server/jobs/cspAutoContributeSweep";
import { runCspBroadcastSweep } from "@/server/jobs/cspBroadcastSweep";
import fs from "fs";
import path from "path";

// Set timezone to Nigeria (WAT = UTC+1)
process.env.TZ = 'Africa/Lagos';

const CRON_ERROR_LOG = path.join(process.cwd(), "logs", "cron-errors.log");

/**
 * Append an error entry to the filesystem log as a last-resort fallback.
 */
function logToFile(entry: string) {
  try {
    const dir = path.dirname(CRON_ERROR_LOG);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.appendFileSync(CRON_ERROR_LOG, entry + "\n");
  } catch {
    // Absolute last resort — stderr is the only option left
    process.stderr.write(`[CRON] Cannot write to ${CRON_ERROR_LOG}: ${entry}\n`);
  }
}

/**
 * Send error notification to admin (fail-safe: always falls back to filesystem)
 */
async function notifyAdminOfError(error: any, context: string) {
  const timestamp = new Date().toISOString();
  const message = error instanceof Error ? error.message : String(error);
  const stack = error instanceof Error ? error.stack : undefined;

  // Always log to console
  console.error(`\n🚨 [ADMIN ALERT] ${context}:`, error);

  // Always write to filesystem (guaranteed to not throw)
  logToFile(`[${timestamp}] ${context}: ${message}${stack ? `\n${stack}` : ""}`);

  // Best-effort: log to database for admin dashboard
  try {
    await prisma.revenueAdminAction.create({
      data: {
        adminId: "system",
        actionType: "DISTRIBUTION_ERROR",
        description: `Error in ${context}: ${message}`,
        metadata: {
          error: message,
          stack,
          timestamp,
        },
      },
    });
  } catch (dbError) {
    const dbMsg = dbError instanceof Error ? dbError.message : String(dbError);
    logToFile(`[${timestamp}] LOGGING_FAILURE: Could not write to database: ${dbMsg}`);
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

function getWeeklyWindow(reference: Date) {
  const weekEnd = new Date(reference);
  weekEnd.setHours(23, 59, 59, 999);

  // Friday is day 5. This window helps explain which cycle was paid.
  const day = weekEnd.getDay();
  const daysSinceSaturday = (day + 1) % 7;
  const weekStart = new Date(weekEnd);
  weekStart.setDate(weekStart.getDate() - daysSinceSaturday);
  weekStart.setHours(0, 0, 0, 0);

  return { weekStart, weekEnd };
}

/**
 * Distribute Executive Pool to shareholders
 * Runs weekly on Friday at 8:00 AM WAT
 */
async function distributeExecutivePool() {
  console.log("\n🔄 [EXECUTIVE DISTRIBUTION] Starting weekly Friday distribution...");
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

    // Resolve beneficiary wallets by email first, then fall back to stored userId.
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

    const unresolvedBeneficiaries: Array<{
      shareholderId: string;
      role: string;
      email: string | null;
    }> = [];
    const runAt = new Date();
    const { weekStart, weekEnd } = getWeeklyWindow(runAt);

    // Use transaction for atomicity
    const result = await prisma.$transaction(async (tx: any) => {
      const distributions = [];

      // Process each allocation
      for (const allocation of pendingAllocations) {
        // Distribute to each shareholder
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

          // Calculate shareholder's share of this allocation
          const shareAmount = (Number(allocation.amount) * Number(shareholder.percentage)) / 100;

          // Credit shareholder main wallet (User.shareholder field)
          await tx.user.update({
            where: { id: beneficiaryUserId },
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

    if (unresolvedBeneficiaries.length > 0) {
      await prisma.revenueAdminAction.create({
        data: {
          adminId: "system",
          actionType: "EXECUTIVE_PAYOUT_MAPPING_WARNING",
          description: `Weekly executive payout completed with ${unresolvedBeneficiaries.length} unresolved beneficiary mappings`,
          metadata: {
            unresolvedBeneficiaries,
            weekStart: weekStart.toISOString(),
            weekEnd: weekEnd.toISOString(),
            runAt: runAt.toISOString(),
          },
        },
      });
    }

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
    
    // Log error for admin review (fail-safe)
    await notifyAdminOfError(error, "Executive Pool Distribution");

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

  startNewsletterRuntime();
  console.log("📧 Newsletter scheduler attached to cron worker");

  // Weekly Executive Pool Distribution every Friday at 8:00 AM WAT (Nigeria Time)
  cron.schedule("0 8 * * 5", async () => {
    console.log("\n⏰ [CRON] Triggered: Weekly Friday Executive Pool Distribution");
    try {
      // Retry with exponential backoff (3 attempts, starting at 2s delay)
      await retryWithBackoff(distributeExecutivePool, 3, 2000);
    } catch (error) {
      console.error("❌ [CRON] Distribution failed after retries:", error);
      await notifyAdminOfError(error, "Weekly Friday Executive Pool Distribution");
    }
  }, {
    timezone: "Africa/Lagos"
  });

  // CSP Auto-Contribute Sweep — every 15 minutes.
  // Autonomously contributes from each enabled user's community wallet so the
  // feature keeps running at intervals instead of only firing once on an event.
  cron.schedule("*/15 * * * *", async () => {
    console.log("\n⏰ [CRON] Triggered: CSP Auto-Contribute Sweep");
    try {
      const result = await runCspAutoContributeSweep();
      console.log(`✅ [CSP-AUTO-CONTRIBUTE] ${result.summary}`);
    } catch (error) {
      console.error("❌ [CRON] CSP auto-contribute sweep failed:", error);
      await notifyAdminOfError(error, "CSP Auto-Contribute Sweep");
    }
  }, {
    timezone: "Africa/Lagos"
  });

  // CSP Broadcast Sweep — every 10 minutes (auto-extend / close expiring broadcasts).
  cron.schedule("*/10 * * * *", async () => {
    console.log("\n⏰ [CRON] Triggered: CSP Broadcast Sweep");
    try {
      const result = await runCspBroadcastSweep();
      console.log(`✅ [CSP-BROADCAST-SWEEP] ${result.summary}`);
    } catch (error) {
      console.error("❌ [CRON] CSP broadcast sweep failed:", error);
      await notifyAdminOfError(error, "CSP Broadcast Sweep");
    }
  }, {
    timezone: "Africa/Lagos"
  });

  console.log("\n✅ Cron jobs scheduled:");
  console.log("   • Executive Pool Distribution: Friday at 8:00 AM (0 8 * * 5)");
  console.log("   • CSP Auto-Contribute Sweep: every 15 minutes (*/15 * * * *)");
  console.log("   • CSP Broadcast Sweep: every 10 minutes (*/10 * * * *)");
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
