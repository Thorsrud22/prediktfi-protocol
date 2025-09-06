#!/usr/bin/env tsx
/**
 * Resolve Script - Cron job for automatic outcome resolution
 * Usage: tsx scripts/resolve.ts
 */

import { findInsightsReadyForResolution, processInsightResolution } from '../lib/resolution/engine';
import { createEvent } from '../lib/events';

interface ResolutionStats {
  total: number;
  resolved: number;
  failed: number;
  errors: string[];
}

async function main() {
  const startTime = Date.now();
  console.log(`🤖 Starting resolution job at ${new Date().toISOString()}`);
  
  // Check if resolution is enabled
  if (process.env.PRICE_RESOLUTION !== 'true') {
    console.log('⏸️ Price resolution is disabled (PRICE_RESOLUTION != true)');
    return;
  }
  
  const stats: ResolutionStats = {
    total: 0,
    resolved: 0,
    failed: 0,
    errors: []
  };
  
  try {
    // Find insights ready for resolution
    const insightIds = await findInsightsReadyForResolution();
    stats.total = insightIds.length;
    
    if (insightIds.length === 0) {
      console.log('✅ No insights ready for resolution');
      return;
    }
    
    console.log(`📋 Processing ${insightIds.length} insights...`);
    
    // Process each insight
    for (const insightId of insightIds) {
      try {
        await processInsightResolution(insightId);
        stats.resolved++;
        console.log(`✅ ${stats.resolved}/${stats.total} - Resolved ${insightId}`);
      } catch (error) {
        stats.failed++;
        const errorMsg = error instanceof Error ? error.message : 'Unknown error';
        stats.errors.push(`${insightId}: ${errorMsg}`);
        console.error(`❌ ${stats.resolved + stats.failed}/${stats.total} - Failed ${insightId}: ${errorMsg}`);
        
        // Continue with other insights even if one fails
        continue;
      }
    }
    
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    console.error('💥 Resolution job failed:', errorMsg);
    stats.errors.push(`Job failed: ${errorMsg}`);
  } finally {
    const tookMs = Date.now() - startTime;
    
    // Log completion stats
    console.log('\n📊 Resolution Job Summary:');
    console.log(`⏱️  Duration: ${tookMs}ms`);
    console.log(`📝 Total: ${stats.total}`);
    console.log(`✅ Resolved: ${stats.resolved}`);
    console.log(`❌ Failed: ${stats.failed}`);
    
    if (stats.errors.length > 0) {
      console.log('\n🚨 Errors:');
      stats.errors.forEach(error => console.log(`  - ${error}`));
    }
    
    // Log event for monitoring
    await createEvent('resolution_job_completed', {
      total: stats.total,
      resolved: stats.resolved,
      failed: stats.failed,
      tookMs,
      errors: stats.errors.length > 0 ? stats.errors : undefined
    });
    
    console.log(`\n🏁 Resolution job completed at ${new Date().toISOString()}`);
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n⏹️ Received SIGINT, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n⏹️ Received SIGTERM, shutting down gracefully...');
  process.exit(0);
});

// Handle unhandled errors
process.on('unhandledRejection', (error) => {
  console.error('💥 Unhandled rejection:', error);
  process.exit(1);
});

process.on('uncaughtException', (error) => {
  console.error('💥 Uncaught exception:', error);
  process.exit(1);
});

// Run the job
if (require.main === module) {
  main().catch((error) => {
    console.error('💥 Resolution script failed:', error);
    process.exit(1);
  });
}

export { main as runResolutionJob };
