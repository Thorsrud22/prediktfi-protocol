import { createMocks } from 'node-mocks-http';
import { POST } from '../../app/api/idea-evaluator/evaluate/route';
import { NextRequest } from 'next/server';
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the evaluateIdea function to avoid requiring OpenAI API key in tests
vi.mock('../../src/lib/ai/evaluator', async (importOriginal) => {
    const actual = await importOriginal<typeof import('../../src/lib/ai/evaluator')>();
    return {
        ...actual,
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
                estimatedTimeline: "3-4 months",
                executionRiskScore: 70,
                executionRiskLabel: "medium" as const,
                executionSignals: ["Some experience"]
            },
            recommendations: {
                mustFixBeforeBuild: ["Fix 1"],
                recommendedPivots: ["Pivot 1"],
                niceToHaveLater: ["Nice to have 1"]
            }
        })
    };
});

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

import { calibrateScore } from '../../src/lib/ai/evaluator';
import { IdeaEvaluationResult } from '../../src/lib/ideaEvaluationTypes';

describe('calibrateScore', () => {
    const baseResult: IdeaEvaluationResult = {
        overallScore: 80,
        summary: {
            title: "Test Project",
            oneLiner: "A standard project.",
            mainVerdict: "Good idea."
        },
        technical: {
            feasibilityScore: 70,
            keyRisks: [],
            requiredComponents: [],
            comments: ""
        },
        tokenomics: {
            tokenNeeded: true,
            designScore: 70,
            mainIssues: [],
            suggestions: []
        },
        market: {
            marketFitScore: 70,
            targetAudience: [],
            competitorSignals: [],
            goToMarketRisks: []
        },
        execution: {
            complexityLevel: "medium",
            founderReadinessFlags: [],
            estimatedTimeline: "",
            executionRiskScore: 50,
            executionRiskLabel: "medium",
            executionSignals: []
        },
        recommendations: {
            mustFixBeforeBuild: [],
            recommendedPivots: [],
            niceToHaveLater: []
        }
    };

    it('penalizes low quality memecoins with risks', () => {
        const memeResult = {
            ...baseResult,
            overallScore: 60,
            summary: {
                ...baseResult.summary,
                oneLiner: "A risky memecoin.",
                mainVerdict: "High risk."
            },
            market: {
                ...baseResult.market,
                marketFitScore: 40, // Weak market fit penalty (-10)
                goToMarketRisks: ["Potential scam"] // Risk penalty (-20)
            }
        };

        const calibrated = calibrateScore({
            rawResult: memeResult,
            projectType: 'memecoin'
        });

        // 60 - 20 (risk) - 10 (weak market) = 30
        expect(calibrated.overallScore).toBe(30);
        expect(calibrated.calibrationNotes).toContain("Memecoin: minus points for heavy dependence on one celebrity/brand without a twist.");
        expect(calibrated.calibrationNotes).toContain("Memecoin: minus points for heavy dependence on one celebrity/brand without a twist.");
        expect(calibrated.calibrationNotes).toContain("Memecoin: minus points for weak or generic meme narrative.");
    });

    it('applies market-aware penalty for memecoins in crowded market', () => {
        const crowdedMarket = {
            timestamp: new Date().toISOString(),
            btcDominance: 35, // < 40
            solPriceUsd: 100,
            source: 'coingecko' as const
        };

        const calibrated = calibrateScore({
            rawResult: { ...baseResult, overallScore: 60 },
            projectType: 'memecoin',
            market: crowdedMarket
        });

        // 60 - 3 = 57
        expect(calibrated.overallScore).toBe(57);
        expect(calibrated.calibrationNotes).toContain("Memecoin: minus points for launching into an extremely crowded memecoin cycle.");
    });

    it('applies market-aware boost for memecoins in quiet market', () => {
        const quietMarket = {
            timestamp: new Date().toISOString(),
            btcDominance: 65, // > 60
            solPriceUsd: 100,
            source: 'coingecko' as const
        };

        const calibrated = calibrateScore({
            rawResult: { ...baseResult, overallScore: 60 },
            projectType: 'memecoin',
            market: quietMarket
        });

        // 60 + 3 = 63
        expect(calibrated.overallScore).toBe(63);
        expect(calibrated.calibrationNotes).toContain("Memecoin: plus points for launching during a quieter cycle (contrarian).");
    });

    it('preserves score for high quality memecoins', () => {
        const memeResult = {
            ...baseResult,
            overallScore: 75,
            summary: {
                ...baseResult.summary,
                oneLiner: "A community-driven memecoin.",
                mainVerdict: "Strong community."
            },
            market: {
                ...baseResult.market,
                marketFitScore: 80, // Strong market fit
                goToMarketRisks: ["Volatility"] // No legal/scam keywords
            },
            technical: {
                ...baseResult.technical,
                keyRisks: ["Smart contract bugs"] // No legal/scam keywords
            }
        };

        const calibrated = calibrateScore({
            rawResult: memeResult,
            projectType: 'memecoin'
        });

        // Should remain 75 as no penalties apply
        expect(calibrated.overallScore).toBe(75);
        expect(calibrated.calibrationNotes).toEqual([]);
    });

    it('does not cap score if meme coin score is already low', () => {
        const memeResult = {
            ...baseResult,
            overallScore: 30,
            summary: {
                ...baseResult.summary,
                oneLiner: "Just another memecoin.",
                mainVerdict: "Pure hype."
            }
        };

        const calibrated = calibrateScore({
            rawResult: memeResult,
            projectType: 'memecoin'
        });
        expect(calibrated.overallScore).toBe(30);
    });

    it('boosts score to 60 for strong infra ideas without token', () => {
        const infraResult = {
            ...baseResult,
            overallScore: 50,
            technical: { ...baseResult.technical, feasibilityScore: 80 },
            market: { ...baseResult.market, marketFitScore: 80 },
            tokenomics: { ...baseResult.tokenomics, tokenNeeded: false }
        };

        const calibrated = calibrateScore({
            rawResult: infraResult,
            projectType: 'ai'
        });
        expect(calibrated.overallScore).toBe(60);
        expect(calibrated.calibrationNotes).toContain("AI: plus points for a clear pain point and realistic data/infra story.");
    });

    it('caps score at 90 for strong infra ideas', () => {
        const infraResult = {
            ...baseResult,
            overallScore: 95,
            technical: { ...baseResult.technical, feasibilityScore: 90 },
            market: { ...baseResult.market, marketFitScore: 90 },
            tokenomics: { ...baseResult.tokenomics, tokenNeeded: false }
        };

        const calibrated = calibrateScore({
            rawResult: infraResult,
            projectType: 'ai'
        });
        expect(calibrated.overallScore).toBe(90);
    });

    it('leaves score unchanged for standard ideas', () => {
        const standardResult = {
            ...baseResult,
            overallScore: 75,
            market: { ...baseResult.market, targetAudience: ["DeFi Users"] }
        };
        const calibrated = calibrateScore({
            rawResult: standardResult,
            projectType: 'defi'
        });
        expect(calibrated.overallScore).toBe(75);
    });

    it('penalizes risky DeFi ideas (complex, no security)', () => {
        const riskyDefi = {
            ...baseResult,
            overallScore: 80,
            execution: { ...baseResult.execution, complexityLevel: 'high' as const },
            technical: { ...baseResult.technical, keyRisks: ["Smart contract complexity"], comments: "Very complex logic" },
            market: { ...baseResult.market, targetAudience: ["Everyone"] } // Vague audience
        };

        const calibrated = calibrateScore({
            rawResult: riskyDefi,
            projectType: 'defi'
        });
        // 80 - 5 (base) - 5 (execution) = 70
        expect(calibrated.overallScore).toBe(70);
        expect(calibrated.calibrationNotes).toContain("DeFi: minus points for high complexity and no audit/security plan mentioned.");
    });

    it('rewards secure DeFi ideas (simple/medium, security aware)', () => {
        const secureDefi = {
            ...baseResult,
            overallScore: 80,
            execution: { ...baseResult.execution, complexityLevel: 'medium' as const },
            technical: { ...baseResult.technical, keyRisks: ["Audit pending"], comments: "Security first approach" },
            market: { ...baseResult.market, targetAudience: ["DeFi Traders", "Yield Farmers"] }
        };

        const calibrated = calibrateScore({
            rawResult: secureDefi,
            projectType: 'defi'
        });
        // 80 + 5 = 85
        expect(calibrated.overallScore).toBe(85);
        expect(calibrated.overallScore).toBe(85);
        expect(calibrated.calibrationNotes).toContain("DeFi: plus points for explicit audit/security thinking and a concrete target user.");
    });

    it('applies market-aware penalty for complex DeFi in risk-off market', () => {
        const riskOffMarket = {
            timestamp: new Date().toISOString(),
            btcDominance: 65, // > 60
            solPriceUsd: 100,
            source: 'coingecko' as const
        };

        const complexDefi = {
            ...baseResult,
            overallScore: 70,
            execution: { ...baseResult.execution, complexityLevel: 'high' as const },
            technical: { ...baseResult.technical, keyRisks: [], comments: "Risky code" },
            market: { ...baseResult.market, targetAudience: ["Users"] }
        };

        const calibrated = calibrateScore({
            rawResult: complexDefi,
            projectType: 'defi',
            market: riskOffMarket
        });

        // 70 - 5 (base logic) - 3 (market logic) - 5 (execution penalty) = 57
        expect(calibrated.overallScore).toBe(57);
        expect(calibrated.calibrationNotes).toContain("DeFi: minus points for high complexity during risk-off market conditions.");
    });

    it('applies market-aware boost for secure DeFi in risk-on market', () => {
        const riskOnMarket = {
            timestamp: new Date().toISOString(),
            btcDominance: 35, // < 40
            solPriceUsd: 100,
            source: 'coingecko' as const
        };

        const secureDefi = {
            ...baseResult,
            overallScore: 80,
            execution: { ...baseResult.execution, complexityLevel: 'medium' as const },
            technical: { ...baseResult.technical, keyRisks: ["Audit pending"], comments: "Security first" },
            market: { ...baseResult.market, targetAudience: ["DeFi Traders"] }
        };

        const calibrated = calibrateScore({
            rawResult: secureDefi,
            projectType: 'defi',
            market: riskOnMarket
        });

        // 80 + 5 (base logic) + 3 (market logic) = 88
        expect(calibrated.overallScore).toBe(88);
        expect(calibrated.calibrationNotes).toContain("DeFi: plus points for launching during favorable risk-on market conditions.");
    });

    // Execution Risk Tests

    it('penalizes anon memecoin team with no track record', () => {
        const anonMeme = {
            ...baseResult,
            overallScore: 60,
            execution: {
                ...baseResult.execution,
                executionRiskScore: 50,
                executionSignals: ["Anon team", "First project"],
                founderReadinessFlags: []
            }
        };

        const calibrated = calibrateScore({
            rawResult: anonMeme,
            projectType: 'memecoin'
        });

        expect(calibrated.execution.executionRiskScore).toBe(40); // 50 - 10
        expect(calibrated.execution.executionRiskLabel).toBe('high');
        expect(calibrated.calibrationNotes).toContain("Execution: minus points for anon team with no prior shipped products.");
    });

    it('boosts memecoin team with track record', () => {
        const proMeme = {
            ...baseResult,
            overallScore: 60,
            execution: {
                ...baseResult.execution,
                executionRiskScore: 70,
                executionSignals: ["Shipped 3 projects", "Previous exit"],
                founderReadinessFlags: []
            }
        };

        const calibrated = calibrateScore({
            rawResult: proMeme,
            projectType: 'memecoin'
        });

        expect(calibrated.execution.executionRiskScore).toBe(80); // 70 + 10
        expect(calibrated.calibrationNotes).toContain("Execution: plus points for proven domain experience and previous launches.");
    });

    it('penalizes complex DeFi with no experience/audit', () => {
        const riskyDefi = {
            ...baseResult,
            overallScore: 70,
            execution: {
                ...baseResult.execution,
                complexityLevel: 'high' as const,
                executionRiskScore: 60,
                executionSignals: ["First time founders"],
                founderReadinessFlags: []
            },
            technical: { ...baseResult.technical, comments: "Risky code" } // Avoid "security" keyword
        };

        const calibrated = calibrateScore({
            rawResult: riskyDefi,
            projectType: 'defi'
        });

        // Execution score: 60 - 15 = 45
        expect(calibrated.execution.executionRiskScore).toBe(45);
        expect(calibrated.execution.executionRiskLabel).toBe('high');
        // Overall score: 70 - 5 (base penalty) - 5 (execution penalty) = 60
        expect(calibrated.overallScore).toBe(60);
        expect(calibrated.calibrationNotes).toContain("Execution: minus points for complex DeFi protocol without specific experience or audits.");
    });

    it('boosts AI project with ML background', () => {
        const strongAI = {
            ...baseResult,
            overallScore: 70,
            execution: {
                ...baseResult.execution,
                complexityLevel: 'high' as const,
                executionRiskScore: 70,
                executionSignals: ["Ex-Google ML Engineer", "PhD in AI"],
                founderReadinessFlags: []
            }
        };

        const calibrated = calibrateScore({
            rawResult: strongAI,
            projectType: 'ai'
        });

        expect(calibrated.execution.executionRiskScore).toBe(80); // 70 + 10
        expect(calibrated.calibrationNotes).toContain("Execution: plus points for strong technical/ML background.");
    });
});

import { buildIdeaContextSummary } from '../../src/lib/ai/evaluator';
import { IdeaSubmission } from '../../src/lib/ideaSchema';

describe('buildIdeaContextSummary', () => {
    const baseIdea: IdeaSubmission = {
        description: "A test project description.",
        projectType: "defi",
        teamSize: "team_2_5",
        resources: ["developer", "designer"],
        successDefinition: "Launch on mainnet.",
        responseStyle: "full",
        focusHints: []
    };

    it('formats context summary correctly with all fields', () => {
        const summary = buildIdeaContextSummary(baseIdea);
        expect(summary).toContain("Project Type: defi");
        expect(summary).toContain("Team Size: team_2_5");
        expect(summary).toContain("Resources: developer, designer");
        expect(summary).toContain("Success Goal (6-12m): Launch on mainnet.");
        expect(summary).toContain("Response Style: full");
    });

    it('includes focus hints when present', () => {
        const ideaWithHints = { ...baseIdea, focusHints: ["Scalability", "Security"] };
        const summary = buildIdeaContextSummary(ideaWithHints);
        expect(summary).toContain("Focus Hints: Scalability, Security");
    });

    it('omits focus hints when empty', () => {
        const ideaNoHints = { ...baseIdea, focusHints: [] };
        const summary = buildIdeaContextSummary(ideaNoHints);
        expect(summary).not.toContain("Focus Hints:");
    });
});
