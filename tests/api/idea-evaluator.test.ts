import { createMocks } from 'node-mocks-http';
import { POST } from '../../app/api/idea-evaluator/evaluate/route';
import { NextRequest } from 'next/server';
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the evaluateIdea function to avoid requiring OpenAI API key in tests
vi.mock('@/lib/ai/evaluator', () => ({
    evaluateIdea: vi.fn().mockResolvedValue({
        overallScore: 85,
        summary: {
            title: "Test Evaluation",
            oneLiner: "A test evaluation response.",
            mainVerdict: "This is a test verdict."
        },
        technical: {
            feasibilityScore: 90,
            keyRisks: ["Test risk 1", "Test risk 2"],
            requiredComponents: ["Component 1", "Component 2"],
            comments: "Test technical comments."
        },
        tokenomics: {
            tokenNeeded: true,
            designScore: 70,
            mainIssues: ["Issue 1", "Issue 2"],
            suggestions: ["Suggestion 1", "Suggestion 2"]
        },
        market: {
            marketFitScore: 75,
            targetAudience: ["Audience 1", "Audience 2"],
            competitorSignals: ["Competitor 1", "Competitor 2"],
            goToMarketRisks: ["Risk 1", "Risk 2"]
        },
        execution: {
            complexityLevel: "medium" as const,
            founderReadinessFlags: [],
            estimatedTimeline: "3-4 months"
        },
        recommendations: {
            mustFixBeforeBuild: ["Fix 1"],
            recommendedPivots: ["Pivot 1"],
            niceToHaveLater: ["Nice to have 1"]
        }
    })
}));

// Helper to create a NextRequest with JSON body
function createJsonRequest(body: any): NextRequest {
    return new NextRequest('http://localhost:3000/api/idea-evaluator/evaluate', {
        method: 'POST',
        body: JSON.stringify(body),
        headers: {
            'Content-Type': 'application/json',
        },
    });
}

describe('/api/idea-evaluator/evaluate', () => {
    it('returns 200 and evaluation result for valid payload', async () => {
        const validPayload = {
            description: "A decentralized prediction market for meme coins.",
            projectType: "memecoin",
            teamSize: "team_2_5",
            resources: ["developer", "marketer"],
            successDefinition: "Reach 10k users in 3 months.",
            responseStyle: "full"
        };

        const req = createJsonRequest(validPayload);
        const res = await POST(req);
        const data = await res.json();

        expect(res.status).toBe(200);
        expect(data).toHaveProperty('result');
        expect(data.result).toHaveProperty('overallScore');
        expect(data.result).toHaveProperty('summary');
        expect(data.result.summary).toHaveProperty('title');
        expect(data.result.technical).toHaveProperty('feasibilityScore');
    });

    it('returns 400 for invalid payload', async () => {
        const invalidPayload = {
            description: "Too short", // Min length is 10
            // Missing other required fields
        };

        const req = createJsonRequest(invalidPayload);
        const res = await POST(req);
        const data = await res.json();

        expect(res.status).toBe(400);
        expect(data).toHaveProperty('error');
        expect(data).toHaveProperty('issues');
    });
});
