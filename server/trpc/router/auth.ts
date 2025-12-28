import { z } from "zod";
import { hash, compare } from "bcryptjs";
import { createTRPCRouter, publicProcedure } from "../trpc";
import { TRPCError } from "@trpc/server";
import { randomUUID } from "crypto";

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
  register: publicProcedure
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

      // Create user
      const user = await ctx.prisma.user.create({
        data: {
          name: screenname,
          email,
          passwordHash,
          role: "member",
        },
      });

      // Create referral record if referred by someone
      if (ref_id && ref_id !== "1") {
        // Find the referrer by invite code (encrypted format)
        const referrer = await ctx.prisma.user.findUnique({
          where: { inviteCode: ref_id },
        });

        if (referrer) {
          // Using raw query since Prisma types may not be updated yet
          try {
            await ctx.prisma.$executeRaw`
              INSERT INTO "Referral" (id, "referrerId", "referredId", status, "rewardPaid", "createdAt", "updatedAt")
              VALUES (${randomUUID()}, ${referrer.id}, ${user.id}, 'active', false, NOW(), NOW())
            `;
          } catch (error) {
            console.error("Failed to create referral record:", error);
            // Don't fail registration if referral creation fails
          }
        } else {
          // If no referrer found with invite code, try as user ID (backward compatibility for old links)
          const referrerById = await ctx.prisma.user.findUnique({
            where: { id: ref_id },
          });
          
          if (referrerById) {
            try {
              await ctx.prisma.$executeRaw`
                INSERT INTO "Referral" (id, "referrerId", "referredId", status, "rewardPaid", "createdAt", "updatedAt")
                VALUES (${randomUUID()}, ${ref_id}, ${user.id}, 'active', false, NOW(), NOW())
              `;
            } catch (error) {
              console.error("Failed to create referral record:", error);
            }
          }
        }
      }
      // TODO: Send welcome email
      // TODO: Create initial member profile

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

  forgotPassword: publicProcedure
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

        // TODO: Send email with reset link
        // For now, we'll just log the token (in production, send email)
        console.log(`Password reset token for ${input.email}: ${token}`);
        console.log(`Reset link: http://localhost:3000/set-new-password?token=${token}`);

      } catch (error) {
        console.error("Failed to create password reset token:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to process password reset request",
        });
      }

      return { success: true, message: "If an account exists, a reset link has been sent." };
    }),

  resetPassword: publicProcedure
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
});