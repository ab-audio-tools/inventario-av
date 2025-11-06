-- DropForeignKey
ALTER TABLE "public"."SetItem" DROP CONSTRAINT "SetItem_setId_fkey";

-- AlterTable
ALTER TABLE "Transaction" ADD COLUMN     "setId" INTEGER,
ADD COLUMN     "setName" TEXT;

-- AddForeignKey
ALTER TABLE "SetItem" ADD CONSTRAINT "SetItem_setId_fkey" FOREIGN KEY ("setId") REFERENCES "Set"("id") ON DELETE RESTRICT ON UPDATE CASCADE;