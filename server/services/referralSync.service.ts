import { randomUUID } from "crypto";

type ReferralSyncUser = {
  id: string;
  sponsorId: string | null;
  createdAt: Date;
  activated: boolean;
};

type ReferralRecord = {
  id: string;
  referrerId: string;
  referredId: string;
  status: string;
  rewardPaid: boolean;
  createdAt: Date;
  updatedAt: Date;
};

type ReferralSyncPreparedData = {
  rebuiltReferrals: ReferralRecord[];
  created: number;
  skipped: number;
  errors: string[];
};

type ReferralSyncDeps = {
  createId: () => string;
};

type ReferralSyncPrismaClient = {
  $transaction: <T>(callback: (tx: any) => Promise<T>) => Promise<T>;
};

const defaultDeps: ReferralSyncDeps = {
  createId: () => randomUUID(),
};

export function prepareReferralSyncData(params: {
  usersWithSponsors: ReferralSyncUser[];
  validSponsorIds: Set<string>;
  now?: Date;
  deps?: Partial<ReferralSyncDeps>;
}): ReferralSyncPreparedData {
  const { usersWithSponsors, validSponsorIds, now = new Date(), deps } = params;
  const services = { ...defaultDeps, ...deps };

  const rebuiltReferrals: ReferralRecord[] = [];
  const seenPairs = new Set<string>();
  let created = 0;
  let skipped = 0;
  const errors: string[] = [];

  for (const user of usersWithSponsors) {
    if (!user.sponsorId) {
      skipped += 1;
      continue;
    }

    if (user.sponsorId === user.id) {
      errors.push(`User ${user.id} cannot sponsor themselves`);
      skipped += 1;
      continue;
    }

    if (!validSponsorIds.has(user.sponsorId)) {
      errors.push(`User ${user.id} has invalid sponsorId: ${user.sponsorId}`);
      skipped += 1;
      continue;
    }

    const pairKey = `${user.sponsorId}:${user.id}`;
    if (seenPairs.has(pairKey)) {
      errors.push(`Duplicate referral pair detected for user ${user.id} and sponsor ${user.sponsorId}`);
      skipped += 1;
      continue;
    }

    seenPairs.add(pairKey);
    rebuiltReferrals.push({
      id: services.createId(),
      referrerId: user.sponsorId,
      referredId: user.id,
      status: user.activated ? "active" : "pending",
      rewardPaid: false,
      createdAt: user.createdAt,
      updatedAt: now,
    });
    created += 1;
  }

  return { rebuiltReferrals, created, skipped, errors };
}

export async function executeReferralSync(params: {
  prisma: ReferralSyncPrismaClient;
  existingCount: number;
  usersWithSponsors: ReferralSyncUser[];
  validSponsorIds: Set<string>;
  actorId?: string;
  now?: Date;
  deps?: Partial<ReferralSyncDeps>;
}) {
  const {
    prisma,
    existingCount,
    usersWithSponsors,
    validSponsorIds,
    actorId,
    now = new Date(),
    deps,
  } = params;
  const services = { ...defaultDeps, ...deps };

  const prepared = prepareReferralSyncData({
    usersWithSponsors,
    validSponsorIds,
    now,
    deps: services,
  });

  await prisma.$transaction(async (tx) => {
    await tx.referral.deleteMany({});

    if (prepared.rebuiltReferrals.length > 0) {
      await tx.referral.createMany({
        data: prepared.rebuiltReferrals,
      });
    }

    await tx.auditLog.create({
      data: {
        id: services.createId(),
        userId: actorId || "system",
        action: "SYNC_REFERRAL_DATA",
        entity: "Referral",
        entityId: "*",
        changes: JSON.stringify({
          existingCount,
          created: prepared.created,
          skipped: prepared.skipped,
          errorCount: prepared.errors.length,
        }),
        status: "success",
        createdAt: now,
      },
    });
  });

  return {
    existingCount,
    created: prepared.created,
    skipped: prepared.skipped,
    errorCount: prepared.errors.length,
    errors: prepared.errors.slice(0, 10),
  };
}