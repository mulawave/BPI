/*
  Admin Backups runtime smoke:
  - Creates a mocked super_admin session
  - Calls listBackups -> createBackup -> deleteBackup

  Usage:
    npm run smoke:backups
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
      select: { id: true, email: true },
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
    select: { id: true, email: true },
  });
}

async function main() {
  const admin = await ensureSuperAdmin("admin+smoke-backups@example.com");
  const session = createSessionForUser(admin.id, "super_admin");
  const caller = adminRouter.createCaller({ session, prisma } as any);

  const before = await caller.listBackups();
  const created = await caller.createBackup();
  const after = await caller.listBackups();

  await caller.deleteBackup({ filename: created.filename });
  const finalList = await caller.listBackups();

  console.log("Backups before:", before.length);
  console.log("Created:", created.filename);
  console.log("Backups after create:", after.length);
  console.log("Backups after delete:", finalList.length);
}

main()
  .catch((e) => {
    console.error("smokeAdminBackups failed:", e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
