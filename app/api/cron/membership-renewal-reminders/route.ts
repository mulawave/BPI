import { NextRequest, NextResponse } from "next/server";
import { runMembershipRenewalReminders } from "@/server/jobs/membershipRenewalReminders";
import { verifyCronAuth } from "@/lib/cron";

/**
 * Membership renewal reminders (7 days, 3 days and 24 hours before renewal).
 * Also scheduled daily by server/cron-server.ts.
 *
 * Security: requires `Authorization: Bearer <CRON_SECRET>`.
 */
export async function POST(request: NextRequest) {
  const authError = verifyCronAuth(request);
  if (authError) return authError;

  try {
    const result = await runMembershipRenewalReminders();
    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error("[RENEWAL-REMINDERS CRON API] Fatal error:", error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    );
  }
}
