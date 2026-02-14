import { describe, expect, it } from 'vitest';
import { createSafeETag, validateSignature, validateUrlParameter } from '../../app/lib/url-validation';

describe('url-validation', () => {
  describe('validateSignature', () => {
    it('accepts valid Solana-style base58 signatures', () => {
      const sig = '3'.repeat(88);
      const result = validateSignature(sig);

      expect(result.isValid).toBe(true);
      expect(result.sanitized).toBe(sig);
    });

    it('rejects signatures with non-base58 characters', () => {
      const sig = `${'3'.repeat(40)}+/=`;
      const result = validateSignature(sig);

      expect(result.isValid).toBe(false);
      expect(result.error).toContain('base58');
    });

    it('rejects signatures outside allowed length bounds', () => {
      const result = validateSignature('3'.repeat(20));

      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Expected 43-88');
    });
  });

  describe('createSafeETag', () => {
    it('falls back to unknown when sanitized input is empty', () => {
      expect(createSafeETag('%%%')).toBe('"unknown"');
      expect(createSafeETag('%%%', 'v1')).toBe('"v1-unknown"');
    });

    it('sanitizes both prefix and value', () => {
      expect(createSafeETag('a b c', 'og@insight')).toBe('"oginsight-abc"');
    });
  });

  describe('validateUrlParameter', () => {
    it('rejects null bytes', () => {
      const result = validateUrlParameter('abc\0def', 'param');

      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Invalid characters');
    });
  });
});
