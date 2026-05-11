import { describe, it } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const globalSearchSource = fs.readFileSync(
  path.resolve(process.cwd(), "components/admin/GlobalSearch.tsx"),
  "utf8",
);
const usersPageSource = fs.readFileSync(
  path.resolve(process.cwd(), "app/admin/users/page.tsx"),
  "utf8",
);
const paymentsPageSource = fs.readFileSync(
  path.resolve(process.cwd(), "app/admin/payments/page.tsx"),
  "utf8",
);
const packagesPageSource = fs.readFileSync(
  path.resolve(process.cwd(), "app/admin/packages/page.tsx"),
  "utf8",
);
const adminRouterSource = fs.readFileSync(
  path.resolve(process.cwd(), "server/trpc/router/admin.ts"),
  "utf8",
);
const packageAnalyticsSource = fs.readFileSync(
  path.resolve(process.cwd(), "components/admin/PackageAnalytics.tsx"),
  "utf8",
);

describe("Admin global search behavior", () => {
  it("supports keyboard-open, debounced search, and grouped entity results", () => {
    assert.match(globalSearchSource, /if \(\(e\.metaKey \|\| e\.ctrlKey\) && e\.key === "k"\)/);
    assert.match(globalSearchSource, /setTimeout\(\(\) => setDebounced\(query\.trim\(\)\), 250\)/);
    assert.match(globalSearchSource, /api\.admin\.globalSearch\.useQuery\(/);
    assert.match(globalSearchSource, /results\?\.users\.forEach/);
    assert.match(globalSearchSource, /results\?\.payments\.forEach/);
    assert.match(globalSearchSource, /results\?\.packages\.forEach/);
    assert.match(globalSearchSource, /handleArrowNavigation/);
  });

  it("routes selected search results into admin pages that hydrate from the search query param", () => {
    assert.match(globalSearchSource, /\/admin\/users\?search=/);
    assert.match(globalSearchSource, /\/admin\/payments\?search=/);
    assert.match(globalSearchSource, /\/admin\/packages\?search=/);

    assert.match(usersPageSource, /const urlSearch = searchParams\.get\("search"\) \?\? "";/);
    assert.match(usersPageSource, /const \[search, setSearch\] = useState\(urlSearch\);/);
    assert.match(paymentsPageSource, /const urlSearch = searchParams\.get\("search"\) \?\? "";/);
    assert.match(paymentsPageSource, /const \[search, setSearch\] = useState\(urlSearch\);/);
    assert.match(packagesPageSource, /const urlSearch = searchParams\.get\("search"\) \?\? "";/);
    assert.match(packagesPageSource, /const \[search, setSearch\] = useState\(urlSearch\);/);
  });

  it("queries users, payments, and packages through one adminProcedure backend endpoint", () => {
    assert.match(adminRouterSource, /globalSearch: adminProcedure/);
    assert.match(adminRouterSource, /if \(term\.length < 2\) \{\s*return \{ users: \[], payments: \[], packages: \[] \};/);
    assert.match(adminRouterSource, /const \[users, payments, packages\] = await Promise\.all\(\[/);
    assert.match(adminRouterSource, /prisma\.user\.findMany\(/);
    assert.match(adminRouterSource, /prisma\.transaction\.findMany\(/);
    assert.match(adminRouterSource, /prisma\.membershipPackage\.findMany\(/);
  });
});

describe("Package analytics live data", () => {
  it("computes subscriber counts and growth windows from real membership data", () => {
    assert.match(adminRouterSource, /getPackageById: adminProcedure/);
    assert.match(adminRouterSource, /const \[\s*activeSubscriptions,\s*currentWindowActivations,\s*previousWindowActivations,\s*subscribers,\s*\] = await prisma\.\$transaction\(\[/);
    assert.match(adminRouterSource, /activeMembershipPackageId: input\.packageId/);
    assert.match(adminRouterSource, /membershipActivatedAt: \{ gte: currentWindowStart \}/);
    assert.match(adminRouterSource, /membershipActivatedAt: \{\s*gte: previousWindowStart,\s*lt: currentWindowStart,/);
    assert.match(adminRouterSource, /const subscriberGrowthRate =\s*previousWindowActivations > 0/);
    assert.match(adminRouterSource, /const totalRevenue = activeSubscriptions \* \(pkg\.price \+ pkg\.vat\);/);
  });

  it("renders live analytics metrics and avoids fake growth placeholders", () => {
    assert.match(packageAnalyticsSource, /api\.admin\.getPackageById\.useQuery\(/);
    assert.match(packageAnalyticsSource, /const growthRate = \(pkg as any\)\?\.analytics\?\.subscriberGrowthRate;/);
    assert.match(packageAnalyticsSource, /currentWindowActivations/);
    assert.match(packageAnalyticsSource, /previousWindowActivations/);
    assert.match(packageAnalyticsSource, /No prior \$\{growthWindowDays\}-day baseline yet/);
    assert.match(packageAnalyticsSource, /No activation trend captured yet/);
    assert.doesNotMatch(packageAnalyticsSource, /mock|placeholder|sample growth|demo growth/i);
  });
});