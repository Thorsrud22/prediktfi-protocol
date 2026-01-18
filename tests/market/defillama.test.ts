/**
 * Tests for DeFiLlama client
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
    formatTVL,
    getDeFiCompetitors,
    getSolanaTopProtocols,
    getChainTVL,
} from '@/lib/defiLlamaClient';

// Mock fetch globally
global.fetch = vi.fn();

describe('DeFiLlama Client', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('formatTVL', () => {
        it('formats billions correctly', () => {
            expect(formatTVL(1_500_000_000)).toBe('$1.50B');
            expect(formatTVL(2_000_000_000)).toBe('$2.00B');
        });

        it('formats millions correctly', () => {
            expect(formatTVL(150_000_000)).toBe('$150.0M');
            expect(formatTVL(1_500_000)).toBe('$1.5M');
        });

        it('formats thousands correctly', () => {
            expect(formatTVL(150_000)).toBe('$150K');
            expect(formatTVL(1_500)).toBe('$2K'); // Rounds to nearest K
        });

        it('formats small values correctly', () => {
            expect(formatTVL(500)).toBe('$500');
            expect(formatTVL(0)).toBe('$0');
        });
    });

    describe('getDeFiCompetitors', () => {
        it('fetches and filters protocols by mechanism type', async () => {
            const mockProtocols = [
                { name: 'Kamino', slug: 'kamino', tvl: 1_200_000_000, chain: 'Solana', category: 'Lending', change_1d: 2.5, change_7d: 5.0 },
                { name: 'Marginfi', slug: 'marginfi', tvl: 500_000_000, chain: 'Solana', category: 'Lending', change_1d: -1.0, change_7d: 3.0 },
                { name: 'Raydium', slug: 'raydium', tvl: 800_000_000, chain: 'Solana', category: 'Dexes', change_1d: 0.5, change_7d: -2.0 },
                { name: 'Aave', slug: 'aave', tvl: 10_000_000_000, chain: 'Ethereum', category: 'Lending', change_1d: 1.0, change_7d: 2.0 },
            ];

            (global.fetch as any).mockResolvedValue({
                ok: true,
                json: async () => mockProtocols,
            });

            const result = await getDeFiCompetitors('lending', 'Solana');

            expect(result.length).toBe(2);
            expect(result[0].name).toBe('Kamino'); // Sorted by TVL
            expect(result[1].name).toBe('Marginfi');
        });

        it('returns empty array on API error', async () => {
            (global.fetch as any).mockResolvedValue({
                ok: false,
                status: 500,
            });

            const result = await getDeFiCompetitors('lending', 'Solana');
            expect(result).toEqual([]);
        });
    });

    describe('getChainTVL', () => {
        it('fetches chain TVL data', async () => {
            const mockChains = [
                { name: 'Ethereum', tvl: 50_000_000_000 },
                { name: 'Solana', tvl: 5_000_000_000 },
                { name: 'Arbitrum', tvl: 3_000_000_000 },
            ];

            (global.fetch as any).mockResolvedValue({
                ok: true,
                json: async () => mockChains,
            });

            const result = await getChainTVL('Solana');

            expect(result).not.toBeNull();
            expect(result?.name).toBe('Solana');
            expect(result?.tvl).toBe(5_000_000_000);
        });

        it('returns null for unknown chain', async () => {
            const mockChains = [
                { name: 'Ethereum', tvl: 50_000_000_000 },
            ];

            (global.fetch as any).mockResolvedValue({
                ok: true,
                json: async () => mockChains,
            });

            const result = await getChainTVL('FakeChain');
            expect(result).toBeNull();
        });
    });

    describe('getSolanaTopProtocols', () => {
        it('returns top Solana protocols sorted by TVL', async () => {
            const mockProtocols = [
                { name: 'Kamino', slug: 'kamino', tvl: 1_200_000_000, chain: 'Solana', category: 'Lending', change_1d: null, change_7d: null },
                { name: 'Marinade', slug: 'marinade', tvl: 1_500_000_000, chain: 'Solana', category: 'Liquid Staking', change_1d: null, change_7d: null },
                { name: 'Raydium', slug: 'raydium', tvl: 800_000_000, chain: 'Solana', category: 'Dexes', change_1d: null, change_7d: null },
                { name: 'Aave', slug: 'aave', tvl: 10_000_000_000, chain: 'Ethereum', category: 'Lending', change_1d: null, change_7d: null },
            ];

            (global.fetch as any).mockResolvedValue({
                ok: true,
                json: async () => mockProtocols,
            });

            const result = await getSolanaTopProtocols(3);

            expect(result.length).toBe(3);
            expect(result[0].name).toBe('Marinade'); // Highest Solana TVL
            expect(result[1].name).toBe('Kamino');
            expect(result[2].name).toBe('Raydium');
        });
    });
});
