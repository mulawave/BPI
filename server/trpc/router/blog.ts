import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "../trpc";

export const blogRouter = createTRPCRouter({
  // Get latest blog posts (defaults to 2 for dashboard)
  getLatestPosts: publicProcedure
    .input(z.object({
      limit: z.number().optional().default(2)
    }))
    .query(async ({ ctx, input }) => {
      const posts = await ctx.prisma.blog.findMany({
        where: {
          status: 'published' // Only show published posts
        },
        orderBy: {
          createdAt: 'desc'
        },
        take: input.limit,
        select: {
          id: true,
          title: true,
          slug: true,
          content: true,
          image: true,
          category: true,
          viewers: true,
          createdAt: true,
          author: {
            select: {
              name: true
            }
          }
        }
      });

      return { posts };
    }),
});
