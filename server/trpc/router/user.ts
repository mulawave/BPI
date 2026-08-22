import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";
import { randomUUID } from "crypto";
import { hash } from "bcryptjs";
import { resolveAppBaseUrl } from "@/lib/appUrl";
import { sendVerificationEmail, sendWelcomeEmail } from "@/lib/email";
import { TRPCError } from "@trpc/server";
import { placeUserInThirdPartyMatrix } from "@/server/services/thirdPartyMatrix.service";
import { evaluateMembershipAccess } from "@/lib/membershipAccess";

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
          selectedPalliative: true,
          palliativeTier: true,
          cashback: true,
          studentCashback: true,
          community: true,
          shareholder: true,
          shelter: true,
          isShelter: true,
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
          usdtAddress: true,
          withdrawBan: true,
          allowUsdFeatures: true,
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

      const membershipAccess = evaluateMembershipAccess({
        activeMembershipPackageId: user.activeMembershipPackageId,
        membershipActivatedAt: user.membershipActivatedAt,
        membershipExpiresAt: user.membershipExpiresAt,
        renewalCycleDays: activeMembership?.renewalCycle,
      });

      // Check if user has bank accounts on file (indicates Nigerian identity)
      const bankAccountCount = await prisma.userBankRecord.count({
        where: { userId },
      });

      return {
        ...user,
        activeMembership: membershipAccess.membershipValid ? activeMembership : null,
        membershipAccess,
        hasBankAccounts: bankAccountCount > 0,
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
          UserSettings: { select: { privacy: true } },
        },
        take: input.limit,
        orderBy: [
          { email: 'asc' },
        ],
      });

      // Filter out users with private profile visibility
      const filtered = users.filter((user) => {
        const privacy = user.UserSettings?.privacy as Record<string, boolean | string> | undefined;
        if (privacy?.profileVisibility === 'private') return false;
        return true;
      });

      return filtered.map((user) => ({
        id: user.id,
        email: user.email,
        name: user.name,
        screenName: user.username,
        image: user.image,
      }));
    }),

  /**
   * Create a brand-new platform user anchored as both a direct referral AND
   * a beneficiary candidate for the calling user.  The calling user's
   * inviteCode is injected as ref_id so the sponsorship chain is established
   * automatically on creation.
   */
  createBeneficiary: protectedProcedure
    .input(
      z.object({
        firstname: z.string().min(2, "First name must be at least 2 characters"),
        lastname: z.string().min(2, "Last name must be at least 2 characters"),
        screenname: z.string().min(3, "Screen name must be at least 3 characters"),
        gender: z.enum(["male", "female"]),
        email: z.string().email("Please enter a valid email address"),
        password: z.string().min(8, "Password must be at least 8 characters"),
        confirmPassword: z.string(),
      }).refine((d) => d.password === d.confirmPassword, {
        message: "Passwords do not match",
        path: ["confirmPassword"],
      })
    )
    .mutation(async ({ ctx, input }) => {
      const callerId = (ctx.session!.user as any).id as string;

      // Fetch calling user to get their inviteCode (for referral anchoring)
      const caller = await prisma.user.findUnique({
        where: { id: callerId },
        select: { id: true, inviteCode: true },
      });
      if (!caller) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "User session invalid" });
      }

      const { firstname, lastname, screenname, gender, email, password } = input;

      // Check for duplicate email
      const existingEmail = await prisma.user.findUnique({ where: { email } });
      if (existingEmail) {
        throw new TRPCError({ code: "CONFLICT", message: "A user with this email already exists" });
      }

      // Check for duplicate screen name
      const existingScreen = await prisma.user.findFirst({ where: { name: screenname } });
      if (existingScreen) {
        throw new TRPCError({ code: "CONFLICT", message: "This screen name is already taken" });
      }

      const passwordHash = await hash(password, 12);

      // Generate unique invite code
      const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
      let inviteCode = Array.from({ length: 12 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
      for (let i = 0; i < 10; i++) {
        const clash = await prisma.user.findUnique({ where: { inviteCode } });
        if (!clash) break;
        inviteCode = Array.from({ length: 12 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
      }

      const baseUrl = (await resolveAppBaseUrl()).replace(/\/$/, "");

      const newUser = await prisma.user.create({
        data: {
          id: randomUUID(),
          name: screenname,
          firstname,
          lastname,
          gender,
          email,
          passwordHash,
          role: "user",
          inviteCode,
          referralLink: `${baseUrl}/register?ref=${inviteCode}`,
          sponsorId: caller.id,
          referredBy: caller.id,
        },
      });

      // Record referral
      try {
        await prisma.$executeRaw`
          INSERT INTO "Referral" (id, "referrerId", "referredId", status, "rewardPaid", "createdAt", "updatedAt")
          VALUES (${randomUUID()}, ${caller.id}, ${newUser.id}, 'active', false, NOW(), NOW())
        `;
      } catch (err) {
        // Non-fatal — don't block beneficiary creation
        console.error("[user.createBeneficiary] Referral record failed:", err);
      }

      // Place beneficiary in caller's third-party matrix (non-blocking)
      placeUserInThirdPartyMatrix({
        prisma,
        userId: newUser.id,
        sponsorId: caller.id,
        sourceFlow: "beneficiary",
      }).catch((err) => {
        console.error("[user.createBeneficiary] Third-party matrix placement failed:", err);
      });

      // Welcome email (non-fatal)
      if (newUser.email) {
        try {
          await sendWelcomeEmail(newUser.email, newUser.firstname || newUser.name || "Member");
        } catch (err) {
          console.error("[user.createBeneficiary] Welcome email failed:", err);
        }
      }

      return {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
      };
    }),

  // ── User Settings (notifications, privacy, preferences) ──

  getSettings: protectedProcedure.query(async ({ ctx }) => {
    const userId = (ctx.session!.user as any).id as string;
    let settings = await prisma.userSettings.findUnique({ where: { userId } });
    if (!settings) {
      settings = await prisma.userSettings.create({ data: { userId } });
    }
    return {
      notifications: settings.notifications as Record<string, boolean>,
      privacy: settings.privacy as Record<string, boolean | string>,
      preferences: settings.preferences as Record<string, boolean | string>,
    };
  }),

  updateNotifications: protectedProcedure
    .input(z.object({
      emailNotifications: z.boolean().optional(),
      pushNotifications: z.boolean().optional(),
      transactionAlerts: z.boolean().optional(),
      securityAlerts: z.boolean().optional(),
      marketingEmails: z.boolean().optional(),
      referralUpdates: z.boolean().optional(),
      packageReminders: z.boolean().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const userId = (ctx.session!.user as any).id as string;
      const existing = await prisma.userSettings.findUnique({ where: { userId } });
      const current = (existing?.notifications ?? {}) as Record<string, boolean>;
      const merged = { ...current, ...input };
      await prisma.userSettings.upsert({
        where: { userId },
        update: { notifications: merged },
        create: { userId, notifications: merged },
      });
      return { success: true };
    }),

  updatePrivacy: protectedProcedure
    .input(z.object({
      profileVisibility: z.enum(["public", "members", "private"]).optional(),
      showWalletBalance: z.boolean().optional(),
      showReferralStats: z.boolean().optional(),
      showActivityStatus: z.boolean().optional(),
      allowDirectMessages: z.boolean().optional(),
      dataSharingOptIn: z.boolean().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const userId = (ctx.session!.user as any).id as string;
      const existing = await prisma.userSettings.findUnique({ where: { userId } });
      const current = (existing?.privacy ?? {}) as Record<string, boolean | string>;
      const merged = { ...current, ...input };
      await prisma.userSettings.upsert({
        where: { userId },
        update: { privacy: merged },
        create: { userId, privacy: merged },
      });
      return { success: true };
    }),

  updatePreferences: protectedProcedure
    .input(z.object({
      theme: z.enum(["light", "dark", "system"]).optional(),
      language: z.string().optional(),
      currencyDisplay: z.string().optional(),
      dateFormat: z.enum(["DD/MM/YYYY", "MM/DD/YYYY", "YYYY-MM-DD"]).optional(),
      emailDigestFrequency: z.enum(["daily", "weekly", "monthly", "never"]).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const userId = (ctx.session!.user as any).id as string;
      const existing = await prisma.userSettings.findUnique({ where: { userId } });
      const current = (existing?.preferences ?? {}) as Record<string, boolean | string>;
      const merged = { ...current, ...input };
      await prisma.userSettings.upsert({
        where: { userId },
        update: { preferences: merged },
        create: { userId, preferences: merged },
      });
      return { success: true };
    }),
});
