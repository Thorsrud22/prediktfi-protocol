import { describe, it, expect } from 'vitest';
import { buildXShareUrl, buildCopyLink, generateShareText } from '../src/lib/share';

describe('Share Utilities', () => {
  const mockData = {
    idHashed: 'alice_predictor',
    score: 0.923,
    acc90d: 0.89,
    handle: 'alice_predictor'
  };

  describe('buildXShareUrl', () => {
    it('should generate correct X share URL with UTM parameters', () => {
      const url = buildXShareUrl(mockData);
      
      expect(url).toContain('https://twitter.com/intent/tweet');
      expect(url).toContain('text=');
      expect(url).toContain('Check+out+my+prediction+stats+on+%40PrediktFi');
      expect(url).toContain('Score+0.923');
      expect(url).toContain('90d+accuracy+89.0%25');
      expect(url).toContain('utm_source=x');
      expect(url).toContain('utm_medium=social');
      expect(url).toContain('utm_campaign=creator_profile');
    });

    it('should URL encode special characters correctly', () => {
      const dataWithSpecialChars = {
        ...mockData,
        idHashed: 'test@user#123',
        handle: 'test@user#123'
      };
      
      const url = buildXShareUrl(dataWithSpecialChars);
      expect(url).toContain('test%40user%23123');
    });

    it('should use custom base URL when provided', () => {
      const customData = {
        ...mockData,
        baseUrl: 'https://custom.prediktfi.com'
      };
      
      const url = buildXShareUrl(customData);
      expect(url).toContain('https%3A%2F%2Fcustom.prediktfi.com%2Fcreator%2Falice_predictor');
    });
  });

  describe('buildCopyLink', () => {
    it('should generate correct copy link with UTM parameters', () => {
      const link = buildCopyLink(mockData);
      
      expect(link).toContain('/creator/alice_predictor');
      expect(link).toContain('utm_source=copy');
      expect(link).toContain('utm_medium=link');
      expect(link).toContain('utm_campaign=creator_profile');
    });

    it('should use custom base URL when provided', () => {
      const customData = {
        ...mockData,
        baseUrl: 'https://custom.prediktfi.com'
      };
      
      const link = buildCopyLink(customData);
      expect(link).toContain('https://custom.prediktfi.com/creator/alice_predictor');
    });
  });

  describe('generateShareText', () => {
    it('should generate correct text for X platform', () => {
      const text = generateShareText(mockData, 'x');
      
      expect(text).toContain('Check out my prediction stats on @PrediktFi');
      expect(text).toContain('Score 0.923');
      expect(text).toContain('90d accuracy 89.0%');
    });

    it('should generate correct text for LinkedIn platform', () => {
      const text = generateShareText(mockData, 'linkedin');
      
      expect(text).toContain('I\'ve been tracking my prediction accuracy on PrediktFi');
      expect(text).toContain('Current score: 0.923');
      expect(text).toContain('89.0% accuracy over the last 90 days');
    });

    it('should generate correct text for generic platform', () => {
      const text = generateShareText(mockData, 'generic');
      
      expect(text).toContain('My prediction performance on PrediktFi');
      expect(text).toContain('Score 0.923');
      expect(text).toContain('90-day accuracy 89.0%');
    });

    it('should default to generic platform when not specified', () => {
      const text = generateShareText(mockData);
      
      expect(text).toContain('My prediction performance on PrediktFi');
    });
  });

  describe('edge cases', () => {
    it('should handle very low scores', () => {
      const lowScoreData = {
        ...mockData,
        score: 0.001,
        acc90d: 0.001
      };
      
      const url = buildXShareUrl(lowScoreData);
      expect(url).toContain('Score+0.001');
      expect(url).toContain('90d+accuracy+0.1%25');
    });

    it('should handle very high scores', () => {
      const highScoreData = {
        ...mockData,
        score: 0.999,
        acc90d: 0.999
      };
      
      const url = buildXShareUrl(highScoreData);
      expect(url).toContain('Score+0.999');
      expect(url).toContain('90d+accuracy+99.9%25');
    });

    it('should handle empty handle', () => {
      const emptyHandleData = {
        ...mockData,
        handle: ''
      };
      
      const url = buildXShareUrl(emptyHandleData);
      expect(url).toContain('%2Fcreator%2Falice_predictor'); // Uses idHashed, URL encoded
    });
  });
});
