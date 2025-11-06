import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function resetSequences() {
  try {
    console.log('Resetting database sequences...');

    // Reset sequence for Category
    await prisma.$executeRawUnsafe(`
      SELECT setval(pg_get_serial_sequence('"Category"', 'id'), COALESCE(MAX(id), 1)) 
      FROM "Category"
    `);
    console.log('✓ Category sequence reset');
    
    // Reset sequence for Item
    await prisma.$executeRawUnsafe(`
      SELECT setval(pg_get_serial_sequence('"Item"', 'id'), COALESCE(MAX(id), 1)) 
      FROM "Item"
    `);
    console.log('✓ Item sequence reset');
    
    // Reset sequence for Set
    await prisma.$executeRawUnsafe(`
      SELECT setval(pg_get_serial_sequence('"Set"', 'id'), COALESCE(MAX(id), 1)) 
      FROM "Set"
    `);
    console.log('✓ Set sequence reset');
    
    // Reset sequence for User
    await prisma.$executeRawUnsafe(`
      SELECT setval(pg_get_serial_sequence('"User"', 'id'), COALESCE(MAX(id), 1)) 
      FROM "User"
    `);
    console.log('✓ User sequence reset');

    // Reset sequence for Transaction
    await prisma.$executeRawUnsafe(`
      SELECT setval(pg_get_serial_sequence('"Transaction"', 'id'), COALESCE(MAX(id), 1)) 
      FROM "Transaction"
    `);
    console.log('✓ Transaction sequence reset');

    // Reset sequence for ProductionCheckout
    await prisma.$executeRawUnsafe(`
      SELECT setval(pg_get_serial_sequence('"ProductionCheckout"', 'id'), COALESCE(MAX(id), 1)) 
      FROM "ProductionCheckout"
    `);
    console.log('✓ ProductionCheckout sequence reset');
    
    console.log('\n✅ All sequences reset successfully');
  } catch (error) {
    console.error('❌ Error resetting sequences:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

resetSequences();
