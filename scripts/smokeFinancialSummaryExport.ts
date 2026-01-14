import { appRouter } from "@/server/trpc/router/_app";
import { prisma } from "@/lib/prisma";

async function main() {
  const ctx: any = {
    session: { user: { id: "admin-smoke", role: "admin", email: "admin@local" } },
    prisma,
  };

  const caller = appRouter.createCaller(ctx);
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const res = await caller.admin.exportFinancialSummaryToCSV({
    dateFrom: thirtyDaysAgo.toISOString(),
    dateTo: now.toISOString(),
  });

  console.log(JSON.stringify({ count: res.count, filename: res.filename, range: res.range }, null, 2));
  console.log("CSV sample (first 200 chars):\n", res.data.slice(0, 200));
}

main().catch((err) => {
  console.error("[SMOKE] Financial Summary Export failed:", err);
  process.exit(1);
});
