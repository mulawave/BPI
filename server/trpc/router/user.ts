import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";

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

    // In production, send actual email here
    // For now, log the code (in development)
    console.log(`[DEV] Verification code for ${user.email}: ${code}`);
    
    // TODO: Integrate with email service (SendGrid, Resend, etc.)
    // await sendEmail({
    //   to: user.email!,
    //   subject: "BPI Email Verification Code",
    //   text: `Your verification code is: ${code}`,
    //   html: `<p>Your verification code is: <strong>${code}</strong></p>`
    // });

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
      gender: z.string().optional(),
      image: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const userId = (ctx.session!.user as any).id;
      
      // Handle firstname/lastname updates to sync with name field
      const updateData: any = { ...input };
      
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
});
