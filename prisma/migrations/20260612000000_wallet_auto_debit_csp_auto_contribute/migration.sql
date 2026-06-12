-- CreateTable
CREATE TABLE "WalletAutoDebitSetting" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "isEnabled" BOOLEAN NOT NULL DEFAULT false,
    "percentage" DOUBLE PRECISION NOT NULL DEFAULT 10,
    "applyToRewards" BOOLEAN NOT NULL DEFAULT true,
    "applyToDeposits" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WalletAutoDebitSetting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CspAutoContributeSetting" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "isEnabled" BOOLEAN NOT NULL DEFAULT false,
    "minAmountPerRequest" INTEGER NOT NULL DEFAULT 500,
    "maxAmountPerRequest" INTEGER NOT NULL DEFAULT 1000,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CspAutoContributeSetting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CspAutoContributeLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "balanceBefore" DOUBLE PRECISION NOT NULL,
    "balanceAfter" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CspAutoContributeLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "WalletAutoDebitSetting_userId_key" ON "WalletAutoDebitSetting"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "CspAutoContributeSetting_userId_key" ON "CspAutoContributeSetting"("userId");

-- CreateIndex
CREATE INDEX "CspAutoContributeLog_userId_createdAt_idx" ON "CspAutoContributeLog"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "CspAutoContributeLog_requestId_idx" ON "CspAutoContributeLog"("requestId");

-- AddForeignKey
ALTER TABLE "WalletAutoDebitSetting" ADD CONSTRAINT "WalletAutoDebitSetting_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CspAutoContributeSetting" ADD CONSTRAINT "CspAutoContributeSetting_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CspAutoContributeLog" ADD CONSTRAINT "CspAutoContributeLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CspAutoContributeLog" ADD CONSTRAINT "CspAutoContributeLog_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "CspSupportRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;
