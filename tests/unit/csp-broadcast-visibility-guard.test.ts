import { describe, it } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import {
  getCspBroadcastHiddenReason,
  isCspBroadcastVisible,
} from "@/lib/csp/broadcastVisibility";

const cspRouterSource = fs.readFileSync(
  path.resolve(process.cwd(), "server/trpc/router/csp.ts"),
  "utf8",
);

const dashboardSource = fs.readFileSync(
  path.resolve(process.cwd(), "components/csp/CspDashboard.tsx"),
  "utf8",
);

const adminPageSource = fs.readFileSync(
  path.resolve(process.cwd(), "app/admin/csp/page.tsx"),
  "utf8",
);

const notificationServiceSource = fs.readFileSync(
  path.resolve(process.cwd(), "server/services/notification.service.ts"),
  "utf8",
);

describe("CSP broadcast visibility guard", () => {
  it("auto-closes expired non-default broadcasts before listing", () => {
    assert.match(cspRouterSource, /prisma\.cspSupportRequest\.updateMany\(/);
    assert.match(cspRouterSource, /isAdminDefault:\s*false/);
    assert.match(cspRouterSource, /status:\s*"broadcasting"/);
    assert.match(cspRouterSource, /broadcastExpiresAt:\s*\{\s*lt:\s*now\s*\}/);
    assert.match(cspRouterSource, /data:\s*\{\s*status:\s*"closed"\s*\}/);
  });

  it("only returns currently active broadcasts for user feed visibility", () => {
    assert.match(cspRouterSource, /isActive:\s*true/);
    assert.match(cspRouterSource, /isAdminDefault:\s*false,[\s\S]*status:\s*"broadcasting",[\s\S]*broadcastExpiresAt:\s*\{\s*gt:\s*now\s*\}/);
    assert.match(cspRouterSource, /isAdminDefault:\s*true,[\s\S]*isActive:\s*true,[\s\S]*status:\s*"broadcasting"/);
  });

  it("classifies hidden reasons and visibility consistently for stale feed protection", () => {
    const now = new Date("2026-05-19T10:00:00.000Z");

    assert.equal(
      getCspBroadcastHiddenReason({
        isActive: true,
        status: "broadcasting",
        isAdminDefault: false,
        broadcastExpiresAt: "2026-05-19T12:00:00.000Z",
      }, now),
      null,
    );

    assert.equal(
      getCspBroadcastHiddenReason({
        isActive: false,
        status: "broadcasting",
        isAdminDefault: true,
        broadcastExpiresAt: null,
      }, now),
      "inactive",
    );

    assert.equal(
      getCspBroadcastHiddenReason({
        isActive: true,
        status: "closed",
        isAdminDefault: true,
        broadcastExpiresAt: null,
      }, now),
      "not_broadcasting",
    );

    assert.equal(
      getCspBroadcastHiddenReason({
        isActive: true,
        status: "broadcasting",
        isAdminDefault: false,
        broadcastExpiresAt: null,
      }, now),
      "missing_expiry",
    );

    assert.equal(
      getCspBroadcastHiddenReason({
        isActive: true,
        status: "broadcasting",
        isAdminDefault: false,
        broadcastExpiresAt: "2026-05-19T09:00:00.000Z",
      }, now),
      "expired",
    );

    assert.equal(
      isCspBroadcastVisible({
        isActive: true,
        status: "broadcasting",
        isAdminDefault: true,
        broadcastExpiresAt: null,
      }, now),
      true,
    );
  });

  it("tightens dashboard refresh behavior and filters stale cached broadcasts on the client", () => {
    assert.match(dashboardSource, /isCspBroadcastVisible/);
    assert.match(dashboardSource, /refetchOnWindowFocus:\s*true/);
    assert.match(dashboardSource, /refetchInterval:\s*15\s*\*\s*1000/);
    assert.match(dashboardSource, /broadcasts\.filter\(\(broadcast\) => isCspBroadcastVisible\(broadcast, now\)\)/);
    assert.match(dashboardSource, /if \(broadcasts\.length > visibleBroadcasts\.length\) \{/);
  });

  it("invalidates user broadcast queries after admin-side status transitions", () => {
    assert.match(adminPageSource, /const utils = api\.useUtils\(\);/);
    assert.match(adminPageSource, /utils\.csp\.listBroadcasts\.invalidate\(\)/);
    assert.match(adminPageSource, /utils\.csp\.getLiveStatus\.invalidate\(\)/);
  });

  it("exposes admin diagnostics API for hidden broadcast reasons", () => {
    assert.match(cspRouterSource, /getBroadcastVisibilityDiagnostics:\s*protectedProcedure/);
    assert.match(cspRouterSource, /hiddenReasonCounts/);
    assert.match(cspRouterSource, /getCspBroadcastHiddenReason/);
    assert.match(cspRouterSource, /isCspBroadcastVisible/);
  });

  it("renders admin visibility diagnostics panel with hidden reason summary", () => {
    assert.match(adminPageSource, /getBroadcastVisibilityDiagnostics\.useQuery/);
    assert.match(adminPageSource, /Broadcast visibility diagnostics/);
    assert.match(adminPageSource, /Refresh diagnostics/);
    assert.match(adminPageSource, /Hidden from feed/);
  });

  it("sends CSP lifecycle emails and exposes processed lifecycle notification types", () => {
    assert.match(notificationServiceSource, /sendCspLifecycleEmail/);
    assert.match(notificationServiceSource, /CSP_BROADCAST_COMPLETED/);
    assert.match(notificationServiceSource, /CSP_REQUEST_PROCESSED/);
    assert.match(notificationServiceSource, /title: "CSP: Request received"/);
    assert.match(notificationServiceSource, /title: "CSP: Request processed"/);
  });

  it("exposes a CSP communication feed and consumes it in the dashboard", () => {
    assert.match(cspRouterSource, /getCommunicationFeed:\s*protectedProcedure/);
    assert.match(cspRouterSource, /title: \{ startsWith: "CSP:" \}/);
    assert.match(dashboardSource, /api\.csp\.getCommunicationFeed\.useQuery/);
    assert.match(dashboardSource, /Communication history/);
    assert.doesNotMatch(dashboardSource, /Qualification notice/);
    assert.doesNotMatch(dashboardSource, /Approval \+ broadcast/);
  });
});
