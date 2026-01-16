import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";

export const bankRouter = createTRPCRouter({
  // Get all banks
  getBanks: protectedProcedure.query(async ({ ctx }) => {
    return await ctx.prisma.bank.findMany({
      orderBy: { bankName: 'asc' },
    });
  }),

  // Get user's bank records
  getUserBankRecords: protectedProcedure.query(async ({ ctx }) => {
    if (!ctx.session?.user?.id) {
      throw new Error("Unauthorized");
    }

    return await ctx.prisma.userBankRecord.findMany({
      where: { userId: ctx.session.user.id },
      include: {
        bank: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }),

  // Add bank account
  addBankAccount: protectedProcedure
    .input(
      z.object({
        bankId: z.number().optional(),
        bankName: z.string().optional(),
        accountName: z.string().min(1, "Account name is required"),
        accountNumber: z.string().min(10, "Account number must be at least 10 digits"),
        bvn: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.session?.user?.id) {
        throw new Error("Unauthorized");
      }

      return await ctx.prisma.userBankRecord.create({
        data: {
          userId: ctx.session.user.id,
          bankId: input.bankId,
          bankName: input.bankName,
          accountName: input.accountName,
          accountNumber: input.accountNumber,
          bvn: input.bvn,
        },
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
        bankName: z.string().optional(),
        accountName: z.string().min(1, "Account name is required"),
        accountNumber: z.string().min(10, "Account number must be at least 10 digits"),
        bvn: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.session?.user?.id) {
        throw new Error("Unauthorized");
      }

      // Verify ownership
      const existing = await ctx.prisma.userBankRecord.findUnique({
        where: { id: input.id },
      });

      if (!existing || existing.userId !== ctx.session.user.id) {
        throw new Error("Bank record not found or unauthorized");
      }

      return await ctx.prisma.userBankRecord.update({
        where: { id: input.id },
        data: {
          bankId: input.bankId,
          bankName: input.bankName,
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
        throw new Error("Unauthorized");
      }

      // Verify ownership
      const existing = await ctx.prisma.userBankRecord.findUnique({
        where: { id: input.id },
      });

      if (!existing || existing.userId !== ctx.session.user.id) {
        throw new Error("Bank record not found or unauthorized");
      }

      await ctx.prisma.userBankRecord.delete({
        where: { id: input.id },
      });

      return { success: true };
    }),
});
