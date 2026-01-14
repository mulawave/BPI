import { Prisma } from "@prisma/client";
import { randomUUID } from "crypto";

export const youtubePlansSeedData: Prisma.YoutubePlanCreateInput[] = [
  {
    id: randomUUID(),
    updatedAt: new Date(),
    name: "Starter",
    amount: new Prisma.Decimal(5000),
    vat: new Prisma.Decimal(375),
    totalSub: 100,
    description: "Perfect for new channels - 100 subscription slots",
    isActive: true,
  },
  {
    id: randomUUID(),
    updatedAt: new Date(),
    name: "Growth",
    amount: new Prisma.Decimal(20000),
    vat: new Prisma.Decimal(1500),
    totalSub: 500,
    description: "Accelerate your growth - 500 subscription slots",
    isActive: true,
  },
  {
    id: randomUUID(),
    updatedAt: new Date(),
    name: "Pro",
    amount: new Prisma.Decimal(35000),
    vat: new Prisma.Decimal(2625),
    totalSub: 1000,
    description: "For serious creators - 1000 subscription slots",
    isActive: true,
  },
  {
    id: randomUUID(),
    updatedAt: new Date(),
    name: "Enterprise",
    amount: new Prisma.Decimal(150000),
    vat: new Prisma.Decimal(11250),
    totalSub: 5000,
    description: "Maximum reach - 5000 subscription slots",
    isActive: true,
  },
];
