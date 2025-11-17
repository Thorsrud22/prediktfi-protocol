import { renderHook, waitFor } from '@testing-library/react';
import { vi, beforeEach, describe, it, expect } from 'vitest';
import { useTopCreators } from '../../src/lib/topCreatorsClient';

// Mock fetch
global.fetch = vi.fn() as any;

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

describe('useTopCreators', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
  });

  it('should fetch data from API when no cache exists', async () => {
    const mockResponse = {
      leaderboard: [
        { id: 'creator-1', handle: 'alice', rank: 1 },
        { id: 'creator-2', handle: 'bob', rank: 2 },
        { id: 'creator-3', handle: 'charlie', rank: 3 },
      ],
      meta: { period: '90d', limit: 50, total: 3, generatedAt: new Date().toISOString() }
    };

    (fetch as any as vi.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    });

    const { result } = renderHook(() => useTopCreators());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.getCreatorRank('creator-1')).toBe(1);
    expect(result.current.getCreatorRank('creator-2')).toBe(2);
    expect(result.current.getCreatorRank('creator-3')).toBe(3);
    expect(result.current.isTopCreator('creator-1')).toBe(true);
    expect(result.current.isTopCreator('creator-4')).toBe(false);
  });

  it('should use cached data when available and not expired', async () => {
    const cachedData = {
      data: { 'creator-1': 1, 'creator-2': 2, 'creator-3': 3 },
      timestamp: Date.now() - 100000 // 100 seconds ago (within TTL)
    };

    localStorageMock.getItem.mockReturnValue(JSON.stringify(cachedData));

    const { result } = renderHook(() => useTopCreators());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.getCreatorRank('creator-1')).toBe(1);
    expect(result.current.getCreatorRank('creator-2')).toBe(2);
    expect(fetch).not.toHaveBeenCalled();
  });

  it('should fetch fresh data when cache is expired', async () => {
    const expiredCache = {
      data: { 'creator-1': 1, 'creator-2': 2 },
      timestamp: Date.now() - 400000 // 400 seconds ago (expired)
    };

    localStorageMock.getItem.mockReturnValue(JSON.stringify(expiredCache));

    const mockResponse = {
      leaderboard: [
        { id: 'creator-1', handle: 'alice', rank: 1 },
        { id: 'creator-2', handle: 'bob', rank: 2 },
      ],
      meta: { period: '90d', limit: 50, total: 2, generatedAt: new Date().toISOString() }
    };

    (fetch as any as vi.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    });

    const { result } = renderHook(() => useTopCreators());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(fetch).toHaveBeenCalledWith('/api/leaderboard?period=90d&limit=50');
    expect(localStorageMock.setItem).toHaveBeenCalled();
  });

  it('should return correct badge text for top creators', async () => {
    const mockResponse = {
      leaderboard: [
        { id: 'creator-1', handle: 'alice', rank: 1 },
        { id: 'creator-2', handle: 'bob', rank: 2 },
        { id: 'creator-3', handle: 'charlie', rank: 3 },
        { id: 'creator-4', handle: 'diana', rank: 4 },
      ],
      meta: { period: '90d', limit: 50, total: 4, generatedAt: new Date().toISOString() }
    };

    (fetch as any as vi.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    });

    const { result } = renderHook(() => useTopCreators());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.getTopCreatorBadge('creator-1')).toBe('Top 1 this week');
    expect(result.current.getTopCreatorBadge('creator-2')).toBe('Top 2 this week');
    expect(result.current.getTopCreatorBadge('creator-3')).toBe('Top 3 this week');
    expect(result.current.getTopCreatorBadge('creator-4')).toBe(null);
  });

  it('should handle API errors gracefully', async () => {
    (fetch as any as vi.Mock).mockRejectedValueOnce(new Error('API Error'));

    const { result } = renderHook(() => useTopCreators());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBe('API Error');
    expect(result.current.creatorRanks.size).toBe(0);
  });

  it('should handle malformed cache data', async () => {
    localStorageMock.getItem.mockReturnValue('invalid json');

    const mockResponse = {
      leaderboard: [
        { id: 'creator-1', handle: 'alice', rank: 1 },
      ],
      meta: { period: '90d', limit: 50, total: 1, generatedAt: new Date().toISOString() }
    };

    (fetch as any as vi.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    });

    const { result } = renderHook(() => useTopCreators());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(fetch).toHaveBeenCalled();
    expect(result.current.getCreatorRank('creator-1')).toBe(1);
  });
});
