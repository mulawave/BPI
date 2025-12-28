import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

async function seedPackages() {
  const packagesData = [
    // 1. REGULAR MEMBERSHIP (₦10,000 + ₦750 VAT = ₦10,750)
    {
      name: "Regular",
      packageType: "STANDARD",
      price: 10000,
      vat: 750,
      // Activation Rewards
      cash_l1: 1000, cash_l2: 500, cash_l3: 500, cash_l4: 500,
      palliative_l1: 250, palliative_l2: 250, palliative_l3: 250, palliative_l4: 250,
      bpt_l1: 1000, bpt_l2: 500, bpt_l3: 500, bpt_l4: 500,
      // Renewal enabled (yearly)
      hasRenewal: true,
      renewalFee: 10000,
      renewalCycle: 365,
      features: ["Community Support Access", "Membership Upgrade Path", "BPI Token Reward", "Palliative Reward"],
    },
    
    // 2. REGULAR PLUS (₦50,000 + ₦3,750 VAT = ₦53,750)
    {
      name: "Regular Plus",
      packageType: "STANDARD",
      price: 50000,
      vat: 3750,
      // Activation Rewards
      cash_l1: 10000, cash_l2: 5000, cash_l3: 10000, cash_l4: 5000,
      palliative_l1: 1000, palliative_l2: 500, palliative_l3: 1000, palliative_l4: 500,
      bpt_l1: 500, bpt_l2: 500, bpt_l3: 500, bpt_l4: 500,
      // Renewal
      hasRenewal: true,
      renewalFee: 50000,
      renewalCycle: 365,
      renewal_cash_l1: 2500, renewal_cash_l2: 1250, renewal_cash_l3: 2500, renewal_cash_l4: 1250,
      renewal_palliative_l1: 3000, renewal_palliative_l2: 1500, renewal_palliative_l3: 3000, renewal_palliative_l4: 1500,
      renewal_bpt_l1: 500, renewal_bpt_l2: 500, renewal_bpt_l3: 500, renewal_bpt_l4: 500,
      renewal_health_l1: 250, renewal_health_l2: 250, renewal_health_l3: 250, renewal_health_l4: 250,
      renewal_meal_l1: 250, renewal_meal_l2: 250, renewal_meal_l3: 250, renewal_meal_l4: 250,
      renewal_security_l1: 250, renewal_security_l2: 250, renewal_security_l3: 250, renewal_security_l4: 250,
      features: ["Community Support", "Membership Upgrade Path", "BPI Token", "Palliative Reward", "Health Wallet", "Meal Wallet", "Security Wallet"],
    },
    
    // 3. GOLD PLUS (₦221,000 + ₦16,575 VAT = ₦237,575)
    {
      name: "Gold Plus",
      packageType: "STANDARD",
      price: 221000,
      vat: 16575,
      // Activation Rewards
      cash_l1: 0, cash_l2: 0, cash_l3: 0, cash_l4: 0,
      palliative_l1: 7200, palliative_l2: 4320, palliative_l3: 1440, palliative_l4: 1440,
      bpt_l1: 2000, bpt_l2: 600, bpt_l3: 200, bpt_l4: 200,
      cashback_l1: 3600, cashback_l2: 2160, cashback_l3: 720, cashback_l4: 720,
      // Shelter Rewards (10 levels - admin only visibility)
      shelter_l1: 60000, shelter_l2: 45000, shelter_l3: 15000, shelter_l4: 15000,
      shelter_l5: 3000, shelter_l6: 3000, shelter_l7: 3000, shelter_l8: 3000,
      shelter_l9: 1500, shelter_l10: 1500,
      // Renewal
      hasRenewal: true,
      renewalFee: 100000,
      renewalCycle: 365,
      renewal_palliative_l1: 6000, renewal_palliative_l2: 3600, renewal_palliative_l3: 1200, renewal_palliative_l4: 1200,
      renewal_cashback_l1: 4000, renewal_cashback_l2: 2400, renewal_cashback_l3: 800, renewal_cashback_l4: 800,
      renewal_bpt_l1: 1000, renewal_bpt_l2: 500, renewal_bpt_l3: 250, renewal_bpt_l4: 250,
      renewal_health_l1: 1000, renewal_health_l2: 800, renewal_health_l3: 800, renewal_health_l4: 500,
      renewal_meal_l1: 300, renewal_meal_l2: 300, renewal_meal_l3: 200, renewal_meal_l4: 200,
      renewal_security_l1: 150, renewal_security_l2: 150, renewal_security_l3: 100, renewal_security_l4: 100,
      features: ["Community Support", "Full Membership", "BPI-Token", "Palliative Reward", "Social Media (MYNGUL)", "Cashback", "Shelter Rewards (10 levels)", "Health/Meal/Security Wallets"],
    },
    
    // 4. PLATINUM PLUS (₦321,000 + ₦24,075 VAT = ₦345,075)
    {
      name: "Platinum Plus",
      packageType: "STANDARD",
      price: 321000,
      vat: 24075,
      // Activation Rewards
      cash_l1: 0, cash_l2: 0, cash_l3: 0, cash_l4: 0,
      palliative_l1: 16000, palliative_l2: 6400, palliative_l3: 3200, palliative_l4: 3200,
      bpt_l1: 2000, bpt_l2: 600, bpt_l3: 200, bpt_l4: 200,
      cashback_l1: 74250, cashback_l2: 44550, cashback_l3: 14850, cashback_l4: 14850,
      // Shelter Rewards (10 levels)
      shelter_l1: 30000, shelter_l2: 22500, shelter_l3: 7500, shelter_l4: 7500,
      shelter_l5: 1500, shelter_l6: 1500, shelter_l7: 1500, shelter_l8: 1500,
      shelter_l9: 1500, shelter_l10: 1500,
      // Renewal (same as Gold Plus)
      hasRenewal: true,
      renewalFee: 100000,
      renewalCycle: 365,
      renewal_palliative_l1: 6000, renewal_palliative_l2: 3600, renewal_palliative_l3: 1200, renewal_palliative_l4: 1200,
      renewal_cashback_l1: 4000, renewal_cashback_l2: 2400, renewal_cashback_l3: 800, renewal_cashback_l4: 800,
      renewal_bpt_l1: 1000, renewal_bpt_l2: 500, renewal_bpt_l3: 250, renewal_bpt_l4: 250,
      renewal_health_l1: 1000, renewal_health_l2: 800, renewal_health_l3: 800, renewal_health_l4: 500,
      renewal_meal_l1: 300, renewal_meal_l2: 300, renewal_meal_l3: 200, renewal_meal_l4: 200,
      renewal_security_l1: 150, renewal_security_l2: 150, renewal_security_l3: 100, renewal_security_l4: 100,
      features: ["Community Support", "Full Membership", "Web3 Integration", "MYNGUL Social Media", "Cashback Reward", "BPI Token", "Shelter Rewards (10 levels)", "Health/Meal/Security Wallets"],
    },
    
    // 5. TRAVEL & TOUR AGENT (₦330,000 + ₦24,750 VAT = ₦354,750)
    {
      name: "Travel & Tour Agent",
      packageType: "STANDARD",
      price: 330000,
      vat: 24750,
      // Activation Rewards
      cash_l1: 10000, cash_l2: 5000, cash_l3: 10000, cash_l4: 5000,
      palliative_l1: 500, palliative_l2: 500, palliative_l3: 500, palliative_l4: 500,
      bpt_l1: 1000, bpt_l2: 500, bpt_l3: 1000, bpt_l4: 500,
      cashback_l1: 62500, cashback_l2: 62500, cashback_l3: 10000, cashback_l4: 10000,
      hasRenewal: false,
      features: ["Community Support", "Membership Upgrade", "Social Media", "Palliative Reward", "Cashback Reward", "Travel & Tour Benefits"],
    },
    
    // 6. BASIC EARLY RETIREMENT (₦267,000 + ₦20,025 VAT = ₦287,025)
    {
      name: "Basic Early Retirement",
      packageType: "STANDARD",
      price: 267000,
      vat: 20025,
      // Activation Rewards
      cash_l1: 10000, cash_l2: 5000, cash_l3: 10000, cash_l4: 5000,
      palliative_l1: 1000, palliative_l2: 500, palliative_l3: 1000, palliative_l4: 500,
      bpt_l1: 500, bpt_l2: 500, bpt_l3: 500, bpt_l4: 500,
      hasRenewal: false,
      features: ["Community Support", "Regular Plus Membership Upgrade", "BPI Token", "Palliative Reward", "Web3 Payment Portfolio", "Digital Farm Portfolio", "Web3 Liquidity", "Social Media (MYNGUL)"],
    },
  ];

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
    await prisma.systemWallet.upsert({
      where: { name: "BUY_BACK_BURN" },
      update: {},
      create: {
        name: "BUY_BACK_BURN",
        walletType: "BUY_BACK_BURN",
        balanceNgn: 0,
        balanceUsd: 0,
        balanceBpt: 0,
        isPubliclyVisible: true,
      },
    });
  } catch (error) {
    console.error("Failed to create system wallet:", error);
  }
  
  // Create initial BPT conversion rate
  try {
    await prisma.bptConversionRate.create({
      data: {
        rateUsd: 0.002,  // $0.002 per BPT
        rateNgn: 5,      // ₦5 per BPT
        isActive: true,
      },
    });
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
