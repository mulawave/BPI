/**
 * Cron endpoint: Recover Stuck Payments
 *
 * Thin HTTP wrapper around server/jobs/recoverStuckPayments.ts. The job is
 * scheduled by server/cron-server.ts; this route lets an external scheduler
 * (or an operator) trigger it on demand.
 *
 * Security: Requires `Authorization: Bearer <CRON_SECRET>` header.
 */

import { NextRequest, NextResponse } from "next/server";
import { verifyCronAuth } from "@/lib/cron";
import { runRecoverStuckPayments } from "@/server/jobs/recoverStuckPayments";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  return handleCron(req);
}

export async function GET(req: NextRequest) {
  return handleCron(req);
}

async function handleCron(req: NextRequest) {
  const authError = verifyCronAuth(req);
  if (authError) return authError;

  try {
    return NextResponse.json(await runRecoverStuckPayments());
  } catch (error) {
    return NextResponse.json(
      { error: "Recovery cron failed", details: error instanceof Error ? error.message : "Unknown" },
      { status: 500 },
    );
  }
}
