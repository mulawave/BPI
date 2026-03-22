-- CreateTable
CREATE TABLE "ThirdPartyExecutiveOverpass" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "grantedByUserId" TEXT NOT NULL,
    "grantedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),
    "revokedAt" TIMESTAMP(3),
    "revokedByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ThirdPartyExecutiveOverpass_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ThirdPartyExecutiveOverpass_userId_key" ON "ThirdPartyExecutiveOverpass"("userId");
CREATE INDEX "ThirdPartyExecutiveOverpass_expiresAt_idx" ON "ThirdPartyExecutiveOverpass"("expiresAt");
CREATE INDEX "ThirdPartyExecutiveOverpass_grantedAt_idx" ON "ThirdPartyExecutiveOverpass"("grantedAt");
CREATE INDEX "ThirdPartyExecutiveOverpass_revokedAt_idx" ON "ThirdPartyExecutiveOverpass"("revokedAt");

-- AddForeignKey
ALTER TABLE "ThirdPartyExecutiveOverpass" ADD CONSTRAINT "ThirdPartyExecutiveOverpass_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ThirdPartyExecutiveOverpass" ADD CONSTRAINT "ThirdPartyExecutiveOverpass_grantedByUserId_fkey" FOREIGN KEY ("grantedByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ThirdPartyExecutiveOverpass" ADD CONSTRAINT "ThirdPartyExecutiveOverpass_revokedByUserId_fkey" FOREIGN KEY ("revokedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
