/**
 * Chart utilities and data processing for metrics dashboard
 */

export interface ChartDataPoint {
  x: string | number;
  y: number;
  label?: string;
  color?: string;
}

export interface LineChartData {
  datasets: Array<{
    label: string;
    data: ChartDataPoint[];
    color: string;
    fill?: boolean;
  }>;
  xAxis: {
    type: 'time' | 'category';
    labels?: string[];
  };
  yAxis: {
    label: string;
    min?: number;
    max?: number;
  };
}

export interface BarChartData {
  labels: string[];
  datasets: Array<{
    label: string;
    data: number[];
    backgroundColor: string[];
    borderColor?: string[];
  }>;
}

export interface DonutChartData {
  labels: string[];
  data: number[];
  colors: string[];
  total: number;
}

/**
 * Convert daily volume data to line chart format
 */
export function processVolumeChartData(dailyVolume: Array<{
  date: string;
  predictions: number;
  commits: number;
  resolves: number;
}>): LineChartData {
  const sortedData = [...dailyVolume].sort((a, b) => 
    new Date(a.date).getTime() - new Date(b.date).getTime()
  );
  
  return {
    datasets: [
      {
        label: 'Predictions',
        data: sortedData.map(d => ({ x: d.date, y: d.predictions })),
        color: '#3b82f6', // blue-500
        fill: false
      },
      {
        label: 'Commits',
        data: sortedData.map(d => ({ x: d.date, y: d.commits })),
        color: '#10b981', // emerald-500
        fill: false
      },
      {
        label: 'Resolves',
        data: sortedData.map(d => ({ x: d.date, y: d.resolves })),
        color: '#f59e0b', // amber-500
        fill: false
      }
    ],
    xAxis: {
      type: 'time'
    },
    yAxis: {
      label: 'Count',
      min: 0
    }
  };
}

/**
 * Convert outcome data to donut chart format
 */
export function processOutcomeChartData(outcomeBreakdown: {
  YES: number;
  NO: number;
  INVALID: number;
}): DonutChartData {
  const total = outcomeBreakdown.YES + outcomeBreakdown.NO + outcomeBreakdown.INVALID;
  
  return {
    labels: ['YES', 'NO', 'INVALID'],
    data: [outcomeBreakdown.YES, outcomeBreakdown.NO, outcomeBreakdown.INVALID],
    colors: ['#10b981', '#ef4444', '#6b7280'], // emerald, red, gray
    total
  };
}

/**
 * Convert resolver data to bar chart format
 */
export function processResolverChartData(resolverBreakdown: {
  PRICE: { total: number; success: number; error: number };
  URL: { total: number; success: number; error: number };
  TEXT: { total: number; success: number; error: number };
}): BarChartData {
  const resolvers = Object.keys(resolverBreakdown) as Array<keyof typeof resolverBreakdown>;
  
  return {
    labels: resolvers,
    datasets: [
      {
        label: 'Success',
        data: resolvers.map(r => resolverBreakdown[r].success),
        backgroundColor: ['#10b981', '#10b981', '#10b981'], // emerald-500
      },
      {
        label: 'Error',
        data: resolvers.map(r => resolverBreakdown[r].error),
        backgroundColor: ['#ef4444', '#ef4444', '#ef4444'], // red-500
      },
      {
        label: 'Pending',
        data: resolvers.map(r => resolverBreakdown[r].total - resolverBreakdown[r].success - resolverBreakdown[r].error),
        backgroundColor: ['#f59e0b', '#f59e0b', '#f59e0b'], // amber-500
      }
    ]
  };
}

/**
 * Format numbers for display
 */
export function formatNumber(num: number): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  return num.toString();
}

/**
 * Format percentage for display
 */
export function formatPercentage(num: number): string {
  return `${num.toFixed(1)}%`;
}

/**
 * Format duration (hours) for display
 */
export function formatDuration(hours: number): string {
  if (hours < 1) {
    return `${Math.round(hours * 60)}m`;
  }
  if (hours < 24) {
    return `${hours.toFixed(1)}h`;
  }
  const days = Math.floor(hours / 24);
  const remainingHours = hours % 24;
  return `${days}d ${remainingHours.toFixed(1)}h`;
}

/**
 * Get color for metric value (red/yellow/green based on thresholds)
 */
export function getMetricColor(value: number, thresholds: { good: number; warning: number }): string {
  if (value >= thresholds.good) return 'text-green-600';
  if (value >= thresholds.warning) return 'text-yellow-600';
  return 'text-red-600';
}

/**
 * Get trend indicator (up/down/stable)
 */
export function getTrend(current: number, previous: number): {
  direction: 'up' | 'down' | 'stable';
  percentage: number;
  color: string;
} {
  if (previous === 0) {
    return { direction: 'stable', percentage: 0, color: 'text-gray-500' };
  }
  
  const change = ((current - previous) / previous) * 100;
  
  if (Math.abs(change) < 1) {
    return { direction: 'stable', percentage: change, color: 'text-gray-500' };
  }
  
  return {
    direction: change > 0 ? 'up' : 'down',
    percentage: Math.abs(change),
    color: change > 0 ? 'text-green-600' : 'text-red-600'
  };
}

/**
 * Calculate moving average for smoothing chart data
 */
export function calculateMovingAverage(data: number[], window: number): number[] {
  const result: number[] = [];
  
  for (let i = 0; i < data.length; i++) {
    const start = Math.max(0, i - window + 1);
    const slice = data.slice(start, i + 1);
    const average = slice.reduce((sum, val) => sum + val, 0) / slice.length;
    result.push(Math.round(average * 100) / 100);
  }
  
  return result;
}
