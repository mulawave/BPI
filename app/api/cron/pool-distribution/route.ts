/**
 * Cron endpoint: Auto-distribute strategic pools that are past their nextDistributionAt date.
 *
 * Call this from an external scheduler (Vercel Cron Jobs, GitHub Actions, cron-job.org, etc.)
 * at least once per day.
 *
 * Security: Requires the `Authorization: Bearer <CRON_SECRET>` header.
 * Set CRON_SECRET in your .env / environment variables.
 *
 * Vercel cron.json example:
 *   { "crons": [{ "path": "/api/cron/pool-distribution", "schedule": "0 1 * * *" }] }
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const CRON_SECRET = process.env.CRON_SECRET;

export async function POST(req: NextRequest) {
  return handleCron(req);
}

export async function GET(req: NextRequest) {
  return handleCron(req);
}

async function handleCron(req: NextRequest) {
  // --- Auth ---
  if (CRON_SECRET) {
    const authHeader = req.headers.get("authorization");
    if (!authHeader || authHeader !== `Bearer ${CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const now = new Date();

  // Find all active pools with a past-due nextDistributionAt and non-manual frequency
  // Cast to any because nextDistributionAt / distributionFrequency are new schema fields
  const overduePools = await (prisma as any).strategyPool.findMany({
    where: {
      isActive: true,
      distributionFrequency: { not: "MANUAL" },
      nextDistributionAt: { lte: now },
    },
    include: {
      Members: {
        where: { isActive: true },
        include: {
          User: { select: { id: true, name: true, email: true } },
        },
      },
    },
  }) as any[];

  if (overduePools.length === 0) {
    return NextResponse.json({ ok: true, message: "No pools due for distribution", distributed: [] });
  }

  const results: { poolType: string; status: string; totalAmount?: number; memberCount?: number; error?: string }[] = [];

  for (const pool of overduePools) {
    try {
      if (pool.Members.length === 0) {
        results.push({ poolType: pool.type, status: "skipped", error: "No active members" });
        continue;
      }

      // Get pending allocations
      const pendingAllocations = await prisma.revenueAllocation.findMany({
        where: {
          destinationId: pool.id,
          destinationType: "STRATEGY_POOL",
          status: "PENDING",
        },
      });

      const totalAmount = pendingAllocations.reduce(
        (sum: number, a: any) => sum + Number(a.amount),
        0
      );

      if (totalAmount <= 0) {
        results.push({ poolType: pool.type, status: "skipped", error: "No funds available" });
        // Still advance nextDistributionAt so we don't retry every day with 0 balance
        await advanceNextDistribution(pool);
        continue;
      }

      // Filter out SUSPENDED investors
      const eligibleMembers =
        pool.type === "INVESTORS"
          ? pool.Members.filter((m: any) => m.qualificationStatus !== "SUSPENDED")
          : pool.Members;

      if (eligibleMembers.length === 0) {
        results.push({ poolType: pool.type, status: "skipped", error: "No eligible members after filtering" });
        continue;
      }

      // Equal split (cron jobs always use equal split to avoid mis-processing custom percentages)
      const sharePerMember = totalAmount / eligibleMembers.length;

      await prisma.$transaction(async (tx: any) => {
        // Create distribution records
        for (const allocation of pendingAllocations) {
          await tx.poolDistribution.create({
            data: {
              allocationId: allocation.id,
              poolId: pool.id,
              totalAmount: Number(allocation.amount),
              memberCount: eligibleMembers.length,
              amountPerMember: sharePerMember,
              status: "COMPLETED",
              distributedAt: new Date(),
              distributedBy: null, // system-initiated
            },
          });
        }

        // Credit each eligible member
        for (const member of eligibleMembers) {
          await tx.user.update({
            where: { id: member.userId },
            data: { shareholder: { increment: sharePerMember } },
          });

          await tx.poolMember.updateMany({
            where: { poolId: pool.id, userId: member.userId, isActive: true },
            data: {
              totalEarned: { increment: sharePerMember },
              currentBalance: { increment: sharePerMember },
              lastDistributionAt: new Date(),
            },
          });
        }

        // Mark allocations distributed
        await tx.revenueAllocation.updateMany({
          where: { id: { in: pendingAllocations.map((a: any) => a.id) } },
          data: { status: "DISTRIBUTED", distributedAt: new Date() },
        });

        // Advance pool scheduling
        const nextAt = computeNextDistributionAt(pool.distributionFrequency as string, now);
        await (tx as any).strategyPool.update({
          where: { id: pool.id },
          data: {
            balance: { decrement: totalAmount },
            lastDistributedAt: now,
            nextDistributionAt: nextAt,
          },
        });

        // Beneficiary snapshot for STATE/DIRECTORS pools
        const snapshot =
          pool.type === "STATE" || pool.type === "DIRECTORS"
            ? pool.Members.map((m: any) => ({
                userId: m.userId,
                name: m.User?.name || "Unknown",
                email: m.User?.email || "Unknown",
                qualificationStatus: m.qualificationStatus ?? "ACTIVE",
              }))
            : undefined;

        // Audit log — use first admin user for system-initiated distributions
        const systemAdmin = await prisma.user.findFirst({
          where: { role: "admin" },
          select: { id: true },
        });

        if (systemAdmin) {
          await tx.poolAdminAction.create({
            data: {
              poolId: pool.id,
              adminId: systemAdmin.id,
              actionType: "POOL_DISTRIBUTED_AUTO",
              description: `[AUTO] Distributed ₦${totalAmount.toLocaleString()} to ${eligibleMembers.length} members via scheduled cron`,
              metadata: JSON.parse(
                JSON.stringify({
                  poolType: pool.type,
                  totalAmount,
                  memberCount: eligibleMembers.length,
                  sharePerMember,
                  ...(snapshot ? { beneficiarySnapshot: snapshot } : {}),
                  triggeredAt: new Date().toISOString(),
                })
              ),
            },
          });
        }
      });

      results.push({ poolType: pool.type, status: "distributed", totalAmount, memberCount: eligibleMembers.length });
    } catch (err: any) {
      results.push({ poolType: pool.type, status: "error", error: err?.message || "Unknown error" });
    }
  }

  return NextResponse.json({ ok: true, processedAt: now.toISOString(), distributed: results });
}

/**
 * Compute next distribution date from current time + frequency
 */
function computeNextDistributionAt(frequency: string, from: Date): Date {
  switch (frequency) {
    case "MONTHLY":
      return new Date(from.getFullYear(), from.getMonth() + 1, 1);
    case "QUARTERLY":
      return new Date(from.getFullYear(), from.getMonth() + 3, 1);
    case "BI_ANNUAL":
      return new Date(from.getFullYear(), from.getMonth() + 6, 1);
    case "ANNUAL":
      return new Date(from.getFullYear() + 1, 0, 1);
    default:
      return new Date(from.getFullYear(), from.getMonth() + 1, 1);
  }
}

/**
 * Advance nextDistributionAt without distributing (for 0-balance pools)
 */
async function advanceNextDistribution(pool: any) {
  const nextAt = computeNextDistributionAt(pool.distributionFrequency, new Date());
  await (prisma as any).strategyPool.update({
    where: { id: pool.id },
    data: { nextDistributionAt: nextAt },
  });
}
