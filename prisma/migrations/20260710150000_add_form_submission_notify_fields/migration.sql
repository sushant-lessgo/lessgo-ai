-- AlterTable
ALTER TABLE "FormSubmission" ADD COLUMN     "notifiedAt" TIMESTAMP(3),
ADD COLUMN     "notifyError" TEXT;
