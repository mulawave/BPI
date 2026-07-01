/**
 * CSP Auto-Contribute Sweep
 *
 * Recurring job that autonomously runs auto-contribute for every user who has
 * it enabled and whose community wallet has enough balance for at least one
 * contribution. This is what makes auto-contribute operate "within certain
 * intervals" instead of only firing once on an event (enable / deposit /
 * membership activation).
 *
 * Each individual contribution is executed by `runCspAutoContribute`, which
 * writes the CspContribution, transaction, and CspAutoContributeLog records —
 * so the sweep inherits full per-contribution reporting for free.
 *
 * Wired into:
 *  - server/cron-server.ts (node-cron, runs under the `bpi-cron` PM2 process)
 *  - app/api/cron/csp-auto-contribute/route.ts (external scheduler / Vercel cron)
 */

import { prisma } from "@/lib/prisma";
import { runCspAutoContribute } from "@/server/services/cspAutoContribute.service";

export type AutoContributeSweepResult = {
  success: boolean;
  startedAt: string;
  completedAt: string;
  globalDisabled: boolean;
  eligibleUsers: number;
  usersProcessed: number;
  usersSkippedLowBalance: number;
  totalContributed: number;
  totalContributions: number;
  failed: number;
  summary: string;
};

export async function runCspAutoContributeSweep(): Promise<AutoContributeSweepResult> {
  const startedAt = new Date().toISOString();

  const globalDisable = await prisma.adminSettings.findUnique({
    where: { settingKey: "csp_auto_contribute_disabled" },
  });

  if (globalDisable?.settingValue === "true") {
    return {
      success: true,
      startedAt,
      completedAt: new Date().toISOString(),
      globalDisabled: true,
      eligibleUsers: 0,
      usersProcessed: 0,
      usersSkippedLowBalance: 0,
      totalContributed: 0,
      totalContributions: 0,
      failed: 0,
      summary: "Auto-contribute is globally disabled; sweep skipped.",
    };
  }

  const settings = await prisma.cspAutoContributeSetting.findMany({
    where: { isEnabled: true },
    select: {
      userId: true,
      minAmountPerRequest: true,
      User: { select: { community: true } },
    },
  });

  let usersProcessed = 0;
  let usersSkippedLowBalance = 0;
  let totalContributed = 0;
  let totalContributions = 0;
  let failed = 0;

  for (const setting of settings) {
    const balance = setting.User?.community ?? 0;
    if (balance < setting.minAmountPerRequest) {
      usersSkippedLowBalance++;
      continue;
    }

    try {
      const result = await runCspAutoContribute({ prisma, userId: setting.userId });
      usersProcessed++;
      totalContributed += result.totalContributed;
      totalContributions += result.requestsContributed;
    } catch (err) {
      failed++;
      console.error(`[CSP_AUTO_CONTRIBUTE_SWEEP] Failed for user ${setting.userId}:`, err);
    }
  }

  return {
    success: true,
    startedAt,
    completedAt: new Date().toISOString(),
    globalDisabled: false,
    eligibleUsers: settings.length,
    usersProcessed,
    usersSkippedLowBalance,
    totalContributed,
    totalContributions,
    failed,
    summary: `Swept ${settings.length} enabled users: ${usersProcessed} processed, ${totalContributions} contributions totalling ₦${totalContributed.toLocaleString()}, ${usersSkippedLowBalance} skipped (low balance), ${failed} failed.`,
  };
}
