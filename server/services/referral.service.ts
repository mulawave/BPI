import { prisma } from "@/lib/prisma";

/**
 * Finds the referral chain for a given user, up to a specified number of levels.
 * @param userId The ID of the user to start the search from.
 * @param maxLevels The maximum number of referral levels to traverse up (capped at 4).
 * @returns An array of User objects representing the referral chain, from L1 to L4.
 */
export async function getReferralChain(userId: string, maxLevels: number = 4): Promise<any[]> {
  try {
    // LEVEL CAP: Enforce maximum of 4 levels regardless of input
    const cappedMaxLevels = Math.min(maxLevels, 4);
    
    if (maxLevels > 4) {
      console.warn(`⚠️ getReferralChain called with maxLevels=${maxLevels}, capping at 4`);
    }

    const chain = [];
    let currentUserId = userId;

    for (let level = 1; level <= cappedMaxLevels; level++) {
      try {
        const referral = await prisma.referral.findFirst({
          where: { referredId: currentUserId },
          include: {
            User_Referral_referrerIdToUser: true,
          },
        });

        if (referral && referral.User_Referral_referrerIdToUser) {
          chain.push(referral.User_Referral_referrerIdToUser);
          currentUserId = referral.User_Referral_referrerIdToUser.id;
        } else {
          // No more referrers in the chain
          break;
        }
      } catch (levelError) {
        console.error(`❌ getReferralChain error at level ${level}:`, levelError);
        // Continue to next level or break on critical errors
        break;
      }
    }

    return chain;
  } catch (error) {
    console.error('❌ getReferralChain failed for userId:', userId, error);
    // Return empty chain instead of throwing - non-critical for most operations
    return [];
  }
}
