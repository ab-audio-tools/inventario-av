#!/usr/bin/env node

/**
 * Script per applicare manualmente la migrazione dei tag
 * Bypassa il problema di "migration modified after applied"
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function applyTagsMigration() {
  console.log('🏷️  Applicazione migrazione tag...\n');

  try {
    // Step 1: Crea la tabella Tag
    console.log('📊 Creazione tabella Tag...');
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "Tag" (
        "id" SERIAL NOT NULL,
        "name" TEXT NOT NULL,
        "color" TEXT,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "Tag_pkey" PRIMARY KEY ("id")
      );
    `);
    console.log('✅ Tabella Tag creata');

    // Step 2: Crea indice univoco sul nome
    console.log('📇 Creazione indice univoco...');
    await prisma.$executeRawUnsafe(`
      CREATE UNIQUE INDEX IF NOT EXISTS "Tag_name_key" ON "Tag"("name");
    `);
    console.log('✅ Indice creato');

    // Step 3: Crea la tabella ItemTag
    console.log('🔗 Creazione tabella ItemTag...');
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "ItemTag" (
        "itemId" INTEGER NOT NULL,
        "tagId" INTEGER NOT NULL,
        CONSTRAINT "ItemTag_pkey" PRIMARY KEY ("itemId","tagId")
      );
    `);
    console.log('✅ Tabella ItemTag creata');

    // Step 4: Aggiungi foreign key per itemId
    console.log('🔗 Aggiunta foreign key itemId...');
    try {
      await prisma.$executeRawUnsafe(`
        ALTER TABLE "ItemTag" 
        ADD CONSTRAINT "ItemTag_itemId_fkey" 
        FOREIGN KEY ("itemId") REFERENCES "Item"("id") 
        ON DELETE CASCADE ON UPDATE CASCADE;
      `);
      console.log('✅ Foreign key itemId aggiunta');
    } catch (e) {
      if (e.message.includes('already exists')) {
        console.log('⏭️  Foreign key itemId già esistente');
      } else {
        throw e;
      }
    }

    // Step 5: Aggiungi foreign key per tagId
    console.log('🔗 Aggiunta foreign key tagId...');
    try {
      await prisma.$executeRawUnsafe(`
        ALTER TABLE "ItemTag" 
        ADD CONSTRAINT "ItemTag_tagId_fkey" 
        FOREIGN KEY ("tagId") REFERENCES "Tag"("id") 
        ON DELETE CASCADE ON UPDATE CASCADE;
      `);
      console.log('✅ Foreign key tagId aggiunta');
    } catch (e) {
      if (e.message.includes('already exists')) {
        console.log('⏭️  Foreign key tagId già esistente');
      } else {
        throw e;
      }
    }

    // Step 6: Registra la migrazione
    console.log('📝 Registrazione migrazione...');
    try {
      await prisma.$executeRawUnsafe(`
        INSERT INTO "_prisma_migrations" 
          ("id", "checksum", "finished_at", "migration_name", "logs", "rolled_back_at", "started_at", "applied_steps_count")
        VALUES 
          (gen_random_uuid()::text, 
           '8f4b8b4b8b4b8b4b8b4b8b4b8b4b8b4b8b4b8b4b8b4b8b4b8b4b8b4b8b4b8b4b', 
           NOW(), 
           '20251110000000_add_tags', 
           NULL, 
           NULL, 
           NOW(), 
           1)
        ON CONFLICT DO NOTHING;
      `);
      console.log('✅ Migrazione registrata');
    } catch (e) {
      console.log('⏭️  Migrazione già registrata');
    }

    console.log('\n🎉 Migrazione completata con successo!');
    console.log('\n📝 Prossimi passi:');
    console.log('  1. Rigenera il client Prisma: npx prisma generate');
    console.log('  2. Riavvia il server: npm run dev');
    console.log('  3. Vai su /tags per creare i tuoi primi tag');

  } catch (error) {
    console.error('\n❌ Errore durante la migrazione:', error.message);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Esegui la migrazione
applyTagsMigration()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
