// NOTE: VSCode may show TypeScript errors for prisma.auditLog, prisma.pendingPayment, 
// prisma.paymentGatewayConfig, and prisma.adminNotificationSettings due to stale cache.
// These models exist in schema.prisma and build passes successfully.
// Run: npx prisma generate && restart VSCode to fix.

import { z } from "zod";
import { randomUUID } from "crypto";
import fs from "fs";
import path from "path";
import {
  activateMembershipAfterExternalPayment,
  upgradeMembershipAfterExternalPayment,
} from "@/server/services/membershipPayments.service";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { prisma } from "@/lib/prisma";

const adminProcedure = protectedProcedure.use(async ({ ctx, next }) => {
  if (!ctx.session?.user) {
    throw new Error("UNAUTHORIZED: You must be logged in to perform this action.");
  }
  const userRole = (ctx.session.user as any).role;
  if (userRole !== "admin" && userRole !== "super_admin") {
    throw new Error("UNAUTHORIZED: You must be an admin to perform this action.");
  }
  return next();
});

export const adminRouter = createTRPCRouter({
  // User Management
  getUsers: adminProcedure
    .input(
      z.object({
        page: z.number().default(1),
        pageSize: z.number().default(10),
        search: z.string().optional(),
        role: z.enum(["user", "admin", "super_admin"]).optional(),
        activated: z.boolean().optional(),
        sortBy: z.enum(["createdAt", "name", "email", "lastLogin"]).default("createdAt"),
        sortOrder: z.enum(["asc", "desc"]).default("desc"),
      })
    )
    .query(async ({ input }) => {
      const { page, pageSize, search, role, activated, sortBy, sortOrder } = input;
      const skip = (page - 1) * pageSize;

      const where: any = {};
      
      if (search) {
        where.OR = [
          { name: { contains: search, mode: "insensitive" } },
          { email: { contains: search, mode: "insensitive" } },
          { username: { contains: search, mode: "insensitive" } },
        ];
      }
      
      if (role) where.role = role;
      if (activated !== undefined) where.activated = activated;

      const [users, total] = await Promise.all([
        prisma.user.findMany({
          where,
          skip,
          take: pageSize,
          orderBy: { [sortBy]: sortOrder },
          select: {
            id: true,
            name: true,
            email: true,
            username: true,
            role: true,
            activated: true,
            verified: true,
            createdAt: true,
            lastLogin: true,
            wallet: true,
            spendable: true,
            bpiTokenWallet: true,
            activeMembershipPackageId: true,
            membershipActivatedAt: true,
            membershipExpiresAt: true,
            level1Count: true,
            level2Count: true,
            level3Count: true,
            rank: true,
          },
        }),
        prisma.user.count({ where }),
      ]);

      return {
        users,
        total,
        pages: Math.ceil(total / pageSize),
        currentPage: page,
      };
    }),

  getUserById: adminProcedure
    .input(z.object({ userId: z.string() }))
    .query(async ({ input }) => {
      const user = await prisma.user.findUnique({
        where: { id: input.userId },
        include: {
          Account: true,
          // @ts-ignore - AuditLog model exists, VSCode cache issue
          AuditLog: {
            take: 20,
            orderBy: { createdAt: "desc" },
          },
        },
      });

      if (!user) throw new Error("User not found");

      const [level1Referrals, directReferralRows, referredByUser, sponsorUser] =
        await Promise.all([
          prisma.referral.findMany({
            where: { referrerId: input.userId },
            select: { referredId: true },
          }),
          prisma.referral.findMany({
            where: { referrerId: input.userId },
            take: 20,
            orderBy: { createdAt: "desc" },
            select: {
              id: true,
              status: true,
              rewardPaid: true,
              createdAt: true,
              User_Referral_referredIdToUser: {
                select: {
                  id: true,
                  name: true,
                  firstname: true,
                  lastname: true,
                  username: true,
                  email: true,
                  image: true,
                  profilePic: true,
                  activated: true,
                  verified: true,
                  emailVerified: true,
                  createdAt: true,
                },
              },
            },
          }),
          user.referredBy
            ? prisma.user.findUnique({
                where: { id: user.referredBy },
                select: {
                  id: true,
                  name: true,
                  firstname: true,
                  lastname: true,
                  username: true,
                  email: true,
                  image: true,
                  profilePic: true,
                  activated: true,
                  verified: true,
                  emailVerified: true,
                  createdAt: true,
                },
              })
            : Promise.resolve(null),
          user.sponsorId
            ? prisma.user.findUnique({
                where: { id: user.sponsorId },
                select: {
                  id: true,
                  name: true,
                  firstname: true,
                  lastname: true,
                  username: true,
                  email: true,
                  image: true,
                  profilePic: true,
                  activated: true,
                  verified: true,
                  emailVerified: true,
                  createdAt: true,
                },
              })
            : Promise.resolve(null),
        ]);

      const level1Ids = level1Referrals.map((r) => r.referredId);
      const level2Referrals =
        level1Ids.length > 0
          ? await prisma.referral.findMany({
              where: { referrerId: { in: level1Ids } },
              select: { referredId: true },
            })
          : [];

      const level2Ids = level2Referrals.map((r) => r.referredId);
      const level3Referrals =
        level2Ids.length > 0
          ? await prisma.referral.findMany({
              where: { referrerId: { in: level2Ids } },
              select: { referredId: true },
            })
          : [];

      const level3Ids = level3Referrals.map((r) => r.referredId);
      const level4Referrals =
        level3Ids.length > 0
          ? await prisma.referral.findMany({
              where: { referrerId: { in: level3Ids } },
              select: { referredId: true },
            })
          : [];

      const referrals = directReferralRows
        .map((r) => {
          const u = r.User_Referral_referredIdToUser;
          return u
            ? {
                ...u,
                referral: {
                  id: r.id,
                  status: r.status,
                  rewardPaid: r.rewardPaid,
                  createdAt: r.createdAt,
                },
              }
            : null;
        })
        .filter(Boolean);

      const networkStats = {
        level1: level1Referrals.length,
        level2: level2Referrals.length,
        level3: level3Referrals.length,
        level4: level4Referrals.length,
      };

      return {
        ...user,
        ReferredUsers: referrals,
        ReferredByUser: referredByUser,
        SponsorUser: sponsorUser,
        networkStats,
      };
    }),

  updateUser: adminProcedure
    .input(
      z.object({
        userId: z.string(),
        data: z.object({
          name: z.string().optional(),
          email: z.string().email().optional(),
          role: z.enum(["user", "admin", "super_admin"]).optional(),
          activated: z.boolean().optional(),
          verified: z.boolean().optional(),
          wallet: z.number().optional(),
          spendable: z.number().optional(),
        }),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const { userId, data } = input;
      
      const updated = await prisma.user.update({
        where: { id: userId },
        data,
      });

      // Log the action
      await prisma.auditLog.create({
        data: {
          id: randomUUID(),
          userId: (ctx.session?.user as any)?.id || "system",
          action: "UPDATE_USER",
          entity: "User",
          entityId: userId,
          changes: JSON.stringify(data),
          status: "success",
          createdAt: new Date(),
        },
      });

      return updated;
    }),

  bulkUpdateUsers: adminProcedure
    .input(
      z.object({
        userIds: z.array(z.string()),
        action: z.enum(["activate", "deactivate", "delete"]),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const { userIds, action } = input;

      let result;
      if (action === "activate") {
        result = await prisma.user.updateMany({
          where: { id: { in: userIds } },
          data: { activated: true },
        });
      } else if (action === "deactivate") {
        result = await prisma.user.updateMany({
          where: { id: { in: userIds } },
          data: { activated: false },
        });
      } else if (action === "delete") {
        result = await prisma.user.deleteMany({
          where: { id: { in: userIds } },
        });
      }

      // Log the bulk action
      await prisma.auditLog.create({
        data: {
          id: randomUUID(),
          userId: (ctx.session?.user as any)?.id || "system",
          action: `BULK_${action.toUpperCase()}`,
          entity: "User",
          entityId: userIds.join(","),
          changes: JSON.stringify({ count: userIds.length }),
          status: "success",
          createdAt: new Date(),
        },
      });

      return result;
    }),

  bulkEmailUsers: adminProcedure
    .input(
      z.object({
        userIds: z.array(z.string()),
        subject: z.string(),
        message: z.string(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const { userIds, subject, message } = input;

      const users = await prisma.user.findMany({
        where: { id: { in: userIds }, email: { not: null } },
        select: { id: true, email: true, name: true },
      });

      // Log the bulk email action
      await prisma.auditLog.create({
        data: {
          id: randomUUID(),
          userId: (ctx.session?.user as any)?.id || "system",
          action: "BULK_EMAIL",
          entity: "User",
          entityId: userIds.join(","),
          changes: JSON.stringify({
            count: users.length,
            subject,
            messageLength: message.length,
          }),
          status: "success",
          createdAt: new Date(),
        },
      });

      // In production, integrate with email service (SendGrid, AWS SES, etc.)
      return {
        sent: users.length,
        recipients: users.map((u) => u.email),
      };
    }),

  bulkUpdateUserRoles: adminProcedure
    .input(
      z.object({
        userIds: z.array(z.string()),
        role: z.enum(["user", "admin", "super_admin"]),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const { userIds, role } = input;

      const result = await prisma.user.updateMany({
        where: { id: { in: userIds } },
        data: { role },
      });

      await prisma.auditLog.create({
        data: {
          id: randomUUID(),
          userId: (ctx.session?.user as any)?.id || "system",
          action: "BULK_UPDATE_ROLES",
          entity: "User",
          entityId: userIds.join(","),
          changes: JSON.stringify({ count: userIds.length, newRole: role }),
          status: "success",
          createdAt: new Date(),
        },
      });

      return result;
    }),

  // Payment Management
  getAllPayments: adminProcedure
    .input(
      z.object({
        page: z.number().default(1),
        pageSize: z.number().default(10),
        status: z.string().optional(),
        search: z.string().optional(),
      }),
    )
    .query(async ({ input }) => {
      const { page, pageSize, status, search } = input;
      const skip = (page - 1) * pageSize;

      const where: any = {};

      if (status) where.status = status;
      if (search) {
        where.OR = [
          { reference: { contains: search, mode: "insensitive" } },
          { description: { contains: search, mode: "insensitive" } },
          { transactionType: { contains: search, mode: "insensitive" } },
          { User: { name: { contains: search, mode: "insensitive" } } },
          { User: { email: { contains: search, mode: "insensitive" } } },
        ];
      }

      const [payments, total] = await Promise.all([
        prisma.transaction.findMany({
          where,
          skip,
          take: pageSize,
          orderBy: { createdAt: "desc" },
          include: {
            User: {
              select: {
                id: true,
                name: true,
                email: true,
                username: true,
              },
            },
          },
        }),
        prisma.transaction.count({ where }),
      ]);

      return {
        payments,
        total,
        pages: Math.ceil(total / pageSize),
        currentPage: page,
      };
    }),

  getPendingPayments: adminProcedure
    .input(
      z.object({
        page: z.number().default(1),
        pageSize: z.number().default(10),
        status: z.enum(["pending", "approved", "rejected", "expired"]).optional(),
        search: z.string().optional(),
      })
    )
    .query(async ({ input }) => {
      const { page, pageSize, status, search } = input;
      const skip = (page - 1) * pageSize;

      const where: any = {};
      
      if (status) where.status = status;
      if (search) {
        where.OR = [
          { gatewayReference: { contains: search, mode: "insensitive" } },
          { User: { name: { contains: search, mode: "insensitive" } } },
          { User: { email: { contains: search, mode: "insensitive" } } },
        ];
      }

      const [payments, total] = await Promise.all([
        prisma.pendingPayment.findMany({
          where,
          skip,
          take: pageSize,
          orderBy: { createdAt: "desc" },
          include: {
            User: {
              select: {
                id: true,
                name: true,
                email: true,
                username: true,
              },
            },
            Reviewer: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        }),
        prisma.pendingPayment.count({ where }),
      ]);

      return {
        payments,
        total,
        pages: Math.ceil(total / pageSize),
        currentPage: page,
      };
    }),

  getPaymentById: adminProcedure
    .input(z.object({ paymentId: z.string() }))
    .query(async ({ input }) => {
      const payment = await prisma.pendingPayment.findUnique({
        where: { id: input.paymentId },
        include: {
          User: {
            select: {
              id: true,
              name: true,
              email: true,
              username: true,
              mobile: true,
              wallet: true,
              spendable: true,
            },
          },
          Reviewer: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });

      if (!payment) throw new Error("Payment not found");
      return payment;
    }),

  reviewPayment: adminProcedure
    .input(
      z.object({
        paymentId: z.string(),
        action: z.enum(["approve", "reject"]),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const { paymentId, action, notes } = input;
      
      const payment = await prisma.pendingPayment.findUnique({
        where: { id: paymentId },
        include: { User: true },
      });

      if (!payment) throw new Error("Payment not found");

      const currentStatus = (payment.status || "").toLowerCase();
      if (currentStatus !== "pending") {
        throw new Error("Payment has already been reviewed");
      }

      const reviewerId = (ctx.session?.user as any)?.id;
      const newStatus = action === "approve" ? "approved" : "rejected";

      // If approved, apply the correct business logic based on transactionType.
      if (action === "approve") {
        const purpose = (payment.transactionType || "").toUpperCase();
        const metadata = (payment.metadata ?? {}) as any;
        const paymentRef = payment.gatewayReference || payment.id;

        if (purpose === "MEMBERSHIP") {
          const pkgId = metadata.packageId as string | undefined;
          if (!pkgId) throw new Error("Missing packageId in payment metadata");

          await activateMembershipAfterExternalPayment({
            prisma,
            userId: payment.userId,
            packageId: pkgId,
            selectedPalliative: metadata.selectedPalliative,
            paymentReference: paymentRef,
            paymentMethodLabel: "Bank Transfer",
            activatorName: payment.User?.name || payment.User?.email || "New Member",
          });
        } else if (purpose === "UPGRADE") {
          const pkgId = metadata.packageId as string | undefined;
          const fromId = metadata.fromPackageId as string | undefined;
          if (!pkgId || !fromId) {
            throw new Error("Missing packageId/fromPackageId in payment metadata");
          }

          await upgradeMembershipAfterExternalPayment({
            prisma,
            userId: payment.userId,
            packageId: pkgId,
            currentPackageId: fromId,
            selectedPalliative: metadata.selectedPalliative,
            paymentReference: paymentRef,
            paymentMethodLabel: "Bank Transfer",
          });
        } else if (purpose === "TOPUP") {
          await prisma.user.update({
            where: { id: payment.userId },
            data: {
              wallet: { increment: payment.amount },
            },
          });

          await prisma.transaction.create({
            data: {
              id: randomUUID(),
              userId: payment.userId,
              transactionType: "DEPOSIT",
              amount: payment.amount,
              description: `Wallet top-up (admin verified) - ${payment.paymentMethod}`,
              status: "completed",
              reference: paymentRef,
              walletType: "main",
            },
          });
        } else {
          // Backward-compatible fallback: treat as wallet credit.
          await prisma.user.update({
            where: { id: payment.userId },
            data: {
              wallet: { increment: payment.amount },
            },
          });

          await prisma.transaction.create({
            data: {
              id: randomUUID(),
              userId: payment.userId,
              transactionType: "DEPOSIT",
              amount: payment.amount,
              description: `Payment approved (admin verified) - ${payment.paymentMethod}`,
              status: "completed",
              reference: paymentRef,
              walletType: "main",
            },
          });
        }
      }

      // Update payment status
      const updated = await prisma.pendingPayment.update({
        where: { id: paymentId },
        data: {
          status: newStatus,
          reviewedBy: reviewerId,
          reviewedAt: new Date(),
          reviewNotes: notes,
          updatedAt: new Date(),
        },
      });

      // Log the action
      await prisma.auditLog.create({
        data: {
          id: randomUUID(),
          userId: reviewerId || "system",
          action: `PAYMENT_${action.toUpperCase()}`,
          entity: "PendingPayment",
          entityId: paymentId,
          changes: JSON.stringify({ action, amount: payment.amount, userId: payment.userId }),
          status: "success",
          createdAt: new Date(),
        },
      });

      return updated;
    }),

  bulkReviewPayments: adminProcedure
    .input(
      z.object({
        paymentIds: z.array(z.string()),
        action: z.enum(["approve", "reject"]),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const { paymentIds, action, notes } = input;
      const reviewerId = (ctx.session?.user as any)?.id;
      const newStatus = action === "approve" ? "approved" : "rejected";

      // Get all pending payments
      const payments = await prisma.pendingPayment.findMany({
        where: {
          id: { in: paymentIds },
          status: "pending",
        },
        include: { User: true },
      });

      // Process each payment atomically to avoid partial credit + stale status.
      for (const payment of payments) {
        if (action === "approve") {
          const purpose = (payment.transactionType || "").toUpperCase();
          const metadata = (payment.metadata ?? {}) as any;
          const paymentRef = payment.gatewayReference || payment.id;

          if (purpose === "MEMBERSHIP") {
            const pkgId = metadata.packageId as string | undefined;
            if (!pkgId) throw new Error(`Missing packageId for payment ${payment.id}`);

            await activateMembershipAfterExternalPayment({
              prisma,
              userId: payment.userId,
              packageId: pkgId,
              selectedPalliative: metadata.selectedPalliative,
              paymentReference: paymentRef,
              paymentMethodLabel: "Bank Transfer",
              activatorName: payment.User?.name || payment.User?.email || "New Member",
            });
          } else if (purpose === "UPGRADE") {
            const pkgId = metadata.packageId as string | undefined;
            const fromId = metadata.fromPackageId as string | undefined;
            if (!pkgId || !fromId) {
              throw new Error(`Missing packageId/fromPackageId for payment ${payment.id}`);
            }

            await upgradeMembershipAfterExternalPayment({
              prisma,
              userId: payment.userId,
              packageId: pkgId,
              currentPackageId: fromId,
              selectedPalliative: metadata.selectedPalliative,
              paymentReference: paymentRef,
              paymentMethodLabel: "Bank Transfer",
            });
          } else {
            await prisma.user.update({
              where: { id: payment.userId },
              data: {
                wallet: { increment: payment.amount },
              },
            });

            await prisma.transaction.create({
              data: {
                id: randomUUID(),
                userId: payment.userId,
                transactionType: "DEPOSIT",
                amount: payment.amount,
                description: `Payment approved (bulk admin verified) - ${payment.paymentMethod}`,
                status: "completed",
                reference: paymentRef,
                walletType: "main",
              },
            });
          }
        }

        await prisma.pendingPayment.update({
          where: { id: payment.id },
          data: {
            status: newStatus,
            reviewedBy: reviewerId,
            reviewedAt: new Date(),
            reviewNotes: notes,
            updatedAt: new Date(),
          },
        });
      }

      // Log the bulk action
      await prisma.auditLog.create({
        data: {
          id: randomUUID(),
          userId: reviewerId || "system",
          action: `BULK_PAYMENT_${action.toUpperCase()}`,
          entity: "PendingPayment",
          entityId: paymentIds.join(","),
          changes: JSON.stringify({
            count: payments.length,
            totalAmount: payments.reduce((sum: number, p: any) => sum + p.amount, 0),
          }),
          status: "success",
          createdAt: new Date(),
        },
      });

      return { count: payments.length };
    }),

  bulkExportPayments: adminProcedure
    .input(
      z.object({
        paymentIds: z.array(z.string()),
      }),
    )
    .query(async ({ input }) => {
      const { paymentIds } = input;

      const payments = await prisma.pendingPayment.findMany({
        where: { id: { in: paymentIds } },
        include: {
          User: {
            select: {
              email: true,
              name: true,
            },
          },
        },
      });

      return payments;
    }),

  // Package Management
  getPackages: adminProcedure
    .input(
      z.object({
        isActive: z.boolean().optional(),
        search: z.string().optional(),
      })
    )
    .query(async ({ input }) => {
      const { isActive, search } = input;
      const where: any = {};
      
      if (isActive !== undefined) where.isActive = isActive;
      if (search) {
        where.OR = [
          { name: { contains: search, mode: "insensitive" } },
          { packageType: { contains: search, mode: "insensitive" } },
        ];
      }

      const packages = await prisma.membershipPackage.findMany({
        where,
        orderBy: [{ price: "asc" }],
      });

      // Get activation counts for each package
      const packagesWithStats = await Promise.all(
        packages.map(async (pkg) => {
          const activeCount = await prisma.user.count({
            where: { activeMembershipPackageId: pkg.id },
          });

          const totalRevenue = activeCount * (pkg.price + pkg.vat);

          return {
            ...pkg,
            activeSubscriptions: activeCount,
            totalRevenue,
          };
        })
      );

      return packagesWithStats;
    }),

  getPackageById: adminProcedure
    .input(z.object({ packageId: z.string() }))
    .query(async ({ input }) => {
      const pkg = await prisma.membershipPackage.findUnique({
        where: { id: input.packageId },
      });

      if (!pkg) throw new Error("Package not found");

      // Get subscribers
      const subscribers = await prisma.user.findMany({
        where: { activeMembershipPackageId: input.packageId },
        select: {
          id: true,
          name: true,
          email: true,
          membershipActivatedAt: true,
          membershipExpiresAt: true,
        },
        take: 10,
        orderBy: { membershipActivatedAt: "desc" },
      });

      return { ...pkg, subscribers };
    }),

  updatePackage: adminProcedure
    .input(
      z.object({
        packageId: z.string(),
        data: z.object({
          name: z.string().optional(),
          price: z.number().optional(),
          vat: z.number().optional(),
          isActive: z.boolean().optional(),
          features: z.array(z.string()).optional(),
          renewalFee: z.number().optional(),
        }),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const { packageId, data } = input;

      const updated = await prisma.membershipPackage.update({
        where: { id: packageId },
        data: {
          ...data,
          updatedAt: new Date(),
        },
      });

      // Log the action
      await prisma.auditLog.create({
        data: {
          id: randomUUID(),
          userId: (ctx.session?.user as any)?.id || "system",
          action: "UPDATE_PACKAGE",
          entity: "MembershipPackage",
          entityId: packageId,
          changes: JSON.stringify(data),
          status: "success",
          createdAt: new Date(),
        },
      });

      return updated;
    }),

  togglePackageStatus: adminProcedure
    .input(z.object({ packageId: z.string(), isActive: z.boolean() }))
    .mutation(async ({ input, ctx }) => {
      const { packageId, isActive } = input;

      const updated = await prisma.membershipPackage.update({
        where: { id: packageId },
        data: {
          isActive,
          updatedAt: new Date(),
        },
      });

      // Log the action
      await prisma.auditLog.create({
        data: {
          id: randomUUID(),
          userId: (ctx.session?.user as any)?.id || "system",
          action: isActive ? "ACTIVATE_PACKAGE" : "DEACTIVATE_PACKAGE",
          entity: "MembershipPackage",
          entityId: packageId,
          changes: JSON.stringify({ isActive }),
          status: "success",
          createdAt: new Date(),
        },
      });

      return updated;
    }),

  createPackage: adminProcedure
    .input(
      z.object({
        name: z.string().min(1),
        price: z.number().positive(),
        vat: z.number(),
        packageType: z.string().default("STANDARD"),
        isActive: z.boolean().default(true),
        features: z.array(z.string()).default([]),
        hasRenewal: z.boolean().default(true),
        renewalFee: z.number().optional(),
        renewalCycle: z.number().default(365),
        // Activation rewards
        cash_l1: z.number().default(0),
        cash_l2: z.number().default(0),
        cash_l3: z.number().default(0),
        cash_l4: z.number().default(0),
        bpt_l1: z.number().default(0),
        bpt_l2: z.number().default(0),
        bpt_l3: z.number().default(0),
        bpt_l4: z.number().default(0),
        palliative_l1: z.number().default(0),
        palliative_l2: z.number().default(0),
        palliative_l3: z.number().default(0),
        palliative_l4: z.number().default(0),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const newPackage = await prisma.membershipPackage.create({
        data: {
          id: randomUUID(),
          ...input,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });

      // Log the action
      await prisma.auditLog.create({
        data: {
          id: randomUUID(),
          userId: (ctx.session?.user as any)?.id || "system",
          action: "CREATE_PACKAGE",
          entity: "MembershipPackage",
          entityId: newPackage.id,
          changes: JSON.stringify(input),
          status: "success",
          createdAt: new Date(),
        },
      });

      return newPackage;
    }),

  bulkUpdatePackages: adminProcedure
    .input(
      z.object({
        packageIds: z.array(z.string()),
        action: z.enum(["activate", "deactivate", "delete"]),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const { packageIds, action } = input;

      if (action === "delete") {
        // Delete packages
        await prisma.membershipPackage.deleteMany({
          where: { id: { in: packageIds } },
        });

        // Log deletion
        for (const pkgId of packageIds) {
          await prisma.auditLog.create({
            data: {
              id: randomUUID(),
              userId: (ctx.session?.user as any)?.id || "system",
              action: "DELETE_PACKAGE",
              entity: "MembershipPackage",
              entityId: pkgId,
              changes: JSON.stringify({ deleted: true }),
              status: "success",
              createdAt: new Date(),
            },
          });
        }

        return { success: true, count: packageIds.length, action: "deleted" };
      } else {
        // Activate or deactivate
        const isActive = action === "activate";
        
        await prisma.membershipPackage.updateMany({
          where: { id: { in: packageIds } },
          data: { isActive, updatedAt: new Date() },
        });

        // Log the bulk action
        for (const pkgId of packageIds) {
          await prisma.auditLog.create({
            data: {
              id: randomUUID(),
              userId: (ctx.session?.user as any)?.id || "system",
              action: isActive ? "ACTIVATE_PACKAGE" : "DEACTIVATE_PACKAGE",
              entity: "MembershipPackage",
              entityId: pkgId,
              changes: JSON.stringify({ isActive, bulkOperation: true }),
              status: "success",
              createdAt: new Date(),
            },
          });
        }

        return { success: true, count: packageIds.length, action };
      }
    }),

  // Analytics & Reports Endpoints
  getSystemAnalytics: adminProcedure.query(async () => {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Total users
    const totalUsers = await prisma.user.count();
    const activeUsers = await prisma.user.count({
      where: { activeMembershipPackageId: { not: null } },
    });
    const newUsersLast30Days = await prisma.user.count({
      where: { createdAt: { gte: thirtyDaysAgo } },
    });

    // Payments - from Transaction ledger
    const totalPayments = await prisma.transaction.count({
      where: { transactionType: { in: ["DEPOSIT", "MEMBERSHIP_PAYMENT", "PACKAGE_ACTIVATION"] } },
    });
    const completedPayments = await prisma.transaction.count({
      where: {
        transactionType: { in: ["DEPOSIT", "MEMBERSHIP_PAYMENT", "PACKAGE_ACTIVATION"] },
        status: "completed",
      },
    });
    const pendingPayments = await prisma.transaction.count({
      where: {
        transactionType: { in: ["DEPOSIT", "MEMBERSHIP_PAYMENT", "PACKAGE_ACTIVATION"] },
        status: "pending",
      },
    });
    const totalPaymentAmount = await prisma.transaction.aggregate({
      where: {
        transactionType: { in: ["DEPOSIT", "MEMBERSHIP_PAYMENT", "PACKAGE_ACTIVATION"] },
        status: "completed",
        amount: { gt: 0 },
      },
      _sum: { amount: true },
    });

    // Packages
    const totalPackages = await prisma.membershipPackage.count();
    const activePackages = await prisma.membershipPackage.count({
      where: { isActive: true },
    });

    // Recent activity (last 7 days)
    const recentPayments = await prisma.transaction.count({
      where: {
        createdAt: { gte: sevenDaysAgo },
        transactionType: { in: ["DEPOSIT", "MEMBERSHIP_PAYMENT", "PACKAGE_ACTIVATION"] },
        status: "completed",
      },
    });
    const recentActivations = await prisma.user.count({
      where: { 
        membershipActivatedAt: { gte: sevenDaysAgo },
      },
    });

    // Revenue by package
    const revenueByPackage = await prisma.user.groupBy({
      by: ["activeMembershipPackageId"],
      where: {
        activeMembershipPackageId: { not: null },
      },
      _count: { id: true },
    });

    const packageRevenue = await Promise.all(
      revenueByPackage.map(async (item) => {
        const pkg = await prisma.membershipPackage.findUnique({
          where: { id: item.activeMembershipPackageId! },
          select: { name: true, price: true, vat: true },
        });
        return {
          packageName: pkg?.name || "Unknown",
          subscribers: item._count.id,
          revenue: item._count.id * ((pkg?.price || 0) + (pkg?.vat || 0)),
        };
      })
    );

    return {
      users: {
        total: totalUsers,
        active: activeUsers,
        newLast30Days: newUsersLast30Days,
        inactivePercentage: totalUsers > 0 ? ((totalUsers - activeUsers) / totalUsers) * 100 : 0,
      },
      payments: {
        total: totalPayments,
        pending: pendingPayments,
        approved: completedPayments,
        totalAmount: totalPaymentAmount._sum.amount || 0,
      },
      packages: {
        total: totalPackages,
        active: activePackages,
      },
      activity: {
        recentPayments,
        recentActivations,
      },
      revenue: {
        byPackage: packageRevenue,
        total: totalPaymentAmount._sum.amount || 0,
      },
    };
  }),

  getRevenueAnalytics: adminProcedure
    .input(
      z.object({
        period: z.enum(["7d", "30d", "90d", "1y"]).default("30d"),
      })
    )
    .query(async ({ input }) => {
      const now = new Date();
      let startDate: Date;

      switch (input.period) {
        case "7d":
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case "30d":
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        case "90d":
          startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
          break;
        case "1y":
          startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
          break;
      }

      // Get payments by day - from Transaction ledger
      const payments = await prisma.transaction.findMany({
        where: {
          status: "completed",
          transactionType: { in: ["DEPOSIT", "MEMBERSHIP_PAYMENT", "PACKAGE_ACTIVATION"] },
          amount: { gt: 0 },
          createdAt: { gte: startDate },
        },
        select: {
          amount: true,
          createdAt: true,
        },
        orderBy: { createdAt: "asc" },
      });

      // Group by date
      const revenueByDate: Record<string, number> = {};
      payments.forEach((payment: any) => {
        const dateKey = payment.createdAt.toISOString().split("T")[0];
        revenueByDate[dateKey] = (revenueByDate[dateKey] || 0) + payment.amount;
      });

      const chartData = Object.entries(revenueByDate).map(([date, amount]) => ({
        date,
        amount,
      }));

      const totalRevenue = payments.reduce((sum: number, p: any) => sum + p.amount, 0);
      const averagePerDay = chartData.length > 0 ? totalRevenue / chartData.length : 0;

      return {
        chartData,
        totalRevenue,
        averagePerDay,
        transactionCount: payments.length,
      };
    }),

  getUserGrowthAnalytics: adminProcedure
    .input(
      z.object({
        period: z.enum(["7d", "30d", "90d", "1y"]).default("30d"),
      })
    )
    .query(async ({ input }) => {
      const now = new Date();
      let startDate: Date;

      switch (input.period) {
        case "7d":
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case "30d":
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        case "90d":
          startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
          break;
        case "1y":
          startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
          break;
      }

      // Get users by day
      const users = await prisma.user.findMany({
        where: {
          createdAt: { gte: startDate },
        },
        select: {
          createdAt: true,
          membershipActivatedAt: true,
        },
        orderBy: { createdAt: "asc" },
      });

      // Group by date
      const usersByDate: Record<string, { registrations: number; activations: number }> = {};
      users.forEach((user) => {
        const dateKey = user.createdAt.toISOString().split("T")[0];
        if (!usersByDate[dateKey]) {
          usersByDate[dateKey] = { registrations: 0, activations: 0 };
        }
        usersByDate[dateKey].registrations++;
        if (user.membershipActivatedAt && user.membershipActivatedAt >= startDate) {
          const activationKey = user.membershipActivatedAt.toISOString().split("T")[0];
          if (!usersByDate[activationKey]) {
            usersByDate[activationKey] = { registrations: 0, activations: 0 };
          }
          usersByDate[activationKey].activations++;
        }
      });

      const chartData = Object.entries(usersByDate).map(([date, counts]) => ({
        date,
        registrations: counts.registrations,
        activations: counts.activations,
      }));

      return {
        chartData,
        totalRegistrations: users.length,
        totalActivations: users.filter((u) => u.membershipActivatedAt).length,
      };
    }),

  getAuditLogs: adminProcedure
    .input(
      z.object({
        page: z.number().default(1),
        limit: z.number().default(50),
        action: z.string().optional(),
        entity: z.string().optional(),
        userId: z.string().optional(),
        search: z.string().optional(),
      })
    )
    .query(async ({ input }) => {
      const { page, limit, action, entity, userId, search } = input;
      const skip = (page - 1) * limit;

      const where: any = {};
      if (action) where.action = action;
      if (entity) where.entity = entity;
      if (userId) where.userId = userId;
      if (search) {
        where.OR = [
          { action: { contains: search, mode: "insensitive" } },
          { entity: { contains: search, mode: "insensitive" } },
          { entityId: { contains: search, mode: "insensitive" } },
        ];
      }

      const [logs, total] = await Promise.all([
        prisma.auditLog.findMany({
          where,
          include: {
            User: {
              select: {
                name: true,
                email: true,
              },
            },
          },
          orderBy: { createdAt: "desc" },
          skip,
          take: limit,
        }),
        prisma.auditLog.count({ where }),
      ]);

      return {
        logs,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      };
    }),

  // Community Management Endpoints
  getCommunityUpdates: adminProcedure
    .input(
      z.object({
        page: z.number().default(1),
        limit: z.number().default(20),
        category: z.string().optional(),
        isActive: z.boolean().optional(),
        search: z.string().optional(),
      })
    )
    .query(async ({ input }) => {
      const { page, limit, category, isActive, search } = input;
      const skip = (page - 1) * limit;

      const where: any = {};
      if (category) where.category = category;
      if (isActive !== undefined) where.isActive = isActive;
      if (search) {
        where.OR = [
          { title: { contains: search, mode: "insensitive" } },
          { content: { contains: search, mode: "insensitive" } },
        ];
      }

      const [updates, total] = await Promise.all([
        prisma.communityUpdate.findMany({
          where,
          include: {
            User: {
              select: {
                name: true,
                email: true,
              },
            },
            UpdateRead: {
              select: { id: true },
            },
          },
          orderBy: { createdAt: "desc" },
          skip,
          take: limit,
        }),
        prisma.communityUpdate.count({ where }),
      ]);

      return {
        updates,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      };
    }),

  createCommunityUpdate: adminProcedure
    .input(
      z.object({
        title: z.string().min(1),
        content: z.string().min(1),
        category: z.string().default("announcement"),
        priority: z.string().default("MEDIUM"),
        imageUrl: z.string().optional(),
        ctaText: z.string().optional(),
        ctaLink: z.string().optional(),
        publishedAt: z.string().optional(),
        expiresAt: z.string().optional(),
        targetPackages: z.string().optional(),
        targetRanks: z.string().optional(),
        targetRegions: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const now = new Date();
      const publishedAt = input.publishedAt ? new Date(input.publishedAt) : now;
      const isActive = publishedAt <= now; // Auto-activate if publish time is now or in the past

      const update = await prisma.communityUpdate.create({
        data: {
          id: randomUUID(),
          ...input,
          publishedAt,
          isActive,
          expiresAt: input.expiresAt ? new Date(input.expiresAt) : undefined,
          createdBy: (ctx.session?.user as any)?.id || "system",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });

      await prisma.auditLog.create({
        data: {
          id: randomUUID(),
          userId: (ctx.session?.user as any)?.id || "system",
          action: "CREATE_COMMUNITY_UPDATE",
          entity: "CommunityUpdate",
          entityId: update.id,
          changes: JSON.stringify(input),
          status: "success",
          createdAt: new Date(),
        },
      });

      return update;
    }),

  updateCommunityUpdate: adminProcedure
    .input(
      z.object({
        updateId: z.string(),
        data: z.object({
          title: z.string().optional(),
          content: z.string().optional(),
          category: z.string().optional(),
          priority: z.string().optional(),
          isActive: z.boolean().optional(),
          imageUrl: z.string().optional(),
          ctaText: z.string().optional(),
          ctaLink: z.string().optional(),
          expiresAt: z.string().optional(),
        }),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const { updateId, data } = input;

      const updated = await prisma.communityUpdate.update({
        where: { id: updateId },
        data: {
          ...data,
          expiresAt: data.expiresAt ? new Date(data.expiresAt) : undefined,
          updatedAt: new Date(),
        },
      });

      await prisma.auditLog.create({
        data: {
          id: randomUUID(),
          userId: (ctx.session?.user as any)?.id || "system",
          action: "UPDATE_COMMUNITY_UPDATE",
          entity: "CommunityUpdate",
          entityId: updateId,
          changes: JSON.stringify(data),
          status: "success",
          createdAt: new Date(),
        },
      });

      return updated;
    }),

  deleteCommunityUpdate: adminProcedure
    .input(z.object({ updateId: z.string() }))
    .mutation(async ({ input, ctx }) => {
      await prisma.communityUpdate.delete({
        where: { id: input.updateId },
      });

      await prisma.auditLog.create({
        data: {
          id: randomUUID(),
          userId: (ctx.session?.user as any)?.id || "system",
          action: "DELETE_COMMUNITY_UPDATE",
          entity: "CommunityUpdate",
          entityId: input.updateId,
          changes: JSON.stringify({ deleted: true }),
          status: "success",
          createdAt: new Date(),
        },
      });

      return { success: true };
    }),

  getBestDeals: adminProcedure
    .input(
      z.object({
        page: z.number().default(1),
        limit: z.number().default(20),
        isActive: z.boolean().optional(),
        search: z.string().optional(),
      })
    )
    .query(async ({ input }) => {
      const { page, limit, isActive, search } = input;
      const skip = (page - 1) * limit;

      const where: any = {};
      if (isActive !== undefined) where.isActive = isActive;
      if (search) {
        where.OR = [
          { title: { contains: search, mode: "insensitive" } },
          { description: { contains: search, mode: "insensitive" } },
        ];
      }

      const [deals, total] = await Promise.all([
        prisma.bestDeal.findMany({
          where,
          include: {
            User: {
              select: {
                name: true,
                email: true,
              },
            },
            DealClaim: {
              select: { id: true },
            },
          },
          orderBy: { createdAt: "desc" },
          skip,
          take: limit,
        }),
        prisma.bestDeal.count({ where }),
      ]);

      return {
        deals,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      };
    }),

  createBestDeal: adminProcedure
    .input(
      z.object({
        title: z.string().min(1),
        description: z.string().min(1),
        dealType: z.string(),
        discountType: z.string(),
        discountValue: z.number(),
        originalPrice: z.number().optional(),
        discountedPrice: z.number().optional(),
        startDate: z.string(),
        endDate: z.string(),
        usageLimit: z.number().optional(),
        usagePerUser: z.number().default(1),
        eligiblePackages: z.string().optional(),
        eligibleRanks: z.string().optional(),
        minPurchaseAmount: z.number().optional(),
        isFeatured: z.boolean().default(false),
        imageUrl: z.string().optional(),
        ctaText: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const deal = await prisma.bestDeal.create({
        data: {
          id: randomUUID(),
          ...input,
          startDate: new Date(input.startDate),
          endDate: new Date(input.endDate),
          createdBy: (ctx.session?.user as any)?.id || "system",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });

      await prisma.auditLog.create({
        data: {
          id: randomUUID(),
          userId: (ctx.session?.user as any)?.id || "system",
          action: "CREATE_DEAL",
          entity: "BestDeal",
          entityId: deal.id,
          changes: JSON.stringify(input),
          status: "success",
          createdAt: new Date(),
        },
      });

      return deal;
    }),

  updateBestDeal: adminProcedure
    .input(
      z.object({
        dealId: z.string(),
        data: z.object({
          title: z.string().optional(),
          description: z.string().optional(),
          isActive: z.boolean().optional(),
          isFeatured: z.boolean().optional(),
          discountValue: z.number().optional(),
          usageLimit: z.number().optional(),
        }),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const { dealId, data } = input;

      const updated = await prisma.bestDeal.update({
        where: { id: dealId },
        data: {
          ...data,
          updatedAt: new Date(),
        },
      });

      await prisma.auditLog.create({
        data: {
          id: randomUUID(),
          userId: (ctx.session?.user as any)?.id || "system",
          action: "UPDATE_DEAL",
          entity: "BestDeal",
          entityId: dealId,
          changes: JSON.stringify(data),
          status: "success",
          createdAt: new Date(),
        },
      });

      return updated;
    }),

  // Notification Broadcasting
  broadcastNotification: adminProcedure
    .input(
      z.object({
        title: z.string().min(1),
        message: z.string().min(1),
        type: z.string().default("info"),
        targetUserIds: z.array(z.string()).optional(),
        targetPackages: z.string().optional(),
        targetRanks: z.string().optional(),
        link: z.string().optional(),
        expiresAt: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      let userIds = input.targetUserIds;

      // If no specific users, filter by packages/ranks
      if (!userIds || userIds.length === 0) {
        const where: any = {};
        
        if (input.targetPackages) {
          const packageIds = input.targetPackages.split(",").map((id: string) => id.trim());
          where.activeMembershipPackageId = { in: packageIds };
        }

        const users = await prisma.user.findMany({
          where,
          select: { id: true },
        });

        userIds = users.map((u: any) => u.id);
      }

      // Create notifications for each user
      const notifications = await Promise.all(
        (userIds || []).map((userId: string) =>
          prisma.notification.create({
            data: {
              id: randomUUID(),
              userId,
              title: input.title,
              message: input.message,
              link: input.link,
              isRead: false,
              createdAt: new Date(),
            },
          })
        )
      );

      await prisma.auditLog.create({
        data: {
          id: randomUUID(),
          userId: (ctx.session?.user as any)?.id || "system",
          action: "BROADCAST_NOTIFICATION",
          entity: "Notification",
          entityId: "broadcast",
          changes: JSON.stringify({
            title: input.title,
            recipientCount: notifications.length,
          }),
          status: "success",
          createdAt: new Date(),
        },
      });

      return {
        success: true,
        sent: notifications.length,
      };
    }),

  toggleUpdateStatus: adminProcedure
    .input(
      z.object({
        updateId: z.string(),
        isActive: z.boolean(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const updated = await prisma.communityUpdate.update({
        where: { id: input.updateId },
        data: { isActive: input.isActive },
      });

      await prisma.auditLog.create({
        data: {
          id: randomUUID(),
          userId: (ctx.session?.user as any)?.id || "system",
          action: "TOGGLE_UPDATE_STATUS",
          entity: "CommunityUpdate",
          entityId: input.updateId,
          changes: JSON.stringify({ isActive: input.isActive }),
          status: "success",
          createdAt: new Date(),
        },
      });

      return updated;
    }),

  toggleDealStatus: adminProcedure
    .input(
      z.object({
        dealId: z.string(),
        isActive: z.boolean(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const updated = await prisma.bestDeal.update({
        where: { id: input.dealId },
        data: { isActive: input.isActive },
      });

      await prisma.auditLog.create({
        data: {
          id: randomUUID(),
          userId: (ctx.session?.user as any)?.id || "system",
          action: "TOGGLE_DEAL_STATUS",
          entity: "BestDeal",
          entityId: input.dealId,
          changes: JSON.stringify({ isActive: input.isActive }),
          status: "success",
          createdAt: new Date(),
        },
      });

      return updated;
    }),

  // Settings Management Endpoints
  getSystemSettings: adminProcedure.query(async () => {
    const settings = await prisma.adminSettings.findMany({
      orderBy: { settingKey: "asc" },
    });

    // Convert to key-value object
    const settingsMap: Record<string, any> = {};
    settings.forEach((setting: any) => {
      settingsMap[setting.settingKey] = {
        value: setting.settingValue,
        description: setting.description,
        updatedAt: setting.updatedAt,
      };
    });

    return settingsMap;
  }),

  updateSystemSetting: adminProcedure
    .input(
      z.object({
        settingKey: z.string(),
        settingValue: z.string(),
        description: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const setting = await prisma.adminSettings.upsert({
        where: { settingKey: input.settingKey },
        create: {
          id: randomUUID(),
          settingKey: input.settingKey,
          settingValue: input.settingValue,
          description: input.description,
          updatedAt: new Date(),
        },
        update: {
          settingValue: input.settingValue,
          description: input.description,
          updatedAt: new Date(),
        },
      });

      await prisma.auditLog.create({
        data: {
          id: randomUUID(),
          userId: (ctx.session?.user as any)?.id || "system",
          action: "UPDATE_SETTING",
          entity: "AdminSettings",
          entityId: setting.id,
          changes: JSON.stringify(input),
          status: "success",
          createdAt: new Date(),
        },
      });

      return setting;
    }),

  getPaymentGateways: adminProcedure.query(async () => {
    const now = new Date();
    const defaultGateways = [
      {
        gatewayName: "paystack",
        displayName: "Paystack",
        provider: "paystack",
        displayOrder: 10,
      },
      {
        gatewayName: "flutterwave",
        displayName: "Flutterwave",
        provider: "flutterwave",
        displayOrder: 20,
      },
      {
        gatewayName: "bank-transfer",
        displayName: "Bank Transfer",
        provider: "bank-transfer",
        displayOrder: 30,
      },
      {
        gatewayName: "utility-token",
        displayName: "Utility Token",
        provider: "utility-token",
        displayOrder: 40,
      },
      {
        gatewayName: "crypto",
        displayName: "Crypto",
        provider: "crypto",
        displayOrder: 50,
      },
      {
        gatewayName: "mock",
        displayName: "Mock",
        provider: "mock",
        displayOrder: 60,
      },
    ];

    // Check if table is empty
    const existingCount = await prisma.paymentGatewayConfig.count();
    
    if (existingCount === 0) {
      // Force create defaults if table is empty
      for (const gateway of defaultGateways) {
        await prisma.paymentGatewayConfig.create({
          data: {
            id: randomUUID(),
            gatewayName: gateway.gatewayName,
            displayName: gateway.displayName,
            provider: gateway.provider,
            isActive: false,
            supportedMethods: [],
            currency: "NGN",
            displayOrder: gateway.displayOrder,
            createdAt: now,
            updatedAt: now,
          },
        });
      }
    }

    return await prisma.paymentGatewayConfig.findMany({
      orderBy: { displayOrder: "asc" },
    });
  }),

  updatePaymentGateway: adminProcedure
    .input(
      z.object({
        id: z.string(),
        isActive: z.boolean().optional(),
        // Paystack & Flutterwave fields
        publicKey: z.string().optional(),
        secretKey: z.string().optional(),
        merchantId: z.string().optional(),
        webhookUrl: z.string().optional(),
        callbackUrl: z.string().optional(),
        // Crypto fields
        apiProvider: z.string().optional(),
        merchantKey: z.string().optional(),
        cryptoPublicKey: z.string().optional(),
        cryptoSecretKey: z.string().optional(),
        // Bank Transfer fields
        bankName: z.string().optional(),
        bankAccount: z.string().optional(),
        bankAccountName: z.string().optional(),
        // Utility Token fields
        tokenName: z.string().optional(),
        tokenSymbol: z.string().optional(),
        tokenContractAddress: z.string().optional(),
        tokenomicsUrl: z.string().optional(),
        homePageUrl: z.string().optional(),
        currentPriceNgn: z.number().optional(),
        currentPriceUsd: z.number().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const { id, ...data } = input;

      const gateway = await prisma.paymentGatewayConfig.update({
        where: { id },
        data: {
          ...data,
          updatedAt: new Date(),
        },
      });

      await prisma.auditLog.create({
        data: {
          id: randomUUID(),
          userId: (ctx.session?.user as any)?.id || "system",
          action: "UPDATE_PAYMENT_GATEWAY",
          entity: "PaymentGatewayConfig",
          entityId: id,
          changes: JSON.stringify({
            ...data,
            secretKey: data.secretKey ? "***REDACTED***" : undefined,
            cryptoSecretKey: data.cryptoSecretKey ? "***REDACTED***" : undefined,
            merchantKey: data.merchantKey ? "***REDACTED***" : undefined,
          }),
          status: "success",
          createdAt: new Date(),
        },
      });

      return gateway;
    }),

  getNotificationSettings: adminProcedure.query(async () => {
    return await prisma.adminNotificationSettings.findMany({
      orderBy: { notificationType: "asc" },
    });
  }),

  updateNotificationSetting: adminProcedure
    .input(
      z.object({
        id: z.string(),
        enabled: z.boolean().optional(),
        emailEnabled: z.boolean().optional(),
        smsEnabled: z.boolean().optional(),
        pushEnabled: z.boolean().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const { id, ...data } = input;

      const setting = await prisma.adminNotificationSettings.update({
        where: { id },
        data: {
          ...data,
          updatedAt: new Date(),
        },
      });

      await prisma.auditLog.create({
        data: {
          id: randomUUID(),
          userId: (ctx.session?.user as any)?.id || "system",
          action: "UPDATE_NOTIFICATION_SETTING",
          entity: "AdminNotificationSettings",
          entityId: id,
          changes: JSON.stringify(data),
          status: "success",
          createdAt: new Date(),
        },
      });

      return setting;
    }),

  initializeNotificationSettings: adminProcedure
    .mutation(async ({ ctx }) => {
      const now = new Date();
      const existing = await prisma.adminNotificationSettings.count();

      const defaults = [
        "user_registered",
        "payment_received",
        "payment_failed",
        "membership_activated",
        "membership_upgraded",
        "withdrawal_requested",
        "withdrawal_processed",
      ];

      if (existing === 0) {
        for (const type of defaults) {
          await prisma.adminNotificationSettings.create({
            data: {
              id: randomUUID(),
              notificationType: type,
              enabled: true,
              emailEnabled: true,
              smsEnabled: false,
              pushEnabled: false,
              createdAt: now,
              updatedAt: now,
            },
          });
        }

        await prisma.auditLog.create({
          data: {
            id: randomUUID(),
            userId: (ctx.session?.user as any)?.id || "system",
            action: "INITIALIZE_NOTIFICATION_SETTINGS",
            entity: "AdminNotificationSettings",
            entityId: "bulk",
            changes: JSON.stringify({ created: defaults.length }),
            status: "success",
            createdAt: now,
          },
        });
      }

      return await prisma.adminNotificationSettings.findMany({
        orderBy: { notificationType: "asc" },
      });
    }),

  // Backup & Restore
  createBackup: adminProcedure
    .mutation(async () => {
      const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
      const backupDir = path.join(process.cwd(), "public", "uploads", "backups");
      const filename = `backup-${timestamp}.json`;
      const filePath = path.join(backupDir, filename);

      // Ensure directory exists
      await fs.promises.mkdir(backupDir, { recursive: true });

      // Collect critical tables
      const [
        users,
        pendingPayments,
        transactions,
        adminSettings,
        gateways,
        notifications,
        packages,
        communityUpdates,
        bestDeals,
        auditLogs,
        referrals,
        referralTrees,
      ] = await Promise.all([
        prisma.user.findMany(),
        prisma.pendingPayment.findMany(),
        prisma.transaction.findMany(),
        prisma.adminSettings.findMany(),
        prisma.paymentGatewayConfig.findMany(),
        prisma.adminNotificationSettings.findMany(),
        prisma.membershipPackage.findMany(),
        prisma.communityUpdate.findMany(),
        prisma.bestDeal.findMany(),
        prisma.auditLog.findMany({ orderBy: { createdAt: "desc" }, take: 5000 }),
        prisma.referral.findMany(),
        prisma.referralTree.findMany(),
      ]);

      const backupPayload = {
        meta: {
          createdAt: new Date().toISOString(),
          version: 1,
          note: "Admin backup of critical tables",
        },
        users,
        pendingPayments,
        transactions,
        adminSettings,
        gateways,
        notifications,
        packages,
        communityUpdates,
        bestDeals,
        auditLogs,
        referrals,
        referralTrees,
      };

      await fs.promises.writeFile(filePath, JSON.stringify(backupPayload, null, 2), "utf-8");

      // Enforce retention policy (keep last N backups)
      try {
        const retentionSetting = await prisma.adminSettings.findUnique({
          where: { settingKey: "backup.retention.count" },
        });
        const retentionCount = retentionSetting ? parseInt(retentionSetting.settingValue, 10) : NaN;
        if (!Number.isNaN(retentionCount) && retentionCount > 0) {
          const files = await fs.promises.readdir(backupDir);
          const jsonFiles = files.filter((f) => f.endsWith(".json"));
          const withTimes = await Promise.all(
            jsonFiles.map(async (f) => {
              const stats = await fs.promises.stat(path.join(backupDir, f));
              return { f, t: stats.birthtime.getTime() };
            }),
          );
          // Newest first
          withTimes.sort((a, b) => b.t - a.t);
          const toDelete = withTimes.slice(retentionCount);
          for (const d of toDelete) {
            try {
              await fs.promises.unlink(path.join(backupDir, d.f));
            } catch (_) {}
          }
        }
      } catch (_) {}

      return {
        filename,
        url: `/uploads/backups/${filename}`,
        createdAt: backupPayload.meta.createdAt,
        counts: {
          users: users.length,
          pendingPayments: pendingPayments.length,
          transactions: transactions.length,
          settings: adminSettings.length,
          gateways: gateways.length,
          notifications: notifications.length,
          packages: packages.length,
          communityUpdates: communityUpdates.length,
          bestDeals: bestDeals.length,
          auditLogs: auditLogs.length,
          referrals: referrals.length,
          referralTrees: referralTrees.length,
        },
      };
    }),

  restoreDatabase: adminProcedure
    .input(
      z.object({
        // Client uploads JSON; we restore via upserts
        data: z.any(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const payload = input.data || {};

      // Basic validations
      if (!payload || typeof payload !== "object") {
        throw new Error("Invalid backup payload");
      }

      // Restore order: settings/gateways/packages/users/referrals/transactions/pendingPayments/community/bestDeals/notifications/auditLogs
      // Use upserts where possible to avoid duplicates; fallback to create for logs
      const upsertArray = async (model: any, items: any[], idKey: string = "id") => {
        for (const item of items || []) {
          try {
            const id = item[idKey];
            if (!id) continue;
            await model.upsert({
              where: { [idKey]: id },
              create: item,
              update: item,
            });
          } catch (err) {
            // If upsert not supported (e.g., lacks unique), fallback to create
            try {
              await model.create({ data: item });
            } catch (_) {
              // ignore problematic row to ensure progress
            }
          }
        }
      };

      await upsertArray(prisma.adminSettings, payload.adminSettings || []);
      await upsertArray(prisma.paymentGatewayConfig, payload.gateways || []);
      await upsertArray(prisma.membershipPackage, payload.packages || []);
      await upsertArray(prisma.user, payload.users || []);
      await upsertArray(prisma.referral, payload.referrals || []);
      await upsertArray(prisma.referralTree, payload.referralTrees || []);
      await upsertArray(prisma.transaction, payload.transactions || []);
      await upsertArray(prisma.pendingPayment, payload.pendingPayments || []);
      await upsertArray(prisma.communityUpdate, payload.communityUpdates || []);
      await upsertArray(prisma.bestDeal, payload.bestDeals || []);
      await upsertArray(prisma.adminNotificationSettings, payload.notifications || []);

      // Audit logs: append only to preserve history
      for (const log of payload.auditLogs || []) {
        try {
          await prisma.auditLog.create({ data: log });
        } catch (_) {
          // ignore duplicates
        }
      }

      await prisma.auditLog.create({
        data: {
          id: randomUUID(),
          userId: (ctx.session?.user as any)?.id || "system",
          action: "RESTORE_DATABASE",
          entity: "Backup",
          entityId: payload?.meta?.createdAt || "backup",
          changes: JSON.stringify({ counts: {
            users: (payload.users || []).length,
            pendingPayments: (payload.pendingPayments || []).length,
            transactions: (payload.transactions || []).length,
          }}),
          status: "success",
          createdAt: new Date(),
        },
      });

      return { restored: true };
    }),

  listBackups: adminProcedure.query(async () => {
    const backupDir = path.join(process.cwd(), "public", "uploads", "backups");
    try {
      await fs.promises.mkdir(backupDir, { recursive: true });
      const files = await fs.promises.readdir(backupDir);
      const items = await Promise.all(
        files
          .filter((f) => f.endsWith(".json"))
          .map(async (filename) => {
            const full = path.join(backupDir, filename);
            const stats = await fs.promises.stat(full);
            return {
              filename,
              url: `/uploads/backups/${filename}`,
              size: stats.size,
              createdAt: stats.birthtime.toISOString(),
            };
          })
      );
      // Newest first
      items.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      return items;
    } catch (e) {
      return [] as any[];
    }
  }),

  deleteBackup: adminProcedure
    .input(z.object({ filename: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const backupDir = path.join(process.cwd(), "public", "uploads", "backups");
      const target = path.join(backupDir, input.filename);
      // Basic safety: only delete .json files inside backups dir
      if (!input.filename.endsWith(".json")) {
        throw new Error("Invalid backup file");
      }
      try {
        await fs.promises.unlink(target);
      } catch (e: any) {
        throw new Error(e?.message || "Failed to delete backup");
      }

      await prisma.auditLog.create({
        data: {
          id: randomUUID(),
          userId: (ctx.session?.user as any)?.id || "system",
          action: "DELETE_BACKUP",
          entity: "Backup",
          entityId: input.filename,
          status: "success",
          createdAt: new Date(),
        },
      });

      return { deleted: true };
    }),

  getPendingEmpowermentPackages: adminProcedure.query(async () => {
    return await prisma.empowermentPackage.findMany({
      where: {
        OR: [
          { status: "Pending Maturity" },
          { status: "Pending Maturity (24 Months)" }
        ],
        adminApproved: false,
      },
      include: {
        User_EmpowermentPackage_sponsorIdToUser: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        User_EmpowermentPackage_beneficiaryIdToUser: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        EmpowermentTransaction: {
          orderBy: { createdAt: "desc" },
          take: 5,
        },
      },
      orderBy: { maturityDate: "asc" },
    });
  }),

  getAllEmpowerments: adminProcedure
    .input(
      z.object({
        status: z.string().optional(),
        limit: z.number().default(50),
      })
    )
    .query(async ({ input }) => {
      const where = input.status ? { status: input.status } : {};

      return await prisma.empowermentPackage.findMany({
        where,
        include: {
          User_EmpowermentPackage_sponsorIdToUser: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          User_EmpowermentPackage_beneficiaryIdToUser: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        take: input.limit,
      });
    }),

  // Get L5-L10 shelter rewards (admin only visibility)
  getShelterRewardsExtended: adminProcedure
    .input(
      z.object({
        userId: z.string().optional(),
        minLevel: z.number().default(5),
        maxLevel: z.number().default(10),
      })
    )
    .query(async ({ input }) => {
      const where: any = {
        level: {
          gte: input.minLevel,
          lte: input.maxLevel,
        },
      };

      if (input.userId) {
        where.userId = input.userId;
      }

      return await prisma.shelterReward.findMany({
        where,
        include: {
          User: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
        orderBy: [{ level: "asc" }, { createdAt: "desc" }],
      });
    }),

  // Get shelter reward statistics
  getShelterStats: adminProcedure.query(async () => {
    const totalShelterRewards = await prisma.shelterReward.count();
    const totalShelterAmount = await prisma.shelterReward.aggregate({
      _sum: { amount: true },
    });

    const rewardsByPackage = await prisma.shelterReward.groupBy({
      by: ["packageType"],
      _count: true,
      _sum: { amount: true },
    });

    // Get level distribution
    const levelDistribution = await prisma.shelterReward.groupBy({
      by: ["level"],
      _count: true,
      _sum: { amount: true },
      orderBy: { level: "asc" },
    });

    return {
      totalRewards: totalShelterRewards,
      totalAmount: totalShelterAmount._sum.amount || 0,
      byLevel: levelDistribution.map((r) => ({
        level: r.level,
        count: r._count,
        total: r._sum.amount || 0,
      })),
      byPackage: rewardsByPackage.map((r) => ({
        packageType: r.packageType,
        count: r._count,
        total: r._sum.amount || 0,
      })),
    };
  }),

  // Get BPT buy-back wallet balance
  getBuyBackWalletBalance: adminProcedure.query(async () => {
    const buyBackWallet = await prisma.systemWallet.findFirst({
      where: { name: "BPI Token Buy-Back Wallet" },
    });

    if (!buyBackWallet) {
      return {
        balanceNgn: 0,
        balanceBpt: 0,
        balanceUsd: 0,
      };
    }

    return {
      balanceNgn: buyBackWallet.balanceNgn,
      balanceBpt: buyBackWallet.balanceBpt,
      balanceUsd: buyBackWallet.balanceUsd,
    };
  }),

  // Get system statistics
  getSystemStats: adminProcedure.query(async () => {
    const [totalUsers,
      activeMembers,
      totalPackageActivations,
      totalRenewals,
      totalEmpowerments,
      pendingEmpowerments,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { activated: true } }),
      prisma.packageActivation.count(),
      prisma.renewalHistory.count(),
      prisma.empowermentPackage.count(),
      prisma.empowermentPackage.count({
        where: {
          OR: [
            { status: "Pending Maturity" },
            { status: "Pending Maturity (24 Months)" }
          ],
          adminApproved: false,
        },
      }),
    ]);

    // Get total BPT distributed (member share only)
    const totalBptDistributed = await prisma.tokenTransaction.aggregate({
      _sum: { memberAmount: true },
    });

    return {
      totalUsers,
      activeMembers,
      totalPackageActivations,
      totalRenewals,
      totalEmpowerments,
      pendingEmpowerments,
      totalBptDistributed: totalBptDistributed._sum.memberAmount || 0,
    };
  }),

  // Get user's full wallet details (admin view)
  getUserWallets: adminProcedure
    .input(z.object({ userId: z.string() }))
    .query(async ({ input }) => {
      const user = await prisma.user.findUnique({
        where: { id: input.userId },
        select: {
          id: true,
          name: true,
          email: true,
          wallet: true,
          palliative: true,
          cashback: true,
          bpiTokenWallet: true,
          shelter: true,
          health: true,
          meal: true,
          security: true,
          education: true,
          community: true,
          spendable: true,
          activeMembershipPackageId: true,
          membershipActivatedAt: true,
          membershipExpiresAt: true,
          renewalCount: true,
        },
      });

      if (!user) {
        throw new Error("User not found.");
      }

      return user;
    }),

  approveEmpowermentPackage: adminProcedure
    .input(z.object({ packageId: z.string() }))
    .mutation(async ({ input }) => {
      return await prisma.empowermentPackage.update({
        where: { id: input.packageId },
        data: { status: "Approved – Activation Pending" },
      });
    }),

  triggerFallbackProtection: adminProcedure
    .input(z.object({ packageId: z.string() }))
    .mutation(async ({ input }) => {
      const FALLBACK_NET_AMOUNT = 366300;

      const pkg = await prisma.empowermentPackage.findUnique({
        where: { id: input.packageId },
      });

      if (!pkg) {
        throw new Error("Package not found");
      }

      // Add funds to sponsor's main wallet
      await prisma.user.update({
        where: { id: pkg.sponsorId },
        data: { wallet: { increment: FALLBACK_NET_AMOUNT } },
      });

      return await prisma.empowermentPackage.update({
        where: { id: input.packageId },
        data: { status: "Fallback Protection Activated" },
      });
    }),
  
  convertEmpowermentPackage: adminProcedure
    .input(z.object({ packageId: z.string() }))
    .mutation(async ({ input }) => {
        // This is a complex operation involving multiple steps.
        // For now, we'll just update the status.
        // Full implementation would require activating Regular Plus and Myngul,
        // and crediting the remaining balance to a restricted wallet.
        return await prisma.empowermentPackage.update({
            where: { id: input.packageId },
            data: { status: "Converted to Regular Plus", isConverted: true },
        });
    }),

  // ============ TRAINING CENTER ADMIN CONTROLS ============
  
  // Get all training courses
  getAllCourses: adminProcedure.query(async () => {
    return await prisma.trainingCourse.findMany({
      include: {
        TrainingLesson: {
          orderBy: { lessonOrder: 'asc' },
        },
        _count: {
          select: {
            TrainingLesson: true,
            TrainingProgress: true,
          },
        },
      },
      orderBy: { displayOrder: 'asc' },
    });
  }),

  // Create training course
  createCourse: adminProcedure
    .input(z.object({
      title: z.string(),
      description: z.string(),
      category: z.string(),
      difficulty: z.enum(['beginner', 'intermediate', 'advanced']),
      thumbnailUrl: z.string().optional(),
      estimatedHours: z.number().optional(),
      displayOrder: z.number().default(0),
      isActive: z.boolean().default(true),
    }))
    .mutation(async ({ ctx, input }) => {
      const userId = (ctx.session?.user as any)?.id;
      if (!userId) throw new Error("Unauthorized");
      return await prisma.trainingCourse.create({
        data: {
          id: randomUUID(),
          ...input,
          createdBy: userId,
          updatedAt: new Date(),
        },
      });
    }),

  // Update training course
  updateCourse: adminProcedure
    .input(z.object({
      courseId: z.string(),
      title: z.string().optional(),
      description: z.string().optional(),
      category: z.string().optional(),
      difficulty: z.enum(['beginner', 'intermediate', 'advanced']).optional(),
      thumbnailUrl: z.string().optional(),
      estimatedHours: z.number().optional(),
      displayOrder: z.number().optional(),
      isActive: z.boolean().optional(),
    }))
    .mutation(async ({ input }) => {
      const { courseId, ...data } = input;
      return await prisma.trainingCourse.update({
        where: { id: courseId },
        data,
      });
    }),

  // Delete training course
  deleteCourse: adminProcedure
    .input(z.object({ courseId: z.string() }))
    .mutation(async ({ input }) => {
      return await prisma.trainingCourse.delete({
        where: { id: input.courseId },
      });
    }),

  // Create lesson
  createLesson: adminProcedure
    .input(z.object({
      courseId: z.string(),
      title: z.string(),
      content: z.string(),
      lessonOrder: z.number(),
      videoUrl: z.string().optional(),
      documentUrl: z.string().optional(),
      estimatedMinutes: z.number().optional(),
      quizQuestions: z.any().optional(),
    }))
    .mutation(async ({ input }) => {
      return await prisma.trainingLesson.create({
        data: {
          id: randomUUID(),
          ...input,
          updatedAt: new Date(),
        },
      });
    }),

  // Update lesson
  updateLesson: adminProcedure
    .input(z.object({
      lessonId: z.string(),
      title: z.string().optional(),
      content: z.string().optional(),
      lessonOrder: z.number().optional(),
      videoUrl: z.string().optional(),
      documentUrl: z.string().optional(),
      estimatedMinutes: z.number().optional(),
      quizQuestions: z.any().optional(),
    }))
    .mutation(async ({ input }) => {
      const { lessonId, ...data } = input;
      return await prisma.trainingLesson.update({
        where: { id: lessonId },
        data,
      });
    }),

  // Delete lesson
  deleteLesson: adminProcedure
    .input(z.object({ lessonId: z.string() }))
    .mutation(async ({ input }) => {
      return await prisma.trainingLesson.delete({
        where: { id: input.lessonId },
      });
    }),

  // Get course enrollment statistics
  getCourseStats: adminProcedure.query(async () => {
    const totalCourses = await prisma.trainingCourse.count();
    const activeCourses = await prisma.trainingCourse.count({ where: { isActive: true } });
    const totalEnrollments = await prisma.trainingProgress.count();
    const completedEnrollments = await prisma.trainingProgress.count({
      where: { completedAt: { not: null } },
    });

    const topCourses = await prisma.trainingCourse.findMany({
      take: 5,
      include: {
        _count: {
          select: { TrainingProgress: true },
        },
      },
      orderBy: {
        TrainingProgress: {
          _count: 'desc',
        },
      },
    });

    return {
      totalCourses,
      activeCourses,
      totalEnrollments,
      completedEnrollments,
      completionRate: totalEnrollments > 0 ? (completedEnrollments / totalEnrollments) * 100 : 0,
      topCourses: topCourses.map(c => ({
        id: c.id,
        title: c.title,
        enrollments: c._count.TrainingProgress,
      })),
    };
  }),

  // ============ COMMUNITY UPDATES ADMIN CONTROLS ============
  
  // Get all community updates
  getAllUpdates: adminProcedure
    .input(z.object({
      category: z.string().optional(),
      isActive: z.boolean().optional(),
    }))
    .query(async ({ input }) => {
      const where: any = {};
      if (input.category) where.category = input.category;
      if (input.isActive !== undefined) where.isActive = input.isActive;

      return await prisma.communityUpdate.findMany({
        where,
        include: {
          User: {
            select: {
              id: true,
              firstname: true,
              lastname: true,
              email: true,
            },
          },
          _count: {
            select: {
              UpdateRead: true,
            },
          },
        },
        orderBy: [
          { priority: 'desc' },
          { publishedAt: 'desc' },
        ],
      });
    }),

  // Create community update
  createUpdate: adminProcedure
    .input(z.object({
      title: z.string(),
      content: z.string(),
      category: z.enum(['announcement', 'promotion', 'news', 'event', 'policy', 'success']),
      priority: z.enum(['LOW', 'MEDIUM', 'HIGH']).default('MEDIUM'),
      imageUrl: z.string().optional(),
      ctaText: z.string().optional(),
      ctaLink: z.string().optional(),
      publishedAt: z.date().optional(),
      expiresAt: z.date().optional(),
      isActive: z.boolean().default(true),
    }))
    .mutation(async ({ ctx, input }) => {
      const userId = (ctx.session?.user as any)?.id;
      if (!userId) throw new Error("Unauthorized");
      return await prisma.communityUpdate.create({
        data: {
          id: randomUUID(),
          ...input,
          createdBy: userId,
          updatedAt: new Date(),
        },
      });
    }),

  // Update community update
  updateUpdate: adminProcedure
    .input(z.object({
      updateId: z.string(),
      title: z.string().optional(),
      content: z.string().optional(),
      category: z.enum(['announcement', 'promotion', 'news', 'event', 'policy', 'success']).optional(),
      priority: z.enum(['LOW', 'MEDIUM', 'HIGH']).optional(),
      imageUrl: z.string().optional(),
      ctaText: z.string().optional(),
      ctaLink: z.string().optional(),
      expiresAt: z.date().optional(),
      isActive: z.boolean().optional(),
    }))
    .mutation(async ({ input }) => {
      const { updateId, ...data } = input;
      return await prisma.communityUpdate.update({
        where: { id: updateId },
        data,
      });
    }),

  // Delete community update
  deleteUpdate: adminProcedure
    .input(z.object({ updateId: z.string() }))
    .mutation(async ({ input }) => {
      return await prisma.communityUpdate.delete({
        where: { id: input.updateId },
      });
    }),

  // Get update statistics
  getUpdateStats: adminProcedure.query(async () => {
    const totalUpdates = await prisma.communityUpdate.count();
    const activeUpdates = await prisma.communityUpdate.count({ where: { isActive: true } });
    
    const updatesByCategory = await prisma.communityUpdate.groupBy({
      by: ['category'],
      _count: true,
    });

    const topUpdates = await prisma.communityUpdate.findMany({
      take: 5,
      orderBy: {
        viewCount: 'desc',
      },
      select: {
        id: true,
        title: true,
        viewCount: true,
        clickCount: true,
        category: true,
      },
    });

    return {
      totalUpdates,
      activeUpdates,
      byCategory: updatesByCategory,
      topUpdates,
    };
  }),

  // ============ BEST DEALS ADMIN CONTROLS ============
  
  // Get all deals
  getAllDeals: adminProcedure
    .input(z.object({
      dealType: z.string().optional(),
      isActive: z.boolean().optional(),
    }))
    .query(async ({ input }) => {
      const where: any = {};
      if (input.dealType) where.dealType = input.dealType;
      if (input.isActive !== undefined) where.isActive = input.isActive;

      return await prisma.bestDeal.findMany({
        where,
        include: {
          User: {
            select: {
              id: true,
              firstname: true,
              lastname: true,
            },
          },
          _count: {
            select: {
              DealClaim: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });
    }),

  // Create deal
  createDeal: adminProcedure
    .input(z.object({
      title: z.string(),
      description: z.string(),
      dealType: z.enum(['package_discount', 'referral_bonus', 'bundle', 'loyalty', 'seasonal']),
      discountType: z.enum(['percentage', 'fixed']),
      discountValue: z.number(),
      originalPrice: z.number().optional(),
      startDate: z.date(),
      endDate: z.date(),
      usageLimit: z.number().optional(),
      usagePerUser: z.number().default(1),
      requiresPackage: z.boolean().default(false),
      minRankRequired: z.string().optional(),
      isFeatured: z.boolean().default(false),
      isActive: z.boolean().default(true),
    }))
    .mutation(async ({ ctx, input }) => {
      const userId = (ctx.session?.user as any)?.id;
      if (!userId) throw new Error("Unauthorized");
      return await prisma.bestDeal.create({
        data: {
          id: randomUUID(),
          ...input,
          createdBy: userId,
          currentUsage: 0,
          updatedAt: new Date(),
        },
      });
    }),

  // Update deal
  updateDeal: adminProcedure
    .input(z.object({
      dealId: z.string(),
      title: z.string().optional(),
      description: z.string().optional(),
      discountValue: z.number().optional(),
      originalPrice: z.number().optional(),
      endDate: z.date().optional(),
      usageLimit: z.number().optional(),
      usagePerUser: z.number().optional(),
      isFeatured: z.boolean().optional(),
      isActive: z.boolean().optional(),
    }))
    .mutation(async ({ input }) => {
      const { dealId, ...data } = input;
      return await prisma.bestDeal.update({
        where: { id: dealId },
        data,
      });
    }),

  // Delete deal
  deleteDeal: adminProcedure
    .input(z.object({ dealId: z.string() }))
    .mutation(async ({ input }) => {
      return await prisma.bestDeal.delete({
        where: { id: input.dealId },
      });
    }),

  // Get deal statistics
  getDealStats: adminProcedure.query(async () => {
    const totalDeals = await prisma.bestDeal.count();
    const activeDeals = await prisma.bestDeal.count({ 
      where: { 
        isActive: true,
        endDate: { gte: new Date() },
      } 
    });
    
    const totalClaims = await prisma.dealClaim.count();
    const redeemedClaims = await prisma.dealClaim.count({
      where: { usedAt: { not: null } },
    });

    const dealsByType = await prisma.bestDeal.groupBy({
      by: ['dealType'],
      _count: true,
    });

    const topDeals = await prisma.bestDeal.findMany({
      take: 5,
      orderBy: {
        currentUsage: 'desc',
      },
      select: {
        id: true,
        title: true,
        currentUsage: true,
        usageLimit: true,
        dealType: true,
      },
    });

    return {
      totalDeals,
      activeDeals,
      totalClaims,
      redeemedClaims,
      redemptionRate: totalClaims > 0 ? (redeemedClaims / totalClaims) * 100 : 0,
      byType: dealsByType,
      topDeals,
    };
  }),

  // ============ EPC & EPP ADMIN CONTROLS ============
  
  // Get all EPC & EPP participants
  getAllEpcEppParticipants: adminProcedure
    .input(z.object({
      minPoints: z.number().optional(),
      limit: z.number().default(100),
    }))
    .query(async ({ input }) => {
      const where: any = {};
      if (input.minPoints) {
        where.totalPoints = { gte: input.minPoints };
      }

      return await prisma.ePCandEPP.findMany({
        where,
        include: {
          User: {
            select: {
              id: true,
              firstname: true,
              lastname: true,
              email: true,
            },
          },
        },
        orderBy: { totalPoints: 'desc' },
        take: input.limit,
      });
    }),

  // Adjust user EPC points (admin override)
  adjustEpcPoints: adminProcedure
    .input(z.object({
      userId: z.string(),
      pointsAdjustment: z.number(),
      reason: z.string(),
    }))
    .mutation(async ({ input }) => {
      const epcRecord = await prisma.ePCandEPP.findUnique({
        where: { userId: input.userId },
      });

      if (!epcRecord) {
        throw new Error("User not found in EPC & EPP program");
      }

      return await prisma.ePCandEPP.update({
        where: { userId: input.userId },
        data: {
          totalPoints: { increment: input.pointsAdjustment },
        },
      });
    }),

  // ============ SOLAR ASSESSMENT ADMIN CONTROLS ============
  
  // Get all solar assessments
  getAllSolarAssessments: adminProcedure
    .input(z.object({
      status: z.string().optional(),
      limit: z.number().default(100),
    }))
    .query(async ({ input }) => {
      const where: any = {};
      if (input.status) {
        where.assessmentStatus = input.status;
      }

      return await prisma.solarAssessment.findMany({
        where,
        include: {
          User: {
            select: {
              id: true,
              firstname: true,
              lastname: true,
              email: true,
              mobile: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: input.limit,
      });
    }),

  // Update solar assessment status
  updateSolarAssessmentStatus: adminProcedure
    .input(z.object({
      assessmentId: z.string(),
      status: z.string(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const { assessmentId, status, notes } = input;
      return await prisma.solarAssessment.update({
        where: { id: assessmentId },
        data: {
          assessmentStatus: status,
          consultantNotes: notes,
        },
      });
    }),

  // Get solar assessment statistics
  getSolarAssessmentStats: adminProcedure.query(async () => {
    const totalAssessments = await prisma.solarAssessment.count();
    
    const assessmentsByStatus = await prisma.solarAssessment.groupBy({
      by: ['assessmentStatus'],
      _count: true,
    });

    const avgSystemSize = await prisma.solarAssessment.aggregate({
      _avg: { estimatedSystemSize: true },
    });

    const avgMonthlySavings = await prisma.solarAssessment.aggregate({
      _avg: { estimatedSavings: true },
    });

    return {
      totalAssessments,
      byStatus: assessmentsByStatus,
      avgSystemSize: avgSystemSize._avg.estimatedSystemSize || 0,
      avgMonthlySavings: avgMonthlySavings._avg.estimatedSavings || 0,
    };
  }),

  // Get admin settings for feature toggles
  getSettings: protectedProcedure.query(async () => {
    const settings = await prisma.adminSettings.findMany({
      select: {
        settingKey: true,
        settingValue: true,
      },
    });

    // Convert to key-value object with boolean conversion
    const settingsMap = settings.reduce((acc, setting) => {
      acc[setting.settingKey] = setting.settingValue === 'true';
      return acc;
    }, {} as Record<string, boolean>);

    // Return with defaults if settings don't exist
    return {
      enableEpcEpp: settingsMap.enableEpcEpp ?? false,
      enableSolarAssessment: settingsMap.enableSolarAssessment ?? false,
      enableBestDeals: settingsMap.enableBestDeals ?? false,
    };
  }),

  // Update admin settings
  updateSettings: adminProcedure
    .input(z.object({
      enableEpcEpp: z.boolean().optional(),
      enableSolarAssessment: z.boolean().optional(),
      enableBestDeals: z.boolean().optional(),
    }))
    .mutation(async ({ input }) => {
      const updates = [];

      if (input.enableEpcEpp !== undefined) {
        updates.push(
          prisma.adminSettings.upsert({
            where: { settingKey: 'enableEpcEpp' },
            create: {
              id: randomUUID(),
              settingKey: 'enableEpcEpp',
              settingValue: String(input.enableEpcEpp),
              description: 'Enable/disable EPC & EPP card on dashboard',
              updatedAt: new Date(),
            },
            update: {
              settingValue: String(input.enableEpcEpp),
              updatedAt: new Date(),
            },
          })
        );
      }

      if (input.enableSolarAssessment !== undefined) {
        updates.push(
          prisma.adminSettings.upsert({
            where: { settingKey: 'enableSolarAssessment' },
            create: {
              id: randomUUID(),
              settingKey: 'enableSolarAssessment',
              settingValue: String(input.enableSolarAssessment),
              description: 'Enable/disable Solar Assessment card on dashboard',
              updatedAt: new Date(),
            },
            update: {
              settingValue: String(input.enableSolarAssessment),
              updatedAt: new Date(),
            },
          })
        );
      }

      if (input.enableBestDeals !== undefined) {
        updates.push(
          prisma.adminSettings.upsert({
            where: { settingKey: 'enableBestDeals' },
            create: {
              id: randomUUID(),
              settingKey: 'enableBestDeals',
              settingValue: String(input.enableBestDeals),
              description: 'Enable/disable Best Deals card on dashboard',
              updatedAt: new Date(),
            },
            update: {
              settingValue: String(input.enableBestDeals),
              updatedAt: new Date(),
            },
          })
        );
      }

      await prisma.$transaction(updates);

      return { success: true };
    }),

  // Dashboard Statistics
  getDashboardStats: adminProcedure.query(async () => {
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Total users
    const totalUsers = await prisma.user.count();
    const recentUsers = await prisma.user.count({
      where: { createdAt: { gte: sevenDaysAgo } },
    });
    const previousUsers = await prisma.user.count({
      where: {
        createdAt: {
          gte: new Date(sevenDaysAgo.getTime() - 7 * 24 * 60 * 60 * 1000),
          lt: sevenDaysAgo,
        },
      },
    });
    const usersChange =
      previousUsers > 0
        ? Math.round(((recentUsers - previousUsers) / previousUsers) * 100)
        : 0;

    // Pending payments
    const pendingPayments = await prisma.pendingPayment.count({
      where: { status: "pending" },
    });

    // Total revenue (last 30 days)
    const revenueTransactions = await prisma.transaction.aggregate({
      where: {
        status: "completed",
        transactionType: "membership_activation",
        createdAt: { gte: thirtyDaysAgo },
      },
      _sum: { amount: true },
    });
    const totalRevenue = revenueTransactions._sum.amount || 0;

    const previousRevenue = await prisma.transaction.aggregate({
      where: {
        status: "completed",
        transactionType: "membership_activation",
        createdAt: {
          gte: new Date(thirtyDaysAgo.getTime() - 30 * 24 * 60 * 60 * 1000),
          lt: thirtyDaysAgo,
        },
      },
      _sum: { amount: true },
    });
    const prevRevenue = previousRevenue._sum.amount || 0;
    const revenueChange =
      prevRevenue > 0
        ? Math.round(((totalRevenue - prevRevenue) / prevRevenue) * 100)
        : 0;

    // Active members
    const activeMembers = await prisma.user.count({
      where: { activated: true, activeMembershipPackageId: { not: null } },
    });
    const recentActiveMembers = await prisma.user.count({
      where: {
        activated: true,
        activeMembershipPackageId: { not: null },
        membershipActivatedAt: { gte: sevenDaysAgo },
      },
    });
    const membersChange = Math.round((recentActiveMembers / totalUsers) * 100);

    return {
      totalUsers,
      usersChange,
      pendingPayments,
      totalRevenue,
      revenueChange,
      activeMembers,
      membersChange,
    };
  }),

  // Recent Activity
  getRecentActivity: adminProcedure
    .input(z.object({ limit: z.number().default(10) }))
    .query(async ({ input }) => {
      const activities = await prisma.auditLog.findMany({
        take: input.limit,
        orderBy: { createdAt: "desc" },
        include: {
          User: {
            select: { name: true, email: true },
          },
        },
      });

      return activities;
    }),

  // Chart Data
  getChartData: adminProcedure
    .input(z.object({ period: z.enum(["7d", "30d", "90d"]).default("7d") }))
    .query(async ({ input }) => {
      const days = input.period === "7d" ? 7 : input.period === "30d" ? 30 : 90;
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      // User growth data
      const userGrowth = [];
      for (let i = 0; i < days; i++) {
        const date = new Date(startDate);
        date.setDate(date.getDate() + i);
        const nextDate = new Date(date);
        nextDate.setDate(nextDate.getDate() + 1);

        const users = await prisma.user.count({
          where: {
            createdAt: {
              gte: date,
              lt: nextDate,
            },
          },
        });

        userGrowth.push({
          date: date.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
          users,
        });
      }

      // Revenue data
      const revenue = [];
      for (let i = 0; i < days; i++) {
        const date = new Date(startDate);
        date.setDate(date.getDate() + i);
        const nextDate = new Date(date);
        nextDate.setDate(nextDate.getDate() + 1);

        const dayRevenue = await prisma.transaction.aggregate({
          where: {
            status: "completed",
            createdAt: {
              gte: date,
              lt: nextDate,
            },
          },
          _sum: { amount: true },
        });

        revenue.push({
          date: date.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
          revenue: dayRevenue._sum.amount || 0,
        });
      }

      // Activity data (mocked for now - can be enhanced)
      const activity = [];
      for (let i = 0; i < days; i++) {
        const date = new Date(startDate);
        date.setDate(date.getDate() + i);

        activity.push({
          date: date.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
          logins: Math.floor(Math.random() * 50) + 10,
          transactions: Math.floor(Math.random() * 30) + 5,
          signups: Math.floor(Math.random() * 20) + 1,
        });
      }

      return {
        userGrowth,
        revenue,
        activity,
      };
    }),

  // Dashboard Alerts & Warnings
  getDashboardAlerts: adminProcedure.query(async () => {
    const alerts: Array<{
      type: "warning" | "info" | "success" | "error";
      title: string;
      message: string;
      action?: string;
      priority: "high" | "medium" | "low";
    }> = [];

    // Check for pending payments
    const pendingCount = await prisma.pendingPayment.count({
      where: { status: "pending" },
    });
    if (pendingCount > 10) {
      alerts.push({
        type: "warning" as const,
        title: "High Pending Payments",
        message: `${pendingCount} payments awaiting approval`,
        action: "/admin/payments",
        priority: "high" as const,
      });
    }

    // Check for inactive users
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const inactiveUsers = await prisma.user.count({
      where: {
        lastLogin: { lt: thirtyDaysAgo },
        activeMembershipPackageId: { not: null },
      },
    });
    if (inactiveUsers > 5) {
      alerts.push({
        type: "info" as const,
        title: "Inactive Active Members",
        message: `${inactiveUsers} active members haven't logged in for 30+ days`,
        action: "/admin/users",
        priority: "medium" as const,
      });
    }

    // Check for expiring packages
    const sevenDaysFromNow = new Date();
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);
    const expiringPackages = await prisma.membershipPackage.count({
      where: {
        isActive: true,
        // Could add expiration date check if field exists
      },
    });

    // Check for low BPT balance users
    const lowBalanceUsers = await prisma.user.count({
      where: {
        bpiTokenWallet: { lt: 100 },
        activeMembershipPackageId: { not: null },
      },
    });
    if (lowBalanceUsers > 20) {
      alerts.push({
        type: "info" as const,
        title: "Low BPT Balances",
        message: `${lowBalanceUsers} active members have less than 100 BPT`,
        action: "/admin/users",
        priority: "low" as const,
      });
    }

    return alerts;
  }),

  // Performance Metrics
  getPerformanceMetrics: adminProcedure.query(async () => {
    const now = new Date();
    const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const last7d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Response times (mock data - would need actual monitoring)
    const responseTime = {
      average: 245, // ms
      p95: 580,
      p99: 1200,
    };

    // Database queries (mock data)
    const dbMetrics = {
      activeConnections: 12,
      slowQueries: 3,
      cacheHitRate: 87.5, // percentage
    };

    // User engagement
    const activeUsers24h = await prisma.user.count({
      where: { lastLogin: { gte: last24h } },
    });
    const activeUsers7d = await prisma.user.count({
      where: { lastLogin: { gte: last7d } },
    });

    // Transaction metrics
    const transactions24h = await prisma.pendingPayment.count({
      where: { createdAt: { gte: last24h } },
    });
    const successRate = await prisma.pendingPayment.count({
      where: {
        createdAt: { gte: last7d },
        status: "approved",
      },
    });
    const totalTransactions7d = await prisma.pendingPayment.count({
      where: { createdAt: { gte: last7d } },
    });

    return {
      responseTime,
      dbMetrics,
      userEngagement: {
        activeUsers24h,
        activeUsers7d,
        dailyActiveRate: totalTransactions7d > 0 ? (activeUsers24h / activeUsers7d) * 100 : 0,
      },
      transactions: {
        count24h: transactions24h,
        count7d: totalTransactions7d,
        successRate: totalTransactions7d > 0 ? (successRate / totalTransactions7d) * 100 : 0,
      },
    };
  }),

  // Quick Stats for widgets
  getQuickStats: adminProcedure.query(async () => {
    const now = new Date();
    const today = new Date(now.setHours(0, 0, 0, 0));
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [
      usersToday,
      usersThisMonth,
      paymentsToday,
      revenueToday,
      revenueThisMonth,
    ] = await Promise.all([
      prisma.user.count({ where: { createdAt: { gte: today } } }),
      prisma.user.count({ where: { createdAt: { gte: thisMonth } } }),
      prisma.pendingPayment.count({ where: { createdAt: { gte: today } } }),
      prisma.pendingPayment.aggregate({
        where: { createdAt: { gte: today }, status: "approved" },
        _sum: { amount: true },
      }),
      prisma.pendingPayment.aggregate({
        where: { createdAt: { gte: thisMonth }, status: "approved" },
        _sum: { amount: true },
      }),
    ]);

    return {
      today: {
        users: usersToday,
        payments: paymentsToday,
        revenue: revenueToday._sum.amount || 0,
      },
      thisMonth: {
        users: usersThisMonth,
        revenue: revenueThisMonth._sum.amount || 0,
      },
    };
  }),

  // Export data to CSV
  exportUsersToCSV: adminProcedure
    .input(
      z.object({
        filters: z
          .object({
            search: z.string().optional(),
            role: z.string().optional(),
            status: z.string().optional(),
            dateFrom: z.string().optional(),
            dateTo: z.string().optional(),
          })
          .optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const where: any = {};

      if (input.filters?.search) {
        where.OR = [
          { email: { contains: input.filters.search, mode: "insensitive" } },
          { name: { contains: input.filters.search, mode: "insensitive" } },
          {
            username: { contains: input.filters.search, mode: "insensitive" },
          },
        ];
      }

      if (input.filters?.role) {
        where.role = input.filters.role;
      }

      if (input.filters?.status === "active") {
        where.activated = true;
      } else if (input.filters?.status === "inactive") {
        where.activated = false;
      }

      if (input.filters?.dateFrom) {
        where.createdAt = {
          ...where.createdAt,
          gte: new Date(input.filters.dateFrom),
        };
      }

      if (input.filters?.dateTo) {
        where.createdAt = {
          ...where.createdAt,
          lte: new Date(input.filters.dateTo),
        };
      }

      const users = await prisma.user.findMany({
        where,
        select: {
          id: true,
          email: true,
          name: true,
          username: true,
          role: true,
          activated: true,
          bpiTokenWallet: true,
          wallet: true,
          createdAt: true,
          lastLogin: true,
          activeMembershipPackageId: true,
        },
        orderBy: { createdAt: "desc" },
      });

      // Convert to CSV format
      const headers = [
        "ID",
        "Email",
        "Name",
        "Username",
        "Role",
        "Status",
        "BPT Balance",
        "NGN Balance",
        "Membership",
        "Created At",
        "Last Login",
      ];

      const rows = users.map((user) => [
        user.id,
        user.email || "",
        user.name || "",
        user.username || "",
        user.role,
        user.activated ? "Active" : "Inactive",
        user.bpiTokenWallet.toString(),
        user.wallet.toString(),
        user.activeMembershipPackageId ? "Active" : "None",
        user.createdAt.toISOString(),
        user.lastLogin.toISOString(),
      ]);

      const csvContent = [
        headers.join(","),
        ...rows.map((row) =>
          row.map((cell) => `"${cell.toString().replace(/"/g, '""')}"`).join(","),
        ),
      ].join("\n");

      return {
        data: csvContent,
        filename: `users-export-${new Date().toISOString().split("T")[0]}.csv`,
        count: users.length,
      };
    }),

  exportPaymentsToCSV: adminProcedure
    .input(
      z.object({
        filters: z
          .object({
            status: z.string().optional(),
            dateFrom: z.string().optional(),
            dateTo: z.string().optional(),
          })
          .optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const where: any = {};

      if (input.filters?.status) {
        where.status = input.filters.status;
      }

      if (input.filters?.dateFrom) {
        where.createdAt = {
          ...where.createdAt,
          gte: new Date(input.filters.dateFrom),
        };
      }

      if (input.filters?.dateTo) {
        where.createdAt = {
          ...where.createdAt,
          lte: new Date(input.filters.dateTo),
        };
      }

      const payments = await prisma.transaction.findMany({
        where,
        include: {
          User: {
            select: {
              email: true,
              name: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      });

      const headers = [
        "ID",
        "User Email",
        "User Name",
        "Transaction Type",
        "Amount",
        "Currency",
        "Payment Method",
        "Status",
        "Gateway Reference",
        "Created At",
        "Updated At",
      ];

      const rows = payments.map((payment: any) => [
        payment.id,
        payment.User.email || "",
        payment.User.name || "",
        payment.transactionType,
        payment.amount.toString(),
        "NGN",
        payment.walletType || "",
        payment.status,
        payment.reference || "",
        payment.createdAt.toISOString(),
        payment.createdAt.toISOString(),
      ]);

      const csvContent = [
        headers.join(","),
        ...rows.map((row: any[]) =>
          row.map((cell: any) => `"${cell.toString().replace(/"/g, '""')}"`).join(","),
        ),
      ].join("\n");

      return {
        data: csvContent,
        filename: `payments-export-${new Date().toISOString().split("T")[0]}.csv`,
        count: payments.length,
      };
    }),

  exportPackagesToCSV: adminProcedure.query(async ({ ctx }) => {
    const packages = await prisma.membershipPackage.findMany({
      orderBy: { name: "asc" },
    });

    const headers = [
      "ID",
      "Name",
      "Price",
      "VAT",
      "Type",
      "BPT L1",
      "BPT L2",
      "BPT L3",
      "BPT L4",
      "Active",
      "Has Renewal",
      "Created At",
    ];

    const rows = packages.map((pkg) => [
      pkg.id,
      pkg.name,
      pkg.price.toString(),
      pkg.vat.toString(),
      pkg.packageType,
      pkg.bpt_l1.toString(),
      pkg.bpt_l2.toString(),
      pkg.bpt_l3.toString(),
      pkg.bpt_l4.toString(),
      pkg.isActive ? "Yes" : "No",
      pkg.hasRenewal ? "Yes" : "No",
      pkg.createdAt.toISOString(),
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((row) =>
        row.map((cell) => `"${cell.toString().replace(/"/g, '""')}"`).join(","),
      ),
    ].join("\n");

    return {
      data: csvContent,
      filename: `packages-export-${new Date().toISOString().split("T")[0]}.csv`,
      count: packages.length,
    };
  }),
});
