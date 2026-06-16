-- Reconcile schema drift: capture columns/tables/indexes that reached dev (and partly prod)
-- via `prisma db push` but were never recorded in a migration file. Because of this, fresh
-- DBs and prod (which only run `migrate deploy`) lagged behind schema.prisma.
--
-- Every statement is idempotent (IF [NOT] EXISTS / SET DEFAULT) so this is a safe no-op on
-- dev (already has everything), adds the 3 missing nullable cols to prod, and fully creates
-- the rest on any fresh database. No data loss.

-- Project.paletteId
ALTER TABLE "Project" ADD COLUMN IF NOT EXISTS "paletteId" TEXT;

-- PublishedPage: paletteId + custom-domain fields (Phase 5)
ALTER TABLE "PublishedPage"
  ADD COLUMN IF NOT EXISTS "paletteId" TEXT,
  ADD COLUMN IF NOT EXISTS "customDomain" TEXT,
  ADD COLUMN IF NOT EXISTS "customDomainStatus" TEXT,
  ADD COLUMN IF NOT EXISTS "customDomainKind" TEXT,
  ADD COLUMN IF NOT EXISTS "customDomainVercelId" TEXT,
  ADD COLUMN IF NOT EXISTS "customDomainOwnershipToken" TEXT,
  ADD COLUMN IF NOT EXISTS "customDomainOwnershipVerifiedAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "customDomainAddedAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "customDomainLiveAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "customDomainFailedAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "customDomainError" TEXT;

-- User.persona
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "persona" TEXT;

-- UserPlan default alignment
ALTER TABLE "UserPlan" ALTER COLUMN "customDomainsLimit" SET DEFAULT 1;

-- IVOCCache table
CREATE TABLE IF NOT EXISTS "IVOCCache" (
    "id" TEXT NOT NULL,
    "categoryKey" TEXT NOT NULL,
    "audienceKey" TEXT NOT NULL,
    "categoryRaw" TEXT NOT NULL,
    "audienceRaw" TEXT NOT NULL,
    "pains" JSONB NOT NULL,
    "desires" JSONB NOT NULL,
    "objections" JSONB NOT NULL,
    "firmBeliefs" JSONB NOT NULL,
    "shakableBeliefs" JSONB NOT NULL,
    "commonPhrases" JSONB NOT NULL,
    "query" TEXT NOT NULL,
    "rawSources" JSONB NOT NULL,
    "model" TEXT NOT NULL DEFAULT 'gpt-4o-mini',
    "version" INTEGER NOT NULL DEFAULT 1,
    "source" TEXT NOT NULL DEFAULT 'tavily',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "IVOCCache_pkey" PRIMARY KEY ("id")
);

-- Indexes
CREATE INDEX IF NOT EXISTS "IVOCCache_categoryKey_idx" ON "IVOCCache"("categoryKey");
CREATE INDEX IF NOT EXISTS "IVOCCache_audienceKey_idx" ON "IVOCCache"("audienceKey");
CREATE UNIQUE INDEX IF NOT EXISTS "IVOCCache_categoryKey_audienceKey_key" ON "IVOCCache"("categoryKey", "audienceKey");
CREATE UNIQUE INDEX IF NOT EXISTS "PublishedPage_customDomain_key" ON "PublishedPage"("customDomain");
