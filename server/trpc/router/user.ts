import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";
import { sendVerificationEmail } from "@/lib/email";

// Store verification codes temporarily (in production, use Redis or database)
const verificationCodes = new Map<string, { code: string; expiresAt: Date }>();

export const userRouter = createTRPCRouter({
  getDetails: protectedProcedure.query(async ({ ctx }) => {
    const userId = (ctx.session!.user as any).id;

    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          name: true,
          email: true,
          emailVerified: true,
          image: true,
          firstname: true,
          lastname: true,
          mobile: true,
          ssc: true,
          gender: true,
          address: true,
          city: true,
          state: true,
          zip: true,
          country: true,
          cityId: true,
          stateId: true,
          countryId: true,
          profilePic: true,
          secondaryEmail: true,
          username: true,
          referralLink: true,
          inviteCode: true,
          userType: true,
          rank: true,
          activated: true,
          kyc: true,
          verified: true,
          wallet: true,
          spendable: true,
          palliative: true,
          palliativeActivated: true,
          palliativeActivatedAt: true,
          cashback: true,
          studentCashback: true,
          community: true,
          shareholder: true,
          shelter: true,
          education: true,
          car: true,
          business: true,
          solar: true,
          land: true,
          meal: true,
          health: true,
          security: true,
          bpiTokenWallet: true,
          defaultCurrency: true,
          role: true,
          createdAt: true,
          updatedAt: true,
          lastLogin: true,
          activeMembershipPackageId: true,
          membershipActivatedAt: true,
          membershipExpiresAt: true,
          level1Count: true,
          level2Count: true,
          level3Count: true,
          level4Count: true,
          cityRelation: {
            select: { id: true, name: true }
          },
          stateRelation: {
            select: { id: true, name: true }
          },
          countryRelation: {
            select: { id: true, name: true }
          },
          // Wallet timeline preferences - NOT YET MIGRATED
          // walletTimelineViewMode: true,
          // walletTimelineDefaultSort: true,
          // walletTimelineDateRange: true,
        },
      });

      if (!user) {
        throw new Error("User not found");
      }

      // For activeMembership, we need to get the package details
      let activeMembership = null;
      if (user.activeMembershipPackageId) {
          activeMembership = await prisma.membershipPackage.findUnique({
              where: { id: user.activeMembershipPackageId }
          });
      }

      return {
        ...user,
        activeMembership, // This will be the full package object or null
      };
    } catch (error) {
      console.error('[user.getDetails] Error:', error);
      throw error;
    }
  }),

  me: protectedProcedure.query(async ({ ctx }) => {
    const session = ctx.session;
    const id = (session!.user as any).id as string;
    const me = await ctx.prisma.user.findUnique({ where: { id } });
    return { id: me?.id, email: me?.email, name: me?.name, role: me?.role };
  }),
  
  updateName: protectedProcedure
    .input(z.object({ name: z.string().min(2).max(50) }))
    .mutation(async ({ ctx, input }) => {
      const session = ctx.session;
      const id = (session!.user as any).id as string;
      await ctx.prisma.user.update({ where: { id }, data: { name: input.name } });
      return { success: true };
    }),

  sendVerificationEmail: protectedProcedure.mutation(async ({ ctx }) => {
    const userId = (ctx.session!.user as any).id;
    
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true, emailVerified: true }
    });

    if (!user) {
      throw new Error("User not found");
    }

    if (user.emailVerified) {
      throw new Error("Email already verified");
    }

    // Generate 6-digit verification code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Store code with 15-minute expiration
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);
    verificationCodes.set(userId, { code, expiresAt });

    try {
      await sendVerificationEmail(user.email!, code);
    } catch (error) {
      console.error("[user.sendVerificationEmail] Failed to send email:", error);
      throw new Error("Failed to send verification email. Please try again.");
    }

    return { success: true, message: "Verification code sent to your email" };
  }),

  verifyEmailCode: protectedProcedure
    .input(z.object({ code: z.string().length(6) }))
    .mutation(async ({ ctx, input }) => {
      const userId = (ctx.session!.user as any).id;
      
      const storedData = verificationCodes.get(userId);
      
      if (!storedData) {
        throw new Error("No verification code found. Please request a new code.");
      }

      if (new Date() > storedData.expiresAt) {
        verificationCodes.delete(userId);
        throw new Error("Verification code has expired. Please request a new code.");
      }

      if (storedData.code !== input.code) {
        throw new Error("Invalid verification code. Please try again.");
      }

      // Mark email as verified
      await prisma.user.update({
        where: { id: userId },
        data: { 
          emailVerified: new Date(),
        }
      });

      // Clean up the verification code
      verificationCodes.delete(userId);

      return { success: true, message: "Email verified successfully!" };
    }),

  updateDetails: protectedProcedure
    .input(z.object({
      // User profile fields
      name: z.string().optional(),
      firstname: z.string().optional(),
      lastname: z.string().optional(),
      email: z.string().email().optional(),
      mobile: z.string().optional(),
      address: z.string().optional(),
      city: z.string().optional(),
      state: z.string().optional(),
      country: z.string().optional(),
      cityId: z.number().optional().nullable(),
      stateId: z.number().optional().nullable(),
      countryId: z.number().optional().nullable(),
      gender: z.string().optional(),
      image: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const userId = (ctx.session!.user as any).id;
      
      // Handle firstname/lastname updates to sync with name field
      const updateData: any = { ...input };
      
      // If location IDs are provided, use them and convert to strings for legacy fields
      if (input.cityId !== undefined) {
        updateData.cityId = input.cityId;
        updateData.city = input.cityId?.toString() || null;
      }
      if (input.stateId !== undefined) {
        updateData.stateId = input.stateId;
        updateData.state = input.stateId?.toString() || null;
      }
      if (input.countryId !== undefined) {
        updateData.countryId = input.countryId;
        updateData.country = input.countryId?.toString() || null;
      }
      
      if (input.firstname || input.lastname) {
        const currentUser = await ctx.prisma.user.findUnique({
          where: { id: userId },
          select: { firstname: true, lastname: true }
        });
        
        const newFirstname = input.firstname || currentUser?.firstname || '';
        const newLastname = input.lastname || currentUser?.lastname || '';
        updateData.name = `${newFirstname} ${newLastname}`.trim();
      }
      
      await ctx.prisma.user.update({
        where: { id: userId },
        data: updateData
      });

      return { success: true };
    }),

  // Search users by email, name, or screen name
  searchUsers: protectedProcedure
    .input(z.object({
      term: z.string().min(2),
      limit: z.number().int().positive().optional().default(10),
    }))
    .query(async ({ ctx, input }) => {
      const searchTerm = input.term.toLowerCase();

      const users = await prisma.user.findMany({
        where: {
          OR: [
            { email: { contains: searchTerm, mode: 'insensitive' } },
            { name: { contains: searchTerm, mode: 'insensitive' } },
            { firstname: { contains: searchTerm, mode: 'insensitive' } },
            { lastname: { contains: searchTerm, mode: 'insensitive' } },
            { username: { contains: searchTerm, mode: 'insensitive' } },
          ],
          activated: true,
        },
        select: {
          id: true,
          email: true,
          name: true,
          username: true,
          image: true,
        },
        take: input.limit,
        orderBy: [
          { email: 'asc' },
        ],
      });

      return users.map((user) => ({
        id: user.id,
        email: user.email,
        name: user.name,
        screenName: user.username,
        image: user.image,
      }));
    }),
});
