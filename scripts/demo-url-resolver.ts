#!/usr/bin/env tsx
/**
 * Demo script to test URL resolver system
 * Creates test insights and demonstrates proposal workflow
 */

import { prisma } from '../app/lib/prisma';
import { ulid } from 'ulid';

async function main() {
  console.log('🧪 Demo: Testing URL Resolver System');
  
  // Create test insights with URL resolvers
  const testInsights = [
    {
      id: ulid(),
      question: 'Will GitHub show success status?',
      category: 'prediction',
      horizon: new Date('2025-12-31T23:59:59.999Z'),
      probability: 0.8,
      confidence: 0.7,
      intervalLower: 0.6,
      intervalUpper: 0.9,
      rationale: 'Test URL resolution for GitHub status',
      scenarios: JSON.stringify([]),
      metrics: JSON.stringify({}),
      sources: JSON.stringify([]),
      dataQuality: 0.8,
      modelVersion: 'demo-v1',
      stamped: false,
      // Proof fields
      canonical: 'GitHub status page will show "All systems operational"',
      p: 0.8,
      deadline: new Date('2025-12-31T23:59:59.999Z'),
      resolverKind: 'URL',
      resolverRef: JSON.stringify({
        href: 'https://www.githubstatus.com/',
        expect: 'all systems operational',
        timeout: 10000
      }),
      status: 'COMMITTED'
    },
    {
      id: ulid(),
      question: 'Will example.com show test content?',
      category: 'prediction',
      horizon: new Date('2025-12-31T23:59:59.999Z'),
      probability: 0.9,
      confidence: 0.8,
      intervalLower: 0.8,
      intervalUpper: 0.95,
      rationale: 'Test URL resolution for example.com',
      scenarios: JSON.stringify([]),
      metrics: JSON.stringify({}),
      sources: JSON.stringify([]),
      dataQuality: 0.9,
      modelVersion: 'demo-v1',
      stamped: false,
      // Proof fields
      canonical: 'Example.com will contain "Example Domain"',
      p: 0.9,
      deadline: new Date('2025-12-31T23:59:59.999Z'),
      resolverKind: 'URL',
      resolverRef: JSON.stringify({
        href: 'https://example.com/',
        expect: 'Example Domain',
        timeout: 10000
      }),
      status: 'COMMITTED'
    },
    {
      id: ulid(),
      question: 'Will text match the expected content?',
      category: 'prediction',
      horizon: new Date('2025-12-31T23:59:59.999Z'),
      probability: 0.75,
      confidence: 0.7,
      intervalLower: 0.6,
      intervalUpper: 0.9,
      rationale: 'Test TEXT resolution',
      scenarios: JSON.stringify([]),
      metrics: JSON.stringify({}),
      sources: JSON.stringify([]),
      dataQuality: 0.8,
      modelVersion: 'demo-v1',
      stamped: false,
      // Proof fields
      canonical: 'Text will contain "project completed successfully"',
      p: 0.75,
      deadline: new Date('2025-12-31T23:59:59.999Z'),
      resolverKind: 'TEXT',
      resolverRef: JSON.stringify({
        expect: 'project completed successfully',
        caseSensitive: false,
        exactMatch: false
      }),
      status: 'COMMITTED'
    }
  ];
  
  try {
    console.log('📝 Creating test insights...');
    
    for (const testInsight of testInsights) {
      const insight = await prisma.insight.create({
        data: testInsight
      });
      
      console.log(`✅ Created ${insight.resolverKind} insight: ${insight.id}`);
      console.log(`   Question: ${insight.question}`);
      console.log(`   Canonical: ${insight.canonical}`);
      console.log(`   Resolver: ${insight.resolverRef}`);
      console.log(`   URL: http://localhost:3000/i/${insight.id}`);
      console.log('');
    }
    
    console.log('🎉 Demo insights created successfully!');
    console.log('');
    console.log('📋 Next steps:');
    console.log('1. Visit the insight URLs above');
    console.log('2. Click "Generate Proposal" to test resolution');
    console.log('3. Review the proposals and confirm/reject');
    console.log('4. For TEXT insights, provide actual text for comparison');
    console.log('');
    console.log('🔗 Test URLs:');
    testInsights.forEach((insight, index) => {
      console.log(`   ${index + 1}. http://localhost:3000/i/${insight.id} (${insight.resolverKind})`);
    });
    
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
