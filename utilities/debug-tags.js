#!/usr/bin/env node

/**
 * Script di debug per verificare che i tag siano correttamente salvati negli items
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function debugTags() {
  console.log('🔍 Debug Tag System\n');

  try {
    // 1. Conta tag disponibili
    const tagCount = await prisma.tag.count();
    console.log(`📊 Tag disponibili: ${tagCount}`);
    
    if (tagCount > 0) {
      const tags = await prisma.tag.findMany();
      console.log('Tag:');
      tags.forEach(tag => {
        console.log(`  - ${tag.name} (ID: ${tag.id}, Colore: ${tag.color})`);
      });
    }

    // 2. Controlla quanti items hanno tag
    const itemsWithTags = await prisma.item.findMany({
      include: {
        tags: {
          include: {
            tag: true,
          },
        },
      },
    });

    const itemsHavingTags = itemsWithTags.filter(item => item.tags.length > 0);
    console.log(`\n📦 Items con tag: ${itemsHavingTags.length} / ${itemsWithTags.length}`);

    if (itemsHavingTags.length > 0) {
      console.log('\nArticoli con tag:');
      itemsHavingTags.forEach(item => {
        const title = item.name || `${item.brand} ${item.model}`;
        const tagNames = item.tags.map(t => t.tag.name).join(', ');
        console.log(`  - ${title} → [${tagNames}]`);
      });
    }

    // 3. Controlla relazioni ItemTag
    const itemTagCount = await prisma.itemTag.count();
    console.log(`\n🔗 Relazioni ItemTag totali: ${itemTagCount}`);

    // 4. Mostra esempio query con tags
    if (itemsWithTags.length > 0) {
      const firstItem = itemsWithTags[0];
      console.log('\n📋 Esempio item con struttura completa:');
      console.log(JSON.stringify({
        id: firstItem.id,
        name: firstItem.name,
        brand: firstItem.brand,
        model: firstItem.model,
        tags: firstItem.tags.map(t => ({
          tagId: t.tag.id,
          tagName: t.tag.name,
          tagColor: t.tag.color,
        })),
      }, null, 2));
    }

    console.log('\n✅ Debug completato!');

    if (tagCount === 0) {
      console.log('\n⚠️  Nessun tag trovato. Crea i primi tag su /tags');
    }

    if (itemsHavingTags.length === 0 && tagCount > 0) {
      console.log('\n⚠️  I tag esistono ma nessun articolo li usa ancora.');
      console.log('   Prova a:');
      console.log('   1. Modificare un articolo');
      console.log('   2. Selezionare uno o più tag');
      console.log('   3. Salvare');
    }

  } catch (error) {
    console.error('\n❌ Errore:', error.message);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

debugTags()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
