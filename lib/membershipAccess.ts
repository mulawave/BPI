const DAY_IN_MS = 24 * 60 * 60 * 1000;

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
  now?: Date;
}) {
  const now = input.now ?? new Date();
  const hasMembershipPackage = Boolean(input.activeMembershipPackageId);
  const { expiresAt, derivedFromActivation } = deriveMembershipExpiry({
    membershipExpiresAt: input.membershipExpiresAt,
    membershipActivatedAt: input.membershipActivatedAt,
    renewalCycleDays: input.renewalCycleDays,
  });

  const membershipValid = hasMembershipPackage && !!expiresAt && expiresAt.getTime() > now.getTime();
  const daysUntilExpiry = expiresAt
    ? Math.ceil((expiresAt.getTime() - now.getTime()) / DAY_IN_MS)
    : null;

  return {
    hasMembershipPackage,
    effectiveMembershipExpiresAt: expiresAt,
    derivedFromActivation,
    membershipValid,
    daysUntilExpiry,
    isExpired: hasMembershipPackage && !!expiresAt && expiresAt.getTime() <= now.getTime(),
  };
}