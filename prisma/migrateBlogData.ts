// @ts-nocheck
/**
 * Blog Data Migration Script
 * Migrates legacy blog data from tbl_blog, blog_category, and blog_comments
 * to new Prisma schema (BlogPost, BlogCategory, BlogComment)
 */

import { PrismaClient } from "@prisma/client";
import mysql from "mysql2/promise";
import slugify from "slugify";

const prisma = new PrismaClient();

// Legacy database connection (if needed, or read from SQL dump)
const LEGACY_DB_CONFIG = {
  host: process.env.LEGACY_DB_HOST || "localhost",
  user: process.env.LEGACY_DB_USER || "root",
  password: process.env.LEGACY_DB_PASSWORD || "",
  database: process.env.LEGACY_DB_NAME || "beepagro_beepagro",
};

interface LegacyBlogPost {
  id: number;
  publisher: number;
  title: string;
  message: string;
  date: string;
  tags: string;
  image: string;
  views: number;
}

interface LegacyCategory {
  category_id: number;
  category_name: string;
  category_desc: string;
}

interface LegacyComment {
  id: number;
  blog_id: number;
  commenter: number;
  comment: string;
  date_added: string;
}

async function generateUniqueSlug(title: string, existingSlugs: Set<string>): Promise<string> {
  let slug = slugify(title, { lower: true, strict: true });
  let counter = 1;
  let finalSlug = slug;

  while (existingSlugs.has(finalSlug)) {
    finalSlug = `${slug}-${counter}`;
    counter++;
  }

  existingSlugs.add(finalSlug);
  return finalSlug;
}

async function findUserByLegacyId(legacyId: number): Promise<string | null> {
  const user = await prisma.user.findFirst({
    where: {
      legacyId: legacyId.toString(),
    },
    select: {
      id: true,
    },
  });
  return user?.id || null;
}

async function migrateCategories(connection: mysql.Connection) {
  console.log("📂 Migrating blog categories...");

  const [rows] = await connection.query<mysql.RowDataPacket[]>(
    "SELECT * FROM blog_category"
  );

  const categories = rows as unknown as LegacyCategory[];
  const categoryMap = new Map<number, number>();

  for (const cat of categories) {
    const slug = slugify(cat.category_name, { lower: true, strict: true });

    const created = await prisma.blogCategory.create({
      data: {
        name: cat.category_name,
        slug,
        description: cat.category_desc || null,
      },
    });

    categoryMap.set(cat.category_id, created.id);
    console.log(`  ✓ Created category: ${cat.category_name} (ID: ${created.id})`);
  }

  return categoryMap;
}

async function migrateBlogPosts(
  connection: mysql.Connection,
  categoryMap: Map<number, number>
) {
  console.log("\n📝 Migrating blog posts from tbl_blog...");

  const [rows] = await connection.query<mysql.RowDataPacket[]>(
    "SELECT * FROM tbl_blog ORDER BY date ASC"
  );

  const posts = rows as unknown as LegacyBlogPost[];
  const postMap = new Map<number, number>();
  const existingSlugs = new Set<string>();

  // Get admin user as fallback author
  const adminUser = await prisma.user.findFirst({
    where: { role: "admin" },
    select: { id: true },
  });

  if (!adminUser) {
    throw new Error("No admin user found. Please create an admin user first.");
  }

  for (const post of posts) {
    // Find author by legacy ID
    let authorId = await findUserByLegacyId(post.publisher);
    if (!authorId) {
      console.warn(
        `  ⚠ User with legacyId ${post.publisher} not found. Using admin as author.`
      );
      authorId = adminUser.id;
    }

    // Generate slug
    const slug = await generateUniqueSlug(post.title, existingSlugs);

    // Extract excerpt (first 200 chars of message)
    const excerpt = post.message
      .replace(/\r\n/g, " ")
      .replace(/\n/g, " ")
      .slice(0, 200)
      .trim() + "...";

    // Parse image URL
    let imageUrl: string | null = null;
    let image: string | null = null;

    if (post.image && post.image.trim()) {
      // Check if it's already a full URL
      if (post.image.startsWith("http")) {
        imageUrl = post.image;
      } else {
        // Construct URL from legacy path
        imageUrl = `https://bpichain.africa/${post.image}`;
      }
    }

    // Create blog post
    const created = await prisma.blogPost.create({
      data: {
        title: post.title,
        slug,
        content: post.message,
        excerpt,
        image,
        imageUrl,
        imageInternalized: false,
        tags: post.tags || null,
        status: "PUBLISHED", // All legacy posts are published
        featured: false,
        authorId,
        categoryId: null, // tbl_blog doesn't have categories
        viewCount: post.views || 0,
        legacyId: post.id,
        createdAt: new Date(post.date),
        updatedAt: new Date(post.date),
        publishedAt: new Date(post.date),
      },
    });

    postMap.set(post.id, created.id);
    console.log(`  ✓ Migrated post: ${post.title} (ID: ${created.id})`);
  }

  return postMap;
}

async function migrateComments(
  connection: mysql.Connection,
  postMap: Map<number, number>
) {
  console.log("\n💬 Migrating blog comments...");

  const [rows] = await connection.query<mysql.RowDataPacket[]>(
    "SELECT * FROM blog_comments ORDER BY date_added ASC"
  );

  const comments = rows as unknown as LegacyComment[];
  let migratedCount = 0;
  let skippedCount = 0;

  for (const comment of comments) {
    // Find new post ID
    const newPostId = postMap.get(comment.blog_id);
    if (!newPostId) {
      console.warn(`  ⚠ Post ID ${comment.blog_id} not found. Skipping comment.`);
      skippedCount++;
      continue;
    }

    // Find user by legacy ID
    const userId = await findUserByLegacyId(comment.commenter);
    if (!userId) {
      console.warn(
        `  ⚠ User with legacyId ${comment.commenter} not found. Skipping comment.`
      );
      skippedCount++;
      continue;
    }

    await prisma.blogComment.create({
      data: {
        content: comment.comment,
        postId: newPostId,
        userId,
        legacyId: comment.id || undefined,
        createdAt: new Date(comment.date_added),
        updatedAt: new Date(comment.date_added),
      },
    });

    migratedCount++;
  }

  console.log(`  ✓ Migrated ${migratedCount} comments (${skippedCount} skipped)`);
}

async function createSyntheticViews(postMap: Map<number, number>) {
  console.log("\n👁 Creating synthetic view records...");

  const posts = await prisma.blogPost.findMany({
    select: {
      id: true,
      viewCount: true,
      publishedAt: true,
    },
  });

  for (const post of posts) {
    if (post.viewCount > 0 && post.publishedAt) {
      // Create a single synthetic view record to represent historical views
      await prisma.blogView.create({
        data: {
          postId: post.id,
          userId: null,
          ipAddress: "0.0.0.0",
          userAgent: "Migrated legacy views",
          viewedAt: post.publishedAt,
        },
      });
    }
  }

  console.log(`  ✓ Created synthetic view records`);
}

async function main() {
  console.log("🚀 Starting blog data migration...\n");

  let connection: mysql.Connection | null = null;

  try {
    // Connect to legacy database
    connection = await mysql.createConnection(LEGACY_DB_CONFIG);
    console.log("✓ Connected to legacy database\n");

    // Run migrations
    const categoryMap = await migrateCategories(connection);
    const postMap = await migrateBlogPosts(connection, categoryMap);
    await migrateComments(connection, postMap);
    await createSyntheticViews(postMap);

    console.log("\n✅ Blog migration completed successfully!");
    console.log(`📊 Summary:`);
    console.log(`   - Categories: ${categoryMap.size}`);
    console.log(`   - Posts: ${postMap.size}`);
    console.log(`   - Comments: Check output above`);
  } catch (error) {
    console.error("\n❌ Migration failed:", error);
    throw error;
  } finally {
    if (connection) {
      await connection.end();
    }
    await prisma.$disconnect();
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
