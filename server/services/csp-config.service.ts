import { prisma } from "@/lib/prisma";

/**
 * Corporate decision (follow-up Q11, 07/10/2026): the CSP "2x" minimum-
 * funding rule — a campaign must raise 2x a tier's contribution amount
 * before the close countdown is allowed to end — doubles the member's
 * TIER contribution amount, not their exact individual contribution.
 * Wired into the sweep via `decideCspBroadcastSweepAction` in
 * `server/jobs/cspBroadcastSweep.ts`, keyed off each request's own
 * `tierContributionRight` (set at submission time).
 */
export const CSP_TWO_X_RULE_BASE = "tier_contribution_amount" as const;

export interface TierConfig {
  /**
   * Master switch for the CSP tier model. Corporate decision (follow-up
   * Q12, 07/10/2026): stays off at this release; an admin switches it on
   * once tier values have been reviewed.
   */
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
  sponsorshipRequiresActive: boolean;
  sponsorshipMinContribution: number;
  badgeGiftingEnabled: boolean;
  blockExpiredMembers: boolean;
  holdReleaseForExpiredMembers: boolean;
  autoReleaseOnCountdownEnd: boolean;
}

export const TIER_CONFIG_DEFAULTS: TierConfig = {
  tierModelEnabled: false,
  contributionMultiplier: 20,
  minContributionRight: 10000,
  // Corporate decision (BPI-CSP "How It Works", 09/10/2026): KYC approval
  // and Auto-Debit/Auto-Contribute activation are baseline requirements to
  // unlock the Support Lifeline for every member, not just tier-based
  // requests — see computeEligibilityFlags in server/trpc/router/csp.ts.
  requireKyc: true,
  requireAutoDebit: true,
  requireAutoContribute: true,
  defaultBroadcastHours: 48,
  autoExtensionHours: 48,
  maxAutoExtensions: 3,
  // Corporate decision 29/09/2026: default waiting period 24 months; admins may
  // assign 12 or 6 when approving.
  defaultCoolingMonthsMin: 24,
  defaultCoolingMonthsMax: 24,
  // Corporate decision 29/09/2026: 10 sponsored members (adjustable), each with
  // KYC done and Regular Plus membership, reduce the wait to six months.
  sponsorshipRequiredCount: 10,
  sponsorshipReducedCoolingMonths: 6,
  sponsorshipRequiresKyc: true,
  sponsorshipRequiresRegularPlus: true,
  // Corporate decision 07/10/2026: the reduction applies automatically once
  // the member has the required number of direct sponsored members who are
  // Regular Plus or higher, KYC-verified, active and have contributed at
  // least ₦10,000 (Tier 1).
  sponsorshipAutoApply: true,
  sponsorshipRequiresActive: true,
  sponsorshipMinContribution: 10000,
  badgeGiftingEnabled: true,
  // Corporate decision 06/10/2026: a member whose membership has expired
  // cannot use CSP, and the release of their live campaign is held until they
  // renew.
  blockExpiredMembers: true,
  holdReleaseForExpiredMembers: true,
  // Corporate decision 06/10/2026: an admin releases campaigns when the
  // countdown ends; automatic release is an option, off by default.
  autoReleaseOnCountdownEnd: false,
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
  "csp_sponsorship_requires_active",
  "csp_sponsorship_min_contribution",
  "csp_badge_gifting_enabled",
  "csp_block_expired_members",
  "csp_hold_release_expired_members",
  "csp_auto_release_on_countdown_end",
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
    sponsorshipRequiresActive: parseBoolSetting(m.get("csp_sponsorship_requires_active"), TIER_CONFIG_DEFAULTS.sponsorshipRequiresActive),
    sponsorshipMinContribution: parseIntSetting(m.get("csp_sponsorship_min_contribution"), TIER_CONFIG_DEFAULTS.sponsorshipMinContribution),
    badgeGiftingEnabled: parseBoolSetting(m.get("csp_badge_gifting_enabled"), TIER_CONFIG_DEFAULTS.badgeGiftingEnabled),
    blockExpiredMembers: parseBoolSetting(m.get("csp_block_expired_members"), TIER_CONFIG_DEFAULTS.blockExpiredMembers),
    holdReleaseForExpiredMembers: parseBoolSetting(m.get("csp_hold_release_expired_members"), TIER_CONFIG_DEFAULTS.holdReleaseForExpiredMembers),
    autoReleaseOnCountdownEnd: parseBoolSetting(m.get("csp_auto_release_on_countdown_end"), TIER_CONFIG_DEFAULTS.autoReleaseOnCountdownEnd),
  };
}
