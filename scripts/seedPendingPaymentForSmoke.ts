/*
  Seeds a pending payment + matching pending transaction for admin payment review smoke.

  Usage:
    npm run smoke:seed-pending
*/

import { prisma } from "@/lib/prisma";
import { randomUUID } from "crypto";

async function ensureUser(email: string) {
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return existing;

  return await prisma.user.create({
    data: {
      id: randomUUID(),
      email,
      role: "user",
      activated: true,
      name: "Smoke User",
    },
  });
}

async function main() {
  const user = await ensureUser("user+smoke-payment@example.com");
  const now = new Date();

  const existingPending = await prisma.pendingPayment.findFirst({
    where: {
      userId: user.id,
      status: "pending",
      gatewayReference: { startsWith: "SMOKE-PAYMENT-SEED" },
    },
    orderBy: { createdAt: "desc" },
  });

  const gatewayReference = existingPending?.gatewayReference || `SMOKE-PAYMENT-SEED-${now.toISOString().replace(/[:.]/g, "-")}`;

  const payment =
    existingPending ||
    (await prisma.pendingPayment.create({
      data: {
        id: randomUUID(),
        userId: user.id,
        transactionType: "DEPOSIT",
        amount: 1000,
        currency: "NGN",
        paymentMethod: "Bank Transfer",
        gatewayReference,
        status: "pending",
        updatedAt: now,
        metadata: { depositAmount: 1000, vatAmount: 0 },
      },
    }));

  // Ensure a matching pending transaction exists so reviewPayment's updateMany path is exercised
  const existingTxn = await prisma.transaction.findFirst({
    where: {
      userId: user.id,
      status: "pending",
      reference: gatewayReference,
      transactionType: "DEPOSIT",
    },
    orderBy: { createdAt: "desc" },
  });

  if (!existingTxn) {
    await prisma.transaction.create({
      data: {
        id: randomUUID(),
        userId: user.id,
        transactionType: "DEPOSIT",
        amount: 1000,
        description: "Seed pending deposit for smoke payment review",
        status: "pending",
        reference: gatewayReference,
        walletType: "main",
      },
    });
  }

  console.log(
    JSON.stringify(
      {
        ok: true,
        userId: user.id,
        pendingPaymentId: payment.id,
        gatewayReference,
      },
      null,
      2,
    ),
  );
}

main()
  .catch((e) => {
    console.error("seedPendingPaymentForSmoke failed:", e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
