-- CreateTable
CREATE TABLE "EliteClubOperationsFee" (
    "id" TEXT NOT NULL,
    "clubId" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "contributionId" TEXT NOT NULL,
    "month" INTEGER NOT NULL,
    "year" INTEGER NOT NULL,
    "grossOps" DOUBLE PRECISION NOT NULL,
    "bpiShare" DOUBLE PRECISION NOT NULL,
    "eliteShare" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EliteClubOperationsFee_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "EliteClubOperationsFee_contributionId_key" ON "EliteClubOperationsFee"("contributionId");

-- CreateIndex
CREATE INDEX "EliteClubOperationsFee_clubId_idx" ON "EliteClubOperationsFee"("clubId");

-- CreateIndex
CREATE INDEX "EliteClubOperationsFee_memberId_idx" ON "EliteClubOperationsFee"("memberId");

-- AddForeignKey
ALTER TABLE "EliteClubOperationsFee" ADD CONSTRAINT "EliteClubOperationsFee_clubId_fkey" FOREIGN KEY ("clubId") REFERENCES "EliteClub"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EliteClubOperationsFee" ADD CONSTRAINT "EliteClubOperationsFee_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "EliteClubMember"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EliteClubOperationsFee" ADD CONSTRAINT "EliteClubOperationsFee_contributionId_fkey" FOREIGN KEY ("contributionId") REFERENCES "EliteClubContribution"("id") ON DELETE CASCADE ON UPDATE CASCADE;
