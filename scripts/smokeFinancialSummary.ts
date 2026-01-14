import { appRouter } from "../server/trpc/router/_app";
import { prisma } from "../lib/prisma";

async function main() {
  // Use any admin user; fall back to create a temp one
  let admin = await prisma.user.findFirst({ where: { role: { in: ["admin", "super_admin"] } } });
  if (!admin) {
    admin = await prisma.user.create({
      data: {
        id: `admin-finance-${Date.now()}`,
        email: `admin.finance.${Date.now()}@example.com`,
        name: "Admin Finance",
        role: "admin",
        activated: true,
      },
    });
  }

  const ctx = {
    session: {
      user: { id: admin!.id, email: admin!.email!, name: admin!.name || "Admin", role: "admin" },
      expires: new Date(Date.now() + 60_000).toISOString(),
    } as any,
    prisma,
  } as any;

  const caller = appRouter.createCaller(ctx);
  const summary = await caller.admin.getFinancialSummary({});
  console.log("Financial Summary (last 30 days):");
  console.log(JSON.stringify(summary, null, 2));
  process.exit(0);
}

main().catch((err)=>{ console.error(err); process.exit(1); });
