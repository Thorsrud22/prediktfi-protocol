import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
    searchWeb,
    generateCompetitorQueries,
    searchCompetitors,
} from "@/lib/tavilyClient";

describe("Tavily Client", () => {
    const originalEnv = process.env;

    beforeEach(() => {
        vi.resetAllMocks();
        process.env = { ...originalEnv };
    });

    afterEach(() => {
        process.env = originalEnv;
        vi.restoreAllMocks();
    });

    describe("generateCompetitorQueries", () => {
        it("generates memecoin queries", () => {
            const queries = generateCompetitorQueries(
                "A dog-themed memecoin on Solana",
                "memecoin"
            );
            expect(queries.length).toBeGreaterThanOrEqual(1);
            expect(queries.some((q) => q.toLowerCase().includes("memecoin"))).toBe(
                true
            );
        });

        it("generates DeFi lending queries", () => {
            const queries = generateCompetitorQueries(
                "A lending protocol for Solana",
                "defi"
            );
            expect(queries.length).toBeGreaterThanOrEqual(1);
            expect(queries.some((q) => q.toLowerCase().includes("defi"))).toBe(true);
        });

        it("generates AI queries", () => {
            const queries = generateCompetitorQueries(
                "An AI agent framework for crypto",
                "ai"
            );
            expect(queries.length).toBeGreaterThanOrEqual(1);
            expect(queries.some((q) => q.toLowerCase().includes("ai"))).toBe(true);
        });
    });

    describe("searchWeb", () => {
        it("returns empty array when no API key is set", async () => {
            delete process.env.TAVILY_API_KEY;
            const results = await searchWeb("test query");
            expect(results).toEqual([]);
        });

        it("calls Tavily API when key is set", async () => {
            process.env.TAVILY_API_KEY = "test-key";

            const mockResults = [
                {
                    title: "Test Result",
                    url: "https://example.com",
                    content: "Test content",
                    score: 0.9,
                },
            ];

            global.fetch = vi.fn().mockResolvedValue({
                ok: true,
                json: () => Promise.resolve({ results: mockResults }),
            });

            const results = await searchWeb("test query");

            expect(fetch).toHaveBeenCalledWith(
                "https://api.tavily.com/search",
                expect.objectContaining({
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                })
            );

            expect(results).toEqual(mockResults);
        });

        it("returns empty array on API error", async () => {
            process.env.TAVILY_API_KEY = "test-key";

            global.fetch = vi.fn().mockResolvedValue({
                ok: false,
                status: 401,
                text: () => Promise.resolve("Unauthorized"),
            });

            const results = await searchWeb("test query");
            expect(results).toEqual([]);
        });
    });

    describe("searchCompetitors", () => {
        it("deduplicates results by URL", async () => {
            process.env.TAVILY_API_KEY = "test-key";

            const duplicateResult = {
                title: "Same Page",
                url: "https://example.com/same",
                content: "Content",
                score: 0.8,
            };

            const uniqueResult = {
                title: "Other Page",
                url: "https://example.com/other",
                content: "Other content",
                score: 0.7,
            };

            // Mock fetch to return duplicate URLs across calls
            let callCount = 0;
            global.fetch = vi.fn().mockImplementation(() => {
                callCount++;
                return Promise.resolve({
                    ok: true,
                    json: () =>
                        Promise.resolve({
                            results:
                                callCount === 1
                                    ? [duplicateResult]
                                    : [duplicateResult, uniqueResult],
                        }),
                });
            });

            const results = await searchCompetitors("Test idea", "memecoin");

            // Should have deduplicated the duplicate URL
            const urls = results.map((r) => r.url);
            const uniqueUrls = [...new Set(urls)];
            expect(urls.length).toBe(uniqueUrls.length);
        });
    });
});
