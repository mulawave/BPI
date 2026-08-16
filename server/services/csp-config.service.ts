import { prisma } from "@/lib/prisma";

export interface TierConfig {
  tierModelEnabled: boolean;
  contributionMultiplier: number;
  minContributionRight: number;
  requireKyc: boolean;
  requireAutoDebit: boolean;
  requireAutoContribute: boolean;
  defaultBroadcastHours: number;
  autoExtensionHours: number;
  maxAutoExtensions: number;
  defaultCoolingMonthsMin: number;
  defaultCoolingMonthsMax: number;
  sponsorshipRequiredCount: number;
  sponsorshipReducedCoolingMonths: number;
  sponsorshipRequiresKyc: boolean;
  sponsorshipRequiresRegularPlus: boolean;
  sponsorshipAutoApply: boolean;
  badgeGiftingEnabled: boolean;
}

export const TIER_CONFIG_DEFAULTS: TierConfig = {
  tierModelEnabled: false,
  contributionMultiplier: 20,
  minContributionRight: 10000,
  requireKyc: false,
  requireAutoDebit: false,
  requireAutoContribute: false,
  defaultBroadcastHours: 48,
  autoExtensionHours: 48,
  maxAutoExtensions: 3,
  defaultCoolingMonthsMin: 12,
  defaultCoolingMonthsMax: 24,
  sponsorshipRequiredCount: 100,
  sponsorshipReducedCoolingMonths: 6,
  sponsorshipRequiresKyc: false,
  sponsorshipRequiresRegularPlus: false,
  sponsorshipAutoApply: false,
  badgeGiftingEnabled: true,
};

const TIER_CONFIG_KEYS = [
  "csp_tier_model_enabled",
  "csp_contribution_multiplier",
  "csp_min_contribution_right",
  "csp_require_kyc",
  "csp_require_auto_debit",
  "csp_require_auto_contribute",
  "csp_default_broadcast_hours",
  "csp_auto_extension_hours",
  "csp_max_auto_extensions",
  "csp_default_cooling_months_min",
  "csp_default_cooling_months_max",
  "csp_sponsorship_required_count",
  "csp_sponsorship_reduced_cooling_months",
  "csp_sponsorship_requires_kyc",
  "csp_sponsorship_requires_regular_plus",
  "csp_sponsorship_auto_apply",
  "csp_badge_gifting_enabled",
];

function parseIntSetting(value: string | null | undefined, fallback: number) {
  const parsed = Number.parseInt(value ?? "", 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function parseBoolSetting(value: string | null | undefined, fallback: boolean) {
  if (value == null || value === "") return fallback;
  const normalized = value.trim().toLowerCase();
  if (["true", "1", "yes", "on"].includes(normalized)) return true;
  if (["false", "0", "no", "off"].includes(normalized)) return false;
  return fallback;
}

export async function loadTierConfig(db: typeof prisma = prisma): Promise<TierConfig> {
  const rows = await db.adminSettings.findMany({
    where: { settingKey: { in: TIER_CONFIG_KEYS } },
    select: { settingKey: true, settingValue: true },
  });

  const m = new Map(rows.map((r) => [r.settingKey, r.settingValue]));

  return {
    tierModelEnabled: parseBoolSetting(m.get("csp_tier_model_enabled"), TIER_CONFIG_DEFAULTS.tierModelEnabled),
    contributionMultiplier: parseIntSetting(m.get("csp_contribution_multiplier"), TIER_CONFIG_DEFAULTS.contributionMultiplier),
    minContributionRight: parseIntSetting(m.get("csp_min_contribution_right"), TIER_CONFIG_DEFAULTS.minContributionRight),
    requireKyc: parseBoolSetting(m.get("csp_require_kyc"), TIER_CONFIG_DEFAULTS.requireKyc),
    requireAutoDebit: parseBoolSetting(m.get("csp_require_auto_debit"), TIER_CONFIG_DEFAULTS.requireAutoDebit),
    requireAutoContribute: parseBoolSetting(m.get("csp_require_auto_contribute"), TIER_CONFIG_DEFAULTS.requireAutoContribute),
    defaultBroadcastHours: parseIntSetting(m.get("csp_default_broadcast_hours"), TIER_CONFIG_DEFAULTS.defaultBroadcastHours),
    autoExtensionHours: parseIntSetting(m.get("csp_auto_extension_hours"), TIER_CONFIG_DEFAULTS.autoExtensionHours),
    maxAutoExtensions: parseIntSetting(m.get("csp_max_auto_extensions"), TIER_CONFIG_DEFAULTS.maxAutoExtensions),
    defaultCoolingMonthsMin: parseIntSetting(m.get("csp_default_cooling_months_min"), TIER_CONFIG_DEFAULTS.defaultCoolingMonthsMin),
    defaultCoolingMonthsMax: parseIntSetting(m.get("csp_default_cooling_months_max"), TIER_CONFIG_DEFAULTS.defaultCoolingMonthsMax),
    sponsorshipRequiredCount: parseIntSetting(m.get("csp_sponsorship_required_count"), TIER_CONFIG_DEFAULTS.sponsorshipRequiredCount),
    sponsorshipReducedCoolingMonths: parseIntSetting(m.get("csp_sponsorship_reduced_cooling_months"), TIER_CONFIG_DEFAULTS.sponsorshipReducedCoolingMonths),
    sponsorshipRequiresKyc: parseBoolSetting(m.get("csp_sponsorship_requires_kyc"), TIER_CONFIG_DEFAULTS.sponsorshipRequiresKyc),
    sponsorshipRequiresRegularPlus: parseBoolSetting(m.get("csp_sponsorship_requires_regular_plus"), TIER_CONFIG_DEFAULTS.sponsorshipRequiresRegularPlus),
    sponsorshipAutoApply: parseBoolSetting(m.get("csp_sponsorship_auto_apply"), TIER_CONFIG_DEFAULTS.sponsorshipAutoApply),
    badgeGiftingEnabled: parseBoolSetting(m.get("csp_badge_gifting_enabled"), TIER_CONFIG_DEFAULTS.badgeGiftingEnabled),
  };
}
