import { PrismaClient } from '@prisma/client';

async function createTestInsights() {
  const prisma = new PrismaClient();

  try {
    const creator = await prisma.creator.upsert({
      where: { handle: 'test_creator' },
      update: {},
      create: {
        handle: 'test_creator',
        score: 85.5,
        accuracy: 0.75,
      },
    });

    // Create URL resolver insight (high verifiability)
    const urlInsight = await prisma.insight.create({
      data: {
        question: 'Will this specific webpage contain the word "success" by December 31, 2024?',
        category: 'Technology',
        horizon: new Date('2024-12-31T23:59:59.000Z'),
        probability: 0.65,
        confidence: 0.8,
        intervalLower: 0.55,
        intervalUpper: 0.75,
        rationale: 'Based on planned website update schedule',
        scenarios: 'Success if deployment goes as planned',
        metrics: 'Deployment schedule analysis',
        sources: 'Website development roadmap',
        dataQuality: 0.9,
        canonical: 'This specific webpage will contain the word "success" by December 31, 2024',
        p: 0.65,
        deadline: new Date('2024-12-31T23:59:59.000Z'),
        resolverKind: 'URL',
        resolverRef: JSON.stringify({
          url: 'https://example.com/results',
          selector: 'h1',
          expectedText: 'success',
        }),
        status: 'OPEN',
        creatorId: creator.id,
      },
    });

    // Create TEXT resolver insight (low verifiability)
    const textInsight = await prisma.insight.create({
      data: {
        question: 'Will the general sentiment about AI be positive by 2025?',
        category: 'AI',
        horizon: new Date('2025-01-01T23:59:59.000Z'),
        probability: 0.55,
        confidence: 0.6,
        intervalLower: 0.45,
        intervalUpper: 0.65,
        rationale: 'AI adoption trends and public opinion',
        scenarios: 'Depends on major AI developments and media coverage',
        metrics: 'Sentiment analysis of social media and news',
        sources: 'Twitter, news articles, surveys',
        dataQuality: 0.7,
        canonical: 'The general sentiment about AI will be positive by 2025',
        p: 0.55,
        deadline: new Date('2025-01-01T23:59:59.000Z'),
        resolverKind: 'TEXT',
        resolverRef: JSON.stringify({
          criteria: 'Manual verification based on expert judgment',
        }),
        status: 'OPEN',
        creatorId: creator.id,
      },
    });

    console.log('Created URL insight:', urlInsight.id);
    console.log('URL: http://localhost:3000/i/' + urlInsight.id);
    console.log('');
    console.log('Created TEXT insight:', textInsight.id);
    console.log('URL: http://localhost:3000/i/' + textInsight.id);
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createTestInsights();
