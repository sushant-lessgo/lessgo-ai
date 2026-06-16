-- Rename projectType -> audienceType and add template/variant fields (Phase 7.5a)
-- Condition-aware: works whether or not "projectType" exists.
--   - DB that has "projectType" (dev/legacy): rename it -> "audienceType".
--   - DB without it (prod / fresh): add "audienceType" with default.
-- All steps are IF [NOT] EXISTS guarded -> idempotent, safe to re-run, no data loss.

-- Project.audienceType
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_name = 'Project' AND column_name = 'projectType') THEN
    ALTER TABLE "Project" RENAME COLUMN "projectType" TO "audienceType";
  ELSIF NOT EXISTS (SELECT 1 FROM information_schema.columns
                    WHERE table_name = 'Project' AND column_name = 'audienceType') THEN
    ALTER TABLE "Project" ADD COLUMN "audienceType" TEXT NOT NULL DEFAULT 'product';
  END IF;
END $$;
ALTER TABLE "Project" ADD COLUMN IF NOT EXISTS "templateId" TEXT;
ALTER TABLE "Project" ADD COLUMN IF NOT EXISTS "variantId" TEXT;

-- PublishedPage.audienceType
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_name = 'PublishedPage' AND column_name = 'projectType') THEN
    ALTER TABLE "PublishedPage" RENAME COLUMN "projectType" TO "audienceType";
  ELSIF NOT EXISTS (SELECT 1 FROM information_schema.columns
                    WHERE table_name = 'PublishedPage' AND column_name = 'audienceType') THEN
    ALTER TABLE "PublishedPage" ADD COLUMN "audienceType" TEXT NOT NULL DEFAULT 'product';
  END IF;
END $$;
ALTER TABLE "PublishedPage" ADD COLUMN IF NOT EXISTS "templateId" TEXT;
ALTER TABLE "PublishedPage" ADD COLUMN IF NOT EXISTS "variantId" TEXT;

-- Dev/test backfill: existing service rows get the Hearth defaults.
UPDATE "Project" SET "templateId" = 'hearth', "variantId" = 'classic' WHERE "audienceType" = 'service';
UPDATE "PublishedPage" SET "templateId" = 'hearth', "variantId" = 'classic' WHERE "audienceType" = 'service';
