import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { prisma } from "@/lib/prisma";

export const taxesRouter = createTRPCRouter({
  // Get total taxes paid by user
  getTotalTaxes: protectedProcedure.query(async ({ ctx }) => {
    const userId = (ctx.session?.user as any)?.id;
    if (!userId) return 0;

    try {
      // Get all VAT/tax transactions (check both type and description for VAT)
      const taxTransactions = await prisma.transaction.findMany({
        where: {
          userId,
          OR: [
            { transactionType: { in: ["VAT", "TAX_PAYMENT"] } },
            { description: { contains: "VAT" } }
          ]
        },
        select: {
          amount: true
        }
      });

      // Use absolute values since VAT/taxes are stored as negative (debits)
      const totalTaxes = taxTransactions.reduce((sum: number, tx: { amount: number }) => sum + Math.abs(tx.amount), 0);
      return totalTaxes;
    } catch (error) {
      console.error("Error calculating total taxes:", error);
      return 0;
    }
  }),

  // Get paginated tax payment history
  getTaxHistory: protectedProcedure
    .input(
      z.object({
        page: z.number().min(1).default(1),
        limit: z.number().min(1).max(100).default(10),
      })
    )
    .query(async ({ ctx, input }) => {
      const userId = (ctx.session?.user as any)?.id;
      if (!userId) {
        return { taxes: [], totalCount: 0, totalTaxes: 0 };
      }

      const { page, limit } = input;
      const skip = (page - 1) * limit;

      try {
        // Get all VAT/tax transactions with pagination
        const [taxTransactions, totalCount] = await Promise.all([
          prisma.transaction.findMany({
            where: {
              userId,
              OR: [
                { transactionType: { in: ["VAT", "TAX_PAYMENT"] } },
                { description: { contains: "VAT" } }
              ]
            },
            orderBy: { createdAt: 'desc' },
            take: limit,
            skip,
            select: {
              id: true,
              amount: true,
              description: true,
              createdAt: true,
              reference: true
            }
          }),
          prisma.transaction.count({
            where: {
              userId,
              OR: [
                { transactionType: { in: ["VAT", "TAX_PAYMENT"] } },
                { description: { contains: "VAT" } }
              ]
            }
          })
        ]);

        // Calculate total taxes
        const allTaxTransactions = await prisma.transaction.findMany({
          where: {
            userId,
            OR: [
              { transactionType: { in: ["VAT", "TAX_PAYMENT"] } },
              { description: { contains: "VAT" } }
            ]
          },
          select: { amount: true }
        });
        const totalTaxes = allTaxTransactions.reduce((sum: number, tx: { amount: number }) => sum + Math.abs(tx.amount), 0);

        // Format tax records
        const taxes = taxTransactions.map((tx: { id: string; amount: number; description: string | null; createdAt: Date; reference: string | null }) => {
          // Parse description to extract item cost if available
          // Default tax rate is 7.5% (VAT in Nigeria)
          const taxRate = 0.075;
          const taxAmount = tx.amount;
          
          // Calculate item cost: if totalPaid = itemCost + tax, and tax = itemCost * rate
          // Then: totalPaid = itemCost * (1 + rate)
          // So: itemCost = totalPaid / (1 + rate) - but we need to reverse calculate
          // Actually, tax amount is already the tax portion, so:
          const itemCost = taxAmount / taxRate;
          const totalPaid = itemCost + taxAmount;

          return {
            id: tx.id,
            description: tx.description || "Tax Payment",
            totalPaid: totalPaid,
            itemCost: itemCost,
            taxAmount: taxAmount,
            date: tx.createdAt,
            reference: tx.reference
          };
        });

        return {
          taxes,
          totalCount,
          totalTaxes,
          currentPage: page,
          totalPages: Math.ceil(totalCount / limit)
        };
      } catch (error) {
        console.error("Error fetching tax history:", error);
        return { taxes: [], totalCount: 0, totalTaxes: 0 };
      }
    }),
});
