/**
 * Dashboard live-data and non-demo-state regression tests
 *
 * These tests lock the current dashboard and community-updates implementation
 * against reintroducing visible demo placeholders or disconnecting live update
 * counts from the dashboard surface.
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const dashboardSource = fs.readFileSync(
  path.resolve(process.cwd(), "components/DashboardContent.tsx"),
  "utf8",
);

const communityUpdatesSource = fs.readFileSync(
  path.resolve(process.cwd(), "server/trpc/router/communityUpdates.ts"),
  "utf8",
);

function resolvePendingCommunityItemsCount(
  summary: { pendingPlatforms?: number } | null | undefined,
  unreadUpdatesCount: number | null | undefined,
) {
  return (summary?.pendingPlatforms || 0) + (unreadUpdatesCount || 0);
}

function isLatestUpdatesEnabled(featureToggles: { enableLatestUpdates?: boolean } | null | undefined) {
  return featureToggles?.enableLatestUpdates === true || featureToggles?.enableLatestUpdates === undefined;
}

describe("Dashboard live-data guards", () => {
  it("computes the community badge from live pending platforms and unread updates", () => {
    assert.strictEqual(resolvePendingCommunityItemsCount({ pendingPlatforms: 3 }, 2), 5);
    assert.strictEqual(resolvePendingCommunityItemsCount({ pendingPlatforms: 3 }, 0), 3);
    assert.strictEqual(resolvePendingCommunityItemsCount(undefined, 4), 4);
    assert.strictEqual(resolvePendingCommunityItemsCount(undefined, undefined), 0);
  });

  it("keeps the latest updates card enabled by default unless explicitly disabled", () => {
    assert.strictEqual(isLatestUpdatesEnabled(undefined), true);
    assert.strictEqual(isLatestUpdatesEnabled({}), true);
    assert.strictEqual(isLatestUpdatesEnabled({ enableLatestUpdates: true }), true);
    assert.strictEqual(isLatestUpdatesEnabled({ enableLatestUpdates: false }), false);
  });

  it("reads unread update counts from the live community updates query", () => {
    assert.match(
      dashboardSource,
      /api\.communityUpdates\.getUnreadCount\.useQuery\(\)/,
    );
    assert.match(
      dashboardSource,
      /const pendingCommunityItemsCount = \(summary\?\.pendingPlatforms \|\| 0\) \+ \(unreadUpdatesCount \|\| 0\);/,
    );
  });

  it("keeps legacy mock countdown cards hidden behind hard false guards", () => {
    assert.match(dashboardSource, /\{false && \(/);
    assert.match(dashboardSource, /Student Palliative/);
    assert.match(dashboardSource, /BPI Ticket/);
    assert.match(dashboardSource, /Mock countdown - 7 days remaining/);
    assert.match(dashboardSource, /Mock countdown - 15 days remaining/);
  });
});

describe("Community updates live-source guards", () => {
  it("queries active, non-expired updates from Prisma instead of seeded placeholders", () => {
    assert.match(communityUpdatesSource, /prisma\.communityUpdate\.findMany\(/);
    assert.match(communityUpdatesSource, /isActive: true/);
    assert.match(communityUpdatesSource, /expiresAt: \{ gte: new Date\(\) \}/);
  });

  it("tracks unread counts and read state from persisted update records", () => {
    assert.match(communityUpdatesSource, /prisma\.communityUpdate\.count\(/);
    assert.match(communityUpdatesSource, /prisma\.updateRead\.upsert\(/);
    assert.match(communityUpdatesSource, /isRead: update\.UpdateRead\.length > 0/);
  });
});