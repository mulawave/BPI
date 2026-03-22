/*
  Cleans up demo pending payments seeded by seedDemoPendingPayments.

  Usage:
    npm run smoke:cleanup-demo-pendings
*/

import { prisma } from "@/lib/prisma";

async function main() {
  const prefix = "DEMO-PENDING-";

  const pending = await prisma.pendingPayment.findMany({
    where: { gatewayReference: { startsWith: prefix } },
    select: { id: true, gatewayReference: true },
  });

  const refs = pending.flatMap((p: { gatewayReference: string | null }) =>
    p.gatewayReference ? [p.gatewayReference] : []
  );

  const [deletedPayments, deletedTxns] = await Promise.all([
    prisma.pendingPayment.deleteMany({ where: { gatewayReference: { startsWith: prefix } } }),
    prisma.transaction.deleteMany({ where: { reference: { in: refs } } }),
  ]);

  console.log(
    JSON.stringify(
      {
        ok: true,
        deletedPendingPayments: deletedPayments.count,
        deletedTransactions: deletedTxns.count,
      },
      null,
      2,
    ),
  );
}

main()
  .catch((e) => {
    console.error("cleanupDemoPendingPayments failed:", e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
