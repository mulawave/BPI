import { DEFAULT_MEMBERSHIP_GRACE_DAYS } from "@/lib/membershipAccess";

type SettingsReader = {
  adminSettings: { findUnique(args: { where: { settingKey: string } }): Promise<{ settingValue: string } | null> };
};

/** Grace period (days) after membership expiry, from the `membership_grace_days` admin setting. */
export async function loadMembershipGraceDays(db: SettingsReader): Promise<number> {
  try {
    const row = await db.adminSettings.findUnique({ where: { settingKey: "membership_grace_days" } });
    const value = Number(row?.settingValue);
    return Number.isFinite(value) && value >= 0 ? value : DEFAULT_MEMBERSHIP_GRACE_DAYS;
  } catch {
    return DEFAULT_MEMBERSHIP_GRACE_DAYS;
  }
}
