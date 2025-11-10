import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedTags() {
  console.log('🌱 Seeding tags...');

  const tags = [
    { name: 'Audio', color: '#3b82f6' },
    { name: 'Video', color: '#ef4444' },
    { name: 'Luci', color: '#f59e0b' },
    { name: 'Wireless', color: '#8b5cf6' },
    { name: 'Cavi', color: '#6b7280' },
    { name: 'Microfoni', color: '#10b981' },
    { name: 'Mixer', color: '#ec4899' },
    { name: 'Amplificatori', color: '#6366f1' },
    { name: 'Diffusori', color: '#14b8a6' },
    { name: 'Accessori', color: '#f97316' },
  ];

  for (const tag of tags) {
    try {
      const created = await prisma.tag.upsert({
        where: { name: tag.name },
        update: {},
        create: tag,
      });
      console.log(`✅ Tag creato: ${created.name}`);
    } catch (error) {
      console.error(`❌ Errore creando tag ${tag.name}:`, error);
    }
  }

  console.log('✨ Seeding completato!');
}

seedTags()
  .catch((e) => {
    console.error('❌ Errore durante il seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
