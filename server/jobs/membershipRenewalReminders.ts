/**
 * Membership renewal reminders.
 *
 * Corporate decision (follow-up 17, 06/10/2026): members are reminded 7 days,
 * 3 days and 24 hours before their membership renews, in-app and by email.
 * Runs daily (server/cron-server.ts, before the auto-renewal job). Each
 * reminder is sent once per member, expiry date and stage.
 */

import { randomUUID } from "crypto";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/email";
import { sendNotification } from "@/server/services/notification.service";
import { getRenewalPackage } from "@/server/services/membershipAutoRenewal.service";

export const RENEWAL_REMINDER_DAYS = [7, 3, 1] as const;

const DAY_MS = 24 * 60 * 60 * 1000;
const REMINDER_ACTION = "MEMBERSHIP_RENEWAL_REMINDER";

/** Which reminder stage (7, 3 or 1 days) is due for an expiry date, if any. */
export function dueReminderStage(expiresAt: Date, now: Date = new Date()): number | null {
  const daysLeft = Math.ceil((expiresAt.getTime() - now.getTime()) / DAY_MS);
  return (RENEWAL_REMINDER_DAYS as readonly number[]).includes(daysLeft) ? daysLeft : null;
}

function reminderKey(userId: string, expiresAt: Date, stage: number) {
  return `${userId}:${expiresAt.toISOString().slice(0, 10)}:${stage}d`;
}

const naira = (n: number) => `₦${Math.ceil(n).toLocaleString()}`;

export async function runMembershipRenewalReminders(now: Date = new Date()) {
  const maxDays = Math.max(...RENEWAL_REMINDER_DAYS);
  const users = await prisma.user.findMany({
    where: {
      activeMembershipPackageId: { not: null },
      membershipExpiresAt: { gt: now, lte: new Date(now.getTime() + maxDays * DAY_MS) },
    },
    select: { id: true, name: true, email: true, wallet: true, membershipExpiresAt: true },
    take: 5000,
  });

  let sent = 0;
  let skipped = 0;
  let failed = 0;

  for (const user of users) {
    const expiresAt = user.membershipExpiresAt!;
    const stage = dueReminderStage(expiresAt, now);
    if (!stage) continue;

    const key = reminderKey(user.id, expiresAt, stage);
    const already = await prisma.auditLog.findFirst({ where: { action: REMINDER_ACTION, entityId: key }, select: { id: true } });
    if (already) {
      skipped++;
      continue;
    }

    try {
      const renewal = await getRenewalPackage(prisma, user.id);
      const when = stage === 1 ? "in 24 hours" : `in ${stage} days`;
      const dateText = expiresAt.toLocaleDateString("en-NG", { day: "numeric", month: "long", year: "numeric" });
      const fundsNote =
        user.wallet >= renewal.totalCost
          ? "Your Main Wallet has enough to cover it."
          : `Please make sure your Main Wallet holds at least ${naira(renewal.totalCost)} so the renewal goes through.`;
      const message = `Your ${renewal.packageName} membership renews ${when} (${dateText}). The renewal fee is ${naira(renewal.totalCost)} including VAT and is paid automatically. ${fundsNote}`;

      await sendNotification({
        userId: user.id,
        type: "MEMBERSHIP_EXPIRING",
        title: stage === 1 ? "Membership renews tomorrow" : `Membership renews in ${stage} days`,
        message,
        actionUrl: "/membership",
      });

      if (user.email) {
        try {
          await sendEmail({
            to: user.email,
            subject: `Your BPI membership renews ${when}`,
            html: `<p>Hello ${user.name ?? "member"},</p><p>${message}</p><p>You can check your membership and wallet on your dashboard.</p>`,
          });
        } catch (err) {
          console.error(`[RENEWAL-REMINDER] Email failed for ${user.id}:`, err);
        }
      }

      await prisma.auditLog.create({
        data: {
          id: randomUUID(),
          userId: user.id,
          action: REMINDER_ACTION,
          entity: "User",
          entityId: key,
          metadata: { stage, expiresAt: expiresAt.toISOString(), totalCost: renewal.totalCost },
          status: "success",
        },
      });
      sent++;
    } catch (err) {
      failed++;
      console.error(`[RENEWAL-REMINDER] Failed for ${user.id}:`, err);
    }
  }

  return {
    success: true,
    checked: users.length,
    sent,
    skipped,
    failed,
    summary: `Renewal reminders: ${sent} sent, ${skipped} already sent, ${failed} failed (${users.length} members expiring within ${maxDays} days).`,
  };
}
