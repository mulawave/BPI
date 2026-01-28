import { z } from "zod";
import { createTRPCRouter, protectedProcedure, publicProcedure } from "../trpc";

const BlogPostStatusEnum = {
  DRAFT: "DRAFT",
  PUBLISHED: "PUBLISHED",
  ARCHIVED: "ARCHIVED",
} as const;
type BlogPostStatus = (typeof BlogPostStatusEnum)[keyof typeof BlogPostStatusEnum];

export const blogRouter = createTRPCRouter({
  // Latest posts for dashboards/carousels
  getLatestPosts: publicProcedure
    .input(z.object({ limit: z.number().min(1).max(20).default(6) }))
    .query(async ({ ctx, input }) => {
      const prisma = ctx.prisma as any;
      const posts = await prisma.blogPost.findMany({
        where: { status: BlogPostStatusEnum.PUBLISHED },
        orderBy: { publishedAt: "desc" },
        take: input.limit,
        select: {
          id: true,
          title: true,
          slug: true,
          excerpt: true,
          image: true,
          imageUrl: true,
          viewCount: true,
          createdAt: true,
          publishedAt: true,
          category: { select: { id: true, name: true, slug: true } },
          author: { select: { id: true, name: true, image: true } },
          _count: { select: { comments: true } },
        },
      });

      return { posts };
    }),

  list: publicProcedure
    .input(
      z.object({
        page: z.number().min(1).default(1),
        perPage: z.number().min(1).max(50).default(12),
        search: z.string().optional(),
        categorySlug: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const prisma = ctx.prisma as any;
      const where = {
        status: BlogPostStatusEnum.PUBLISHED,
        ...(input.search
          ? {
              OR: [
                { title: { contains: input.search, mode: "insensitive" } },
                { content: { contains: input.search, mode: "insensitive" } },
              ],
            }
          : {}),
        ...(input.categorySlug ? { category: { slug: input.categorySlug } } : {}),
      } as const;

      const [total, posts, categories] = await Promise.all([
        prisma.blogPost.count({ where }),
        prisma.blogPost.findMany({
          where,
          orderBy: { publishedAt: "desc" },
          skip: (input.page - 1) * input.perPage,
          take: input.perPage,
          select: {
            id: true,
            title: true,
            slug: true,
            excerpt: true,
            image: true,
            imageUrl: true,
            viewCount: true,
            publishedAt: true,
            category: { select: { id: true, name: true, slug: true } },
            author: { select: { id: true, name: true, image: true } },
            _count: { select: { comments: true } },
          },
        }),
        prisma.blogCategory.findMany({ orderBy: { name: "asc" } }),
      ]);

      return {
        total,
        page: input.page,
        perPage: input.perPage,
        totalPages: Math.max(1, Math.ceil(total / input.perPage)),
        posts,
        categories,
      };
    }),

  getPostBySlug: publicProcedure
    .input(z.object({ slug: z.string() }))
    .query(async ({ ctx, input }) => {
      const prisma = ctx.prisma as any;
      const post = await prisma.blogPost.findUnique({
        where: { slug: input.slug },
        include: {
          category: true,
          author: { select: { id: true, name: true, image: true, role: true } },
          _count: { select: { comments: true } },
        },
      });

      if (!post || post.status !== BlogPostStatusEnum.PUBLISHED) {
        throw new Error("Post not found");
      }

      return post;
    }),

  getComments: publicProcedure
    .input(z.object({ postId: z.number(), page: z.number().min(1).default(1), perPage: z.number().min(1).max(50).default(20) }))
    .query(async ({ ctx, input }) => {
      const where = { postId: input.postId };
      const prisma = ctx.prisma as any;
      const [total, comments] = await Promise.all([
        prisma.blogComment.count({ where }),
        prisma.blogComment.findMany({
          where,
          orderBy: { createdAt: "desc" },
          skip: (input.page - 1) * input.perPage,
          take: input.perPage,
          include: { user: { select: { id: true, name: true, image: true, role: true } } },
        }),
      ]);

      return {
        total,
        page: input.page,
        perPage: input.perPage,
        totalPages: Math.max(1, Math.ceil(total / input.perPage)),
        comments,
      };
    }),

  addComment: protectedProcedure
    .input(z.object({ postId: z.number(), content: z.string().min(1).max(1000) }))
    .mutation(async ({ ctx, input }) => {
      const prisma = ctx.prisma as any;
      const post = await prisma.blogPost.findUnique({ where: { id: input.postId } });
      if (!post || post.status !== BlogPostStatusEnum.PUBLISHED) {
        throw new Error("Cannot comment on this post");
      }
      return prisma.blogComment.create({
        data: {
          postId: input.postId,
          userId: ctx.session!.user!.id,
          content: input.content,
        },
      });
    }),

  incrementView: publicProcedure
    .input(z.object({ postId: z.number(), userAgent: z.string().optional(), ip: z.string().optional() }))
    .mutation(async ({ ctx, input }) => {
      const prisma = ctx.prisma as any;
      await prisma.blogPost.update({
        where: { id: input.postId },
        data: { viewCount: { increment: 1 } },
      });

      await prisma.blogView.create({
        data: {
          postId: input.postId,
          userId: ctx.session?.user?.id,
          userAgent: input.userAgent,
          ipAddress: input.ip,
        },
      });

      return { success: true };
    }),
});
