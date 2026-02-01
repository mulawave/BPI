import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const total = await prisma.user.count();
  const without = await prisma.user.count({ where: { bankRecords: { none: {} } } });
  const withBanks = total - without;
  const noDefault = await prisma.user.count({
    where: {
      bankRecords: { some: {} },
      NOT: { bankRecords: { some: { isDefault: true } } },
    },
  });

  console.log({ totalUsers: total, usersWithBankRecords: withBanks, usersWithoutBankRecords: without, usersWithBanksButNoDefault: noDefault });
}

main()
  .catch((err) => {
    console.error(err);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
