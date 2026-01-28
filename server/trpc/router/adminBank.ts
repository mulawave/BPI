import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, protectedProcedure } from "../trpc";

// Admin middleware
const adminProcedure = protectedProcedure.use(async ({ ctx, next }) => {
  if (!ctx.session?.user) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "You must be logged in to access this resource",
    });
  }

  const userRole = (ctx.session.user as any).role;
  if (userRole !== "admin" && userRole !== "super_admin") {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "You must be an admin to access this resource",
    });
  }

  return next();
});

export const adminBankRouter = createTRPCRouter({
  // Bank record stats for dashboards
  getBankRecordStats: adminProcedure.query(async ({ ctx }) => {
    const [totalUsers, usersWithBanks, totalRecords, recordsMissingBankId] = await Promise.all([
      ctx.prisma.user.count(),
      ctx.prisma.user.count({ where: { bankRecords: { some: {} } } }),
      ctx.prisma.userBankRecord.count(),
      ctx.prisma.userBankRecord.count({ where: { bankId: null } }),
    ]);

    const usersWithoutBanks = totalUsers - usersWithBanks;
    const usersWithBanksNoDefault = await ctx.prisma.user.count({
      where: {
        bankRecords: { some: {} },
        NOT: { bankRecords: { some: { isDefault: true } } },
      },
    });

    return {
      totalUsers,
      usersWithBanks,
      usersWithoutBanks,
      totalRecords,
      recordsMissingBankId,
      usersWithBanksNoDefault,
    };
  }),

  // Get banks with pagination and search
  getBanks: adminProcedure
    .input(
      z.object({
        page: z.number().min(1).default(1),
        perPage: z.number().min(1).max(100).default(25),
        search: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const { page, perPage, search } = input;
      const skip = (page - 1) * perPage;

      const where = search
        ? {
            OR: [
              { bankName: { contains: search, mode: 'insensitive' as const } },
              { bankCode: { contains: search, mode: 'insensitive' as const } },
            ],
          }
        : {};

      const [banks, total] = await Promise.all([
        ctx.prisma.bank.findMany({
          where,
          skip,
          take: perPage,
          orderBy: { bankName: 'asc' },
        }),
        ctx.prisma.bank.count({ where }),
      ]);

      return {
        banks,
        total,
        page,
        perPage,
        totalPages: Math.ceil(total / perPage),
      };
    }),

  // Create bank
  createBank: adminProcedure
    .input(
      z.object({
        bankName: z.string().min(1, "Bank name is required"),
        bankCode: z.string().min(1, "Bank code is required"),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return await ctx.prisma.bank.create({
        data: {
          bankName: input.bankName,
          bankCode: input.bankCode,
        },
      });
    }),

  // Update bank
  updateBank: adminProcedure
    .input(
      z.object({
        id: z.number(),
        bankName: z.string().min(1, "Bank name is required"),
        bankCode: z.string().min(1, "Bank code is required"),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return await ctx.prisma.bank.update({
        where: { id: input.id },
        data: {
          bankName: input.bankName,
          bankCode: input.bankCode,
        },
      });
    }),

  // Delete bank
  deleteBank: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      // Check if bank has associated user records
      const recordCount = await ctx.prisma.userBankRecord.count({
        where: { bankId: input.id },
      });

      if (recordCount > 0) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Cannot delete bank: ${recordCount} user bank records are associated with it`,
        });
      }

      await ctx.prisma.bank.delete({
        where: { id: input.id },
      });

      return { success: true };
    }),

  // Get all user bank records with pagination
  getUserBankRecords: adminProcedure
    .input(
      z.object({
        page: z.number().min(1).default(1),
        perPage: z.number().min(1).max(100).default(25),
        search: z.string().optional(),
        bankId: z.number().optional(),
        isDefault: z.boolean().optional(),
        missingBankId: z.boolean().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const { page, perPage, search, bankId, isDefault, missingBankId } = input;
      const skip = (page - 1) * perPage;

      const where: any = {};

      if (search) {
        where.OR = [
          { accountName: { contains: search, mode: 'insensitive' as const } },
          { accountNumber: { contains: search, mode: 'insensitive' as const } },
          { user: { name: { contains: search, mode: 'insensitive' as const } } },
          { user: { email: { contains: search, mode: 'insensitive' as const } } },
        ];
      }

      if (bankId) {
        where.bankId = bankId;
      }

      if (typeof isDefault === "boolean") {
        where.isDefault = isDefault;
      }

      if (missingBankId) {
        where.bankId = null;
      }

      const [records, total] = await Promise.all([
        ctx.prisma.userBankRecord.findMany({
          where,
          skip,
          take: perPage,
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                username: true,
              },
            },
            bank: true,
          },
          orderBy: { createdAt: 'desc' },
        }),
        ctx.prisma.userBankRecord.count({ where }),
      ]);

      return {
        records,
        total,
        page,
        perPage,
        totalPages: Math.ceil(total / perPage),
      };
    }),

  // Users without bank records (for matching)
  getUsersWithoutBankRecords: adminProcedure
    .input(
      z.object({
        page: z.number().min(1).default(1),
        perPage: z.number().min(1).max(100).default(25),
        search: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const { page, perPage, search } = input;
      const skip = (page - 1) * perPage;

      const where: any = {
        bankRecords: { none: {} },
      };

      if (search) {
        where.OR = [
          { name: { contains: search, mode: "insensitive" as const } },
          { email: { contains: search, mode: "insensitive" as const } },
          { username: { contains: search, mode: "insensitive" as const } },
          { legacyId: { contains: search, mode: "insensitive" as const } },
        ];
      }

      const [users, total] = await Promise.all([
        ctx.prisma.user.findMany({
          where,
          skip,
          take: perPage,
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            name: true,
            email: true,
            username: true,
            legacyId: true,
            createdAt: true,
          },
        }),
        ctx.prisma.user.count({ where }),
      ]);

      return {
        users,
        total,
        page,
        perPage,
        totalPages: Math.ceil(total / perPage),
      };
    }),

  // Create a bank record for a user (admin)
  createUserBankRecord: adminProcedure
    .input(
      z.object({
        userId: z.string(),
        bankId: z.number().optional(),
        bankName: z.string().optional(),
        accountName: z.string().min(1),
        accountNumber: z.string().min(6),
        bvn: z.string().optional(),
        isDefault: z.boolean().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { userId, bankId, bankName, accountName, accountNumber, bvn, isDefault } = input;

      return await ctx.prisma.$transaction(async (tx) => {
        if (isDefault) {
          await tx.userBankRecord.updateMany({ where: { userId }, data: { isDefault: false } });
        }

        const record = await tx.userBankRecord.create({
          data: {
            userId,
            bankId: bankId ?? null,
            bankName: bankId ? null : bankName ?? null,
            accountName,
            accountNumber,
            bvn: bvn || null,
            isDefault: !!isDefault,
          },
        });

        return record;
      });
    }),

  // Update an existing bank record
  updateUserBankRecord: adminProcedure
    .input(
      z.object({
        id: z.number(),
        bankId: z.number().optional(),
        bankName: z.string().optional(),
        accountName: z.string().min(1),
        accountNumber: z.string().min(6),
        bvn: z.string().optional(),
        isDefault: z.boolean().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, bankId, bankName, accountName, accountNumber, bvn, isDefault } = input;

      return await ctx.prisma.$transaction(async (tx) => {
        const existing = await tx.userBankRecord.findUnique({ where: { id } });
        if (!existing) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Bank record not found" });
        }

        if (isDefault) {
          await tx.userBankRecord.updateMany({ where: { userId: existing.userId }, data: { isDefault: false } });
        }

        const record = await tx.userBankRecord.update({
          where: { id },
          data: {
            bankId: bankId ?? null,
            bankName: bankId ? null : bankName ?? null,
            accountName,
            accountNumber,
            bvn: bvn || null,
            isDefault: isDefault ?? existing.isDefault,
          },
          include: { bank: true },
        });

        return record;
      });
    }),

  // Set default for a specific bank record
  setDefaultBankRecord: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const record = await ctx.prisma.userBankRecord.findUnique({ where: { id: input.id } });
      if (!record) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Bank record not found" });
      }

      await ctx.prisma.$transaction([
        ctx.prisma.userBankRecord.updateMany({
          where: { userId: record.userId },
          data: { isDefault: false },
        }),
        ctx.prisma.userBankRecord.update({
          where: { id: input.id },
          data: { isDefault: true },
        }),
      ]);

      return { success: true };
    }),
});
