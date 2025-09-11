#!/usr/bin/env tsx
/**
 * Weekly Digest A/B Test Analysis
 * 
 * Analyzes CTA A/B test data and generates decision recommendations
 */

import { PrismaClient } from '@prisma/client';
import { makeABTestDecision, formatABTestDecision, ABTestMetrics } from '../src/lib/ab/decision';

const prisma = new PrismaClient();

interface EventData {
  type: string;
  experimentKey: string | null;
  variant: string | null;
  insightId: string | null;
  createdAt: Date;
}

async function analyzeCTAABTest(experimentKey: string, daysBack: number = 7): Promise<string> {
  console.log(`Analyzing CTA A/B test: ${experimentKey} (last ${daysBack} days)`);
  
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysBack);
  
  // Get all relevant events
  const events = await prisma.event.findMany({
    where: {
      experimentKey,
      createdAt: { gte: cutoffDate },
      type: {
        in: ['cta_view', 'model_copy_clicked', 'intent_created_from_copy', 'intent_executed_from_copy']
      }
    },
    orderBy: { createdAt: 'asc' }
  });
  
  console.log(`Found ${events.length} events`);
  
  // Group events by variant
  const variantA = events.filter(e => e.variant === 'A');
  const variantB = events.filter(e => e.variant === 'B');
  
  // Calculate metrics for each variant
  const metricsA = calculateVariantMetrics(variantA, 'A');
  const metricsB = calculateVariantMetrics(variantB, 'B');
  
  console.log('Variant A metrics:', metricsA);
  console.log('Variant B metrics:', metricsB);
  
  // Make decision
  const decision = makeABTestDecision(experimentKey, metricsA, metricsB);
  
  // Format for digest
  const digestSection = formatABTestDecision(decision);
  
  return digestSection;
}

function calculateVariantMetrics(events: EventData[], variant: string): Omit<ABTestMetrics, 'convViewCopyCI' | 'convCopySignCI'> {
  // Count different event types
  const views = events.filter(e => e.type === 'cta_view');
  const copies = events.filter(e => e.type === 'model_copy_clicked');
  const intentsCreated = events.filter(e => e.type === 'intent_created_from_copy');
  const intentsExecuted = events.filter(e => e.type === 'intent_executed_from_copy');
  
  const nView = views.length;
  const nCopy = copies.length;
  const nSignFromCopy = intentsExecuted.length;
  
  const convViewCopy = nView > 0 ? nCopy / nView : 0;
  const convCopySign = nCopy > 0 ? nSignFromCopy / nCopy : 0;
  
  return {
    variant,
    nView,
    nCopy,
    nSignFromCopy,
    convViewCopy,
    convCopySign,
  };
}

async function generateWeeklyDigestABSection(): Promise<string> {
  console.log('Generating weekly digest A/B test section...');
  
  const experimentKey = 'cta_copy_v1';
  const abSection = await analyzeCTAABTest(experimentKey, 7);
  
  return abSection;
}

async function main() {
  try {
    const digestSection = await generateWeeklyDigestABSection();
    console.log('\n=== Weekly Digest A/B Test Section ===');
    console.log(digestSection);
  } catch (error) {
    console.error('Failed to generate weekly digest A/B section:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  main();
}

export { analyzeCTAABTest, generateWeeklyDigestABSection };
