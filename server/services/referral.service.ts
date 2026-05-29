import { prisma } from "@/lib/prisma";

/**
 * Finds the referral chain for a given user, up to a specified number of levels.
 * Uses a single 4-level self-join query + one batch user fetch instead of N sequential
 * findFirst() calls, reducing pool pressure from 4 connections down to 2 per call.
 *
 * @param userId The ID of the user to start the search from.
 * @param maxLevels The maximum number of referral levels to traverse up (capped at 4).
 * @returns An array of User objects representing the referral chain, from L1 to L4.
 */
export async function getReferralChain(userId: string, maxLevels: number = 4): Promise<any[]> {
  try {
    const cappedMaxLevels = Math.min(maxLevels, 4);

    if (maxLevels > 4) {
      console.warn(`⚠️ getReferralChain called with maxLevels=${maxLevels}, capping at 4`);
    }

    // Single query: 4-level self-join resolves the full chain at once.
    // LEFT JOINs mean missing levels return NULL rather than stopping the query.
    const rows = await prisma.$queryRaw<Array<{
      l1_id: string | null;
      l2_id: string | null;
      l3_id: string | null;
      l4_id: string | null;
    }>>`
      SELECT
        l1."referrerId"                                   AS l1_id,
        l2."referrerId"                                   AS l2_id,
        l3."referrerId"                                   AS l3_id,
        l4."referrerId"                                   AS l4_id
      FROM "Referral" l1
      LEFT JOIN "Referral" l2 ON l2."referredId" = l1."referrerId"
      LEFT JOIN "Referral" l3 ON l3."referredId" = l2."referrerId"
      LEFT JOIN "Referral" l4 ON l4."referredId" = l3."referrerId"
      WHERE l1."referredId" = ${userId}
      LIMIT 1
    `;

    if (!rows.length) return [];

    const row = rows[0];
    const orderedIds = ([row.l1_id, row.l2_id, row.l3_id, row.l4_id] as (string | null)[])
      .slice(0, cappedMaxLevels)
      .filter((id): id is string => !!id);

    if (!orderedIds.length) return [];

    // Single batch fetch for all referrer users in the chain
    const users = await prisma.user.findMany({ where: { id: { in: orderedIds } } });
    const usersById = new Map(users.map((u) => [u.id, u]));

    return orderedIds.map((id) => usersById.get(id)).filter(Boolean);
  } catch (error) {
    console.error('❌ getReferralChain failed for userId:', userId, error);
    return [];
  }
}
