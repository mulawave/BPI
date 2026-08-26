import { z } from "zod";
import { createTRPCRouter, customerRepProcedure } from "../trpc";
import { prisma } from "@/lib/prisma";

export const customerRepRouter = createTRPCRouter({
  /**
   * Get users with restricted fields only:
   * fullname, email, phone number, kyc status, membership activated
   * Optional SSC filter: "with_ssc" | "without_ssc" | undefined (all)
   */
  getUsers: customerRepProcedure
    .input(
      z.object({
        page: z.number().min(1).default(1),
        pageSize: z.number().min(1).max(200).default(50),
        search: z.string().max(200).optional(),
        sscFilter: z.enum(["with_ssc", "without_ssc"]).optional(),
      })
    )
    .query(async ({ input }) => {
      const { page, pageSize, search, sscFilter } = input;
      const skip = (page - 1) * pageSize;

      const where: any = {};

      if (sscFilter === "with_ssc") {
        where.ssc = { not: null };
      } else if (sscFilter === "without_ssc") {
        where.ssc = null;
      }

      if (search) {
        where.OR = [
          { name: { contains: search, mode: "insensitive" } },
          { firstname: { contains: search, mode: "insensitive" } },
          { lastname: { contains: search, mode: "insensitive" } },
          { email: { contains: search, mode: "insensitive" } },
          { mobile: { contains: search, mode: "insensitive" } },
        ];
      }

      const [users, total] = await prisma.$transaction([
        prisma.user.findMany({
          where,
          skip,
          take: pageSize,
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            name: true,
            firstname: true,
            lastname: true,
            email: true,
            mobile: true,
            kyc: true,
            activated: true,
            ssc: true,
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
});
