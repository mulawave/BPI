import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { internalizeImageFromUrl } from "@/lib/imageInternalizer";
import fs from "fs/promises";
import path from "path";

const BlogPostStatusEnum = {
  DRAFT: "DRAFT",
  PUBLISHED: "PUBLISHED",
  ARCHIVED: "ARCHIVED",
} as const;
type BlogPostStatus = (typeof BlogPostStatusEnum)[keyof typeof BlogPostStatusEnum];

const adminProcedure = protectedProcedure.use(async ({ ctx, next }) => {
  if (!ctx.session?.user) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: "You must be logged in" });
  }
  const role = (ctx.session.user as any).role;
  if (role !== "admin" && role !== "super_admin") {
    throw new TRPCError({ code: "UNAUTHORIZED", message: "Admin access required" });
  }
  return next();
});

const postInput = z.object({
  title: z.string().min(3),
  slug: z.string().optional(),
  content: z.string().min(1),
  excerpt: z.string().optional(),
  tags: z.string().optional(),
  status: z.nativeEnum(BlogPostStatusEnum).default(BlogPostStatusEnum.DRAFT),
  featured: z.boolean().default(false),
  categoryId: z.number().optional(),
  image: z.string().optional(),
  imageUrl: z.string().url().optional(),
  publishedAt: z.date().optional(),
});

const listInput = z.object({
  page: z.number().min(1).default(1),
  perPage: z.number().min(1).max(100).default(20),
  search: z.string().optional(),
  status: z.nativeEnum(BlogPostStatusEnum).optional(),
  categoryId: z.number().optional(),
  featured: z.boolean().optional(),
});

export const adminBlogRouter = createTRPCRouter({
  getStats: adminProcedure.query(async ({ ctx }) => {
    const prisma = ctx.prisma as any;
    const today = new Date();
    const since14Days = new Date();
    since14Days.setDate(since14Days.getDate() - 13);

    const [posts, viewEventsTotal, viewEventsRecent, readersUnique] = await Promise.all([
      prisma.blogPost.findMany({
        select: {
          id: true,
          title: true,
          slug: true,
          status: true,
          featured: true,
          categoryId: true,
          category: { select: { id: true, name: true } },
          viewCount: true,
          createdAt: true,
          publishedAt: true,
          _count: { select: { views: true, comments: true } },
        },
      }),
      prisma.blogView.count(),
      prisma.blogView.findMany({
        where: { viewedAt: { gte: since14Days } },
        select: { viewedAt: true },
      }),
      prisma.blogView.count({
        distinct: ["userId"],
        where: { userId: { not: null } },
      }),
    ]);

    const total = posts.length;
    const published = posts.filter((p: any) => p.status === BlogPostStatusEnum.PUBLISHED).length;
    const drafts = posts.filter((p: any) => p.status === BlogPostStatusEnum.DRAFT).length;
    const comments = posts.reduce((acc: number, p: any) => acc + (p._count?.comments || 0), 0);

    const viewCountForPost = (p: any) => Math.max(p.viewCount || 0, p._count?.views || 0);
    const viewsTotal = posts.reduce((acc: number, p: any) => acc + viewCountForPost(p), 0);

    // Views by day (prefer actual events; fallback by distributing views from published posts)
    const buildEmptyWindow = () => {
      const map = new Map<string, number>();
      for (let i = 0; i < 14; i++) {
        const d = new Date();
        d.setDate(d.getDate() - (13 - i));
        const key = d.toISOString().slice(0, 10);
        map.set(key, 0);
      }
      return map;
    };

    let viewsByDayMap = buildEmptyWindow();
    viewEventsRecent.forEach((v: any) => {
      const key = v.viewedAt.toISOString().slice(0, 10);
      if (viewsByDayMap.has(key)) {
        viewsByDayMap.set(key, (viewsByDayMap.get(key) || 0) + 1);
      }
    });

    const hasEventData = Array.from(viewsByDayMap.values()).some((v) => v > 0);
    if (!hasEventData && viewsTotal > 0) {
      viewsByDayMap = buildEmptyWindow();
      posts.forEach((p: any) => {
        const views = viewCountForPost(p);
        if (!views) return;
        const startDate = p.publishedAt || p.createdAt || today;
        const start = startDate > since14Days ? startDate : since14Days;
        const diffDays = Math.max(0, Math.floor((today.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));
        const span = Math.min(13, diffDays);
        const days = span + 1;
        const perDay = views / days;
        for (let i = 0; i <= span; i++) {
          const d = new Date(today);
          d.setDate(today.getDate() - i);
          const key = d.toISOString().slice(0, 10);
          if (viewsByDayMap.has(key)) {
            viewsByDayMap.set(key, (viewsByDayMap.get(key) || 0) + perDay);
          }
        }
      });
      // Round for display stability
      viewsByDayMap = new Map(Array.from(viewsByDayMap.entries()).map(([date, count]) => [date, Math.round(count)]));
    }

    const viewsByDay = Array.from(viewsByDayMap.entries()).map(([date, count]) => ({ date, count }));
    const views14d = viewsByDay.reduce((acc, v) => acc + v.count, 0);

    const topPosts = posts
      .map((p: any) => ({
        id: p.id,
        title: p.title,
        slug: p.slug,
        viewCount: viewCountForPost(p),
      }))
      .sort((a: any, b: any) => b.viewCount - a.viewCount)
      .slice(0, 5);

    const categoryMap = new Map<number | null, { name: string; posts: number; views: number }>();
    posts.forEach((p: any) => {
      const key = p.categoryId ?? null;
      const existing = categoryMap.get(key) || { name: p.category?.name || "Uncategorized", posts: 0, views: 0 };
      categoryMap.set(key, {
        name: existing.name,
        posts: existing.posts + 1,
        views: existing.views + viewCountForPost(p),
      });
    });
    const totalCategoryViews = Array.from(categoryMap.values()).reduce((acc, v) => acc + v.views, 0);
    const fallbackBasis = totalCategoryViews || posts.length || 1;
    const categoryBreakdown = Array.from(categoryMap.entries()).map(([categoryId, entry]) => ({
      categoryId,
      name: entry.name,
      posts: entry.posts,
      views: entry.views,
      share: Math.round(((entry.views || entry.posts) / fallbackBasis) * 100),
    }));

    return {
      total,
      published,
      drafts,
      comments,
      viewsTotal,
      viewEvents: viewEventsTotal,
      readersUnique,
      viewsByDay,
      views14d,
      topPosts,
      categoryBreakdown,
    };
  }),

  listPosts: adminProcedure
    .input(listInput)
    .query(async ({ ctx, input }) => {
      const { page, perPage } = input;
      const where = {
        ...(input.search
          ? {
              OR: [
                { title: { contains: input.search, mode: "insensitive" } },
                { content: { contains: input.search, mode: "insensitive" } },
              ],
            }
          : {}),
        ...(input.status ? { status: input.status } : {}),
        ...(input.categoryId ? { categoryId: input.categoryId } : {}),
        ...(typeof input.featured === "boolean" ? { featured: input.featured } : {}),
      };

      const prisma = ctx.prisma as any;
      const [total, posts] = await Promise.all([
        prisma.blogPost.count({ where }),
        prisma.blogPost.findMany({
          where,
          orderBy: { createdAt: "desc" },
          skip: (page - 1) * perPage,
          take: perPage,
          select: {
            id: true,
            title: true,
            slug: true,
            content: true,
            excerpt: true,
            tags: true,
            status: true,
            featured: true,
            image: true,
            imageUrl: true,
            imageInternalized: true,
            categoryId: true,
            viewCount: true,
            createdAt: true,
            publishedAt: true,
            author: { select: { id: true, name: true, email: true, image: true } },
            category: { select: { id: true, name: true, slug: true } },
            _count: { select: { comments: true, views: true } },
          },
        }),
      ]);

      return {
        total,
        page,
        perPage,
        totalPages: Math.max(1, Math.ceil(total / perPage)),
        posts,
      };
    }),

  getPost: adminProcedure.input(z.object({ id: z.number() })).query(async ({ ctx, input }) => {
    const prisma = ctx.prisma as any;
    const post = await prisma.blogPost.findUnique({
      where: { id: input.id },
      include: {
        category: true,
        author: { select: { id: true, name: true, email: true, image: true } },
      },
    });
    if (!post) throw new TRPCError({ code: "NOT_FOUND", message: "Post not found" });
    return post;
  }),

  createPost: adminProcedure.input(postInput).mutation(async ({ ctx, input }) => {
    const authorId = ctx.session!.user!.id;
    const slugBase = input.slug || input.title.toLowerCase().replace(/[^a-z0-9\s-]/g, "").trim().replace(/\s+/g, "-");
    let slug = slugBase || `post-${Date.now()}`;
    let suffix = 1;
    const prisma = ctx.prisma as any;
    while (await prisma.blogPost.findUnique({ where: { slug } })) {
      slug = `${slugBase}-${suffix++}`;
    }
    return prisma.blogPost.create({
      data: {
        title: input.title,
        slug,
        content: input.content,
        excerpt: input.excerpt ?? input.content.slice(0, 280),
        tags: input.tags,
        status: input.status,
        featured: input.featured,
        categoryId: input.categoryId,
        image: input.image,
        imageUrl: input.imageUrl,
        authorId,
        publishedAt: input.publishedAt ?? (input.status === BlogPostStatusEnum.PUBLISHED ? new Date() : null),
      },
    });
  }),

  updatePost: adminProcedure
    .input(postInput.extend({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const prisma = ctx.prisma as any;
      const existing = await prisma.blogPost.findUnique({ where: { id: input.id } });
      if (!existing) throw new TRPCError({ code: "NOT_FOUND", message: "Post not found" });

      let slug = existing.slug;
      if (input.slug) {
        const slugBase = input.slug.toLowerCase().replace(/[^a-z0-9\s-]/g, "").trim().replace(/\s+/g, "-");
        slug = slugBase || slug;
        let suffix = 1;
        while (await prisma.blogPost.findFirst({ where: { slug, NOT: { id: input.id } } })) {
          slug = `${slugBase}-${suffix++}`;
        }
      }

      return prisma.blogPost.update({
        where: { id: input.id },
        data: {
          title: input.title,
          slug,
          content: input.content,
          excerpt: input.excerpt ?? input.content.slice(0, 280),
          tags: input.tags,
          status: input.status,
          featured: input.featured,
          categoryId: input.categoryId,
          image: input.image,
          imageUrl: input.imageUrl,
          publishedAt: input.publishedAt ?? existing.publishedAt,
        },
      });
    }),

  deletePost: adminProcedure.input(z.object({ id: z.number() })).mutation(async ({ ctx, input }) => {
    const prisma = ctx.prisma as any;
    await prisma.blogPost.delete({ where: { id: input.id } });
    return { success: true };
  }),

  listCategories: adminProcedure.query(async ({ ctx }) => {
    const prisma = ctx.prisma as any;
    return prisma.blogCategory.findMany({ orderBy: { name: "asc" } });
  }),

  createCategory: adminProcedure
    .input(z.object({ name: z.string().min(2), slug: z.string().optional(), description: z.string().optional() }))
    .mutation(async ({ ctx, input }) => {
      const slugBase = input.slug || input.name.toLowerCase().replace(/[^a-z0-9\s-]/g, "").trim().replace(/\s+/g, "-");
      let slug = slugBase;
      let suffix = 1;
      const prisma = ctx.prisma as any;
      while (await prisma.blogCategory.findUnique({ where: { slug } })) {
        slug = `${slugBase}-${suffix++}`;
      }
      return prisma.blogCategory.create({
        data: { name: input.name, slug, description: input.description },
      });
    }),

  updateCategory: adminProcedure
    .input(z.object({ id: z.number(), name: z.string().min(2), slug: z.string().optional(), description: z.string().optional() }))
    .mutation(async ({ ctx, input }) => {
      const slugBase = input.slug || input.name.toLowerCase().replace(/[^a-z0-9\s-]/g, "").trim().replace(/\s+/g, "-");
      let slug = slugBase;
      let suffix = 1;
      const prisma = ctx.prisma as any;
      while (await prisma.blogCategory.findFirst({ where: { slug, NOT: { id: input.id } } })) {
        slug = `${slugBase}-${suffix++}`;
      }
      return prisma.blogCategory.update({
        where: { id: input.id },
        data: { name: input.name, slug, description: input.description },
      });
    }),

  deleteCategory: adminProcedure.input(z.object({ id: z.number() })).mutation(async ({ ctx, input }) => {
    const prisma = ctx.prisma as any;
    await prisma.blogCategory.delete({ where: { id: input.id } });
    return { success: true };
  }),

  getComments: adminProcedure
    .input(z.object({ postId: z.number().optional(), page: z.number().min(1).default(1), perPage: z.number().min(1).max(100).default(25) }))
    .query(async ({ ctx, input }) => {
      const where = input.postId ? { postId: input.postId } : {};
      const prisma = ctx.prisma as any;
      const [total, comments] = await Promise.all([
        prisma.blogComment.count({ where }),
        prisma.blogComment.findMany({
          where,
          orderBy: { createdAt: "desc" },
          skip: (input.page - 1) * input.perPage,
          take: input.perPage,
          include: { user: { select: { id: true, name: true, email: true, image: true } }, post: { select: { id: true, title: true } } },
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

  deleteComment: adminProcedure.input(z.object({ id: z.number() })).mutation(async ({ ctx, input }) => {
    const prisma = ctx.prisma as any;
    await prisma.blogComment.delete({ where: { id: input.id } });
    return { success: true };
  }),

  internalizeImage: adminProcedure.input(z.object({ postId: z.number() })).mutation(async ({ ctx, input }) => {
    const prisma = ctx.prisma as any;
    const post = await prisma.blogPost.findUnique({ where: { id: input.postId } });
    if (!post) throw new TRPCError({ code: "NOT_FOUND", message: "Post not found" });
    if (!post.imageUrl) throw new TRPCError({ code: "BAD_REQUEST", message: "No external image URL to internalize" });

    const { localPath } = await internalizeImageFromUrl(post.imageUrl, post.id);

    await prisma.blogPost.update({
      where: { id: post.id },
      data: { image: localPath, imageInternalized: true },
    });

    return { success: true, image: localPath };
  }),

  uploadImage: adminProcedure
    .input(z.object({
      fileBase64: z.string().min(10),
      filename: z.string().min(3),
    }))
    .mutation(async ({ input }) => {
      const { fileBase64, filename } = input;

      const matches = fileBase64.match(/^data:(.*?);base64,(.*)$/);
      if (!matches) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Invalid file data" });
      }
      const mime = matches[1];
      const data = matches[2];
      const buffer = Buffer.from(data, "base64");

      const maxSize = 5 * 1024 * 1024; // 5MB
      if (buffer.length > maxSize) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Image too large (max 5MB)" });
      }

      const extFromMime = mime.split("/")[1] || "jpg";
      const safeName = filename.replace(/[^a-zA-Z0-9-_\.]/g, "_");
      const ext = safeName.includes(".") ? safeName.split(".").pop() : extFromMime;
      const finalName = `${Date.now()}-${Math.round(Math.random() * 1e6)}.${ext}`;
      const relative = path.join("uploads", "blog", finalName);
      const targetPath = path.join(process.cwd(), "public", relative);

      await fs.mkdir(path.dirname(targetPath), { recursive: true });
      await fs.writeFile(targetPath, buffer);

      return { image: `/${relative.replace(/\\/g, "/")}` };
    }),
});
