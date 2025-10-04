#!/usr/bin/env node

/**
 * Quick script to set today's Daily Challenge
 * Usage: node scripts/set-daily-challenge.mjs [insightId]
 * If no insightId provided, will create a demo challenge
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const insightId = process.argv[2];
  
  // Get today at midnight UTC
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  if (insightId) {
    // Use provided insight
    console.log(`Setting insight ${insightId} as today's challenge...`);
    
    const insight = await prisma.insight.update({
      where: { id: insightId },
      data: { featuredDate: today },
      include: {
        creator: {
          select: { handle: true },
        },
      },
    });

    console.log('✅ Daily Challenge set!');
    console.log(`   Question: ${insight.question}`);
    console.log(`   Category: ${insight.category}`);
    console.log(`   By: @${insight.creator?.handle || 'Unknown'}`);
  } else {
    // Create a demo challenge
    console.log('No insight ID provided. Creating demo challenge...');

    // Check if we have any creator
    let creator = await prisma.creator.findFirst();
    
    if (!creator) {
      // Create a demo creator
      creator = await prisma.creator.create({
        data: {
          handle: 'demo_creator',
          wallet: 'DEMO' + Date.now(),
        },
      });
      console.log('✅ Created demo creator');
    }

    // Create demo insight
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 90); // 90 days from now

    const insight = await prisma.insight.create({
      data: {
        creatorId: creator.id,
        question: 'Will Bitcoin reach $100,000 by the end of 2025?',
        category: 'crypto',
        horizon: tomorrow,
        probability: 0.65,
        confidence: 0.75,
        intervalLower: 0.50,
        intervalUpper: 0.80,
        rationale: 'Based on historical bull run patterns and institutional adoption trends, Bitcoin has a strong probability of reaching $100k by end of 2025. Key factors include potential Bitcoin ETF approvals, halving cycle effects, and increasing institutional interest.',
        scenarios: JSON.stringify([
          { name: 'Bull case', probability: 0.35, description: 'Strong ETF adoption + favorable regulations' },
          { name: 'Base case', probability: 0.50, description: 'Moderate growth with some volatility' },
          { name: 'Bear case', probability: 0.15, description: 'Regulatory headwinds or market correction' },
        ]),
        metrics: JSON.stringify({
          key_indicators: ['ETF inflows', 'On-chain metrics', 'Institutional holdings'],
          confidence_factors: ['Historical patterns', 'Market cycles', 'Adoption metrics'],
        }),
        sources: JSON.stringify([
          { name: 'CoinMetrics', url: 'https://coinmetrics.io' },
          { name: 'Glassnode', url: 'https://glassnode.com' },
        ]),
        dataQuality: 0.85,
        modelVersion: 'e8.1',
        status: 'OPEN',
        featuredDate: today,
      },
      include: {
        creator: {
          select: { handle: true },
        },
      },
    });

    console.log('✅ Demo Daily Challenge created!');
    console.log(`   ID: ${insight.id}`);
    console.log(`   Question: ${insight.question}`);
    console.log(`   Category: ${insight.category}`);
    console.log(`   By: @${insight.creator?.handle}`);
  }

  console.log('\n🎯 Daily Challenge is now live at /feed');
}

main()
  .catch((e) => {
    console.error('Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
