import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function verifyUserEmail(email: string) {
  try {
    // Find the user
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        emailVerified: true,
        firstname: true,
        lastname: true,
      },
    });

    if (!user) {
      console.error(`❌ User not found: ${email}`);
      process.exit(1);
    }

    if (user.emailVerified) {
      console.log(`✅ Email already verified for: ${user.firstname} ${user.lastname} (${user.email})`);
      console.log(`   Verified on: ${user.emailVerified.toISOString()}`);
      process.exit(0);
    }

    // Mark email as verified
    const updatedUser = await prisma.user.update({
      where: { email },
      data: {
        emailVerified: new Date(),
      },
    });

    console.log(`✅ Successfully verified email for: ${user.firstname} ${user.lastname}`);
    console.log(`   Email: ${updatedUser.email}`);
    console.log(`   Verified at: ${updatedUser.emailVerified?.toISOString()}`);
  } catch (error) {
    console.error("❌ Error verifying email:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Get email from command line arguments
const email = process.argv[2];

if (!email) {
  console.error("❌ Usage: npx tsx scripts/verifyUserEmail.ts <email>");
  console.error("   Example: npx tsx scripts/verifyUserEmail.ts user@example.com");
  process.exit(1);
}

// Validate email format
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
if (!emailRegex.test(email)) {
  console.error(`❌ Invalid email format: ${email}`);
  process.exit(1);
}

verifyUserEmail(email);
