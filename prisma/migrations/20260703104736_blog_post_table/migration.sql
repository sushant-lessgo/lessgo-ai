-- AlterTable
ALTER TABLE "PublishedPage" ADD COLUMN     "blogIndex" JSONB;

-- CreateTable
CREATE TABLE "BlogPost" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "excerpt" TEXT,
    "heroImage" TEXT,
    "body" JSONB NOT NULL,
    "seo" JSONB,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "publishedAt" TIMESTAMP(3),
    "firstPublishedAt" TIMESTAMP(3),
    "publishedVersion" TEXT,
    "blobKey" TEXT,
    "blobUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BlogPost_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "BlogPost_projectId_status_idx" ON "BlogPost"("projectId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "BlogPost_projectId_slug_key" ON "BlogPost"("projectId", "slug");

-- AddForeignKey
ALTER TABLE "BlogPost" ADD CONSTRAINT "BlogPost_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
