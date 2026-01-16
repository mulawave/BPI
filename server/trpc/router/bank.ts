import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { verifyBankAccount, getFlutterwaveBanks } from "@/lib/flutterwave";
import { TRPCError } from "@trpc/server";

export const bankRouter = createTRPCRouter({
  // Check if user has PIN and 2FA enabled (security gating)
  checkSecurityRequirements: protectedProcedure.query(async ({ ctx }) => {
    if (!ctx.session?.user?.id) {
      throw new TRPCError({ code: "UNAUTHORIZED" });
    }

    const user = await ctx.prisma.user.findUnique({
      where: { id: ctx.session.user.id },
      select: {
        userProfilePin: true,
        twoFactorEnabled: true,
      },
    });

    return {
      hasPin: !!user?.userProfilePin,
      has2FA: !!user?.twoFactorEnabled,
      isComplete: !!(user?.userProfilePin && user?.twoFactorEnabled),
    };
  }),

  // Get Flutterwave banks
  getFlutterwaveBanks: protectedProcedure.query(async ({ ctx }) => {
    // Get Flutterwave secret key from admin settings
    const setting = await ctx.prisma.adminSettings.findUnique({
      where: { settingKey: 'flutterwave_secret_key' },
    });

    if (!setting?.settingValue) {
      throw new TRPCError({ 
        code: "INTERNAL_SERVER_ERROR",
        message: "Flutterwave credentials not configured" 
      });
    }

    try {
      return await getFlutterwaveBanks(setting.settingValue);
    } catch (error: any) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: error.message || "Failed to fetch banks",
      });
    }
  }),

  // Verify bank account with Flutterwave
  verifyBankAccount: protectedProcedure
    .input(
      z.object({
        accountNumber: z.string().length(10, "Account number must be 10 digits"),
        bankCode: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Get Flutterwave secret key
      const setting = await ctx.prisma.adminSettings.findUnique({
        where: { settingKey: 'flutterwave_secret_key' },
      });

      if (!setting?.settingValue) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Flutterwave credentials not configured",
        });
      }

      try {
        const result = await verifyBankAccount(
          setting.settingValue,
          input.accountNumber,
          input.bankCode
        );

        return result;
      } catch (error: any) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: error.message || "Account verification failed",
        });
      }
    }),

  // Get all banks (from database)
  getBanks: protectedProcedure.query(async ({ ctx }) => {
    return await ctx.prisma.bank.findMany({
      orderBy: { bankName: 'asc' },
    });
  }),

  // Get user's bank records
  getUserBankRecords: protectedProcedure.query(async ({ ctx }) => {
    if (!ctx.session?.user?.id) {
      throw new TRPCError({ code: "UNAUTHORIZED" });
    }

    return await ctx.prisma.userBankRecord.findMany({
      where: { userId: ctx.session.user.id },
      include: {
        bank: true,
      },
      orderBy: [
        { isDefault: 'desc' }, // Default account first
        { createdAt: 'desc' },
      ],
    });
  }),

  // Get default bank account
  getDefaultBankAccount: protectedProcedure.query(async ({ ctx }) => {
    if (!ctx.session?.user?.id) {
      throw new TRPCError({ code: "UNAUTHORIZED" });
    }

    return await ctx.prisma.userBankRecord.findFirst({
      where: {
        userId: ctx.session.user.id,
        isDefault: true,
      },
      include: {
        bank: true,
      },
    });
  }),

  // Add bank account with security gating
  addBankAccount: protectedProcedure
    .input(
      z.object({
        bankId: z.number(),
        accountName: z.string().min(1, "Account name is required"),
        accountNumber: z.string().length(10, "Account number must be 10 digits"),
        bvn: z.string().optional(),
        isDefault: z.boolean().optional(),
        pin: z.string().min(4, "PIN is required"),
        twoFactorCode: z.string().length(6, "2FA code must be 6 digits"),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.session?.user?.id) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }

      // Security gating: Check PIN and 2FA
      const user = await ctx.prisma.user.findUnique({
        where: { id: ctx.session.user.id },
        select: {
          userProfilePin: true,
          twoFactorEnabled: true,
          twoFactorSecret: true,
        },
      });

      if (!user?.userProfilePin) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You must set up a profile PIN before adding bank accounts",
        });
      }

      if (!user?.twoFactorEnabled || !user?.twoFactorSecret) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You must enable 2FA before adding bank accounts",
        });
      }

      // Verify PIN (assuming it's hashed)
      const bcrypt = require('bcryptjs');
      const isPinValid = await bcrypt.compare(input.pin, user.userProfilePin);
      
      if (!isPinValid) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Invalid PIN",
        });
      }

      // Verify 2FA code
      const speakeasy = require('speakeasy');
      const is2FAValid = speakeasy.totp.verify({
        secret: user.twoFactorSecret,
        encoding: 'base32',
        token: input.twoFactorCode,
      });

      if (!is2FAValid) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Invalid 2FA code",
        });
      }

      // If setting as default, unset previous default
      if (input.isDefault) {
        await ctx.prisma.userBankRecord.updateMany({
          where: {
            userId: ctx.session.user.id,
            isDefault: true,
          },
          data: {
            isDefault: false,
          },
        });
      }

      // If this is the first account, set as default automatically
      const existingCount = await ctx.prisma.userBankRecord.count({
        where: { userId: ctx.session.user.id },
      });

      return await ctx.prisma.userBankRecord.create({
        data: {
          userId: ctx.session.user.id,
          bankId: input.bankId,
          accountName: input.accountName,
          accountNumber: input.accountNumber,
          bvn: input.bvn,
          isDefault: input.isDefault ?? (existingCount === 0),
        },
        include: {
          bank: true,
        },
      });
    }),

  // Set default bank account
  setDefaultBankAccount: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      if (!ctx.session?.user?.id) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }

      // Verify ownership
      const existing = await ctx.prisma.userBankRecord.findUnique({
        where: { id: input.id },
      });

      if (!existing || existing.userId !== ctx.session.user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Bank record not found or unauthorized",
        });
      }

      // Unset all other defaults for this user
      await ctx.prisma.userBankRecord.updateMany({
        where: {
          userId: ctx.session.user.id,
          isDefault: true,
        },
        data: {
          isDefault: false,
        },
      });

      // Set this as default
      return await ctx.prisma.userBankRecord.update({
        where: { id: input.id },
        data: { isDefault: true },
        include: {
          bank: true,
        },
      });
    }),

  // Update bank account
  updateBankAccount: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        bankId: z.number().optional(),
        accountName: z.string().min(1, "Account name is required"),
        accountNumber: z.string().length(10, "Account number must be 10 digits"),
        bvn: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.session?.user?.id) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }

      // Verify ownership
      const existing = await ctx.prisma.userBankRecord.findUnique({
        where: { id: input.id },
      });

      if (!existing || existing.userId !== ctx.session.user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Bank record not found or unauthorized",
        });
      }

      return await ctx.prisma.userBankRecord.update({
        where: { id: input.id },
        data: {
          bankId: input.bankId,
          accountName: input.accountName,
          accountNumber: input.accountNumber,
          bvn: input.bvn,
        },
        include: {
          bank: true,
        },
      });
    }),

  // Delete bank account
  deleteBankAccount: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      if (!ctx.session?.user?.id) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }

      // Verify ownership
      const existing = await ctx.prisma.userBankRecord.findUnique({
        where: { id: input.id },
      });

      if (!existing || existing.userId !== ctx.session.user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Bank record not found or unauthorized",
        });
      }

      // If deleting default account, set another as default
      if (existing.isDefault) {
        const otherAccount = await ctx.prisma.userBankRecord.findFirst({
          where: {
            userId: ctx.session.user.id,
            id: { not: input.id },
          },
          orderBy: { createdAt: 'desc' },
        });

        if (otherAccount) {
          await ctx.prisma.userBankRecord.update({
            where: { id: otherAccount.id },
            data: { isDefault: true },
          });
        }
      }

      await ctx.prisma.userBankRecord.delete({
        where: { id: input.id },
      });

      return { success: true };
    }),
});
