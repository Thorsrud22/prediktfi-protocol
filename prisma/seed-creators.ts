/**
 * Creator Seed Script
 * Creates 2 demo creators with 90 days of CreatorDaily data
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface CreatorDailyData {
  creatorId: string;
  day: Date;
  score: number;
  accuracy: number;
  consistency: number;
  volumeScore: number;
  recencyScore: number;
  maturedN: number;
  brierMean: number;
  notional30d: number;
  retStd30d?: number;
}

// Generate realistic daily data for a creator
function generateCreatorDailyData(
  creatorId: string,
  baseScore: number,
  baseAccuracy: number,
  days: number = 90
): CreatorDailyData[] {
  const data: CreatorDailyData[] = [];
  const now = new Date();
  
  for (let i = days - 1; i >= 0; i--) {
    const day = new Date(now);
    day.setDate(day.getDate() - i);
    
    // Add some realistic variation
    const dayVariation = (Math.random() - 0.5) * 0.1;
    const score = Math.max(0, Math.min(1, baseScore + dayVariation));
    const accuracy = Math.max(0, Math.min(1, baseAccuracy + dayVariation * 0.5));
    const brierMean = 1 - accuracy; // Brier score is 1 - accuracy
    
    // Volume score decreases over time (more recent = more activity)
    const volumeScore = Math.max(0.1, Math.min(1, 0.3 + (days - i) / days * 0.7 + Math.random() * 0.2));
    
    // Consistency improves over time
    const consistency = Math.max(0.5, Math.min(1, 0.6 + (days - i) / days * 0.3 + Math.random() * 0.1));
    
    // Recency score (higher for more recent days)
    const recencyScore = Math.max(0.1, Math.min(1, 0.3 + (days - i) / days * 0.7));
    
    // Matured insights (accumulates over time)
    const maturedN = Math.max(0, Math.floor((days - i) / 3) + Math.floor(Math.random() * 3));
    
    // Notional volume in USDC (increases over time)
    const notional30d = Math.max(100, Math.floor((days - i) / 10) * 1000 + Math.floor(Math.random() * 5000));
    
    // Return standard deviation (optional)
    const retStd30d = Math.random() * 0.3 + 0.1;
    
    data.push({
      creatorId,
      day,
      score,
      accuracy,
      consistency,
      volumeScore,
      recencyScore,
      maturedN,
      brierMean,
      notional30d,
      retStd30d
    });
  }
  
  return data;
}

async function seedCreators() {
  console.log('🌱 Seeding creators...');
  
  try {
    // Create Creator 1: High performer
    const creator1 = await prisma.creator.upsert({
      where: { handle: 'alice_predictor' },
      update: {},
      create: {
        handle: 'alice_predictor',
        wallet: 'alice_wallet_123',
        score: 0.92,
        accuracy: 0.89,
        insightsCount: 45,
        brierMean: 0.08,
        calibration: JSON.stringify([]),
        lastScoreUpdate: new Date(),
      }
    });
    
    console.log(`✅ Created creator: ${creator1.handle}`);
    
    // Create Creator 2: Rising performer
    const creator2 = await prisma.creator.upsert({
      where: { handle: 'bob_analyst' },
      update: {},
      create: {
        handle: 'bob_analyst',
        wallet: 'bob_wallet_456',
        score: 0.78,
        accuracy: 0.75,
        insightsCount: 32,
        brierMean: 0.22,
        calibration: JSON.stringify([]),
        lastScoreUpdate: new Date(),
      }
    });
    
    console.log(`✅ Created creator: ${creator2.handle}`);
    
    // Generate CreatorDaily data for both creators
    const creator1Daily = generateCreatorDailyData(creator1.id, 0.92, 0.89, 90);
    const creator2Daily = generateCreatorDailyData(creator2.id, 0.78, 0.75, 90);
    
    // Insert daily data (upsert to handle re-runs)
    for (const daily of [...creator1Daily, ...creator2Daily]) {
      await prisma.creatorDaily.upsert({
        where: {
          creatorId_day: {
            creatorId: daily.creatorId,
            day: daily.day
          }
        },
        update: daily,
        create: daily
      });
    }
    
    console.log(`✅ Created ${creator1Daily.length + creator2Daily.length} daily records`);
    
    // Create some sample insights for the creators
    const insights = [
      {
        creatorId: creator1.id,
        question: 'Will Bitcoin reach $100k by end of 2024?',
        category: 'Crypto',
        horizon: new Date('2024-12-31'),
        probability: 0.75,
        confidence: 0.85,
        intervalLower: 0.65,
        intervalUpper: 0.85,
        rationale: 'Strong institutional adoption and limited supply',
        scenarios: 'Bull case: ETF approval, institutional FOMO. Bear case: regulatory crackdown',
        metrics: 'RSI: 45, MACD: bullish, Volume: increasing',
        sources: 'Coinbase, Binance, Glassnode',
        dataQuality: 0.9,
        status: 'RESOLVED' as const,
        p: 0.75,
        deadline: new Date('2024-12-31'),
        resolverKind: 'PRICE' as const,
        resolverRef: '{"symbol": "BTC", "target": 100000}',
        createdAt: new Date('2024-09-01'),
        updatedAt: new Date('2024-09-01'),
      },
      {
        creatorId: creator1.id,
        question: 'Will Tesla stock exceed $300 by Q4 2024?',
        category: 'Stocks',
        horizon: new Date('2024-12-31'),
        probability: 0.60,
        confidence: 0.70,
        intervalLower: 0.50,
        intervalUpper: 0.70,
        rationale: 'EV market growth but increased competition',
        scenarios: 'Bull: FSD breakthrough, robotaxi launch. Bear: competition, regulatory issues',
        metrics: 'P/E: 45, Revenue growth: 15%, Margins: stable',
        sources: 'Tesla IR, SEC filings, industry reports',
        dataQuality: 0.85,
        status: 'OPEN' as const,
        p: 0.60,
        deadline: new Date('2024-12-31'),
        resolverKind: 'PRICE' as const,
        resolverRef: '{"symbol": "TSLA", "target": 300}',
        createdAt: new Date('2024-09-05'),
        updatedAt: new Date('2024-09-05'),
      },
      {
        creatorId: creator2.id,
        question: 'Will Solana reach $200 by end of 2024?',
        category: 'Crypto',
        horizon: new Date('2024-12-31'),
        probability: 0.65,
        confidence: 0.75,
        intervalLower: 0.55,
        intervalUpper: 0.75,
        rationale: 'Strong developer activity and growing ecosystem',
        scenarios: 'Bull: major dApp launches, institutional adoption. Bear: technical issues, competition',
        metrics: 'TVL: $2B, Active addresses: 1M+, TPS: 2000+',
        sources: 'Solana Foundation, DeFiLlama, on-chain data',
        dataQuality: 0.88,
        status: 'RESOLVED' as const,
        p: 0.65,
        deadline: new Date('2024-12-31'),
        resolverKind: 'PRICE' as const,
        resolverRef: '{"symbol": "SOL", "target": 200}',
        createdAt: new Date('2024-08-15'),
        updatedAt: new Date('2024-08-15'),
      }
    ];
    
    for (const insight of insights) {
      await prisma.insight.upsert({
        where: { id: `insight_${insight.creatorId}_${insight.question.slice(0, 20)}` },
        update: insight,
        create: {
          ...insight,
          id: `insight_${insight.creatorId}_${insight.question.slice(0, 20)}`
        }
      });
    }
    
    console.log(`✅ Created ${insights.length} sample insights`);
    
    console.log('🎉 Creator seeding completed successfully!');
    console.log(`📊 Created 2 creators with 90 days of daily data`);
    console.log(`🔗 Test URLs:`);
    console.log(`   http://localhost:3000/creator/${creator1.handle}`);
    console.log(`   http://localhost:3000/creator/${creator2.handle}`);
    
  } catch (error) {
    console.error('❌ Error seeding creators:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run if called directly
if (require.main === module) {
  seedCreators()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

export default seedCreators;
