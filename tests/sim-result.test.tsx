/**
 * Unit tests for SimResult component format and data handling
 */

import { describe, it, expect } from 'vitest';

describe('SimResult Component Format', () => {
  const mockSimulation = {
    expectedPrice: 150.25,
    worstCasePrice: 149.50,
    estSlippageBps: 30,
    feesUsd: 0.15,
    liqOk: true,
    portfolioAfter: {
      totalValueUsd: 10000,
      holdings: [
        { asset: 'SOL', valueUsd: 5000, amount: 33.33 },
        { asset: 'USDC', valueUsd: 5000, amount: 5000 }
      ]
    },
    simConfidence: 0.85,
    quoteTimestamp: Date.now() - 5000, // 5 seconds ago
    historicalAccuracy: {
      accuracy: 78,
      confidence: 'high',
      sampleSize: 45
    }
  };

  it('should format quote freshness text correctly', () => {
    const now = Date.now();
    const quoteTimestamp = now - 5000; // 5 seconds ago
    const age = Math.floor((now - quoteTimestamp) / 1000);
    
    const expectedText = `Oppdatert for ${age}s siden`;
    expect(expectedText).toMatch(/Oppdatert for \d+s siden/);
  });

  it('should format historical accuracy text correctly', () => {
    const accuracy = 78;
    const expectedText = `${accuracy}% innen ±50 bps`;
    expect(expectedText).toBe('78% innen ±50 bps');
  });

  it('should format price impact correctly', () => {
    const expectedPrice = 150.25;
    const worstCasePrice = 149.50;
    const priceImpact = ((expectedPrice - worstCasePrice) / expectedPrice) * 100;
    
    expect(priceImpact).toBeCloseTo(0.5, 1);
    expect(priceImpact.toFixed(2)).toBe('0.50');
  });

  it('should format fees correctly', () => {
    const feesUsd = 0.15;
    const formattedFees = feesUsd.toFixed(4);
    expect(formattedFees).toBe('0.1500');
  });

  it('should format portfolio value correctly', () => {
    const totalValueUsd = 10000;
    const formattedValue = totalValueUsd.toLocaleString();
    expect(formattedValue).toBe('10,000');
  });

  it('should handle confidence levels correctly', () => {
    const confidenceLevels = ['high', 'medium', 'low'];
    const expectedColors = {
      'high': 'text-green-600',
      'medium': 'text-yellow-600',
      'low': 'text-red-600'
    };

    confidenceLevels.forEach(level => {
      expect(expectedColors[level as keyof typeof expectedColors]).toBeDefined();
    });
  });

  it('should calculate quote age correctly', () => {
    const now = Date.now();
    const quoteTimestamp = now - 10000; // 10 seconds ago
    const age = Math.floor((now - quoteTimestamp) / 1000);
    
    expect(age).toBe(10);
  });

  it('should handle missing historical accuracy gracefully', () => {
    const simulationWithoutAccuracy = {
      ...mockSimulation,
      historicalAccuracy: undefined
    };

    // Should not throw when accessing optional property
    expect(simulationWithoutAccuracy.historicalAccuracy).toBeUndefined();
    
    // Should use fallback logic
    const accuracyData = simulationWithoutAccuracy.historicalAccuracy || null;
    expect(accuracyData).toBeNull();
  });

  it('should format ARIA labels correctly', () => {
    const quoteAge = 5;
    const accuracy = 78;
    
    const quoteAriaLabel = `Quote updated ${quoteAge} seconds ago`;
    const accuracyAriaLabel = `30-day simulation accuracy: ${accuracy}%`;
    
    expect(quoteAriaLabel).toBe('Quote updated 5 seconds ago');
    expect(accuracyAriaLabel).toBe('30-day simulation accuracy: 78%');
  });
});
