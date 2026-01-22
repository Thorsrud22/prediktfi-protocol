// Resolver selection and verifiability scoring utilities

export type ResolverKind = 'PRICE' | 'URL' | 'TEXT';

export interface ResolverSelection {
  kind: ResolverKind;
  resolverRef?: string; // e.g. "coingecko:bitcoin" or a URL
  reasons: string[];
}

// Common ticker mappings to CoinGecko IDs
const TICKER_MAP: Record<string, string> = {
  BTC: 'coingecko:bitcoin',
  BITCOIN: 'coingecko:bitcoin',
  ETH: 'coingecko:ethereum',
  ETHEREUM: 'coingecko:ethereum',
  SOL: 'coingecko:solana',
  SOLANA: 'coingecko:solana',
  ADA: 'coingecko:cardano',
  CARDANO: 'coingecko:cardano',
  DOT: 'coingecko:polkadot',
  POLKADOT: 'coingecko:polkadot',
  AVAX: 'coingecko:avalanche-2',
  AVALANCHE: 'coingecko:avalanche-2',
  MATIC: 'coingecko:matic-network',
  POLYGON: 'coingecko:matic-network',
  LINK: 'coingecko:chainlink',
  CHAINLINK: 'coingecko:chainlink',
  UNI: 'coingecko:uniswap',
  UNISWAP: 'coingecko:uniswap',
};

// Price-related keywords that suggest PRICE resolver
const PRICE_KEYWORDS = [
  'price',
  'reach',
  'hit',
  'above',
  'below',
  'greater',
  'less',
  'value',
  'worth',
  'cost',
  'usd',
  'dollar',
  '$',
  '€',
  '£',
  'increase',
  'decrease',
  'rise',
  'fall',
  'pump',
  'dump',
];

const URL_REGEX = /\bhttps?:\/\/[^\s)]+/i;

/**
 * Automatically select the best resolver type for a prediction text
 */
export function selectResolver(input: string): ResolverSelection {
  const text = input.trim();

  // 1) URL first - if we find a URL, use URL resolver
  const url = text.match(URL_REGEX)?.[0];
  if (url) {
    return {
      kind: 'URL',
      resolverRef: url,
      reasons: ['Found URL in text'],
    };
  }

  // 2) PRICE via tickers and price keywords
  const tokens = text
    .toUpperCase()
    .replace(/[^A-Z0-9\s]/g, ' ')
    .split(/\s+/);
  const hasPriceKeywords = PRICE_KEYWORDS.some(keyword =>
    text.toLowerCase().includes(keyword.toLowerCase()),
  );

  for (const token of tokens) {
    if (TICKER_MAP[token] && hasPriceKeywords) {
      return {
        kind: 'PRICE',
        resolverRef: TICKER_MAP[token],
        reasons: [`Detected ticker ${token} with price-related keywords`],
      };
    }
  }

  // 3) Fallback: TEXT
  return {
    kind: 'TEXT',
    reasons: ['No URL or known ticker with price keywords detected'],
  };
}

/**
 * Calculate verifiability score (0.0 to 1.0) based on resolver type and other factors
 */
export function verifiabilityScore(args: {
  kind: ResolverKind;
  deadline: Date;
  evidenceCount?: number; // suggested sources, if any
}): number {
  const now = Date.now();
  const timeToDeadline = Math.max(0, new Date(args.deadline).getTime() - now);

  // Shorter horizon = higher score (easier to verify soon)
  // 30 days scale: score goes from ~1.0 (immediate) to ~0.0 (far future)
  const horizonScore = 1 - Math.tanh(timeToDeadline / (1000 * 60 * 60 * 24 * 30));

  // Base score by resolver type
  const kindBase = {
    PRICE: 0.9, // High verifiability
    URL: 0.7, // Medium verifiability
    TEXT: 0.4, // Lower verifiability (subjective)
  }[args.kind];

  // Small boost for evidence sources
  const evidenceBoost = Math.min((args.evidenceCount ?? 0) * 0.03, 0.1);

  // Combine scores
  const score = Math.max(0, Math.min(1, kindBase * 0.7 + horizonScore * 0.25 + evidenceBoost));

  return Number(score.toFixed(2));
}

/**
 * Convert confidence level to initial probability
 */
export function confidenceToProbability(confidence: string): number {
  switch (confidence) {
    case 'high':
      return 0.8;
    case 'medium':
      return 0.6;
    case 'low':
      return 0.4;
    default:
      return 0.5;
  }
}

/**
 * Generate canonical form of prediction text (simplified)
 */
export function canonicalize(text: string): string {
  return text.trim().replace(/\s+/g, ' ').replace(/[""]/g, '"').replace(/['']/g, "'");
}
