#!/usr/bin/env tsx
/**
 * Demo script to test scoring and leaderboard system
 * Creates test creators with resolved insights and demonstrates scoring
 */

import { prisma } from '../app/lib/prisma';
import { ulid } from 'ulid';
import { updateProfileAggregates, getLeaderboard } from '../lib/score';

async function main() {
  console.log('🎯 Demo: Testing Scoring & Leaderboard System');
  
  // Create test creators
  const creators = [
    { handle: 'alice_predictor', name: 'Alice the Accurate' },
    { handle: 'bob_forecaster', name: 'Bob the Bold' },
    { handle: 'charlie_calibrated', name: 'Charlie the Calibrated' }
  ];
  
  const createdCreators = [];
  
  try {
    console.log('👥 Creating test creators...');
    
    for (const creator of creators) {
      // Try to find existing creator first
      let createdCreator = await prisma.creator.findUnique({
        where: { handle: creator.handle }
      });
      
      if (!createdCreator) {
        createdCreator = await prisma.creator.create({
          data: {
            id: ulid(),
            handle: creator.handle,
            score: 0,
            accuracy: 0
          }
        });
        console.log(`✅ Created creator: ${creator.handle}`);
      } else {
        console.log(`♻️  Using existing creator: ${creator.handle}`);
      }
      
      createdCreators.push(createdCreator);
    }
    
    console.log('\n📝 Creating test insights with outcomes...');
    
    // Alice - Very accurate predictor (low Brier scores)
    const aliceInsights = [
      { question: 'Will it rain tomorrow?', p: 0.9, outcome: 'YES' },
      { question: 'Will the stock market go up?', p: 0.8, outcome: 'YES' },
      { question: 'Will the meeting be cancelled?', p: 0.2, outcome: 'NO' },
      { question: 'Will we finish on time?', p: 0.7, outcome: 'YES' },
      { question: 'Will there be traffic?', p: 0.3, outcome: 'NO' }
    ];
    
    // Bob - Overconfident predictor (higher Brier scores)
    const bobInsights = [
      { question: 'Will crypto crash?', p: 0.95, outcome: 'NO' },  // Very wrong
      { question: 'Will we win the game?', p: 0.9, outcome: 'NO' }, // Very wrong
      { question: 'Will it snow?', p: 0.1, outcome: 'YES' },      // Very wrong
      { question: 'Will the event happen?', p: 0.8, outcome: 'YES' },
      { question: 'Will prices drop?', p: 0.6, outcome: 'YES' }
    ];
    
    // Charlie - Well-calibrated predictor (moderate confidence, good accuracy)
    const charlieInsights = [
      { question: 'Will the project succeed?', p: 0.6, outcome: 'YES' },
      { question: 'Will we get funding?', p: 0.7, outcome: 'YES' },
      { question: 'Will the launch be delayed?', p: 0.4, outcome: 'NO' },
      { question: 'Will users like the feature?', p: 0.8, outcome: 'YES' },
      { question: 'Will we hit the deadline?', p: 0.5, outcome: 'NO' }
    ];
    
    const allInsightData = [
      { creator: createdCreators[0], insights: aliceInsights },
      { creator: createdCreators[1], insights: bobInsights },
      { creator: createdCreators[2], insights: charlieInsights }
    ];
    
    for (const { creator, insights } of allInsightData) {
      console.log(`\n📊 Creating insights for ${creator.handle}:`);
      
      for (const insightData of insights) {
        // Create insight
        const insight = await prisma.insight.create({
          data: {
            id: ulid(),
            creatorId: creator.id,
            question: insightData.question,
            category: 'prediction',
            horizon: new Date('2024-12-31T23:59:59.999Z'),
            probability: insightData.p,
            confidence: 0.8,
            intervalLower: Math.max(0, insightData.p - 0.2),
            intervalUpper: Math.min(1, insightData.p + 0.2),
            rationale: `Demo insight for scoring system`,
            scenarios: JSON.stringify([]),
            metrics: JSON.stringify({}),
            sources: JSON.stringify([]),
            dataQuality: 0.9,
            modelVersion: 'demo-v1',
            stamped: false,
            // Proof fields
            canonical: `${insightData.question} (${insightData.p})`,
            p: insightData.p,
            deadline: new Date('2024-12-31T23:59:59.999Z'),
            resolverKind: 'PRICE',
            resolverRef: JSON.stringify({ test: true }),
            status: 'RESOLVED'
          }
        });
        
        // Create outcome
        await prisma.outcome.create({
          data: {
            id: ulid(),
            insightId: insight.id,
            result: insightData.outcome === 'YES' ? 'YES' : 'NO',
            decidedBy: 'AGENT',
            decidedAt: new Date()
          }
        });
        
        console.log(`   ✅ ${insightData.question} (p=${insightData.p}, outcome=${insightData.outcome})`);
      }
    }
    
    console.log('\n🧮 Computing scores for all creators...');
    
    // Update scores for all creators
    for (const creator of createdCreators) {
      const aggregates = await updateProfileAggregates(creator.id);
      console.log(`✅ Updated ${creator.handle}:`);
      console.log(`   Score: ${(1 - aggregates.averageBrier).toFixed(3)}`);
      console.log(`   Brier: ${aggregates.averageBrier.toFixed(3)}`);
      console.log(`   Resolved: ${aggregates.resolvedInsights}/${aggregates.totalInsights}`);
    }
    
    console.log('\n🏆 Generating leaderboard...');
    
    const leaderboard = await getLeaderboard('all', 10);
    
    console.log('\n📋 Final Leaderboard:');
    console.log('Rank | Creator          | Score  | Accuracy | Brier  | Predictions');
    console.log('-----|------------------|--------|----------|--------|------------');
    
    leaderboard.forEach(creator => {
      console.log(
        `${creator.rank.toString().padStart(4)} | ${creator.handle.padEnd(16)} | ${creator.score.toFixed(3)} | ${(creator.accuracy * 100).toFixed(1).padStart(6)}% | ${creator.averageBrier.toFixed(3)} | ${creator.resolvedInsights.toString().padStart(10)}`
      );
    });
    
    console.log('\n🎉 Demo completed successfully!');
    console.log('\n📋 Next steps:');
    console.log('1. Visit http://localhost:3000/leaderboard to see the leaderboard');
    console.log('2. Visit creator profiles:');
    createdCreators.forEach(creator => {
      console.log(`   - http://localhost:3000/creator/${creator.handle}`);
    });
    console.log('3. Test the APIs:');
    console.log('   - GET /api/leaderboard?period=all');
    console.log('   - GET /api/profile/alice_predictor');
    
  } catch (error) {
    console.error('❌ Demo failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  main();
}
