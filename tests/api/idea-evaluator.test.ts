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
            },
            cryptoNativeChecks: {
                rugPullRisk: "low",
                auditStatus: "planned",
                liquidityStatus: "locked",
                isAnonTeam: false
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
        },
        cryptoNativeChecks: {
            rugPullRisk: "low",
            auditStatus: "none",
            liquidityStatus: "unclear",
            isAnonTeam: false
        },
        launchReadinessScore: 50,
        launchReadinessLabel: "medium",
        launchReadinessSignals: []
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
            projectType: 'memecoin',
            // Fix: provide safe submission
            ideaSubmission: {
                description: "Valid description.................................................................................................",
                projectType: 'memecoin',
                teamSize: 'team_2_5',
                resources: ['budget'],
                successDefinition: "ok",
                responseStyle: 'short'
            }
        });

        // 60 - 20 (risk) - 10 (weak market) = 30
        expect(calibrated.overallScore).toBe(30);
        expect(calibrated.calibrationNotes).toContain("Memecoin: minus points for heavy dependence on one celebrity/brand without a twist.");
    });

    it('does not apply market-aware penalty for memecoins based on BTC dominance', () => {
        const crowdedMarket = {
            timestamp: new Date().toISOString(),
            btcDominance: 35, // < 40
            solPriceUsd: 100,
            source: 'coingecko' as const
        };

        const calibrated = calibrateScore({
            rawResult: { ...baseResult, overallScore: 60 },
            projectType: 'memecoin',
            market: crowdedMarket,
            // Fix: provide safe submission
            ideaSubmission: {
                description: "Valid description.................................................................................................",
                projectType: 'memecoin',
                teamSize: 'team_2_5',
                resources: ['budget'],
                successDefinition: "ok",
                responseStyle: 'short'
            }
        });

        // 60 - 0 (no penalty) = 60
        expect(calibrated.overallScore).toBe(60);
        expect(calibrated.calibrationNotes).not.toContain("Memecoin: minus points for launching into an extremely crowded memecoin cycle.");
    });

    it('applies market-aware boost for memecoins during Solana mania', () => {
        const maniaMarket = {
            timestamp: new Date().toISOString(),
            btcDominance: 50,
            solPriceUsd: 160, // > 150 (Mania)
            source: 'coingecko' as const
        };

        const calibrated = calibrateScore({
            rawResult: { ...baseResult, overallScore: 60 },
            projectType: 'memecoin',
            market: maniaMarket,
            // Fix: provide safe submission
            ideaSubmission: {
                description: "Valid description.................................................................................................",
                projectType: 'memecoin',
                teamSize: 'team_2_5',
                resources: ['budget'],
                successDefinition: "ok",
                responseStyle: 'short'
            }
        });

        // 60 + 2 = 62
        expect(calibrated.overallScore).toBe(62);
        expect(calibrated.calibrationNotes).toContain("Market: + points for launching during strong Solana price action (> $150).");
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
            },
            launchReadinessSignals: ["Liquidity locked", "Community plan"]
        };

        const calibrated = calibrateScore({
            rawResult: memeResult,
            projectType: 'memecoin',
            // Fix: provide safe submission
            ideaSubmission: {
                description: "Valid description.................................................................................................",
                projectType: 'memecoin',
                teamSize: 'team_2_5',
                resources: ['budget'],
                successDefinition: "ok",
                responseStyle: 'short'
            }
        });

        expect(calibrated.overallScore).toBe(75);
        expect(calibrated.calibrationNotes).toContain("Launch: plus points for clear LP and community plan.");
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
            projectType: 'memecoin',
            // Fix: provide safe submission
            ideaSubmission: {
                description: "Valid description.................................................................................................",
                projectType: 'memecoin',
                teamSize: 'team_2_5',
                resources: ['budget'],
                successDefinition: "ok",
                responseStyle: 'short'
            }
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
            projectType: 'ai',
            // Fix: provide safe submission
            ideaSubmission: {
                description: "Valid description.................................................................................................",
                projectType: 'ai',
                teamSize: 'team_2_5',
                resources: ['budget'],
                successDefinition: "ok",
                responseStyle: 'short'
            }
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
            tokenomics: { ...baseResult.tokenomics, tokenNeeded: false },
            launchReadinessSignals: ["MVP ready", "Data pipeline built"]
        };

        const calibrated = calibrateScore({
            rawResult: infraResult,
            projectType: 'ai',
            // Fix: provide safe submission
            ideaSubmission: {
                description: "Valid description.................................................................................................",
                projectType: 'ai',
                teamSize: 'team_2_5',
                resources: ['budget'],
                successDefinition: "ok",
                responseStyle: 'short'
            }
        });
        expect(calibrated.overallScore).toBe(90);
    });

    it('leaves score unchanged for standard ideas', () => {
        const standardResult = {
            ...baseResult,
            overallScore: 75,
            market: { ...baseResult.market, targetAudience: ["DeFi Users"] },
            launchReadinessSignals: ["Audit planned"]
        };
        const calibrated = calibrateScore({
            rawResult: standardResult,
            projectType: 'defi',
            // Fix: provide safe submission
            ideaSubmission: {
                description: "Valid description.................................................................................................",
                projectType: 'defi',
                teamSize: 'team_2_5',
                resources: ['budget'],
                successDefinition: "ok",
                responseStyle: 'short'
            }
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
            projectType: 'defi',
            // Fix: provide safe submission
            ideaSubmission: {
                description: "Valid description.................................................................................................",
                projectType: 'defi',
                teamSize: 'team_2_5',
                resources: ['budget'],
                successDefinition: "ok",
                responseStyle: 'short'
            }
        });
        // 80 - 5 (base) - 5 (execution) - 5 (launch mismatch) = 65
        expect(calibrated.overallScore).toBe(65);
        expect(calibrated.calibrationNotes).toContain("DeFi: minus points for high complexity and no audit/security plan mentioned.");
    });

    it('rewards secure DeFi ideas (simple/medium, security aware)', () => {
        const secureDefi = {
            ...baseResult,
            overallScore: 80,
            execution: { ...baseResult.execution, complexityLevel: 'medium' as const },
            technical: { ...baseResult.technical, keyRisks: ["Audit pending"], comments: "Security first approach" },
            market: { ...baseResult.market, targetAudience: ["DeFi Traders", "Yield Farmers"] },
            launchReadinessSignals: ["Audit planned", "User acquisition"]
        };

        const calibrated = calibrateScore({
            rawResult: secureDefi,
            projectType: 'defi',
            // Fix: provide safe submission
            ideaSubmission: {
                description: "Valid description.................................................................................................",
                projectType: 'defi',
                teamSize: 'team_2_5',
                resources: ['budget'],
                successDefinition: "ok",
                responseStyle: 'short'
            }
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
            market: riskOffMarket,
            // Fix: provide safe submission
            ideaSubmission: {
                description: "Valid description.................................................................................................",
                projectType: 'defi',
                teamSize: 'team_2_5',
                resources: ['budget'],
                successDefinition: "ok",
                responseStyle: 'short'
            }
        });

        // 70 - 5 (base logic) - 2 (market logic) - 5 (execution penalty) = 58
        expect(calibrated.overallScore).toBe(58);
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
            market: { ...baseResult.market, targetAudience: ["DeFi Traders"] },
            launchReadinessSignals: ["Audit planned", "User acquisition"]
        };

        const calibrated = calibrateScore({
            rawResult: secureDefi,
            projectType: 'defi',
            market: riskOnMarket,
            // Fix: provide safe submission
            ideaSubmission: {
                description: "Valid description.................................................................................................",
                projectType: 'defi',
                teamSize: 'team_2_5',
                resources: ['budget'],
                successDefinition: "ok",
                responseStyle: 'short'
            }
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
            projectType: 'defi',
            // Fix: provide safe submission
            ideaSubmission: {
                description: "Valid description.................................................................................................",
                projectType: 'defi',
                teamSize: 'team_2_5',
                resources: ['budget'],
                successDefinition: "ok",
                responseStyle: 'short'
            }
        });

        // Execution score: 60 - 15 = 45
        expect(calibrated.execution.executionRiskScore).toBe(45);
        expect(calibrated.execution.executionRiskLabel).toBe('high');

        // Overall: 70 - 5 (execution penalty) = 65.
        // BUT: launchReadiness logic runs too. 
        // Signals are empty/undefined.
        // DeFi launch logic: !hasAudit -> launchScore - 15. Base 50 -> 35.
        // Launch < 40 -> Overall - 5.
        // So 65 - 5 = 60.
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
            projectType: 'ai',
            // Fix: provide safe submission
            ideaSubmission: {
                description: "Valid description.................................................................................................",
                projectType: 'ai',
                teamSize: 'team_2_5',
                resources: ['budget'],
                successDefinition: "ok",
                responseStyle: 'short'
            }
        });

        expect(calibrated.execution.executionRiskScore).toBe(80); // 70 + 10
        expect(calibrated.calibrationNotes).toContain("Execution: plus points for strong technical/ML background.");
    });


    // Launch Readiness Tests

    it('penalizes memecoin with no LP plan', () => {
        const weakMeme = {
            ...baseResult,
            overallScore: 60,
            launchReadinessScore: 50,
            launchReadinessSignals: ["Viral marketing only", "No money for pool"]
        };

        const calibrated = calibrateScore({
            rawResult: weakMeme,
            projectType: 'memecoin',
            // Fix: provide safe submission
            ideaSubmission: {
                description: "Valid description.................................................................................................",
                projectType: 'memecoin',
                teamSize: 'team_2_5',
                resources: ['budget'],
                successDefinition: "ok",
                responseStyle: 'short'
            }
        });

        expect(calibrated.launchReadinessScore).toBe(30); // 50 - 20
        expect(calibrated.launchReadinessLabel).toBe('low');
        expect(calibrated.calibrationNotes).toContain("Launch (memecoin): minus points for no LP or anti-rug thinking.");
    });

    it('boosts memecoin with LP and community plan', () => {
        const strongMeme = {
            ...baseResult,
            overallScore: 60,
            launchReadinessScore: 60,
            launchReadinessSignals: ["Locked LP", "Community treasury", "Viral content"]
        };

        const calibrated = calibrateScore({
            rawResult: strongMeme,
            projectType: 'memecoin',
            // Fix: provide safe submission
            ideaSubmission: {
                description: "Valid description.................................................................................................",
                projectType: 'memecoin',
                teamSize: 'team_2_5',
                resources: ['budget'],
                successDefinition: "ok",
                responseStyle: 'short'
            }
        });

        expect(calibrated.launchReadinessScore).toBe(70); // 60 + 10
        expect(calibrated.launchReadinessLabel).toBe('high');
        expect(calibrated.calibrationNotes).toContain("Launch: plus points for clear LP and community plan.");
    });

    it('penalizes DeFi with no audit plan', () => {
        const weakDefi = {
            ...baseResult,
            overallScore: 70,
            launchReadinessScore: 50,
            launchReadinessSignals: ["Just code", "No external review"]
        };

        const calibrated = calibrateScore({
            rawResult: weakDefi,
            projectType: 'defi',
            // Fix: provide safe submission to avoid new constraints triggering (e.g. Solo cap)
            ideaSubmission: {
                description: "Valid description length to avoid vague penalty...................................................................",
                projectType: 'defi',
                teamSize: 'team_2_5',
                resources: ['budget'],
                successDefinition: "ok",
                responseStyle: 'short'
            }
        });

        expect(calibrated.launchReadinessScore).toBe(35); // 50 - 15
        expect(calibrated.launchReadinessLabel).toBe('low');
        expect(calibrated.calibrationNotes).toContain("Launch: minus points for no security/audit plan.");
    });

    it('boosts DeFi with audit and GTM', () => {
        const strongDefi = {
            ...baseResult,
            overallScore: 70,
            launchReadinessScore: 70,
            launchReadinessSignals: ["Audit scheduled", "User acquisition plan"]
        };

        const calibrated = calibrateScore({
            rawResult: strongDefi,
            projectType: 'defi',
            // Fix: provide safe submission
            ideaSubmission: {
                description: "Valid description length........................................................................................",
                projectType: 'defi',
                teamSize: 'team_2_5',
                resources: ['budget'],
                successDefinition: "ok",
                responseStyle: 'short'
            }
        });

        expect(calibrated.launchReadinessScore).toBe(80); // 70 + 10
        expect(calibrated.calibrationNotes).toContain("Launch: plus points for security plan and clear GTM.");
    });

    it('penalizes AI project with vague MVP', () => {
        const weakAI = {
            ...baseResult,
            overallScore: 70,
            launchReadinessScore: 50,
            launchReadinessSignals: ["Vague idea", "Next OpenAI"]
        };

        const calibrated = calibrateScore({
            rawResult: weakAI,
            projectType: 'ai',
            // Fix: provide safe submission
            ideaSubmission: {
                description: "Valid description length........................................................................................",
                projectType: 'ai',
                teamSize: 'team_2_5',
                resources: ['budget'],
                successDefinition: "ok",
                responseStyle: 'short'
            }
        });

        expect(calibrated.launchReadinessScore).toBe(35); // 50 - 15
        expect(calibrated.launchReadinessLabel).toBe('low');
        expect(calibrated.calibrationNotes).toContain("Launch: minus points for vague MVP/data plan.");
    });

    it('boosts AI project with realistic MVP and data', () => {
        const strongAI = {
            ...baseResult,
            overallScore: 70,
            launchReadinessScore: 70,
            launchReadinessSignals: ["MVP ready", "Data pipeline built"]
        };

        const calibrated = calibrateScore({
            rawResult: strongAI,
            projectType: 'ai',
            // Fix: provide safe submission
            ideaSubmission: {
                description: "Valid description length........................................................................................",
                projectType: 'ai',
                teamSize: 'team_2_5',
                resources: ['budget'],
                successDefinition: "ok",
                responseStyle: 'short'
            }
        });

        expect(calibrated.launchReadinessScore).toBe(80); // 70 + 10
        expect(calibrated.calibrationNotes).toContain("Launch: plus points for realistic MVP scope and data plan.");
    });

    it('nudges overall score down for severe launch mismatch', () => {
        const mismatched = {
            ...baseResult,
            overallScore: 80, // Strong idea
            launchReadinessScore: 30, // Terrible launch
            launchReadinessSignals: ["No plan"]
        };

        const calibrated = calibrateScore({
            rawResult: mismatched,
            projectType: 'other',
            // Fix: provide safe submission
            ideaSubmission: {
                description: "Valid description length........................................................................................",
                projectType: 'other',
                teamSize: 'team_2_5',
                resources: ['budget'],
                successDefinition: "ok",
                responseStyle: 'short'
            }
        });

        // 80 - 5 = 75
        expect(calibrated.overallScore).toBe(75);
        expect(calibrated.calibrationNotes).toContain("Overall: minus points for severe lack of launch readiness despite good idea.");
    });

    it('nudges overall score up for exceptional launch readiness', () => {
        const mismatched = {
            ...baseResult,
            overallScore: 60, // Modest idea
            launchReadinessScore: 80, // Excellent launch
            launchReadinessSignals: ["MVP ready", "Data pipeline built"] // Signals needed to avoid penalty
        };

        const calibrated = calibrateScore({
            rawResult: mismatched,
            projectType: 'ai',
            // Fix: provide safe submission
            ideaSubmission: {
                description: "Valid description length........................................................................................",
                projectType: 'ai',
                teamSize: 'team_2_5',
                resources: ['budget'],
                successDefinition: "ok",
                responseStyle: 'short'
            }
        });

        // 60 + 5 = 65
        // Note: AI boost (+10 to launch score) applies first -> 80 + 10 = 90
        // Then overall boost check: overall 60 (50-70 range) and launch 90 (>=80) -> +5
        expect(calibrated.overallScore).toBe(65);
        expect(calibrated.calibrationNotes).toContain("Overall: plus points for exceptional launch readiness.");
    });


    it('boosts memecoin score when launchLiquidityPlan is provided in submission', () => {
        const weakMeme = {
            ...baseResult,
            overallScore: 60,
            launchReadinessScore: 50,
            launchReadinessSignals: [] // Empty signals
        };

        const submission = {
            description: "Meme project description long enough............................................................................",
            projectType: "memecoin" as const,
            teamSize: "team_2_5" as const, // Avoid solo cap
            resources: ["budget"], // Avoid budget penalty
            successDefinition: "Moon",
            responseStyle: "short" as const,
            launchLiquidityPlan: "Locked LP for 100 years, anti-rug measures in place.",
            goToMarketPlan: "Viral marketing campaign on Twitter and Telegram."
        };

        const calibrated = calibrateScore({
            rawResult: weakMeme,
            projectType: 'memecoin',
            ideaSubmission: submission
        });

        // 50 + 10 = 60
        expect(calibrated.launchReadinessScore).toBe(60);
        expect(calibrated.calibrationNotes).toContain("Launch: plus points for clear LP and community plan.");
    });

    it('boosts AI score when mvpScope is provided in submission', () => {
        const weakAI = {
            ...baseResult,
            overallScore: 70,
            launchReadinessScore: 50,
            launchReadinessSignals: [] // Empty signals
        };

        const submission = {
            description: "AI project description long enough..............................................................................",
            projectType: "ai" as const,
            teamSize: "team_2_5" as const,
            resources: ["budget"],
            successDefinition: "Users",
            responseStyle: "full" as const,
            mvpScope: "Working prototype with real data pipeline",
            goToMarketPlan: "Launch on Product Hunt"
        };

        const calibrated = calibrateScore({
            rawResult: weakAI,
            projectType: 'ai',
            ideaSubmission: submission
        });

        // 50 + 10 = 60
        expect(calibrated.launchReadinessScore).toBe(60);
        expect(calibrated.calibrationNotes).toContain("Launch: plus points for realistic MVP scope and data plan.");
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
        expect(summary).toContain("Success Definition: \"Launch on mainnet.\"");
        expect(summary).toContain("Response Style: full");
        expect(summary).toContain("MVP Scope (6-12m): \"Not provided - assume vague/undefined\"");
        expect(summary).toContain("Go-to-Market / First Users: \"Not provided - assume no distribution plan\"");
        expect(summary).toContain("Launch & Liquidity Plan: \"Not provided - assume high rug risk / no liquidity plan\"");
    });

    it('includes focus hints when present', () => {
        const ideaWithHints = { ...baseIdea, focusHints: ["Scalability", "Security"] };
        const summary = buildIdeaContextSummary(ideaWithHints);
        expect(summary).toContain("Focus Hints: Scalability, Security");
    });

    it('includes "None" for focus hints when empty', () => {
        const ideaNoHints = { ...baseIdea, focusHints: [] };
        const summary = buildIdeaContextSummary(ideaNoHints);
        expect(summary).toContain("Focus Hints: None");
    });
});
