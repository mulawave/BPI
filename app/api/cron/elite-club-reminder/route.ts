/**
 * Cron endpoint: Send contribution due reminders to Elite Club members.
 *
 * Run daily (e.g., 3 days before the configured deadline day each month).
 * For every ACTIVE member in an ACTIVE club who has NOT yet paid for the
 * current month, this sends a reminder notification.
 *
 * Security: Requires `Authorization: Bearer <CRON_SECRET>` header.
 *
 * Vercel cron.json example:
 *   { "crons": [{ "path": "/api/cron/elite-club-reminder", "schedule": "0 9 * * *" }] }
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendNotification } from "@/server/services/notification.service";

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
  const month = now.getMonth() + 1; // 1-based
  const year = now.getFullYear();

  // Read deadline day from CMS
  const deadlineDayRow = await prisma.adminSettings.findUnique({
    where: { settingKey: "elite_contribution_deadline_day" },
  });
  const deadlineDay = parseInt(deadlineDayRow?.settingValue ?? "15", 10);

  // Only send reminder if we are within [deadline - 3, deadline - 1] days
  const daysUntilDeadline = deadlineDay - now.getDate();
  if (daysUntilDeadline < 1 || daysUntilDeadline > 3) {
    return NextResponse.json({
      skipped: true,
      reason: `Reminder window is 1–3 days before deadline. Today is day ${now.getDate()}, deadline is day ${deadlineDay} (${daysUntilDeadline} days away).`,
    });
  }

  // Fetch all ACTIVE members in ACTIVE clubs
  const activeMembers = await prisma.eliteClubMember.findMany({
    where: {
      status: "ACTIVE",
      club: { status: "ACTIVE" },
    },
    include: { club: true },
  });

  let reminded = 0;
  let alreadyPaid = 0;
  const errors: string[] = [];

  for (const member of activeMembers) {
    try {
      // Check for existing PAID contribution this period
      const existing = await prisma.eliteClubContribution.findUnique({
        where: { memberId_month_year: { memberId: member.id, month, year } },
      });

      if (existing && existing.status === "PAID") {
        alreadyPaid++;
        continue;
      }

      // Get expected amount from CMS
      const tierKey = `elite_club_${member.club.tier.toLowerCase()}_monthly`;
      const tierRow = await prisma.adminSettings.findUnique({ where: { settingKey: tierKey } });
      const totalAmount = parseFloat(tierRow?.settingValue ?? "0");

      await sendNotification({
        userId: member.userId,
        type: "ELITE_CLUB_CONTRIBUTION_REMINDER" as any,
        title: "Elite Club Contribution Due Soon",
        message: `Your Elite Club contribution of ₦${totalAmount.toLocaleString()} for ${month}/${year} is due in ${daysUntilDeadline} day${daysUntilDeadline === 1 ? "" : "s"} (by day ${deadlineDay}). Please ensure it is paid to maintain your credibility score.`,
        actionUrl: "/elite-club",
      });

      reminded++;
    } catch (err: any) {
      errors.push(`Member ${member.id}: ${err?.message ?? "Unknown error"}`);
    }
  }

  return NextResponse.json({
    success: true,
    period: `${month}/${year}`,
    deadlineDay,
    daysUntilDeadline,
    processed: activeMembers.length,
    reminded,
    alreadyPaid,
    errors: errors.length > 0 ? errors : undefined,
  });
}
