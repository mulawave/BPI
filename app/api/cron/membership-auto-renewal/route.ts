import { NextRequest, NextResponse } from "next/server";
import { membershipAutoRenewalCronHandler } from "@/server/jobs/membershipAutoRenewalJob";
import { verifyCronAuth } from "@/lib/cron";

/**
 * Membership Auto-Renewal Cron Handler
 * 
 * Triggered via:
 * - Vercel Cron (by setting up in vercel.json or environment)
 * - External cron service (e.g., AWS EventBridge, cron-job.org)
 * - Manual API call (POST)
 * 
 * This endpoint automatically processes expired memberships that are
 * within the auto-renewal window (0-30 days after expiration).
 * 
 * Security: requires `Authorization: Bearer <CRON_SECRET>`.
 * 
 * Returns: AutoRenewalJobResult with processing statistics
 */
export async function POST(request: NextRequest) {
  try {
    // Verify authorization (CRON_SECRET required; no user-agent bypass).
    const authError = verifyCronAuth(request);
    if (authError) {
      console.warn("[AUTO-RENEWAL CRON] Unauthorized request attempt");
      return authError;
    }

    // Log job start
    console.log("[AUTO-RENEWAL CRON API] Job triggered via API");

    // Run the auto-renewal job
    const result = await membershipAutoRenewalCronHandler();

    // Return result
    return NextResponse.json(result, {
      status: result.success ? 200 : 500,
    });
  } catch (error) {
    console.error("[AUTO-RENEWAL CRON API] Fatal error:", error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

/**
 * GET handler for health checks
 */
export async function GET() {
  return NextResponse.json(
    {
      status: "ok",
      message: "Membership auto-renewal cron endpoint is running",
      endpoints: {
        trigger: "POST /api/cron/membership-auto-renewal",
        authorization: "Bearer {CRON_SECRET}",
      },
    },
    { status: 200 }
  );
}
