import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { BirdeyeMarketService } from '../src/lib/market/birdeye';

// Mock global fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('BirdeyeMarketService', () => {
    let service: BirdeyeMarketService;

    beforeEach(() => {
        vi.clearAllMocks();
        process.env.BIRDEYE_API_KEY = 'test-key';
        service = new BirdeyeMarketService();
    });

    afterEach(() => {
        // Clear any cached data between tests
        vi.clearAllMocks();
    });

    it('fetches trending tokens correctly via fetch', async () => {
        const mockResponse = {
            success: true,
            data: {
                tokens: [
                    { address: 'addr1', name: 'Token 1', symbol: 'T1', decimals: 9, liquidity: 1000, volume24hUSD: 500 },
                    { address: 'addr2', name: 'Token 2', symbol: 'T2', decimals: 9, liquidity: 2000, volume24hUSD: 1000 }
                ]
            }
        };

        mockFetch.mockResolvedValueOnce({
            ok: true,
            json: async () => mockResponse
        });

        const tokens = await service.getTrendingTokens('solana', 2);

        expect(tokens).toHaveLength(2);
        expect(tokens[0].symbol).toBe('T1');
        expect(mockFetch).toHaveBeenCalledWith(
            expect.stringContaining('/defi/token_trending'),
            expect.objectContaining({
                headers: expect.objectContaining({
                    'X-API-KEY': 'test-key',
                    'x-chain': 'solana'
                })
            })
        );
    });

    it('searches tokens correctly via fetch', async () => {
        const mockResponse = {
            success: true,
            data: {
                items: [
                    {
                        type: 'token',
                        result: [
                            { address: 'addr1', name: 'Token 1', symbol: 'T1', network: 'solana', decimals: 9, verified: true }
                        ]
                    }
                ]
            }
        };

        mockFetch.mockResolvedValueOnce({
            ok: true,
            json: async () => mockResponse
        });

        const results = await service.searchTokens('T1', 'solana');

        expect(results).toHaveLength(1);
        expect(results[0].symbol).toBe('T1');
        expect(mockFetch).toHaveBeenCalledWith(
            expect.stringContaining('/defi/v3/search'),
            expect.anything()
        );
    });

    it('handles fetch errors gracefully', async () => {
        mockFetch.mockRejectedValueOnce(new Error('Network Error'));

        const tokens = await service.getTrendingTokens();
        expect(tokens).toEqual([]);
    });

    it('returns null for security when feature flag is disabled', async () => {
        // Security endpoint is disabled by default
        delete process.env.BIRDEYE_ENABLE_SECURITY;

        const security = await service.getTokenSecurity('addr1');
        expect(security).toBeNull();
        expect(mockFetch).not.toHaveBeenCalled();
    });

    it('fetches token security when feature flag is enabled', async () => {
        process.env.BIRDEYE_ENABLE_SECURITY = 'true';

        const mockResponse = {
            success: true,
            data: {
                owner: 'owner-addr',
                creator: 'creator-addr',
                ownerPercentage: 10,
                creatorPercentage: 5,
                top10HolderPercentage: 40,
                totalLiquidity: 100000,
                liquidity: [{ isLocked: true }]
            }
        };

        mockFetch.mockResolvedValueOnce({
            ok: true,
            json: async () => mockResponse
        });

        const security = await service.getTokenSecurity('addr1');

        expect(security).not.toBeNull();
        expect(security?.isLiquidityLocked).toBe(true);
        expect(security?.ownerPercentage).toBe(10);
    });

    it('uses cache for repeated trending requests', async () => {
        const mockResponse = {
            success: true,
            data: {
                tokens: [
                    { address: 'addr1', name: 'Token 1', symbol: 'T1', decimals: 9, liquidity: 1000, volume24hUSD: 500 }
                ]
            }
        };

        mockFetch.mockResolvedValue({
            ok: true,
            json: async () => mockResponse
        });

        // First call should fetch
        await service.getTrendingTokens('solana', 5);
        expect(mockFetch).toHaveBeenCalledTimes(1);

        // Second call should use cache
        await service.getTrendingTokens('solana', 5);
        expect(mockFetch).toHaveBeenCalledTimes(1); // Still 1, cache hit
    });
});
