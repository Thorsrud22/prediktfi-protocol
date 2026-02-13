import { performance } from "node:perf_hooks";
import { evaluateWithCommittee } from "@/lib/ai/committee";
import { evaluateIdea } from "@/lib/ai/evaluator";
import { IdeaSubmission } from "@/lib/ideaSchema";

interface BenchmarkCase {
  id: string;
  label: string;
  input: IdeaSubmission;
}

const CASES: BenchmarkCase[] = [
  {
    id: "memecoin-1",
    label: "Memecoin narrative app",
    input: {
      description: "A memecoin launch engine that combines creator referral loops and anti-bot liquidity staging.",
      projectType: "memecoin",
      teamSize: "team_2_5",
      resources: ["developers", "budget"],
      successDefinition: "Reach 100k users and sustained on-chain volume.",
      responseStyle: "balanced",
      mvpScope: "Token launch flow plus community missions.",
    } as IdeaSubmission,
  },
  {
    id: "defi-1",
    label: "DeFi lending primitive",
    input: {
      description: "A cross-collateralized Solana lending protocol with dynamic risk buckets and liquidation auctions.",
      projectType: "defi",
      teamSize: "team_2_5",
      resources: ["developers", "security"],
      successDefinition: "Hit meaningful TVL with low bad debt.",
      responseStyle: "analytical",
      mvpScope: "Core lending/borrowing and oracle-backed liquidations.",
    } as IdeaSubmission,
  },
  {
    id: "ai-1",
    label: "AI trading copilot",
    input: {
      description: "An AI copilot for crypto traders using proprietary wallet behavior features and risk overlays.",
      projectType: "ai",
      teamSize: "team_2_5",
      resources: ["developers", "data"],
      successDefinition: "Daily active pro traders with measurable retention.",
      responseStyle: "analytical",
      mvpScope: "Alerts, ranking engine, and model feedback loop.",
    } as IdeaSubmission,
  },
  {
    id: "other-1",
    label: "Non-crypto SaaS",
    input: {
      description: "A B2B workflow SaaS that automates compliance handoffs for procurement teams.",
      projectType: "other",
      teamSize: "team_2_5",
      resources: ["developers"],
      successDefinition: "5 enterprise pilots in 6 months.",
      responseStyle: "balanced",
      mvpScope: "Document ingestion and approval orchestration.",
    } as IdeaSubmission,
  },
];

interface EvalStats {
  caseId: string;
  mode: "committee" | "baseline";
  durationMs: number;
  overallScore: number;
  confidenceLevel?: string;
  evidenceCoverage?: number;
  verifierStatus?: string;
}

async function runCase(entry: BenchmarkCase): Promise<EvalStats[]> {
  const results: EvalStats[] = [];

  const committeeStart = performance.now();
  const committee = await evaluateWithCommittee(entry.input);
  const committeeDuration = performance.now() - committeeStart;

  results.push({
    caseId: entry.id,
    mode: "committee",
    durationMs: Math.round(committeeDuration),
    overallScore: committee.overallScore,
    confidenceLevel: committee.meta?.confidenceLevel || committee.confidenceLevel,
    evidenceCoverage: committee.meta?.evidenceCoverage,
    verifierStatus: committee.meta?.verifierStatus,
  });

  const baselineStart = performance.now();
  const baseline = await evaluateIdea(entry.input);
  const baselineDuration = performance.now() - baselineStart;

  results.push({
    caseId: entry.id,
    mode: "baseline",
    durationMs: Math.round(baselineDuration),
    overallScore: baseline.overallScore,
    confidenceLevel: baseline.meta?.confidenceLevel || baseline.confidenceLevel,
    evidenceCoverage: baseline.meta?.evidenceCoverage,
    verifierStatus: baseline.meta?.verifierStatus,
  });

  return results;
}

function summarize(stats: EvalStats[]): void {
  const committee = stats.filter((item) => item.mode === "committee");
  const baseline = stats.filter((item) => item.mode === "baseline");

  const avg = (items: EvalStats[], selector: (row: EvalStats) => number) =>
    items.length === 0 ? 0 : Math.round(items.reduce((sum, row) => sum + selector(row), 0) / items.length);

  console.log("\n=== Benchmark Summary ===");
  console.table(stats);
  console.log("Committee avg duration (ms):", avg(committee, (row) => row.durationMs));
  console.log("Baseline avg duration (ms):", avg(baseline, (row) => row.durationMs));
  console.log("Committee avg score:", avg(committee, (row) => row.overallScore));
  console.log("Baseline avg score:", avg(baseline, (row) => row.overallScore));
  console.log(
    "Committee avg evidence coverage (%):",
    avg(committee, (row) => Math.round((row.evidenceCoverage || 0) * 100))
  );
}

async function main() {
  console.log("Running committee-vs-baseline benchmark...");
  const allStats: EvalStats[] = [];

  for (const testCase of CASES) {
    console.log(`\n[Case] ${testCase.id}: ${testCase.label}`);
    const caseStats = await runCase(testCase);
    allStats.push(...caseStats);
  }

  summarize(allStats);
}

main().catch((error) => {
  console.error("Benchmark failed:", error);
  process.exit(1);
});
