/**
 * Unit tests for metrics aggregation system
 */

import { describe, it, expect } from 'vitest';
import { 
  getPeriodRange,
  calculateVolumeMetrics,
  calculateResolutionMetrics,
  calculateRetentionMetrics
} from '../../lib/metrics/aggregations';
import { 
  processVolumeChartData,
  processOutcomeChartData,
  processResolverChartData,
  formatNumber,
  formatPercentage,
  formatDuration,
  getTrend
} from '../../lib/metrics/charts';

describe('Metrics Aggregation System', () => {
  describe('getPeriodRange', () => {
    it('should calculate correct date ranges for different periods', () => {
      // Test relative ranges without mocking Date
      const range24h = getPeriodRange('24h');
      expect(range24h.period).toBe('24h');
      expect(range24h.endDate.getTime() - range24h.startDate.getTime()).toBe(24 * 60 * 60 * 1000);
      
      const range7d = getPeriodRange('7d');
      expect(range7d.period).toBe('7d');
      expect(range7d.endDate.getTime() - range7d.startDate.getTime()).toBe(7 * 24 * 60 * 60 * 1000);
      
      const range30d = getPeriodRange('30d');
      expect(range30d.period).toBe('30d');
      expect(range30d.endDate.getTime() - range30d.startDate.getTime()).toBe(30 * 24 * 60 * 60 * 1000);
      
      const rangeAll = getPeriodRange('all');
      expect(rangeAll.period).toBe('all');
      expect(rangeAll.startDate.getFullYear()).toBe(2024);
    });
  });
});

describe('Chart Data Processing', () => {
  describe('processVolumeChartData', () => {
    it('should convert daily volume data to line chart format', () => {
      const dailyVolume = [
        { date: '2024-01-10', predictions: 10, commits: 8, resolves: 5 },
        { date: '2024-01-11', predictions: 15, commits: 12, resolves: 7 },
        { date: '2024-01-12', predictions: 20, commits: 16, resolves: 10 }
      ];
      
      const chartData = processVolumeChartData(dailyVolume);
      
      expect(chartData.datasets).toHaveLength(3);
      expect(chartData.datasets[0].label).toBe('Predictions');
      expect(chartData.datasets[1].label).toBe('Commits');
      expect(chartData.datasets[2].label).toBe('Resolves');
      
      expect(chartData.datasets[0].data).toEqual([
        { x: '2024-01-10', y: 10 },
        { x: '2024-01-11', y: 15 },
        { x: '2024-01-12', y: 20 }
      ]);
      
      expect(chartData.xAxis.type).toBe('time');
      expect(chartData.yAxis.label).toBe('Count');
    });
    
    it('should handle empty data', () => {
      const chartData = processVolumeChartData([]);
      expect(chartData.datasets).toHaveLength(3);
      expect(chartData.datasets[0].data).toEqual([]);
    });
  });
  
  describe('processOutcomeChartData', () => {
    it('should convert outcome breakdown to donut chart format', () => {
      const outcomeBreakdown = {
        YES: 50,
        NO: 30,
        INVALID: 20
      };
      
      const chartData = processOutcomeChartData(outcomeBreakdown);
      
      expect(chartData.labels).toEqual(['YES', 'NO', 'INVALID']);
      expect(chartData.data).toEqual([50, 30, 20]);
      expect(chartData.colors).toEqual(['#10b981', '#ef4444', '#6b7280']);
      expect(chartData.total).toBe(100);
    });
    
    it('should handle zero values', () => {
      const outcomeBreakdown = { YES: 0, NO: 0, INVALID: 0 };
      const chartData = processOutcomeChartData(outcomeBreakdown);
      expect(chartData.total).toBe(0);
    });
  });
  
  describe('processResolverChartData', () => {
    it('should convert resolver breakdown to bar chart format', () => {
      const resolverBreakdown = {
        PRICE: { total: 100, success: 80, error: 10 },
        URL: { total: 50, success: 40, error: 5 },
        TEXT: { total: 30, success: 25, error: 2 }
      };
      
      const chartData = processResolverChartData(resolverBreakdown);
      
      expect(chartData.labels).toEqual(['PRICE', 'URL', 'TEXT']);
      expect(chartData.datasets).toHaveLength(3);
      
      const successDataset = chartData.datasets.find(d => d.label === 'Success');
      expect(successDataset?.data).toEqual([80, 40, 25]);
      
      const errorDataset = chartData.datasets.find(d => d.label === 'Error');
      expect(errorDataset?.data).toEqual([10, 5, 2]);
      
      const pendingDataset = chartData.datasets.find(d => d.label === 'Pending');
      expect(pendingDataset?.data).toEqual([10, 5, 3]); // total - success - error
    });
  });
});

describe('Formatting Utilities', () => {
  describe('formatNumber', () => {
    it('should format numbers with appropriate suffixes', () => {
      expect(formatNumber(123)).toBe('123');
      expect(formatNumber(1234)).toBe('1.2K');
      expect(formatNumber(12345)).toBe('12.3K');
      expect(formatNumber(1234567)).toBe('1.2M');
      expect(formatNumber(12345678)).toBe('12.3M');
    });
  });
  
  describe('formatPercentage', () => {
    it('should format percentages with one decimal place', () => {
      expect(formatPercentage(0)).toBe('0.0%');
      expect(formatPercentage(50.5)).toBe('50.5%');
      expect(formatPercentage(100)).toBe('100.0%');
      expect(formatPercentage(99.95)).toBe('100.0%');
    });
  });
  
  describe('formatDuration', () => {
    it('should format duration in appropriate units', () => {
      expect(formatDuration(0.5)).toBe('30m'); // 30 minutes
      expect(formatDuration(1.5)).toBe('1.5h'); // 1.5 hours
      expect(formatDuration(25)).toBe('1d 1.0h'); // 1 day 1 hour
      expect(formatDuration(48.5)).toBe('2d 0.5h'); // 2 days 0.5 hours
    });
  });
  
  describe('getTrend', () => {
    it('should calculate trend direction and percentage', () => {
      const upTrend = getTrend(120, 100);
      expect(upTrend.direction).toBe('up');
      expect(upTrend.percentage).toBe(20);
      expect(upTrend.color).toBe('text-green-600');
      
      const downTrend = getTrend(80, 100);
      expect(downTrend.direction).toBe('down');
      expect(downTrend.percentage).toBe(20);
      expect(downTrend.color).toBe('text-red-600');
      
      const stableTrend = getTrend(100, 100);
      expect(stableTrend.direction).toBe('stable');
      expect(stableTrend.percentage).toBe(0);
      expect(stableTrend.color).toBe('text-gray-500');
    });
    
    it('should handle zero previous value', () => {
      const trend = getTrend(100, 0);
      expect(trend.direction).toBe('stable');
      expect(trend.percentage).toBe(0);
    });
    
    it('should treat small changes as stable', () => {
      const trend = getTrend(100.5, 100);
      expect(trend.direction).toBe('stable');
    });
  });
});

describe('Edge Cases', () => {
  it('should handle empty daily volume data', () => {
    const chartData = processVolumeChartData([]);
    expect(chartData.datasets[0].data).toEqual([]);
    expect(chartData.datasets[1].data).toEqual([]);
    expect(chartData.datasets[2].data).toEqual([]);
  });
  
  it('should handle zero outcome totals', () => {
    const chartData = processOutcomeChartData({ YES: 0, NO: 0, INVALID: 0 });
    expect(chartData.total).toBe(0);
    expect(chartData.data).toEqual([0, 0, 0]);
  });
  
  it('should handle zero resolver totals', () => {
    const resolverBreakdown = {
      PRICE: { total: 0, success: 0, error: 0 },
      URL: { total: 0, success: 0, error: 0 },
      TEXT: { total: 0, success: 0, error: 0 }
    };
    
    const chartData = processResolverChartData(resolverBreakdown);
    expect(chartData.datasets[0].data).toEqual([0, 0, 0]); // success
    expect(chartData.datasets[1].data).toEqual([0, 0, 0]); // error
    expect(chartData.datasets[2].data).toEqual([0, 0, 0]); // pending
  });
  
  it('should handle very large numbers in formatting', () => {
    expect(formatNumber(1234567890)).toBe('1234.6M');
    expect(formatNumber(999999)).toBe('1000.0K');
  });
  
  it('should handle negative durations', () => {
    expect(formatDuration(-1)).toBe('-60m');
  });
});
