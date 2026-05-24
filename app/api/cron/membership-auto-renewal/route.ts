import { NextRequest, NextResponse } from "next/server";
import { membershipAutoRenewalCronHandler } from "@/server/jobs/membershipAutoRenewalJob";

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
 * Query Parameters:
 * - authorizedKey: Secret key for authorization (optional, can be env var AUTH_CRON_SECRET)
 * 
 * Returns: AutoRenewalJobResult with processing statistics
 */
export async function POST(request: NextRequest) {
  try {
    // Verify authorization
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.AUTH_CRON_SECRET || process.env.CRON_SECRET;
    
    // Allow Vercel's automatic cron calls and authorized requests
    const isVercelCron = request.headers.get("user-agent")?.includes("vercel-cron");
    const isAuthorized =
      isVercelCron ||
      (cronSecret &&
        authHeader &&
        (authHeader === `Bearer ${cronSecret}` ||
          authHeader === cronSecret));

    if (!isAuthorized && cronSecret) {
      console.warn("[AUTO-RENEWAL CRON] Unauthorized request attempt");
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
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
        authorization: "Bearer {AUTH_CRON_SECRET}",
      },
    },
    { status: 200 }
  );
}
