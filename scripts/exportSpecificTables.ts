import { PrismaClient } from "@prisma/client";
import fs from "node:fs/promises";
import path from "node:path";

const prisma = new PrismaClient();

const ensureDir = async (dir: string) => {
  await fs.mkdir(dir, { recursive: true });
};

const writeJson = async (filePath: string, data: unknown) => {
  const json = JSON.stringify(data, null, 2);
  await fs.writeFile(filePath, json, "utf8");
};

async function main() {
  const exportDir = path.resolve(process.cwd(), "table-exports");
  await ensureDir(exportDir);

  console.log("Exporting tables...\n");

  // Blog tables
  console.log("Exporting BlogPost...");
  const blogPosts = await prisma.blogPost.findMany();
  await writeJson(path.join(exportDir, "BlogPost.json"), blogPosts);
  console.log(`✓ Exported ${blogPosts.length} BlogPost records\n`);

  console.log("Exporting BlogComment...");
  const blogComments = await prisma.blogComment.findMany();
  await writeJson(path.join(exportDir, "BlogComment.json"), blogComments);
  console.log(`✓ Exported ${blogComments.length} BlogComment records\n`);

  console.log("Exporting BlogView...");
  const blogViews = await prisma.blogView.findMany();
  await writeJson(path.join(exportDir, "BlogView.json"), blogViews);
  console.log(`✓ Exported ${blogViews.length} BlogView records\n`);

  // Help tables
  console.log("Exporting HelpCategory...");
  const helpCategories = await prisma.helpCategory.findMany();
  await writeJson(path.join(exportDir, "HelpCategory.json"), helpCategories);
  console.log(`✓ Exported ${helpCategories.length} HelpCategory records\n`);

  console.log("Exporting HelpTopic...");
  const helpTopics = await prisma.helpTopic.findMany();
  await writeJson(path.join(exportDir, "HelpTopic.json"), helpTopics);
  console.log(`✓ Exported ${helpTopics.length} HelpTopic records\n`);

  console.log("Exporting HelpRevision...");
  const helpRevisions = await prisma.helpRevision.findMany();
  await writeJson(path.join(exportDir, "HelpRevision.json"), helpRevisions);
  console.log(`✓ Exported ${helpRevisions.length} HelpRevision records\n`);

  console.log("Exporting HelpBotIntent...");
  const helpIntents = await prisma.helpBotIntent.findMany();
  await writeJson(path.join(exportDir, "HelpBotIntent.json"), helpIntents);
  console.log(`✓ Exported ${helpIntents.length} HelpBotIntent records\n`);

  console.log("Exporting HelpBotTrainingExample...");
  const helpExamples = await prisma.helpBotTrainingExample.findMany();
  await writeJson(path.join(exportDir, "HelpBotTrainingExample.json"), helpExamples);
  console.log(`✓ Exported ${helpExamples.length} HelpBotTrainingExample records\n`);

  console.log(`\n✅ All table exports completed successfully!`);
  console.log(`Files saved to: ${exportDir}`);
}

main()
  .catch((err) => {
    console.error("Export failed:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
