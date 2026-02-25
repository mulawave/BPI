/*
  Admin Dashboard runtime smoke:
  - Calls dashboard endpoints to ensure no runtime errors

  Usage:
    npm run smoke:admin-dashboard
*/

import { prisma } from "@/lib/prisma";
import { adminRouter } from "@/server/trpc/router/admin";
import { randomUUID } from "crypto";

function createSessionForUser(userId: string, role: "super_admin" | "admin") {
  return {
    user: { id: userId, role } as any,
    expires: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
  } as any;
}

async function ensureSuperAdmin(email: string) {
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return await prisma.user.update({
      where: { id: existing.id },
      data: { role: "super_admin", activated: true },
      select: { id: true },
    });
  }

  return await prisma.user.create({
    data: {
      id: randomUUID(),
      email,
      role: "super_admin",
      activated: true,
      name: "Smoke Super Admin",
    },
    select: { id: true },
  });
}

async function main() {
  const admin = await ensureSuperAdmin("admin+smoke-dashboard@example.com");
  const session = createSessionForUser(admin.id, "super_admin");
  const caller = adminRouter.createCaller({ session, prisma } as any);

  const stats = await caller.getDashboardStats();
  const alerts = await caller.getDashboardAlerts();
  const chart = await caller.getChartData({ period: "7d" });

  console.log("Stats:", stats);
  console.log("Alerts:", alerts.length);
  console.log("Chart points:", {
    userGrowth: chart.userGrowth.length,
    revenue: chart.revenue.length,
  });
}

main()
  .catch((e) => {
    console.error("smokeAdminDashboard failed:", e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
