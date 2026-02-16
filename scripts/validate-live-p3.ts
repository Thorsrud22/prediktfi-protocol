import { evaluateIdea } from '../src/lib/ai/evaluator';
import { IdeaSubmission } from '../src/lib/ideaSchema';
import { extractStructuredOutput } from '../src/lib/ai/structured-output';
import * as dotenv from 'dotenv';
import path from 'path';

// Force load .env from project root
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// Set longer timeout for validation script (3 minutes)
process.env.OPENAI_TIMEOUT_MS = "180000";

// Test Corpus as defined in P3-01
// Using 'any' for extra test fields not strictly in IdeaSubmission schema
const TEST_CORPUS: any[] = [
    {
        name: "Solana DEX Aggregator with MEV Protection",
        description: "A DEX aggregator on Solana that routes through Jupiter + Raydium with MEV protection. It uses a custom rust program to bundle transactions and avoid sandwich attacks. Token is $MEVGONE.",
        projectType: "DeFi",
        expectedDomain: "crypto_defi",
        teamSize: 3,
        resources: ["Technical Whitepaper", "GitHub Repo"],
        launchLiquidityPlan: "Planning to seed $50k liquidity on Raydium. 100% LP burn.",
        responseStyle: "analytical",
        successDefinition: "Reach $10M Volume in 3 months",
        tokenAddress: "So11111111111111111111111111111111111111112" // Valid-looking SOL address wrapper
    },
    {
        name: "AI Test Generator",
        description: "An AI tool that generates unit tests from TypeScript source code. It reads your repo and automatically writes Vitest cases. No token, just SaaS subscription.",
        projectType: "AI",
        expectedDomain: "ai_ml",
        teamSize: 2,
        resources: ["Demo Video"],
        responseStyle: "analytical",
        successDefinition: "100 paying customers",
        aiModelType: "Fine-Tuned",
        aiDataMoat: "Proprietary dataset of 10k open source repos"
        // No token address - SaaS
    },
    {
        name: "Lunch Photo App",
        description: "A social app where you post photos of your lunch. You get points for streaks. That's it.",
        projectType: "Consumer",
        expectedDomain: "consumer",
        teamSize: 1,
        resources: [],
        responseStyle: "roast",
        successDefinition: "Viral growth"
        // Obvious bad idea
    },
    {
        name: "Healthcare Compliance SaaS",
        description: "A B2B SaaS platform for managing compliance documents in healthcare (HIPAA). Secure storage, audit trails, and automated reporting.",
        projectType: "SaaS", // distinct from AI
        expectedDomain: "saas",
        teamSize: 5,
        resources: ["Compliance Certs"],
        responseStyle: "analytical",
        successDefinition: "Enterprise contracts"
        // Boring but viable
    },
    {
        name: "$DOGWIFCOMPUTER",
        description: "A memecoin called $DOGWIFCOMPUTER. It's a dog with a computer. No utility, just vibes. Community takeover.",
        projectType: "Memecoin",
        expectedDomain: "memecoin",
        teamSize: "Anon",
        resources: ["Twitter"],
        launchLiquidityPlan: "Fair launch on Pump.fun",
        responseStyle: "roast",
        successDefinition: "100M Market Cap",
        memecoinNarrative: "Dogs and computers are inevitable.",
        memecoinVibe: "Chaotic"
    }
];

// Helper to manually check if sub-scores are present
function checkSubScores(metadata: any): boolean {
    if (!metadata || !metadata.subScores) return false;
    return Object.keys(metadata.subScores).length > 0;
}

// Helper to check evidence
function checkEvidence(metadata: any): boolean {
    if (!metadata) return false;
    return (metadata.groundingCitations && metadata.groundingCitations.length > 0) ||
        (metadata.compositionFormula && metadata.compositionFormula.length > 0);
}

async function runValidation() {
    console.log("🚀 Starting P3-01 Live Model Validation...");
    console.log(`Running ${TEST_CORPUS.length} test cases against ${process.env.EVAL_MODEL || "gpt-5.2"}\n`);

    const results: any[] = [];

    for (const idea of TEST_CORPUS) {
        console.log(`\n----------------------------------------------------------------`);
        console.log(`Processing: "${idea.name}"`);
        const start = Date.now();

        try {
            // Mock progress to keep console alive but clean
            // cast to any to bypass strict type check for the test script
            const result = await evaluateIdea(idea as IdeaSubmission, {
                onProgress: (step) => process.stdout.write(`  [Progress] ${step}\r`),
                // We're not passing market data to test "cold" evaluation
            });
            process.stdout.write("\n"); // Clear progress line

            const duration = Date.now() - start;

            // NEW: Check if structuredAnalysisData (JSON object) was populated by parser
            const hasStructuredData = !!(result as any).structuredAnalysisData;

            let hasStructuredAnalysis: boolean;
            let hasSubScores: boolean;
            let subScoreKeys: string[] = [];
            let warnings: string[] = [];

            if (hasStructuredData) {
                // New JSON path: sub-scores populated directly from object
                hasStructuredAnalysis = true;
                hasSubScores = !!(result.subScores && Object.keys(result.subScores).length > 0);
                subScoreKeys = Object.keys(result.subScores || {});
                warnings = result.meta?.structuredOutputWarnings || [];
            } else {
                // Legacy path: parse from markdown string
                const extraction = extractStructuredOutput(result.structuredAnalysis || "");
                hasStructuredAnalysis = !!result.structuredAnalysis;
                hasSubScores = checkSubScores(extraction);
                subScoreKeys = Object.keys(extraction.subScores || {});
                warnings = extraction.warnings || [];
            }

            const evalResult = {
                ideaName: idea.name,
                success: true,
                score: result.overallScore,
                hasStructuredAnalysis,
                hasEvidence: hasStructuredData || checkEvidence({ groundingCitations: result.groundingCitations, compositionFormula: result.compositionFormula }),
                hasSubScores,
                latencyMs: duration,
                warnings
            };

            results.push(evalResult);

            console.log(`  ✅ Score: ${result.overallScore}/100`);
            console.log(`  📊 Sub-scores detected: ${hasSubScores ? "YES" : "NO"} (${subScoreKeys.join(", ")})`);
            console.log(`  📝 Structural Integrity: ${hasStructuredAnalysis ? "PASS" : "FAIL"}`);
            console.log(`  📦 Data Source: ${hasStructuredData ? "JSON object" : "Markdown string"}`);
            if (warnings.length) {
                console.log(`  ⚠️  Parse Warnings:`, warnings);
                if (!hasSubScores && hasStructuredAnalysis) {
                    console.log(`  🔍 RAW OUTPUT START (first 1000 chars):`);
                    const rawSample = result.structuredAnalysis?.substring(0, 1000) || "";
                    console.log(JSON.stringify(rawSample));
                    console.log(`  🔍 RAW OUTPUT END`);
                }
            }

        } catch (err: any) {
            console.error(`  ❌ Failed:`, err);
            results.push({
                ideaName: idea.name,
                success: false,
                score: 0,
                hasStructuredAnalysis: false,
                hasEvidence: false,
                hasSubScores: false,
                latencyMs: Date.now() - start,
                warnings: [err.message]
            });
        }
    }

    // Summary Report
    console.log(`\n\n================================================================`);
    console.log(`P3-01 VALIDATION SUMMARY`);
    console.log(`================================================================`);

    const successful = results.filter(r => r.success);
    const fullyParsed = results.filter(r => r.hasStructuredAnalysis && r.hasSubScores);
    const parseRate = (fullyParsed.length / results.length) * 100;

    console.log(`Total Runs: ${results.length}`);
    console.log(`Successful: ${successful.length}`);
    console.log(`Fully Parsed: ${fullyParsed.length} (${parseRate}%)`);
    console.log(`Avg Latency: ${Math.round(results.reduce((a: any, b: any) => a + b.latencyMs, 0) / results.length)}ms`);

    console.log(`\nDetailed Breakdown:`);
    // Simple table output
    console.log("Idea | Score | Struct? | SubScores? | Warnings");
    console.log("---|---|---|---|---");
    results.forEach(r => {
        console.log(`${r.ideaName.substring(0, 20)}... | ${r.score} | ${r.hasStructuredAnalysis ? "YES" : "NO"} | ${r.hasSubScores ? "YES" : "NO"} | ${r.warnings.length}`);
    });

    if (parseRate < 80) {
        console.log(`\n❌ FAIL: Parse rate below 80%. Prompt tuning required.`);
        process.exit(1);
    } else {
        console.log(`\n✅ PASS: System ready for Phase 3.`);
        process.exit(0);
    }
}

runValidation();
