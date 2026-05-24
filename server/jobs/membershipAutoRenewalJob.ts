/**
 * Background Job: Membership Auto-Renewal Processor
 * 
 * This job runs periodically to automatically renew expired memberships
 * for users who are eligible and within the auto-renewal window.
 * 
 * Invocation:
 * - Via cron job or scheduled task
 * - Via Next.js API route handler at /api/cron/membership-auto-renewal
 * - Manual trigger via admin endpoint
 */

import { prisma } from "@/lib/prisma";
import {
  getAutoRenewalCandidates,
  processAutoRenewal,
} from "@/server/services/membershipAutoRenewal.service";
import { randomUUID } from "crypto";

interface AutoRenewalJobOptions {
  dryRun?: boolean;
  limit?: number;
  onlyProcessUsersBeforeExpiry?: boolean;
  skipFailedUsers?: string[];
}

interface AutoRenewalJobResult {
  success: boolean;
  startedAt: Date;
  completedAt: Date;
  totalCandidates: number;
  processed: number;
  failed: number;
  skipped: number;
  errors: Array<{
    userId: string;
    userEmail?: string;
    error: string;
  }>;
  summary: string;
}

/**
 * Main auto-renewal job processor
 * Processes expired memberships and automatically renews them
 */
export async function runMembershipAutoRenewalJob(
  options?: AutoRenewalJobOptions
): Promise<AutoRenewalJobResult> {
  const startedAt = new Date();
  const dryRun = options?.dryRun ?? false;
  const limit = options?.limit ?? 500;
  const skipFailedUsers = options?.skipFailedUsers ?? [];

  console.log(
    `[AUTO-RENEWAL JOB] Starting${dryRun ? " (DRY RUN)" : ""}... Limit: ${limit}`
  );

  let processed = 0;
  let failed = 0;
  let skipped = 0;
  const errors: Array<{ userId: string; userEmail?: string; error: string }> =
    [];

  try {
    // 1. Get auto-renewal candidates
    const candidates = await getAutoRenewalCandidates(prisma, limit);
    const totalCandidates = candidates.length;

    console.log(`[AUTO-RENEWAL JOB] Found ${totalCandidates} candidates`);

    if (totalCandidates === 0) {
      return {
        success: true,
        startedAt,
        completedAt: new Date(),
        totalCandidates: 0,
        processed: 0,
        failed: 0,
        skipped: 0,
        errors: [],
        summary: "No auto-renewal candidates found",
      };
    }

    // 2. Process each candidate
    for (const candidate of candidates) {
      try {
        // Skip if in skip list (e.g., previously failed in this run)
        if (skipFailedUsers.includes(candidate.id)) {
          skipped++;
          console.log(
            `[AUTO-RENEWAL JOB] Skipping user ${candidate.id} (${candidate.email}) - in skip list`
          );
          continue;
        }

        console.log(
          `[AUTO-RENEWAL JOB] Processing user ${candidate.id} (${candidate.email}) - expired ${candidate.daysExpired} days ago`
        );

        if (dryRun) {
          // Dry run: just log what would happen
          console.log(
            `[AUTO-RENEWAL JOB] [DRY RUN] Would renew user ${candidate.id}`
          );
          processed++;
        } else {
          // Real run: process the auto-renewal
          const result = await processAutoRenewal(prisma, candidate.id);

          if (result.success) {
            processed++;
            console.log(
              `[AUTO-RENEWAL JOB] ✓ Auto-renewal successful for user ${candidate.id}`
            );

            // Log the auto-renewal
            try {
              await prisma.auditLog.create({
                data: {
                  id: randomUUID(),
                  userId: "SYSTEM",
                  action: "AUTO_RENEWAL_BACKGROUND_JOB",
                  entity: "USER",
                  entityId: candidate.id,
                  metadata: {
                    renewalHistoryId: result.renewalHistoryId,
                    newExpiresAt: result.newExpiresAt,
                    totalRewardsDistributed: result.totalRewardsDistributed,
                    daysExpired: candidate.daysExpired,
                  },
                  ipAddress: "BACKGROUND_JOB",
                  userAgent: "AUTO_RENEWAL_PROCESSOR",
                },
              });
            } catch (logErr) {
              console.error(
                `[AUTO-RENEWAL JOB] Failed to log audit for user ${candidate.id}:`,
                logErr
              );
            }
          } else {
            failed++;
            const errorMsg = result.error || "Unknown error";
            errors.push({
              userId: candidate.id,
                userEmail: candidate.email ?? undefined,
              error: errorMsg,
            });
            console.error(
              `[AUTO-RENEWAL JOB] ✗ Auto-renewal failed for user ${candidate.id}: ${errorMsg}`
            );
          }
        }
      } catch (err) {
        failed++;
        const errorMsg = err instanceof Error ? err.message : String(err);
        errors.push({
          userId: candidate.id,
          userEmail: candidate.email ?? undefined,
          error: errorMsg,
        });
        console.error(
          `[AUTO-RENEWAL JOB] Exception processing user ${candidate.id}:`,
          err
        );
      }
    }

    const completedAt = new Date();
    const duration = (completedAt.getTime() - startedAt.getTime()) / 1000;

    console.log(`[AUTO-RENEWAL JOB] Completed in ${duration}s`);
    console.log(
      `[AUTO-RENEWAL JOB] Summary: ${processed} processed, ${failed} failed, ${skipped} skipped out of ${totalCandidates} candidates`
    );

    // 3. Log job summary to database
    try {
      await prisma.auditLog.create({
        data: {
          id: randomUUID(),
          userId: "SYSTEM",
          action: "AUTO_RENEWAL_JOB_SUMMARY",
          entity: "SYSTEM",
          entityId: "AUTO_RENEWAL_JOB",
          metadata: {
            startedAt,
            completedAt,
            durationSeconds: duration,
            dryRun,
            limit,
            totalCandidates,
            processed,
            failed,
            skipped,
            errorCount: errors.length,
            errors: errors.slice(0, 100), // Keep first 100 errors
          },
          ipAddress: "BACKGROUND_JOB",
          userAgent: "AUTO_RENEWAL_PROCESSOR",
        },
      });
    } catch (logErr) {
      console.error("[AUTO-RENEWAL JOB] Failed to log job summary:", logErr);
    }

    return {
      success: true,
      startedAt,
      completedAt,
      totalCandidates,
      processed,
      failed,
      skipped,
      errors,
      summary: `Auto-renewal job ${dryRun ? "(dry run) " : ""}completed: ${processed} renewed, ${failed} failed, ${skipped} skipped`,
    };
  } catch (err) {
    console.error("[AUTO-RENEWAL JOB] Fatal error:", err);

    return {
      success: false,
      startedAt,
      completedAt: new Date(),
      totalCandidates: 0,
      processed,
      failed: failed + 1,
      skipped,
      errors: [
        {
          userId: "SYSTEM",
          error: err instanceof Error ? err.message : "Unknown error",
        },
      ],
      summary: `Auto-renewal job failed: ${err instanceof Error ? err.message : "Unknown error"}`,
    };
  }
}

/**
 * Scheduled cron job handler
 * Call this from a cron service or Next.js /api/cron endpoint
 */
export async function membershipAutoRenewalCronHandler() {
  console.log(
    "[AUTO-RENEWAL CRON] Membership auto-renewal cron handler invoked"
  );

  // Run the job with appropriate defaults
  const result = await runMembershipAutoRenewalJob({
    dryRun: false,
    limit: 500,
  });

  return result;
}
