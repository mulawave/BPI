import { PrismaClient } from "@prisma/client";

const p = new PrismaClient();

async function main() {
  await p.$executeRawUnsafe('TRUNCATE "User" CASCADE;');
  console.log("User table truncated");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await p.$disconnect();
  });
