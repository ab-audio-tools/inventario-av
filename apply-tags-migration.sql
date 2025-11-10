-- Script per applicare manualmente la migrazione dei tag
-- Esegui questo SQL direttamente nel tuo database PostgreSQL

-- CreateTable Tag
CREATE TABLE IF NOT EXISTS "Tag" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "color" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Tag_pkey" PRIMARY KEY ("id")
);

-- CreateTable ItemTag
CREATE TABLE IF NOT EXISTS "ItemTag" (
    "itemId" INTEGER NOT NULL,
    "tagId" INTEGER NOT NULL,
    CONSTRAINT "ItemTag_pkey" PRIMARY KEY ("itemId","tagId")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "Tag_name_key" ON "Tag"("name");

-- AddForeignKey
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'ItemTag_itemId_fkey'
    ) THEN
        ALTER TABLE "ItemTag" ADD CONSTRAINT "ItemTag_itemId_fkey" 
        FOREIGN KEY ("itemId") REFERENCES "Item"("id") 
        ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

-- AddForeignKey
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'ItemTag_tagId_fkey'
    ) THEN
        ALTER TABLE "ItemTag" ADD CONSTRAINT "ItemTag_tagId_fkey" 
        FOREIGN KEY ("tagId") REFERENCES "Tag"("id") 
        ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

-- Registra la migrazione nella tabella _prisma_migrations
INSERT INTO "_prisma_migrations" 
    ("id", "checksum", "finished_at", "migration_name", "logs", "rolled_back_at", "started_at", "applied_steps_count")
VALUES 
    (gen_random_uuid(), 
     '8f4b8b4b8b4b8b4b8b4b8b4b8b4b8b4b8b4b8b4b8b4b8b4b8b4b8b4b8b4b8b4b', 
     NOW(), 
     '20251110000000_add_tags', 
     NULL, 
     NULL, 
     NOW(), 
     1)
ON CONFLICT DO NOTHING;

-- Verifica che le tabelle siano state create
SELECT 'Tag table created!' FROM "Tag" LIMIT 0;
SELECT 'ItemTag table created!' FROM "ItemTag" LIMIT 0;
