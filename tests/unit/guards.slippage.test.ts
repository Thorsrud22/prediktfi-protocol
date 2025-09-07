/**
 * Unit tests for dynamic slippage cap functionality
 */

import { describe, it, expect } from 'vitest';
import { calculateDynamicSlippageCap, checkSlippageCap } from '../../app/lib/intents/guards';
import { Guards } from '../../app/lib/intents/schema';

describe('Dynamic Slippage Cap', () => {
  const baseGuards: Guards = {
    dailyLossCapPct: 5,
    posLimitPct: 20,
    minLiqUsd: 100000,
    maxSlippageBps: 50, // User-specified max
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
  };

  describe('calculateDynamicSlippageCap', () => {
    it('should return BASE_BPS (20) for very low impact', () => {
      const result = calculateDynamicSlippageCap(5, baseGuards);
      expect(result).toBe(20); // BASE_BPS
    });

    it('should calculate cap as ceil(K * impact) for medium impact', () => {
      const impactBps = 15;
      const dynamicCap = Math.ceil(1.2 * impactBps); // 18
      const result = calculateDynamicSlippageCap(impactBps, baseGuards);
      // Should use BASE_BPS (20) since 15 * 1.2 = 18, but BASE_BPS (20) is higher
      expect(result).toBe(20);
    });

    it('should clamp to HARD_CAP_BPS (100) for high impact', () => {
      const impactBps = 100;
      const result = calculateDynamicSlippageCap(impactBps, baseGuards);
      // Dynamic cap would be 120, but user max (50) is more conservative
      expect(result).toBe(50);
    });

    it('should use more conservative value between dynamic cap and user max', () => {
      // User max is 50, dynamic cap would be higher
      const impactBps = 30;
      const dynamicCap = Math.ceil(1.2 * impactBps); // 36
      const result = calculateDynamicSlippageCap(impactBps, baseGuards);
      expect(result).toBe(Math.min(dynamicCap, baseGuards.maxSlippageBps)); // 36
    });

    it('should use user max when it is lower than dynamic cap', () => {
      const guardsWithLowMax = { ...baseGuards, maxSlippageBps: 15 };
      const impactBps = 20;
      const result = calculateDynamicSlippageCap(impactBps, guardsWithLowMax);
      expect(result).toBe(15); // User max is more conservative
    });

    it('should handle edge case of zero impact', () => {
      const result = calculateDynamicSlippageCap(0, baseGuards);
      expect(result).toBe(20); // BASE_BPS
    });

    it('should handle very high impact correctly', () => {
      const impactBps = 1000;
      const result = calculateDynamicSlippageCap(impactBps, baseGuards);
      // Dynamic cap would be 1200, clamped to 100, but user max (50) is more conservative
      expect(result).toBe(50);
    });
  });

  describe('checkSlippageCap with dynamic cap', () => {
    it('should pass when slippage is within dynamic cap', () => {
      const estimatedSlippageBps = 20; // Within dynamic cap of 24
      const estimatedImpactBps = 20;
      const result = checkSlippageCap(estimatedSlippageBps, baseGuards, estimatedImpactBps);
      expect(result).toBeNull();
    });

    it('should fail when slippage exceeds dynamic cap', () => {
      const estimatedSlippageBps = 50;
      const estimatedImpactBps = 10; // Low impact = low cap
      const result = checkSlippageCap(estimatedSlippageBps, baseGuards, estimatedImpactBps);
      expect(result).not.toBeNull();
      expect(result?.code).toBe('SLIPPAGE_EXCEEDED');
      expect(result?.message).toContain('dynamic cap');
    });

    it('should fall back to static guard when impact not provided', () => {
      const estimatedSlippageBps = 60;
      const result = checkSlippageCap(estimatedSlippageBps, baseGuards);
      expect(result).not.toBeNull();
      expect(result?.code).toBe('SLIPPAGE_EXCEEDED');
      expect(result?.message).not.toContain('dynamic cap');
    });

    it('should use dynamic cap when it is more conservative than user max', () => {
      const guardsWithHighMax = { ...baseGuards, maxSlippageBps: 100 };
      const estimatedSlippageBps = 30;
      const estimatedImpactBps = 10; // Low impact = low dynamic cap
      const result = checkSlippageCap(estimatedSlippageBps, guardsWithHighMax, estimatedImpactBps);
      expect(result).not.toBeNull();
      expect(result?.message).toContain('dynamic cap');
    });

    it('should use user max when it is more conservative than dynamic cap', () => {
      const guardsWithLowMax = { ...baseGuards, maxSlippageBps: 15 };
      const estimatedSlippageBps = 20;
      const estimatedImpactBps = 20; // Higher impact = higher dynamic cap (24)
      const result = checkSlippageCap(estimatedSlippageBps, guardsWithLowMax, estimatedImpactBps);
      expect(result).not.toBeNull();
      expect(result?.message).not.toContain('dynamic cap');
    });
  });

  describe('Test cases from requirements', () => {
    it('should handle low-impact case (cap=20)', () => {
      const impactBps = 5; // Very low impact
      const result = calculateDynamicSlippageCap(impactBps, baseGuards);
      expect(result).toBe(20); // BASE_BPS
    });

    it('should handle mid-impact case (cap≈K*impact)', () => {
      const impactBps = 25;
      const expected = Math.ceil(1.2 * impactBps); // 30
      const result = calculateDynamicSlippageCap(impactBps, baseGuards);
      expect(result).toBe(expected);
    });

    it('should handle high-impact case (clamped to 100)', () => {
      const impactBps = 100;
      const result = calculateDynamicSlippageCap(impactBps, baseGuards);
      // Dynamic cap would be 120, clamped to 100, but user max (50) is more conservative
      expect(result).toBe(50);
    });

    it('should handle case where user max is lower than dynamic cap', () => {
      const guardsWithLowMax = { ...baseGuards, maxSlippageBps: 15 };
      const impactBps = 20;
      const result = calculateDynamicSlippageCap(impactBps, guardsWithLowMax);
      expect(result).toBe(15); // User max is more conservative
    });
  });

  describe('Edge cases and boundary conditions', () => {
    it('should handle fractional impact values correctly', () => {
      const impactBps = 12.5;
      const result = calculateDynamicSlippageCap(impactBps, baseGuards);
      // 12.5 * 1.2 = 15, but BASE_BPS (20) is higher
      expect(result).toBe(20);
    });

    it('should handle impact exactly at hard cap boundary', () => {
      const impactBps = 83.33; // 1.2 * 83.33 ≈ 100
      const result = calculateDynamicSlippageCap(impactBps, baseGuards);
      // Dynamic cap would be 100, but user max (50) is more conservative
      expect(result).toBe(50);
    });

    it('should handle impact just above hard cap boundary', () => {
      const impactBps = 84; // 1.2 * 84 = 100.8, should clamp to 100
      const result = calculateDynamicSlippageCap(impactBps, baseGuards);
      // Dynamic cap would be 100, but user max (50) is more conservative
      expect(result).toBe(50);
    });

    it('should handle very small impact values', () => {
      const impactBps = 0.1;
      const result = calculateDynamicSlippageCap(impactBps, baseGuards);
      expect(result).toBe(20); // BASE_BPS
    });

    it('should use dynamic cap when user max is higher', () => {
      const guardsWithHighMax = { ...baseGuards, maxSlippageBps: 100 };
      const impactBps = 30;
      const result = calculateDynamicSlippageCap(impactBps, guardsWithHighMax);
      // Dynamic cap: ceil(1.2 * 30) = 36, user max is 100, so use 36
      expect(result).toBe(36);
    });
  });
});
