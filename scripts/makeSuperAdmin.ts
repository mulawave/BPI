import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";
import { randomUUID } from "crypto";

async function main() {
  const prisma = new PrismaClient();
  try {
    const email = process.env.SUPER_ADMIN_EMAIL || "richardobroh@gmail.com";
    const pass = process.env.SUPER_ADMIN_PASSWORD || "ChangeMe123!";
    const name = process.env.SUPER_ADMIN_NAME || "Super Admin";
    const now = new Date();
    const passwordHash = await hash(pass, 10);

    const user = await prisma.user.upsert({
      where: { email },
      update: {
        role: "super_admin",
        passwordHash,
        activated: true,
        verified: true,
        emailVerified: now,
        updatedAt: now,
        name,
      },
      create: {
        id: randomUUID(),
        email,
        name,
        role: "super_admin",
        passwordHash,
        activated: true,
        verified: true,
        emailVerified: now,
        createdAt: now,
        updatedAt: now,
      },
    });

    console.log("Seeded super admin:", user.email);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
