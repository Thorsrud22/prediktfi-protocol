import { createHash } from 'crypto';

export interface NormalizedPrediction {
  statement: string;
  probability: number;
  deadline: Date;
  resolver: {
    kind: 'price' | 'url' | 'text';
    ref: string;
  };
  topic?: string;
  hash: string;
}

export interface ResolverConfig {
  kind: 'price' | 'url' | 'text';
  ref: string;
}

/**
 * Normalize raw prediction text into structured format
 */
export function normalizePrediction(rawText: string): NormalizedPrediction {
  const cleaned = rawText.trim();
  
  // Try to detect asset price predictions first
  const priceMatch = detectAssetPrice(cleaned);
  if (priceMatch) {
    return priceMatch;
  }
  
  // Try to detect URL-based predictions
  const urlMatch = detectUrlPrediction(cleaned);
  if (urlMatch) {
    return urlMatch;
  }
  
  // Fallback to generic text prediction
  return normalizeGeneric(cleaned);
}

/**
 * Detect and normalize asset price predictions
 * Examples: "BTC will be above $80000 by end of year"
 */
function detectAssetPrice(text: string): NormalizedPrediction | null {
  const priceRegex = /(BTC|ETH|SOL|bitcoin|ethereum|solana).*(above|below|over|under|\>|\<|≥|≤).*\$(\d+(?:,\d{3})*(?:\.\d+)?)/i;
  const timeRegex = /(by|before|end of|december|january|2025|2026)/i;
  
  const priceMatch = text.match(priceRegex);
  if (!priceMatch) return null;
  
  const asset = normalizeAssetSymbol(priceMatch[1]);
  const operator = normalizeOperator(priceMatch[2]);
  const price = parseFloat(priceMatch[3].replace(/[$,]/g, ''));
  
  // Extract or default deadline
  let deadline = new Date();
  if (timeRegex.test(text)) {
    deadline = parseDeadline(text);
  } else {
    // Default to 3 months from now
    deadline.setMonth(deadline.getMonth() + 3);
  }
  
  const statement = `${asset} spot price closes ${operator} ${price} USD on ${deadline.toISOString().split('T')[0]}`;
  const resolver = {
    kind: 'price' as const,
    ref: `${asset.toLowerCase()}_usd`
  };
  
  const hash = createPredictionHash(statement, deadline, resolver.ref);
  
  return {
    statement,
    probability: 0.6, // Default 60%
    deadline,
    resolver,
    topic: 'Cryptocurrency',
    hash
  };
}

/**
 * Detect URL-based predictions
 */
function detectUrlPrediction(text: string): NormalizedPrediction | null {
  const urlRegex = /(https?:\/\/[^\s]+)/;
  const match = text.match(urlRegex);
  
  if (!match) return null;
  
  const url = match[1];
  const statement = text.replace(url, '').trim();
  
  // Default deadline to 1 month
  const deadline = new Date();
  deadline.setMonth(deadline.getMonth() + 1);
  
  const resolver = {
    kind: 'url' as const,
    ref: url
  };
  
  const hash = createPredictionHash(statement, deadline, resolver.ref);
  
  return {
    statement,
    probability: 0.5, // Default 50%
    deadline,
    resolver,
    hash
  };
}

/**
 * Generic text prediction fallback
 */
function normalizeGeneric(text: string): NormalizedPrediction {
  // Default deadline to 1 month
  const deadline = new Date();
  deadline.setMonth(deadline.getMonth() + 1);
  
  const resolver = {
    kind: 'text' as const,
    ref: 'manual_verification'
  };
  
  const hash = createPredictionHash(text, deadline, resolver.ref);
  
  return {
    statement: text,
    probability: 0.5, // Default 50%
    deadline,
    resolver,
    hash
  };
}

/**
 * Normalize asset symbols
 */
function normalizeAssetSymbol(symbol: string): string {
  const normalized = symbol.toLowerCase();
  switch (normalized) {
    case 'bitcoin':
      return 'BTC';
    case 'ethereum':
      return 'ETH';
    case 'solana':
      return 'SOL';
    default:
      return symbol.toUpperCase();
  }
}

/**
 * Normalize comparison operators
 */
function normalizeOperator(operator: string): string {
  const op = operator.toLowerCase();
  switch (op) {
    case 'above':
    case 'over':
    case '>':
    case '≥':
      return 'above';
    case 'below':
    case 'under':
    case '<':
    case '≤':
      return 'below';
    default:
      return 'above';
  }
}

/**
 * Parse deadline from text
 */
function parseDeadline(text: string): Date {
  const now = new Date();
  
  // End of year
  if (/end of year|december|dec/i.test(text)) {
    return new Date(now.getFullYear(), 11, 31, 23, 59, 59);
  }
  
  // Specific year
  const yearMatch = text.match(/202[5-9]/);
  if (yearMatch) {
    return new Date(parseInt(yearMatch[0]), 11, 31, 23, 59, 59);
  }
  
  // Default to 3 months
  const deadline = new Date(now);
  deadline.setMonth(deadline.getMonth() + 3);
  return deadline;
}

/**
 * Create deterministic hash for prediction
 * Format: sha256(canonical|deadline|resolverRef)
 */
export function createPredictionHash(
  canonical: string, 
  deadline: Date, 
  resolverRef: string
): string {
  const data = `${canonical}|${deadline.toISOString()}|${resolverRef}`;
  return createHash('sha256').update(data, 'utf8').digest('hex');
}

/**
 * Verify prediction hash
 */
export function verifyPredictionHash(
  canonical: string,
  deadline: Date,
  resolverRef: string,
  expectedHash: string
): boolean {
  const actualHash = createPredictionHash(canonical, deadline, resolverRef);
  return actualHash === expectedHash;
}
