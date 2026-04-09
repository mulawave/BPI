/**
 * Access Control Tests: Rank Hierarchy & Package-Level Gating
 *
 * Tests the promotional materials access control logic, rank ordering,
 * and package-price-based filtering used across the app.
 */
import { describe, it } from "node:test";
import assert from "node:assert";

// ---------------------------------------------------------------------------
// Rank Hierarchy
// Mirrors: server/trpc/router/promotionalMaterials.ts RANK_ORDER
// ---------------------------------------------------------------------------

const RANK_ORDER = [
  "Newbie",
  "Bronze",
  "Silver",
  "Gold",
  "Platinum",
  "Diamond",
  "Ambassador",
] as const;

type Rank = (typeof RANK_ORDER)[number];

function rankIndex(rank: string): number {
  return RANK_ORDER.indexOf(rank as Rank);
}

function meetsMinRank(userRank: string, minRank: string): boolean {
  const userIdx = rankIndex(userRank);
  const minIdx = rankIndex(minRank);
  if (minIdx < 0) return true; // unknown minRank, allow access
  if (userIdx < 0) return false; // unknown user rank, deny
  return userIdx >= minIdx;
}

describe("Rank hierarchy", () => {
  it("ranks are in ascending order", () => {
    for (let i = 0; i < RANK_ORDER.length - 1; i++) {
      assert.ok(
        rankIndex(RANK_ORDER[i]) < rankIndex(RANK_ORDER[i + 1]),
        `${RANK_ORDER[i]} should be lower than ${RANK_ORDER[i + 1]}`
      );
    }
  });

  it("Newbie is the lowest rank", () => {
    assert.strictEqual(rankIndex("Newbie"), 0);
  });

  it("Ambassador is the highest rank", () => {
    assert.strictEqual(rankIndex("Ambassador"), RANK_ORDER.length - 1);
  });

  it("unknown rank returns -1", () => {
    assert.strictEqual(rankIndex("Unknown"), -1);
  });
});

describe("Minimum rank check", () => {
  it("Gold meets minimum of Bronze", () => {
    assert.strictEqual(meetsMinRank("Gold", "Bronze"), true);
  });

  it("Bronze does NOT meet minimum of Gold", () => {
    assert.strictEqual(meetsMinRank("Bronze", "Gold"), false);
  });

  it("same rank meets the requirement", () => {
    assert.strictEqual(meetsMinRank("Silver", "Silver"), true);
  });

  it("Newbie does not meet any rank above Newbie", () => {
    assert.strictEqual(meetsMinRank("Newbie", "Bronze"), false);
  });

  it("Ambassador meets all minimum ranks", () => {
    for (const rank of RANK_ORDER) {
      assert.strictEqual(
        meetsMinRank("Ambassador", rank),
        true,
        `Ambassador should meet min rank ${rank}`
      );
    }
  });

  it("unknown minRank allows access (graceful)", () => {
    assert.strictEqual(meetsMinRank("Newbie", "UnknownRank"), true);
  });

  it("unknown user rank denies access", () => {
    assert.strictEqual(meetsMinRank("UnknownRank", "Bronze"), false);
  });
});

// ---------------------------------------------------------------------------
// Package-Price-Based Access Control
// Mirrors: promotionalMaterials.ts minPackageLevel resolution
// ---------------------------------------------------------------------------

interface Material {
  id: string;
  title: string;
  minRank: string | null;
  minPackageLevel: string | null;
}

function filterAccessibleMaterials(
  materials: Material[],
  userRank: string,
  userPackagePrice: number,
  packagePrices: Record<string, number>
): Material[] {
  return materials.filter((m) => {
    // Check rank
    if (m.minRank) {
      if (!meetsMinRank(userRank, m.minRank)) return false;
    }
    // Check package price
    if (m.minPackageLevel) {
      const requiredPrice = packagePrices[m.minPackageLevel] ?? 0;
      if (userPackagePrice < requiredPrice) return false;
    }
    return true;
  });
}

describe("Material access filtering", () => {
  const materials: Material[] = [
    { id: "1", title: "Basic Flyer", minRank: null, minPackageLevel: null },
    { id: "2", title: "Silver Banner", minRank: "Silver", minPackageLevel: null },
    { id: "3", title: "Gold Video", minRank: "Gold", minPackageLevel: null },
    { id: "4", title: "Premium Kit", minRank: null, minPackageLevel: "Diamond Package" },
    { id: "5", title: "Elite Resource", minRank: "Gold", minPackageLevel: "Gold Package" },
  ];

  const packagePrices: Record<string, number> = {
    "Bronze Package": 5000,
    "Silver Package": 15000,
    "Gold Package": 40000,
    "Diamond Package": 100000,
  };

  it("Newbie with no package sees only unrestricted materials", () => {
    const result = filterAccessibleMaterials(materials, "Newbie", 0, packagePrices);
    assert.strictEqual(result.length, 1);
    assert.strictEqual(result[0].title, "Basic Flyer");
  });

  it("Silver user with Silver package sees rank-appropriate materials", () => {
    const result = filterAccessibleMaterials(materials, "Silver", 15000, packagePrices);
    // Basic Flyer (no restriction), Silver Banner (Silver rank met)
    assert.strictEqual(result.length, 2);
    assert.ok(result.some((m) => m.title === "Basic Flyer"));
    assert.ok(result.some((m) => m.title === "Silver Banner"));
  });

  it("Gold user with Gold package sees appropriately gated materials", () => {
    const result = filterAccessibleMaterials(materials, "Gold", 40000, packagePrices);
    // Basic Flyer, Silver Banner, Gold Video, Elite Resource (Gold rank + Gold pkg price)
    assert.strictEqual(result.length, 4);
    assert.ok(!result.some((m) => m.title === "Premium Kit")); // need Diamond price
  });

  it("Ambassador with Diamond package sees everything", () => {
    const result = filterAccessibleMaterials(materials, "Ambassador", 100000, packagePrices);
    assert.strictEqual(result.length, 5);
  });

  it("high rank but low package is still gated by package price", () => {
    const result = filterAccessibleMaterials(materials, "Ambassador", 5000, packagePrices);
    // Ambassador rank passes all rank checks, but package price blocks Premium Kit and Elite Resource
    assert.ok(!result.some((m) => m.title === "Premium Kit"));
    assert.ok(!result.some((m) => m.title === "Elite Resource"));
  });

  it("high package but low rank is still gated by rank", () => {
    const result = filterAccessibleMaterials(materials, "Newbie", 100000, packagePrices);
    // Has Diamond-level package but Newbie rank blocks Silver Banner, Gold Video, Elite Resource
    assert.ok(!result.some((m) => m.title === "Silver Banner"));
    assert.ok(!result.some((m) => m.title === "Gold Video"));
    assert.ok(!result.some((m) => m.title === "Elite Resource"));
    // But Premium Kit (no rank requirement, package price met) should pass
    assert.ok(result.some((m) => m.title === "Premium Kit"));
  });
});

// ---------------------------------------------------------------------------
// Leadership Pool Qualification Logic
// Mirrors: server/trpc/router/leadership.ts qualification criteria
// ---------------------------------------------------------------------------

interface QualificationCheck {
  option: 1 | 2;
  directSponsors?: number;
  firstGenTeam?: number;
  secondGenTeam?: number;
}

function isQualifiedForLeadershipPool(check: QualificationCheck): boolean {
  if (check.option === 1) {
    // Option 1: 70 regular plus direct sponsors
    return (check.directSponsors ?? 0) >= 70;
  }
  if (check.option === 2) {
    // Option 2: 50 first-gen + 50 second-gen team members
    return (check.firstGenTeam ?? 0) >= 50 && (check.secondGenTeam ?? 0) >= 50;
  }
  return false;
}

describe("Leadership pool qualification", () => {
  it("qualifies via Option 1 with 70+ direct sponsors", () => {
    assert.strictEqual(
      isQualifiedForLeadershipPool({ option: 1, directSponsors: 70 }),
      true
    );
  });

  it("fails Option 1 with fewer than 70 direct sponsors", () => {
    assert.strictEqual(
      isQualifiedForLeadershipPool({ option: 1, directSponsors: 69 }),
      false
    );
  });

  it("qualifies via Option 2 with 50 first-gen + 50 second-gen", () => {
    assert.strictEqual(
      isQualifiedForLeadershipPool({ option: 2, firstGenTeam: 50, secondGenTeam: 50 }),
      true
    );
  });

  it("fails Option 2 when first-gen is below 50", () => {
    assert.strictEqual(
      isQualifiedForLeadershipPool({ option: 2, firstGenTeam: 49, secondGenTeam: 60 }),
      false
    );
  });

  it("fails Option 2 when second-gen is below 50", () => {
    assert.strictEqual(
      isQualifiedForLeadershipPool({ option: 2, firstGenTeam: 60, secondGenTeam: 49 }),
      false
    );
  });
});
