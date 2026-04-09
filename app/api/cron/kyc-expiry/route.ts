/**
 * Cron endpoint: KYC Expiry Check
 *
 * Finds approved KYC submissions whose document expiry or KYC expiry date has passed,
 * marks them as expired, and notifies the user to revalidate.
 *
 * Run daily via external scheduler.
 *
 * Security: Requires `Authorization: Bearer <CRON_SECRET>` header.
 *
 * Vercel cron.json example:
 *   { "crons": [{ "path": "/api/cron/kyc-expiry", "schedule": "0 3 * * *" }] }
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";

const CRON_SECRET = process.env.CRON_SECRET;

export async function POST(req: NextRequest) {
  return handleCron(req);
}

export async function GET(req: NextRequest) {
  return handleCron(req);
}

async function handleCron(req: NextRequest) {
  if (!CRON_SECRET) {
    return NextResponse.json({ error: "CRON_SECRET is not configured" }, { status: 503 });
  }

  const authHeader = req.headers.get("authorization");
  if (!authHeader || authHeader !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();

  try {
    // Find approved submissions that are now expired (expiresAt or documentExpiryDate in the past)
    const expiredSubmissions = await prisma.kycSubmission.findMany({
      where: {
        status: "approved",
        OR: [
          { expiresAt: { lte: now } },
          { documentExpiryDate: { lte: now } },
        ],
      },
      select: { id: true, userId: true, legalFirstName: true, legalLastName: true },
    });

    if (expiredSubmissions.length === 0) {
      return NextResponse.json({ message: "No expired KYC submissions found", expired: 0 });
    }

    let expiredCount = 0;

    for (const sub of expiredSubmissions) {
      await prisma.$transaction([
        // Mark submission as expired
        prisma.kycSubmission.update({
          where: { id: sub.id },
          data: {
            status: "expired",
            expiryNotifiedAt: now,
          },
        }),
        // Reset user KYC status
        prisma.user.update({
          where: { id: sub.userId },
          data: { kyc: "expired", kycPending: 0 },
        }),
        // Audit log
        prisma.kycAuditLog.create({
          data: {
            submissionId: sub.id,
            action: "expired",
            performedBy: "system",
            performedByRole: "system",
            details: "KYC verification expired due to document/submission expiry date reached",
          },
        }),
        // Notify user
        prisma.notification.create({
          data: {
            id: crypto.randomUUID(),
            userId: sub.userId,
            title: "KYC Verification Expired",
            message:
              "Your identity verification has expired. Please resubmit your KYC documents to maintain full access to all features.",
          },
        }),
      ]);
      expiredCount++;
    }

    // Also find submissions approaching expiry (within 7 days) that haven't been notified yet
    const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const approachingExpiry = await prisma.kycSubmission.findMany({
      where: {
        status: "approved",
        expiryNotifiedAt: null,
        OR: [
          { expiresAt: { lte: sevenDaysFromNow, gt: now } },
          { documentExpiryDate: { lte: sevenDaysFromNow, gt: now } },
        ],
      },
      select: { id: true, userId: true, expiresAt: true, documentExpiryDate: true },
    });

    let notifiedCount = 0;

    for (const sub of approachingExpiry) {
      const expiryDate = sub.expiresAt || sub.documentExpiryDate;
      await prisma.$transaction([
        prisma.kycSubmission.update({
          where: { id: sub.id },
          data: { expiryNotifiedAt: now },
        }),
        prisma.notification.create({
          data: {
            id: crypto.randomUUID(),
            userId: sub.userId,
            title: "KYC Verification Expiring Soon",
            message: `Your identity verification will expire on ${expiryDate ? expiryDate.toLocaleDateString() : "soon"}. Please prepare to resubmit your documents.`,
          },
        }),
      ]);
      notifiedCount++;
    }

    return NextResponse.json({
      message: "KYC expiry check completed",
      expired: expiredCount,
      warningsIssued: notifiedCount,
    });
  } catch (error: any) {
    console.error("[KYC Expiry Cron] Error:", error);
    return NextResponse.json({ error: "Internal error", details: error.message }, { status: 500 });
  }
}
