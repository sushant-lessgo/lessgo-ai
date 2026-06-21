-- Multi-page Phase 1 schema, reconciled idempotently (db-push drift).
--
-- These were added to schema.prisma in Phase 1 WITHOUT a migration, so the
-- migration history is behind the schema. On databases that were `db push`ed
-- during local testing they may already exist; on a clean prod DB they do not.
-- `IF NOT EXISTS` (+ a guarded FK) makes `prisma migrate deploy` safe in BOTH
-- cases, mirroring the earlier reconcile_dbpush_drift migration.

-- 1) PublishedPageVersion.metadata — WRITTEN by the multi-page publish loop
--    (api/publish/route.ts: metadata.blobs[]). Required for publishing to work.
ALTER TABLE "PublishedPageVersion" ADD COLUMN IF NOT EXISTS "metadata" JSONB;

-- 2) ProjectPage — present in schema for the uniform page model. Currently UNUSED
--    (multi-page data lives in Project.content JSON); created for schema/DB/
--    migration consistency so a future `migrate dev` won't generate a spurious one.
CREATE TABLE IF NOT EXISTS "ProjectPage" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "archetypeKey" TEXT NOT NULL DEFAULT 'basic',
    "pathSlug" TEXT NOT NULL,
    "title" TEXT NOT NULL DEFAULT 'Untitled Page',
    "order" INTEGER NOT NULL DEFAULT 0,
    "content" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ProjectPage_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "ProjectPage_projectId_pathSlug_key" ON "ProjectPage"("projectId", "pathSlug");
CREATE INDEX IF NOT EXISTS "ProjectPage_projectId_idx" ON "ProjectPage"("projectId");

-- FK (Postgres has no ADD CONSTRAINT IF NOT EXISTS — guard it).
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'ProjectPage_projectId_fkey'
  ) THEN
    ALTER TABLE "ProjectPage"
      ADD CONSTRAINT "ProjectPage_projectId_fkey"
      FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
