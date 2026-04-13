-- CreateTable
CREATE TABLE "KycSubmission" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "legalFirstName" TEXT NOT NULL,
    "legalLastName" TEXT NOT NULL,
    "dateOfBirth" TIMESTAMP(3) NOT NULL,
    "nationality" TEXT NOT NULL,
    "gender" TEXT,
    "residentialAddress" TEXT NOT NULL,
    "residentialCity" TEXT NOT NULL,
    "residentialState" TEXT NOT NULL,
    "residentialCountry" TEXT NOT NULL,
    "residentialZip" TEXT,
    "documentType" TEXT NOT NULL,
    "documentNumber" TEXT NOT NULL,
    "documentFrontUrl" TEXT NOT NULL,
    "documentBackUrl" TEXT,
    "documentExpiryDate" TIMESTAMP(3),
    "proofOfAddressUrl" TEXT,
    "proofOfAddressType" TEXT,
    "selfieUrl" TEXT,
    "livenessCheckPassed" BOOLEAN NOT NULL DEFAULT false,
    "bvn" TEXT,
    "nin" TEXT,
    "reviewedBy" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "rejectionReason" TEXT,
    "adminNotes" TEXT,
    "expiresAt" TIMESTAMP(3),
    "expiryNotifiedAt" TIMESTAMP(3),
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "KycSubmission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KycAuditLog" (
    "id" TEXT NOT NULL,
    "submissionId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "performedBy" TEXT,
    "performedByRole" TEXT,
    "details" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "KycAuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "KycSubmission_userId_idx" ON "KycSubmission"("userId");

-- CreateIndex
CREATE INDEX "KycSubmission_status_idx" ON "KycSubmission"("status");

-- CreateIndex
CREATE INDEX "KycSubmission_expiresAt_idx" ON "KycSubmission"("expiresAt");

-- CreateIndex
CREATE INDEX "KycSubmission_submittedAt_idx" ON "KycSubmission"("submittedAt");

-- CreateIndex
CREATE INDEX "KycAuditLog_submissionId_idx" ON "KycAuditLog"("submissionId");

-- CreateIndex
CREATE INDEX "KycAuditLog_action_idx" ON "KycAuditLog"("action");

-- AddForeignKey
ALTER TABLE "KycSubmission" ADD CONSTRAINT "KycSubmission_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KycSubmission" ADD CONSTRAINT "KycSubmission_reviewedBy_fkey" FOREIGN KEY ("reviewedBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KycAuditLog" ADD CONSTRAINT "KycAuditLog_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "KycSubmission"("id") ON DELETE CASCADE ON UPDATE CASCADE;
