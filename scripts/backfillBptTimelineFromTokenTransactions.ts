import { PrismaClient } from "@prisma/client";import { randomUUID } from 'crypto';
const prisma = new PrismaClient();

function mapTokenTxToTransactionType(tokenTx: {
  transactionType: string;
  source: string;
}): string {
  // rewards.service.ts uses `source` to store the logical origin (e.g. REFERRAL_L1)
  const referralMatch = tokenTx.source?.match(/^REFERRAL_L(\d+)$/);
  if (referralMatch) {
    return `REFERRAL_BPT_L${referralMatch[1]}`;
  }

  return tokenTx.transactionType;
}

async function main() {
  console.log("🔁 Backfilling BPT timeline transactions from TokenTransaction...\n");

  const tokenTxs = await prisma.tokenTransaction.findMany({
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      userId: true,
      transactionType: true,
      memberAmount: true,
      source: true,
      description: true,
      createdAt: true,
    },
  });

  let createdCount = 0;
  let skippedCount = 0;

  for (const tokenTx of tokenTxs) {
    // Only backfill member-visible share
    if (!tokenTx.memberAmount || tokenTx.memberAmount <= 0) {
      skippedCount++;
      continue;
    }

    // Skip buy-back/system allocations
    if (tokenTx.transactionType === "BUY_BACK_ALLOCATION") {
      skippedCount++;
      continue;
    }

    const reference = `BPT-TOKEN-${tokenTx.id}`;

    const existing = await prisma.transaction.findFirst({
      where: { reference },
      select: { id: true },
    });

    if (existing) {
      skippedCount++;
      continue;
    }

    await prisma.transaction.create({
      data: {
        id: randomUUID(),
        userId: tokenTx.userId,
        transactionType: mapTokenTxToTransactionType(tokenTx),
        amount: tokenTx.memberAmount,
        description: tokenTx.description || "BPT transaction",
        status: "completed",
        reference,
        walletType: "bpiToken",
        createdAt: tokenTx.createdAt,
      },
    });

    createdCount++;
  }

  console.log(`✅ Created ${createdCount} Transaction row(s)`);
  console.log(`⏭️  Skipped ${skippedCount} TokenTransaction row(s) (non-member, buy-back, or already backfilled)\n`);
}

main()
  .catch((e) => {
    console.error("Error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
