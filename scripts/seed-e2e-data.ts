#!/usr/bin/env tsx
/**
 * Seed E2E Test Data
 * Creates test insights for PRICE, URL, and TEXT resolvers
 * Usage: tsx scripts/seed-e2e-data.ts
 */

import { prisma } from '../app/lib/prisma';
import { ulid } from 'ulid';

interface TestInsight {
  question: string;
  category: string;
  probability: number;
  resolverKind: 'PRICE' | 'URL' | 'TEXT';
  resolverRef: any;
  deadline: Date;
}

async function main() {
  try {
    console.log('🌱 Seeding E2E test data...');
  
  // Create test creator
  const creator = await prisma.creator.upsert({
    where: { handle: 'e2e_tester' },
    update: {},
    create: {
      id: ulid(),
      handle: 'e2e_tester',
      score: 0,
      accuracy: 0
    }
  });
  
  console.log(`✅ Created/updated creator: ${creator.handle}`);
  
  // Test insights for each resolver type
  const testInsights: TestInsight[] = [
    // PRICE resolver insights
    {
      question: 'Will Bitcoin be above $50,000 by end of month?',
      category: 'crypto',
      probability: 0.7,
      resolverKind: 'PRICE',
      resolverRef: {
        symbol: 'bitcoin',
        operator: '>',
        target: 50000,
        source: 'coingecko'
      },
      deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days from now
    },
    {
      question: 'Will Ethereum drop below $2,000 this week?',
      category: 'crypto',
      probability: 0.3,
      resolverKind: 'PRICE',
      resolverRef: {
        symbol: 'ethereum',
        operator: '<',
        target: 2000,
        source: 'coingecko'
      },
      deadline: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000) // 3 days from now
    },
    {
      question: 'Will Solana reach $200 by next Friday?',
      category: 'crypto',
      probability: 0.5,
      resolverKind: 'PRICE',
      resolverRef: {
        symbol: 'solana',
        operator: '>=',
        target: 200,
        source: 'coingecko'
      },
      deadline: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000) // 5 days from now
    },
    
    // URL resolver insights
    {
      question: 'Will OpenAI announce GPT-5 on their blog this month?',
      category: 'ai',
      probability: 0.4,
      resolverKind: 'URL',
      resolverRef: {
        url: 'https://openai.com/blog',
        expectedText: 'GPT-5',
        method: 'fuzzy',
        confidence: 0.8
      },
      deadline: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000) // 14 days from now
    },
    {
      question: 'Will Apple mention "AI" on their homepage by end of week?',
      category: 'tech',
      probability: 0.6,
      resolverKind: 'URL',
      resolverRef: {
        url: 'https://www.apple.com',
        expectedText: 'artificial intelligence',
        method: 'keyword',
        confidence: 0.7
      },
      deadline: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000) // 4 days from now
    },
    {
      question: 'Will Tesla stock hit new highs according to Yahoo Finance?',
      category: 'finance',
      probability: 0.5,
      resolverKind: 'URL',
      resolverRef: {
        url: 'https://finance.yahoo.com/quote/TSLA',
        expectedText: 'new high',
        method: 'fuzzy',
        confidence: 0.6
      },
      deadline: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000) // 6 days from now
    },
    
    // TEXT resolver insights
    {
      question: 'Will the weather report mention "sunny" for tomorrow?',
      category: 'weather',
      probability: 0.8,
      resolverKind: 'TEXT',
      resolverRef: {
        expectedText: 'sunny',
        method: 'keyword',
        caseSensitive: false,
        exactMatch: false
      },
      deadline: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000) // 1 day from now
    },
    {
      question: 'Will the news contain "breakthrough" in the headline?',
      category: 'news',
      probability: 0.3,
      resolverKind: 'TEXT',
      resolverRef: {
        expectedText: 'breakthrough',
        method: 'exact',
        caseSensitive: false,
        exactMatch: true
      },
      deadline: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000) // 2 days from now
    },
    {
      question: 'Will the announcement include "revolutionary technology"?',
      category: 'tech',
      probability: 0.4,
      resolverKind: 'TEXT',
      resolverRef: {
        expectedText: 'revolutionary technology',
        method: 'fuzzy',
        caseSensitive: false,
        exactMatch: false
      },
      deadline: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000) // 8 days from now
    }
  ];
  
  console.log(`\n📝 Creating ${testInsights.length} test insights...`);
  
  for (const [index, insightData] of testInsights.entries()) {
    try {
      const insight = await prisma.insight.create({
        data: {
          id: ulid(),
          creatorId: creator.id,
          question: insightData.question,
          category: insightData.category,
          horizon: insightData.deadline,
          probability: insightData.probability,
          confidence: 0.8,
          intervalLower: Math.max(0, insightData.probability - 0.2),
          intervalUpper: Math.min(1, insightData.probability + 0.2),
          rationale: `E2E test insight for ${insightData.resolverKind} resolver`,
          scenarios: JSON.stringify([]),
          metrics: JSON.stringify({}),
          sources: JSON.stringify([]),
          dataQuality: 0.9,
          modelVersion: 'e2e-test',
          stamped: false,
          // Proof fields
          canonical: insightData.question,
          p: insightData.probability,
          deadline: insightData.deadline,
          resolverKind: insightData.resolverKind,
          resolverRef: JSON.stringify(insightData.resolverRef),
          status: 'COMMITTED' // Ready for resolution
        }
      });
      
      console.log(`   ✅ ${index + 1}/${testInsights.length}: ${insightData.resolverKind} - ${insightData.question.substring(0, 50)}...`);
      
    } catch (error) {
      console.error(`   ❌ Failed to create insight ${index + 1}:`, error);
    }
  }
  
  // Summary
  const counts = await Promise.all([
    prisma.insight.count({ where: { resolverKind: 'PRICE', status: 'COMMITTED' } }),
    prisma.insight.count({ where: { resolverKind: 'URL', status: 'COMMITTED' } }),
    prisma.insight.count({ where: { resolverKind: 'TEXT', status: 'COMMITTED' } })
  ]);
  
  console.log('\n📊 E2E Test Data Summary:');
  console.log(`   🔢 PRICE insights: ${counts[0]}`);
  console.log(`   🌐 URL insights: ${counts[1]}`);
  console.log(`   📝 TEXT insights: ${counts[2]}`);
  console.log(`   👤 Test creator: ${creator.handle} (ID: ${creator.id})`);
  
  console.log('\n🧪 E2E Test Flow:');
  console.log('1. Create insight → ✅ (seeded)');
  console.log('2. Commit insight → ✅ (status: COMMITTED)');
  console.log('3. Resolve insight → Run: npx tsx scripts/resolve.ts');
  console.log('4. Score update → Automatic after resolution');
  console.log('5. Verify results → Check /leaderboard and /creator/e2e_tester');
  
  console.log('\n🔧 Manual Resolution Test:');
  console.log('- Visit insights and test proposal system');
  console.log('- Use /api/resolve/propose for URL/TEXT insights');
  console.log('- Use /api/resolve/confirm to accept/reject proposals');
  
  console.log('\n✅ E2E seed data ready for testing!');
  
  } catch (error) {
    console.error('❌ E2E seeding failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  main();
}
