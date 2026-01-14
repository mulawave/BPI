import { prisma } from "../lib/prisma";
import { randomUUID } from "crypto";

async function main() {
  const user = await prisma.user.findFirst({ select: { id: true, email: true, name: true } });
  if (!user) throw new Error("No users found to seed pending payments.");

  const packages = await prisma.membershipPackage.findMany({ orderBy: { price: "asc" } });
  const pkgA = packages[0];
  const pkgB = packages[1];

  const seeds: Array<Parameters<typeof prisma.pendingPayment.create>[0]["data"]> = [];

  // TOPUP
  seeds.push({
    id: randomUUID(),
    userId: user.id,
    amount: 7500,
    status: "pending",
    transactionType: "TOPUP",
    paymentMethod: "Bank Transfer",
    gatewayReference: `DEMO-TOPUP-${randomUUID()}`,
    metadata: {},
    createdAt: new Date(),
    updatedAt: new Date(),
  } as any);

  // MEMBERSHIP if a package exists
  if (pkgA) {
    seeds.push({
      id: randomUUID(),
      userId: user.id,
      amount: Number(pkgA.price ?? 0) || 10000,
      status: "pending",
      transactionType: "MEMBERSHIP",
      paymentMethod: "Bank Transfer",
      gatewayReference: `DEMO-MEMBERSHIP-${randomUUID()}`,
      metadata: { packageId: pkgA.id, selectedPalliative: null },
      createdAt: new Date(),
      updatedAt: new Date(),
    } as any);
  }

  // UPGRADE if two packages exist
  if (pkgA && pkgB) {
    seeds.push({
      id: randomUUID(),
      userId: user.id,
      amount: Math.max(1000, Number(pkgB.price) - Number(pkgA.price) || 5000),
      status: "pending",
      transactionType: "UPGRADE",
      paymentMethod: "Bank Transfer",
      gatewayReference: `DEMO-UPGRADE-${randomUUID()}`,
      metadata: { packageId: pkgB.id, fromPackageId: pkgA.id, selectedPalliative: null },
      createdAt: new Date(),
      updatedAt: new Date(),
    } as any);
  }

  // Another TOPUP for variety
  seeds.push({
    id: randomUUID(),
    userId: user.id,
    amount: 15000,
    status: "pending",
    transactionType: "TOPUP",
    paymentMethod: "Bank Transfer",
    gatewayReference: `DEMO-TOPUP-${randomUUID()}`,
    metadata: {},
    createdAt: new Date(),
    updatedAt: new Date(),
  } as any);

  let created = 0;
  for (const data of seeds) {
    await prisma.pendingPayment.create({ data: data as any });
    created++;
  }

  console.log(`Seeded ${created} pending payments for user ${user.email}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
