import { describe, it, expect } from 'vitest';
import { slugifyTitle, buildRefUrl, generateMarketId } from '../app/lib/creator-utils';

describe('Creator Utils', () => {
  describe('slugifyTitle', () => {
    it('converts title to lowercase with hyphens', () => {
      expect(slugifyTitle('Will Bitcoin Hit $100k?')).toBe('will-bitcoin-hit-100k');
    });

    it('removes special characters', () => {
      expect(slugifyTitle('Will SOL reach $300 by end of 2025?')).toBe('will-sol-reach-300-by-end-of-2025');
    });

    it('handles multiple spaces', () => {
      expect(slugifyTitle('Multiple    Spaces   Here')).toBe('multiple-spaces-here');
    });

    it('removes leading and trailing hyphens', () => {
      expect(slugifyTitle('---Test Title---')).toBe('test-title');
    });

    it('handles empty string', () => {
      expect(slugifyTitle('')).toBe('');
    });

    it('handles Norwegian characters', () => {
      expect(slugifyTitle('Bitcoin økning æøå')).toBe('bitcoin-kning');
    });
  });

  describe('buildRefUrl', () => {
    it('builds URL with creator and ref parameters', () => {
      const url = buildRefUrl('http://localhost:3000', 'bitcoin-2025', 'crypto_analyst', 'myref');
      expect(url).toBe('http://localhost:3000/market/bitcoin-2025?ref=myref&creator=crypto_analyst');
    });

    it('uses creator as ref when no ref provided', () => {
      const url = buildRefUrl('http://localhost:3000', 'bitcoin-2025', 'crypto_analyst');
      expect(url).toBe('http://localhost:3000/market/bitcoin-2025?ref=crypto_analyst&creator=crypto_analyst');
    });

    it('handles URL encoding', () => {
      const url = buildRefUrl('http://localhost:3000', 'bitcoin price', 'creator with spaces');
      expect(url).toBe('http://localhost:3000/market/bitcoin%20price?ref=creator+with+spaces&creator=creator+with+spaces');
    });

    it('handles empty ref', () => {
      const url = buildRefUrl('http://localhost:3000', 'bitcoin-2025', 'crypto_analyst', '');
      expect(url).toBe('http://localhost:3000/market/bitcoin-2025?ref=crypto_analyst&creator=crypto_analyst');
    });
  });

  describe('generateMarketId', () => {
    it('generates ID with current year suffix', () => {
      const currentYear = new Date().getFullYear();
      const id = generateMarketId('Will Bitcoin hit $100k?');
      expect(id).toBe(`will-bitcoin-hit-100k-${currentYear}`);
    });

    it('handles empty title', () => {
      const currentYear = new Date().getFullYear();
      const id = generateMarketId('');
      expect(id).toBe(`market-${currentYear}`);
    });

    it('handles complex titles', () => {
      const currentYear = new Date().getFullYear();
      const id = generateMarketId('Will Taylor Swift announce new album in Q1 2025?');
      expect(id).toBe(`will-taylor-swift-announce-new-album-in-q1-2025-${currentYear}`);
    });
  });
});
