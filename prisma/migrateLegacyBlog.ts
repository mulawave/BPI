import fs from "fs/promises";
import path from "path";
import { PrismaClient } from "@prisma/client";

// This script migrates legacy tbl_blog data (and blog_comments) from the legacy SQL dump.
// It intentionally ignores the cicool `blog` table per requirements.
// Run with:  pnpm ts-node prisma/migrateLegacyBlog.ts

const prisma = new PrismaClient();

const LEGACY_SQL_PATH = path.join(process.cwd(), "legacy_sql", "beepagro_beepagro.sql");

type ParsedValue = string | number | null;
type ParsedRow = ParsedValue[];

const BlogPostStatusEnum = {
  DRAFT: "DRAFT",
  PUBLISHED: "PUBLISHED",
  ARCHIVED: "ARCHIVED",
} as const;

function slugify(title: string) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

function unescapeSqlString(value: string) {
  return value
    .replace(/\\n/g, "\n")
    .replace(/\\r/g, "\r")
    .replace(/\\'/g, "'");
}

// Basic SQL INSERT values parser that handles quoted strings, parentheses, and escapes.
function parseInsertValues(valuesBlock: string): ParsedRow[] {
  const rows: ParsedRow[] = [];
  let current: ParsedRow = [];
  let field = "";
  let inString = false;
  let escapeNext = false;

  const pushField = () => {
    const trimmed = field.trim();
    if (trimmed.toUpperCase() === "NULL") {
      current.push(null);
    } else if (trimmed.startsWith("'") && trimmed.endsWith("'")) {
      const inner = trimmed.slice(1, -1);
      current.push(unescapeSqlString(inner));
    } else if (/^-?\d+(\.\d+)?$/.test(trimmed)) {
      current.push(Number(trimmed));
    } else {
      current.push(trimmed);
    }
    field = "";
  };

  for (let i = 0; i < valuesBlock.length; i++) {
    const char = valuesBlock[i];

    if (escapeNext) {
      field += char;
      escapeNext = false;
      continue;
    }

    if (char === "\\") {
      field += "\\";
      escapeNext = true;
      continue;
    }

    if (char === "'") {
      inString = !inString;
      field += char;
      continue;
    }

    if (!inString && char === "(") {
      current = [];
      field = "";
      continue;
    }

    if (!inString && char === ")") {
      pushField();
      rows.push(current);
      current = [];
      field = "";
      continue;
    }

    if (!inString && char === ",") {
      // Field separator at the same nesting level
      if (field !== "") {
        pushField();
      }
      continue;
    }

    field += char;
  }

  return rows;
}

async function getLegacyBlocks(sql: string) {
  const tblBlogMatch = sql.match(/INSERT INTO `tbl_blog`[^]*?VALUES\s*([^;]+);/i);
  const commentsMatch = sql.match(/INSERT INTO `blog_comments`[^]*?VALUES\s*([^;]+);/i);

  return {
    tblBlogValues: tblBlogMatch ? tblBlogMatch[1] : "",
    commentsValues: commentsMatch ? commentsMatch[1] : "",
  };
}

async function findFallbackAuthor(prisma: PrismaClient) {
  const admin = await prisma.user.findFirst({ where: { role: { in: ["admin", "super_admin"] } } });
  if (admin) return admin;
  const anyUser = await prisma.user.findFirst();
  if (!anyUser) throw new Error("No users found to assign as fallback author");
  return anyUser;
}

async function main() {
  const sql = await fs.readFile(LEGACY_SQL_PATH, "utf8");
  const { tblBlogValues, commentsValues } = await getLegacyBlocks(sql);

  if (!tblBlogValues) {
    console.log("No tbl_blog INSERT block found. Aborting.");
    return;
  }

  const posts = parseInsertValues(tblBlogValues).map((row) => {
    const [id, publisher, title, message, date, tags, image, views] = row;
    return {
      legacyId: Number(id),
      publisher: publisher ? String(publisher) : undefined,
      title: String(title ?? "Untitled Post"),
      message: String(message ?? ""),
      date: date ? new Date(String(date)) : new Date(),
      tags: tags ? String(tags) : undefined,
      image: image ? String(image) : undefined,
      views: Number(views ?? 0),
    };
  });

  const comments = commentsValues
    ? parseInsertValues(commentsValues).map((row) => {
        const [id, blogId, commenter, comment, dateAdded] = row;
        return {
          legacyId: Number(id),
          blogId: Number(blogId),
          commenter: commenter ? String(commenter) : undefined,
          comment: String(comment ?? ""),
          date: dateAdded ? new Date(String(dateAdded)) : new Date(),
        };
      })
    : [];

  const prismaAny = prisma as any;
  const fallbackAuthor = await findFallbackAuthor(prisma);

  let created = 0;
  for (const post of posts) {
    const existing = await prismaAny.blogPost.findFirst({ where: { legacyId: post.legacyId } });
    if (existing) continue;

    const author = post.publisher
      ? await prisma.user.findFirst({ where: { legacyId: post.publisher } })
      : null;

    const slugBase = slugify(post.title);
    let slug = slugBase || `post-${post.legacyId}`;
    let suffix = 1;
    while (await prismaAny.blogPost.findUnique({ where: { slug } })) {
      slug = `${slugBase}-${suffix++}`;
    }

    const imageUrl = post.image ? `https://bpichain.africa/${post.image}` : undefined;

    await prismaAny.blogPost.create({
      data: {
        title: post.title,
        slug,
        content: post.message,
        excerpt: post.message.slice(0, 280),
        tags: post.tags,
        status: BlogPostStatusEnum.PUBLISHED,
        featured: true,
        authorId: author?.id ?? fallbackAuthor.id,
        viewCount: post.views,
        legacyId: post.legacyId,
        legacySource: "tbl_blog",
        imageUrl,
        publishedAt: post.date,
      },
    });
    created += 1;
  }

  let commentsCreated = 0;
  for (const comment of comments) {
    const target = await prismaAny.blogPost.findFirst({ where: { legacyId: comment.blogId } });
    if (!target) continue; // skip if cicool-only
    const existing = await prismaAny.blogComment.findFirst({ where: { legacyId: comment.legacyId, postId: target.id } });
    if (existing) continue;

    const user = comment.commenter
      ? await prisma.user.findFirst({ where: { legacyId: comment.commenter } })
      : null;

    await prismaAny.blogComment.create({
      data: {
        content: comment.comment,
        postId: target.id,
        userId: user?.id ?? fallbackAuthor.id,
        legacyId: comment.legacyId,
        createdAt: comment.date,
      },
    });
    commentsCreated += 1;
  }

  console.log(`Migrated ${created} posts and ${commentsCreated} comments from tbl_blog (legacy only, cicool ignored).`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
