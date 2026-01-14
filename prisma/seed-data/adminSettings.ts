import type { Prisma } from "@prisma/client";
import { randomUUID } from "crypto";

export const adminSettingsSeedData: Prisma.AdminSettingsCreateInput[] = [
  {
    id: randomUUID(),
    updatedAt: new Date(),
    settingKey: "CASH_WITHDRAWAL_FEE",
    settingValue: "100",
    description: "Default cash withdrawal fee",
  },
  {
    id: randomUUID(),
    updatedAt: new Date(),
    settingKey: "BPT_WITHDRAWAL_FEE",
    settingValue: "0",
    description: "Default BPT withdrawal fee",
  },
  {
    id: randomUUID(),
    updatedAt: new Date(),
    settingKey: "MAX_TRANSFER_AMOUNT",
    settingValue: "500000",
    description: "Maximum transfer amount",
  },
  {
    id: randomUUID(),
    updatedAt: new Date(),
    settingKey: "AUTO_WITHDRAWAL_THRESHOLD",
    settingValue: "100000",
    description: "Auto-withdrawal threshold",
  },
];
