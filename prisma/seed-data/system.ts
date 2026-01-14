import type { Prisma } from "@prisma/client";
import { randomUUID } from "crypto";

export const systemWalletSeedData: Prisma.SystemWalletCreateInput[] = [
  {
    id: randomUUID(),
    updatedAt: new Date(),
    name: "BUY_BACK_BURN",
    walletType: "BUY_BACK_BURN",
    balanceNgn: 0,
    balanceUsd: 0,
    balanceBpt: 0,
    isPubliclyVisible: true,
  },
];

export const initialBptConversionRateSeedData: Prisma.BptConversionRateCreateInput = {
  id: randomUUID(),
  rateUsd: 0.002,
  rateNgn: 5,
  isActive: true,
};
