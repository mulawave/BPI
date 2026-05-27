import { z } from "zod";
import { hash, compare } from "bcryptjs";
import { createTRPCRouter, publicProcedure, protectedProcedure, rateLimitedProcedure, passwordResetProcedure } from "../trpc";
import { TRPCError } from "@trpc/server";
import { randomUUID } from "crypto";
import { resolveAppBaseUrl } from "@/lib/appUrl";
import { sendPasswordResetEmail, sendWelcomeEmail } from "@/lib/email";
import { placeUserInThirdPartyMatrix } from "@/server/services/thirdPartyMatrix.service";

const REFERRER_CACHE_TTL_MS = 60_000;
const referrerInfoCache = new Map<string, { value: { name: string; firstname: string; lastname: string }; expiresAt: number }>();

function cacheReferrerInfo(refId: string, value: { name: string; firstname: string; lastname: string }) {
  referrerInfoCache.set(refId, {
    value,
    expiresAt: Date.now() + REFERRER_CACHE_TTL_MS,
  });
}

function getCachedReferrerInfo(refId: string) {
  const cached = referrerInfoCache.get(refId);
  if (!cached) return null;
  if (cached.expiresAt <= Date.now()) {
    referrerInfoCache.delete(refId);
    return null;
  }
  return cached.value;
}

const registerSchema = z.object({
  firstname: z.string().min(2, "First name must be at least 2 characters"),
  lastname: z.string().min(2, "Last name must be at least 2 characters"),
  screenname: z.string().min(3, "Screen name must be at least 3 characters"),
  gender: z.enum(["male", "female"], { errorMap: () => ({ message: "Please select a gender" }) }),
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string(),
  ref_id: z.string().default("1"),
  captcha: z.string(),
  terms: z.boolean().refine(val => val === true, "You must accept the terms and conditions"),
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

export const authRouter = createTRPCRouter({
  register: rateLimitedProcedure
    .input(registerSchema)
    .mutation(async ({ ctx, input }) => {
      const { firstname, lastname, screenname, gender, email, password, ref_id } = input;

      // Check if user already exists
      const existingUser = await ctx.prisma.user.findUnique({
        where: { email },
      });

      if (existingUser) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "A user with this email already exists",
        });
      }

      // Check if screenname is taken
      const existingScreenname = await ctx.prisma.user.findFirst({
        where: { name: screenname },
      });

      if (existingScreenname) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "This screen name is already taken",
        });
      }

      // Hash password
      const passwordHash = await hash(password, 12);

      // Generate unique invite code for new user
      const characters = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
      let inviteCode = '';
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
          inviteCode = '';
          for (let i = 0; i < 12; i++) {
            inviteCode += characters.charAt(Math.floor(Math.random() * characters.length));
          }
          attempts++;
        }
      }

      // Resolve referrer before creating the user so we can set sponsorId/referredBy atomically
      let resolvedReferrerId: string | null = null;
      if (ref_id && ref_id !== "1") {
        // Try by invite code first (normal flow)
        const referrerByCode = await ctx.prisma.user.findUnique({
          where: { inviteCode: ref_id },
          select: { id: true },
        });
        if (referrerByCode) {
          resolvedReferrerId = referrerByCode.id;
        } else {
          // Fallback: legacy links use raw user ID as ref
          const referrerById = await ctx.prisma.user.findUnique({
            where: { id: ref_id },
            select: { id: true },
          });
          if (referrerById) {
            resolvedReferrerId = referrerById.id;
          }
        }
        if (!resolvedReferrerId) {
          console.warn(`[auth.register] Could not resolve referrer for ref_id="${ref_id}" — registering without sponsor`);
        }
      }

      const baseUrl = (await resolveAppBaseUrl()).replace(/\/$/, "");

      console.log(`[auth.register] Creating user email=${email}, ref_id="${ref_id}", resolvedReferrerId=${resolvedReferrerId ?? "NONE"}`);

      // Create user with invite code, and set sponsor/referredBy if a valid referrer was found
      const user = await ctx.prisma.user.create({
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
          ...(resolvedReferrerId && {
            sponsorId: resolvedReferrerId,
            referredBy: resolvedReferrerId,
          }),
        },
      });

      // Create Referral table record for commission tracking
      if (resolvedReferrerId) {
        try {
          await ctx.prisma.$executeRaw`
            INSERT INTO "Referral" (id, "referrerId", "referredId", status, "rewardPaid", "createdAt", "updatedAt")
            VALUES (${randomUUID()}, ${resolvedReferrerId}, ${user.id}, 'active', false, NOW(), NOW())
          `;
        } catch (error) {
          console.error("Failed to create referral record:", error);
          // Don't fail registration if referral record creation fails
        }
      }
      // Place new user in sponsor's third-party matrix (non-blocking)
      if (resolvedReferrerId) {
        placeUserInThirdPartyMatrix({
          prisma: ctx.prisma,
          userId: user.id,
          sponsorId: resolvedReferrerId,
          sourceFlow: "register",
        }).catch((err) => {
          console.error("[auth.register] Third-party matrix placement failed:", err);
        });
      }

      // Send welcome email (non-blocking — registration succeeds even if email fails)
      if (user.email) {
        try {
          await sendWelcomeEmail(user.email, user.firstname || user.name || "Member");
        } catch (error) {
          console.error("[auth.register] Failed to send welcome email:", error);
        }
      }

      return {
        success: true,
        message: "Registration successful! Please log in to continue.",
        userId: user.id,
      };
    }),

  checkEmail: publicProcedure
    .input(z.object({ email: z.string().email() }))
    .query(async ({ ctx, input }) => {
      const user = await ctx.prisma.user.findUnique({
        where: { email: input.email },
      });
      return { exists: !!user };
    }),

  checkScreenname: publicProcedure
    .input(z.object({ screenname: z.string() }))
    .query(async ({ ctx, input }) => {
      const user = await ctx.prisma.user.findFirst({
        where: { name: input.screenname },
      });
      return { exists: !!user };
    }),

  forgotPassword: passwordResetProcedure
    .input(z.object({ email: z.string().email() }))
    .mutation(async ({ ctx, input }) => {
      const user = await ctx.prisma.user.findUnique({
        where: { email: input.email },
      });

      // Always return success for security (don't reveal if email exists)
      if (!user) {
        return { success: true, message: "If an account exists, a reset link has been sent." };
      }

      // Generate reset token
      const token = randomUUID();
      const expires = new Date(Date.now() + 1000 * 60 * 60); // 1 hour from now

      // Store reset token (using raw SQL for now)
      try {
        await ctx.prisma.$executeRaw`
          INSERT INTO "PasswordReset" (id, "userId", token, expires, used, "createdAt")
          VALUES (${randomUUID()}, ${user.id}, ${token}, ${expires}, false, NOW())
        `;

        await sendPasswordResetEmail(user.email || input.email, token);

      } catch (error) {
        console.error("Failed to process password reset request:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to process password reset request",
        });
      }

      return { success: true, message: "If an account exists, a reset link has been sent." };
    }),

  resetPassword: passwordResetProcedure
    .input(z.object({
      token: z.string(),
      password: z.string().min(8, "Password must be at least 8 characters"),
      confirmPassword: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { token, password, confirmPassword } = input;

      if (password !== confirmPassword) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Passwords do not match",
        });
      }

      // Find valid reset token (using raw SQL for now)
      const resetTokens = await ctx.prisma.$queryRaw<Array<{
        id: string;
        userId: string;
        expires: Date;
        used: boolean;
      }>>`
        SELECT id, "userId", expires, used
        FROM "PasswordReset"
        WHERE token = ${token}
        AND expires > NOW()
        AND used = false
        LIMIT 1
      `;

      if (!resetTokens || resetTokens.length === 0) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Invalid or expired reset token",
        });
      }

      const resetToken = resetTokens[0];

      // Hash new password
      const passwordHash = await hash(password, 12);

      try {
        // Update user password
        await ctx.prisma.user.update({
          where: { id: resetToken.userId },
          data: { passwordHash },
        });

        // Mark token as used
        await ctx.prisma.$executeRaw`
          UPDATE "PasswordReset"
          SET used = true
          WHERE id = ${resetToken.id}
        `;

        return { success: true, message: "Password has been reset successfully" };

      } catch (error) {
        console.error("Failed to reset password:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to reset password",
        });
      }
    }),

  validateResetToken: publicProcedure
    .input(z.object({ token: z.string() }))
    .query(async ({ ctx, input }) => {
      const resetTokens = await ctx.prisma.$queryRaw<Array<{
        id: string;
        expires: Date;
        used: boolean;
      }>>`
        SELECT id, expires, used
        FROM "PasswordReset"
        WHERE token = ${input.token}
        AND expires > NOW()
        AND used = false
        LIMIT 1
      `;

      return { valid: resetTokens && resetTokens.length > 0 };
    }),

  verifyPassword: protectedProcedure
    .input(z.object({ password: z.string() }))
    .mutation(async ({ ctx, input }) => {
      if (!ctx.session?.user) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Not authenticated",
        });
      }

      const userId = (ctx.session.user as any).id;

      const user = await ctx.prisma.user.findUnique({
        where: { id: userId },
        select: { passwordHash: true },
      });

      if (!user || !user.passwordHash) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "User not found",
        });
      }

      const isValid = await compare(input.password, user.passwordHash);

      return { success: isValid };
    }),

  getReferrerInfo: publicProcedure
    .input(z.object({ refId: z.string() }))
    .query(async ({ ctx, input }) => {
      const { refId } = input;

      // Return default if refId is "1" (no referrer)
      if (!refId || refId === "1") {
        return {
          name: "Administrator",
          firstname: "BPI",
          lastname: "Administrator",
        };
      }

      const cached = getCachedReferrerInfo(refId);
      if (cached) {
        return cached;
      }

      console.log(`[getReferrerInfo] Looking up refId: ${refId}`);

      // Try to find by invite code first
      let referrer = await ctx.prisma.user.findUnique({
        where: { inviteCode: refId },
        select: {
          name: true,
          firstname: true,
          lastname: true,
          inviteCode: true,
        },
      });

      console.log(`[getReferrerInfo] Found by inviteCode:`, referrer);

      // If not found, try by user ID (backward compatibility)
      if (!referrer) {
        try {
          referrer = await ctx.prisma.user.findUnique({
            where: { id: refId },
            select: {
              name: true,
              firstname: true,
              lastname: true,
              inviteCode: true,
            },
          });
          console.log(`[getReferrerInfo] Found by userId:`, referrer);
        } catch (e) {
          console.log(`[getReferrerInfo] Not found by userId either`);
        }
      }

      // Return referrer info or default
      if (referrer) {
        const fullName = referrer.name || `${referrer.firstname} ${referrer.lastname}`;
        console.log(`[getReferrerInfo] Returning name: ${fullName}`);
        const resolved = {
          name: fullName,
          firstname: referrer.firstname || "",
          lastname: referrer.lastname || "",
        };
        cacheReferrerInfo(refId, resolved);
        return resolved;
      }

      // If no referrer found, return default
      console.log(`[getReferrerInfo] No referrer found, returning Administrator`);
      const fallback = {
        name: "Administrator",
        firstname: "BPI",
        lastname: "Administrator",
      };
      cacheReferrerInfo(refId, fallback);
      return fallback;
    }),
});