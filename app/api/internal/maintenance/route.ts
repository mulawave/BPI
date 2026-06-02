import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// 30-second in-memory cache — shared across requests in the same Node.js process.
// Edge-safe: this runs as a standard Node.js API route, never on Edge runtime.
let cache: { enabled: boolean; until: string | null; ts: number } | null = null;
const CACHE_TTL = 30_000;

export async function GET() {
  const now = Date.now();
  if (cache && now - cache.ts < CACHE_TTL) {
    return NextResponse.json({ enabled: cache.enabled, until: cache.until });
  }

  try {
    const [modeRow, untilRow] = await Promise.all([
      prisma.adminSettings.findUnique({ where: { settingKey: "maintenance_mode" } }),
      prisma.adminSettings.findUnique({ where: { settingKey: "maintenance_until" } }),
    ]);

    const enabled = modeRow?.settingValue === "true";
    const until = untilRow?.settingValue ?? null;

    cache = { enabled, until, ts: now };
    return NextResponse.json({ enabled, until });
  } catch {
    // On DB error, fail open (don't lock out users on a DB blip)
    return NextResponse.json({ enabled: false, until: null });
  }
}

// Allow the middleware to invalidate the cache immediately after an admin toggle.
export async function POST() {
  cache = null;
  return NextResponse.json({ ok: true });
}
