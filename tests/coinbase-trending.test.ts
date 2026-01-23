import { describe, it, expect, vi } from 'vitest';
import { CoinbaseMarketService } from '../src/lib/market/coinbase';

describe('CoinbaseMarketService', () => {
    const service = new CoinbaseMarketService();

    it('filters out major assets and stables', async () => {
        // Mock the global fetch
        const mockProducts = [
            { id: 'BTC-USD', base_currency: 'BTC', quote_currency: 'USD', status: 'online' },
            { id: 'ETH-USD', base_currency: 'ETH', quote_currency: 'USD', status: 'online' },
            { id: 'SOL-USD', base_currency: 'SOL', quote_currency: 'USD', status: 'online' },
            { id: 'BONK-USD', base_currency: 'BONK', quote_currency: 'USD', status: 'online' },
            { id: 'PEPE-USD', base_currency: 'PEPE', quote_currency: 'USD', status: 'online' },
            { id: 'USDC-USD', base_currency: 'USDC', quote_currency: 'USD', status: 'online' },
        ];

        const mockStats = {
            volume: '1000000',
            last: '0.00001',
            open: '0.000009',
        };

        global.fetch = vi.fn((url) => {
            if (url.endsWith('/products')) {
                return Promise.resolve({
                    ok: true,
                    json: () => Promise.resolve(mockProducts),
                });
            }
            return Promise.resolve({
                ok: true,
                json: () => Promise.resolve(mockStats),
            });
        }) as any;

        const feed = await service.getTrendingFeed();

        const symbols = feed.items.map(i => i.baseSymbol);
        expect(symbols).toContain('BONK');
        expect(symbols).toContain('PEPE');
        expect(symbols).not.toContain('BTC');
        expect(symbols).not.toContain('ETH');
        expect(symbols).not.toContain('SOL');
        expect(symbols).not.toContain('USDC');
    });

    it('calculates scores and sorts correctly', async () => {
        const mockProducts = [
            { id: 'A-USD', base_currency: 'A', quote_currency: 'USD', status: 'online' },
            { id: 'B-USD', base_currency: 'B', quote_currency: 'USD', status: 'online' },
        ];

        // mock stats: A has lower volume but higher momentum, B higher volume lower momentum
        global.fetch = vi.fn((url) => {
            if (url.endsWith('/products')) {
                return Promise.resolve({ ok: true, json: () => Promise.resolve(mockProducts) });
            }
            if (url.includes('A-USD')) {
                return Promise.resolve({
                    ok: true,
                    json: () => Promise.resolve({ volume: '100', last: '20', open: '10' }), // +100%
                });
            }
            return Promise.resolve({
                ok: true,
                json: () => Promise.resolve({ volume: '1000', last: '10', open: '10' }), // 0%
            });
        }) as any;

        const feed = await service.getTrendingFeed();

        expect(feed.items.length).toBe(2);
        // B has much more volume (1000 vs 100), and weight is 0.7 for volume. B should be higher.
        expect(feed.items[0].baseSymbol).toBe('B');
        expect(feed.items[1].baseSymbol).toBe('A');
    });
});
