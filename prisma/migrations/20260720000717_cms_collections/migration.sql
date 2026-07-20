-- CreateTable
CREATE TABLE "Collection" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "tokenId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "fieldSchema" JSONB NOT NULL,
    "roles" JSONB NOT NULL,
    "detailPages" BOOLEAN NOT NULL DEFAULT false,
    "layoutHint" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Collection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CollectionGroup" (
    "id" TEXT NOT NULL,
    "collectionId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "CollectionGroup_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CollectionItem" (
    "id" TEXT NOT NULL,
    "collectionId" TEXT NOT NULL,
    "groupId" TEXT,
    "slug" TEXT NOT NULL,
    "values" JSONB NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "slugLocked" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CollectionItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Collection_tokenId_order_idx" ON "Collection"("tokenId", "order");

-- CreateIndex
CREATE INDEX "Collection_projectId_idx" ON "Collection"("projectId");

-- CreateIndex
CREATE UNIQUE INDEX "Collection_tokenId_slug_key" ON "Collection"("tokenId", "slug");

-- CreateIndex
CREATE INDEX "CollectionGroup_collectionId_order_idx" ON "CollectionGroup"("collectionId", "order");

-- CreateIndex
CREATE INDEX "CollectionItem_collectionId_order_idx" ON "CollectionItem"("collectionId", "order");

-- CreateIndex
CREATE INDEX "CollectionItem_groupId_idx" ON "CollectionItem"("groupId");

-- CreateIndex
CREATE UNIQUE INDEX "CollectionItem_collectionId_slug_key" ON "CollectionItem"("collectionId", "slug");

-- AddForeignKey
ALTER TABLE "Collection" ADD CONSTRAINT "Collection_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CollectionGroup" ADD CONSTRAINT "CollectionGroup_collectionId_fkey" FOREIGN KEY ("collectionId") REFERENCES "Collection"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CollectionItem" ADD CONSTRAINT "CollectionItem_collectionId_fkey" FOREIGN KEY ("collectionId") REFERENCES "Collection"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CollectionItem" ADD CONSTRAINT "CollectionItem_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "CollectionGroup"("id") ON DELETE SET NULL ON UPDATE CASCADE;
