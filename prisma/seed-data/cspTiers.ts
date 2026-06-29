import type { Prisma } from "@prisma/client";
import { randomUUID } from "crypto";

const cspTierDefinitions = [
  { tierNumber: 1, name: "Tier 1", contributionRight: 10000, maxSupportCap: 200000 },
  { tierNumber: 2, name: "Tier 2", contributionRight: 20000, maxSupportCap: 400000 },
  { tierNumber: 3, name: "Tier 3", contributionRight: 30000, maxSupportCap: 600000 },
  { tierNumber: 4, name: "Tier 4", contributionRight: 50000, maxSupportCap: 1000000 },
  { tierNumber: 5, name: "Tier 5", contributionRight: 75000, maxSupportCap: 1500000 },
  { tierNumber: 6, name: "Tier 6", contributionRight: 100000, maxSupportCap: 2000000 },
  { tierNumber: 7, name: "Tier 7", contributionRight: 125000, maxSupportCap: 2500000 },
  { tierNumber: 8, name: "Tier 8", contributionRight: 150000, maxSupportCap: 3000000 },
  { tierNumber: 9, name: "Tier 9", contributionRight: 175000, maxSupportCap: 3500000 },
  { tierNumber: 10, name: "Tier 10", contributionRight: 200000, maxSupportCap: 4000000 },
  { tierNumber: 11, name: "Tier 11", contributionRight: 225000, maxSupportCap: 4500000 },
  { tierNumber: 12, name: "Tier 12", contributionRight: 250000, maxSupportCap: 5000000 },
  { tierNumber: 13, name: "Tier 13", contributionRight: 275000, maxSupportCap: 5500000 },
  { tierNumber: 14, name: "Tier 14", contributionRight: 300000, maxSupportCap: 6000000 },
  { tierNumber: 15, name: "Tier 15", contributionRight: 325000, maxSupportCap: 6500000 },
  { tierNumber: 16, name: "Tier 16", contributionRight: 350000, maxSupportCap: 7000000 },
  { tierNumber: 17, name: "Tier 17", contributionRight: 375000, maxSupportCap: 7500000 },
  { tierNumber: 18, name: "Tier 18", contributionRight: 400000, maxSupportCap: 8000000 },
  { tierNumber: 19, name: "Tier 19", contributionRight: 450000, maxSupportCap: 9000000 },
  { tierNumber: 20, name: "Tier 20", contributionRight: 500000, maxSupportCap: 10000000 },
] as const;

const cspDonationBadgeCategoryDefinitions = [
  {
    name: "Bronze Donor",
    minAmount: 50000,
    maxAmount: 99999,
    badgeType: "Bronze Time Reduction Badge",
    coolingReductionMonths: 1,
  },
  {
    name: "Silver Donor",
    minAmount: 100000,
    maxAmount: 249999,
    badgeType: "Silver Time Reduction Badge",
    coolingReductionMonths: 2,
  },
  {
    name: "Gold Donor",
    minAmount: 250000,
    maxAmount: 499999,
    badgeType: "Gold Time Reduction Badge",
    coolingReductionMonths: 3,
  },
  {
    name: "Platinum Donor",
    minAmount: 500000,
    maxAmount: 999999,
    badgeType: "Platinum Time Reduction Badge",
    coolingReductionMonths: 4,
  },
  {
    name: "Diamond Donor",
    minAmount: 1000000,
    maxAmount: 2499999,
    badgeType: "Diamond Time Reduction Badge",
    coolingReductionMonths: 6,
  },
  {
    name: "Impact Partner",
    minAmount: 2500000,
    maxAmount: 4999999,
    badgeType: "Impact Partner Badge",
    coolingReductionMonths: 9,
  },
  {
    name: "Legacy Partner",
    minAmount: 5000000,
    maxAmount: null,
    badgeType: "Legacy Time Reduction Badge",
    coolingReductionMonths: 12,
  },
] as const;

export const cspTierSeedData: Prisma.CspTierCreateInput[] = cspTierDefinitions.map((tier) => ({
  id: randomUUID(),
  updatedAt: new Date(),
  ...tier,
}));

export const cspDonationBadgeCategorySeedData: Prisma.CspDonationBadgeCategoryCreateInput[] =
  cspDonationBadgeCategoryDefinitions.map((category) => ({
    id: randomUUID(),
    updatedAt: new Date(),
    ...category,
  }));
