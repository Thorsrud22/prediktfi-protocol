#!/usr/bin/env tsx
/**
 * Recompute Scores Script
 * Daily job to recalculate all creator scores and calibration metrics
 * Usage: tsx scripts/recompute-scores.ts
 */

import { updateAllProfileAggregates, getLeaderboard } from '../lib/score';
import { createEvent, EVENT_TYPES } from '../lib/events';

interface RecomputeStats {
  startTime: Date;
  endTime?: Date;
  creatorsProcessed: number;
  errors: string[];
  topCreators: Array<{handle: string; score: number; accuracy: number}>;
}

async function main() {
  const startTime = new Date();
  console.log(`🧮 Starting score recomputation job at ${startTime.toISOString()}`);
  
  const stats: RecomputeStats = {
    startTime,
    creatorsProcessed: 0,
    errors: [],
    topCreators: []
  };
  
  try {
    // Update all profile aggregates
    console.log('📊 Updating all profile aggregates...');
    await updateAllProfileAggregates();
    
    // Generate updated leaderboard to verify results
    console.log('📋 Generating updated leaderboard...');
    const leaderboard = await getLeaderboard('all', 10);
    
    stats.creatorsProcessed = leaderboard.length;
    stats.topCreators = leaderboard.slice(0, 5).map(creator => ({
      handle: creator.handle,
      score: creator.score,
      accuracy: creator.accuracy
    }));
    
    stats.endTime = new Date();
    const durationMs = stats.endTime.getTime() - stats.startTime.getTime();
    
    console.log('\n📈 Score Recomputation Summary:');
    console.log(`⏱️  Duration: ${durationMs}ms`);
    console.log(`👥 Creators processed: ${stats.creatorsProcessed}`);
    console.log(`❌ Errors: ${stats.errors.length}`);
    
    if (stats.topCreators.length > 0) {
      console.log('\n🏆 Top 5 Creators:');
      stats.topCreators.forEach((creator, index) => {
        console.log(`   ${index + 1}. ${creator.handle}: ${creator.score.toFixed(3)} score, ${(creator.accuracy * 100).toFixed(1)}% accuracy`);
      });
    }
    
    if (stats.errors.length > 0) {
      console.log('\n🚨 Errors:');
      stats.errors.forEach(error => console.log(`   - ${error}`));
    }
    
    // Log completion event
    createEvent(EVENT_TYPES.SYSTEM_WARNING, {
      type: 'scores_recomputed',
      durationMs,
      creatorsProcessed: stats.creatorsProcessed,
      errorsCount: stats.errors.length,
      topCreators: stats.topCreators
    });
    
    console.log(`\n✅ Score recomputation completed successfully at ${stats.endTime.toISOString()}`);
    
  } catch (error) {
    stats.endTime = new Date();
    const durationMs = stats.endTime.getTime() - stats.startTime.getTime();
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    console.error(`💥 Score recomputation failed after ${durationMs}ms:`, errorMessage);
    stats.errors.push(`Job failed: ${errorMessage}`);
    // Log failure event
    createEvent(EVENT_TYPES.SYSTEM_ERROR, {
      type: 'scores_recomputation_failed',
      durationMs,
      error: errorMessage,
      creatorsProcessed: stats.creatorsProcessed
    });
    
    process.exit(1);
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
    console.error('💥 Recompute scores script failed:', error);
    process.exit(1);
  });
}

export { main as runScoreRecomputation };
