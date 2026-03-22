-- AlterTable
ALTER TABLE "CspSupportRequest" ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "isAdminDefault" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "CspSupportRequest_isAdminDefault_isActive_idx" ON "CspSupportRequest"("isAdminDefault", "isActive");
