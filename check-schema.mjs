import { PrismaClient } from '@prisma/client';

async function checkInsightSchema() {
  const prisma = new PrismaClient();

  try {
    const insight = await prisma.insight.findFirst();
    console.log('Existing insight structure:');
    console.log(insight);
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkInsightSchema();
