-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Item" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "brand" TEXT,
    "model" TEXT,
    "name" TEXT,
    "typology" TEXT,
    "sku" TEXT,
    "description" TEXT,
    "imageUrl" TEXT,
    "quantity" INTEGER NOT NULL DEFAULT 0,
    "categoryId" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Item_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Item" ("categoryId", "createdAt", "description", "id", "imageUrl", "name", "quantity", "sku", "updatedAt") SELECT "categoryId", "createdAt", "description", "id", "imageUrl", "name", "quantity", "sku", "updatedAt" FROM "Item";
DROP TABLE "Item";
ALTER TABLE "new_Item" RENAME TO "Item";
CREATE UNIQUE INDEX "Item_sku_key" ON "Item"("sku");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
