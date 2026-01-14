import { prisma } from "../lib/prisma";
import { randomUUID } from "crypto";

/**
 * This script is intended to be run as a daily cron job.
 * It checks for empowerment packages that have reached their maturity date
 * and updates their status to "Pending Maturity" to signal that they
 * are ready for admin review and approval.
 */
async function checkMaturedPackages() {
  console.log("Cron Job: Checking for matured empowerment packages...");

  const today = new Date();

  const maturedPackages = await prisma.empowermentPackage.findMany({
    where: {
      status: "Active - Countdown Running",
      maturityDate: {
        lte: today, // Less than or equal to today
      },
    },
  });

  if (maturedPackages.length === 0) {
    console.log("Cron Job: No packages have matured today.");
    return;
  }

  console.log(`Cron Job: Found ${maturedPackages.length} matured packages. Updating status...`);

  // Find all admin users
  const admins = await prisma.user.findMany({
    where: { role: 'admin' },
  });

  if (admins.length === 0) {
    console.log("Cron Job: No admin users found to notify.");
  }

  for (const pkg of maturedPackages) {
    await prisma.empowermentPackage.update({
      where: { id: pkg.id },
      data: { status: "Pending Maturity" },
    });
    console.log(`- Updated package ${pkg.id} to "Pending Maturity".`);
    
    // Create a notification for each admin
    if (admins.length > 0) {
      const message = `Empowerment package for beneficiary ${pkg.beneficiaryId} has matured and requires approval.`;
      const title = "Empowerment Package Matured";
      for (const admin of admins) {
        await prisma.notification.create({
          data: {
            id: randomUUID(),
            userId: admin.id,
            title,
            message,
            isRead: false,
          },
        });
      }
      console.log(`- Notified ${admins.length} admin(s) for package ${pkg.id}.`);
    }
  }

  console.log("Cron Job: Finished checking for matured packages.");
}

checkMaturedPackages().finally(async () => {
  await prisma.$disconnect();
});
