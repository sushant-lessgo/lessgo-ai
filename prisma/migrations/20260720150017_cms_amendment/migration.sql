-- AlterTable
ALTER TABLE "Collection" ADD COLUMN     "listingPage" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "purposes" JSONB NOT NULL DEFAULT '[]';

-- AlterTable
ALTER TABLE "CollectionItem" ADD COLUMN     "featuredOnHome" BOOLEAN NOT NULL DEFAULT false;
