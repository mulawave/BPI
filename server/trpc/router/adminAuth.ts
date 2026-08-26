/**
 * Admin Authentication Router
 * Handles admin login verification and profile management
 */

import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { requireAdmin } from "../../utils/adminAuth";
// import { createAuditLog } from "../../utils/audit"; // DISABLED - models not migrated yet

export const adminAuthRouter = createTRPCRouter({
  /**
   * Check if current user has admin access
   */
  checkAdminAccess: protectedProcedure.query(async ({ ctx }) => {
    const user = await ctx.prisma.user.findUnique({
      where: { id: ctx.session?.user?.id || "" },
      select: { 
        id: true,
        email: true,
        name: true,
        image: true,
        role: true,
        userType: true,
      },
    });

    if (!user) {
      return {
        isAdmin: false,
        isSuperAdmin: false,
        isCustomerRep: false,
        hasPanelAccess: false,
        role: "user" as const,
        user: null,
      };
    }

    // Use role field, fall back to userType for legacy users where role wasn't synced
    const effectiveRole = user.role || user.userType || "user";
    
    return {
      isAdmin: effectiveRole === "admin" || effectiveRole === "super_admin",
      isSuperAdmin: effectiveRole === "super_admin",
      isCustomerRep: effectiveRole === "customer_rep",
      hasPanelAccess: effectiveRole === "admin" || effectiveRole === "super_admin" || effectiveRole === "customer_rep",
      role: effectiveRole as "user" | "admin" | "super_admin" | "customer_rep",
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        image: user.image,
      },
    };
  }),

  /**
   * Get admin profile (requires admin role)
   */
  getAdminProfile: protectedProcedure.query(async ({ ctx }) => {
    requireAdmin(ctx);

    const admin = await ctx.prisma.user.findUnique({
      where: { id: ctx.session?.user?.id || "" },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        role: true,
        createdAt: true,
        lastLogin: true,
      },
    });

    // Log admin access - DISABLED until models migrated
    // if (ctx.session) {
    //   await createAuditLog(ctx as any, {
    //     action: "ADMIN_LOGIN",
    //     details: {
    //       timestamp: new Date().toISOString(),
    //     },
    //   });
    // }

    return admin;
  }),

  /**
   * Get admin dashboard statistics
   */
  getDashboardStats: protectedProcedure.query(async ({ ctx }) => {
    requireAdmin(ctx);

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const [
      totalUsers,
      activeMembers,
      pendingPayments,
      totalTransactionsToday,
    ] = await Promise.all([
      // Total users count
      ctx.prisma.user.count(),
      
      // Active members (activated = true)
      ctx.prisma.user.count({
        where: { activated: true },
      }),
      
      ctx.prisma.pendingPayment.count({
        where: { status: "pending" },
      }),
      
      // Transactions today
      ctx.prisma.transaction.count({
        where: {
          createdAt: {
            gte: startOfToday,
          },
        },
      }),
    ]);

    // Calculate today's revenue (completed transactions)
    const todayRevenue = await ctx.prisma.transaction.aggregate({
      where: {
        createdAt: {
          gte: startOfToday,
        },
        status: "completed",
        transactionType: {
          in: ["DEPOSIT", "MEMBERSHIP_ACTIVATION"],
        },
      },
      _sum: {
        amount: true,
      },
    });

    return {
      totalUsers,
      activeMembers,
      pendingPayments,
      todayTransactions: totalTransactionsToday,
      todayRevenue: Math.abs(todayRevenue._sum.amount || 0),
    };
  }),

  /**
   * Get recent admin activity
   */
  getRecentActivity: protectedProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(50).default(10),
      })
    )
    .query(async ({ ctx, input }) => {
      requireAdmin(ctx);

      const recentLogs = await ctx.prisma.auditLog.findMany({
        take: input.limit,
        orderBy: { createdAt: "desc" },
        include: {
          User: { select: { name: true, email: true } },
        },
      });

      return recentLogs;
    }),
});
