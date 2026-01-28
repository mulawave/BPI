import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { prisma } from "@/lib/prisma";

const prismaHelp = prisma as any;

export const helpRouter = createTRPCRouter({
  listCategories: protectedProcedure.query(async () => {
    const categories = (await prismaHelp.helpCategory.findMany({
      where: { isActive: true },
      orderBy: [{ order: "asc" }, { name: "asc" }],
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        order: true,
        isActive: true,
        _count: {
          select: {
            topics: true,
          },
        },
      },
    })) as Array<{
      id: string;
      name: string;
      slug: string;
      description: string | null;
      order: number;
      isActive: boolean;
      _count: { topics: number };
    }>;

    return categories.map((c: (typeof categories)[number]) => ({
      ...c,
      topicCount: c._count.topics,
    }));
  }),

  listTopics: protectedProcedure
    .input(
      z.object({
        categorySlug: z.string().optional(),
        search: z.string().optional(),
        page: z.number().min(1).default(1),
        pageSize: z.number().min(1).max(24).default(12),
      })
    )
    .query(async ({ input }) => {
      const { categorySlug, search, page, pageSize } = input;
      const skip = (page - 1) * pageSize;

      const where: any = { isPublished: true };
      if (categorySlug) {
        const category = await prismaHelp.helpCategory.findUnique({
          where: { slug: categorySlug },
          select: { id: true },
        });
        where.categoryId = category?.id ?? "__none__";
      }
      if (search) {
        where.OR = [
          { title: { contains: search, mode: "insensitive" } },
          { summary: { contains: search, mode: "insensitive" } },
          { tags: { has: search.toLowerCase() } },
        ];
      }

      const [topics, total] = await prisma.$transaction([
        prismaHelp.helpTopic.findMany({
          where,
          skip,
          take: pageSize,
          orderBy: [{ updatedAt: "desc" }],
          select: {
            id: true,
            title: true,
            slug: true,
            summary: true,
            tags: true,
            viewCount: true,
            helpfulYes: true,
            helpfulNo: true,
            updatedAt: true,
            category: {
              select: {
                id: true,
                name: true,
                slug: true,
              },
            },
          },
        }),
        prismaHelp.helpTopic.count({ where }),
      ]);

      return {
        topics,
        total,
        page,
        totalPages: Math.max(1, Math.ceil(total / pageSize)),
      };
    }),

  getTopicBySlug: protectedProcedure
    .input(z.object({ slug: z.string() }))
    .query(async ({ input }) => {
      const topic = await prismaHelp.helpTopic.findUnique({
        where: { slug: input.slug },
        select: {
          id: true,
          title: true,
          slug: true,
          summary: true,
          steps: true,
          faq: true,
          tags: true,
          viewCount: true,
          helpfulYes: true,
          helpfulNo: true,
          updatedAt: true,
          isPublished: true,
          category: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
        },
      });

      if (!topic?.isPublished) {
        return null;
      }

      return topic;
    }),

  incrementView: protectedProcedure
    .input(z.object({ topicId: z.string() }))
    .mutation(async ({ input }) => {
      await prismaHelp.helpTopic.update({
        where: { id: input.topicId },
        data: { viewCount: { increment: 1 } },
      });
      return { ok: true };
    }),

  recordHelpful: protectedProcedure
    .input(z.object({ topicId: z.string(), helpful: z.boolean() }))
    .mutation(async ({ input }) => {
      await prismaHelp.helpTopic.update({
        where: { id: input.topicId },
        data: input.helpful
          ? { helpfulYes: { increment: 1 } }
          : { helpfulNo: { increment: 1 } },
      });
      return { ok: true };
    }),
});
