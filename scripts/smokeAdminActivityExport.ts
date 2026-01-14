import { appRouter } from "@/server/trpc/router/_app";
import { prisma } from "@/lib/prisma";

async function main() {
  const ctx: any = {
    session: { user: { id: "admin-smoke", role: "admin", email: "admin@local" } },
    prisma,
  };

  const caller = appRouter.createCaller(ctx);

  console.log("[SMOKE] Export Audit Logs to CSV — last 3 days, action=UPDATE_NOTIFICATION_SETTING");
  const now = new Date();
  const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);

  const res = await caller.admin.exportAuditLogsToCSV({
    filters: {
      action: "UPDATE_NOTIFICATION_SETTING",
      dateFrom: threeDaysAgo.toISOString(),
      dateTo: now.toISOString(),
    },
  });

  console.log(JSON.stringify({ count: res.count, filename: res.filename }, null, 2));
  console.log("CSV sample (first 200 chars):\n", res.data.slice(0, 200));
}

main().catch((err) => {
  console.error("[SMOKE] Export Audit Logs failed:", err);
  process.exit(1);
});
