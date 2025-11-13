'use client';

import { useMemo } from 'react';
import CalibrationChart from '../CalibrationChart';
import type { JournalMetricsSummary } from './types';

interface JournalMetricsOverviewProps {
  metrics?: JournalMetricsSummary;
  loading?: boolean;
}

const PERIOD_LABELS: Record<'7d' | '30d' | '90d', string> = {
  '7d': 'Last 7 days',
  '30d': 'Last 30 days',
  '90d': 'Last 90 days',
};

export function JournalMetricsOverview({ metrics, loading = false }: JournalMetricsOverviewProps) {
  const primaryPeriod = '90d';

  const primaryCalibration = useMemo(() => {
    if (!metrics) return [];
    return metrics.periods[primaryPeriod].calibration;
  }, [metrics]);

  if (loading) {
    return (
      <div className="border border-gray-200 rounded-lg p-8 text-center text-gray-500">
        Calculating personal metrics…
      </div>
    );
  }

  if (!metrics) {
    return (
      <div className="border border-gray-200 rounded-lg p-8 text-center text-gray-500">
        Personal scoring metrics will appear once you resolve a few insights.
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {(Object.keys(metrics.periods) as Array<'7d' | '30d' | '90d'>).map((key) => {
          const period = metrics.periods[key];
          const score = period.metrics.score;
          const reliability = period.metrics.reliability;
          const count = period.metrics.count;

          return (
            <div key={key} className="border border-gray-200 rounded-lg p-4 bg-white">
              <div className="text-xs uppercase tracking-wide text-gray-500 font-semibold">
                {PERIOD_LABELS[key]}
              </div>
              <div className="mt-2 text-2xl font-semibold text-gray-900">
                {count > 0 ? (1 - score).toFixed(3) : '—'}
              </div>
              <div className="mt-1 text-sm text-gray-500">
                {count > 0 ? `${count} resolved • Reliability ${(reliability * 100).toFixed(1)}%` : 'No resolved insights'}
              </div>
            </div>
          );
        })}
      </div>

      <div className="border border-gray-200 rounded-lg p-4 bg-white">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Calibration (90-day)</h3>
            <p className="text-sm text-gray-500">Track how closely outcomes match your stated probabilities.</p>
          </div>
        </div>
        <div className="mt-4">
          <CalibrationChart bins={primaryCalibration} width={600} height={320} />
        </div>
      </div>
    </div>
  );
}
