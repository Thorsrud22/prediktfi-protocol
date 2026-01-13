import { describe, it, expect, vi } from 'vitest';
import { buildXShareUrl, persistReferralData } from '../app/lib/share';

describe('Share Utilities', () => {
  const mockData = {
    question: 'Will Bitcoin hit 100k?',
    prob: 0.85,
    signature: '1234567890abcdef'
  };

  describe('buildXShareUrl', () => {
    it('should generate correct X share URL with validation text', () => {
      const url = buildXShareUrl(mockData);

      expect(url).toContain('https://twitter.com/intent/tweet');
      expect(url).toContain('text=');

      // Decode the URL to check content more easily
      const decodedUrl = decodeURIComponent(url);
      expect(decodedUrl).toContain('Just validated my project idea on @PrediktFi');
      expect(decodedUrl).toContain('AI Confidence: 85%');
      expect(decodedUrl).toContain('#BuildPublic');
    });

    it('should include correct link when signature is present', () => {
      const url = buildXShareUrl(mockData);
      // It should link to /i/signature
      // Note: buildShareUrl uses window.location.origin if available, or https://predikt.fi
      // We are in node environment so it falls back to https://predikt.fi
      const decodedUrl = decodeURIComponent(url);
      expect(decodedUrl).toContain('/i/1234567890abcdef');
    });

    it('should default to /studio if signature is missing', () => {
      const url = buildXShareUrl({ ...mockData, signature: undefined });
      const decodedUrl = decodeURIComponent(url);
      expect(decodedUrl).toContain('/studio');
    });
  });

  describe('persistReferralData', () => {
    it('should save referral code to localStorage', () => {
      // Mock localStorage
      const localStorageMock = {
        getItem: vi.fn(),
        setItem: vi.fn(),
        clear: vi.fn()
      };
      Object.defineProperty(window, 'localStorage', { value: localStorageMock });

      const params = new URLSearchParams('ref=satoshi&creator=vitalik');
      persistReferralData(params);

      expect(localStorageMock.setItem).toHaveBeenCalledWith('predikt:ref', 'satoshi');
      expect(localStorageMock.setItem).toHaveBeenCalledWith('predikt:creatorId', 'vitalik');
    });
  });
});
