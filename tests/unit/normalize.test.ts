import { describe, it, expect } from 'vitest';
import { 
  normalizePrediction, 
  validateCanonical, 
  parseCanonical 
} from '../../lib/normalize';

describe('Normalize Golden Tests', () => {
  describe('Bitcoin Predictions', () => {
    it('should normalize "Will Bitcoin reach $100k by end of year?" correctly', () => {
      const deadline = new Date('2025-12-31T00:00:00.000Z');
      const result = normalizePrediction(
        'Will Bitcoin reach $100k by end of year?',
        { deadline }
      );
      
      expect(result.canonical).toBe('BTC close >= 100000 USD on 2025-12-31');
      expect(result.p).toBe(0.60);
      expect(result.deadline).toEqual(deadline);
      expect(result.resolverKind).toBe('price');
      
      const resolverRef = JSON.parse(result.resolverRef);
      expect(resolverRef).toEqual({
        asset: 'BTC',
        source: 'coingecko',
        field: 'close'
      });
    });

    it('should normalize "Bitcoin will hit $80,000" correctly', () => {
      const deadline = new Date('2025-06-30T00:00:00.000Z');
      const result = normalizePrediction(
        'Bitcoin will hit $80,000',
        { deadline, p: 0.75 }
      );
      
      expect(result.canonical).toBe('BTC close >= 80000 USD on 2025-06-30');
      expect(result.p).toBe(0.75);
    });

    it('should normalize "BTC below $50k" correctly', () => {
      const deadline = new Date('2025-03-15T00:00:00.000Z');
      const result = normalizePrediction(
        'BTC below $50k',
        { deadline }
      );
      
      expect(result.canonical).toBe('BTC close <= 50000 USD on 2025-03-15');
    });
  });

  describe('Ethereum Predictions', () => {
    it('should normalize "Will Ethereum hit $5000 by Q2 2025?" correctly', () => {
      const deadline = new Date('2025-06-30T00:00:00.000Z');
      const result = normalizePrediction(
        'Will Ethereum hit $5000 by Q2 2025?',
        { deadline }
      );
      
      expect(result.canonical).toBe('ETH close >= 5000 USD on 2025-06-30');
    });

    it('should normalize "ETH over $3,500" correctly', () => {
      const deadline = new Date('2025-12-31T00:00:00.000Z');
      const result = normalizePrediction(
        'ETH over $3,500',
        { deadline }
      );
      
      expect(result.canonical).toBe('ETH close >= 3500 USD on 2025-12-31');
    });
  });

  describe('Solana Predictions', () => {
    it('should normalize "Solana will be hitting 400USD this year" correctly', () => {
      const deadline = new Date('2025-12-31T00:00:00.000Z');
      const result = normalizePrediction(
        'Solana will be hitting 400USD this year',
        { deadline }
      );
      
      expect(result.canonical).toBe('SOL close >= 400 USD on 2025-12-31');
    });
  });

  describe('Generic Asset Predictions', () => {
    it('should normalize generic asset predictions', () => {
      const deadline = new Date('2025-12-31T00:00:00.000Z');
      const result = normalizePrediction(
        'AAPL will reach $200',
        { deadline }
      );
      
      expect(result.canonical).toBe('AAPL close >= 200 USD on 2025-12-31');
    });
  });

  describe('Text-based Predictions', () => {
    it('should normalize text predictions with fallback', () => {
      const deadline = new Date('2025-12-31T00:00:00.000Z');
      const result = normalizePrediction(
        'Will there be a recession in 2025?',
        { deadline, resolverKind: 'text' }
      );
      
      expect(result.canonical).toBe('"will there be a recession in 2025" resolves true on 2025-12-31');
      expect(result.resolverKind).toBe('text');
      
      const resolverRef = JSON.parse(result.resolverRef);
      expect(resolverRef.expect).toBe('"will there be a recession in 2025" resolves true on 2025-12-31');
    });
  });

  describe('Default Values', () => {
    it('should apply default probability and deadline', () => {
      const result = normalizePrediction('BTC will reach $100k');
      
      expect(result.p).toBe(0.60);
      expect(result.deadline.getTime()).toBeGreaterThan(Date.now());
      expect(result.deadline.getTime()).toBeLessThan(Date.now() + 31 * 24 * 60 * 60 * 1000);
    });
  });

  describe('Canonical Validation', () => {
    it('should validate correct price canonical forms', () => {
      expect(validateCanonical('BTC close >= 80000 USD on 2025-12-31')).toBe(true);
      expect(validateCanonical('ETH close <= 5000 USD on 2025-06-30')).toBe(true);
      expect(validateCanonical('SOL close = 400 USD on 2025-12-31')).toBe(true);
    });

    it('should validate correct text canonical forms', () => {
      expect(validateCanonical('"recession in 2025" resolves true on 2025-12-31')).toBe(true);
      expect(validateCanonical('"will ai be sentient" resolves true on 2026-01-01')).toBe(true);
    });

    it('should reject invalid canonical forms', () => {
      expect(validateCanonical('invalid format')).toBe(false);
      expect(validateCanonical('BTC will reach 100k')).toBe(false);
      expect(validateCanonical('ETH close >= USD on 2025')).toBe(false);
    });
  });

  describe('Canonical Parsing', () => {
    it('should parse price canonical forms correctly', () => {
      const result = parseCanonical('BTC close >= 80000 USD on 2025-12-31');
      
      expect(result).toEqual({
        subject: 'BTC',
        verb: 'close',
        comparator: '>=',
        value: '80000',
        unit: 'USD',
        deadline: '2025-12-31'
      });
    });

    it('should parse text canonical forms correctly', () => {
      const result = parseCanonical('"recession in 2025" resolves true on 2025-12-31');
      
      expect(result).toEqual({
        subject: 'recession in 2025',
        verb: 'resolves',
        comparator: '=',
        value: 'true',
        unit: 'boolean',
        deadline: '2025-12-31'
      });
    });

    it('should return null for invalid canonical forms', () => {
      expect(parseCanonical('invalid format')).toBeNull();
    });
  });

  describe('Deterministic Golden Tests', () => {
    // These tests ensure consistent output across runs and platforms
    const goldenTests = [
      {
        input: 'Will Bitcoin reach $100k by end of year?',
        deadline: '2025-12-31T00:00:00.000Z',
        expected: {
          canonical: 'BTC close >= 100000 USD on 2025-12-31',
          p: 0.60,
          resolverKind: 'price'
        }
      },
      {
        input: 'ETH below $2000',
        deadline: '2025-06-30T12:00:00.000Z',
        expected: {
          canonical: 'ETH close <= 2000 USD on 2025-06-30',
          p: 0.60,
          resolverKind: 'price'
        }
      },
      {
        input: 'Solana will hit 500 dollars',
        deadline: '2025-12-31T23:59:59.999Z',
        expected: {
          canonical: 'SOL close >= 500 USD on 2025-12-31',
          p: 0.60,
          resolverKind: 'price'
        }
      }
    ];

    goldenTests.forEach(({ input, deadline, expected }, index) => {
      it(`golden test ${index + 1}: "${input}"`, () => {
        const result = normalizePrediction(input, {
          deadline: new Date(deadline),
          p: expected.p
        });
        
        expect(result.canonical).toBe(expected.canonical);
        expect(result.p).toBe(expected.p);
        expect(result.resolverKind).toBe(expected.resolverKind);
      });
    });
  });
});
