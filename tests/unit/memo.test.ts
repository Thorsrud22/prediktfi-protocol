import { describe, it, expect } from 'vitest';
import {
  generatePredictionHash,
  createMemoPayload,
  serializeMemoPayload,
  parseMemoPayload,
  validateMemoSize,
  verifyPredictionHash,
  generateSolanaMemo,
  extractPredictionFromMemo,
  normalizeHashInput
} from '../../lib/memo';

describe('Memo Golden Tests', () => {
  describe('Prediction Hash Generation', () => {
    it('should generate consistent hash for same input', () => {
      const canonical = 'BTC close >= 100000 USD on 2025-12-31';
      const deadline = '2025-12-31T00:00:00.000Z';
      const resolverRef = '{"asset":"BTC","source":"coingecko","field":"close"}';
      
      const hash1 = generatePredictionHash(canonical, deadline, resolverRef);
      const hash2 = generatePredictionHash(canonical, deadline, resolverRef);
      
      expect(hash1).toBe(hash2);
      expect(hash1).toHaveLength(64); // SHA256 hex string
    });

    it('should generate different hashes for different inputs', () => {
      const base = {
        canonical: 'BTC close >= 100000 USD on 2025-12-31',
        deadline: '2025-12-31T00:00:00.000Z',
        resolverRef: '{"asset":"BTC","source":"coingecko","field":"close"}'
      };
      
      const hash1 = generatePredictionHash(base.canonical, base.deadline, base.resolverRef);
      const hash2 = generatePredictionHash('ETH close >= 5000 USD on 2025-12-31', base.deadline, base.resolverRef);
      const hash3 = generatePredictionHash(base.canonical, '2026-01-01T00:00:00.000Z', base.resolverRef);
      
      expect(hash1).not.toBe(hash2);
      expect(hash1).not.toBe(hash3);
      expect(hash2).not.toBe(hash3);
    });

    // Golden hash test - this ensures deterministic hashing across platforms
    it('should generate expected golden hash', () => {
      const canonical = 'BTC close >= 100000 USD on 2025-12-31';
      const deadline = '2025-12-31T00:00:00.000Z';
      const resolverRef = '{"asset":"BTC","source":"coingecko","field":"close"}';
      
      const hash = generatePredictionHash(canonical, deadline, resolverRef);
      
      // This is the expected hash for this exact input combination
      expect(hash).toBe('81ced84fb25f31ef8a1de9d03a910e1a550369fc7342a0851f48f106bb794d65');
    });
  });

  describe('Memo Payload Creation', () => {
    it('should create valid memo payload', () => {
      const payload = createMemoPayload(
        'clx123456789',
        'BTC close >= 100000 USD on 2025-12-31',
        new Date('2025-12-31T00:00:00.000Z'),
        '{"asset":"BTC","source":"coingecko","field":"close"}'
      );
      
      expect(payload.t).toBe('predikt.v1');
      expect(payload.pid).toBe('clx123456789');
      expect(payload.h).toHaveLength(64); // Full 64-char hash
      expect(payload.d).toBe('2025-12-31'); // Date only
      expect(payload).not.toHaveProperty('w'); // No wallet field
    });

    it('should create payload within size limit', () => {
      const payload = createMemoPayload(
        'clx123456789',
        'BTC close >= 100000 USD on 2025-12-31',
        new Date('2025-12-31T00:00:00.000Z'),
        '{"asset":"BTC","source":"coingecko","field":"close"}'
      );
      
      expect(validateMemoSize(payload)).toBe(true);
      
      const serialized = serializeMemoPayload(payload);
      const size = Buffer.byteLength(serialized, 'utf8');
      expect(size).toBeLessThanOrEqual(180);
    });
  });

  describe('Memo Serialization', () => {
    it('should serialize and parse memo payload correctly', () => {
      const originalPayload = createMemoPayload(
        'clx123456789',
        'BTC close >= 100000 USD on 2025-12-31',
        new Date('2025-12-31T00:00:00.000Z'),
        '{"asset":"BTC","source":"coingecko","field":"close"}'
      );
      
      const serialized = serializeMemoPayload(originalPayload);
      const parsed = parseMemoPayload(serialized);
      
      expect(parsed).toEqual(originalPayload);
    });

    it('should return null for invalid memo JSON', () => {
      expect(parseMemoPayload('invalid json')).toBeNull();
      expect(parseMemoPayload('{"invalid": "structure"}')).toBeNull();
      expect(parseMemoPayload('{"t": "wrong", "pid": "test"}')).toBeNull();
    });
  });

  describe('Hash Verification', () => {
    it('should verify prediction hash correctly', () => {
      const canonical = 'BTC close >= 100000 USD on 2025-12-31';
      const deadline = '2025-12-31T00:00:00.000Z';
      const resolverRef = '{"asset":"BTC","source":"coingecko","field":"close"}';
      
      const fullHash = generatePredictionHash(canonical, deadline, resolverRef);
      
      expect(verifyPredictionHash(fullHash, canonical, deadline, resolverRef)).toBe(true);
      expect(verifyPredictionHash('wrong_hash', canonical, deadline, resolverRef)).toBe(false);
    });
  });

  describe('Complete Solana Memo Generation', () => {
    it('should generate complete Solana memo', () => {
      const result = generateSolanaMemo(
        'clx123456789',
        'BTC close >= 100000 USD on 2025-12-31',
        new Date('2025-12-31T00:00:00.000Z'),
        '{"asset":"BTC","source":"coingecko","field":"close"}'
      );
      
      expect(result.payload.t).toBe('predikt.v1');
      expect(result.serialized).toContain('"t":"predikt.v1"');
      expect(result.hash).toHaveLength(64);
      expect(result.size).toBeLessThanOrEqual(180);
    });

    it('should throw error for oversized memo', () => {
      // Create a very long prediction ID to force oversized memo
      const longId = 'x'.repeat(200);
      
      expect(() => generateSolanaMemo(
        longId,
        'BTC close >= 100000 USD on 2025-12-31',
        new Date('2025-12-31T00:00:00.000Z'),
        '{"asset":"BTC","source":"coingecko","field":"close"}'
      )).toThrow('Memo payload too large');
    });
  });

  describe('Memo Extraction', () => {
    it('should extract prediction components from memo', () => {
      const memo = generateSolanaMemo(
        'clx123456789',
        'BTC close >= 100000 USD on 2025-12-31',
        new Date('2025-12-31T00:00:00.000Z'),
        '{"asset":"BTC","source":"coingecko","field":"close"}'
      );
      
      const extracted = extractPredictionFromMemo(memo.serialized);
      
      expect(extracted).toEqual({
        predictionId: 'clx123456789',
        hash: memo.payload.h,
        deadline: '2025-12-31'
      });
    });

    it('should return null for invalid memo', () => {
      expect(extractPredictionFromMemo('invalid')).toBeNull();
      expect(extractPredictionFromMemo('{"invalid": "memo"}')).toBeNull();
    });
  });

  describe('Hash Input Normalization', () => {
    it('should normalize hash input consistently', () => {
      const canonical = ' BTC close >= 100000 USD on 2025-12-31 ';
      const deadline = ' 2025-12-31T00:00:00.000Z ';
      const resolverRef = ' {"asset":"BTC"} ';
      
      const normalized = normalizeHashInput(canonical, deadline, resolverRef);
      expect(normalized).toBe('BTC close >= 100000 USD on 2025-12-31|2025-12-31T00:00:00.000Z|{"asset":"BTC"}');
    });
  });

  describe('Deterministic Golden Tests', () => {
    const goldenTests = [
      {
        name: 'BTC 100k prediction',
        predictionId: 'clx123456789',
        canonical: 'BTC close >= 100000 USD on 2025-12-31',
        deadline: '2025-12-31T00:00:00.000Z',
        resolverRef: '{"asset":"BTC","source":"coingecko","field":"close"}',
        wallet: 'HN7cABqLq46Es1jh92dQQisAq662SmxELLLsHHe4YWrH',
        expectedHash: '81ced84fb25f31ef8a1de9d03a910e1a550369fc7342a0851f48f106bb794d65', // Full hash
        expectedSize: 140 // Expected memo size in bytes (larger due to full hash)
      },
      {
        name: 'ETH 5k prediction',
        predictionId: 'clx987654321',
        canonical: 'ETH close >= 5000 USD on 2025-06-30',
        deadline: '2025-06-30T00:00:00.000Z',
        resolverRef: '{"asset":"ETH","source":"coingecko","field":"close"}',
        wallet: 'So11111111111111111111111111111111111111112',
        expectedHash: '', // Will be calculated dynamically
        expectedSize: 140
      }
    ];

    goldenTests.forEach(({ name, predictionId, canonical, deadline, resolverRef, expectedSize }) => {
      it(`golden test: ${name}`, () => {
        const result = generateSolanaMemo(
          predictionId,
          canonical,
          new Date(deadline),
          resolverRef
        );
        
        // Test deterministic properties
        expect(result.payload.t).toBe('predikt.v1');
        expect(result.payload.pid).toBe(predictionId);
        expect(result.payload.d).toBe(deadline.split('T')[0]);
        expect(result.payload.h).toHaveLength(64); // Full hash
        expect(result.size).toBeLessThanOrEqual(180);
        
        // Test that hash is consistent
        const hash1 = generatePredictionHash(canonical, deadline, resolverRef);
        const hash2 = generatePredictionHash(canonical, deadline, resolverRef);
        expect(hash1).toBe(hash2);
        expect(result.payload.h).toBe(hash1);
      });
    });
  });
});
