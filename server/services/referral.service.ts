import { prisma } from "@/lib/prisma";

const REFERRAL_CHAIN_TTL_MS = 30_000;

const referralChainCache = new Map<string, { expiresAt: number; value: any[] }>();
const referralChainInFlight = new Map<string, Promise<any[]>>();

function isFresh(expiresAt: number) {
  return expiresAt > Date.now();
}

/**
 * Finds the referral chain for a given user, up to a specified number of levels.
 * Uses short TTL cache + in-flight dedupe to avoid query storms under burst traffic.
 *
 * @param userId The ID of the user to start the search from.
 * @param maxLevels The maximum number of referral levels to traverse up (capped at 4).
 * @returns An array of User objects representing the referral chain, from L1 to L4.
 */
export async function getReferralChain(userId: string, maxLevels: number = 4): Promise<any[]> {
  const cappedMaxLevels = Math.min(maxLevels, 4);
  const cacheKey = `${userId}:${cappedMaxLevels}`;

  const cached = referralChainCache.get(cacheKey);
  if (cached && isFresh(cached.expiresAt)) {
    return cached.value;
  }

  const inFlight = referralChainInFlight.get(cacheKey);
  if (inFlight) {
    return inFlight;
  }

  const request = (async () => {
    try {
    if (maxLevels > 4) {
      console.warn(`⚠️ getReferralChain called with maxLevels=${maxLevels}, capping at 4`);
    }

    const orderedIds: string[] = [];
    let currentUserId: string | null = userId;

    // Walk up the chain with bounded depth and cycle protection.
    for (let i = 0; i < cappedMaxLevels; i++) {
      if (!currentUserId) break;

      const referral: { referrerId: string | null } | null = await prisma.referral.findFirst({
        where: { referredId: currentUserId },
        select: { referrerId: true },
      });

      const nextReferrerId: string | null = referral?.referrerId ?? null;
      if (!nextReferrerId) break;
      if (orderedIds.includes(nextReferrerId)) break;

      orderedIds.push(nextReferrerId);
      currentUserId = nextReferrerId;
    }

    if (!orderedIds.length) return [];

    // Batch fetch all users in one query, then restore chain order.
    const users = await prisma.user.findMany({ where: { id: { in: orderedIds } } });
    const usersById = new Map(users.map((u) => [u.id, u]));
    const chain: any[] = orderedIds.map((id) => usersById.get(id)).filter(Boolean) as any[];

    referralChainCache.set(cacheKey, {
      expiresAt: Date.now() + REFERRAL_CHAIN_TTL_MS,
      value: chain,
    });

    return chain;
    } catch (error) {
      console.error('❌ getReferralChain failed for userId:', userId, error);
      return [];
    }
  })().finally(() => {
    referralChainInFlight.delete(cacheKey);
  });

  referralChainInFlight.set(cacheKey, request);
  return request;
}
