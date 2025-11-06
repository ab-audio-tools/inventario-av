import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function resetSequences() {
  try {
    // Reset sequence for Category
    await prisma.$executeRawUnsafe(`
      SELECT setval(pg_get_serial_sequence('"Category"', 'id'), COALESCE(MAX(id), 1)) 
      FROM "Category"
    `);
    
    // Reset sequence for Item
    await prisma.$executeRawUnsafe(`
      SELECT setval(pg_get_serial_sequence('"Item"', 'id'), COALESCE(MAX(id), 1)) 
      FROM "Item"
    `);
    
    // Reset sequence for Set
    await prisma.$executeRawUnsafe(`
      SELECT setval(pg_get_serial_sequence('"Set"', 'id'), COALESCE(MAX(id), 1)) 
      FROM "Set"
    `);
    
    // Reset sequence for User
    await prisma.$executeRawUnsafe(`
      SELECT setval(pg_get_serial_sequence('"User"', 'id'), COALESCE(MAX(id), 1)) 
      FROM "User"
    `);
    
    console.log('✓ Sequenze resettate con successo');
  } catch (error) {
    console.error('Errore nel reset delle sequenze:', error);
  } finally {
    await prisma.$disconnect();
  }
}

resetSequences();
