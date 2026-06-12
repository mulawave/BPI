/**
 * Cron endpoint: Mark missed Elite Club contributions and apply credibility penalty.
 *
 * Run daily (ideally at end-of-month or after the configured deadline day).
 * For every ACTIVE member who has no PAID contribution for the current month,
 * this upserts a MISSED contribution record and decrements their credibility score.
 *
 * Security: Requires `Authorization: Bearer <CRON_SECRET>` header.
 *
 * Vercel cron.json example:
 *   { "crons": [{ "path": "/api/cron/elite-club-deadline", "schedule": "0 2 * * *" }] }
 */

import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { prisma } from "@/lib/prisma";
import { sendNotification } from "@/server/services/notification.service";
import { verifyCronAuth } from "@/lib/cron";

export async function POST(req: NextRequest) {
  return handleCron(req);
}

export async function GET(req: NextRequest) {
  return handleCron(req);
}

async function handleCron(req: NextRequest) {
  const authError = verifyCronAuth(req);
  if (authError) return authError;

  const now = new Date();
  const month = now.getMonth() + 1; // 1-based
  const year = now.getFullYear();

  // Read CMS settings
  const [deadlineDayRow, missDeltaRow] = await Promise.all([
    prisma.adminSettings.findUnique({ where: { settingKey: "elite_contribution_deadline_day" } }),
    prisma.adminSettings.findUnique({ where: { settingKey: "elite_credibility_delta_missed" } }),
  ]);

  const deadlineDay = parseInt(deadlineDayRow?.settingValue ?? "15", 10);
  const missDelta = parseFloat(missDeltaRow?.settingValue ?? "0.3");

  // Only run if today is past the deadline day of the current month
  if (now.getDate() <= deadlineDay) {
    return NextResponse.json({
      skipped: true,
      reason: `Deadline day is ${deadlineDay}; today is ${now.getDate()}. Not yet past deadline.`,
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

  let marked = 0;
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

      // Get expected monthly contribution amount from CMS (tier-based)
      const tierKey = `elite_club_${member.club.tier.toLowerCase()}_monthly`;
      const tierRow = await prisma.adminSettings.findUnique({ where: { settingKey: tierKey } });
      const totalAmount = parseFloat(tierRow?.settingValue ?? "0");

      await prisma.$transaction(async (tx) => {
        // Upsert MISSED contribution if it doesn't already exist as MISSED
        if (!existing) {
          await tx.eliteClubContribution.create({
            data: {
              id: randomUUID(),
              memberId: member.id,
              clubId: member.clubId,
              userId: member.userId,
              month,
              year,
              totalAmount,
              empowermentShare: 0,
              investmentShare: 0,
              status: "MISSED",
              createdAt: new Date(),
              updatedAt: new Date(),
            },
          });
        } else {
          // Update existing PENDING to MISSED
          await tx.eliteClubContribution.update({
            where: { memberId_month_year: { memberId: member.id, month, year } },
            data: { status: "MISSED", updatedAt: new Date() },
          });
        }

        // Apply credibility penalty
        const currentMember = await tx.eliteClubMember.findUnique({ where: { id: member.id } });
        if (!currentMember) return;
        const scoreBefore = Number(currentMember.credibilityScore);
        const scoreAfter = Math.min(10, Math.max(0, scoreBefore - missDelta));
        await tx.eliteClubMember.update({
          where: { id: member.id },
          data: { credibilityScore: scoreAfter },
        });
        await tx.eliteClubCredibilityEvent.create({
          data: {
            id: randomUUID(),
            memberId: member.id,
            event: "CONTRIBUTION_MISSED",
            delta: -missDelta,
            scoreBefore,
            scoreAfter,
            reason: `Missed contribution for ${month}/${year}`,
          },
        });
      });

      marked++;

      // Notify member of missed contribution
      await sendNotification({
        userId: member.userId,
        type: "ELITE_CLUB_CONTRIBUTION_MISSED" as any,
        title: "Elite Club Contribution Missed",
        message: `Your Elite Club contribution for ${month}/${year} has been marked as missed. This may affect your credibility score and empowerment payout eligibility.`,
        actionUrl: "/elite-club",
      });
    } catch (err: any) {
      errors.push(`Member ${member.id}: ${err?.message ?? "Unknown error"}`);
    }
  }

  return NextResponse.json({
    success: true,
    period: `${month}/${year}`,
    deadlineDay,
    processed: activeMembers.length,
    marked,
    alreadyPaid,
    errors: errors.length > 0 ? errors : undefined,
  });
}
