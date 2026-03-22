/*
  Admin Payments runtime smoke:
  - Ensures there is a pending payment (creates one if needed)
  - Calls getPendingPayments
  - Rejects the seeded payment via reviewPayment (to avoid wallet side-effects)

  Usage:
    npm run smoke:payments
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

async function ensureUser(email: string, role: "user" | "super_admin") {
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return await prisma.user.update({
      where: { id: existing.id },
      data: { role, activated: true },
      select: { id: true, email: true },
    });
  }

  return await prisma.user.create({
    data: {
      id: randomUUID(),
      email,
      role,
      activated: true,
      name: role === "super_admin" ? "Smoke Super Admin" : "Smoke User",
    },
    select: { id: true, email: true },
  });
}

async function ensurePendingPayment(userId: string) {
  const existingPending = await prisma.pendingPayment.findFirst({
    where: {
      userId,
      status: "pending",
      gatewayReference: { startsWith: "SMOKE-PAYMENT" },
    },
    orderBy: { createdAt: "desc" },
  });

  if (existingPending) return existingPending;

  const now = new Date();
  const gatewayReference = `SMOKE-PAYMENT-${now.toISOString().replace(/[:.]/g, "-")}`;

  const payment = await prisma.pendingPayment.create({
    data: {
      id: randomUUID(),
      userId,
      transactionType: "DEPOSIT",
      amount: 1000,
      currency: "NGN",
      paymentMethod: "Bank Transfer",
      gatewayReference,
      status: "pending",
      updatedAt: now,
      metadata: { depositAmount: 1000, vatAmount: 0 },
    },
  });

  await prisma.transaction.create({
    data: {
      id: randomUUID(),
      userId,
      transactionType: "DEPOSIT",
      amount: 1000,
      description: "Smoke pending deposit",
      status: "pending",
      reference: gatewayReference,
      walletType: "main",
    },
  });

  return payment;
}

async function main() {
  const admin = await ensureUser("admin+smoke-payments@example.com", "super_admin");
  const user = await ensureUser("user+smoke-payments@example.com", "user");

  const payment = await ensurePendingPayment(user.id);

  const session = createSessionForUser(admin.id, "super_admin");
  const caller = adminRouter.createCaller({ session, prisma } as any);

  const list = await caller.getPendingPayments({ page: 1, pageSize: 10, status: "pending" });

  console.log("Pending payments total:", list.total);
  console.log("Reviewing payment:", payment.id, "ref:", payment.gatewayReference);

  // Reject to avoid wallet balance side effects.
  await caller.reviewPayment({ paymentId: payment.id, action: "reject", notes: "Smoke test rejection" });

  const updated = await prisma.pendingPayment.findUnique({ where: { id: payment.id } });
  console.log("Updated status:", updated?.status);
}

main()
  .catch((e) => {
    console.error("smokeAdminPayments failed:", e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
