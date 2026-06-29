/**
 * Cron endpoint: CSP Broadcast Sweep
 *
 * Sweeps expired CSP broadcasts and either auto-extends them or closes them as
 * fulfilled, depending on the tier configuration.
 *
 * Run on a short interval via external scheduler.
 *
 * Security: Requires `Authorization: Bearer <CRON_SECRET>` header.
 *
 * Vercel cron.json example:
 *   { "crons": [{ "path": "/api/cron/csp-broadcast-sweep", "schedule": "every 10 minutes" }] }
 */

import { NextRequest, NextResponse } from "next/server";
import { verifyCronAuth } from "@/lib/cron";
import { runCspBroadcastSweep } from "@/server/jobs/cspBroadcastSweep";

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
    const result = await runCspBroadcastSweep();

    return NextResponse.json({
      ok: true,
      triggeredAt: new Date().toISOString(),
      schedule: "*/10 * * * *",
      mode: "CSP_BROADCAST_SWEEP",
      result,
    });
  } catch (error: any) {
    console.error("[CRON][CSP-BROADCAST-SWEEP] Error:", error);

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
