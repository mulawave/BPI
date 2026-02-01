/*
  Seed or update a non-member test user for auth gating probes.
  Usage:
    set CRED_EMAIL=test-nonmember@example.com
    set CRED_PASSWORD=Passw0rd!test
    npx tsx scripts/seedNonMemberUser.ts
*/

import { prisma } from "@/lib/prisma";
import { hash } from "bcryptjs";

const email = process.env.CRED_EMAIL || "test-nonmember@example.com";
const password = process.env.CRED_PASSWORD || "Passw0rd!test";

async function main() {
  const passwordHash = await hash(password, 10);

  // Try to find user by email
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    await prisma.user.update({
      where: { id: existing.id },
      data: {
        passwordHash,
        role: existing.role || "user",
        activeMembershipPackageId: null,
        membershipActivatedAt: null,
        membershipExpiresAt: null,
      },
    });
    console.log(`Updated existing user to non-member: ${email}`);
  } else {
    await prisma.user.create({
      data: {
        id: crypto.randomUUID(),
        email,
        name: "Test NonMember",
        role: "user",
        passwordHash,
        activeMembershipPackageId: null,
      },
    });
    console.log(`Created non-member user: ${email}`);
  }
}

main()
  .catch((e) => {
    console.error("Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
