/**
 * Cron endpoint: Executive Pool Weekly Payout
 *
 * Triggers the executive payout engine to distribute all pending EXECUTIVE_POOL
 * allocations to executive shareholder wallets.
 *
 * Run weekly via external scheduler.
 *
 * Security: Requires `Authorization: Bearer <CRON_SECRET>` header.
 *
 * Vercel cron.json example:
 *   { "crons": [{ "path": "/api/cron/executive-payout", "schedule": "0 8 * * 5" }] }
 */

import { NextRequest, NextResponse } from "next/server";
import { distributeExecutivePool } from "@/server/jobs/dailyRevenueDistribution";

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
  const querySecret = req.nextUrl.searchParams.get("secret");
  const isAuthorized =
    (authHeader && authHeader === `Bearer ${CRON_SECRET}`) ||
    (querySecret && querySecret === CRON_SECRET);

  if (!isAuthorized) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await distributeExecutivePool();

    return NextResponse.json({
      ok: true,
      triggeredAt: new Date().toISOString(),
      schedule: "0 8 * * 5",
      mode: "WEEKLY_FRIDAY_EXECUTIVE_PAYOUT",
      result,
    });
  } catch (error: any) {
    console.error("[CRON][EXECUTIVE-PAYOUT] Error:", error);

    return NextResponse.json(
      {
        ok: false,
        error: "Internal error",
        details: error?.message || "Unknown error",
        triggeredAt: new Date().toISOString(),
      },
      { status: 500 },
    );
  }
}
