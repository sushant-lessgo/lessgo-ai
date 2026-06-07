-- Rename projectType -> audienceType and add template/variant fields (Phase 7.5a)
-- Dev/test only; nothing in production. Standard additive + rename.

ALTER TABLE "Project" RENAME COLUMN "projectType" TO "audienceType";
ALTER TABLE "Project" ADD COLUMN "templateId" TEXT;
ALTER TABLE "Project" ADD COLUMN "variantId" TEXT;

ALTER TABLE "PublishedPage" RENAME COLUMN "projectType" TO "audienceType";
ALTER TABLE "PublishedPage" ADD COLUMN "templateId" TEXT;
ALTER TABLE "PublishedPage" ADD COLUMN "variantId" TEXT;

-- Dev/test backfill: existing service rows get the Hearth defaults.
UPDATE "Project" SET "templateId" = 'hearth', "variantId" = 'classic' WHERE "audienceType" = 'service';
UPDATE "PublishedPage" SET "templateId" = 'hearth', "variantId" = 'classic' WHERE "audienceType" = 'service';
