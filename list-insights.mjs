import { PrismaClient } from '@prisma/client';

async function listInsights() {
  const prisma = new PrismaClient();

  try {
    const insights = await prisma.insight.findMany({
      include: {
        creator: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 5,
    });

    console.log(`Found ${insights.length} insights:`);
    insights.forEach(insight => {
      console.log(`- ID: ${insight.id}`);
      console.log(`  Canonical: ${insight.canonical}`);
      console.log(`  Resolver: ${insight.resolverKind}`);
      console.log(`  URL: http://localhost:3000/i/${insight.id}`);
      console.log('');
    });

    if (insights.length === 0) {
      console.log('No insights found. Creating a test insight...');

      const creator = await prisma.creator.upsert({
        where: { handle: 'test_creator' },
        update: {},
        create: {
          handle: 'test_creator',
          score: 85.5,
          accuracy: 0.75,
        },
      });

      const insight = await prisma.insight.create({
        data: {
          canonical: 'Bitcoin will reach $120,000 by January 31, 2025',
          p: 0.75,
          deadline: new Date('2025-01-31T23:59:59.000Z'),
          resolverKind: 'PRICE',
          resolverRef: JSON.stringify({
            symbol: 'BTC',
            exchange: 'coinbase',
            threshold: 120000,
            comparison: 'gte',
          }),
          status: 'DRAFT',
          creatorId: creator.id,
        },
      });

      console.log(`Created test insight with ID: ${insight.id}`);
      console.log(`URL: http://localhost:3000/i/${insight.id}`);
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

listInsights();
