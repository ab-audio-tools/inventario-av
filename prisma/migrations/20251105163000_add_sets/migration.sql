-- Create sets and set items
CREATE TABLE "Set" (
  "id" SERIAL PRIMARY KEY,
  "name" TEXT NOT NULL,
  "imageUrl" TEXT,
  "restricted" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL
);

CREATE TABLE "SetItem" (
  "setId" INTEGER NOT NULL,
  "itemId" INTEGER NOT NULL,
  "qty" INTEGER NOT NULL,
  CONSTRAINT "SetItem_pkey" PRIMARY KEY ("setId", "itemId"),
  CONSTRAINT "SetItem_setId_fkey" FOREIGN KEY ("setId") REFERENCES "Set"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "SetItem_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "Item"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);


