import { appRouter } from "@/server/trpc/router/_app";
import { prisma } from "@/lib/prisma";

async function main() {
  const ctx: any = {
    session: { user: { id: "admin-smoke", role: "admin", email: "admin@local" } },
    prisma,
  };

  const caller = appRouter.createCaller(ctx);

  console.log("[SMOKE] Admin Activity — baseline 5 records");
  const baseline = await caller.admin.getRecentActivity({ limit: 5 });
  console.log(JSON.stringify({ count: baseline.items.length, nextCursor: baseline.nextCursor }, null, 2));
  baseline.items.slice(0, 3).forEach((row: any, i: number) => {
    console.log(`[${i}] ${row.createdAt} | ${row.action} | ${row.entity}#${row.entityId} | ${row.status}`);
  });

  console.log("\n[SMOKE] Filter by action=UPDATE_USER and date range (last 7 days)");
  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const filtered = await caller.admin.getRecentActivity({
    limit: 5,
    action: "UPDATE_USER",
    dateFrom: sevenDaysAgo.toISOString(),
    dateTo: now.toISOString(),
  });
  console.log(JSON.stringify({ count: filtered.items.length, nextCursor: filtered.nextCursor }, null, 2));
  filtered.items.slice(0, 3).forEach((row: any, i: number) => {
    console.log(`[${i}] ${row.createdAt} | ${row.action} | ${row.entity}#${row.entityId} | ${row.status}`);
  });

  if (filtered.nextCursor) {
    console.log("\n[SMOKE] Load more with cursor");
    const more = await caller.admin.getRecentActivity({
      limit: 5,
      cursor: filtered.nextCursor,
      action: "UPDATE_USER",
      dateFrom: sevenDaysAgo.toISOString(),
      dateTo: now.toISOString(),
    });
    console.log(JSON.stringify({ count: more.items.length, nextCursor: more.nextCursor }, null, 2));
  }
}

main().catch((err) => {
  console.error("[SMOKE] Admin Activity failed:", err);
  process.exit(1);
});
