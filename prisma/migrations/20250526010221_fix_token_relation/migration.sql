-- DropForeignKey
ALTER TABLE "Project" DROP CONSTRAINT "Project_tokenId_fkey";

-- AddForeignKey
ALTER TABLE "Project" ADD CONSTRAINT "Project_tokenId_fkey" FOREIGN KEY ("tokenId") REFERENCES "Token"("value") ON DELETE RESTRICT ON UPDATE CASCADE;
