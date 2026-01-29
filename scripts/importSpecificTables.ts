import { PrismaClient } from "@prisma/client";
import fs from "node:fs/promises";
import path from "node:path";

const prisma = new PrismaClient();

const readJson = async <T>(filePath: string): Promise<T[]> => {
  const raw = await fs.readFile(filePath, "utf8");
  return JSON.parse(raw) as T[];
};

async function main() {
  const exportDir = path.resolve(process.cwd(), "table-exports");

  console.log("Starting table imports...\n");

  // Import HelpCategory first (no dependencies)
  console.log("Importing HelpCategory...");
  const helpCategories = await readJson(path.join(exportDir, "HelpCategory.json"));
  if (helpCategories.length) {
    await prisma.helpCategory.createMany({ data: helpCategories as any, skipDuplicates: true });
    console.log(`✓ Imported ${helpCategories.length} HelpCategory records\n`);
  }

  // Import HelpTopic (depends on HelpCategory)
  console.log("Importing HelpTopic...");
  const helpTopics = await readJson(path.join(exportDir, "HelpTopic.json"));
  if (helpTopics.length) {
    await prisma.helpTopic.createMany({ data: helpTopics as any, skipDuplicates: true });
    console.log(`✓ Imported ${helpTopics.length} HelpTopic records\n`);
  }

  // Import HelpRevision (depends on HelpTopic)
  console.log("Importing HelpRevision...");
  const helpRevisions = await readJson(path.join(exportDir, "HelpRevision.json"));
  if (helpRevisions.length) {
    await prisma.helpRevision.createMany({ data: helpRevisions as any, skipDuplicates: true });
    console.log(`✓ Imported ${helpRevisions.length} HelpRevision records\n`);
  }

  // Import HelpBotIntent
  console.log("Importing HelpBotIntent...");
  const helpIntents = await readJson(path.join(exportDir, "HelpBotIntent.json"));
  if (helpIntents.length) {
    await prisma.helpBotIntent.createMany({ data: helpIntents as any, skipDuplicates: true });
    console.log(`✓ Imported ${helpIntents.length} HelpBotIntent records\n`);
  } else {
    console.log("⊘ No HelpBotIntent records to import\n");
  }

  // Import HelpBotTrainingExample
  console.log("Importing HelpBotTrainingExample...");
  const helpExamples = await readJson(path.join(exportDir, "HelpBotTrainingExample.json"));
  if (helpExamples.length) {
    await prisma.helpBotTrainingExample.createMany({ data: helpExamples as any, skipDuplicates: true });
    console.log(`✓ Imported ${helpExamples.length} HelpBotTrainingExample records\n`);
  } else {
    console.log("⊘ No HelpBotTrainingExample records to import\n");
  }

  // Import BlogPost (no dependencies on our tables)
  console.log("Importing BlogPost...");
  const blogPosts = await readJson(path.join(exportDir, "BlogPost.json"));
  if (blogPosts.length) {
    await prisma.blogPost.createMany({ data: blogPosts as any, skipDuplicates: true });
    console.log(`✓ Imported ${blogPosts.length} BlogPost records\n`);
  }

  // Import BlogComment (depends on BlogPost and User)
  console.log("Importing BlogComment...");
  const blogComments = await readJson(path.join(exportDir, "BlogComment.json"));
  if (blogComments.length) {
    await prisma.blogComment.createMany({ data: blogComments as any, skipDuplicates: true });
    console.log(`✓ Imported ${blogComments.length} BlogComment records\n`);
  }

  // Import BlogView (depends on BlogPost)
  console.log("Importing BlogView...");
  const blogViews = await readJson(path.join(exportDir, "BlogView.json"));
  if (blogViews.length) {
    await prisma.blogView.createMany({ data: blogViews as any, skipDuplicates: true });
    console.log(`✓ Imported ${blogViews.length} BlogView records\n`);
  }

  console.log(`\n✅ All table imports completed successfully!`);
}

main()
  .catch((err) => {
    console.error("Import failed:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
