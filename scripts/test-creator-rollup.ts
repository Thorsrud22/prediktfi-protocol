/**
 * Test script for creator rollup functionality
 * Run with: pnpm tsx scripts/test-creator-rollup.ts
 */

import { PrismaClient } from '@prisma/client';
import { rollupCreatorDailyRange } from '../src/server/creator/rollup';
import { createHmac } from 'crypto';

const prisma = new PrismaClient();

async function testRollup() {
  console.log('🧪 Testing creator rollup functionality...\n');

  try {
    // 1. Check if we have any creators
    const creatorCount = await prisma.creator.count();
    console.log(`📊 Found ${creatorCount} creators in database`);

    if (creatorCount === 0) {
      console.log('❌ No creators found. Please create some test data first.');
      return;
    }

    // 2. Check if we have any insights
    const insightCount = await prisma.insight.count();
    console.log(`📊 Found ${insightCount} insights in database`);

    // 3. Check if we have any intents
    const intentCount = await prisma.intent.count();
    console.log(`📊 Found ${intentCount} intents in database`);

    // 4. Run rollup for last 3 days
    console.log('\n🔄 Running rollup for last 3 days...');
    const since = new Date();
    since.setDate(since.getDate() - 3);
    
    const stats = await rollupCreatorDailyRange(since, new Date());
    
    console.log('✅ Rollup completed:');
    console.log(`   - Processed: ${stats.processed} records`);
    console.log(`   - Errors: ${stats.errors}`);
    console.log(`   - Creators: ${stats.creators}`);
    console.log(`   - Duration: ${stats.duration}ms`);

    // 5. Check results
    const dailyRecords = await prisma.creatorDaily.count();
    console.log(`\n📊 Created ${dailyRecords} daily records`);

    if (dailyRecords > 0) {
      // Show sample records
      const sampleRecords = await prisma.creatorDaily.findMany({
        take: 3,
        orderBy: { createdAt: 'desc' },
        include: {
          // Note: This won't work with the current schema, but shows the intent
        }
      });

      console.log('\n📋 Sample records:');
      sampleRecords.forEach((record, index) => {
        console.log(`   ${index + 1}. Creator ${record.creatorId.substring(0, 8)}...`);
        console.log(`      Day: ${record.day.toISOString().split('T')[0]}`);
        console.log(`      Score: ${(record.score * 100).toFixed(2)}%`);
        console.log(`      Accuracy: ${(record.accuracy * 100).toFixed(2)}%`);
        console.log(`      Matured: ${record.maturedN}`);
        console.log(`      Provisional: ${record.maturedN < 50 ? 'Yes' : 'No'}`);
      });
    }

    // 6. Test API endpoints
    console.log('\n🌐 Testing API endpoints...');
    
    // Test leaderboard API
    try {
      const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
      const leaderboardResponse = await fetch(`${baseUrl}/api/public/leaderboard?period=30d&limit=5`);
      
      if (leaderboardResponse.ok) {
        const leaderboardData = await leaderboardResponse.json();
        console.log(`✅ Leaderboard API: ${leaderboardData.items.length} items returned`);
        
        if (leaderboardData.items.length > 0) {
          const topItem = leaderboardData.items[0];
          console.log(`   Top creator: ${topItem.creatorIdHashed} (${(topItem.score * 100).toFixed(2)}%)`);
        }
      } else {
        console.log(`❌ Leaderboard API failed: ${leaderboardResponse.status}`);
      }
    } catch (error) {
      console.log(`❌ Leaderboard API error: ${error}`);
    }

    // Test creator score API
    if (dailyRecords > 0) {
      try {
        const sampleRecord = await prisma.creatorDaily.findFirst();
        if (sampleRecord) {
          const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
          const scoreResponse = await fetch(`${baseUrl}/api/public/creators/${sampleRecord.creatorId}/score`);
          
          if (scoreResponse.ok) {
            const scoreData = await scoreResponse.json();
            console.log(`✅ Creator score API: Score data for ${scoreData.creatorIdHashed}`);
            console.log(`   30d score: ${(scoreData.scores.period30d.score * 100).toFixed(2)}%`);
            console.log(`   90d score: ${(scoreData.scores.period90d.score * 100).toFixed(2)}%`);
          } else {
            console.log(`❌ Creator score API failed: ${scoreResponse.status}`);
          }
        }
      } catch (error) {
        console.log(`❌ Creator score API error: ${error}`);
      }
    }

    // 7. Test operations endpoint (if OPS_SECRET is set)
    const opsSecret = process.env.OPS_SECRET;
    if (opsSecret) {
      console.log('\n🔧 Testing operations endpoint...');
      
      try {
        const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
        const payload = JSON.stringify({});
        const signature = createHmac('sha256', opsSecret).update(payload).digest('hex');
        
        const opsResponse = await fetch(`${baseUrl}/api/ops/creator-rollup`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-ops-signature': signature
          },
          body: payload
        });
        
        if (opsResponse.ok) {
          const opsData = await opsResponse.json();
          console.log(`✅ Operations API: ${opsData.message}`);
        } else {
          console.log(`❌ Operations API failed: ${opsResponse.status}`);
        }
      } catch (error) {
        console.log(`❌ Operations API error: ${error}`);
      }
    } else {
      console.log('\n⚠️  OPS_SECRET not set, skipping operations endpoint test');
    }

    console.log('\n🎉 Test completed successfully!');

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the test
testRollup().catch(console.error);
