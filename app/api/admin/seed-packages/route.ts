import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { membershipPackagesSeedData } from "@/prisma/seed-data/membershipPackages";
import {
  initialBptConversionRateSeedData,
  systemWalletSeedData,
} from "@/prisma/seed-data/system";

async function seedPackages() {
  const packagesData = membershipPackagesSeedData;

  const created = [];
  const updated = [];
  const skipped = [];

  for (const pkgData of packagesData) {
    try {
      // Try to create - if it exists, update it
      const existing = await prisma.membershipPackage.findFirst({
        where: { name: pkgData.name }
      });

      if (existing) {
        await prisma.membershipPackage.update({
          where: { id: existing.id },
          data: pkgData
        });
        updated.push(pkgData.name);
      } else {
        await prisma.membershipPackage.create({
          data: pkgData
        });
        created.push(pkgData.name);
      }
    } catch (error: any) {
      console.error(`Failed to process ${pkgData.name}:`, error.message);
      skipped.push(pkgData.name);
    }
  }
  
  // Create Buy-Back Burn System Wallet
  try {
    for (const walletData of systemWalletSeedData) {
      await prisma.systemWallet.upsert({
        where: { name: walletData.name },
        update: {},
        create: walletData,
      });
    }
  } catch (error) {
    console.error("Failed to create system wallet:", error);
  }
  
  // Create initial BPT conversion rate
  try {
    await prisma.bptConversionRate.create({ data: initialBptConversionRateSeedData });
  } catch (error) {
    console.error("Conversion rate may already exist:", error);
  }

  return { created, updated, skipped };
}

export async function GET() {
  try {
    const result = await seedPackages();
    return NextResponse.json({
      success: true,
      message: "Complete package system seeded successfully",
      ...result,
    });
  } catch (error: any) {
    console.error("Error seeding packages:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to seed packages",
      },
      { status: 500 }
    );
  }
}

export async function POST() {
  try {
    const result = await seedPackages();
    return NextResponse.json({
      success: true,
      message: "Complete package system seeded successfully",
      ...result,
    });
  } catch (error: any) {
    console.error("Error seeding packages:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to seed packages",
      },
      { status: 500 }
    );
  }
}
