import { PrismaClient } from '@prisma/client';

async function updateInsight() {
  const prisma = new PrismaClient();

  try {
    const insight = await prisma.insight.update({
      where: { id: '01K4R6DNZZ75TTMH8H599DYJVV' },
      data: {
        canonical: 'Bitcoin will reach $120,000 by January 31, 2025',
      },
    });

    console.log('Updated insight:', insight.id);
    console.log('Canonical:', insight.canonical);
    console.log('Test URL: http://localhost:3000/i/' + insight.id);
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updateInsight();
