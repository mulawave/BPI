/**
 * The BPI Project Account.
 *
 * Corporate decision (follow-up Q16/Q17, 07/10/2026): one dedicated system
 * wallet holds money for Special Community Support campaigns and the ₦20,000
 * health-project share of each Healthcare Card subscription. An admin
 * manually disburses from it to the contractor/project/health programme —
 * no automatic payout to an external account.
 */

import { randomUUID } from "crypto";
import type { Prisma, PrismaClient } from "@prisma/client";

type Db = PrismaClient | Prisma.TransactionClient;

export const BPI_PROJECT_ACCOUNT_NAME = "BPI Health & Project Account";
export const BPI_PROJECT_ACCOUNT_TYPE = "BPI_PROJECT_ACCOUNT";

export async function ensureBpiProjectAccount(db: Db) {
  return db.systemWallet.upsert({
    where: { name: BPI_PROJECT_ACCOUNT_NAME },
    update: {},
    create: {
      id: randomUUID(),
      name: BPI_PROJECT_ACCOUNT_NAME,
      walletType: BPI_PROJECT_ACCOUNT_TYPE,
      balanceNgn: 0,
      balanceUsd: 0,
      balanceBpt: 0,
      updatedAt: new Date(),
    },
  });
}
