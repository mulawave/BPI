import { prisma } from "@/lib/prisma";

/**
 * Finds the referral chain for a given user, up to a specified number of levels.
 * @param userId The ID of the user to start the search from.
 * @param maxLevels The maximum number of referral levels to traverse up.
 * @returns An array of User objects representing the referral chain, from L1 to L4.
 */
export async function getReferralChain(userId: string, maxLevels: number = 4): Promise<any[]> {
  const chain = [];
  let currentUserId = userId;

  for (let level = 1; level <= maxLevels; level++) {
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
  }

  return chain;
}
