-- CreateTable
CREATE TABLE "BlogSubscriber" (
    "id" TEXT NOT NULL,
    "publishedPageId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'subscribed',
    "token" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BlogSubscriber_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "BlogSubscriber_token_key" ON "BlogSubscriber"("token");

-- CreateIndex
CREATE INDEX "BlogSubscriber_publishedPageId_status_idx" ON "BlogSubscriber"("publishedPageId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "BlogSubscriber_publishedPageId_email_key" ON "BlogSubscriber"("publishedPageId", "email");
