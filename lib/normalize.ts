/**
 * Canonical form normalization for predictions
 * Format: "SUBJ verb comparator value unit on YYYY-MM-DD"
 * Example: "BTC close > 80000 USD on 2026-01-01"
 */

export interface NormalizedPrediction {
  canonical: string;
  p: number;
  deadline: Date;
  resolverKind: 'price' | 'url' | 'text';
  resolverRef: string;
}

export interface ResolverConfig {
  price?: {
    asset: string;
    source: string;
    field: string;
  };
  url?: {
    href: string;
  };
  text?: {
    expect: string;
  };
}

/**
 * Normalize a natural language prediction into canonical form
 */
export function normalizePrediction(
  question: string,
  options: {
    p?: number;
    deadline?: Date;
    resolverKind?: 'price' | 'url' | 'text';
    resolverConfig?: ResolverConfig;
  } = {}
): NormalizedPrediction {
  const {
    p = 0.60, // Default probability
    deadline = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // Default +30 days
    resolverKind = 'price', // Default resolver
    resolverConfig = {}
  } = options;

  const safeQuestion = typeof question === 'string' ? question : '';
  const safeDeadline = (() => {
    const candidate = deadline instanceof Date ? deadline : new Date(deadline ?? Date.now());
    return isNaN(candidate.getTime())
      ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      : candidate;
  })();

  // Extract canonical components from question
  const canonical = extractCanonical(safeQuestion, safeDeadline);
  
  // Generate resolver reference
  const resolverRef = generateResolverRef(resolverKind, resolverConfig, canonical);

  return {
    canonical,
    p,
    deadline: safeDeadline,
    resolverKind,
    resolverRef
  };
}

/**
 * Extract canonical form from natural language question
 */
function extractCanonical(question: string, deadline: Date): string {
  const q = (question || '').toLowerCase().trim();
  const deadlineStr = deadline.toISOString().split('T')[0]; // YYYY-MM-DD format

  // Price prediction patterns
  if (q.includes('bitcoin') || q.includes('btc')) {
    const priceMatch = q.match(/(\$?[\d,]+k?|\$?[\d,]+,?\d*)/);
    const price = priceMatch ? parsePrice(priceMatch[1]) : 100000;
    
    const comparator = extractComparator(q);
    return `BTC close ${comparator} ${price} USD on ${deadlineStr}`;
  }
  
  if (q.includes('ethereum') || q.includes('eth')) {
    const priceMatch = q.match(/(\$?[\d,]+k?|\$?[\d,]+,?\d*)/);
    const price = priceMatch ? parsePrice(priceMatch[1]) : 5000;
    
    const comparator = extractComparator(q);
    return `ETH close ${comparator} ${price} USD on ${deadlineStr}`;
  }
  
  if (q.includes('solana') || q.includes('sol')) {
    const priceMatch = q.match(/(\$?[\d,]+k?|\$?[\d,]+,?\d*)/);
    const price = priceMatch ? parsePrice(priceMatch[1]) : 400;
    
    const comparator = extractComparator(q);
    return `SOL close ${comparator} ${price} USD on ${deadlineStr}`;
  }

  // Generic asset pattern
  const assetMatch = q.match(/(\w+)\s+(?:will|reach|hit|above|below|over|under)/);
  if (assetMatch) {
    const asset = assetMatch[1].toUpperCase();
    const priceMatch = q.match(/(\$?[\d,]+k?|\$?[\d,]+,?\d*)/);
    const price = priceMatch ? parsePrice(priceMatch[1]) : 1000;
    
    const comparator = extractComparator(q);
    return `${asset} close ${comparator} ${price} USD on ${deadlineStr}`;
  }

  // Fallback: create a text-based canonical form
  const cleanQuestion = q
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .substring(0, 100); // Limit length

  if (!cleanQuestion) {
    return '"prediction" resolves true on ' + deadlineStr;
  }
    
  return `"${cleanQuestion}" resolves true on ${deadlineStr}`;
}

/**
 * Extract comparator from question text
 */
function extractComparator(question: string): string {
  const q = question.toLowerCase();
  
  if (q.includes('above') || q.includes('over') || q.includes('exceed') || q.includes('reach') || q.includes('hit')) {
    return '>=';
  }
  if (q.includes('below') || q.includes('under')) {
    return '<=';
  }
  if (q.includes('exactly') || q.includes('equal')) {
    return '=';
  }
  
  // Default to >= for price targets
  return '>=';
}

/**
 * Parse price string to number
 */
function parsePrice(priceStr: string): number {
  // Remove currency symbols and normalize
  let normalized = priceStr
    .replace(/[$,]/g, '')
    .toLowerCase();
  
  // Handle 'k' suffix (thousands)
  if (normalized.endsWith('k')) {
    return parseFloat(normalized.slice(0, -1)) * 1000;
  }
  
  return parseFloat(normalized);
}

/**
 * Generate resolver reference based on canonical form
 */
function generateResolverRef(
  resolverKind: 'price' | 'url' | 'text',
  config: ResolverConfig,
  canonical: string
): string {
  switch (resolverKind) {
    case 'price':
      const priceConfig = config.price || extractPriceConfigFromCanonical(canonical);
      if (!priceConfig) {
        throw new Error('Unable to extract price configuration');
      }
      return JSON.stringify({
        ...priceConfig,
        asset: priceConfig.asset,
        source: priceConfig.source,
        field: priceConfig.field
      });
      
    case 'url':
      const urlConfig = config.url || { href: 'https://example.com/verify' };
      return JSON.stringify({
        href: urlConfig.href
      });
      
    case 'text':
      const textConfig = config.text || { expect: canonical };
      return JSON.stringify({
        expect: textConfig.expect
      });
      
    default:
      throw new Error(`Unknown resolver kind: ${resolverKind}`);
  }
}

/**
 * Extract price config from canonical form
 */
function extractPriceConfigFromCanonical(canonical: string): ResolverConfig['price'] {
  // Extract asset from canonical form like "BTC close >= 80000 USD on 2026-01-01"
  const assetMatch = canonical.match(/^(\w+)\s+/);
  const asset = assetMatch ? assetMatch[1] : 'BTC';
  
  return {
    asset,
    source: 'coingecko',
    field: 'close'
  };
}

/**
 * Validate canonical form format
 */
export function validateCanonical(canonical: string): boolean {
  // Basic format validation for "SUBJ verb comparator value unit on YYYY-MM-DD"
  const patterns = [
    /^\w+\s+\w+\s+[><=]+\s+\d+\s+\w+\s+on\s+\d{4}-\d{2}-\d{2}$/, // Price pattern
    /^".+" resolves true on \d{4}-\d{2}-\d{2}$/ // Text pattern
  ];
  
  return patterns.some(pattern => pattern.test(canonical));
}

/**
 * Parse canonical form back to components
 */
export function parseCanonical(canonical: string): {
  subject: string;
  verb: string;
  comparator: string;
  value: string;
  unit: string;
  deadline: string;
} | null {
  // Price pattern: "BTC close >= 80000 USD on 2026-01-01"
  const priceMatch = canonical.match(/^(\w+)\s+(\w+)\s+([><=]+)\s+(\d+)\s+(\w+)\s+on\s+(\d{4}-\d{2}-\d{2})$/);
  if (priceMatch) {
    return {
      subject: priceMatch[1],
      verb: priceMatch[2],
      comparator: priceMatch[3],
      value: priceMatch[4],
      unit: priceMatch[5],
      deadline: priceMatch[6]
    };
  }
  
  // Text pattern: "question text" resolves true on YYYY-MM-DD
  const textMatch = canonical.match(/^"(.+)"\s+resolves\s+true\s+on\s+(\d{4}-\d{2}-\d{2})$/);
  if (textMatch) {
    return {
      subject: textMatch[1],
      verb: 'resolves',
      comparator: '=',
      value: 'true',
      unit: 'boolean',
      deadline: textMatch[2]
    };
  }
  
  return null;
}
