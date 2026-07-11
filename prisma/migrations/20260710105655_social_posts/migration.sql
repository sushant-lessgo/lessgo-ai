-- AlterTable
ALTER TABLE "UserPlan" ADD COLUMN     "socialPostsLimit" INTEGER NOT NULL DEFAULT 10;

-- CreateTable
CREATE TABLE "SocialPost" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "tokenId" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "archetype" TEXT,
    "mode" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SocialPost_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SocialPost_userId_createdAt_idx" ON "SocialPost"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "SocialPost_tokenId_createdAt_idx" ON "SocialPost"("tokenId", "createdAt");

-- AddForeignKey
ALTER TABLE "SocialPost" ADD CONSTRAINT "SocialPost_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- these values must equal PLAN_CONFIGS[*].limits.socialPosts (see phase 7)
UPDATE "UserPlan" SET "socialPostsLimit" = 300 WHERE "tier" = 'PRO';
UPDATE "UserPlan" SET "socialPostsLimit" = -1 WHERE "tier" IN ('AGENCY','ENTERPRISE');
