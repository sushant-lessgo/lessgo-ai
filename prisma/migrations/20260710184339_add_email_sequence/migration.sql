-- CreateTable
CREATE TABLE "EmailSequence" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "tokenId" TEXT NOT NULL,
    "intent" TEXT NOT NULL,
    "archetype" TEXT NOT NULL,
    "emails" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EmailSequence_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "EmailSequence_projectId_key" ON "EmailSequence"("projectId");

-- CreateIndex
CREATE INDEX "EmailSequence_userId_idx" ON "EmailSequence"("userId");

-- CreateIndex
CREATE INDEX "EmailSequence_tokenId_idx" ON "EmailSequence"("tokenId");

-- AddForeignKey
ALTER TABLE "EmailSequence" ADD CONSTRAINT "EmailSequence_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
