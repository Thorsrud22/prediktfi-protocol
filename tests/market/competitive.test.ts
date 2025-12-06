import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fetchCompetitiveMemo } from '../../src/lib/market/competitive';
import { IdeaSubmission } from '../../src/lib/ideaSchema';

// Mock OpenAI
vi.mock('@/lib/openaiClient', () => ({
    openai: vi.fn().mockReturnValue({
        responses: {
            create: vi.fn()
        }
    })
}));

import { openai } from '../../src/lib/openaiClient';

describe('fetchCompetitiveMemo', () => {
    const mockIdea: IdeaSubmission = {
        description: "A decentralized exchange for dog coins",
        projectType: "memecoin",
        teamSize: "team_2_5",
        resources: [],
        successDefinition: "moon",
        responseStyle: "short",
        mvpScope: "basic swap",
    };

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('returns not_available for unsupported category', async () => {
        const result = await fetchCompetitiveMemo(mockIdea, 'social-fi');
        expect(result.status).toBe('not_available');
        if (result.status === 'not_available') {
            expect(result.reason).toContain('not supported');
        }
    });

    it('returns ok and memo for supported category (memecoin)', async () => {
        const mockMemo = {
            categoryLabel: "Memecoin - Animal",
            crowdednessLevel: "saturated",
            shortLandscapeSummary: "Dog coins are everywhere.",
            referenceProjects: [
                { name: "Doge", chainOrPlatform: "Dogechain", note: "The OG" }
            ],
            tractionDifficulty: { label: "extreme", explanation: "Hard to stand out" },
            differentiationWindow: { label: "narrow", explanation: "Need unique angle" },
            noiseVsSignal: "mostly_noise",
            evaluatorNotes: "Good luck",
            memecoin: {
                narrativeLabel: "Dog Coin",
                narrativeCrowdedness: "high"
            },
            timestamp: "2023-01-01"
        };

        // Mock OpenAI response
        (openai() as any).responses.create.mockResolvedValueOnce({
            output: mockMemo
        });

        const result = await fetchCompetitiveMemo(mockIdea, 'memecoin');

        expect(result.status).toBe('ok');
        if (result.status === 'ok') {
            expect(result.memo.categoryLabel).toBe("Memecoin - Animal");
            expect(result.memo.memecoin).toBeDefined();
            expect(result.memo.memecoin?.narrativeLabel).toBe("Dog Coin");
            expect(result.memo.defi).toBeUndefined();
        }
    });

    it('returns ok and memo for supported category (defi)', async () => {
        const mockMemo = {
            categoryLabel: "DeFi - DEX",
            crowdednessLevel: "high",
            shortLandscapeSummary: "DEXs are competitive.",
            referenceProjects: [
                { name: "Uniswap", chainOrPlatform: "Ethereum", note: "The King" }
            ],
            tractionDifficulty: { label: "high", explanation: "Liquidity is key" },
            differentiationWindow: { label: "narrow", explanation: "Need new mechanism" },
            noiseVsSignal: "mixed",
            evaluatorNotes: "Hard to compete",
            defi: {
                defiBucket: "DEX",
                categoryKings: ["Uniswap", "Curve"]
            },
            timestamp: "2023-01-01"
        };

        (openai() as any).responses.create.mockResolvedValueOnce({
            output: mockMemo
        });

        const result = await fetchCompetitiveMemo({ ...mockIdea, projectType: 'defi' }, 'defi');

        expect(result.status).toBe('ok');
        if (result.status === 'ok') {
            expect(result.memo.defi).toBeDefined();
            expect(result.memo.defi?.defiBucket).toBe("DEX");
            expect(result.memo.ai).toBeUndefined();
        }
    });

    it('handles invalid LLM response gracefully', async () => {
        // Mock invalid response (missing required fields)
        (openai() as any).responses.create.mockResolvedValueOnce({
            output: { foo: "bar" }
        });

        const result = await fetchCompetitiveMemo(mockIdea, 'memecoin');
        expect(result.status).toBe('not_available');
        if (result.status === 'not_available') {
            expect(result.reason).toBe('invalid_schema_returned');
        }
    });

    it('handles LLM failure gracefully', async () => {
        (openai() as any).responses.create.mockRejectedValueOnce(new Error("API Error"));

        const result = await fetchCompetitiveMemo(mockIdea, 'memecoin');
        expect(result.status).toBe('not_available');
        if (result.status === 'not_available') {
            expect(result.reason).toBe('API Error');
        }
    });
});
