import { prisma } from "@/lib/prisma";
import { notifyCspBroadcastExtended, notifyCspBroadcastExpiring } from "@/server/services/notification.service";
import { ensureMemberStanding } from "@/server/services/csp-tier.service";
import { loadTierConfig } from "@/server/services/csp-config.service";

type TierConfig = {
  tierModelEnabled: boolean;
  autoExtensionHours: number;
  maxAutoExtensions: number;
  defaultCoolingMonthsMin: number;
};

// Re-export loadTierConfig from shared service for backward compatibility
export { loadTierConfig };

type BroadcastSweepCandidate = {
  id: string;
  userId: string;
  raisedAmount: number;
  thresholdAmount: number;
  minFulfilmentPct: number | null;
  autoExtendCount: number;
  broadcastExpiresAt: Date | null;
};

type BroadcastSweepDecision = {
  action: "extend" | "close";
  requiredFulfilment: number;
  canAutoExtend: boolean;
};

type BroadcastSweepResult = {
  success: boolean;
  enabled: boolean;
  startedAt: string;
  completedAt: string;
  inspected: number;
  extended: number;
  closed: number;
  skipped: number;
  failed: number;
  summary: string;
};

export function decideCspBroadcastSweepAction(input: {
  raisedAmount: number;
  thresholdAmount: number;
  minFulfilmentPct: number | null;
  autoExtendCount: number;
  maxAutoExtensions: number;
}): BroadcastSweepDecision {
  const requiredFulfilment = Math.ceil(((input.minFulfilmentPct ?? 0) / 100) * input.thresholdAmount);
  const canAutoExtend = input.autoExtendCount < input.maxAutoExtensions;
  const action = input.raisedAmount < requiredFulfilment && canAutoExtend ? "extend" : "close";

  return {
    action,
    requiredFulfilment,
    canAutoExtend,
  };
}

function addMonths(date: Date, months: number) {
  const next = new Date(date);
  next.setMonth(next.getMonth() + months);
  return next;
}

function addHours(date: Date, hours: number) {
  const next = new Date(date);
  next.setHours(next.getHours() + hours);
  return next;
}

export async function runCspBroadcastSweep(): Promise<BroadcastSweepResult> {
  const startedAt = new Date();
  const config = await loadTierConfig(prisma);

  if (!config.tierModelEnabled) {
    return {
      success: true,
      enabled: false,
      startedAt: startedAt.toISOString(),
      completedAt: new Date().toISOString(),
      inspected: 0,
      extended: 0,
      closed: 0,
      skipped: 0,
      failed: 0,
      summary: "Tier model disabled; broadcast sweep skipped",
    };
  }

  const candidates = await prisma.cspSupportRequest.findMany({
    where: {
      status: "broadcasting",
      isAdminDefault: false,
      broadcastExpiresAt: { lte: startedAt },
    },
    select: {
      id: true,
      userId: true,
      raisedAmount: true,
      thresholdAmount: true,
      minFulfilmentPct: true,
      autoExtendCount: true,
      broadcastExpiresAt: true,
    },
  });

  let extended = 0;
  let closed = 0;
  let skipped = 0;
  let failed = 0;

  for (const candidate of candidates as BroadcastSweepCandidate[]) {
    try {
      const outcome = await prisma.$transaction(async (tx) => {
        const current = await tx.cspSupportRequest.findUnique({
          where: { id: candidate.id },
          select: {
            id: true,
            userId: true,
            status: true,
            isAdminDefault: true,
            raisedAmount: true,
            thresholdAmount: true,
            minFulfilmentPct: true,
            autoExtendCount: true,
            broadcastExpiresAt: true,
          },
        });

        if (
          !current ||
          current.status !== "broadcasting" ||
          current.isAdminDefault ||
          !current.broadcastExpiresAt ||
          current.broadcastExpiresAt > startedAt
        ) {
          return { action: "skipped" as const };
        }

        const decision = decideCspBroadcastSweepAction({
          raisedAmount: current.raisedAmount,
          thresholdAmount: current.thresholdAmount,
          minFulfilmentPct: current.minFulfilmentPct,
          autoExtendCount: current.autoExtendCount,
          maxAutoExtensions: config.maxAutoExtensions,
        });

        if (decision.action === "extend") {
          const broadcastExpiresAt = addHours(current.broadcastExpiresAt, config.autoExtensionHours);

          await tx.cspBroadcastExtension.create({
            data: {
              requestId: current.id,
              type: "auto_fulfilment",
              value: decision.requiredFulfilment,
              hoursGranted: config.autoExtensionHours,
            },
          });

          await tx.cspSupportRequest.update({
            where: { id: current.id },
            data: {
              broadcastExpiresAt,
              autoExtendCount: { increment: 1 },
            },
          });

          return { action: "extended" as const };
        }

        const fulfilledAt = startedAt;
        const coolingEndsAt = addMonths(fulfilledAt, config.defaultCoolingMonthsMin);

        await ensureMemberStanding(tx, current.userId);

        await tx.cspSupportRequest.update({
          where: { id: current.id },
          data: {
            status: "closed",
            fulfilledAt,
          },
        });

        await tx.cspMemberStanding.update({
          where: { userId: current.userId },
          data: {
            lastSupportReleasedAt: fulfilledAt,
            coolingEndsAt,
            coolingMonthsBase: config.defaultCoolingMonthsMin,
          },
        });

        return { action: "closed" as const };
      });

      if (outcome.action === "extended") {
        extended++;
        await notifyCspBroadcastExtended(candidate.userId, config.autoExtensionHours);
      } else if (outcome.action === "closed") {
        closed++;
      } else {
        skipped++;
      }
    } catch (error) {
      failed++;
      console.error(
        `[CSP BROADCAST SWEEP] Failed for request ${candidate.id}:`,
        error instanceof Error ? error.message : error,
      );
    }
  }

  const completedAt = new Date();

  // B7: Countdown warning notifications — check broadcasts approaching expiry at 6h, 3h, 1h
  const warningHours = [6, 3, 1];
  const now = new Date();
  for (const warnHours of warningHours) {
    const windowStart = new Date(now.getTime() + (warnHours - 1) * 60 * 60 * 1000);
    const windowEnd = new Date(now.getTime() + warnHours * 60 * 60 * 1000);

    const approaching = await prisma.cspSupportRequest.findMany({
      where: {
        status: "broadcasting",
        isAdminDefault: false,
        broadcastExpiresAt: { gte: windowStart, lt: windowEnd },
      },
      select: { id: true, userId: true },
    });

    for (const req of approaching) {
      // Check if we already sent a notification for this warning window
      const existing = await prisma.notification.findFirst({
        where: {
          userId: req.userId,
          title: { contains: `${warnHours}h` },
          createdAt: { gte: new Date(now.getTime() - 2 * 60 * 60 * 1000) },
        },
        select: { id: true },
      });
      if (!existing) {
        await notifyCspBroadcastExpiring(req.userId, warnHours);
      }
    }
  }

  return {
    success: failed === 0,
    enabled: true,
    startedAt: startedAt.toISOString(),
    completedAt: completedAt.toISOString(),
    inspected: candidates.length,
    extended,
    closed,
    skipped,
    failed,
    summary: `Processed ${candidates.length} broadcast(s): ${extended} extended, ${closed} closed, ${skipped} skipped, ${failed} failed`,
  };
}
