import { z } from "zod";
import { createTRPCRouter, protectedProcedure, publicProcedure } from "../trpc";
import { TRPCError } from "@trpc/server";

// Extend the session user type to include id
type SessionUser = {
  id: string;
  email?: string | null;
  name?: string | null;
  image?: string | null;
};

export const legacyRouter = createTRPCRouter({
  // === USER MANAGEMENT ===
  
  // Get user with all legacy fields
  getUserProfile: protectedProcedure
    .query(async ({ ctx }) => {
      const userId = (ctx.session?.user as SessionUser)?.id;
      if (!userId) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "User not authenticated"
        });
      }

      const user = await ctx.prisma.user.findUnique({
        where: { id: userId }
      });

      if (!user) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "User not found"
        });
      }

      return user;
    }),

  // Update user profile fields
  updateUserProfile: protectedProcedure
    .input(z.object({
      fieldKey: z.string(),
      value: z.string()
    }))
    .mutation(async ({ ctx, input }) => {
      const userId = (ctx.session?.user as SessionUser)?.id;
      if (!userId) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "User not authenticated"
        });
      }

      // Define allowed fields that can be updated
      const allowedFields = ['name', 'firstname', 'lastname', 'email', 'mobile', 'address', 'city', 'state', 'country', 'gender', 'image'];
      
      if (!allowedFields.includes(input.fieldKey)) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Field not allowed for update"
        });
      }

      // Build update data
      let updateData: any = {};
      
      if (input.fieldKey === 'firstname' || input.fieldKey === 'lastname') {
        // Get current user to build full name
        const currentUser = await ctx.prisma.user.findUnique({
          where: { id: userId },
          select: { name: true, firstname: true, lastname: true }
        });
        
        const currentFirstname = currentUser?.firstname || '';
        const currentLastname = currentUser?.lastname || '';
        
        if (input.fieldKey === 'firstname') {
          updateData.firstname = input.value;
          updateData.name = `${input.value} ${currentLastname}`.trim();
        } else {
          updateData.lastname = input.value;
          updateData.name = `${currentFirstname} ${input.value}`.trim();
        }
      } else {
        updateData[input.fieldKey] = input.value;
      }

      const updatedUser = await ctx.prisma.user.update({
        where: { id: userId },
        data: updateData
      });

      return updatedUser;
    }),

  // === WALLET MANAGEMENT ===
  
  // Get all wallet balances
  getWalletBalances: protectedProcedure
    .query(async ({ ctx }) => {
      const userId = (ctx.session?.user as SessionUser)?.id;
      if (!userId) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "User not authenticated"
        });
      }

      const user = await ctx.prisma.user.findUnique({
        where: { id: userId }
      });

      if (!user) {
        throw new TRPCError({
          code: "NOT_FOUND", 
          message: "User not found"
        });
      }

      // Mock wallet data until schema is fully updated
      return {
        ...user,
        totalAssets: 125000,
        wallet: 25000,
        spendable: 15000,
        palliative: 30000,
        cashback: 2500,
        community: 12000,
        shelter: 20000,
        education: 15000,
        assessment: 5500,
        // Additional wallet types from legacy BPI system
        student: 8000,
        land: 0,
        business: 0,
        solar: 0,
        car: 0,
        youtube: 1250,
        bpt: 0.00125000,
        health: 3500
      };
    }),

  // === REFERRAL SYSTEM ===
  
  // Get referral tree and statistics
  getReferralStats: protectedProcedure
    .query(async ({ ctx }) => {
      const userId = (ctx.session?.user as SessionUser)?.id;
      if (!userId) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "User not authenticated"
        });
      }

      // Get direct referrals
      const directReferrals = await ctx.prisma.user.findMany({
        where: { referredBy: userId },
        select: {
          id: true,
          name: true,
          email: true,
          createdAt: true
        }
      });

      return {
        referralCounts: {
          level1: directReferrals.length,
          level2: Math.floor(directReferrals.length * 2.5), // Mock downline
          level3: Math.floor(directReferrals.length * 1.8),
          level4: Math.floor(directReferrals.length * 1.2),
          total: Math.floor(directReferrals.length * 6.5)
        },
        directReferrals,
        referralLink: `https://bpi.com/register?ref=${userId}`
      };
    }),

  // === TRANSACTION MANAGEMENT ===
  
  // Get transaction history
  getTransactionHistory: protectedProcedure
    .input(z.object({
      limit: z.number().min(1).max(100).default(20)
    }))
    .query(async ({ ctx, input }) => {
      const userId = (ctx.session?.user as SessionUser)?.id;
      if (!userId) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "User not authenticated"
        });
      }

      // Mock transaction data until we have the proper model
      return [
        {
          id: "1",
          transactionType: "Commission",
          description: "Level 1 referral bonus",
          amount: "5000",
          status: "successful",
          createdAt: new Date(Date.now() - 86400000) // 1 day ago
        },
        {
          id: "2", 
          transactionType: "Wallet Funding",
          description: "Account credit",
          amount: "25000",
          status: "successful", 
          createdAt: new Date(Date.now() - 172800000) // 2 days ago
        },
        {
          id: "3",
          transactionType: "Palliative Bonus",
          description: "Monthly palliative reward",
          amount: "8000",
          status: "pending",
          createdAt: new Date(Date.now() - 259200000) // 3 days ago
        }
      ];
    }),

  // Get active shelters
  getActiveShelters: protectedProcedure
    .query(async ({ ctx }) => {
      const userId = (ctx.session?.user as SessionUser)?.id;
      if (!userId) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "User not authenticated"
        });
      }

      // Mock data until we have ActiveShelter model
      return [
        {
          id: "1",
          type: "Housing Shelter",
          amount: 50000,
          status: "active",
          activatedDate: new Date(Date.now() - 2592000000) // 30 days ago
        }
      ];
    }),

  // === LEADERSHIP POOL ===
  
  // Get leadership pool data
  getLeadershipPool: publicProcedure
    .query(async ({ ctx }) => {
      // Mock leadership pool data
      return {
        totalPoolValue: 2500000,
        monthlyDistribution: 125000,
        lastUpdated: new Date()
      };
    }),

  // === COMMUNITY STATS ===
  
  // Get live community statistics
  getCommunityStats: publicProcedure
    .query(async ({ ctx }) => {
      const totalUsers = await ctx.prisma.user.count();

      return {
        totalMembers: totalUsers,
        palliativeMembers: Math.floor(totalUsers * 0.75), // 75% participation
        activeShelters: 45,
        activeTickets: 12,
        lastUpdated: new Date()
      };
    })
});