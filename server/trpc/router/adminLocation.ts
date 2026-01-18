import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { TRPCError } from "@trpc/server";

const adminProcedure = protectedProcedure.use(async ({ ctx, next }) => {
  if (!ctx.session?.user) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "You must be logged in to perform this action.",
    });
  }
  const userRole = (ctx.session.user as any).role;
  if (userRole !== "admin" && userRole !== "super_admin") {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "You must be an admin to perform this action.",
    });
  }
  return next();
});

export const adminLocationRouter = createTRPCRouter({
  // COUNTRIES
  getCountries: adminProcedure
    .input(z.object({
      page: z.number().default(1),
      pageSize: z.number().default(25),
      search: z.string().optional(),
    }))
    .query(async ({ ctx, input }) => {
      const { page, pageSize, search } = input;
      const skip = (page - 1) * pageSize;

      const where = search
        ? {
            OR: [
              { name: { contains: search, mode: "insensitive" as const } },
              { code: { contains: search, mode: "insensitive" as const } },
            ],
          }
        : {};

      const [countries, total] = await Promise.all([
        ctx.prisma.country.findMany({
          where,
          skip,
          take: pageSize,
          orderBy: { name: "asc" },
        }),
        ctx.prisma.country.count({ where }),
      ]);

      return {
        countries,
        total,
        pages: Math.ceil(total / pageSize),
      };
    }),

  createCountry: adminProcedure
    .input(z.object({
      name: z.string().min(1),
      code: z.string().optional(),
      dialCode: z.number().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      return await ctx.prisma.$transaction(async (tx) => {
        const max = await tx.country.aggregate({
          _max: { id: true },
        });

        const nextId = (max._max.id ?? 0) + 1;

        return await tx.country.create({
          data: {
            id: nextId,
            name: input.name,
            code: input.code,
            dialCode: input.dialCode,
            createdDatetime: new Date(),
          },
        });
      });
    }),

  updateCountry: adminProcedure
    .input(z.object({
      id: z.number(),
      name: z.string().min(1),
      code: z.string().optional(),
      dialCode: z.number().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      return await ctx.prisma.country.update({
        where: { id },
        data,
      });
    }),

  deleteCountry: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      // Check if country has states
      const statesCount = await ctx.prisma.state.count({
        where: { countryId: input.id },
      });

      if (statesCount > 0) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Cannot delete country with ${statesCount} existing states. Delete states first.`,
        });
      }

      return await ctx.prisma.country.delete({
        where: { id: input.id },
      });
    }),

  // STATES
  getStates: adminProcedure
    .input(z.object({
      page: z.number().default(1),
      pageSize: z.number().default(25),
      search: z.string().optional(),
      countryId: z.number().optional(),
    }))
    .query(async ({ ctx, input }) => {
      const { page, pageSize, search, countryId } = input;
      const skip = (page - 1) * pageSize;

      const where: any = {};
      
      if (search) {
        where.name = { contains: search, mode: "insensitive" as const };
      }
      
      if (countryId) {
        where.countryId = countryId;
      }

      const [states, total] = await Promise.all([
        ctx.prisma.state.findMany({
          where,
          skip,
          take: pageSize,
          orderBy: { name: "asc" },
          include: {
            country: {
              select: { name: true },
            },
          },
        }),
        ctx.prisma.state.count({ where }),
      ]);

      return {
        states,
        total,
        pages: Math.ceil(total / pageSize),
      };
    }),

  createState: adminProcedure
    .input(z.object({
      name: z.string().min(1),
      countryId: z.number(),
    }))
    .mutation(async ({ ctx, input }) => {
      return await ctx.prisma.$transaction(async (tx) => {
        const max = await tx.state.aggregate({
          _max: { id: true },
        });

        const nextId = (max._max.id ?? 0) + 1;

        return await tx.state.create({
          data: {
            id: nextId,
            name: input.name,
            countryId: input.countryId,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        });
      });
    }),

  updateState: adminProcedure
    .input(z.object({
      id: z.number(),
      name: z.string().min(1),
      countryId: z.number(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      return await ctx.prisma.state.update({
        where: { id },
        data: {
          ...data,
          updatedAt: new Date(),
        },
      });
    }),

  deleteState: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      // Check if state has cities
      const citiesCount = await ctx.prisma.city.count({
        where: { stateId: input.id },
      });

      if (citiesCount > 0) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Cannot delete state with ${citiesCount} existing cities. Delete cities first.`,
        });
      }

      return await ctx.prisma.state.delete({
        where: { id: input.id },
      });
    }),

  // CITIES
  getCities: adminProcedure
    .input(z.object({
      page: z.number().default(1),
      pageSize: z.number().default(25),
      search: z.string().optional(),
      stateId: z.number().optional(),
    }))
    .query(async ({ ctx, input }) => {
      const { page, pageSize, search, stateId } = input;
      const skip = (page - 1) * pageSize;

      const where: any = {};
      
      if (search) {
        where.name = { contains: search, mode: "insensitive" as const };
      }
      
      if (stateId) {
        where.stateId = stateId;
      }

      const [cities, total] = await Promise.all([
        ctx.prisma.city.findMany({
          where,
          skip,
          take: pageSize,
          orderBy: { name: "asc" },
          include: {
            state: {
              select: { 
                name: true,
                country: {
                  select: { name: true },
                },
              },
            },
          },
        }),
        ctx.prisma.city.count({ where }),
      ]);

      return {
        cities,
        total,
        pages: Math.ceil(total / pageSize),
      };
    }),

  createCity: adminProcedure
    .input(z.object({
      name: z.string().min(1),
      stateId: z.number(),
    }))
    .mutation(async ({ ctx, input }) => {
      return await ctx.prisma.$transaction(async (tx) => {
        const max = await tx.city.aggregate({
          _max: { id: true },
        });

        const nextId = (max._max.id ?? 0) + 1;

        return await tx.city.create({
          data: {
            id: nextId,
            name: input.name,
            stateId: input.stateId,
          },
        });
      });
    }),

  updateCity: adminProcedure
    .input(z.object({
      id: z.number(),
      name: z.string().min(1),
      stateId: z.number(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      return await ctx.prisma.city.update({
        where: { id },
        data,
      });
    }),

  deleteCity: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      return await ctx.prisma.city.delete({
        where: { id: input.id },
      });
    }),
});
