/*
  Admin Reports runtime smoke:
  - Calls CSV export endpoints to ensure they execute

  Usage:
    npm run smoke:reports
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
  const admin = await ensureSuperAdmin("admin+smoke-reports@example.com");
  const session = createSessionForUser(admin.id, "super_admin");
  const caller = adminRouter.createCaller({ session, prisma } as any);

  const users = await caller.exportUsersToCSV({});
  const payments = await caller.exportPaymentsToCSV({});
  const packages = await caller.exportPackagesToCSV();

  console.log("Users CSV:", users.filename, "rows:", users.count);
  console.log("Payments CSV:", payments.filename, "rows:", payments.count);
  console.log("Packages CSV:", packages.filename, "rows:", packages.count);

  // quick sanity: ensure content isn't empty header-only
  if (!users.data || users.data.split("\n").length < 1) throw new Error("Users CSV empty");
  if (!payments.data || payments.data.split("\n").length < 1) throw new Error("Payments CSV empty");
  if (!packages.data || packages.data.split("\n").length < 1) throw new Error("Packages CSV empty");
}

main()
  .catch((e) => {
    console.error("smokeAdminReports failed:", e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
