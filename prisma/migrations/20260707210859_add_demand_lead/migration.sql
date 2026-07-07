-- CreateTable
CREATE TABLE "DemandLead" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "input" TEXT NOT NULL,
    "briefDraft" JSONB NOT NULL,
    "missing" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "fasttrack" BOOLEAN NOT NULL DEFAULT false,
    "status" TEXT NOT NULL DEFAULT 'new',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DemandLead_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DemandLead_status_createdAt_idx" ON "DemandLead"("status", "createdAt");

-- CreateIndex
CREATE INDEX "DemandLead_missing_idx" ON "DemandLead"("missing");

-- CreateIndex
CREATE INDEX "DemandLead_userId_idx" ON "DemandLead"("userId");
