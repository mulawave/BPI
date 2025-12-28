import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";

// Store verification codes temporarily (in production, use Redis or database)
const verificationCodes = new Map<string, { code: string; expiresAt: Date }>();

export const userRouter = createTRPCRouter({
  getDetails: protectedProcedure.query(async ({ ctx }) => {
    const userId = (ctx.session!.user as any).id;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        empowermentPackages: true,
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
});
