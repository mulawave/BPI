import { z } from "zod";
import { createTRPCRouter, protectedProcedure, publicProcedure } from "../trpc";
import { prisma } from "@/lib/prisma";

const adminProcedure = protectedProcedure.use(async ({ ctx, next }) => {
  const userRole = (ctx.session?.user as any)?.role;
  if (userRole !== "admin" && userRole !== "super_admin") {
    throw new Error("UNAUTHORIZED: Admin only");
  }
  return next();
});

export const contentRouter = createTRPCRouter({
  // Public: fetch a published page by slug
  getPageBySlug: publicProcedure
    .input(z.object({ slug: z.string().min(1) }))
    .query(async ({ input }) => {
      const pageRepo = (prisma as any).page;
      const page = await pageRepo.findFirst({
        where: { slug: input.slug, status: "published" },
      });
      return page || null;
    }),

  // Public: footer links
  getFooterPages: publicProcedure.query(async () => {
    const pageRepo = (prisma as any).page;
    const pages = await pageRepo.findMany({
      where: { status: "published", category: { in: ["terms", "policy", "privacy", "cookies", "custom"] } },
      orderBy: { updatedAt: "desc" },
      select: { id: true, title: true, slug: true, category: true },
    });
    return pages;
  }),

  // Admin: list pages with filters
  adminListPages: adminProcedure
    .input(z.object({
      page: z.number().min(1).default(1),
      pageSize: z.number().min(1).max(100).default(20),
      search: z.string().optional(),
      category: z.string().optional(),
      status: z.string().optional(),
    }).optional())
    .query(async ({ input }) => {
      const page = input?.page ?? 1;
      const pageSize = input?.pageSize ?? 20;
      const where: any = {};
      if (input?.search) {
        where.OR = [
          { title: { contains: input.search, mode: "insensitive" } },
          { slug: { contains: input.search, mode: "insensitive" } },
          { body: { contains: input.search, mode: "insensitive" } },
        ];
      }
      if (input?.category) where.category = input.category;
      if (input?.status) where.status = input.status;

      const pageRepo = (prisma as any).page;
      const [total, items] = await Promise.all([
        pageRepo.count({ where }),
        pageRepo.findMany({
          where,
          orderBy: { updatedAt: "desc" },
          skip: (page - 1) * pageSize,
          take: pageSize,
        }),
      ]);

      return { items, total, page, pageSize, pages: Math.ceil(total / pageSize) };
    }),

  // Admin: fetch single page
  adminGetPage: adminProcedure
    .input(z.object({ id: z.string().optional(), slug: z.string().optional() }))
    .query(async ({ input }) => {
      const pageRepo = (prisma as any).page;
      const page = await pageRepo.findFirst({
        where: {
          OR: [
            input.id ? { id: input.id } : undefined,
            input.slug ? { slug: input.slug } : undefined,
          ].filter(Boolean) as any,
        },
      });
      if (!page) {
        throw new Error("Page not found");
      }
      return page;
    }),

  // Admin: upsert page (create or update)
  adminUpsertPage: adminProcedure
    .input(z.object({
      id: z.string().optional(),
      slug: z.string().min(1),
      title: z.string().min(1),
      category: z.string().default("custom"),
      status: z.string().default("draft"),
      summary: z.string().nullable().optional(),
      body: z.string().default(""),
      heroImage: z.string().nullable().optional(),
      blocks: z.any().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const pageRepo = (prisma as any).page;
      const normalizedSlug = input.slug.trim().toLowerCase();
      const data = {
        slug: normalizedSlug,
        title: input.title,
        category: input.category || "custom",
        status: input.status || "draft",
        summary: input.summary ?? undefined,
        body: input.body || "",
        heroImage: input.heroImage ?? undefined,
        blocks: input.blocks ?? undefined,
        updatedBy: (ctx.session?.user as any)?.id || undefined,
        ...(input.id ? {} : { createdBy: (ctx.session?.user as any)?.id || undefined }),
      } as const;

      if (input.id) {
        const updated = await pageRepo.update({ where: { id: input.id }, data });
        return updated;
      }
      const created = await pageRepo.create({ data });
      return created;
    }),
});
