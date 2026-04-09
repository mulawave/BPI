/*
  Financial Summary runtime smoke:
  - Calls getFinancialSummary + getFinancialTimeSeries

  Usage:
    npm run smoke:financial-summary
*/

if (process.env.NODE_ENV === "production") {
  console.error("❌ FATAL: smokeFinancialSummary must not run in production. Aborting.");
  process.exit(1);
}

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
  const admin = await ensureSuperAdmin("admin+smoke-financial@example.com");
  const session = createSessionForUser(admin.id, "super_admin");
  const caller = adminRouter.createCaller({ session, prisma } as any);

  const summary = await caller.getFinancialSummary({});
  const series = await caller.getFinancialTimeSeries({ granularity: "day" });

  console.log("Range:", summary.range);
  console.log("Inflows total:", summary.inflows.total);
  console.log("Outflows total:", summary.outflows.total);
  console.log("Series buckets:", series.points.length);
}

main()
  .catch((e) => {
    console.error("smokeFinancialSummary failed:", e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
