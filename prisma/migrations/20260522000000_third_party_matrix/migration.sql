CREATE TABLE IF NOT EXISTS "ThirdPartyMatrixNode" (
  "id" TEXT NOT NULL,
  "sponsorId" TEXT NOT NULL,
  "sequence" INTEGER NOT NULL,
  "leftUserId" TEXT,
  "rightUserId" TEXT,
  "leftWeight" INTEGER NOT NULL DEFAULT 0,
  "rightWeight" INTEGER NOT NULL DEFAULT 0,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ThirdPartyMatrixNode_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "ThirdPartyMatrixPlacement" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "sponsorId" TEXT NOT NULL,
  "nodeId" TEXT NOT NULL,
  "leg" TEXT NOT NULL,
  "sourceFlow" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ThirdPartyMatrixPlacement_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "ThirdPartyMatrixPlacementAudit" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "sponsorId" TEXT NOT NULL,
  "nodeId" TEXT NOT NULL,
  "leg" TEXT NOT NULL,
  "decisionBranch" TEXT NOT NULL,
  "sourceFlow" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ThirdPartyMatrixPlacementAudit_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "ThirdPartyMatrixSponsorState" (
  "id" TEXT NOT NULL,
  "sponsorId" TEXT NOT NULL,
  "nextPreferredLeg" TEXT NOT NULL DEFAULT 'LEFT',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ThirdPartyMatrixSponsorState_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "ThirdPartyMatrixSettings" (
  "id" TEXT NOT NULL DEFAULT 'default',
  "isEnabled" BOOLEAN NOT NULL DEFAULT true,
  "allowAutoPlacement" BOOLEAN NOT NULL DEFAULT true,
  "allowAdminMaintenance" BOOLEAN NOT NULL DEFAULT true,
  "maxPlacementRetries" INTEGER NOT NULL DEFAULT 3,
  "alertImbalanceThreshold" INTEGER NOT NULL DEFAULT 4,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ThirdPartyMatrixSettings_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "ThirdPartyMatrixNode_sponsorId_sequence_key"
  ON "ThirdPartyMatrixNode"("sponsorId", "sequence");
CREATE INDEX IF NOT EXISTS "ThirdPartyMatrixNode_isActive_idx"
  ON "ThirdPartyMatrixNode"("isActive");
CREATE INDEX IF NOT EXISTS "ThirdPartyMatrixNode_leftUserId_idx"
  ON "ThirdPartyMatrixNode"("leftUserId");
CREATE INDEX IF NOT EXISTS "ThirdPartyMatrixNode_rightUserId_idx"
  ON "ThirdPartyMatrixNode"("rightUserId");
CREATE INDEX IF NOT EXISTS "ThirdPartyMatrixNode_sponsorId_isActive_sequence_idx"
  ON "ThirdPartyMatrixNode"("sponsorId", "isActive", "sequence");

CREATE UNIQUE INDEX IF NOT EXISTS "ThirdPartyMatrixPlacement_userId_key"
  ON "ThirdPartyMatrixPlacement"("userId");
CREATE INDEX IF NOT EXISTS "ThirdPartyMatrixPlacement_createdAt_idx"
  ON "ThirdPartyMatrixPlacement"("createdAt");
CREATE INDEX IF NOT EXISTS "ThirdPartyMatrixPlacement_leg_idx"
  ON "ThirdPartyMatrixPlacement"("leg");
CREATE INDEX IF NOT EXISTS "ThirdPartyMatrixPlacement_nodeId_idx"
  ON "ThirdPartyMatrixPlacement"("nodeId");
CREATE INDEX IF NOT EXISTS "ThirdPartyMatrixPlacement_sponsorId_createdAt_idx"
  ON "ThirdPartyMatrixPlacement"("sponsorId", "createdAt");

CREATE INDEX IF NOT EXISTS "ThirdPartyMatrixPlacementAudit_createdAt_idx"
  ON "ThirdPartyMatrixPlacementAudit"("createdAt");
CREATE INDEX IF NOT EXISTS "ThirdPartyMatrixPlacementAudit_decisionBranch_idx"
  ON "ThirdPartyMatrixPlacementAudit"("decisionBranch");
CREATE INDEX IF NOT EXISTS "ThirdPartyMatrixPlacementAudit_sponsorId_createdAt_idx"
  ON "ThirdPartyMatrixPlacementAudit"("sponsorId", "createdAt");
CREATE INDEX IF NOT EXISTS "ThirdPartyMatrixPlacementAudit_userId_createdAt_idx"
  ON "ThirdPartyMatrixPlacementAudit"("userId", "createdAt");

CREATE UNIQUE INDEX IF NOT EXISTS "ThirdPartyMatrixSponsorState_sponsorId_key"
  ON "ThirdPartyMatrixSponsorState"("sponsorId");
CREATE INDEX IF NOT EXISTS "ThirdPartyMatrixSponsorState_nextPreferredLeg_idx"
  ON "ThirdPartyMatrixSponsorState"("nextPreferredLeg");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'ThirdPartyMatrixNode_sponsorId_fkey'
  ) THEN
    ALTER TABLE "ThirdPartyMatrixNode"
      ADD CONSTRAINT "ThirdPartyMatrixNode_sponsorId_fkey"
      FOREIGN KEY ("sponsorId") REFERENCES "User"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'ThirdPartyMatrixNode_leftUserId_fkey'
  ) THEN
    ALTER TABLE "ThirdPartyMatrixNode"
      ADD CONSTRAINT "ThirdPartyMatrixNode_leftUserId_fkey"
      FOREIGN KEY ("leftUserId") REFERENCES "User"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'ThirdPartyMatrixNode_rightUserId_fkey'
  ) THEN
    ALTER TABLE "ThirdPartyMatrixNode"
      ADD CONSTRAINT "ThirdPartyMatrixNode_rightUserId_fkey"
      FOREIGN KEY ("rightUserId") REFERENCES "User"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'ThirdPartyMatrixPlacement_userId_fkey'
  ) THEN
    ALTER TABLE "ThirdPartyMatrixPlacement"
      ADD CONSTRAINT "ThirdPartyMatrixPlacement_userId_fkey"
      FOREIGN KEY ("userId") REFERENCES "User"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'ThirdPartyMatrixPlacement_sponsorId_fkey'
  ) THEN
    ALTER TABLE "ThirdPartyMatrixPlacement"
      ADD CONSTRAINT "ThirdPartyMatrixPlacement_sponsorId_fkey"
      FOREIGN KEY ("sponsorId") REFERENCES "User"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'ThirdPartyMatrixPlacement_nodeId_fkey'
  ) THEN
    ALTER TABLE "ThirdPartyMatrixPlacement"
      ADD CONSTRAINT "ThirdPartyMatrixPlacement_nodeId_fkey"
      FOREIGN KEY ("nodeId") REFERENCES "ThirdPartyMatrixNode"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'ThirdPartyMatrixPlacementAudit_userId_fkey'
  ) THEN
    ALTER TABLE "ThirdPartyMatrixPlacementAudit"
      ADD CONSTRAINT "ThirdPartyMatrixPlacementAudit_userId_fkey"
      FOREIGN KEY ("userId") REFERENCES "User"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'ThirdPartyMatrixPlacementAudit_sponsorId_fkey'
  ) THEN
    ALTER TABLE "ThirdPartyMatrixPlacementAudit"
      ADD CONSTRAINT "ThirdPartyMatrixPlacementAudit_sponsorId_fkey"
      FOREIGN KEY ("sponsorId") REFERENCES "User"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'ThirdPartyMatrixPlacementAudit_nodeId_fkey'
  ) THEN
    ALTER TABLE "ThirdPartyMatrixPlacementAudit"
      ADD CONSTRAINT "ThirdPartyMatrixPlacementAudit_nodeId_fkey"
      FOREIGN KEY ("nodeId") REFERENCES "ThirdPartyMatrixNode"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'ThirdPartyMatrixSponsorState_sponsorId_fkey'
  ) THEN
    ALTER TABLE "ThirdPartyMatrixSponsorState"
      ADD CONSTRAINT "ThirdPartyMatrixSponsorState_sponsorId_fkey"
      FOREIGN KEY ("sponsorId") REFERENCES "User"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
