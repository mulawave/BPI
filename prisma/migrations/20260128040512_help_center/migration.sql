-- CreateTable
CREATE TABLE "HelpCategory" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HelpCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HelpTopic" (
    "id" TEXT NOT NULL,
    "categoryId" TEXT,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "summary" TEXT,
    "steps" JSONB,
    "faq" JSONB,
    "tags" TEXT[],
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "helpfulYes" INTEGER NOT NULL DEFAULT 0,
    "helpfulNo" INTEGER NOT NULL DEFAULT 0,
    "createdById" TEXT,
    "updatedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HelpTopic_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HelpRevision" (
    "id" TEXT NOT NULL,
    "topicId" TEXT NOT NULL,
    "contentSnapshot" JSONB NOT NULL,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HelpRevision_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HelpBotIntent" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "response" TEXT,
    "tags" TEXT[],
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HelpBotIntent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HelpBotTrainingExample" (
    "id" TEXT NOT NULL,
    "intentId" TEXT NOT NULL,
    "utterance" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HelpBotTrainingExample_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "HelpCategory_slug_key" ON "HelpCategory"("slug");

-- CreateIndex
CREATE INDEX "HelpCategory_isActive_order_idx" ON "HelpCategory"("isActive", "order");

-- CreateIndex
CREATE UNIQUE INDEX "HelpTopic_slug_key" ON "HelpTopic"("slug");

-- CreateIndex
CREATE INDEX "HelpTopic_isPublished_updatedAt_idx" ON "HelpTopic"("isPublished", "updatedAt");

-- CreateIndex
CREATE INDEX "HelpTopic_categoryId_idx" ON "HelpTopic"("categoryId");

-- CreateIndex
CREATE INDEX "HelpRevision_topicId_createdAt_idx" ON "HelpRevision"("topicId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "HelpBotIntent_name_key" ON "HelpBotIntent"("name");

-- CreateIndex
CREATE INDEX "HelpBotTrainingExample_intentId_idx" ON "HelpBotTrainingExample"("intentId");

-- AddForeignKey
ALTER TABLE "HelpTopic" ADD CONSTRAINT "HelpTopic_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "HelpCategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HelpRevision" ADD CONSTRAINT "HelpRevision_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES "HelpTopic"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HelpBotTrainingExample" ADD CONSTRAINT "HelpBotTrainingExample_intentId_fkey" FOREIGN KEY ("intentId") REFERENCES "HelpBotIntent"("id") ON DELETE CASCADE ON UPDATE CASCADE;
