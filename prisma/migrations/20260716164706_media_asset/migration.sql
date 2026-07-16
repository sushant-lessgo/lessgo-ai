-- CreateEnum
CREATE TYPE "MediaSource" AS ENUM ('upload', 'stock', 'scrape');

-- CreateTable
CREATE TABLE "MediaAsset" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "tokenId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "source" "MediaSource" NOT NULL,
    "sourceUrl" TEXT,
    "width" INTEGER,
    "height" INTEGER,
    "bytes" INTEGER NOT NULL,
    "format" TEXT NOT NULL,
    "blurDataUrl" TEXT,
    "checksum" TEXT,
    "alt" TEXT,
    "hiddenAt" TIMESTAMP(3),
    "groupId" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "selected" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MediaAsset_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MediaAsset_tokenId_createdAt_idx" ON "MediaAsset"("tokenId", "createdAt");

-- CreateIndex
CREATE INDEX "MediaAsset_projectId_idx" ON "MediaAsset"("projectId");

-- CreateIndex
CREATE INDEX "MediaAsset_groupId_idx" ON "MediaAsset"("groupId");

-- CreateIndex
CREATE INDEX "MediaAsset_projectId_checksum_idx" ON "MediaAsset"("projectId", "checksum");

-- CreateIndex
CREATE UNIQUE INDEX "MediaAsset_tokenId_url_key" ON "MediaAsset"("tokenId", "url");

-- AddForeignKey
ALTER TABLE "MediaAsset" ADD CONSTRAINT "MediaAsset_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
