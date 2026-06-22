-- CreateTable
CREATE TABLE "CollectLink" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CollectLink_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CollectLink_token_key" ON "CollectLink"("token");

-- CreateIndex
CREATE UNIQUE INDEX "CollectLink_projectId_key" ON "CollectLink"("projectId");

-- CreateIndex
CREATE INDEX "CollectLink_userId_idx" ON "CollectLink"("userId");

-- AddForeignKey
ALTER TABLE "CollectLink" ADD CONSTRAINT "CollectLink_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

