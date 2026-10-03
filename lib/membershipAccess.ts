const DAY_IN_MS = 24 * 60 * 60 * 1000;

/**
 * Days a member keeps access after their membership expires while renewal is
 * outstanding (corporate decision, 29/09/2026). Admins can override it with
 * the `membership_grace_days` setting; callers pass the loaded value.
 */
export const DEFAULT_MEMBERSHIP_GRACE_DAYS = 15;

type MaybeDate = Date | string | null | undefined;

function toValidDate(value: MaybeDate): Date | null {
  if (!value) return null;
  const parsed = value instanceof Date ? value : new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function deriveMembershipExpiry(input: {
  membershipExpiresAt?: MaybeDate;
  membershipActivatedAt?: MaybeDate;
  renewalCycleDays?: number | null;
}) {
  const explicitExpiry = toValidDate(input.membershipExpiresAt);
  if (explicitExpiry) {
    return {
      expiresAt: explicitExpiry,
      derivedFromActivation: false,
    };
  }

  const activatedAt = toValidDate(input.membershipActivatedAt);
  const renewalCycleDays = Number(input.renewalCycleDays ?? 0);

  if (!activatedAt || !Number.isFinite(renewalCycleDays) || renewalCycleDays <= 0) {
    return {
      expiresAt: null,
      derivedFromActivation: false,
    };
  }

  return {
    expiresAt: new Date(activatedAt.getTime() + renewalCycleDays * DAY_IN_MS),
    derivedFromActivation: true,
  };
}

export function evaluateMembershipAccess(input: {
  activeMembershipPackageId?: string | null;
  membershipExpiresAt?: MaybeDate;
  membershipActivatedAt?: MaybeDate;
  renewalCycleDays?: number | null;
  graceDays?: number | null;
  now?: Date;
}) {
  const now = input.now ?? new Date();
  const graceDays = Number.isFinite(Number(input.graceDays)) && Number(input.graceDays) >= 0
    ? Number(input.graceDays)
    : DEFAULT_MEMBERSHIP_GRACE_DAYS;
  const hasMembershipPackage = Boolean(input.activeMembershipPackageId);
  const { expiresAt, derivedFromActivation } = deriveMembershipExpiry({
    membershipExpiresAt: input.membershipExpiresAt,
    membershipActivatedAt: input.membershipActivatedAt,
    renewalCycleDays: input.renewalCycleDays,
  });

  const graceEndsAt = expiresAt ? new Date(expiresAt.getTime() + graceDays * DAY_IN_MS) : null;
  const isExpired = hasMembershipPackage && !!expiresAt && expiresAt.getTime() <= now.getTime();
  // Access continues through the grace period after expiry, then stops until renewal.
  const membershipValid = hasMembershipPackage && !!graceEndsAt && graceEndsAt.getTime() > now.getTime();
  const inGracePeriod = membershipValid && isExpired;
  const daysUntilExpiry = expiresAt
    ? Math.ceil((expiresAt.getTime() - now.getTime()) / DAY_IN_MS)
    : null;

  return {
    hasMembershipPackage,
    effectiveMembershipExpiresAt: expiresAt,
    derivedFromActivation,
    membershipValid,
    daysUntilExpiry,
    isExpired,
    inGracePeriod,
    graceEndsAt,
    graceDays,
  };
}