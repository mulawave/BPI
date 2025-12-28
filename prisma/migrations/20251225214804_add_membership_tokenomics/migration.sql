-- AlterTable
ALTER TABLE "User" ADD COLUMN     "activeMembershipPackageId" TEXT,
ADD COLUMN     "bpiTokenWallet" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "sponsorId" TEXT;

-- CreateTable
CREATE TABLE "MembershipPackage" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "vat" DOUBLE PRECISION NOT NULL,
    "cash_l1" DOUBLE PRECISION NOT NULL,
    "bpt_l1" DOUBLE PRECISION NOT NULL,
    "palliative_l1" DOUBLE PRECISION NOT NULL,
    "cash_l2" DOUBLE PRECISION NOT NULL,
    "bpt_l2" DOUBLE PRECISION NOT NULL,
    "palliative_l2" DOUBLE PRECISION NOT NULL,
    "cash_l3" DOUBLE PRECISION NOT NULL,
    "bpt_l3" DOUBLE PRECISION NOT NULL,
    "palliative_l3" DOUBLE PRECISION NOT NULL,
    "cash_l4" DOUBLE PRECISION NOT NULL,
    "bpt_l4" DOUBLE PRECISION NOT NULL,
    "palliative_l4" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MembershipPackage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmpowermentPackage" (
    "id" TEXT NOT NULL,
    "sponsorId" TEXT NOT NULL,
    "beneficiaryId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Active - Countdown Running',
    "maturityDate" TIMESTAMP(3) NOT NULL,
    "grossEmpowermentValue" DOUBLE PRECISION NOT NULL,
    "netEmpowermentValue" DOUBLE PRECISION NOT NULL,
    "grossSponsorReward" DOUBLE PRECISION NOT NULL,
    "netSponsorReward" DOUBLE PRECISION NOT NULL,
    "isConverted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EmpowermentPackage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SystemWallet" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "balance" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "walletType" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SystemWallet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BurnEvent" (
    "id" TEXT NOT NULL,
    "amountBpt" DOUBLE PRECISION NOT NULL,
    "valueNgn" DOUBLE PRECISION NOT NULL,
    "valueUsd" DOUBLE PRECISION NOT NULL,
    "txHash" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BurnEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "MembershipPackage_name_key" ON "MembershipPackage"("name");

-- CreateIndex
CREATE UNIQUE INDEX "SystemWallet_name_key" ON "SystemWallet"("name");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_sponsorId_fkey" FOREIGN KEY ("sponsorId") REFERENCES "User"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "EmpowermentPackage" ADD CONSTRAINT "EmpowermentPackage_sponsorId_fkey" FOREIGN KEY ("sponsorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmpowermentPackage" ADD CONSTRAINT "EmpowermentPackage_beneficiaryId_fkey" FOREIGN KEY ("beneficiaryId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
