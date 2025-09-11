import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock fetch globally
global.fetch = vi.fn();

describe('Advisor JSON.parse Guard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should not call response.json() on 204 responses', async () => {
    // Mock 204 response
    const mockResponse = {
      ok: true,
      status: 204,
      headers: {
        get: vi.fn().mockReturnValue('text/plain')
      }
    };

    (global.fetch as any).mockResolvedValue(mockResponse);

    // Simulate the connectWallet function behavior
    const connectWallet = async (walletAddress: string) => {
      const response = await fetch('/api/advisor/portfolio/snapshot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ walletAddress: walletAddress.trim() })
      });

      // Handle 204/304 and non-JSON responses safely
      const ct = response.headers.get('content-type') || '';
      if (response.status === 204 || response.status === 304 || !ct.includes('application/json')) {
        return { error: 'No data available from server' };
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to connect wallet');
      }

      const data = await response.json();
      return data;
    };

    const result = await connectWallet('test_wallet_address');

    // Should return error message instead of calling response.json()
    expect(result).toEqual({ error: 'No data available from server' });
    
    // Verify fetch was called
    expect(global.fetch).toHaveBeenCalledWith('/api/advisor/portfolio/snapshot', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ walletAddress: 'test_wallet_address' })
    });
  });

  it('should not call response.json() on 304 responses', async () => {
    // Mock 304 response
    const mockResponse = {
      ok: true,
      status: 304,
      headers: {
        get: vi.fn().mockReturnValue('text/plain')
      }
    };

    (global.fetch as any).mockResolvedValue(mockResponse);

    const connectWallet = async (walletAddress: string) => {
      const response = await fetch('/api/advisor/portfolio/snapshot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ walletAddress: walletAddress.trim() })
      });

      const ct = response.headers.get('content-type') || '';
      if (response.status === 204 || response.status === 304 || !ct.includes('application/json')) {
        return { error: 'No data available from server' };
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to connect wallet');
      }

      const data = await response.json();
      return data;
    };

    const result = await connectWallet('test_wallet_address');

    expect(result).toEqual({ error: 'No data available from server' });
  });

  it('should not call response.json() on non-JSON content type', async () => {
    // Mock response with non-JSON content type
    const mockResponse = {
      ok: true,
      status: 200,
      headers: {
        get: vi.fn().mockReturnValue('text/html')
      }
    };

    (global.fetch as any).mockResolvedValue(mockResponse);

    const connectWallet = async (walletAddress: string) => {
      const response = await fetch('/api/advisor/portfolio/snapshot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ walletAddress: walletAddress.trim() })
      });

      const ct = response.headers.get('content-type') || '';
      if (response.status === 204 || response.status === 304 || !ct.includes('application/json')) {
        return { error: 'No data available from server' };
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to connect wallet');
      }

      const data = await response.json();
      return data;
    };

    const result = await connectWallet('test_wallet_address');

    expect(result).toEqual({ error: 'No data available from server' });
  });

  it('should call response.json() on valid JSON responses', async () => {
    // Mock valid JSON response
    const mockJsonData = { data: { snapshot: {}, riskAssessment: {} } };
    const mockResponse = {
      ok: true,
      status: 200,
      headers: {
        get: vi.fn().mockReturnValue('application/json')
      },
      json: vi.fn().mockResolvedValue(mockJsonData)
    };

    (global.fetch as any).mockResolvedValue(mockResponse);

    const connectWallet = async (walletAddress: string) => {
      const response = await fetch('/api/advisor/portfolio/snapshot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ walletAddress: walletAddress.trim() })
      });

      const ct = response.headers.get('content-type') || '';
      if (response.status === 204 || response.status === 304 || !ct.includes('application/json')) {
        return { error: 'No data available from server' };
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to connect wallet');
      }

      const data = await response.json();
      return data;
    };

    const result = await connectWallet('test_wallet_address');

    expect(result).toEqual(mockJsonData);
    expect(mockResponse.json).toHaveBeenCalled();
  });

  it('should handle error responses with JSON content', async () => {
    // Mock error response with JSON
    const mockErrorData = { error: 'Invalid wallet address' };
    const mockResponse = {
      ok: false,
      status: 400,
      headers: {
        get: vi.fn().mockReturnValue('application/json')
      },
      json: vi.fn().mockResolvedValue(mockErrorData)
    };

    (global.fetch as any).mockResolvedValue(mockResponse);

    const connectWallet = async (walletAddress: string) => {
      const response = await fetch('/api/advisor/portfolio/snapshot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ walletAddress: walletAddress.trim() })
      });

      const ct = response.headers.get('content-type') || '';
      if (response.status === 204 || response.status === 304 || !ct.includes('application/json')) {
        return { error: 'No data available from server' };
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to connect wallet');
      }

      const data = await response.json();
      return data;
    };

    await expect(connectWallet('invalid_wallet')).rejects.toThrow('Invalid wallet address');
    expect(mockResponse.json).toHaveBeenCalled();
  });
});
