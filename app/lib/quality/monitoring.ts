import 'server-only';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface QualityMetrics {
  simAccuracy7d: number;
  simAccuracy30d: number;
  quoteFillDeviation: {
    pair: string;
    sizeRange: string;
    avgDeviationBps: number;
    sampleCount: number;
  }[];
  simToSignRate: number;
  executeFailRate: number;
  totalSimulations: number;
  totalSigns: number;
  totalExecutions: number;
  totalFailures: number;
}

export interface AccuracyAlert {
  id: string;
  type: 'accuracy_threshold';
  severity: 'warning' | 'critical';
  message: string;
  threshold: number;
  currentValue: number;
  pair?: string;
  createdAt: Date;
}

/**
 * Get comprehensive quality metrics
 */
export async function getQualityMetrics(): Promise<QualityMetrics> {
  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  // Get simulation accuracy data
  const simAccuracy7d = await getSimulationAccuracy(sevenDaysAgo, now);
  const simAccuracy30d = await getSimulationAccuracy(thirtyDaysAgo, now);

  // Get quote-fill deviation data
  const quoteFillDeviation = await getQuoteFillDeviation(thirtyDaysAgo, now);

  // Get conversion rates
  const { simToSignRate, executeFailRate, totalSimulations, totalSigns, totalExecutions, totalFailures } = 
    await getConversionRates(thirtyDaysAgo, now);

  return {
    simAccuracy7d,
    simAccuracy30d,
    quoteFillDeviation,
    simToSignRate,
    executeFailRate,
    totalSimulations,
    totalSigns,
    totalExecutions,
    totalFailures,
  };
}

/**
 * Get simulation accuracy for a time period
 */
async function getSimulationAccuracy(startDate: Date, endDate: Date): Promise<number> {
  const accuracyData = await prisma.simulatorAccuracy.findMany({
    where: {
      timestamp: {
        gte: startDate,
        lte: endDate,
      },
    },
  });

  if (accuracyData.length === 0) return 0;

  // Calculate accuracy as percentage of simulations within acceptable deviation
  const acceptableDeviationBps = 50; // 0.5%
  const accurateSimulations = accuracyData.filter(
    sim => Math.abs(sim.deviationBps) <= acceptableDeviationBps
  ).length;

  return (accurateSimulations / accuracyData.length) * 100;
}

/**
 * Get quote-fill deviation by pair and size
 */
async function getQuoteFillDeviation(startDate: Date, endDate: Date) {
  const deviationData = await prisma.simulatorAccuracy.findMany({
    where: {
      timestamp: {
        gte: startDate,
        lte: endDate,
      },
    },
  });

  // Group by pair and size ranges
  const grouped = deviationData.reduce((acc, sim) => {
    const pair = sim.pair;
    const sizeRange = getSizeRange(sim.tradeSizeUsd);
    const key = `${pair}-${sizeRange}`;

    if (!acc[key]) {
      acc[key] = {
        pair,
        sizeRange,
        deviations: [],
        sampleCount: 0,
      };
    }

    acc[key].deviations.push(Math.abs(sim.deviationBps));
    acc[key].sampleCount++;

    return acc;
  }, {} as Record<string, { pair: string; sizeRange: string; deviations: number[]; sampleCount: number }>);

  return Object.values(grouped).map(group => ({
    pair: group.pair,
    sizeRange: group.sizeRange,
    avgDeviationBps: group.deviations.reduce((a, b) => a + b, 0) / group.deviations.length,
    sampleCount: group.sampleCount,
  }));
}

/**
 * Get conversion rates
 */
async function getConversionRates(startDate: Date, endDate: Date) {
  // Get simulation data
  const simulations = await prisma.intentReceipt.findMany({
    where: {
      status: 'simulated',
      createdAt: {
        gte: startDate,
        lte: endDate,
      },
    },
  });

  // Get sign data (intents created)
  const signs = await prisma.intent.findMany({
    where: {
      createdAt: {
        gte: startDate,
        lte: endDate,
      },
    },
  });

  // Get execution data
  const executions = await prisma.intentReceipt.findMany({
    where: {
      status: 'executed',
      createdAt: {
        gte: startDate,
        lte: endDate,
      },
    },
  });

  // Get failure data
  const failures = await prisma.intentReceipt.findMany({
    where: {
      status: 'failed',
      createdAt: {
        gte: startDate,
        lte: endDate,
      },
    },
  });

  const totalSimulations = simulations.length;
  const totalSigns = signs.length;
  const totalExecutions = executions.length;
  const totalFailures = failures.length;

  const simToSignRate = totalSimulations > 0 ? (totalSigns / totalSimulations) * 100 : 0;
  const executeFailRate = totalExecutions > 0 ? (totalFailures / totalExecutions) * 100 : 0;

  return {
    simToSignRate,
    executeFailRate,
    totalSimulations,
    totalSigns,
    totalExecutions,
    totalFailures,
  };
}

/**
 * Check for accuracy alerts
 */
export async function checkAccuracyAlerts(): Promise<AccuracyAlert[]> {
  const metrics = await getQualityMetrics();
  const alerts: AccuracyAlert[] = [];

  // Check 7-day accuracy threshold
  const accuracyThreshold7d = 70; // 70% threshold
  if (metrics.simAccuracy7d < accuracyThreshold7d) {
    alerts.push({
      id: `accuracy_7d_${Date.now()}`,
      type: 'accuracy_threshold',
      severity: metrics.simAccuracy7d < 50 ? 'critical' : 'warning',
      message: `7-day simulation accuracy is ${metrics.simAccuracy7d.toFixed(1)}% (threshold: ${accuracyThreshold7d}%)`,
      threshold: accuracyThreshold7d,
      currentValue: metrics.simAccuracy7d,
      createdAt: new Date(),
    });
  }

  // Check 30-day accuracy threshold
  const accuracyThreshold30d = 75; // 75% threshold
  if (metrics.simAccuracy30d < accuracyThreshold30d) {
    alerts.push({
      id: `accuracy_30d_${Date.now()}`,
      type: 'accuracy_threshold',
      severity: metrics.simAccuracy30d < 60 ? 'critical' : 'warning',
      message: `30-day simulation accuracy is ${metrics.simAccuracy30d.toFixed(1)}% (threshold: ${accuracyThreshold30d}%)`,
      threshold: accuracyThreshold30d,
      currentValue: metrics.simAccuracy30d,
      createdAt: new Date(),
    });
  }

  // Check pair-specific accuracy
  for (const pairData of metrics.quoteFillDeviation) {
    const pairThreshold = 100; // 1% deviation threshold
    if (pairData.avgDeviationBps > pairThreshold) {
      alerts.push({
        id: `deviation_${pairData.pair}_${Date.now()}`,
        type: 'accuracy_threshold',
        severity: pairData.avgDeviationBps > 200 ? 'critical' : 'warning',
        message: `High quote-fill deviation for ${pairData.pair}: ${pairData.avgDeviationBps.toFixed(1)}bps (threshold: ${pairThreshold}bps)`,
        threshold: pairThreshold,
        currentValue: pairData.avgDeviationBps,
        pair: pairData.pair,
        createdAt: new Date(),
      });
    }
  }

  return alerts;
}

/**
 * Get size range for grouping
 */
function getSizeRange(tradeSizeUsd: number): string {
  if (tradeSizeUsd < 100) return '<$100';
  if (tradeSizeUsd < 1000) return '$100-$1k';
  if (tradeSizeUsd < 10000) return '$1k-$10k';
  if (tradeSizeUsd < 100000) return '$10k-$100k';
  return '>$100k';
}

/**
 * Record simulation accuracy data
 */
export async function recordSimulationAccuracy(data: {
  pair: string;
  side: 'BUY' | 'SELL';
  expectedPrice: number;
  theoreticalFillPrice: number;
  tradeSizeUsd: number;
  jupiterQuoteData: any;
}): Promise<void> {
  const deviationBps = ((data.theoreticalFillPrice - data.expectedPrice) / data.expectedPrice) * 10000;

  await prisma.simulatorAccuracy.create({
    data: {
      pair: data.pair,
      side: data.side,
      expectedPrice: data.expectedPrice,
      theoreticalFillPrice: data.theoreticalFillPrice,
      deviationBps: Math.abs(deviationBps),
      tradeSizeUsd: data.tradeSizeUsd,
      jupiterQuoteData: JSON.stringify(data.jupiterQuoteData),
    },
  });
}
