-- AlterTable
ALTER TABLE "UserPlan" ADD COLUMN     "creditPool" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "lifetimeDeal" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "ltdCohort" INTEGER,
ADD COLUMN     "ltdPricePaid" INTEGER;

