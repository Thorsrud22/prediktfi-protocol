
import { evaluateIdea } from '../src/lib/ai/evaluator';
import { IdeaSubmission } from '../src/lib/ideaSchema';
import dotenv from 'dotenv';

dotenv.config();

// Define synthetic ideas
const ideas: { name: string; submission: IdeaSubmission; expected: any }[] = [
    {
        name: "Bad Memecoin (Rug Risk)",
        submission: {
            projectType: 'memecoin',
            description: 'A token for dog lovers with 1000x potential.',
            teamSize: 'solo',
            resources: ['time'],
            successDefinition: '1M mcap',
            responseStyle: 'short',
            mvpScope: '',
            goToMarketPlan: '',
            launchLiquidityPlan: '', // Empty plan = High Risk
            focusHints: []
        },
        expected: {
            rugPullRisk: 'high',
            launchReadinessLabel: 'low'
        }
    },
    {
        name: "Degen Memecoin (Medium Risk)",
        submission: {
            projectType: 'memecoin',
            description: 'Standard degen launch with self-buy.',
            teamSize: 'solo',
            resources: ['time', 'budget_500'],
            successDefinition: 'Graduating via bonding curve',
            responseStyle: 'short',
            mvpScope: 'Meme art generated',
            goToMarketPlan: 'Twitter spam',
            launchLiquidityPlan: 'I will buy 500 usd of my own coin and lock slightly for 1 month.',
            focusHints: []
        },
        expected: {
            rugPullRisk: 'medium',
            launchReadinessLabel: ['low', 'medium'] // Could be low if other signals are weak, but Rug Risk is key
        }
    },
    {
        name: "Strong Memecoin",
        submission: {
            projectType: 'memecoin',
            description: 'Community-first memecoin on Solana.',
            teamSize: 'team_2_5',
            resources: ['developer', 'marketer', 'budget_1k_5k'],
            successDefinition: 'Sustainable community and 10k holders.',
            responseStyle: 'short',
            mvpScope: 'Token launch + Staking dApp',
            goToMarketPlan: 'Partnerships with 3 alpha groups, viral Twitter campaign.',
            launchLiquidityPlan: '100% LP burned, Mint Authority revoked, 5% marketing wallet (multisig).',
            focusHints: []
        },
        expected: {
            rugPullRisk: ['low', 'medium'], // Allow medium as LLM might be conservative
            launchReadinessLabel: ['high', 'medium']
        }
    },
    {
        name: "Risky DeFi (No Audit)",
        submission: {
            projectType: 'defi',
            description: 'High yield farming protocol with leverage.',
            teamSize: 'team_2_5',
            resources: ['developer'],
            successDefinition: '100M TVL',
            responseStyle: 'short',
            mvpScope: 'Complex vault system',
            goToMarketPlan: 'Twitter shill',
            launchLiquidityPlan: 'User deposits',
            focusHints: []
        },
        expected: {
            auditStatus: 'none',
            rugPullRisk: ['medium', 'high']
        }
    },
    {
        name: "Solid DeFi (Audited)",
        submission: {
            projectType: 'defi',
            description: 'Lending protocol fork with safety modules.',
            teamSize: 'team_6_plus',
            resources: ['developer', 'audit_budget'],
            successDefinition: 'Safe steady growth',
            responseStyle: 'short',
            mvpScope: 'Fork of Aave v3 with isolated pools',
            goToMarketPlan: 'Incentivized testnet, partnership with major DEX.',
            launchLiquidityPlan: 'Audit by Halborn scheduled. Multisig treasury.',
            focusHints: []
        },
        expected: {
            auditStatus: ['planned', 'audited'],
            rugPullRisk: ['low', 'medium']
        }
    },
    {
        name: "AI Tool (Clear MVP)",
        submission: {
            projectType: 'ai',
            description: 'AI agent for on-chain trading analysis.',
            teamSize: 'team_2_5',
            resources: ['developer', 'data_scientist'],
            successDefinition: '1000 daily active users',
            responseStyle: 'short',
            mvpScope: 'MVP: Telegram bot that analyzes wallet PnL.',
            goToMarketPlan: 'Launch on Product Hunt, Twitter threads.',
            launchLiquidityPlan: 'Self-funded, no token initially.',
            focusHints: []
        },
        expected: {
            launchReadinessLabel: ['medium', 'high'],
            shouldHaveCryptoChecks: false
        }
    }
];

async function runBatchTest() {
    console.log("🚀 Running Batch Evaluator Test...\n");

    const results = [];

    for (const idea of ideas) {
        console.log(`Evaluating: ${idea.name}...`);
        try {
            const result = await evaluateIdea(idea.submission);

            // Helper to check if value matches expectation (string or array of strings)
            const check = (actual: any, expected: any) => {
                if (!expected) return true;
                if (Array.isArray(expected)) return expected.includes(actual);
                return actual === expected;
            };

            // Flexible assertion for crypto-native checks (Arrays allow for LLM variability)
            // Also check for new Tone keywords in Verdict/Risks
            const verdict = result.summary.mainVerdict.toLowerCase();
            const risks = result.technical.keyRisks.join(" ").toLowerCase();

            console.log(`\n    Tone Check (${idea.submission.projectType}):`);
            if (idea.submission.projectType === 'ai' || idea.submission.projectType === 'defi') {
                console.log(`    - Has VC Terms (moat/audit/proprietary): ${verdict.includes('moat') || verdict.includes('audit') || verdict.includes('proprietary') || risks.includes('audit') || risks.includes('moat')}`);
            } else if (idea.submission.projectType === 'memecoin') {
                console.log(`    - Has Crypto Terms (rug/liquidity/alpha): ${verdict.includes('rug') || verdict.includes('liquidity') || verdict.includes('alpha') || risks.includes('rug')}`);
            }
            const passRug = check(result.cryptoNativeChecks?.rugPullRisk, idea.expected.rugPullRisk);
            const passAudit = check(result.cryptoNativeChecks?.auditStatus, idea.expected.auditStatus);
            const passLaunch = check(result.launchReadinessLabel, idea.expected.launchReadinessLabel);

            let passCryptoCheck = true;
            if (idea.expected.shouldHaveCryptoChecks === false) {
                if (result.cryptoNativeChecks) {
                    passCryptoCheck = false;
                    console.log("    FAILED: Expected NO crypto checks, but they were present.");
                }
            }

            const passed = passRug && passAudit && passLaunch && passCryptoCheck;

            results.push({
                name: idea.name,
                score: result.overallScore,
                crypto: result.cryptoNativeChecks ? '✅ YES' : '❌ NO',
                rugRisk: result.cryptoNativeChecks?.rugPullRisk,
                audit: result.cryptoNativeChecks?.auditStatus,
                liquidity: result.cryptoNativeChecks?.liquidityStatus,
                launchLabel: result.launchReadinessLabel,
                passed: passed ? '✅ PASS' : '❌ FAIL',
                details: passed ? '' : `Expected: ${JSON.stringify(idea.expected)}`
            });

        } catch (error) {
            console.error(`Error evaluating ${idea.name}:`, error);
            results.push({ name: idea.name, error: true, passed: '❌ ERROR' });
        }
    }

    console.table(results);
}

runBatchTest();
