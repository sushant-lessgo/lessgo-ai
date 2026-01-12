-- CreateTable
CREATE TABLE "PublishedPageVersion" (
    "id" TEXT NOT NULL,
    "publishedPageId" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "blobKey" TEXT NOT NULL,
    "blobUrl" TEXT NOT NULL,
    "sizeBytes" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PublishedPageVersion_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "PublishedPage" ADD COLUMN IF NOT EXISTS "publishState" TEXT NOT NULL DEFAULT 'draft';
ALTER TABLE "PublishedPage" ADD COLUMN IF NOT EXISTS "currentVersionId" TEXT;
ALTER TABLE "PublishedPage" ADD COLUMN IF NOT EXISTS "lastPublishAt" TIMESTAMP(3);
ALTER TABLE "PublishedPage" ADD COLUMN IF NOT EXISTS "publishError" TEXT;
ALTER TABLE "PublishedPage" ADD COLUMN IF NOT EXISTS "analyticsEnabled" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "PublishedPageVersion_publishedPageId_version_key" ON "PublishedPageVersion"("publishedPageId", "version");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "PublishedPageVersion_publishedPageId_idx" ON "PublishedPageVersion"("publishedPageId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "PublishedPageVersion_createdAt_idx" ON "PublishedPageVersion"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "PublishedPage_currentVersionId_key" ON "PublishedPage"("currentVersionId");

-- AddForeignKey
ALTER TABLE "PublishedPage" ADD CONSTRAINT "PublishedPage_currentVersionId_fkey" FOREIGN KEY ("currentVersionId") REFERENCES "PublishedPageVersion"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PublishedPageVersion" ADD CONSTRAINT "PublishedPageVersion_publishedPageId_fkey" FOREIGN KEY ("publishedPageId") REFERENCES "PublishedPage"("id") ON DELETE CASCADE ON UPDATE CASCADE;
