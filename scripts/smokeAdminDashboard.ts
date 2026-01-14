import { appRouter } from "../server/trpc/router/_app";
import { prisma } from "../lib/prisma";

async function main() {
  // Create a fake admin session context
  const adminUser = await prisma.user.findFirst({ where: { role: { in: ["admin", "super_admin"] } } });
  if (!adminUser) {
    console.log("No admin user found; creating a temporary admin for smoke test...");
    const temp = await prisma.user.create({
      data: {
        id: `admin-smoke-${Date.now()}`,
        email: `admin.smoke.${Date.now()}@example.com`,
        name: "Admin Smoke",
        role: "admin",
        activated: true,
        createdAt: new Date(),
      },
    });
    console.log("Created:", temp.email);
  }
  const user = adminUser || await prisma.user.findFirst({ where: { role: "admin" } });

  const ctx = {
    session: {
      user: { id: user!.id, email: user!.email!, name: user!.name || "Admin", role: "admin" },
      expires: new Date(Date.now() + 60_000).toISOString(),
    } as any,
    prisma,
  } as any;

  const caller = appRouter.createCaller(ctx);

  const stats = await caller.admin.getDashboardStats();
  console.log("Admin Dashboard Stats:");
  console.table({
    totalUsers: stats.totalUsers,
    pendingPayments: stats.pendingPayments,
    totalRevenue: stats.totalRevenue,
    activeMembers: stats.activeMembers,
  });

  process.exit(0);
}

main().catch((err) => {
  console.error("Smoke failed:", err);
  process.exit(1);
});
