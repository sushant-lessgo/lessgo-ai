-- CreateTable
CREATE TABLE "OutreachIntake" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "tokenId" TEXT NOT NULL,
    "targetDescriptor" TEXT NOT NULL,
    "platforms" JSONB NOT NULL,
    "openerContext" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OutreachIntake_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProspectScrape" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "tokenId" TEXT NOT NULL,
    "urlKey" TEXT NOT NULL,
    "urlRaw" TEXT NOT NULL,
    "pages" JSONB NOT NULL,
    "extract" JSONB NOT NULL,
    "model" TEXT NOT NULL DEFAULT 'gpt-4o-mini',
    "scrapedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProspectScrape_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OutreachMessage" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "tokenId" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "kind" TEXT NOT NULL DEFAULT 'initial',
    "groundingLevel" TEXT NOT NULL,
    "grounding" JSONB,
    "prospectLabel" TEXT,
    "subject" TEXT,
    "body" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OutreachMessage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "OutreachIntake_projectId_key" ON "OutreachIntake"("projectId");

-- CreateIndex
CREATE INDEX "OutreachIntake_userId_idx" ON "OutreachIntake"("userId");

-- CreateIndex
CREATE INDEX "OutreachIntake_tokenId_idx" ON "OutreachIntake"("tokenId");

-- CreateIndex
CREATE INDEX "ProspectScrape_tokenId_idx" ON "ProspectScrape"("tokenId");

-- CreateIndex
CREATE UNIQUE INDEX "ProspectScrape_projectId_urlKey_key" ON "ProspectScrape"("projectId", "urlKey");

-- CreateIndex
CREATE INDEX "OutreachMessage_userId_createdAt_idx" ON "OutreachMessage"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "OutreachMessage_tokenId_createdAt_idx" ON "OutreachMessage"("tokenId", "createdAt");

-- AddForeignKey
ALTER TABLE "OutreachIntake" ADD CONSTRAINT "OutreachIntake_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProspectScrape" ADD CONSTRAINT "ProspectScrape_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OutreachMessage" ADD CONSTRAINT "OutreachMessage_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
