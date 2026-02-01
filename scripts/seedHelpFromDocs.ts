import fs from "fs";
import path from "path";
import { prisma } from "../lib/prisma";

const docsDir = path.resolve(__dirname, "..", "docs");
const userHelpPath = path.join(docsDir, "user-help-guide.md");
const botHelpPath = path.join(docsDir, "help-bot-training.md");

const slugify = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");

const parseSections = (content: string) => {
  const sections = content.split(/^##\s+/m).slice(1);
  return sections.map((section) => {
    const [headingLine, ...rest] = section.split(/\r?\n/);
    const heading = headingLine.trim();
    const body = rest.join("\n").trim();
    return { heading, body };
  });
};

const extractSummary = (body: string) => {
  const firstParagraph = body.split(/\n\s*\n/)[0]?.trim();
  return firstParagraph || "";
};

const extractSteps = (body: string) => {
  return body
    .split(/\r?\n/)
    .filter((line) => line.trim().startsWith("- "))
    .map((line) => line.replace(/^\s*-\s+/, "").trim())
    .filter(Boolean);
};

const extractTags = (heading: string) => {
  return heading
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 6);
};

const categoryRules: Array<{ test: (heading: string) => boolean; category: string }> = [
  { test: (h) => h.toLowerCase().includes("dashboard"), category: "dashboard" },
  { test: (h) => h.toLowerCase().includes("store"), category: "store" },
  { test: (h) => h.toLowerCase().includes("blog"), category: "blog" },
  { test: (h) => h.toLowerCase().includes("csp"), category: "csp" },
  { test: (h) => h.toLowerCase().includes("account") || h.toLowerCase().includes("settings"), category: "account" },
  { test: (h) => h.toLowerCase().includes("security"), category: "security" },
  { test: (h) => h.toLowerCase().includes("troubleshoot"), category: "troubleshooting" },
  { test: (h) => h.toLowerCase().includes("help"), category: "help-center" },
  { test: () => true, category: "general" },
];

const categories = [
  { name: "Getting Started", slug: "general", description: "Basics and onboarding", order: 1 },
  { name: "Dashboard", slug: "dashboard", description: "Portfolio and daily actions", order: 2 },
  { name: "Store", slug: "store", description: "Browse, checkout, and pickup", order: 3 },
  { name: "Blog", slug: "blog", description: "Read and comment", order: 4 },
  { name: "CSP", slug: "csp", description: "Community Support Program", order: 5 },
  { name: "Account", slug: "account", description: "Profile and settings", order: 6 },
  { name: "Security", slug: "security", description: "PIN and 2FA", order: 7 },
  { name: "Troubleshooting", slug: "troubleshooting", description: "Fix common issues", order: 8 },
  { name: "Help Center", slug: "help-center", description: "Support and guidance", order: 9 },
];

const ensureCategories = async () => {
  for (const category of categories) {
    await prisma.helpCategory.upsert({
      where: { slug: category.slug },
      update: {
        name: category.name,
        description: category.description,
        order: category.order,
        isActive: true,
      },
      create: {
        name: category.name,
        slug: category.slug,
        description: category.description,
        order: category.order,
        isActive: true,
      },
    });
  }
};

const resolveCategoryId = async (heading: string) => {
  const match = categoryRules.find((rule) => rule.test(heading))?.category ?? "general";
  const category = await prisma.helpCategory.findUnique({ where: { slug: match } });
  return category?.id || null;
};

const upsertTopic = async (heading: string, body: string, adminOnly = false) => {
  const slug = slugify(heading);
  const summary = extractSummary(body);
  const steps = extractSteps(body);
  const tags = adminOnly ? Array.from(new Set(["admin-only", ...extractTags(heading)])) : extractTags(heading);
  const categoryId = await resolveCategoryId(heading);

  const topic = await prisma.helpTopic.upsert({
    where: { slug },
    update: {
      title: heading,
      summary,
      steps,
      tags,
      categoryId,
      isPublished: true,
    },
    create: {
      title: heading,
      slug,
      summary,
      steps,
      tags,
      categoryId,
      isPublished: true,
    },
  });

  await prisma.helpRevision.create({
    data: {
      topicId: topic.id,
      contentSnapshot: {
        title: topic.title,
        summary: topic.summary,
        steps: topic.steps,
        faq: topic.faq,
        tags: topic.tags,
        isPublished: topic.isPublished,
        categoryId: topic.categoryId,
      },
    },
  });
};

const seedFromDoc = async (filePath: string, adminOnly = false) => {
  if (!fs.existsSync(filePath)) return;
  const content = fs.readFileSync(filePath, "utf-8");
  const sections = parseSections(content);
  for (const section of sections) {
    await upsertTopic(section.heading, section.body, adminOnly);
  }
};

async function main() {
  await ensureCategories();
  await seedFromDoc(userHelpPath, false);
  await seedFromDoc(botHelpPath, true);
}

main()
  .then(() => {
    console.log("Help Center seeded from docs.");
    process.exit(0);
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
