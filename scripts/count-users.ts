import { PrismaClient } from "@prisma/client";

const p = new PrismaClient();

async function main() {
  const total = await p.user.count();
  const withEmail = await p.user.count({ where: { email: { not: null } } });
  const withUsername = await p.user.count({ where: { username: { not: null } } } );
  const withLegacy = await p.user.count({ where: { legacyId: { not: null } } });
  console.log({ total, withEmail, withUsername, withLegacy });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await p.$disconnect();
  });
