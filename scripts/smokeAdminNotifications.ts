/*
  Admin Notifications runtime smoke:
  - Calls initializeNotificationSettings + getNotificationSettings

  Usage:
    npm run smoke:notifications
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
  const admin = await ensureSuperAdmin("admin+smoke-notifications@example.com");
  const session = createSessionForUser(admin.id, "super_admin");
  const caller = adminRouter.createCaller({ session, prisma } as any);

  const initialized = await caller.initializeNotificationSettings();
  const settings = await caller.getNotificationSettings();

  console.log("Initialized settings:", initialized.length);
  console.log("Current settings:", settings.length);

  if (settings.length === 0) throw new Error("No notification settings found after init");

  // Optional: no-op update to ensure mutation path works
  const first = settings[0];
  await caller.updateNotificationSetting({ id: first.id, enabled: first.enabled });

  console.log("UpdateNotificationSetting ok for:", first.notificationType);
}

main()
  .catch((e) => {
    console.error("smokeAdminNotifications failed:", e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
