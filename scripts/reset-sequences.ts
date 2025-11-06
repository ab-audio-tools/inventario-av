import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';

// Carica le variabili d'ambiente
dotenv.config();

// Verifica che DATABASE_URL sia impostato
if (!process.env.DATABASE_URL) {
  console.error('❌ DATABASE_URL not found in environment variables');
  process.exit(1);
}

console.log('Using DATABASE_URL:', process.env.DATABASE_URL.substring(0, 20) + '...');

const prisma = new PrismaClient();

async function resetSequences() {
  try {
    console.log('Resetting database sequences...\n');

    // Reset sequence for Category
    await prisma.$executeRawUnsafe(`
      SELECT setval(pg_get_serial_sequence('"Category"', 'id'), COALESCE((SELECT MAX(id) FROM "Category"), 1), true);
    `);
    console.log('✓ Category sequence reset');
    
    // Reset sequence for Item
    await prisma.$executeRawUnsafe(`
      SELECT setval(pg_get_serial_sequence('"Item"', 'id'), COALESCE((SELECT MAX(id) FROM "Item"), 1), true);
    `);
    console.log('✓ Item sequence reset');
    
    // Reset sequence for Set
    await prisma.$executeRawUnsafe(`
      SELECT setval(pg_get_serial_sequence('"Set"', 'id'), COALESCE((SELECT MAX(id) FROM "Set"), 1), true);
    `);
    console.log('✓ Set sequence reset');
    
    // Reset sequence for User
    await prisma.$executeRawUnsafe(`
      SELECT setval(pg_get_serial_sequence('"User"', 'id'), COALESCE((SELECT MAX(id) FROM "User"), 1), true);
    `);
    console.log('✓ User sequence reset');

    // Reset sequence for Transaction
    await prisma.$executeRawUnsafe(`
      SELECT setval(pg_get_serial_sequence('"Transaction"', 'id'), COALESCE((SELECT MAX(id) FROM "Transaction"), 1), true);
    `);
    console.log('✓ Transaction sequence reset');

    // Reset sequence for ProductionCheckout
    await prisma.$executeRawUnsafe(`
      SELECT setval(pg_get_serial_sequence('"ProductionCheckout"', 'id'), COALESCE((SELECT MAX(id) FROM "ProductionCheckout"), 1), true);
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
