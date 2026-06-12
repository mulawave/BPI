import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authConfig } from "@/server/auth";
import { prisma } from "@/lib/prisma";
import {
  getCachedMaintenanceState,
  updateMaintenanceCache,
  invalidateMaintenanceCache,
} from "@/lib/maintenance";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  // Check shared in-memory cache first (also used by middleware)
  const cached = getCachedMaintenanceState();
  if (cached) {
    return NextResponse.json(
      { enabled: cached.enabled, until: cached.until },
      { headers: { "Cache-Control": "no-store, no-cache, must-revalidate" } },
    );
  }

  try {
    const [modeRow, untilRow] = await Promise.all([
      prisma.adminSettings.findUnique({ where: { settingKey: "maintenance_mode" } }),
      prisma.adminSettings.findUnique({ where: { settingKey: "maintenance_until" } }),
    ]);

    const enabled = modeRow?.settingValue === "true";
    const until = untilRow?.settingValue ?? null;

    // Update the shared global cache (accessible from middleware too)
    updateMaintenanceCache(enabled, until);

    return NextResponse.json(
      { enabled, until },
      { headers: { "Cache-Control": "no-store, no-cache, must-revalidate" } },
    );
  } catch {
    // On DB error, fail open (don't lock out users on a DB blip)
    return NextResponse.json(
      { enabled: false, until: null },
      { headers: { "Cache-Control": "no-store, no-cache, must-revalidate" } },
    );
  }
}

// Invalidate cache immediately after admin toggle + re-read from DB.
export async function POST() {
  const session = await getServerSession(authConfig);
  const role = (session?.user as any)?.role;
  if (!session?.user || (role !== "admin" && role !== "super_admin")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Invalidate immediately
  invalidateMaintenanceCache();

  // Re-read from DB and populate the fresh cache
  try {
    const [modeRow, untilRow] = await Promise.all([
      prisma.adminSettings.findUnique({ where: { settingKey: "maintenance_mode" } }),
      prisma.adminSettings.findUnique({ where: { settingKey: "maintenance_until" } }),
    ]);
    const enabled = modeRow?.settingValue === "true";
    const until = untilRow?.settingValue ?? null;
    updateMaintenanceCache(enabled, until);
  } catch {
    // Best-effort; cache remains invalidated so next read will re-fetch
  }

  return NextResponse.json(
    { ok: true },
    { headers: { "Cache-Control": "no-store, no-cache, must-revalidate" } },
  );
}
