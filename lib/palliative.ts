/**
 * Palliative System Utilities
 * Manages tier-based palliative activation and distribution logic
 */

export const PALLIATIVE_THRESHOLD = 200000; // ₦200,000 activation threshold for lower-tier members

/**
 * Palliative tier types
 */
export type PalliativeTier = "lower" | "higher";

/**
 * Palliative option slugs
 */
export type PalliativeType = "car" | "house" | "land" | "business" | "solar" | "education";

/**
 * Determine palliative tier based on package price
 * Gold Plus (₦210k+), Platinum, Diamond → Higher tier (instant activation)
 * Regular, Regular Plus → Lower tier (threshold activation)
 */
export function getPalliativeTier(packagePrice: number): PalliativeTier {
  return packagePrice >= 210000 ? "higher" : "lower";
}

/**
 * Check if package is high tier by name
 */
export function isHighTierPackage(packageName: string): boolean {
  const highTierPackages = ["Gold Plus", "Platinum", "Diamond", "Travel"];
  return highTierPackages.some(tier => 
    packageName.toLowerCase().includes(tier.toLowerCase())
  );
}

/**
 * Get wallet field name from palliative type
 * These map directly to the User model fields
 */
export function getWalletFieldName(palliativeType: PalliativeType): string {
  const walletMap: Record<PalliativeType, string> = {
    car: "car",
    house: "shelter", // "house" maps to shelter field in DB
    land: "land",
    business: "business",
    solar: "solar",
    education: "education",
  };
  
  return walletMap[palliativeType] || "shelter";
}

/**
 * Calculate progress percentage toward threshold
 */
export function calculateThresholdProgress(currentAmount: number): number {
  const percentage = (currentAmount / PALLIATIVE_THRESHOLD) * 100;
  return Math.min(percentage, 100); // Cap at 100%
}

/**
 * Get the target amount for a given palliative option slug.
 * Falls back to 0 if slug not recognised.
 */
export function getOptionTargetAmount(slug: string): number {
  const option = PALLIATIVE_OPTIONS.find(o => o.slug === slug);
  return option ? option.targetAmount : 0;
}

/**
 * Check if shelter-activation milestone has been reached.
 * This is purely the ₦200k threshold check (or already activated).
 */
export function isShelterActivated(
  palliativeBalance: number,
  palliativeActivated: boolean
): boolean {
  return palliativeActivated || palliativeBalance >= PALLIATIVE_THRESHOLD;
}

/**
 * Calculate progress toward an option's target amount.
 */
export function calculateOptionProgress(
  currentAmount: number,
  optionTargetAmount: number
): number {
  if (optionTargetAmount <= 0) return 0;
  return Math.min((currentAmount / optionTargetAmount) * 100, 100);
}

/**
 * Check if user can activate palliative.
 * Pass optionTargetAmount to validate against the chosen option's target
 * rather than just the shelter-activation threshold.
 */
export function canActivatePalliative(
  palliativeWallet: number,
  palliativeActivated: boolean,
  optionTargetAmount?: number
): boolean {
  if (palliativeActivated) return false;
  const required = optionTargetAmount ?? PALLIATIVE_THRESHOLD;
  return palliativeWallet >= required;
}

/**
 * Get milestone amounts for progress tracking
 */
export function getMilestones(): number[] {
  return [50000, 100000, 150000, PALLIATIVE_THRESHOLD];
}

/**
 * Check which milestones have been reached
 */
export function getCompletedMilestones(currentAmount: number): number[] {
  return getMilestones().filter(milestone => currentAmount >= milestone);
}

/**
 * Get next milestone to reach
 */
export function getNextMilestone(currentAmount: number): number | null {
  const milestones = getMilestones();
  const nextMilestone = milestones.find(milestone => currentAmount < milestone);
  return nextMilestone || null;
}

/**
 * Palliative option configurations (default values)
 * These should be seeded in the database
 */
export const PALLIATIVE_OPTIONS = [
  {
    name: "Car Palliative",
    slug: "car" as const,
    targetAmount: 10000000, // ₦10M
    description: "Receive support toward purchasing your dream vehicle",
    icon: "car",
    displayOrder: 1,
  },
  {
    name: "House/Shelter Palliative",
    slug: "house" as const,
    targetAmount: 40000000, // ₦40M (Bronze Shelter from legacy)
    description: "Get assistance with housing and shelter needs",
    icon: "home",
    displayOrder: 2,
  },
  {
    name: "Land Palliative",
    slug: "land" as const,
    targetAmount: 5000000, // ₦5M
    description: "Land acquisition support for your future",
    icon: "map",
    displayOrder: 3,
  },
  {
    name: "Business Support Palliative",
    slug: "business" as const,
    targetAmount: 10000000, // ₦10M
    description: "Capital support to start or grow your business",
    icon: "briefcase",
    displayOrder: 4,
  },
  {
    name: "Education Palliative",
    slug: "education" as const,
    targetAmount: 20000000, // ₦20M
    description: "Educational funding for you or your family",
    icon: "graduation-cap",
    displayOrder: 5,
  },
  {
    name: "Solar Power Palliative",
    slug: "solar" as const,
    targetAmount: 5000000, // ₦5M
    description: "Clean energy solution for your home or business",
    icon: "sun",
    displayOrder: 6,
  },
] as const;
