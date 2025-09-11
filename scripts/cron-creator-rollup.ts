#!/usr/bin/env tsx

/**
 * Nightly Creator Rollup Cron Job
 * Runs daily at 3:00 AM to update CreatorDaily metrics
 */

import { rollupCreatorDailyRange } from '../src/server/creator/rollup';

async function main() {
  console.log('🌙 Starting nightly creator rollup...');
  
  try {
    // Calculate date range (yesterday to ensure all data is available)
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(0, 0, 0, 0);
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    console.log(`📅 Rolling up data for ${yesterday.toISOString().split('T')[0]}`);
    
    // Run rollup for yesterday
    const stats = await rollupCreatorDailyRange(yesterday, today);
    
    console.log('✅ Nightly rollup completed:');
    console.log(`   Processed: ${stats.processed} records`);
    console.log(`   Errors: ${stats.errors}`);
    console.log(`   Creators: ${stats.creators}`);
    console.log(`   Duration: ${stats.duration}ms`);
    
    if (stats.errors > 0) {
      console.warn(`⚠️  ${stats.errors} errors occurred during rollup`);
      process.exit(1);
    }
    
    console.log('🎉 Nightly rollup completed successfully!');
    
  } catch (error) {
    console.error('❌ Nightly rollup failed:', error);
    process.exit(1);
  }
}

// Run the script
if (require.main === module) {
  main().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

export { main as runNightlyRollup };
