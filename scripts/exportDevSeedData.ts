import { PrismaClient } from "@prisma/client";
import fs from "node:fs/promises";
import path from "node:path";

const prisma = new PrismaClient();

type UserEmailMap = Map<string, string | null>;

const getUserEmailMap = async (): Promise<UserEmailMap> => {
  const users = await prisma.user.findMany({ select: { id: true, email: true } });
  return new Map(users.map((u) => [u.id, u.email ?? null]));
};

const ensureDir = async (dir: string) => {
  await fs.mkdir(dir, { recursive: true });
};

const writeJson = async (filePath: string, data: unknown) => {
  const json = JSON.stringify(data, null, 2);
  await fs.writeFile(filePath, json, "utf8");
};

const exportHelp = async (exportDir: string) => {
  const [categories, topics, revisions, intents, examples] = await Promise.all([
    prisma.helpCategory.findMany({ orderBy: { order: "asc" } }),
    prisma.helpTopic.findMany(),
    prisma.helpRevision.findMany(),
    prisma.helpBotIntent.findMany(),
    prisma.helpBotTrainingExample.findMany(),
  ]);

  const helpExport = {
    categories,
    topics,
    revisions,
    intents,
    examples,
  };

  await writeJson(path.join(exportDir, "help.json"), helpExport);
};

const exportBlog = async (exportDir: string) => {
  const [categories, posts, comments, views] = await Promise.all([
    prisma.blogCategory.findMany(),
    prisma.blogPost.findMany(),
    prisma.blogComment.findMany(),
    prisma.blogView.findMany(),
  ]);

  const blogExport = {
    categories,
    posts,
    comments,
    views,
  };

  await writeJson(path.join(exportDir, "blog.json"), blogExport);
};

const exportFinancials = async (exportDir: string) => {
  const [
    transactions,
    transactionHistory,
    tokenTransactions,
    fundingHistory,
    withdrawalHistory,
    pendingPayments,
  ] = await Promise.all([
    prisma.transaction.findMany(),
    prisma.transactionHistory.findMany(),
    prisma.tokenTransaction.findMany(),
    prisma.fundingHistory.findMany(),
    prisma.withdrawalHistory.findMany(),
    prisma.pendingPayment.findMany(),
  ]);

  const financialExport = {
    transactions,
    transactionHistory,
    tokenTransactions,
    fundingHistory,
    withdrawalHistory,
    pendingPayments,
  };

  await writeJson(path.join(exportDir, "financials.json"), financialExport);
};

async function main() {
  const exportDir = path.resolve(process.cwd(), "seed-exports");
  await ensureDir(exportDir);

  await exportHelp(exportDir);
  await exportBlog(exportDir);
  await exportFinancials(exportDir);

  console.log("Seed exports created in seed-exports/");
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
