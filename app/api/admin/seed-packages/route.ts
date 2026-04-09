import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authConfig } from "@/server/auth";
import { adminSeedLimiter, applyRateLimit } from "@/lib/rateLimit";
import { membershipPackagesSeedData } from "@/prisma/seed-data/membershipPackages";
import {
  initialBPTokenPriceSeedData,
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
  
  // Create initial BPTokenPrice (Currency Manager source of truth)
  try {
    const existing = await prisma.bPTokenPrice.findFirst({ where: { active: true } });
    if (!existing) {
      await prisma.bPTokenPrice.create({ data: initialBPTokenPriceSeedData });
    }
  } catch (error) {
    console.error("BPTokenPrice may already exist:", error);
  }

  return { created, updated, skipped };
}

async function requireAdmin() {
  const session = await getServerSession(authConfig);
  const role = (session?.user as any)?.role;

  if (!session?.user) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  if (role !== "admin" && role !== "super_admin") {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }

  return null;
}

export async function POST(req: NextRequest) {
  // Rate limit: 3 requests per minute per IP
  const blocked = applyRateLimit(req, adminSeedLimiter);
  if (blocked) return blocked;

  const authError = await requireAdmin();
  if (authError) {
    return authError;
  }

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

export async function GET() {
  return NextResponse.json(
    {
      success: false,
      error: "Method not allowed. Use authenticated POST.",
    },
    { status: 405 }
  );
}
