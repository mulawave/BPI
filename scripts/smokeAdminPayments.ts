import { appRouter } from "../server/trpc/router/_app";
import { prisma } from "../lib/prisma";

async function main() {
  // Resolve a real session user (admin if available) to satisfy protectedProcedure and audit logs
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

  console.log("Fetching pending payments...");
  const pending = await caller.admin.getPendingPayments({ page: 1, pageSize: 10, status: "pending" as any });
  console.log("Pending count:", pending.total);

  if (pending.total === 0 || !pending.payments?.length) {
    console.log("No pending payments available to review.");
    return;
  }

  const first = pending.payments[0];
  console.log("First pending:", { id: first.id, amount: first.amount, userId: first.userId, status: first.status, transactionType: first.transactionType });

  console.log("Reviewing (reject) for smoke test...");
  const updated = await caller.admin.reviewPayment({ paymentId: first.id, action: "reject", notes: "smoke test reject" });
  console.log("Updated status:", updated.status, "reviewedBy:", updated.reviewedBy);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
