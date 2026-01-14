import { appRouter } from "../server/trpc/router/_app";
import { prisma } from "../lib/prisma";

async function main() {
  // Ensure a valid session user for audit logs
  const anyAdmin = await prisma.user.findFirst({
    where: { OR: [{ role: "super_admin" }, { role: "admin" }] },
    select: { id: true, email: true, name: true, role: true },
  });
  const fallbackUser = await prisma.user.findFirst({ select: { id: true, email: true, name: true, role: true } });
  const actor = anyAdmin ?? fallbackUser;
  if (!actor) throw new Error("No users found to act as session user.");

  const ctx: any = {
    prisma,
    session: {
      user: {
        id: actor.id,
        email: actor.email ?? "admin@example.com",
        name: actor.name ?? "Smoke Admin",
        role: (actor as any).role ?? "super_admin",
      },
    },
  };

  const caller = appRouter.createCaller(ctx);

  console.log("Checking existing notification settings...");
  let list = await caller.admin.getNotificationSettings();
  console.log("Existing count:", list.length);

  if (list.length === 0) {
    console.log("Initializing defaults...");
    await caller.admin.initializeNotificationSettings();
    list = await caller.admin.getNotificationSettings();
    console.log("After init count:", list.length);
  }

  if (list.length === 0) {
    throw new Error("Notification settings still empty after initialization.");
  }

  // Pick first and toggle enabled flag
  const first = list[0];
  console.log("Toggling first setting", first.notificationType, "current:", first.enabled);
  const toggled = await caller.admin.updateNotificationSetting({ id: first.id, enabled: !first.enabled });
  console.log("Toggled ->", toggled.enabled);

  // Revert to original to keep smoke idempotent
  await caller.admin.updateNotificationSetting({ id: first.id, enabled: first.enabled });
  console.log("Reverted ->", first.enabled);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
