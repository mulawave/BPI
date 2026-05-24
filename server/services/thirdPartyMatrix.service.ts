import { randomUUID } from "crypto";
import type { PrismaClient } from "@prisma/client";

type PlacementSource = "register" | "beneficiary" | "admin-repair";

type PlacementResult = {
  placed: boolean;
  reason: string;
  placement?: {
    sponsorId: string;
    nodeId: string;
    leg: "LEFT" | "RIGHT";
    sequence: number;
    decisionBranch: string;
  };
};

function oppositeLeg(leg: "LEFT" | "RIGHT"): "LEFT" | "RIGHT" {
  return leg === "LEFT" ? "RIGHT" : "LEFT";
}

export async function placeUserInThirdPartyMatrix(params: {
  prisma: PrismaClient;
  userId: string;
  sponsorId: string;
  sourceFlow?: PlacementSource;
}): Promise<PlacementResult> {
  const { prisma, userId, sponsorId, sourceFlow = "register" } = params;

  return prisma.$transaction(async (tx) => {
    const settings = await tx.thirdPartyMatrixSettings.upsert({
      where: { id: "default" },
      update: {},
      create: { id: "default", updatedAt: new Date() },
    });

    if (!settings.isEnabled || !settings.allowAutoPlacement) {
      return {
        placed: false,
        reason: "MATRIX_DISABLED",
      };
    }

    if (userId === sponsorId) {
      return {
        placed: false,
        reason: "SELF_SPONSOR_BLOCKED",
      };
    }

    const existingPlacement = await tx.thirdPartyMatrixPlacement.findUnique({
      where: { userId },
      select: { id: true },
    });

    if (existingPlacement) {
      return {
        placed: false,
        reason: "ALREADY_PLACED",
      };
    }

    let targetNode = await tx.thirdPartyMatrixNode.findFirst({
      where: {
        sponsorId,
        isActive: true,
        OR: [{ leftUserId: null }, { rightUserId: null }],
      },
      orderBy: { sequence: "asc" },
    });

    let decisionBranch = "OPEN_NODE";

    if (!targetNode) {
      const maxSequenceRow = await tx.thirdPartyMatrixNode.findFirst({
        where: { sponsorId },
        select: { sequence: true },
        orderBy: { sequence: "desc" },
      });

      const sequence = (maxSequenceRow?.sequence ?? 0) + 1;
      targetNode = await tx.thirdPartyMatrixNode.create({
        data: {
          id: randomUUID(),
          sponsorId,
          sequence,
          isActive: true,
          leftWeight: 0,
          rightWeight: 0,
          updatedAt: new Date(),
        },
      });
      decisionBranch = "CREATE_NEW_NODE";
    }

    const sponsorState = await tx.thirdPartyMatrixSponsorState.upsert({
      where: { sponsorId },
      update: {},
      create: {
        id: randomUUID(),
        sponsorId,
        nextPreferredLeg: "LEFT",
        updatedAt: new Date(),
      },
    });

    const leftOpen = !targetNode.leftUserId;
    const rightOpen = !targetNode.rightUserId;

    let leg: "LEFT" | "RIGHT";

    if (leftOpen && !rightOpen) {
      leg = "LEFT";
      decisionBranch = `${decisionBranch}:LEFT_ONLY_OPEN`;
    } else if (!leftOpen && rightOpen) {
      leg = "RIGHT";
      decisionBranch = `${decisionBranch}:RIGHT_ONLY_OPEN`;
    } else if (leftOpen && rightOpen) {
      if (targetNode.leftWeight === targetNode.rightWeight) {
        leg = sponsorState.nextPreferredLeg === "RIGHT" ? "RIGHT" : "LEFT";
        decisionBranch = `${decisionBranch}:BALANCED_ALTERNATE`;
      } else {
        leg = targetNode.leftWeight < targetNode.rightWeight ? "LEFT" : "RIGHT";
        decisionBranch = `${decisionBranch}:FILL_WEAKER_SIDE`;
      }
    } else {
      const maxSequenceRow = await tx.thirdPartyMatrixNode.findFirst({
        where: { sponsorId },
        select: { sequence: true },
        orderBy: { sequence: "desc" },
      });

      const sequence = (maxSequenceRow?.sequence ?? 0) + 1;
      const rolloverNode = await tx.thirdPartyMatrixNode.create({
        data: {
          id: randomUUID(),
          sponsorId,
          sequence,
          isActive: true,
          leftWeight: 0,
          rightWeight: 0,
          updatedAt: new Date(),
        },
      });

      targetNode = rolloverNode;

      leg = sponsorState.nextPreferredLeg === "RIGHT" ? "RIGHT" : "LEFT";
      decisionBranch = "FULL_NODE_ROLLOVER:ALTERNATE";
    }

    await tx.thirdPartyMatrixNode.update({
      where: { id: targetNode.id },
      data:
        leg === "LEFT"
          ? {
              leftUserId: userId,
              leftWeight: { increment: 1 },
            }
          : {
              rightUserId: userId,
              rightWeight: { increment: 1 },
            },
    });

    await tx.thirdPartyMatrixPlacement.create({
      data: {
        id: randomUUID(),
        userId,
        sponsorId,
        nodeId: targetNode.id,
        leg,
        sourceFlow,
        updatedAt: new Date(),
      },
    });

    await tx.thirdPartyMatrixPlacementAudit.create({
      data: {
        id: randomUUID(),
        userId,
        sponsorId,
        nodeId: targetNode.id,
        leg,
        decisionBranch,
        sourceFlow,
      },
    });

    await tx.thirdPartyMatrixSponsorState.update({
      where: { sponsorId },
      data: {
        nextPreferredLeg: oppositeLeg(leg),
      },
    });

    return {
      placed: true,
      reason: "PLACED",
      placement: {
        sponsorId,
        nodeId: targetNode.id,
        leg,
        sequence: targetNode.sequence,
        decisionBranch,
      },
    };
  });
}

async function removeExistingUserPlacement(params: {
  prisma: PrismaClient;
  userId: string;
  sourceFlow: PlacementSource;
}): Promise<"REMOVED" | "NOT_FOUND"> {
  const { prisma, userId, sourceFlow } = params;

  const placement = await prisma.thirdPartyMatrixPlacement.findUnique({
    where: { userId },
    select: { id: true, sponsorId: true, nodeId: true, leg: true },
  });

  if (!placement) {
    return "NOT_FOUND";
  }

  await prisma.$transaction(async (tx) => {
    const node = await tx.thirdPartyMatrixNode.findUnique({
      where: { id: placement.nodeId },
      select: {
        id: true,
        leftUserId: true,
        rightUserId: true,
        leftWeight: true,
        rightWeight: true,
      },
    });

    if (node) {
      if (placement.leg === "LEFT" && node.leftUserId === userId) {
        await tx.thirdPartyMatrixNode.update({
          where: { id: node.id },
          data: {
            leftUserId: null,
            leftWeight: Math.max(0, (node.leftWeight ?? 0) - 1),
          },
        });
      }

      if (placement.leg === "RIGHT" && node.rightUserId === userId) {
        await tx.thirdPartyMatrixNode.update({
          where: { id: node.id },
          data: {
            rightUserId: null,
            rightWeight: Math.max(0, (node.rightWeight ?? 0) - 1),
          },
        });
      }
    }

    await tx.thirdPartyMatrixPlacement.delete({
      where: { userId },
    });

    await tx.thirdPartyMatrixPlacementAudit.create({
      data: {
        id: randomUUID(),
        userId,
        sponsorId: placement.sponsorId,
        nodeId: placement.nodeId,
        leg: placement.leg,
        decisionBranch: "RECONCILE_REMOVE_STALE_SPONSOR_PLACEMENT",
        sourceFlow,
      },
    });
  });

  return "REMOVED";
}

export async function reconcileThirdPartyMatrixPlacementsForSubmittedLinks(params: {
  prisma: PrismaClient;
  userIds?: string[];
  sourceFlow?: PlacementSource;
}): Promise<{
  candidates: number;
  missing: number;
  placed: number;
  skipped: number;
  errors: number;
}> {
  const { prisma, userIds, sourceFlow = "admin-repair" } = params;

  const scopedIds = Array.from(new Set((userIds || []).filter(Boolean)));

  const submittedUsers = await prisma.userThirdPartyLink.findMany({
    where: scopedIds.length ? { userId: { in: scopedIds } } : undefined,
    select: { userId: true },
    distinct: ["userId"],
  });

  const candidateUserIds = submittedUsers.map((r) => r.userId);
  if (candidateUserIds.length === 0) {
    return { candidates: 0, missing: 0, placed: 0, skipped: 0, errors: 0 };
  }

  const existingPlacements = await prisma.thirdPartyMatrixPlacement.findMany({
    where: { userId: { in: candidateUserIds } },
    select: { userId: true, sponsorId: true },
  });

  const existingPlacementByUser = new Map(existingPlacements.map((r) => [r.userId, r]));

  const usersWithSponsors = await prisma.user.findMany({
    where: {
      id: { in: candidateUserIds },
      sponsorId: { not: null },
    },
    select: {
      id: true,
      sponsorId: true,
    },
  });

  const usersWithSponsorsById = new Map(usersWithSponsors.map((u) => [u.id, u]));
  const missingUserIds = candidateUserIds.filter((id) => {
    const user = usersWithSponsorsById.get(id);
    if (!user?.sponsorId) {
      return false;
    }
    const existing = existingPlacementByUser.get(id);
    return !existing || existing.sponsorId !== user.sponsorId;
  });

  if (missingUserIds.length === 0) {
    return { candidates: candidateUserIds.length, missing: 0, placed: 0, skipped: 0, errors: 0 };
  }

  let placed = 0;
  let skipped = Math.max(0, candidateUserIds.length - usersWithSponsors.length);
  let errors = 0;

  for (const userId of missingUserIds) {
    const user = usersWithSponsorsById.get(userId);
    try {
      if (!user?.sponsorId) {
        skipped += 1;
        continue;
      }

      const existing = existingPlacementByUser.get(user.id);
      if (existing && existing.sponsorId !== user.sponsorId) {
        await removeExistingUserPlacement({
          prisma,
          userId: user.id,
          sourceFlow,
        });
      }

      const result = await placeUserInThirdPartyMatrix({
        prisma,
        userId: user.id,
        sponsorId: user.sponsorId as string,
        sourceFlow,
      });

      if (result.placed) {
        placed += 1;
      } else {
        skipped += 1;
      }
    } catch (error) {
      errors += 1;
      console.error("[thirdPartyMatrix.reconcile] placement backfill failed", {
        userId: user?.id ?? userId,
        sponsorId: user?.sponsorId ?? null,
        error,
      });
    }
  }

  return {
    candidates: candidateUserIds.length,
    missing: missingUserIds.length,
    placed,
    skipped,
    errors,
  };
}
