#!/usr/bin/env tsx
/**
 * Seed script to create bob_analyst creator with test data
 */

import { prisma } from '../app/lib/prisma';
import { ulid } from 'ulid';

async function main() {
  console.log('🌱 Seeding bob_analyst creator...');
  
  try {
    // Create bob_analyst creator
    const creator = await prisma.creator.upsert({
      where: { handle: 'bob_analyst' },
      update: {},
      create: {
        id: ulid(),
        handle: 'bob_analyst',
        score: 0.75,
        accuracy: 0.68,
        insightsCount: 0
      }
    });
    
    console.log(`✅ Created/updated creator: ${creator.handle}`);
    
    // Create some test insights for bob_analyst
    const testInsights = [
      {
        question: 'Will Bitcoin reach $100,000 by end of 2024?',
        category: 'crypto',
        probability: 0.65,
        confidence: 0.7,
        intervalLower: 0.55,
        intervalUpper: 0.75,
        rationale: 'Based on historical patterns and institutional adoption trends',
        scenarios: 'Bull case: ETF approval drives demand. Bear case: regulatory crackdown',
        metrics: 'Historical volatility: 0.8, Correlation with S&P500: 0.3',
        sources: 'CoinGecko, Glassnode, institutional reports',
        dataQuality: 0.85,
        horizon: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        p: 0.65,
        deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        resolverKind: 'PRICE' as const,
        resolverRef: JSON.stringify({
          symbol: 'bitcoin',
          operator: '>=',
          target: 100000,
          source: 'coingecko'
        }),
        status: 'RESOLVED' as const
      },
      {
        question: 'Will Ethereum upgrade to EIP-4844 by Q2 2024?',
        category: 'crypto',
        probability: 0.8,
        confidence: 0.9,
        intervalLower: 0.75,
        intervalUpper: 0.85,
        rationale: 'Development timeline and community consensus support',
        scenarios: 'Success: smooth upgrade. Failure: technical issues or governance delays',
        metrics: 'Developer activity: high, Community sentiment: positive',
        sources: 'Ethereum Foundation, GitHub activity, community forums',
        dataQuality: 0.9,
        horizon: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), // 60 days
        p: 0.8,
        deadline: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
        resolverKind: 'URL' as const,
        resolverRef: JSON.stringify({
          url: 'https://ethereum.org/en/roadmap/',
          expectedText: 'EIP-4844',
          method: 'fuzzy',
          confidence: 0.8
        }),
        status: 'RESOLVED' as const
      },
      {
        question: 'Will Solana reach $200 by end of month?',
        category: 'crypto',
        probability: 0.4,
        confidence: 0.6,
        intervalLower: 0.3,
        intervalUpper: 0.5,
        rationale: 'Current market conditions and technical analysis',
        scenarios: 'Bull: DeFi growth drives demand. Bear: market correction continues',
        metrics: 'RSI: 45, MACD: bearish, Volume: decreasing',
        sources: 'TradingView, Solana ecosystem reports',
        dataQuality: 0.7,
        horizon: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000), // 15 days
        p: 0.4,
        deadline: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
        resolverKind: 'PRICE' as const,
        resolverRef: JSON.stringify({
          symbol: 'solana',
          operator: '>=',
          target: 200,
          source: 'coingecko'
        }),
        status: 'RESOLVED' as const
      }
    ];
    
    console.log('📝 Creating test insights...');
    
    for (const insightData of testInsights) {
      const insight = await prisma.insight.create({
        data: {
          id: ulid(),
          creatorId: creator.id,
          ...insightData
        }
      });
      
      // Create outcomes for resolved insights
      if (insight.status === 'RESOLVED') {
        const outcomes = [
          {
            id: ulid(),
            insightId: insight.id,
            result: 'YES' as const,
            evidenceUrl: 'https://example.com/evidence',
            decidedBy: 'AGENT' as const
          }
        ];
        
        await prisma.outcome.createMany({
          data: outcomes
        });
        
        console.log(`✅ Created insight: ${insight.question.substring(0, 50)}...`);
      }
    }
    
    // Update creator stats
    const insightsCount = await prisma.insight.count({
      where: { creatorId: creator.id }
    });
    
    await prisma.creator.update({
      where: { id: creator.id },
      data: { insightsCount }
    });
    
    console.log(`\n📊 Summary:`);
    console.log(`   👤 Creator: ${creator.handle}`);
    console.log(`   📝 Insights: ${insightsCount}`);
    console.log(`   🎯 Score: ${creator.score}`);
    console.log(`   📈 Accuracy: ${(creator.accuracy * 100).toFixed(1)}%`);
    
    console.log('\n✅ bob_analyst creator seeded successfully!');
    console.log('🔗 Visit: http://localhost:3000/creator/bob_analyst');
    
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  main();
}
