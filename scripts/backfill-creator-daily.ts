#!/usr/bin/env tsx

/**
 * CreatorDaily Backfill Script
 * 
 * Idempotent backfill of CreatorDaily historical data in batches.
 * 
 * Usage:
 *   pnpm tsx scripts/backfill-creator-daily.ts --since=2024-01-01 --until=2024-01-31 --batchDays=3 --concurrency=3
 * 
 * Parameters:
 *   --since=YYYY-MM-DD     Start date (inclusive)
 *   --until=YYYY-MM-DD     End date (inclusive) 
 *   --batchDays=N          Days per batch (default: 3)
 *   --concurrency=N        Concurrent batches (default: 3)
 *   --dry-run              Show what would be processed without executing
 */

import { PrismaClient } from '@prisma/client';
import { rollupCreatorDailyRange } from '../src/server/creator/rollup';

const prisma = new PrismaClient();

interface BackfillConfig {
  since: Date;
  until: Date;
  batchDays: number;
  concurrency: number;
  dryRun: boolean;
}

interface BatchResult {
  batchStart: Date;
  batchEnd: Date;
  processed: number;
  errors: number;
  duration: number;
  creators: number;
}

interface BackfillStats {
  totalBatches: number;
  completedBatches: number;
  failedBatches: number;
  totalProcessed: number;
  totalErrors: number;
  totalDuration: number;
  totalCreators: number;
}

/**
 * Parse command line arguments
 */
function parseArgs(): BackfillConfig {
  const args = process.argv.slice(2);
  
  let since: Date | undefined;
  let until: Date | undefined;
  let batchDays = 3;
  let concurrency = 3;
  let dryRun = false;

  for (const arg of args) {
    if (arg.startsWith('--since=')) {
      since = new Date(arg.split('=')[1]);
    } else if (arg.startsWith('--until=')) {
      until = new Date(arg.split('=')[1]);
    } else if (arg.startsWith('--batchDays=')) {
      batchDays = parseInt(arg.split('=')[1], 10);
    } else if (arg.startsWith('--concurrency=')) {
      concurrency = parseInt(arg.split('=')[1], 10);
    } else if (arg === '--dry-run') {
      dryRun = true;
    }
  }

  if (!since || !until) {
    console.error('❌ Error: --since and --until are required');
    console.error('Usage: pnpm tsx scripts/backfill-creator-daily.ts --since=2024-01-01 --until=2024-01-31');
    process.exit(1);
  }

  if (since >= until) {
    console.error('❌ Error: --since must be before --until');
    process.exit(1);
  }

  if (batchDays < 1 || batchDays > 30) {
    console.error('❌ Error: --batchDays must be between 1 and 30');
    process.exit(1);
  }

  if (concurrency < 1 || concurrency > 10) {
    console.error('❌ Error: --concurrency must be between 1 and 10');
    process.exit(1);
  }

  return { since, until, batchDays, concurrency, dryRun };
}

/**
 * Generate date batches
 */
function generateBatches(config: BackfillConfig): Array<{ start: Date; end: Date }> {
  const batches: Array<{ start: Date; end: Date }> = [];
  const current = new Date(config.since);

  while (current < config.until) {
    const batchStart = new Date(current);
    const batchEnd = new Date(current);
    batchEnd.setDate(batchEnd.getDate() + config.batchDays - 1);
    
    // Don't exceed the until date
    if (batchEnd > config.until) {
      batchEnd.setTime(config.until.getTime());
    }

    batches.push({ start: batchStart, end: batchEnd });
    
    current.setDate(current.getDate() + config.batchDays);
  }

  return batches;
}

/**
 * Process a single batch
 */
async function processBatch(
  batchStart: Date, 
  batchEnd: Date, 
  dryRun: boolean
): Promise<BatchResult> {
  const startTime = Date.now();
  
  console.log(`📦 Processing batch: ${batchStart.toISOString().split('T')[0]} to ${batchEnd.toISOString().split('T')[0]}`);
  
  if (dryRun) {
    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, 100));
    
    return {
      batchStart,
      batchEnd,
      processed: 0,
      errors: 0,
      duration: Date.now() - startTime,
      creators: 0
    };
  }

  try {
    const stats = await rollupCreatorDailyRange(batchStart, batchEnd);
    
    return {
      batchStart,
      batchEnd,
      processed: stats.processed,
      errors: stats.errors,
      duration: Date.now() - startTime,
      creators: stats.creators
    };
  } catch (error) {
    console.error(`❌ Batch failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    
    return {
      batchStart,
      batchEnd,
      processed: 0,
      errors: 1,
      duration: Date.now() - startTime,
      creators: 0
    };
  }
}

/**
 * Process batches with concurrency control
 */
async function processBatchesWithConcurrency(
  batches: Array<{ start: Date; end: Date }>,
  concurrency: number,
  dryRun: boolean
): Promise<BackfillStats> {
  const results: BatchResult[] = [];
  const stats: BackfillStats = {
    totalBatches: batches.length,
    completedBatches: 0,
    failedBatches: 0,
    totalProcessed: 0,
    totalErrors: 0,
    totalDuration: 0,
    totalCreators: 0
  };

  // Process batches in chunks of concurrency
  for (let i = 0; i < batches.length; i += concurrency) {
    const chunk = batches.slice(i, i + concurrency);
    
    console.log(`\n🚀 Processing batch chunk ${Math.floor(i / concurrency) + 1}/${Math.ceil(batches.length / concurrency)} (${chunk.length} batches)`);
    
    // Process chunk concurrently
    const chunkPromises = chunk.map(batch => 
      processBatch(batch.start, batch.end, dryRun)
    );
    
    const chunkResults = await Promise.all(chunkPromises);
    results.push(...chunkResults);
    
    // Update stats
    for (const result of chunkResults) {
      stats.completedBatches++;
      if (result.errors > 0) {
        stats.failedBatches++;
      }
      stats.totalProcessed += result.processed;
      stats.totalErrors += result.errors;
      stats.totalDuration += result.duration;
      stats.totalCreators = Math.max(stats.totalCreators, result.creators);
      
      console.log(`   ✅ Batch completed: ${result.processed} processed, ${result.errors} errors, ${result.duration}ms`);
    }
    
    // Small pause between chunks to avoid overwhelming the database
    if (i + concurrency < batches.length) {
      console.log('   ⏸️  Pausing 1s between chunks...');
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  return stats;
}

/**
 * Main backfill function
 */
async function main() {
  const config = parseArgs();
  
  console.log('🔄 CreatorDaily Backfill Script');
  console.log('================================');
  console.log(`📅 Since: ${config.since.toISOString().split('T')[0]}`);
  console.log(`📅 Until: ${config.until.toISOString().split('T')[0]}`);
  console.log(`📦 Batch size: ${config.batchDays} days`);
  console.log(`⚡ Concurrency: ${config.concurrency} batches`);
  console.log(`🔍 Dry run: ${config.dryRun ? 'YES' : 'NO'}`);
  console.log('');

  // Generate batches
  const batches = generateBatches(config);
  console.log(`📊 Generated ${batches.length} batches to process`);
  
  if (config.dryRun) {
    console.log('\n🔍 DRY RUN - Batch breakdown:');
    batches.forEach((batch, i) => {
      console.log(`   ${i + 1}. ${batch.start.toISOString().split('T')[0]} to ${batch.end.toISOString().split('T')[0]}`);
    });
    console.log('\n✅ Dry run completed - no data was processed');
    return;
  }

  // Get creator count for reference
  const creatorCount = await prisma.creator.count();
  console.log(`👥 Found ${creatorCount} creators in database`);
  console.log('');

  const startTime = Date.now();
  
  try {
    // Process batches
    const stats = await processBatchesWithConcurrency(batches, config.concurrency, config.dryRun);
    
    const totalTime = Date.now() - startTime;
    
    // Print final stats
    console.log('\n📊 Backfill Complete');
    console.log('===================');
    console.log(`✅ Batches completed: ${stats.completedBatches}/${stats.totalBatches}`);
    console.log(`❌ Batches failed: ${stats.failedBatches}`);
    console.log(`📈 Records processed: ${stats.totalProcessed}`);
    console.log(`⚠️  Errors: ${stats.totalErrors}`);
    console.log(`👥 Creators: ${stats.totalCreators}`);
    console.log(`⏱️  Total time: ${totalTime}ms`);
    console.log(`⚡ Avg time per batch: ${Math.round(stats.totalDuration / stats.completedBatches)}ms`);
    
    if (stats.failedBatches > 0) {
      console.log(`\n⚠️  ${stats.failedBatches} batches failed - check logs for details`);
      process.exit(1);
    }
    
    console.log('\n🎉 Backfill completed successfully!');
    
  } catch (error) {
    console.error('\n❌ Backfill failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
if (require.main === module) {
  main().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

export { main as backfillCreatorDaily };
