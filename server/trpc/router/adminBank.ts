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
      })
    )
    .query(async ({ ctx, input }) => {
      const { page, perPage, search, bankId } = input;
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
});
