/*
  Admin Activity runtime smoke:
  - Calls getRecentActivity + getAuditLogs

  Usage:
    npm run smoke:admin-activity
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
  const admin = await ensureSuperAdmin("admin+smoke-activity@example.com");
  const session = createSessionForUser(admin.id, "super_admin");
  const caller = adminRouter.createCaller({ session, prisma } as any);

  const recent = await caller.getRecentActivity({ limit: 10 });
  const audit = await caller.getAuditLogs({});

  console.log("Recent activity items:", recent.items.length);
  console.log("Audit logs:", audit.total, "page:", audit.page, "limit:", audit.limit);
}

main()
  .catch((e) => {
    console.error("smokeAdminActivity failed:", e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
