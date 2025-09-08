#!/usr/bin/env tsx
/**
 * Weekly Analytics Digest Cron Job
 * 
 * Usage:
 *   npx tsx scripts/analytics.weekly-digest.ts
 * 
 * Cron schedule (every Monday at 9 AM):
 *   0 9 * * 1 cd /path/to/project && npx tsx scripts/analytics.weekly-digest.ts
 */

import { generateAndSendWeeklyDigest } from '../src/server/analytics/weeklyDigest';

async function main() {
  console.log('🚀 Starting weekly analytics digest generation...');
  console.log('Time:', new Date().toISOString());
  
  try {
    const result = await generateAndSendWeeklyDigest();
    
    if (result.success) {
      console.log('✅ Weekly digest generated and sent successfully');
      
      if (result.digest) {
        const { digest } = result;
        console.log('📊 Digest summary:');
        console.log(`   Week: ${digest.weekStart.toLocaleDateString()} - ${digest.weekEnd.toLocaleDateString()}`);
        console.log(`   Views: ${digest.totalViews}`);
        console.log(`   Copy clicks: ${digest.totalCopyClicks}`);
        console.log(`   Intents executed: ${digest.totalIntentsExecuted}`);
        console.log(`   View→Copy rate: ${(digest.overallFunnelRates.viewToCopyRate * 100).toFixed(1)}%`);
        console.log(`   Copy→Sign rate: ${(digest.overallFunnelRates.copyToSignRate * 100).toFixed(1)}%`);
        console.log(`   View→Sign rate: ${(digest.overallFunnelRates.viewToSignRate * 100).toFixed(1)}%`);
        console.log(`   Top models by view→copy: ${digest.topModelsByViewToCopy.length}`);
        console.log(`   Top models by copy→sign: ${digest.topModelsByCopyToSign.length}`);
      }
      
      process.exit(0);
    } else {
      console.error('❌ Failed to generate weekly digest:', result.error);
      process.exit(1);
    }
    
  } catch (error) {
    console.error('💥 Unexpected error:', error);
    process.exit(1);
  }
}

// Handle process signals
process.on('SIGINT', () => {
  console.log('\n⚠️  Received SIGINT, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n⚠️  Received SIGTERM, shutting down gracefully...');
  process.exit(0);
});

// Run the main function
if (require.main === module) {
  main().catch((error) => {
    console.error('💥 Fatal error:', error);
    process.exit(1);
  });
}

export default main;
