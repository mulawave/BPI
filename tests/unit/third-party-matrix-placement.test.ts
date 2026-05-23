import { describe, it } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { placeUserInThirdPartyMatrix } from "@/server/services/thirdPartyMatrix.service";

type MatrixSettings = {
  id: string;
  isEnabled: boolean;
  allowAutoPlacement: boolean;
  allowAdminMaintenance: boolean;
  maxPlacementRetries: number;
  alertImbalanceThreshold: number;
  createdAt: Date;
  updatedAt: Date;
};

type MatrixNode = {
  id: string;
  sponsorId: string;
  sequence: number;
  leftUserId: string | null;
  rightUserId: string | null;
  leftWeight: number;
  rightWeight: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
};

type MatrixPlacement = {
  id: string;
  userId: string;
  sponsorId: string;
  nodeId: string;
  leg: "LEFT" | "RIGHT";
  sourceFlow: string;
  createdAt: Date;
  updatedAt: Date;
};

type MatrixAudit = {
  id: string;
  userId: string;
  sponsorId: string;
  nodeId: string;
  leg: "LEFT" | "RIGHT";
  decisionBranch: string;
  sourceFlow: string;
  createdAt: Date;
};

type SponsorState = {
  id: string;
  sponsorId: string;
  nextPreferredLeg: "LEFT" | "RIGHT";
  createdAt: Date;
  updatedAt: Date;
};

type FakePrismaOptions = {
  settings?: Partial<MatrixSettings>;
  nodes?: MatrixNode[];
  placements?: MatrixPlacement[];
  sponsorStates?: SponsorState[];
  failOnAuditCreate?: boolean;
};

function createFakePrisma(seed?: FakePrismaOptions) {
  const now = new Date("2026-05-22T00:00:00.000Z");

  const state = {
    settings: {
      id: "default",
      isEnabled: true,
      allowAutoPlacement: true,
      allowAdminMaintenance: true,
      maxPlacementRetries: 3,
      alertImbalanceThreshold: 4,
      createdAt: now,
      updatedAt: now,
      ...(seed?.settings ?? {}),
    } as MatrixSettings,
    nodes: structuredClone(seed?.nodes ?? []),
    placements: structuredClone(seed?.placements ?? []),
    audits: [] as MatrixAudit[],
    sponsorStates: structuredClone(seed?.sponsorStates ?? []),
  };

  function sortedNodesForSponsor(sponsorId: string) {
    return state.nodes
      .filter((node) => node.sponsorId === sponsorId)
      .sort((a, b) => a.sequence - b.sequence);
  }

  const prisma = {
    state,
    async $transaction<T>(callback: (tx: any) => Promise<T>) {
      const snapshot = structuredClone(state);
      const tx = {
        thirdPartyMatrixSettings: {
          async upsert(args: { create: { id: string }; update: object; where: { id: string } }) {
            if (state.settings.id !== args.where.id) {
              state.settings = {
                ...state.settings,
                id: args.create.id,
              };
            }
            return structuredClone(state.settings);
          },
        },
        thirdPartyMatrixPlacement: {
          async findUnique(args: { where: { userId: string }; select?: { id: true } }) {
            const match = state.placements.find((placement) => placement.userId === args.where.userId);
            if (!match) {
              return null;
            }
            if (args.select?.id) {
              return { id: match.id };
            }
            return structuredClone(match);
          },
          async create(args: {
            data: {
              id: string;
              userId: string;
              sponsorId: string;
              nodeId: string;
              leg: "LEFT" | "RIGHT";
              sourceFlow: string;
            };
          }) {
            const placement: MatrixPlacement = {
              ...args.data,
              createdAt: now,
              updatedAt: now,
            };
            state.placements.push(placement);
            return structuredClone(placement);
          },
        },
        thirdPartyMatrixNode: {
          async findFirst(args: {
            where: any;
            select?: { sequence: true };
            orderBy: { sequence: "asc" | "desc" };
          }) {
            if (args.select?.sequence) {
              const sponsorNodes = sortedNodesForSponsor(args.where.sponsorId);
              if (sponsorNodes.length === 0) {
                return null;
              }
              const chosen =
                args.orderBy.sequence === "desc"
                  ? sponsorNodes[sponsorNodes.length - 1]
                  : sponsorNodes[0];
              return { sequence: chosen.sequence };
            }

            const sponsorNodes = sortedNodesForSponsor(args.where.sponsorId).filter((node) => node.isActive);
            const openNodes = sponsorNodes.filter((node) => node.leftUserId === null || node.rightUserId === null);
            return openNodes[0] ? structuredClone(openNodes[0]) : null;
          },
          async create(args: {
            data: {
              id: string;
              sponsorId: string;
              sequence: number;
              isActive: boolean;
              leftWeight: number;
              rightWeight: number;
            };
          }) {
            const node: MatrixNode = {
              ...args.data,
              leftUserId: null,
              rightUserId: null,
              createdAt: now,
              updatedAt: now,
            };
            state.nodes.push(node);
            return structuredClone(node);
          },
          async update(args: {
            where: { id: string };
            data:
              | { leftUserId: string; leftWeight: { increment: number } }
              | { rightUserId: string; rightWeight: { increment: number } };
          }) {
            const node = state.nodes.find((entry) => entry.id === args.where.id);
            if (!node) {
              throw new Error(`Node not found: ${args.where.id}`);
            }

            if ("leftUserId" in args.data) {
              node.leftUserId = args.data.leftUserId;
              node.leftWeight += args.data.leftWeight.increment;
            }

            if ("rightUserId" in args.data) {
              node.rightUserId = args.data.rightUserId;
              node.rightWeight += args.data.rightWeight.increment;
            }

            node.updatedAt = now;
            return structuredClone(node);
          },
        },
        thirdPartyMatrixSponsorState: {
          async upsert(args: {
            where: { sponsorId: string };
            create: {
              id: string;
              sponsorId: string;
              nextPreferredLeg: "LEFT" | "RIGHT";
            };
            update: object;
          }) {
            const existing = state.sponsorStates.find(
              (sponsorState) => sponsorState.sponsorId === args.where.sponsorId,
            );
            if (existing) {
              return structuredClone(existing);
            }
            const sponsorState: SponsorState = {
              ...args.create,
              createdAt: now,
              updatedAt: now,
            };
            state.sponsorStates.push(sponsorState);
            return structuredClone(sponsorState);
          },
          async update(args: {
            where: { sponsorId: string };
            data: { nextPreferredLeg: "LEFT" | "RIGHT" };
          }) {
            const sponsorState = state.sponsorStates.find(
              (entry) => entry.sponsorId === args.where.sponsorId,
            );
            if (!sponsorState) {
              throw new Error(`Sponsor state not found: ${args.where.sponsorId}`);
            }
            sponsorState.nextPreferredLeg = args.data.nextPreferredLeg;
            sponsorState.updatedAt = now;
            return structuredClone(sponsorState);
          },
        },
        thirdPartyMatrixPlacementAudit: {
          async create(args: {
            data: {
              id: string;
              userId: string;
              sponsorId: string;
              nodeId: string;
              leg: "LEFT" | "RIGHT";
              decisionBranch: string;
              sourceFlow: string;
            };
          }) {
            if (seed?.failOnAuditCreate) {
              throw new Error("induced audit write failure");
            }
            const audit: MatrixAudit = {
              ...args.data,
              createdAt: now,
            };
            state.audits.push(audit);
            return structuredClone(audit);
          },
        },
      };

      try {
        return await callback(tx);
      } catch (error) {
        state.settings = snapshot.settings;
        state.nodes = snapshot.nodes;
        state.placements = snapshot.placements;
        state.audits = snapshot.audits;
        state.sponsorStates = snapshot.sponsorStates;
        throw error;
      }
    },
  };

  return prisma;
}

const authRouterSource = fs.readFileSync(
  path.resolve(process.cwd(), "server/trpc/router/auth.ts"),
  "utf8",
);

const userRouterSource = fs.readFileSync(
  path.resolve(process.cwd(), "server/trpc/router/user.ts"),
  "utf8",
);

describe("Third-party matrix placement", () => {
  it("wires matrix placement into registration and beneficiary flows", () => {
    assert.match(authRouterSource, /placeUserInThirdPartyMatrix\(/);
    assert.match(userRouterSource, /placeUserInThirdPartyMatrix\(/);
  });

  it("returns MATRIX_DISABLED when settings block auto placement", async () => {
    const prisma = createFakePrisma({
      settings: {
        isEnabled: false,
      },
    });

    const result = await placeUserInThirdPartyMatrix({
      prisma: prisma as any,
      userId: "user-a",
      sponsorId: "sponsor-a",
    });

    assert.strictEqual(result.placed, false);
    assert.strictEqual(result.reason, "MATRIX_DISABLED");
    assert.strictEqual(prisma.state.placements.length, 0);
    assert.strictEqual(prisma.state.nodes.length, 0);
  });

  it("blocks duplicate placements for the same user", async () => {
    const prisma = createFakePrisma({
      placements: [
        {
          id: "existing-placement",
          userId: "user-a",
          sponsorId: "sponsor-a",
          nodeId: "node-a",
          leg: "LEFT",
          sourceFlow: "register",
          createdAt: new Date("2026-05-01T00:00:00.000Z"),
          updatedAt: new Date("2026-05-01T00:00:00.000Z"),
        },
      ],
    });

    const result = await placeUserInThirdPartyMatrix({
      prisma: prisma as any,
      userId: "user-a",
      sponsorId: "sponsor-a",
    });

    assert.strictEqual(result.placed, false);
    assert.strictEqual(result.reason, "ALREADY_PLACED");
    assert.strictEqual(prisma.state.placements.length, 1);
  });

  it("fills the weaker side when both legs are open", async () => {
    const prisma = createFakePrisma({
      nodes: [
        {
          id: "node-1",
          sponsorId: "sponsor-1",
          sequence: 1,
          leftUserId: null,
          rightUserId: null,
          leftWeight: 0,
          rightWeight: 2,
          isActive: true,
          createdAt: new Date("2026-05-01T00:00:00.000Z"),
          updatedAt: new Date("2026-05-01T00:00:00.000Z"),
        },
      ],
    });

    const result = await placeUserInThirdPartyMatrix({
      prisma: prisma as any,
      userId: "user-weaker",
      sponsorId: "sponsor-1",
    });

    assert.strictEqual(result.placed, true);
    assert.strictEqual(result.reason, "PLACED");
    assert.strictEqual(result.placement?.leg, "LEFT");
    assert.match(result.placement?.decisionBranch ?? "", /FILL_WEAKER_SIDE/);
    assert.strictEqual(prisma.state.nodes[0]?.leftUserId, "user-weaker");
    assert.strictEqual(prisma.state.nodes[0]?.leftWeight, 1);
  });

  it("creates a new node and alternates by sponsor state when current nodes are full", async () => {
    const prisma = createFakePrisma({
      nodes: [
        {
          id: "node-1",
          sponsorId: "sponsor-rollover",
          sequence: 1,
          leftUserId: "u-left",
          rightUserId: "u-right",
          leftWeight: 1,
          rightWeight: 1,
          isActive: true,
          createdAt: new Date("2026-05-01T00:00:00.000Z"),
          updatedAt: new Date("2026-05-01T00:00:00.000Z"),
        },
      ],
      sponsorStates: [
        {
          id: "state-1",
          sponsorId: "sponsor-rollover",
          nextPreferredLeg: "RIGHT",
          createdAt: new Date("2026-05-01T00:00:00.000Z"),
          updatedAt: new Date("2026-05-01T00:00:00.000Z"),
        },
      ],
    });

    const result = await placeUserInThirdPartyMatrix({
      prisma: prisma as any,
      userId: "user-rollover",
      sponsorId: "sponsor-rollover",
      sourceFlow: "beneficiary",
    });

    assert.strictEqual(result.placed, true);
    assert.strictEqual(result.placement?.sequence, 2);
    assert.strictEqual(result.placement?.leg, "RIGHT");
    assert.match(result.placement?.decisionBranch ?? "", /CREATE_NEW_NODE:BALANCED_ALTERNATE/);
    assert.strictEqual(prisma.state.nodes.length, 2);
    assert.strictEqual(prisma.state.nodes[1]?.rightUserId, "user-rollover");
    assert.strictEqual(prisma.state.sponsorStates[0]?.nextPreferredLeg, "LEFT");
  });

  it("rolls back node and placement writes when audit insert fails", async () => {
    const prisma = createFakePrisma({
      failOnAuditCreate: true,
    });

    await assert.rejects(
      () =>
        placeUserInThirdPartyMatrix({
          prisma: prisma as any,
          userId: "user-fail",
          sponsorId: "sponsor-fail",
        }),
      /induced audit write failure/,
    );

    assert.strictEqual(prisma.state.placements.length, 0);
    assert.strictEqual(prisma.state.audits.length, 0);
    assert.strictEqual(prisma.state.nodes.length, 0);
  });
});
