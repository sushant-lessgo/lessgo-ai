-- CreateTable
CREATE TABLE "SiteContext" (
    "id" TEXT NOT NULL,
    "urlKey" TEXT NOT NULL,
    "urlRaw" TEXT NOT NULL,
    "audienceType" TEXT NOT NULL DEFAULT 'product',
    "pages" JSONB NOT NULL,
    "extract" JSONB NOT NULL,
    "facts" JSONB NOT NULL,
    "excerpts" JSONB NOT NULL,
    "model" TEXT NOT NULL DEFAULT 'gpt-4o-mini',
    "version" INTEGER NOT NULL DEFAULT 1,
    "scrapedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SiteContext_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SiteContext_urlKey_idx" ON "SiteContext"("urlKey");

-- CreateIndex
CREATE UNIQUE INDEX "SiteContext_urlKey_audienceType_key" ON "SiteContext"("urlKey", "audienceType");
