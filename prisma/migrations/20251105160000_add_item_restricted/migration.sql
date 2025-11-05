-- Add restricted flag to Item for visibility control
ALTER TABLE "Item"
ADD COLUMN "restricted" BOOLEAN NOT NULL DEFAULT false;


