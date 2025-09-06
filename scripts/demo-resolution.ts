#!/usr/bin/env tsx
/**
 * Demo script to test resolution system
 * Creates a test insight and resolves it
 */

import { prisma } from '../app/lib/prisma';
import { ulid } from 'ulid';
import { processInsightResolution } from '../lib/resolution/engine';

async function main() {
  console.log('🧪 Demo: Testing Resolution System');
  
  // Create a test insight with a past deadline
  const testInsight = {
    id: ulid(),
    question: 'Will Bitcoin be above $50k on 2024-01-01?',
    category: 'prediction',
    horizon: new Date('2024-01-01T23:59:59.999Z'),
    probability: 0.85,
    confidence: 0.8,
    intervalLower: 0.7,
    intervalUpper: 0.95,
    rationale: 'Test prediction for resolution demo',
    scenarios: JSON.stringify([]),
    metrics: JSON.stringify({}),
    sources: JSON.stringify([]),
    dataQuality: 0.9,
    modelVersion: 'demo-v1',
    stamped: false,
    // Proof fields
    canonical: 'BTC close >= 50000 USD on 2024-01-01',
    p: 0.85,
    deadline: new Date('2024-01-01T23:59:59.999Z'),
    resolverKind: 'PRICE',
    resolverRef: JSON.stringify({
      asset: 'BTC',
      source: 'coingecko',
      field: 'close',
      currency: 'USD'
    }),
    status: 'COMMITTED'
  };
  
  try {
    // Insert test insight
    console.log('📝 Creating test insight...');
    const insight = await prisma.insight.create({
      data: testInsight
    });
    console.log(`✅ Created insight: ${insight.id}`);
    console.log(`   Canonical: ${insight.canonical}`);
    console.log(`   Deadline: ${insight.deadline?.toISOString()}`);
    
    // Resolve the insight
    console.log('\n🔍 Resolving insight...');
    await processInsightResolution(insight.id);
    
    // Check the result
    const resolved = await prisma.insight.findUnique({
      where: { id: insight.id },
      include: {
        outcomes: true
      }
    });
    
    if (resolved) {
      console.log('\n📊 Resolution Result:');
      console.log(`   Status: ${resolved.status}`);
      
      if (resolved.outcomes.length > 0) {
        const outcome = resolved.outcomes[0];
        console.log(`   Result: ${outcome.result}`);
        console.log(`   Decided by: ${outcome.decidedBy}`);
        console.log(`   Evidence URL: ${outcome.evidenceUrl || 'None'}`);
        console.log(`   Decided at: ${outcome.decidedAt.toISOString()}`);
      }
    }
    
    console.log('\n✅ Demo completed successfully!');
    
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
