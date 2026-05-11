import { describe, it } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import {
  executeReferralSync,
  prepareReferralSyncData,
} from "@/server/services/referralSync.service";

const adminRouterSource = fs.readFileSync(
  path.resolve(process.cwd(), "server/trpc/router/admin.ts"),
  "utf8",
);

type ReferralRecord = {
  id: string;
  referrerId: string;
  referredId: string;
  status: string;
  rewardPaid: boolean;
  createdAt: Date;
  updatedAt: Date;
};

type AuditLogRecord = {
  id: string;
  userId: string;
  action: string;
  entity: string;
  entityId: string;
  changes: string;
  status: string;
  createdAt: Date;
};

function createFakePrisma(seed?: {
  referrals?: ReferralRecord[];
  failOnCreateMany?: boolean;
}) {
  const state = {
    referrals: structuredClone(seed?.referrals ?? []),
    auditLogs: [] as AuditLogRecord[],
  };

  return {
    state,
    async $transaction<T>(callback: (tx: any) => Promise<T>) {
      const snapshot = structuredClone(state);

      const tx = {
        referral: {
          async deleteMany() {
            const count = state.referrals.length;
            state.referrals = [];
            return { count };
          },
          async createMany(args: { data: ReferralRecord[] }) {
            if (seed?.failOnCreateMany) {
              throw new Error("induced referral createMany failure");
            }

            state.referrals = structuredClone(args.data);
            return { count: args.data.length };
          },
        },
        auditLog: {
          async create(args: { data: AuditLogRecord }) {
            state.auditLogs.push(structuredClone(args.data));
            return structuredClone(args.data);
          },
        },
      };

      try {
        return await callback(tx);
      } catch (error) {
        state.referrals = snapshot.referrals;
        state.auditLogs = snapshot.auditLogs;
        throw error;
      }
    },
  };
}

const usersWithSponsors = [
  {
    id: "user-1",
    sponsorId: "sponsor-1",
    createdAt: new Date("2026-05-01T00:00:00.000Z"),
    activated: true,
  },
  {
    id: "user-2",
    sponsorId: "sponsor-2",
    createdAt: new Date("2026-05-02T00:00:00.000Z"),
    activated: false,
  },
  {
    id: "user-3",
    sponsorId: "user-3",
    createdAt: new Date("2026-05-03T00:00:00.000Z"),
    activated: true,
  },
];

describe("Referral sync atomicity", () => {
  it("routes admin syncReferralData through the shared executor", () => {
    assert.match(adminRouterSource, /syncReferralData:[\s\S]*return executeReferralSync\(/);
  });

  it("builds a deduplicated referral rebuild set and records validation errors", () => {
    const result = prepareReferralSyncData({
      usersWithSponsors,
      validSponsorIds: new Set(["sponsor-1", "sponsor-2"]),
      now: new Date("2026-05-11T00:00:00.000Z"),
      deps: {
        createId: (() => {
          let count = 0;
          return () => `ref-${++count}`;
        })(),
      },
    });

    assert.strictEqual(result.created, 2);
    assert.strictEqual(result.skipped, 1);
    assert.strictEqual(result.errors.length, 1);
    assert.match(result.errors[0] ?? "", /cannot sponsor themselves/);
    assert.deepStrictEqual(
      result.rebuiltReferrals.map((referral) => ({
        referrerId: referral.referrerId,
        referredId: referral.referredId,
        status: referral.status,
      })),
      [
        { referrerId: "sponsor-1", referredId: "user-1", status: "active" },
        { referrerId: "sponsor-2", referredId: "user-2", status: "pending" },
      ],
    );
  });

  it("rolls back live referral state when the staged swap fails mid-transaction", async () => {
    const prisma = createFakePrisma({
      referrals: [
        {
          id: "legacy-1",
          referrerId: "old-sponsor",
          referredId: "old-user",
          status: "active",
          rewardPaid: false,
          createdAt: new Date("2026-04-01T00:00:00.000Z"),
          updatedAt: new Date("2026-04-01T00:00:00.000Z"),
        },
      ],
      failOnCreateMany: true,
    });

    await assert.rejects(
      () =>
        executeReferralSync({
          prisma: prisma as any,
          existingCount: 1,
          usersWithSponsors,
          validSponsorIds: new Set(["sponsor-1", "sponsor-2"]),
          actorId: "admin-1",
          now: new Date("2026-05-11T00:00:00.000Z"),
        }),
      /induced referral createMany failure/,
    );

    assert.strictEqual(prisma.state.referrals.length, 1);
    assert.strictEqual(prisma.state.referrals[0]?.id, "legacy-1");
    assert.strictEqual(prisma.state.auditLogs.length, 0);
  });

  it("replaces the live referral set only after the transaction succeeds", async () => {
    const prisma = createFakePrisma({
      referrals: [
        {
          id: "legacy-1",
          referrerId: "old-sponsor",
          referredId: "old-user",
          status: "active",
          rewardPaid: false,
          createdAt: new Date("2026-04-01T00:00:00.000Z"),
          updatedAt: new Date("2026-04-01T00:00:00.000Z"),
        },
      ],
    });

    const result = await executeReferralSync({
      prisma: prisma as any,
      existingCount: 1,
      usersWithSponsors,
      validSponsorIds: new Set(["sponsor-1", "sponsor-2"]),
      actorId: "admin-1",
      now: new Date("2026-05-11T00:00:00.000Z"),
      deps: {
        createId: (() => {
          let count = 0;
          return () => `ref-${++count}`;
        })(),
      },
    });

    assert.strictEqual(result.existingCount, 1);
    assert.strictEqual(result.created, 2);
    assert.strictEqual(result.skipped, 1);
    assert.strictEqual(result.errorCount, 1);
    assert.strictEqual(prisma.state.referrals.length, 2);
    assert.deepStrictEqual(
      prisma.state.referrals.map((referral) => ({
        referrerId: referral.referrerId,
        referredId: referral.referredId,
        status: referral.status,
      })),
      [
        { referrerId: "sponsor-1", referredId: "user-1", status: "active" },
        { referrerId: "sponsor-2", referredId: "user-2", status: "pending" },
      ],
    );
    assert.strictEqual(prisma.state.auditLogs.length, 1);
    assert.match(prisma.state.auditLogs[0]?.changes ?? "", /"created":2/);
  });
});