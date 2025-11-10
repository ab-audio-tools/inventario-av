#!/usr/bin/env node

/**
 * Script di test per verificare che le tabelle Tag siano state create correttamente
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testTagsSetup() {
  console.log('🧪 Test configurazione Tag...\n');

  try {
    // Test 1: Verifica che la tabella Tag esista
    console.log('1️⃣ Verifica tabella Tag...');
    const tagCount = await prisma.tag.count();
    console.log(`✅ Tabella Tag OK (${tagCount} tag presenti)`);

    // Test 2: Verifica che la tabella ItemTag esista
    console.log('\n2️⃣ Verifica tabella ItemTag...');
    const itemTagCount = await prisma.itemTag.count();
    console.log(`✅ Tabella ItemTag OK (${itemTagCount} relazioni presenti)`);

    // Test 3: Prova a creare un tag di test
    console.log('\n3️⃣ Test creazione tag...');
    const testTag = await prisma.tag.upsert({
      where: { name: '__TEST_TAG__' },
      update: {},
      create: {
        name: '__TEST_TAG__',
        color: '#3b82f6',
      },
    });
    console.log(`✅ Tag di test creato (ID: ${testTag.id})`);

    // Test 4: Elimina il tag di test
    console.log('\n4️⃣ Test eliminazione tag...');
    await prisma.tag.delete({
      where: { id: testTag.id },
    });
    console.log('✅ Tag di test eliminato');

    // Test 5: Verifica la relazione con Item
    console.log('\n5️⃣ Verifica relazione Item-Tag...');
    const items = await prisma.item.findMany({
      include: {
        tags: {
          include: {
            tag: true,
          },
        },
      },
      take: 1,
    });
    console.log(`✅ Query con relazione tags OK (${items.length} articoli testati)`);

    console.log('\n🎉 Tutti i test superati!');
    console.log('\n📝 Il sistema tag è pronto per l\'uso!');
    console.log('\nProssimi passi:');
    console.log('  1. Riavvia VS Code per eliminare errori TypeScript');
    console.log('  2. Avvia il server: npm run dev');
    console.log('  3. Vai su /tags per creare i primi tag');

  } catch (error) {
    console.error('\n❌ Errore durante i test:', error.message);
    
    if (error.message.includes('tag')) {
      console.error('\n💡 Suggerimento: Il client Prisma potrebbe non essere aggiornato.');
      console.error('   Prova a eseguire: node_modules/.bin/prisma generate');
    }
    
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Esegui i test
testTagsSetup()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
