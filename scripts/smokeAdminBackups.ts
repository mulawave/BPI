import { appRouter } from "../server/trpc/router/_app";
import { prisma } from "../lib/prisma";

async function main() {
  // Ensure we use a real user id to satisfy FK constraints in AuditLog
  const anyAdmin = await prisma.user.findFirst({
    where: { OR: [{ role: "super_admin" }, { role: "admin" }] },
    select: { id: true, email: true, name: true, role: true },
  });
  const fallbackUser = await prisma.user.findFirst({ select: { id: true, email: true, name: true, role: true } });
  const actor = anyAdmin ?? fallbackUser;

  if (!actor) {
    throw new Error("No users found in database to act as session user.");
  }

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

  console.log("Listing backups before...");
  const before = await caller.admin.listBackups();
  console.log("Backups count:", before.length);

  console.log("Creating backup...");
  const created = await caller.admin.createBackup();
  console.log("Created:", created.filename, created.counts);

  console.log("Listing backups after...");
  const after = await caller.admin.listBackups();
  console.log("Backups count:", after.length);

  const justCreated = after.find((b: any) => b.filename === created.filename);
  if (!justCreated) {
    console.error("ERROR: Newly created backup not found in list.");
    process.exit(1);
  } else {
    console.log("Found created backup in list:", justCreated.filename, justCreated.size, justCreated.createdAt);
  }

  // Optional cleanup: delete the created backup
  console.log("Deleting created backup...");
  await caller.admin.deleteBackup({ filename: created.filename });
  const finalList = await caller.admin.listBackups();
  const stillThere = finalList.some((b: any) => b.filename === created.filename);
  console.log("Deleted:", !stillThere);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
