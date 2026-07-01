/**
 * Cron endpoint: CSP Auto-Contribute Sweep
 *
 * Runs auto-contribute for all enabled users whose community wallet can fund at
 * least one contribution. Makes auto-contribute recurring instead of one-shot.
 *
 * Run on a short interval via external scheduler.
 *
 * Security: Requires `Authorization: Bearer <CRON_SECRET>` header.
 *
 * Vercel cron.json example:
 *   { "crons": [{ "path": "/api/cron/csp-auto-contribute", "schedule": "every 15 minutes" }] }
 */

import { NextRequest, NextResponse } from "next/server";
import { verifyCronAuth } from "@/lib/cron";
import { runCspAutoContributeSweep } from "@/server/jobs/cspAutoContributeSweep";

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
    const result = await runCspAutoContributeSweep();

    return NextResponse.json({
      ok: true,
      triggeredAt: new Date().toISOString(),
      schedule: "*/15 * * * *",
      mode: "CSP_AUTO_CONTRIBUTE_SWEEP",
      result,
    });
  } catch (error: any) {
    console.error("[CRON][CSP-AUTO-CONTRIBUTE] Error:", error);

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
