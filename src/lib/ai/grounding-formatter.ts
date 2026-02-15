import type { CompetitiveMemoResult } from "@/lib/market/competitiveTypes";
import type { GroundingEnvelope, MarketSnapshot } from "@/lib/market/types";
import type { TokenSecurityCheck } from "@/lib/solana/token-check";

const DEFAULT_TOKEN_BUDGET = 800;

export interface GroundingFormatterInput {
  market?: MarketSnapshot;
  marketGrounding?: GroundingEnvelope<MarketSnapshot> | null;
  tokenGrounding?: GroundingEnvelope<TokenSecurityCheck> | null;
  competitiveResult?: CompetitiveMemoResult | null;
  maxTokens?: number;
}

function freshnessLabel(envelope?: GroundingEnvelope<unknown> | null): string {
  if (!envelope) return "unknown";
  return envelope.isStale ? "stale" : "fresh";
}

function formatEnvelopeLine(
  label: string,
  envelope?: GroundingEnvelope<unknown> | null
): string {
  if (!envelope) return `[${label}] source=unknown | freshness=unknown`;
  const staleTag = envelope.isStale ? "STALE" : "FRESH";
  return `[${label}] source=${envelope.source} | ${staleTag} | age=${Math.round(
    envelope.stalenessHours
  )}h | ttl=${envelope.ttlHours}h`;
}

function compactNumber(value?: number): string {
  if (typeof value !== "number" || !Number.isFinite(value)) return "n/a";
  return value.toLocaleString("en-US", { maximumFractionDigits: 2 });
}

function formatMarketSection(
  market?: MarketSnapshot,
  marketGrounding?: GroundingEnvelope<MarketSnapshot> | null
): string[] {
  const lines = [formatEnvelopeLine("MARKET_SNAPSHOT", marketGrounding)];
  if (!market) {
    lines.push("- data: unavailable");
    return lines;
  }

  lines.push(`- btcDominance: ${compactNumber(market.btcDominance)}%`);
  lines.push(`- solPriceUsd: $${compactNumber(market.solPriceUsd)}`);
  if (typeof market.totalAltVolume24hUsd === "number") {
    lines.push(`- totalAltVolume24hUsd: $${compactNumber(market.totalAltVolume24hUsd)}`);
  }
  lines.push(`- snapshotTimestamp: ${market.timestamp || "n/a"}`);
  return lines;
}

function formatTokenSection(
  tokenGrounding?: GroundingEnvelope<TokenSecurityCheck> | null
): string[] {
  const lines = [formatEnvelopeLine("TOKEN_SECURITY", tokenGrounding)];
  if (!tokenGrounding) {
    lines.push("- data: unavailable");
    return lines;
  }

  const token = tokenGrounding.data;
  lines.push(`- valid: ${token.valid ? "yes" : "no"}`);
  lines.push(`- mintAuthorityActive: ${token.mintAuthority ? "yes" : "no"}`);
  lines.push(`- freezeAuthorityActive: ${token.freezeAuthority ? "yes" : "no"}`);
  if (typeof token.isLiquidityLocked === "boolean") {
    lines.push(`- liquidityLocked: ${token.isLiquidityLocked ? "yes" : "no"}`);
  }
  if (typeof token.top10HolderPercentage === "number") {
    lines.push(`- top10HolderPercentage: ${compactNumber(token.top10HolderPercentage)}%`);
  }
  if (typeof token.totalLiquidity === "number") {
    lines.push(`- totalLiquidity: $${compactNumber(token.totalLiquidity)}`);
  }
  if (!token.valid && token.error) {
    lines.push(`- error: ${token.error}`);
  }
  return lines;
}

function formatCompetitiveSection(competitiveResult?: CompetitiveMemoResult | null): string[] {
  const isOk = competitiveResult?.status === "ok";
  const envelope = isOk ? competitiveResult.grounding : null;
  const lines = [formatEnvelopeLine("COMPETITIVE_MEMO", envelope)];

  if (!isOk) {
    lines.push(`- status: ${competitiveResult?.status || "not_available"}`);
    if (competitiveResult?.status === "not_available") {
      lines.push(`- reason: ${competitiveResult.reason}`);
    }
    return lines;
  }

  const memo = competitiveResult.memo;
  const projectNames = memo.referenceProjects.slice(0, 5).map((project) => project.name);
  lines.push(`- categoryLabel: ${memo.categoryLabel}`);
  lines.push(`- crowdednessLevel: ${memo.crowdednessLevel}`);
  lines.push(`- shortLandscapeSummary: ${memo.shortLandscapeSummary}`);
  lines.push(`- referenceProjects: ${projectNames.join(", ") || "none"}`);
  lines.push(`- evidenceCount: ${competitiveResult.evidencePack?.evidence.length || 0}`);
  lines.push(
    `- unavailableSources: ${
      competitiveResult.evidencePack?.unavailableSources?.join(", ") || "none"
    }`
  );
  return lines;
}

export function estimatePromptTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

function fitToTokenBudget(text: string, maxTokens: number): string {
  if (estimatePromptTokens(text) <= maxTokens) return text;
  const maxChars = Math.max(80, maxTokens * 4 - 64);
  const trimmed = text.slice(0, maxChars).trimEnd();
  return `${trimmed}\n...[truncated to fit prompt token budget]`;
}

export function formatGroundingForPrompt(input: GroundingFormatterInput): string {
  const lines: string[] = [];
  const maxTokens = input.maxTokens ?? DEFAULT_TOKEN_BUDGET;

  lines.push("GROUNDING BRIEF (structured, decision-relevant):");
  lines.push(
    `- coverage: market=${input.market ? "yes" : "no"}, token=${
      input.tokenGrounding ? "yes" : "no"
    }, competitive=${input.competitiveResult?.status === "ok" ? "yes" : "no"}`
  );
  lines.push(
    `- staleSources: ${[
      input.marketGrounding && freshnessLabel(input.marketGrounding) === "stale"
        ? "market_snapshot"
        : null,
      input.tokenGrounding && freshnessLabel(input.tokenGrounding) === "stale"
        ? "token_security"
        : null,
      input.competitiveResult?.status === "ok" &&
      freshnessLabel(input.competitiveResult.grounding) === "stale"
        ? "competitive_memo"
        : null,
    ]
      .filter(Boolean)
      .join(", ") || "none"}`
  );
  lines.push("");
  lines.push(...formatMarketSection(input.market, input.marketGrounding));
  lines.push("");
  lines.push(...formatTokenSection(input.tokenGrounding));
  lines.push("");
  lines.push(...formatCompetitiveSection(input.competitiveResult));

  return fitToTokenBudget(lines.join("\n"), maxTokens);
}
