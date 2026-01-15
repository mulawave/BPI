import { randomUUID } from "crypto";
import { hash } from "bcryptjs";
import { prisma } from "../lib/prisma";

async function main() {
  const password = "Passw0rd!";

  const candidates = [
    {
      email: "qa.user1@example.com",
      name: "QA User One",
      username: "qauser1",
      wallet: 50000,
      spendable: 50000,
    },
    {
      email: "qa.user2@example.com",
      name: "QA User Two",
      username: "qauser2",
      wallet: 30000,
      spendable: 30000,
    },
  ];

  for (const userData of candidates) {
    const passwordHash = await hash(password, 10);

    const user = await prisma.user.upsert({
      where: { email: userData.email },
      update: {
        name: userData.name,
        username: userData.username,
        passwordHash,
        wallet: userData.wallet,
        spendable: userData.spendable,
        role: "user",
      },
      create: {
        id: randomUUID(),
        email: userData.email,
        name: userData.name,
        username: userData.username,
        passwordHash,
        wallet: userData.wallet,
        spendable: userData.spendable,
        role: "user",
      },
    });

    await prisma.bpiMember.upsert({
      where: { userId: user.id },
      update: {
        updatedAt: new Date(),
      },
      create: {
        id: randomUUID(),
        userId: user.id,
        membershipType: "regular",
        isActivated: false,
        defaultCurrency: "NGN",
        updatedAt: new Date(),
      },
    });

    console.log(`Seeded ${user.email} / ${password}`);
  }
}

main()
  .catch((err) => {
    console.error("Seed failed", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
