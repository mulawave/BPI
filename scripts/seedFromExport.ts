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
  console.log("Importing help data...");
  const help = await parseJson<HelpExport>(path.join(exportDir, "help.json"));

  if (help.categories.length) {
    console.log(`  Importing ${help.categories.length} help categories...`);
    await prisma.helpCategory.createMany({ data: help.categories, skipDuplicates: true });
    console.log("  ✓ Help categories imported");
  }
  if (help.topics.length) {
    console.log(`  Importing ${help.topics.length} help topics...`);
    await prisma.helpTopic.createMany({ data: help.topics, skipDuplicates: true });
    console.log("  ✓ Help topics imported");
  }
  if (help.revisions.length) {
    console.log(`  Importing ${help.revisions.length} help revisions...`);
    await prisma.helpRevision.createMany({ data: help.revisions, skipDuplicates: true });
    console.log("  ✓ Help revisions imported");
  }
  if (help.intents.length) {
    console.log(`  Importing ${help.intents.length} help bot intents...`);
    await prisma.helpBotIntent.createMany({ data: help.intents, skipDuplicates: true });
    console.log("  ✓ Help bot intents imported");
  }
  if (help.examples.length) {
    console.log(`  Importing ${help.examples.length} help bot training examples...`);
    await prisma.helpBotTrainingExample.createMany({ data: help.examples, skipDuplicates: true });
    console.log("  ✓ Help bot training examples imported");
  }
  console.log("✓ Help data import complete\n");
};

const importBlog = async (exportDir: string) => {
  console.log("Importing blog data...");
  const blog = await parseJson<BlogExport>(path.join(exportDir, "blog.json"));

  if (blog.categories.length) {
    console.log(`  Importing ${blog.categories.length} blog categories...`);
    await prisma.blogCategory.createMany({ data: blog.categories, skipDuplicates: true });
    console.log("  ✓ Blog categories imported");
  }
  if (blog.posts.length) {
    console.log(`  Importing ${blog.posts.length} blog posts...`);
    await prisma.blogPost.createMany({ data: blog.posts, skipDuplicates: true });
    console.log("  ✓ Blog posts imported");
  }
  if (blog.comments.length) {
    console.log(`  Importing ${blog.comments.length} blog comments...`);
    await prisma.blogComment.createMany({ data: blog.comments, skipDuplicates: true });
    console.log("  ✓ Blog comments imported");
  }
  if (blog.views.length) {
    console.log(`  Importing ${blog.views.length} blog views...`);
    await prisma.blogView.createMany({ data: blog.views, skipDuplicates: true });
    console.log("  ✓ Blog views imported");
  }
  console.log("✓ Blog data import complete\n");
};

const importFinancials = async (exportDir: string) => {
  console.log("Importing financial data...");
  const financials = await parseJson<FinancialExport>(path.join(exportDir, "financials.json"));

  if (financials.transactions.length) {
    console.log(`  Importing ${financials.transactions.length} transactions...`);
    await prisma.transaction.createMany({ data: financials.transactions, skipDuplicates: true });
    console.log("  ✓ Transactions imported");
  }
  if (financials.transactionHistory.length) {
    console.log(`  Importing ${financials.transactionHistory.length} transaction history records...`);
    await prisma.transactionHistory.createMany({ data: financials.transactionHistory, skipDuplicates: true });
    console.log("  ✓ Transaction history imported");
  }
  if (financials.tokenTransactions.length) {
    console.log(`  Importing ${financials.tokenTransactions.length} token transactions...`);
    await prisma.tokenTransaction.createMany({ data: financials.tokenTransactions, skipDuplicates: true });
    console.log("  ✓ Token transactions imported");
  }
  if (financials.fundingHistory.length) {
    console.log(`  Importing ${financials.fundingHistory.length} funding history records...`);
    await prisma.fundingHistory.createMany({ data: financials.fundingHistory, skipDuplicates: true });
    console.log("  ✓ Funding history imported");
  }
  if (financials.withdrawalHistory.length) {
    console.log(`  Importing ${financials.withdrawalHistory.length} withdrawal history records...`);
    await prisma.withdrawalHistory.createMany({ data: financials.withdrawalHistory, skipDuplicates: true });
    console.log("  ✓ Withdrawal history imported");
  }
  if (financials.pendingPayments.length) {
    console.log(`  Importing ${financials.pendingPayments.length} pending payments...`);
    await prisma.pendingPayment.createMany({ data: financials.pendingPayments, skipDuplicates: true });
    console.log("  ✓ Pending payments imported");
  }
  console.log("✓ Financial data import complete\n");
};

async function main() {
  try {
    console.log("Starting seed import from seed-exports/...\n");
    const exportDir = path.resolve(process.cwd(), "seed-exports");
    
    await importHelp(exportDir);
    await importBlog(exportDir);
    await importFinancials(exportDir);
    
    console.log("✅ All seed imports completed successfully!");
  } catch (error) {
    console.error("❌ Seed import failed:");
    console.error(error);
    throw error;
  }
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
