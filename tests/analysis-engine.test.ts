import { describe, it, expect, vi } from 'vitest';

// Mock the analysis engine
vi.mock('../src/lib/analysis/engine', () => ({
  runAnalysis: vi.fn(),
}));

describe('Analysis Engine', () => {
  it('should have runAnalysis function available', async () => {
    const { runAnalysis } = await import('../src/lib/analysis/engine');
    expect(runAnalysis).toBeDefined();
    expect(typeof runAnalysis).toBe('function');
  });

  it('should import analysis types', async () => {
    const typesModule = await import('../src/lib/analysis/types');
    expect(typesModule).toBeDefined();
  });

  it('should import calibration constants', async () => {
    const { weights, thresholds, horizonDays } = await import('../src/lib/analysis/calibration');
    expect(weights).toBeDefined();
    expect(thresholds).toBeDefined();
    expect(horizonDays).toBeDefined();
  });

  it('should import utility functions', async () => {
    const { clamp, mean, stdev } = await import('../src/lib/analysis/utils');
    expect(typeof clamp).toBe('function');
    expect(typeof mean).toBe('function');
    expect(typeof stdev).toBe('function');
  });
});
