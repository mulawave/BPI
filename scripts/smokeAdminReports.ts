import { appRouter } from "../server/trpc/router/_app";
import { prisma } from "../lib/prisma";

async function main() {
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

  console.log("Exporting Users CSV...");
  const usersCsv = await caller.admin.exportUsersToCSV({ filters: {} as any });
  console.log("Users count:", usersCsv.count, "filename:", usersCsv.filename, "length:", usersCsv.data.length);

  console.log("Exporting Payments CSV...");
  const paymentsCsv = await caller.admin.exportPaymentsToCSV({ filters: {} as any });
  console.log("Payments count:", paymentsCsv.count, "filename:", paymentsCsv.filename, "length:", paymentsCsv.data.length);

  console.log("Exporting Packages CSV...");
  const packagesCsv = await caller.admin.exportPackagesToCSV();
  console.log("Packages count:", packagesCsv.count, "filename:", packagesCsv.filename, "length:", packagesCsv.data.length);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
