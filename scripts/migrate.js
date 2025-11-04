const { PrismaClient } = require('@prisma/client');
const { execSync } = require('child_process');

async function runMigrations() {
  const prisma = new PrismaClient();

  try {
    console.log('Running database migrations...');

    // Run Prisma migrations
    execSync('npx prisma migrate deploy --schema=prisma/schema.prisma', {
      stdio: 'inherit',
      env: { ...process.env, DATABASE_URL: process.env.NETLIFY_DATABASE_URL_UNPOOLED }
    });

    console.log('Migrations completed successfully.');
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runMigrations();