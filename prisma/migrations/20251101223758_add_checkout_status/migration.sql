-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_ProductionCheckout" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "productionName" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "surname" TEXT NOT NULL,
    "ente" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "telephone" TEXT NOT NULL,
    "pickupDate" DATETIME NOT NULL,
    "restitutionDate" DATETIME NOT NULL,
    "techPerson" TEXT,
    "type" TEXT NOT NULL DEFAULT 'CHECKOUT',
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "userId" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ProductionCheckout_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_ProductionCheckout" ("createdAt", "email", "ente", "id", "name", "pickupDate", "productionName", "restitutionDate", "surname", "techPerson", "telephone", "type", "updatedAt", "userId") SELECT "createdAt", "email", "ente", "id", "name", "pickupDate", "productionName", "restitutionDate", "surname", "techPerson", "telephone", "type", "updatedAt", "userId" FROM "ProductionCheckout";
DROP TABLE "ProductionCheckout";
ALTER TABLE "new_ProductionCheckout" RENAME TO "ProductionCheckout";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
