type BroadcastVisibilityCandidate = {
  status: string;
  isAdminDefault?: boolean | null;
  isActive?: boolean | null;
  broadcastExpiresAt?: Date | string | null;
};

export type CspBroadcastHiddenReason =
  | "inactive"
  | "not_broadcasting"
  | "missing_expiry"
  | "expired";

function resolveTimestamp(value: Date | string | null | undefined) {
  if (!value) return null;
  const timestamp = new Date(value).getTime();
  return Number.isFinite(timestamp) ? timestamp : null;
}

export function getCspBroadcastHiddenReason(
  candidate: BroadcastVisibilityCandidate,
  now: Date = new Date(),
): CspBroadcastHiddenReason | null {
  if (!candidate.isActive) return "inactive";
  if (candidate.status !== "broadcasting") return "not_broadcasting";
  if (candidate.isAdminDefault) return null;

  const expiresAt = resolveTimestamp(candidate.broadcastExpiresAt);
  if (expiresAt === null) return "missing_expiry";
  if (expiresAt <= now.getTime()) return "expired";
  return null;
}

export function isCspBroadcastVisible(
  candidate: BroadcastVisibilityCandidate,
  now: Date = new Date(),
) {
  return getCspBroadcastHiddenReason(candidate, now) === null;
}