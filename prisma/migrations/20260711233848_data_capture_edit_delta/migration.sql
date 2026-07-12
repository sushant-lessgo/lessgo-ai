-- AlterTable
ALTER TABLE "Project" ADD COLUMN     "aiBaseline" JSONB;

-- CreateTable
CREATE TABLE "EditDelta" (
    "id" TEXT NOT NULL,
    "projectToken" TEXT NOT NULL,
    "sectionId" TEXT NOT NULL,
    "sectionType" TEXT NOT NULL,
    "elementKey" TEXT NOT NULL,
    "aiText" TEXT NOT NULL,
    "userText" TEXT NOT NULL,
    "editDistance" INTEGER NOT NULL,
    "templateId" TEXT,
    "audienceType" TEXT,
    "isFounderEdit" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EditDelta_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "EditDelta_projectToken_sectionId_elementKey_key" ON "EditDelta"("projectToken", "sectionId", "elementKey");

-- AddForeignKey
ALTER TABLE "EditDelta" ADD CONSTRAINT "EditDelta_projectToken_fkey" FOREIGN KEY ("projectToken") REFERENCES "Project"("tokenId") ON DELETE CASCADE ON UPDATE CASCADE;

