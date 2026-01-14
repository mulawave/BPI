import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { TRPCError } from "@trpc/server";
import { randomUUID } from "crypto";

export const referralRouter = createTRPCRouter({
  getMyReferrals: protectedProcedure.query(async ({ ctx }) => {
    const session = ctx.session;
    const userId = (session!.user as any).id as string;

    // Get referrals made by this user
    const referrals = await ctx.prisma.$queryRaw`
      SELECT 
        r.id,
        r.status,
        r."rewardPaid",
        r."createdAt",
        u.name as referredUserName,
        u.email as referredUserEmail
      FROM "Referral" r
      JOIN "User" u ON r."referredId" = u.id
      WHERE r."referrerId" = ${userId}
      ORDER BY r."createdAt" DESC
    `;

    return { referrals };
  }),

  getReferralStats: protectedProcedure.query(async ({ ctx }) => {
    const session = ctx.session;
    const userId = (session!.user as any).id as string;

    // Get Level 1 referrals
    const level1Referrals = await ctx.prisma.referral.findMany({
      where: { referrerId: userId },
      select: { referredId: true, status: true, rewardPaid: true }
    });

    // Get Level 2 referrals
    const level1Ids = level1Referrals.map(r => r.referredId);
    const level2Referrals = level1Ids.length > 0 ? await ctx.prisma.referral.findMany({
      where: { referrerId: { in: level1Ids } },
      select: { referredId: true }
    }) : [];

    // Get Level 3 referrals
    const level2Ids = level2Referrals.map(r => r.referredId);
    const level3Referrals = level2Ids.length > 0 ? await ctx.prisma.referral.findMany({
      where: { referrerId: { in: level2Ids } },
      select: { referredId: true }
    }) : [];

    // Get Level 4 referrals
    const level3Ids = level3Referrals.map(r => r.referredId);
    const level4Referrals = level3Ids.length > 0 ? await ctx.prisma.referral.findMany({
      where: { referrerId: { in: level3Ids } },
      select: { referredId: true }
    }) : [];

    const totalreferrals = level1Referrals.length;
    const activereferrals = level1Referrals.filter(r => r.status === 'active').length;
    const paidreferrals = level1Referrals.filter(r => r.rewardPaid).length;

    return {
      totalreferrals,
      activereferrals,
      paidreferrals,
      level2Count: level2Referrals.length,
      level3Count: level3Referrals.length,
      level4Count: level4Referrals.length,
    };
  }),

  // Get recent referrals (last 5)
  getRecentReferrals: protectedProcedure.query(async ({ ctx }) => {
    const session = ctx.session;
    const userId = (session!.user as any).id as string;

    // Get last 5 referrals made by this user
    const referrals = await ctx.prisma.$queryRaw<Array<{
      id: string;
      status: string;
      createdAt: Date;
      referredUserName: string;
      referredUserEmail: string;
      image: string | null;
    }>>`
      SELECT 
        r.id,
        r.status,
        r."createdAt",
        u.name as "referredUserName",
        u.email as "referredUserEmail",
        u.image
      FROM "Referral" r
      JOIN "User" u ON r."referredId" = u.id
      WHERE r."referrerId" = ${userId}
      ORDER BY r."createdAt" DESC
      LIMIT 5
    `;

    return { referrals };
  }),

  // Get or generate encrypted referral link for the current user
  getMyReferralLink: protectedProcedure.query(async ({ ctx }) => {
    const session = ctx.session;
    const userId = (session!.user as any).id as string;
    
    // Get user data
    const user = await ctx.prisma.user.findUnique({
      where: { id: userId },
      select: { 
        id: true,
        referralLink: true,
        inviteCode: true
      }
    });
    
    if (!user) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "User not found"
      });
    }
    
    let inviteCode = user.inviteCode;
    
    // Generate unique encrypted invite code if user doesn't have one
    if (!inviteCode) {
      // Generate a secure 12-character alphanumeric code
      const characters = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Removed ambiguous chars
      inviteCode = '';
      for (let i = 0; i < 12; i++) {
        inviteCode += characters.charAt(Math.floor(Math.random() * characters.length));
      }
      
      // Ensure uniqueness
      let isUnique = false;
      let attempts = 0;
      while (!isUnique && attempts < 10) {
        const existing = await ctx.prisma.user.findUnique({
          where: { inviteCode }
        });
        if (!existing) {
          isUnique = true;
        } else {
          // Generate new code if collision
          inviteCode = '';
          for (let i = 0; i < 12; i++) {
            inviteCode += characters.charAt(Math.floor(Math.random() * characters.length));
          }
          attempts++;
        }
      }
      
      if (!isUnique) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to generate unique invite code"
        });
      }
      
      // Save the invite code and referral link to user
      const referralLink = `https://beepagro.com/register?ref=${inviteCode}`;
      
      await ctx.prisma.user.update({
        where: { id: userId },
        data: { 
          inviteCode,
          referralLink
        }
      });
      
      console.log(`[getMyReferralLink] Generated and saved inviteCode: ${inviteCode} for user: ${userId}`);
    } else {
      // Use existing invite code
      console.log(`[getMyReferralLink] Using existing inviteCode: ${inviteCode} for user: ${userId}`);
    }
    
    // Generate referral link from invite code
    const referralLink = `https://beepagro.com/register?ref=${inviteCode}`;
    
    return {
      referralLink,
      inviteCode
    };
  }),

  // Get daily invite usage count
  getDailyInviteCount: protectedProcedure.query(async ({ ctx }) => {
    const session = ctx.session;
    const userId = (session!.user as any).id as string;
    
    // Get today's date in YYYY-MM-DD format
    const today = new Date().toISOString().split('T')[0];
    
    const usage = await ctx.prisma.inviteUsage.findUnique({
      where: {
        userId_date: {
          userId,
          date: today!
        }
      }
    });
    
    const used = usage?.count || 0;
    const remaining = Math.max(0, 10 - used);
    
    return {
      used,
      remaining,
      total: 10,
      canSend: remaining > 0
    };
  }),

  // Send referral invite
  sendReferralInvite: protectedProcedure
    .input(z.object({
      firstname: z.string().min(1, "First name is required"),
      lastname: z.string().min(1, "Last name is required"),
      email: z.string().email("Invalid email address")
    }))
    .mutation(async ({ ctx, input }) => {
      const session = ctx.session;
      const userId = (session!.user as any).id as string;
      const { firstname, lastname, email } = input;
      
      // 1. Check BPT balance
      const user = await ctx.prisma.user.findUnique({
        where: { id: userId },
        select: { bpiTokenWallet: true, email: true, name: true }
      });
      
      if (!user) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "User not found"
        });
      }
      
      if (user.bpiTokenWallet < 0.5) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Insufficient BPT balance. You need at least 0.5 BPT to send an invite."
        });
      }
      
      // 2. Check daily limit
      const today = new Date().toISOString().split('T')[0];
      const usage = await ctx.prisma.inviteUsage.findUnique({
        where: {
          userId_date: {
            userId,
            date: today!
          }
        }
      });
      
      if (usage && usage.count >= 10) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Daily invite limit reached (10 invites per day). Try again tomorrow."
        });
      }
      
      // 3. Check if contact already exists
      const existingContact = await ctx.prisma.contact.findUnique({
        where: {
          userId_email: {
            userId,
            email
          }
        }
      });
      
      // 4. Deduct BPT
      await ctx.prisma.user.update({
        where: { id: userId },
        data: {
          bpiTokenWallet: {
            decrement: 0.5
          }
        }
      });
      
      // 5. Create or update contact record
      if (existingContact) {
        // Update existing contact with new invite date
        await ctx.prisma.contact.update({
          where: {
            userId_email: {
              userId,
              email
            }
          },
          data: {
            dateInvited: new Date(),
            bptSpent: {
              increment: 0.5
            }
          }
        });
      } else {
        // Create new contact
        await ctx.prisma.contact.create({
          data: {
            id: randomUUID(),
            updatedAt: new Date(),
            userId,
            firstname,
            lastname,
            email,
            bptSpent: 0.5
          }
        });
      }
      
      // 6. Update daily invite counter
      if (usage) {
        await ctx.prisma.inviteUsage.update({
          where: {
            userId_date: {
              userId,
              date: today!
            }
          },
          data: {
            count: {
              increment: 1
            }
          }
        });
      } else {
        await ctx.prisma.inviteUsage.create({
          data: {
            id: randomUUID(),
            updatedAt: new Date(),
            userId,
            date: today!,
            count: 1
          }
        });
      }
      
      // 7. Send email (console.log for now - will use SMTP later)
      console.log(`
╔════════════════════════════════════════════════════════════════╗
║                  BPI REFERRAL INVITE EMAIL                     ║
╠════════════════════════════════════════════════════════════════╣
║ To: ${email.padEnd(57)}║
║ From: ${user.email?.padEnd(55)}║
║ Subject: ${`${user.name} invited you to join BPI!`.padEnd(47)}║
╠════════════════════════════════════════════════════════════════╣
║ Hi ${firstname} ${lastname},                                   
║                                                                ║
║ ${user.name} has invited you to join the BPI community!       
║                                                                ║
║ Click the link below to register:                             ║
║ https://bpi.beepagro.com/register?ref=${userId}                
║                                                                ║
║ Best regards,                                                  ║
║ The BPI Team                                                   ║
╚════════════════════════════════════════════════════════════════╝
      `);
      
      return {
        success: true,
        message: existingContact 
          ? `Invite resent to ${email}. 0.5 BPT deducted.`
          : `Invite sent to ${email}. Contact added. 0.5 BPT deducted.`,
        isResend: !!existingContact
      };
    }),

  // Get detailed referral tree with all levels
  getDetailedReferralTree: protectedProcedure.query(async ({ ctx }) => {
    const session = ctx.session;
    const userId = (session!.user as any).id as string;

    // Get Level 1 referrals with full details
    const level1Referrals = await ctx.prisma.referral.findMany({
      where: { referrerId: userId },
      select: {
        id: true,
        referredId: true,
        createdAt: true,
        status: true,
      }
    });

    // Get Level 2 referrals
    const level1Ids = level1Referrals.map(r => r.referredId);
    const level2Referrals = level1Ids.length > 0 ? await ctx.prisma.referral.findMany({
      where: { referrerId: { in: level1Ids } },
      select: {
        id: true,
        referredId: true,
        createdAt: true,
        status: true,
      }
    }) : [];

    // Get Level 3 referrals
    const level2Ids = level2Referrals.map(r => r.referredId);
    const level3Referrals = level2Ids.length > 0 ? await ctx.prisma.referral.findMany({
      where: { referrerId: { in: level2Ids } },
      select: {
        id: true,
        referredId: true,
        createdAt: true,
        status: true,
      }
    }) : [];

    // Get Level 4 referrals
    const level3Ids = level3Referrals.map(r => r.referredId);
    const level4Referrals = level3Ids.length > 0 ? await ctx.prisma.referral.findMany({
      where: { referrerId: { in: level3Ids } },
      select: {
        id: true,
        referredId: true,
        createdAt: true,
        status: true,
      }
    }) : [];

    // Fetch all user details
    const allReferralIds = [
      ...level1Referrals.map(r => r.referredId),
      ...level2Referrals.map(r => r.referredId),
      ...level3Referrals.map(r => r.referredId),
      ...level4Referrals.map(r => r.referredId)
    ];

    const usersData = await ctx.prisma.user.findMany({
      where: { id: { in: allReferralIds } },
      select: {
        id: true,
        name: true,
        firstname: true,
        lastname: true,
        email: true,
        mobile: true,
        image: true,
        createdAt: true,
        activeMembershipPackageId: true,
        membershipExpiresAt: true,
      }
    });

    const usersMap = new Map(usersData.map(u => [u.id, u]));

    // Fetch membership packages for users who have active memberships
    const packageIds = [...new Set(usersData.map(u => u.activeMembershipPackageId).filter(Boolean))] as string[];
    const packages = await ctx.prisma.membershipPackage.findMany({
      where: { id: { in: packageIds } },
      select: { id: true, name: true, price: true, vat: true }
    });
    const packagesMap = new Map(packages.map(p => [p.id, p]));

    // Check which referrals are already contacts
    const existingContacts = await ctx.prisma.contact.findMany({
      where: {
        userId,
        email: { in: usersData.map(u => u.email).filter(Boolean) as string[] }
      },
      select: { email: true }
    });

    const contactEmails = new Set(existingContacts.map(c => c.email));

    // Helper to calculate sub-tree for a user
    const getSubTree = async (referralUserId: string, maxDepth: number) => {
      if (maxDepth === 0) return { level1Count: 0, level2Count: 0, level3Count: 0, totalCount: 0 };

      const l1 = await ctx.prisma.referral.findMany({
        where: { referrerId: referralUserId },
        select: { referredId: true }
      });

      const l1Ids = l1.map(r => r.referredId);
      const l2 = maxDepth > 1 && l1Ids.length > 0 ? await ctx.prisma.referral.findMany({
        where: { referrerId: { in: l1Ids } },
        select: { referredId: true }
      }) : [];

      const l2Ids = l2.map(r => r.referredId);
      const l3 = maxDepth > 2 && l2Ids.length > 0 ? await ctx.prisma.referral.findMany({
        where: { referrerId: { in: l2Ids } },
        select: { referredId: true }
      }) : [];

      return {
        level1Count: l1.length,
        level2Count: l2.length,
        level3Count: l3.length,
        totalCount: l1.length + l2.length + l3.length
      };
    };

    // Get earnings from each referral (total rewards earned from their package activation)
    const getEarningsFromReferral = async (referralUserId: string, level: number) => {
      console.log(`🔍 Searching earnings for referral ${referralUserId} at level ${level} for user ${userId}`);
      
      // Query for new normalized format only (REFERRAL_CASH_L*, REFERRAL_PALLIATIVE_L*, etc.)
      const transactions = await ctx.prisma.transaction.findMany({
        where: {
          userId,
          OR: [
            { transactionType: `REFERRAL_CASH_L${level}` },
            { transactionType: `REFERRAL_PALLIATIVE_L${level}` },
            { transactionType: `REFERRAL_CASHBACK_L${level}` },
            { transactionType: `REFERRAL_BPT_L${level}` },
          ],
          description: {
            contains: `Referral ID: ${referralUserId}`
          }
        },
        select: { amount: true, transactionType: true, description: true }
      });

      console.log(`✅ Found ${transactions.length} transactions:`, transactions.map(t => ({ type: t.transactionType, amount: t.amount, desc: t.description.substring(0, 50) })));

      return transactions.reduce((sum, t) => sum + t.amount, 0);
    };

    // Get detailed earnings breakdown by wallet type
    const getEarningsBreakdown = async (referralUserId: string, level: number) => {
      console.log(`📊 Getting earnings breakdown for referral ${referralUserId} at level ${level}`);
      
      const cashTransactions = await ctx.prisma.transaction.findMany({
        where: {
          userId,
          transactionType: `REFERRAL_CASH_L${level}`,
          description: { contains: `Referral ID: ${referralUserId}` }
        },
        select: { amount: true, description: true }
      });
      console.log(`  💵 Cash: Found ${cashTransactions.length} transactions, total: ${cashTransactions.reduce((s, t) => s + t.amount, 0)}`);

      const palliativeTransactions = await ctx.prisma.transaction.findMany({
        where: {
          userId,
          transactionType: `REFERRAL_PALLIATIVE_L${level}`,
          description: { contains: `Referral ID: ${referralUserId}` }
        },
        select: { amount: true }
      });
      console.log(`  🏥 Palliative: Found ${palliativeTransactions.length} transactions, total: ${palliativeTransactions.reduce((s, t) => s + t.amount, 0)}`);

      const cashbackTransactions = await ctx.prisma.transaction.findMany({
        where: {
          userId,
          transactionType: `REFERRAL_CASHBACK_L${level}`,
          description: { contains: `Referral ID: ${referralUserId}` }
        },
        select: { amount: true }
      });
      console.log(`  💰 Cashback: Found ${cashbackTransactions.length} transactions, total: ${cashbackTransactions.reduce((s, t) => s + t.amount, 0)}`);

      const bptTransactions = await ctx.prisma.transaction.findMany({
        where: {
          userId,
          transactionType: `REFERRAL_BPT_L${level}`,
          description: { contains: `Referral ID: ${referralUserId}` }
        },
        select: { amount: true }
      });
      console.log(`  🪙 BPT: Found ${bptTransactions.length} transactions, total: ${bptTransactions.reduce((s, t) => s + t.amount, 0)}`);

      return {
        cash: cashTransactions.reduce((sum, t) => sum + t.amount, 0),
        palliative: palliativeTransactions.reduce((sum, t) => sum + t.amount, 0),
        cashback: cashbackTransactions.reduce((sum, t) => sum + t.amount, 0),
        bpt: bptTransactions.reduce((sum, t) => sum + t.amount, 0),
      };
    };

    // Process level 1 with sub-trees
    const level1Data = await Promise.all(
      level1Referrals.map(async (ref) => {
        const user = usersMap.get(ref.referredId);
        if (!user) return null;
        const subTree = await getSubTree(user.id, 3); // L1 can see their L1-L3 (user's L2-L4)
        const earningsFromThisReferral = await getEarningsFromReferral(user.id, 1);
        const earningsBreakdown = await getEarningsBreakdown(user.id, 1);
        const pkg = user.activeMembershipPackageId ? packagesMap.get(user.activeMembershipPackageId) : null;

        return {
          ...user,
          isContact: user.email ? contactEmails.has(user.email) : false,
          activeMembership: !!user.activeMembershipPackageId,
          membershipPackage: pkg ? pkg.name : 'None',
          membershipPackagePrice: pkg ? pkg.price + pkg.vat : 0,
          membershipExpired: user.membershipExpiresAt ? new Date(user.membershipExpiresAt) < new Date() : false,
          membershipExpiringSoon: user.membershipExpiresAt 
            ? new Date(user.membershipExpiresAt) < new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) 
            : false,
          totalReferrals: subTree.totalCount,
          subTree,
          earningsFromThisReferral,
          earningsBreakdown
        };
      })
    ).then(results => results.filter(r => r !== null));

    // Process level 2 with sub-trees
    const level2Data = await Promise.all(
      level2Referrals.map(async (ref) => {
        const user = usersMap.get(ref.referredId);
        if (!user) return null;
        const subTree = await getSubTree(user.id, 2); // L2 can see their L1-L2 (user's L3-L4)
        const earningsFromThisReferral = await getEarningsFromReferral(user.id, 2);
        const earningsBreakdown = await getEarningsBreakdown(user.id, 2);
        const pkg = user.activeMembershipPackageId ? packagesMap.get(user.activeMembershipPackageId) : null;

        return {
          ...user,
          isContact: user.email ? contactEmails.has(user.email) : false,
          activeMembership: !!user.activeMembershipPackageId,
          membershipPackage: pkg ? pkg.name : 'None',
          membershipPackagePrice: pkg ? pkg.price + pkg.vat : 0,
          membershipExpired: user.membershipExpiresAt ? new Date(user.membershipExpiresAt) < new Date() : false,
          membershipExpiringSoon: user.membershipExpiresAt 
            ? new Date(user.membershipExpiresAt) < new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) 
            : false,
          totalReferrals: subTree.totalCount,
          subTree,
          earningsFromThisReferral,
          earningsBreakdown
        };
      })
    ).then(results => results.filter(r => r !== null));

    // Process level 3 with sub-trees
    const level3Data = await Promise.all(
      level3Referrals.map(async (ref) => {
        const user = usersMap.get(ref.referredId);
        if (!user) return null;
        const subTree = await getSubTree(user.id, 1); // L3 can see their L1 only (user's L4)
        const earningsFromThisReferral = await getEarningsFromReferral(user.id, 3);
        const earningsBreakdown = await getEarningsBreakdown(user.id, 3);
        const pkg = user.activeMembershipPackageId ? packagesMap.get(user.activeMembershipPackageId) : null;

        return {
          ...user,
          isContact: user.email ? contactEmails.has(user.email) : false,
          activeMembership: !!user.activeMembershipPackageId,
          membershipPackage: pkg ? pkg.name : 'None',
          membershipPackagePrice: pkg ? pkg.price + pkg.vat : 0,
          membershipExpired: user.membershipExpiresAt ? new Date(user.membershipExpiresAt) < new Date() : false,
          membershipExpiringSoon: user.membershipExpiresAt 
            ? new Date(user.membershipExpiresAt) < new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) 
            : false,
          totalReferrals: subTree.totalCount,
          subTree,
          earningsFromThisReferral,
          earningsBreakdown
        };
      })
    ).then(results => results.filter(r => r !== null));

    // Process level 4 (no sub-tree, can't go deeper)
    const level4Data = await Promise.all(
      level4Referrals.map(async (ref) => {
        const user = usersMap.get(ref.referredId);
        if (!user) return null;
        const earningsFromThisReferral = await getEarningsFromReferral(user.id, 4);
        const earningsBreakdown = await getEarningsBreakdown(user.id, 4);
        const pkg = user.activeMembershipPackageId ? packagesMap.get(user.activeMembershipPackageId) : null;

        return {
          ...user,
          isContact: user.email ? contactEmails.has(user.email) : false,
          activeMembership: !!user.activeMembershipPackageId,
          membershipPackage: pkg ? pkg.name : 'None',
          membershipPackagePrice: pkg ? pkg.price + pkg.vat : 0,
          membershipExpired: user.membershipExpiresAt ? new Date(user.membershipExpiresAt) < new Date() : false,
          membershipExpiringSoon: user.membershipExpiresAt 
            ? new Date(user.membershipExpiresAt) < new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) 
            : false,
          totalReferrals: 0,
          subTree: { level1Count: 0, level2Count: 0, level3Count: 0, totalCount: 0 },
          earningsFromThisReferral,
          earningsBreakdown
        };
      })
    ).then(results => results.filter(r => r !== null));

    // Calculate summary stats
    const totalReferrals = level1Data.length + level2Data.length + level3Data.length + level4Data.length;
    const activeMembers = [
      ...level1Data.filter(u => u.activeMembership),
      ...level2Data.filter(u => u.activeMembership),
      ...level3Data.filter(u => u.activeMembership),
      ...level4Data.filter(u => u.activeMembership)
    ].length;
    const pendingActivations = totalReferrals - activeMembers;
    
    // Calculate earnings breakdown
    const allEarningsBreakdowns = [
      ...level1Data.map(u => u.earningsBreakdown),
      ...level2Data.map(u => u.earningsBreakdown),
      ...level3Data.map(u => u.earningsBreakdown),
      ...level4Data.map(u => u.earningsBreakdown)
    ];
    
    const totalCashEarnings = allEarningsBreakdowns.reduce((sum, b) => sum + (b?.cash || 0), 0);
    const totalPalliativeEarnings = allEarningsBreakdowns.reduce((sum, b) => sum + (b?.palliative || 0), 0);
    const totalCashbackEarnings = allEarningsBreakdowns.reduce((sum, b) => sum + (b?.cashback || 0), 0);
    const totalBptEarnings = allEarningsBreakdowns.reduce((sum, b) => sum + (b?.bpt || 0), 0);
    const totalEarnings = totalCashEarnings + totalPalliativeEarnings + totalCashbackEarnings;

    return {
      level1: level1Data,
      level2: level2Data,
      level3: level3Data,
      level4: level4Data,
      level1Count: level1Data.length,
      level2Count: level2Data.length,
      level3Count: level3Data.length,
      level4Count: level4Data.length,
      totalReferrals,
      activeMembers,
      pendingActivations,
      totalEarnings,
      totalCashEarnings,
      totalPalliativeEarnings,
      totalCashbackEarnings,
      totalBptEarnings
    };
  }),

  // Convert referral to contact
  convertReferralToContact: protectedProcedure
    .input(z.object({
      referralUserId: z.string(),
      name: z.string(),
      email: z.string()
    }))
    .mutation(async ({ ctx, input }) => {
      const session = ctx.session;
      const userId = (session!.user as any).id as string;

      // Check if already a contact
      const existingContact = await ctx.prisma.contact.findFirst({
        where: {
          userId,
          email: input.email
        }
      });

      if (existingContact) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'This person is already in your contacts'
        });
      }

      // Check BPT balance
      const user = await ctx.prisma.user.findUnique({
        where: { id: userId },
        select: { bpiTokenWallet: true }
      });

      if (!user || user.bpiTokenWallet < 0.75) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Insufficient BPT balance. You need 0.75 BPT to convert a referral to a contact.'
        });
      }

      // Deduct 0.75 BPT
      await ctx.prisma.user.update({
        where: { id: userId },
        data: {
          bpiTokenWallet: {
            decrement: 0.75
          }
        }
      });

      // Create transaction record for BPT deduction
      await ctx.prisma.transaction.create({
        data: {
          id: randomUUID(),
          userId,
          transactionType: 'CONVERT_TO_CONTACT',
          amount: -0.75,
          description: `Converted ${input.name} to contact`,
          status: 'completed',
          reference: `CONTACT-${Date.now()}`,
          walletType: 'bpiToken',
        }
      });

      // Split name into firstname and lastname
      const [firstname, ...lastnameParts] = input.name.split(' ');
      const lastname = lastnameParts.join(' ') || firstname;

      // Create contact
      await ctx.prisma.contact.create({
        data: {
          id: randomUUID(),
          updatedAt: new Date(),
          userId,
          firstname,
          lastname,
          email: input.email,
          bpiMembershipStatus: 'Registered',
          profileSetup: true,
          bptSpent: 0.75
        }
      });

      // Record transaction (update user's BPT balance was already done above)
      // Note: Transaction table doesn't have currency field, only amount

      return {
        success: true,
        message: `${input.name} has been added to your contacts! 0.75 BPT deducted.`
      };
    }),

  // Send activation reminder
  sendActivationReminder: protectedProcedure
    .input(z.object({
      userId: z.string()
    }))
    .mutation(async ({ ctx, input }) => {
      const session = ctx.session;
      const senderId = (session!.user as any).id as string;

      const sender = await ctx.prisma.user.findUnique({
        where: { id: senderId },
        select: { name: true, email: true }
      });

      const recipient = await ctx.prisma.user.findUnique({
        where: { id: input.userId },
        select: { name: true, email: true }
      });

      if (!recipient) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'User not found'
        });
      }

      // Log notification (in production, send actual email/SMS)
      console.log(`
╔════════════════════════════════════════════════════════════════╗
║                ACTIVATION REMINDER NOTIFICATION                ║
╠════════════════════════════════════════════════════════════════╣
║ To: ${recipient.email?.padEnd(57)}║
║ From: ${sender?.email?.padEnd(55)}║
╠════════════════════════════════════════════════════════════════╣
║ Hi ${recipient.name},                                          
║                                                                ║
║ ${sender?.name} wanted to remind you to activate your         
║ BPI membership to start enjoying all the benefits!            
║                                                                ║
║ Visit https://bpi.beepagro.com/membership to get started.     
║                                                                ║
║ Best regards,                                                  ║
║ The BPI Team                                                   ║
╚════════════════════════════════════════════════════════════════╝
      `);

      return {
        success: true,
        message: `Activation reminder sent to ${recipient.name}`
      };
    }),

  // Admin endpoint to fix referral IDs in transactions
  fixReferralTransactions: protectedProcedure
    .mutation(async ({ ctx }) => {
      const session = ctx.session;
      const userId = (session!.user as any).id as string;

      // Find transactions with "unknown" referral ID for this user
      const unknownTransactions = await ctx.prisma.transaction.findMany({
        where: {
          userId,
          description: { contains: 'Referral ID: unknown' },
        },
      });

      if (unknownTransactions.length === 0) {
        return {
          success: true,
          message: 'No transactions to fix',
          updated: 0,
        };
      }

      // Find the user's referrals (who they referred)
      const referrals = await ctx.prisma.user.findMany({
        where: { referredBy: userId },
        select: { id: true, firstname: true, lastname: true, email: true },
        orderBy: { createdAt: 'asc' },
      });

      if (referrals.length === 0) {
        return {
          success: false,
          message: 'No referrals found to associate with transactions',
          updated: 0,
        };
      }

      // Use the first referral as the one who activated
      const actualReferral = referrals[0];
      
      let updated = 0;
      for (const tx of unknownTransactions) {
        const newDescription = tx.description
          .replace('Referral ID: unknown', `Referral ID: ${actualReferral.id}`)
          .replace('by Unknown User', `by ${actualReferral.firstname} ${actualReferral.lastname}`);

        await ctx.prisma.transaction.update({
          where: { id: tx.id },
          data: { description: newDescription },
        });

        updated++;
      }

      return {
        success: true,
        message: `Updated ${updated} transactions with referral: ${actualReferral.firstname} ${actualReferral.lastname}`,
        updated,
        referralId: actualReferral.id,
      };
    }),

  // Option 2: Remove a contact so you can re-add them (for testing)
  removeContact: protectedProcedure
    .input(z.object({
      email: z.string().email()
    }))
    .mutation(async ({ ctx, input }) => {
      const session = ctx.session;
      const userId = (session!.user as any).id as string;

      // Find the contact
      const contact = await ctx.prisma.contact.findFirst({
        where: {
          userId,
          email: input.email
        }
      });

      if (!contact) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Contact not found'
        });
      }

      // Refund the BPT that was spent
      await ctx.prisma.user.update({
        where: { id: userId },
        data: {
          bpiTokenWallet: {
            increment: contact.bptSpent
          }
        }
      });

      // Delete the contact
      await ctx.prisma.contact.delete({
        where: {
          userId_email: {
            userId,
            email: input.email
          }
        }
      });

      // Also delete any CONVERT_TO_CONTACT transactions for this person
      await ctx.prisma.transaction.deleteMany({
        where: {
          userId,
          transactionType: 'CONVERT_TO_CONTACT',
          description: {
            contains: input.email
          }
        }
      });

      return {
        success: true,
        message: `Contact removed and ${contact.bptSpent} BPT refunded. You can now re-add them to test the transaction flow.`,
        refundedBpt: contact.bptSpent
      };
    }),
});