import { PrismaClient } from "@prisma/client";
import fs from "node:fs/promises";
import path from "node:path";

const prisma = new PrismaClient();

type HelpExport = {
  categories: Array<any>;
  topics: Array<any>;
  revisions: Array<any>;
  intents: Array<any>;
  examples: Array<any>;
};

type BlogExport = {
  categories: Array<any>;
  posts: Array<any>;
  comments: Array<any>;
  views: Array<any>;
};

type FinancialExport = {
  transactions: Array<any>;
  transactionHistory: Array<any>;
  tokenTransactions: Array<any>;
  fundingHistory: Array<any>;
  withdrawalHistory: Array<any>;
  pendingPayments: Array<any>;
};

const parseJson = async <T>(filePath: string): Promise<T> => {
  const raw = await fs.readFile(filePath, "utf8");
  return JSON.parse(raw) as T;
};

const importHelp = async (exportDir: string) => {
  const help = await parseJson<HelpExport>(path.join(exportDir, "help.json"));

  if (help.categories.length) {
    await prisma.helpCategory.createMany({ data: help.categories, skipDuplicates: true });
  }
  if (help.topics.length) {
    await prisma.helpTopic.createMany({ data: help.topics, skipDuplicates: true });
  }
  if (help.revisions.length) {
    await prisma.helpRevision.createMany({ data: help.revisions, skipDuplicates: true });
  }
  if (help.intents.length) {
    await prisma.helpBotIntent.createMany({ data: help.intents, skipDuplicates: true });
  }
  if (help.examples.length) {
    await prisma.helpBotTrainingExample.createMany({ data: help.examples, skipDuplicates: true });
  }
};

const importBlog = async (exportDir: string) => {
  const blog = await parseJson<BlogExport>(path.join(exportDir, "blog.json"));

  if (blog.categories.length) {
    await prisma.blogCategory.createMany({ data: blog.categories, skipDuplicates: true });
  }
  if (blog.posts.length) {
    await prisma.blogPost.createMany({ data: blog.posts, skipDuplicates: true });
  }
  if (blog.comments.length) {
    await prisma.blogComment.createMany({ data: blog.comments, skipDuplicates: true });
  }
  if (blog.views.length) {
    await prisma.blogView.createMany({ data: blog.views, skipDuplicates: true });
  }
};

const importFinancials = async (exportDir: string) => {
  const financials = await parseJson<FinancialExport>(path.join(exportDir, "financials.json"));

  if (financials.transactions.length) {
    await prisma.transaction.createMany({ data: financials.transactions, skipDuplicates: true });
  }
  if (financials.transactionHistory.length) {
    await prisma.transactionHistory.createMany({ data: financials.transactionHistory, skipDuplicates: true });
  }
  if (financials.tokenTransactions.length) {
    await prisma.tokenTransaction.createMany({ data: financials.tokenTransactions, skipDuplicates: true });
  }
  if (financials.fundingHistory.length) {
    await prisma.fundingHistory.createMany({ data: financials.fundingHistory, skipDuplicates: true });
  }
  if (financials.withdrawalHistory.length) {
    await prisma.withdrawalHistory.createMany({ data: financials.withdrawalHistory, skipDuplicates: true });
  }
  if (financials.pendingPayments.length) {
    await prisma.pendingPayment.createMany({ data: financials.pendingPayments, skipDuplicates: true });
  }
};

async function main() {
  const exportDir = path.resolve(process.cwd(), "seed-exports");
  await importHelp(exportDir);
  await importBlog(exportDir);
  await importFinancials(exportDir);
  console.log("Seed import completed.");
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
