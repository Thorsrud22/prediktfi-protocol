#!/usr/bin/env tsx
/**
 * Weekly Analytics Digest Cron Script
 * 
 * This script generates and sends a weekly analytics digest via webhook.
 * Should be run once per week (e.g., Monday mornings) via cron.
 * 
 * Usage:
 *   npx tsx scripts/analytics.weekly-digest.ts
 * 
 * Cron example (every Monday at 9:00 AM):
 *   0 9 * * 1 cd /path/to/project && npx tsx scripts/analytics.weekly-digest.ts
 */

import { generateAndSendWeeklyDigest } from '../src/server/analytics/weeklyDigest';

async function main() {
  console.log('🚀 Starting weekly analytics digest generation...');
  console.log('Time:', new Date().toISOString());
  
  // Check for test mode argument
  const testMode = process.argv.includes('--test-24h');
  if (testMode) {
    console.log('🧪 Running in test mode (last 24 hours)');
  }
  
  try {
    const result = await generateAndSendWeeklyDigest(testMode);
    
    if (result.success) {
      console.log('✅ Weekly digest generated and sent successfully!');
      
      if (result.digest) {
        console.log('\n📊 Summary:');
        console.log(`Week: ${result.digest.weekStart.toLocaleDateString()} - ${result.digest.weekEnd.toLocaleDateString()}`);
        console.log(`Total Views: ${result.digest.totalViews.toLocaleString()}`);
        console.log(`Total Copy Clicks: ${result.digest.totalCopyClicks.toLocaleString()}`);
        console.log(`Total Intents Created: ${result.digest.totalIntentsCreated.toLocaleString()}`);
        console.log(`Total Intents Executed: ${result.digest.totalIntentsExecuted.toLocaleString()}`);
        console.log(`Overall View→Copy Rate: ${(result.digest.overallFunnelRates.viewToCopyRate * 100).toFixed(1)}%`);
        console.log(`Overall Copy→Sign Rate: ${(result.digest.overallFunnelRates.copyToSignRate * 100).toFixed(1)}%`);
        console.log(`Overall View→Sign Rate: ${(result.digest.overallFunnelRates.viewToSignRate * 100).toFixed(1)}%`);
        
        if (result.digest.topModelsByViewToCopy.length > 0) {
          console.log(`\n🔥 Top model by View→Copy: ${result.digest.topModelsByViewToCopy[0].modelIdHash.slice(0, 8)}... (${(result.digest.topModelsByViewToCopy[0].viewToCopyRate * 100).toFixed(1)}%)`);
        }
        
        if (result.digest.topModelsByCopyToSign.length > 0) {
          console.log(`⚡ Top model by Copy→Sign: ${result.digest.topModelsByCopyToSign[0].modelIdHash.slice(0, 8)}... (${(result.digest.topModelsByCopyToSign[0].copyToSignRate * 100).toFixed(1)}%)`);
        }
      }
      
      process.exit(0);
      
    } else {
      console.error('❌ Failed to generate or send weekly digest:', result.error);
      process.exit(1);
    }
    
  } catch (error) {
    console.error('💥 Unexpected error:', error);
    process.exit(1);
  }
}

// Handle process signals gracefully
process.on('SIGINT', () => {
  console.log('\n🛑 Received SIGINT, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Received SIGTERM, shutting down gracefully...');
  process.exit(0);
});

// Run the script
main().catch((error) => {
  console.error('💥 Script failed:', error);
  process.exit(1);
});