-- AlterTable: add nullable categoryId to Set
ALTER TABLE "Set" ADD COLUMN "categoryId" INTEGER;

-- AddForeignKey
ALTER TABLE "Set"
ADD CONSTRAINT "Set_categoryId_fkey"
FOREIGN KEY ("categoryId") REFERENCES "Category"("id")
ON DELETE SET NULL ON UPDATE CASCADE;
