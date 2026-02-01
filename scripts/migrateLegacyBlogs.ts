// @ts-nocheck
import { PrismaClient, BlogPostStatus } from "@prisma/client";
import mysql from "mysql2/promise";

const prisma = new PrismaClient();

const slugify = (input: string) =>
  input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");

const toExcerpt = (input?: string | null, length = 180) => {
  if (!input) return null;
  const clean = input.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  if (clean.length <= length) return clean;
  return `${clean.slice(0, length - 1).trim()}…`;
};

async function main() {
  const legacyUrl = process.env.LEGACY_MYSQL_URL || process.env.LEGACY_DATABASE_URL;
  if (!legacyUrl) {
    throw new Error("Missing LEGACY_MYSQL_URL (or LEGACY_DATABASE_URL) env var for legacy blog migration");
  }

  const connection = await mysql.createConnection(legacyUrl);
  try {
    const [legacyCategories] = await connection.query<any[]>(
      "SELECT category_id, category_name, category_desc FROM blog_category"
    );

    const categoryIdMap = new Map<number, number>();
    for (const cat of legacyCategories) {
      const name: string = cat.category_name || "Uncategorized";
      const slug = slugify(name || "uncategorized");
      const upserted = await prisma.blogCategory.upsert({
        where: { slug },
        update: { name, description: cat.category_desc || undefined },
        create: { name, slug, description: cat.category_desc || undefined },
      });
      categoryIdMap.set(Number(cat.category_id), upserted.id);
    }

    const [legacyPosts] = await connection.query<any[]>(
      "SELECT id, title, slug, content, image, tags, category, status, author, viewers, created_at, updated_at FROM blog"
    );

    let imported = 0;
    for (const post of legacyPosts) {
      const title: string = post.title?.trim() || `Legacy Post ${post.id}`;
      const slug = slugify(post.slug || title);
      const categoryId = categoryIdMap.get(Number(post.category)) || null;
      const status: BlogPostStatus = (post.status || "publish").toLowerCase() === "publish" ? "PUBLISHED" : "DRAFT";
      const publishedAt = post.created_at ? new Date(post.created_at) : null;
      const content: string = post.content || "";

      await prisma.blogPost.upsert({
        where: { slug },
        update: {
          title,
          content,
          excerpt: toExcerpt(post.excerpt || content),
          tags: post.tags || null,
          status,
          categoryId: categoryId || undefined,
          image: post.image || null,
          imageUrl: post.image || null,
          viewCount: Number(post.viewers) || 0,
          publishedAt: status === "PUBLISHED" ? publishedAt : null,
          legacyId: post.id,
          legacySource: "legacy_mysql",
        },
        create: {
          title,
          slug,
          content,
          excerpt: toExcerpt(post.excerpt || content),
          tags: post.tags || null,
          status,
          categoryId: categoryId || undefined,
          image: post.image || null,
          imageUrl: post.image || null,
          viewCount: Number(post.viewers) || 0,
          publishedAt: status === "PUBLISHED" ? publishedAt : null,
          legacyId: post.id,
          legacySource: "legacy_mysql",
        },
      });

      imported += 1;
    }

    console.log(`Imported or updated ${imported} legacy blog posts.`);
  } finally {
    await connection.end();
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error("Legacy blog migration failed", err);
  return prisma.$disconnect().finally(() => process.exit(1));
});
