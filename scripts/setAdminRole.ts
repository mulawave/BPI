/**
 * Script to set a user as admin
 * Usage: npx tsx scripts/setAdminRole.ts <email>
 */

import { prisma } from "../lib/prisma";

async function setAdminRole() {
  const email = process.argv[2];

  if (!email) {
    console.error("❌ Please provide an email address");
    console.log("Usage: npx tsx scripts/setAdminRole.ts <email>");
    process.exit(1);
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      console.error(`❌ User with email "${email}" not found`);
      process.exit(1);
    }

    await prisma.user.update({
      where: { email },
      data: { role: "admin" },
    });

    console.log(`✅ Successfully set ${email} as admin`);
    console.log(`User ID: ${user.id}`);
    console.log(`Name: ${user.name || "Not set"}`);
  } catch (error) {
    console.error("❌ Error setting admin role:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

setAdminRole();
