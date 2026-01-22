import { NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { calculateBrierMetrics, calculateCalibrationBins } from '@/lib/score';

interface CalibrationHighlight {
  bin: number;
  label: string;
  count: number;
  predicted: number;
  actual: number;
  deviation: number;
  tendency: 'overconfidence' | 'underconfidence';
}

interface PublicLessonsResponse {
  updatedAt: string;
  totals: {
    publicInsights: number;
    resolvedPublicInsights: number;
    includedPredictions: number;
  };
  metrics: {
    averageBrier: number;
    reliability: number;
    resolution: number;
    uncertainty: number;
  };
  calibration: Array<{
    bin: number;
    predicted: number;
    actual: number;
    count: number;
    deviation: number;
  }>;
  highlights: CalibrationHighlight[];
}

function parseProbability(value: unknown): number | null {
  if (value == null) return null;
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : null;
  }

  if (typeof value === 'string') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  if (typeof (value as any)?.toNumber === 'function') {
    try {
      const parsed = (value as any).toNumber();
      return Number.isFinite(parsed) ? parsed : null;
    } catch {
      return null;
    }
  }

  return null;
}

export async function GET() {
  try {
    const [publicCount, resolvedPublicCount, resolvedPublicInsights] = await Promise.all([
      prisma.insight.count({
        where: { visibility: 'PUBLIC' },
      }),
      prisma.insight.count({
        where: { visibility: 'PUBLIC', status: 'RESOLVED' },
      }),
      prisma.insight.findMany({
        where: {
          visibility: 'PUBLIC',
          status: 'RESOLVED',
          outcomes: { some: {} },
        },
        select: {
          probability: true,
          p: true,
          outcomes: {
            orderBy: { createdAt: 'desc' },
            take: 1,
            select: { result: true },
          },
        },
      }),
    ]);

    const predictionSamples = resolvedPublicInsights
      .map(insight => {
        const outcome = insight.outcomes[0];
        if (!outcome) {
          return null;
        }

        const probability =
          parseProbability(insight.p) ?? parseProbability(insight.probability) ?? 0.5;

        return {
          predicted: Math.max(0, Math.min(1, probability)),
          actual: outcome.result,
        };
      })
      .filter((sample): sample is { predicted: number; actual: 'YES' | 'NO' | 'INVALID' } => {
        return sample != null;
      });

    const metrics = calculateBrierMetrics(predictionSamples);
    const calibration = calculateCalibrationBins(predictionSamples);

    const highlights: CalibrationHighlight[] = calibration
      .filter(bin => bin.count > 0)
      .sort((a, b) => b.deviation - a.deviation)
      .slice(0, 3)
      .map(bin => ({
        bin: bin.bin,
        label: `${bin.bin * 10}-${(bin.bin + 1) * 10}%`,
        count: bin.count,
        predicted: bin.predicted,
        actual: bin.actual,
        deviation: bin.deviation,
        tendency: bin.predicted >= bin.actual ? 'overconfidence' : 'underconfidence',
      }));

    const response: PublicLessonsResponse = {
      updatedAt: new Date().toISOString(),
      totals: {
        publicInsights: publicCount,
        resolvedPublicInsights: resolvedPublicCount,
        includedPredictions: predictionSamples.length,
      },
      metrics: {
        averageBrier: metrics.score,
        reliability: metrics.reliability,
        resolution: metrics.resolution,
        uncertainty: metrics.uncertainty,
      },
      calibration: calibration.map(bin => ({
        bin: bin.bin,
        predicted: bin.predicted,
        actual: bin.actual,
        count: bin.count,
        deviation: bin.deviation,
      })),
      highlights,
    };

    return NextResponse.json(response, {
      headers: {
        'Cache-Control': 'public, max-age=300, stale-while-revalidate=600',
      },
    });
  } catch (error) {
    console.error('Failed to load public lessons', error);
    return NextResponse.json(
      { error: 'Unable to load shared lessons' },
      { status: 500 },
    );
  }
}
