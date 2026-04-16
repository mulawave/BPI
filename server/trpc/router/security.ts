import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { TRPCError } from "@trpc/server";
import * as bcrypt from "bcryptjs";
import * as speakeasy from "speakeasy";
import * as QRCode from "qrcode";

export const securityRouter = createTRPCRouter({
  // Get security status
  getSecurityStatus: protectedProcedure.query(async ({ ctx }) => {
    if (!ctx.session?.user?.id) {
      throw new TRPCError({ code: "UNAUTHORIZED" });
    }

    const user = await ctx.prisma.user.findUnique({
      where: { id: ctx.session.user.id },
      select: {
        userProfilePin: true,
        twoFactorEnabled: true,
        email: true,
      },
    });

    return {
      hasPin: !!user?.userProfilePin,
      has2FA: !!user?.twoFactorEnabled,
      email: user?.email || "",
    };
  }),

  // Get system-level security feature flags for users
  getSecurityFeatureFlags: protectedProcedure.query(async ({ ctx }) => {
    if (!ctx.session?.user?.id) {
      throw new TRPCError({ code: "UNAUTHORIZED" });
    }

    const settings = await ctx.prisma.adminSettings.findMany({
      where: { settingKey: { in: ["pin_enabled", "two_factor_enabled"] } },
      select: { settingKey: true, settingValue: true },
    });

    const settingsMap = new Map(settings.map((s) => [s.settingKey, s.settingValue]));

    return {
      pinEnabled: settingsMap.get("pin_enabled") === "true",
      twoFAEnabled: settingsMap.get("two_factor_enabled") === "true",
    };
  }),

  // Setup or update PIN
  setupPin: protectedProcedure
    .input(
      z.object({
        newPin: z.string().length(4, "PIN must be exactly 4 digits"),
        currentPin: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.session?.user?.id) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }

      // Check if PIN feature is enabled system-wide
      const pinSetting = await ctx.prisma.adminSettings.findUnique({
        where: { settingKey: 'pin_enabled' },
      });

      if (pinSetting?.settingValue !== 'true') {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "PIN feature is not enabled by administrator",
        });
      }

      const user = await ctx.prisma.user.findUnique({
        where: { id: ctx.session.user.id },
        select: {
          userProfilePin: true,
        },
      });

      // If user already has a PIN, verify the current PIN
      if (user?.userProfilePin && input.currentPin) {
        const isValid = await bcrypt.compare(
          input.currentPin,
          user.userProfilePin
        );

        if (!isValid) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Current PIN is incorrect",
          });
        }
      }

      // Hash and save new PIN
      const hashedPin = await bcrypt.hash(input.newPin, 10);

      await ctx.prisma.user.update({
        where: { id: ctx.session.user.id },
        data: {
          userProfilePin: hashedPin,
        },
      });

      return {
        success: true,
        message: user?.userProfilePin
          ? "PIN updated successfully"
          : "PIN created successfully",
      };
    }),

  // Setup 2FA - Generate secret and QR code
  setup2FA: protectedProcedure.mutation(async ({ ctx }) => {
    if (!ctx.session?.user?.id) {
      throw new TRPCError({ code: "UNAUTHORIZED" });
    }
    // Check if 2FA feature is enabled system-wide
    const twoFASetting = await ctx.prisma.adminSettings.findUnique({
      where: { settingKey: 'two_factor_enabled' },
    });

    if (twoFASetting?.settingValue !== 'true') {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Two-factor authentication is not enabled by administrator",
      });
    }
    const user = await ctx.prisma.user.findUnique({
      where: { id: ctx.session.user.id },
      select: {
        email: true,
        twoFactorEnabled: true,
      },
    });

    if (user?.twoFactorEnabled) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "2FA is already enabled",
      });
    }

    // Generate 2FA secret
    const secret = speakeasy.generateSecret({
      name: `BPI (${user?.email})`,
      length: 32,
    });

    // Generate QR code
    const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url || "");

    // Store temp secret (will be confirmed later)
    await ctx.prisma.user.update({
      where: { id: ctx.session.user.id },
      data: {
        twoFactorSecret: secret.base32,
        twoFactorEnabled: false, // Not enabled until verified
      },
    });

    return {
      secret: secret.base32,
      qrCode: qrCodeUrl,
    };
  }),

  // Verify and enable 2FA
  verify2FA: protectedProcedure
    .input(
      z.object({
        code: z.string().length(6, "Code must be 6 digits"),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.session?.user?.id) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }

      const user = await ctx.prisma.user.findUnique({
        where: { id: ctx.session.user.id },
        select: {
          twoFactorSecret: true,
          twoFactorEnabled: true,
        },
      });

      if (!user?.twoFactorSecret) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Please setup 2FA first",
        });
      }

      // Verify the code
      const isValid = speakeasy.totp.verify({
        secret: user.twoFactorSecret,
        encoding: "base32",
        token: input.code,
        window: 2, // Allow 2 time steps before/after
      });

      if (!isValid) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Invalid verification code",
        });
      }

      // Enable 2FA
      await ctx.prisma.user.update({
        where: { id: ctx.session.user.id },
        data: {
          twoFactorEnabled: true,
        },
      });

      return {
        success: true,
        message: "2FA enabled successfully",
      };
    }),

  // Disable 2FA
  disable2FA: protectedProcedure
    .input(
      z.object({
        code: z.string().length(6, "Code must be 6 digits"),
        pin: z.string().length(4, "PIN must be 4 digits"),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.session?.user?.id) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }

      const user = await ctx.prisma.user.findUnique({
        where: { id: ctx.session.user.id },
        select: {
          twoFactorSecret: true,
          twoFactorEnabled: true,
          userProfilePin: true,
        },
      });

      if (!user?.twoFactorEnabled) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "2FA is not enabled",
        });
      }

      // Verify PIN
      if (!user?.userProfilePin) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "PIN is required",
        });
      }

      const isPinValid = await bcrypt.compare(input.pin, user.userProfilePin);

      if (!isPinValid) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Invalid PIN",
        });
      }

      // Verify 2FA code
      const is2FAValid = speakeasy.totp.verify({
        secret: user.twoFactorSecret!,
        encoding: "base32",
        token: input.code,
      });

      if (!is2FAValid) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Invalid 2FA code",
        });
      }

      // Disable 2FA
      await ctx.prisma.user.update({
        where: { id: ctx.session.user.id },
        data: {
          twoFactorEnabled: false,
          twoFactorSecret: null,
        },
      });

      return {
        success: true,
        message: "2FA disabled successfully",
      };
    }),

  // Verify PIN (for use in other routers)
  verifyPin: protectedProcedure
    .input(z.object({
      pin: z.string().length(4, "PIN must be 4 digits"),
    }))
    .mutation(async ({ ctx, input }) => {
      if (!ctx.session?.user?.id) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }

      const user = await ctx.prisma.user.findUnique({
        where: { id: ctx.session.user.id },
        select: { userProfilePin: true },
      });

      if (!user?.userProfilePin) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Please set up a PIN first",
        });
      }

      const isPinValid = await bcrypt.compare(input.pin, user.userProfilePin);

      if (!isPinValid) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Invalid PIN",
        });
      }

      return { success: true };
    }),

  // Verify 2FA code (for use in other routers)
  verify2FACode: protectedProcedure
    .input(z.object({
      code: z.string().length(6, "Code must be 6 digits"),
    }))
    .mutation(async ({ ctx, input }) => {
      if (!ctx.session?.user?.id) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }

      const user = await ctx.prisma.user.findUnique({
        where: { id: ctx.session.user.id },
        select: {
          twoFactorEnabled: true,
          twoFactorSecret: true,
        },
      });

      if (!user?.twoFactorEnabled) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "2FA is not enabled",
        });
      }

      if (!user?.twoFactorSecret) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "2FA secret not found",
        });
      }

      const isValid = speakeasy.totp.verify({
        secret: user.twoFactorSecret,
        encoding: "base32",
        token: input.code,
        window: 2,
      });

      if (!isValid) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Invalid 2FA code",
        });
      }

      return { success: true };
    }),

  // Get saved USDT wallet address
  getUsdtWallet: protectedProcedure.query(async ({ ctx }) => {
    if (!ctx.session?.user?.id) {
      throw new TRPCError({ code: "UNAUTHORIZED" });
    }

    const user = await ctx.prisma.user.findUnique({
      where: { id: ctx.session.user.id },
      select: {
        usdtAddress: true,
        twoFactorEnabled: true,
        userProfilePin: true,
      },
    });

    return {
      usdtAddress: user?.usdtAddress || null,
      hasPin: !!user?.userProfilePin,
      has2FA: !!user?.twoFactorEnabled,
    };
  }),

  // Save USDT TRC-20 wallet address (requires PIN, and 2FA if enabled)
  saveUsdtWallet: protectedProcedure
    .input(
      z.object({
        usdtAddress: z.string().min(34).max(34).regex(/^T[A-Za-z0-9]{33}$/, "Invalid TRC-20 address format"),
        pin: z.string().length(4, "PIN must be 4 digits"),
        twoFactorCode: z.string().length(6).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.session?.user?.id) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }

      const user = await ctx.prisma.user.findUnique({
        where: { id: ctx.session.user.id },
        select: {
          userProfilePin: true,
          twoFactorEnabled: true,
          twoFactorSecret: true,
        },
      });

      // Verify PIN
      if (!user?.userProfilePin) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Please set up a transaction PIN first",
        });
      }

      const isPinValid = await bcrypt.compare(input.pin, user.userProfilePin);
      if (!isPinValid) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Invalid PIN",
        });
      }

      // Verify 2FA if enabled
      if (user.twoFactorEnabled) {
        if (!input.twoFactorCode) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "2FA code is required",
          });
        }

        if (!user.twoFactorSecret) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "2FA secret not found",
          });
        }

        const is2FAValid = speakeasy.totp.verify({
          secret: user.twoFactorSecret,
          encoding: "base32",
          token: input.twoFactorCode,
          window: 2,
        });

        if (!is2FAValid) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Invalid 2FA code",
          });
        }
      }

      // Save the USDT address
      await ctx.prisma.user.update({
        where: { id: ctx.session.user.id },
        data: { usdtAddress: input.usdtAddress },
      });

      return {
        success: true,
        message: "USDT wallet address saved successfully",
      };
    }),
});
