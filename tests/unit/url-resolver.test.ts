/**
 * Unit tests for URL resolver
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { resolveUrlInsight, parseUrlConfig } from '../../lib/resolvers/url';

// Mock fetch globally
global.fetch = vi.fn();

describe('URL Resolver', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('SSRF Protection', () => {
    it('should block localhost URLs', async () => {
      const config = {
        href: 'http://localhost:8080/test',
        expect: 'success'
      };

      const result = await resolveUrlInsight('Test claim', config);

      expect(result.proposed).toBe(null);
      expect(result.reasoning).toContain('Private IP addresses are not allowed');
    });

    it('should block private IP ranges', async () => {
      const privateIPs = [
        'http://127.0.0.1/test',
        'http://10.0.0.1/test',
        'http://172.16.0.1/test',
        'http://192.168.1.1/test',
        'http://169.254.1.1/test'
      ];

      for (const url of privateIPs) {
        const result = await resolveUrlInsight('Test claim', { href: url, expect: 'test' });
        expect(result.proposed).toBe(null);
        expect(result.reasoning).toContain('Private IP addresses are not allowed');
      }
    });

    it('should allow public URLs', async () => {
      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        status: 200,
        headers: new Map([['content-type', 'text/html']]),
        text: () => Promise.resolve('<html><body>Success message</body></html>')
      } as any);

      const config = {
        href: 'https://example.com/test',
        expect: 'success'
      };

      const result = await resolveUrlInsight('Test claim', config);

      expect(result.proposed).not.toBe(null);
      expect(fetch).toHaveBeenCalledWith(
        'https://example.com/test',
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            'User-Agent': 'PrediktFi-Resolver/1.0'
          })
        })
      );
    });

    it('should reject non-HTTP protocols', async () => {
      const config = {
        href: 'ftp://example.com/test',
        expect: 'success'
      };

      const result = await resolveUrlInsight('Test claim', config);

      expect(result.proposed).toBe(null);
      expect(result.reasoning).toContain('Unsupported protocol');
    });
  });

  describe('Content Matching', () => {
    it('should find exact matches with high confidence', async () => {
      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        status: 200,
        headers: new Map([['content-type', 'text/html']]),
        text: () => Promise.resolve('<html><body><h1>Project Completed Successfully</h1></body></html>')
      } as any);

      const config = {
        href: 'https://example.com/status',
        expect: 'completed successfully'
      };

      const result = await resolveUrlInsight('Project will be completed', config);

      expect(result.proposed).toBe('YES');
      expect(result.confidence).toBe(1.0);
      expect(result.reasoning).toContain('High confidence match');
    });

    it('should find partial matches with moderate confidence', async () => {
      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        status: 200,
        headers: new Map([['content-type', 'text/html']]),
        text: () => Promise.resolve('<html><body>The project is complete and ready for deployment</body></html>')
      } as any);

      const config = {
        href: 'https://example.com/status',
        expect: 'project completed successfully'
      };

      const result = await resolveUrlInsight('Project will be completed', config);

      expect(result.proposed).toBe('YES');
      expect(result.confidence).toBeGreaterThan(0.5);
      expect(result.confidence).toBeLessThan(1.0);
    });

    it('should return NO for no matches', async () => {
      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        status: 200,
        headers: new Map([['content-type', 'text/html']]),
        text: () => Promise.resolve('<html><body>Project failed and was cancelled</body></html>')
      } as any);

      const config = {
        href: 'https://example.com/status',
        expect: 'completed successfully'
      };

      const result = await resolveUrlInsight('Project will be completed', config);

      expect(result.proposed).toBe('NO');
      expect(result.confidence).toBe(0);
      expect(result.reasoning).toContain('No matching text found');
    });

    it('should handle HTML tag removal', async () => {
      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        status: 200,
        headers: new Map([['content-type', 'text/html']]),
        text: () => Promise.resolve(`
          <html>
            <head><title>Status</title></head>
            <body>
              <script>console.log('test');</script>
              <style>.hidden { display: none; }</style>
              <div class="status">
                <h1>Project <strong>Completed</strong> Successfully</h1>
                <p>All tasks finished.</p>
              </div>
            </body>
          </html>
        `)
      } as any);

      const config = {
        href: 'https://example.com/status',
        expect: 'project completed successfully'
      };

      const result = await resolveUrlInsight('Project completion status', config);

      expect(result.proposed).toBe('YES');
      expect(result.evidence.extractedText).not.toContain('<script>');
      expect(result.evidence.extractedText).not.toContain('<style>');
      expect(result.evidence.extractedText).toContain('Project Completed Successfully');
    });
  });

  describe('Error Handling', () => {
    it('should handle network errors', async () => {
      vi.mocked(fetch).mockRejectedValue(new Error('Network error'));

      const config = {
        href: 'https://example.com/test',
        expect: 'success'
      };

      const result = await resolveUrlInsight('Test claim', config);

      expect(result.proposed).toBe(null);
      expect(result.reasoning).toContain('Failed to fetch URL');
    });

    it('should handle HTTP errors', async () => {
      vi.mocked(fetch).mockResolvedValue({
        ok: false,
        status: 404,
        statusText: 'Not Found'
      } as any);

      const config = {
        href: 'https://example.com/test',
        expect: 'success'
      };

      const result = await resolveUrlInsight('Test claim', config);

      expect(result.proposed).toBe(null);
      expect(result.reasoning).toContain('HTTP 404');
    });

    it('should handle timeout', async () => {
      vi.mocked(fetch).mockImplementation(() => 
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Timeout')), 100)
        )
      );

      const config = {
        href: 'https://example.com/test',
        expect: 'success',
        timeout: 50
      };

      const result = await resolveUrlInsight('Test claim', config);

      expect(result.proposed).toBe(null);
      expect(result.reasoning).toContain('Failed to fetch URL');
    });

    it('should handle unsupported content types', async () => {
      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        status: 200,
        headers: new Map([['content-type', 'application/pdf']]),
        text: () => Promise.resolve('PDF content')
      } as any);

      const config = {
        href: 'https://example.com/document.pdf',
        expect: 'success'
      };

      const result = await resolveUrlInsight('Test claim', config);

      expect(result.proposed).toBe(null);
      expect(result.reasoning).toContain('Unsupported content type');
    });
  });

  describe('Configuration Parsing', () => {
    it('should parse valid URL config', () => {
      const configJson = JSON.stringify({
        href: 'https://example.com',
        expect: 'success',
        method: 'POST',
        timeout: 10000
      });

      const config = parseUrlConfig(configJson);

      expect(config.href).toBe('https://example.com');
      expect(config.expect).toBe('success');
      expect(config.method).toBe('POST');
      expect(config.timeout).toBe(10000);
    });

    it('should handle minimal config', () => {
      const configJson = JSON.stringify({
        href: 'https://example.com'
      });

      const config = parseUrlConfig(configJson);

      expect(config.href).toBe('https://example.com');
      expect(config.method).toBe('GET');
      expect(config.timeout).toBe(15000);
    });

    it('should throw on invalid JSON', () => {
      expect(() => parseUrlConfig('invalid json')).toThrow('Invalid URL resolver configuration');
    });
  });
});
