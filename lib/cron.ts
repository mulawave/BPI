/**
 * Shared cron-route utilities.
 *
 * Every `/api/cron/*` route needs the same CRON_SECRET verification.
 * This module centralises that logic so individual routes only contain
 * their business logic.
 */

import { NextRequest, NextResponse } from "next/server";

const CRON_SECRET = process.env.CRON_SECRET;

/**
 * Verify the incoming request carries a valid CRON_SECRET.
 *
 * Accepts the secret as:
 *  - `Authorization: Bearer <secret>` header, **or**
 *  - `?secret=<secret>` query parameter.
 *
 * @returns `null` when authorised, or a ready-to-return error `NextResponse`.
 */
export function verifyCronAuth(req: NextRequest): NextResponse | null {
  if (!CRON_SECRET) {
    return NextResponse.json(
      { error: "CRON_SECRET is not configured" },
      { status: 503 },
    );
  }

  const authHeader = req.headers.get("authorization");
  const querySecret = req.nextUrl.searchParams.get("secret");
  const isAuthorized =
    (authHeader && authHeader === `Bearer ${CRON_SECRET}`) ||
    (querySecret && querySecret === CRON_SECRET);

  if (!isAuthorized) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return null;
}
