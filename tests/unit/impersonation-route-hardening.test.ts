import { describe, it } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

import {
  impersonationCreationLimiter,
  impersonationGlobalRouteLimiter,
  impersonationRouteLimiter,
} from "@/lib/rateLimit";

const impersonateRouteSource = fs.readFileSync(
  path.resolve(process.cwd(), "app/api/auth/impersonate/route.ts"),
  "utf8",
);
const impersonationEndRouteSource = fs.readFileSync(
  path.resolve(process.cwd(), "app/api/auth/impersonate/end/route.ts"),
  "utf8",
);
const adminRouterSource = fs.readFileSync(
  path.resolve(process.cwd(), "server/trpc/router/admin.ts"),
  "utf8",
);
const authSource = fs.readFileSync(
  path.resolve(process.cwd(), "server/auth.ts"),
  "utf8",
);
const bannerSource = fs.readFileSync(
  path.resolve(process.cwd(), "components/admin/ImpersonationBanner.tsx"),
  "utf8",
);

describe("Impersonation route hardening", () => {
  it("enforces the per-token and global impersonation execution limits", () => {
    const tokenKey = "198.51.100.10:token-123";
    impersonationRouteLimiter.reset(tokenKey);
    for (let attempt = 0; attempt < 8; attempt += 1) {
      assert.equal(impersonationRouteLimiter.check(tokenKey).success, true);
    }
    const blockedTokenAttempt = impersonationRouteLimiter.check(tokenKey);
    assert.equal(blockedTokenAttempt.success, false);
    assert.ok(blockedTokenAttempt.retryAfterMs > 0);
    impersonationRouteLimiter.reset(tokenKey);

    const ipKey = "198.51.100.20";
    impersonationGlobalRouteLimiter.reset(ipKey);
    for (let attempt = 0; attempt < 20; attempt += 1) {
      assert.equal(impersonationGlobalRouteLimiter.check(ipKey).success, true);
    }
    const blockedIpAttempt = impersonationGlobalRouteLimiter.check(ipKey);
    assert.equal(blockedIpAttempt.success, false);
    assert.ok(blockedIpAttempt.retryAfterMs > 0);
    impersonationGlobalRouteLimiter.reset(ipKey);
  });

  it("throttles impersonation token creation per admin", () => {
    const adminKey = "admin-123";
    impersonationCreationLimiter.reset(adminKey);
    for (let attempt = 0; attempt < 5; attempt += 1) {
      assert.equal(impersonationCreationLimiter.check(adminKey).success, true);
    }
    const blockedCreateAttempt = impersonationCreationLimiter.check(adminKey);
    assert.equal(blockedCreateAttempt.success, false);
    assert.ok(blockedCreateAttempt.retryAfterMs > 0);
    impersonationCreationLimiter.reset(adminKey);
  });

  it("checks throttles, role guards, one-time token consumption, and audit events in the execute route", () => {
    assert.match(
      impersonateRouteSource,
      /const globalRateLimit = impersonationGlobalRouteLimiter\.check\(ip\);/,
    );
    assert.match(
      impersonateRouteSource,
      /const rateLimit = impersonationRouteLimiter\.check\(limiterKey\);/,
    );
    assert.match(
      impersonateRouteSource,
      /sessionUser\.id !== impToken\.adminId[\s\S]*?impToken\.Admin\.role !== "super_admin"/,
    );
    assert.match(
      impersonateRouteSource,
      /if \(impToken\.TargetUser\.role === "admin" \|\| impToken\.TargetUser\.role === "super_admin"\)/,
    );
    assert.match(
      impersonateRouteSource,
      /const tokenConsumed = await prisma\.impersonationToken\.updateMany\([\s\S]*?used: false,[\s\S]*?expiresAt: \{ gt: now \}/,
    );
    assert.match(
      impersonateRouteSource,
      /action: "ADMIN_IMPERSONATION_BLOCKED"/,
    );
    assert.match(
      impersonateRouteSource,
      /action: "ADMIN_IMPERSONATION_LOGIN"/,
    );
    assert.match(
      adminRouterSource,
      /const rateLimit = impersonationCreationLimiter\.check\(adminId\);/,
    );
    assert.match(
      adminRouterSource,
      /action: "ADMIN_IMPERSONATION_ISSUED"/,
    );
  });

  it("restores the original session and audits impersonation termination", () => {
    assert.match(
      impersonateRouteSource,
      /response\.cookies\.set\(restoreTokenName, existingSessionToken, getSessionCookieOptions\(maxAge\)\);/,
    );
    assert.match(
      impersonateRouteSource,
      /response\.cookies\.set\(sessionTokenName, jwtToken, getSessionCookieOptions\(maxAge\)\);/,
    );
    assert.match(
      impersonationEndRouteSource,
      /const restoreToken = cookieStore\.get\(restoreTokenName\)\?\.value;/,
    );
    assert.match(
      impersonationEndRouteSource,
      /response\.cookies\.set\(sessionTokenName, restoreToken, getSessionCookieOptions\(4 \* 60 \* 60\)\);/,
    );
    assert.match(
      impersonationEndRouteSource,
      /response\.cookies\.set\(restoreTokenName, "", getSessionCookieOptions\(0\)\);/,
    );
    assert.match(
      impersonationEndRouteSource,
      /action: "ADMIN_IMPERSONATION_END"/,
    );
  });

  it("propagates impersonation session flags through auth callbacks and exposes the operator exit banner", () => {
    assert.match(
      authSource,
      /token as any\)\.isImpersonation = \(user as any\)\.isImpersonation \?\? \(token as any\)\.isImpersonation \?\? false/,
    );
    assert.match(
      authSource,
      /\(session\.user as any\)\.isImpersonation = \(token as any\)\.isImpersonation \?\? false;/,
    );
    assert.match(
      authSource,
      /\(session\.user as any\)\.impersonationSessionId = \(token as any\)\.impersonationSessionId \?\? null;/,
    );
    assert.match(
      bannerSource,
      /const isImpersonating = \(session as any\)\?\.user\?\.isImpersonation;/,
    );
    assert.match(
      bannerSource,
      /fetch\("\/api\/auth\/impersonate\/end", \{/,
    );
    assert.match(
      bannerSource,
      /if \(!isImpersonating\) return null;/,
    );
  });
});