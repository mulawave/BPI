/*
  Seeds a handful of demo pending payments for UI testing.

  Usage:
    npm run smoke:seed-demo-pendings
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
      name: "Demo Pending User",
    },
  });
}

async function main() {
  const user = await ensureUser("user+demo-pendings@example.com");
  const now = new Date();
  const batchId = now.toISOString().replace(/[:.]/g, "-");

  const count = 5;
  for (let i = 0; i < count; i++) {
    const gatewayReference = `DEMO-PENDING-${batchId}-${i + 1}`;

    const exists = await prisma.pendingPayment.findFirst({ where: { gatewayReference } });
    if (exists) continue;

    await prisma.pendingPayment.create({
      data: {
        id: randomUUID(),
        userId: user.id,
        transactionType: "DEPOSIT",
        amount: 500 + i * 250,
        currency: "NGN",
        paymentMethod: "Bank Transfer",
        gatewayReference,
        status: "pending",
        updatedAt: now,
        metadata: { depositAmount: 500 + i * 250, vatAmount: 0 },
      },
    });

    await prisma.transaction.create({
      data: {
        id: randomUUID(),
        userId: user.id,
        transactionType: "DEPOSIT",
        amount: 500 + i * 250,
        description: "Demo pending deposit",
        status: "pending",
        reference: gatewayReference,
        walletType: "main",
      },
    });
  }

  console.log(JSON.stringify({ ok: true, seeded: count, userId: user.id }, null, 2));
}

main()
  .catch((e) => {
    console.error("seedDemoPendingPayments failed:", e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
