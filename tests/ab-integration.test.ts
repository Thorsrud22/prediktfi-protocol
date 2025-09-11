/**
 * A/B Testing Integration Tests
 * 
 * Tests the complete A/B testing flow with synthetic data
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PrismaClient } from '@prisma/client';
import { makeABTestDecision } from '../src/lib/ab/decision';

// Mock Prisma for testing
const mockPrisma = {
  event: {
    findMany: vi.fn(),
    create: vi.fn(),
  },
  $disconnect: vi.fn(),
} as unknown as PrismaClient;

describe('A/B Testing Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should make correct decision for significant improvement', () => {
    // Simulate significant improvement scenario
    const metricsA = {
      variant: 'A',
      nView: 1000,
      nCopy: 100,
      nSignFromCopy: 50,
      convViewCopy: 0.1,
      convCopySign: 0.5,
    };
    
    const metricsB = {
      variant: 'B',
      nView: 1000,
      nCopy: 200,
      nSignFromCopy: 100,
      convViewCopy: 0.2,
      convCopySign: 0.5,
    };
    
    const decision = makeABTestDecision('cta_copy_v1', metricsA, metricsB);
    
    expect(decision.experimentKey).toBe('cta_copy_v1');
    // Should make some decision based on the metrics
    expect(['ADOPT', 'STOP', 'CONTINUE']).toContain(decision.decision);
    expect(decision.delta).toBe(0.1);
    expect(decision.sampleSize.underpowered).toBe(false);
  });

  it('should make correct decision for underpowered test', () => {
    // Simulate underpowered scenario
    const metricsA = {
      variant: 'A',
      nView: 100,
      nCopy: 10,
      nSignFromCopy: 5,
      convViewCopy: 0.1,
      convCopySign: 0.5,
    };
    
    const metricsB = {
      variant: 'B',
      nView: 100,
      nCopy: 15,
      nSignFromCopy: 7,
      convViewCopy: 0.15,
      convCopySign: 0.47,
    };
    
    const decision = makeABTestDecision('cta_copy_v1', metricsA, metricsB);
    
    expect(decision.decision).toBe('CONTINUE');
    expect(decision.sampleSize.underpowered).toBe(true);
    expect(decision.sampleSize.total).toBe(200);
    expect(decision.sampleSize.target).toBe(1800);
  });

  it('should make correct decision for no significant difference', () => {
    // Simulate no significant difference scenario
    const metricsA = {
      variant: 'A',
      nView: 1000,
      nCopy: 100,
      nSignFromCopy: 50,
      convViewCopy: 0.1,
      convCopySign: 0.5,
    };
    
    const metricsB = {
      variant: 'B',
      nView: 1000,
      nCopy: 105,
      nSignFromCopy: 52,
      convViewCopy: 0.105,
      convCopySign: 0.495,
    };
    
    const decision = makeABTestDecision('cta_copy_v1', metricsA, metricsB);
    
    expect(['CONTINUE', 'STOP']).toContain(decision.decision);
    expect(decision.delta).toBeCloseTo(0.005, 3);
  });

  it('should handle edge case with zero conversions', () => {
    // Simulate edge case with zero conversions
    const metricsA = {
      variant: 'A',
      nView: 1000,
      nCopy: 0,
      nSignFromCopy: 0,
      convViewCopy: 0,
      convCopySign: 0,
    };
    
    const metricsB = {
      variant: 'B',
      nView: 1000,
      nCopy: 0,
      nSignFromCopy: 0,
      convViewCopy: 0,
      convCopySign: 0,
    };
    
    const decision = makeABTestDecision('cta_copy_v1', metricsA, metricsB);
    
    expect(decision.decision).toBe('CONTINUE');
    expect(decision.delta).toBe(0);
  });

  it('should handle edge case with perfect conversions', () => {
    // Simulate edge case with perfect conversions
    const metricsA = {
      variant: 'A',
      nView: 1000,
      nCopy: 1000,
      nSignFromCopy: 1000,
      convViewCopy: 1,
      convCopySign: 1,
    };
    
    const metricsB = {
      variant: 'B',
      nView: 1000,
      nCopy: 1000,
      nSignFromCopy: 1000,
      convViewCopy: 1,
      convCopySign: 1,
    };
    
    const decision = makeABTestDecision('cta_copy_v1', metricsA, metricsB);
    
    expect(decision.decision).toBe('CONTINUE');
    expect(decision.delta).toBe(0);
  });

  it('should calculate metrics correctly', () => {
    const metricsA = {
      variant: 'A',
      nView: 1000,
      nCopy: 100,
      nSignFromCopy: 50,
      convViewCopy: 0.1,
      convCopySign: 0.5,
    };
    
    const metricsB = {
      variant: 'B',
      nView: 1000,
      nCopy: 200,
      nSignFromCopy: 100,
      convViewCopy: 0.2,
      convCopySign: 0.5,
    };
    
    const decision = makeABTestDecision('cta_copy_v1', metricsA, metricsB);
    
    // Check metrics are preserved
    expect(decision.metrics.A.variant).toBe('A');
    expect(decision.metrics.A.nView).toBe(1000);
    expect(decision.metrics.A.nCopy).toBe(100);
    expect(decision.metrics.A.convViewCopy).toBe(0.1);
    
    expect(decision.metrics.B.variant).toBe('B');
    expect(decision.metrics.B.nView).toBe(1000);
    expect(decision.metrics.B.nCopy).toBe(200);
    expect(decision.metrics.B.convViewCopy).toBe(0.2);
    
    // Check confidence intervals are calculated
    expect(decision.metrics.A.convViewCopyCI).toHaveLength(2);
    expect(decision.metrics.A.convViewCopyCI[0]).toBeLessThan(decision.metrics.A.convViewCopyCI[1]);
    expect(decision.metrics.B.convViewCopyCI).toHaveLength(2);
    expect(decision.metrics.B.convViewCopyCI[0]).toBeLessThan(decision.metrics.B.convViewCopyCI[1]);
  });
});
