import crypto from 'crypto';

export interface ParsedPrediction {
  canonical: string;
  p: number;
  deadline: Date;
  topic?: string;
  resolverKind: 'price' | 'url' | 'text';
  resolverRef: string;
}

export interface PredictionHash {
  hash: string;
  input: {
    canonical: string;
    deadline: string; // ISO string
    resolverRef: string;
  };
}

/**
 * Normalizes raw prediction text into canonical form
 * Format: "SUBJ verb comparator value unit on YYYY-MM-DD"
 */
export function normalizePrediction(rawText: string): ParsedPrediction {
  const text = rawText.trim().toLowerCase();
  
  // Default values
  let p = 0.60;
  let deadline = new Date();
  deadline.setDate(deadline.getDate() + 30); // +30 days default
  
  // Extract probability if specified (e.g., "60% chance", "p=0.7")
  const probMatch = text.match(/(?:(\d+)%|p\s*=\s*([0-1]?\.\d+)|probability\s*[=:]\s*([0-1]?\.\d+))/);
  if (probMatch) {
    const [, percent, decimal1, decimal2] = probMatch;
    if (percent) p = parseInt(percent) / 100;
    else if (decimal1) p = parseFloat(decimal1);
    else if (decimal2) p = parseFloat(decimal2);
  }
  
  // Extract deadline if specified
  const dateMatch = text.match(/(?:by|before|on|until)\s*(\d{4}-\d{2}-\d{2}|\d{1,2}\/\d{1,2}\/\d{4})/);
  if (dateMatch) {
    const dateStr = dateMatch[1];
    if (dateStr.includes('-')) {
      deadline = new Date(dateStr + 'T23:59:59Z');
    } else {
      // Handle MM/DD/YYYY format
      const [month, day, year] = dateStr.split('/');
      deadline = new Date(`${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}T23:59:59Z`);
    }
  }
  
  // Price predictions
  if (text.includes('btc') || text.includes('bitcoin')) {
    const canonical = normalizeBitcoinPrediction(text);
    return {
      canonical,
      p,
      deadline,
      topic: 'crypto',
      resolverKind: 'price',
      resolverRef: 'btc-usd'
    };
  }
  
  if (text.includes('eth') || text.includes('ethereum')) {
    const canonical = normalizeEthereumPrediction(text);
    return {
      canonical,
      p,
      deadline,
      topic: 'crypto',
      resolverKind: 'price', 
      resolverRef: 'eth-usd'
    };
  }
  
  // URL-based predictions
  const urlMatch = text.match(/(https?:\/\/[^\s]+)/);
  if (urlMatch) {
    const url = urlMatch[1];
    const canonical = normalizeUrlPrediction(text, url);
    return {
      canonical,
      p,
      deadline,
      topic: 'url',
      resolverKind: 'url',
      resolverRef: url
    };
  }
  
  // Fallback to generic text prediction
  const canonical = normalizeGenericPrediction(text);
  return {
    canonical,
    p,
    deadline,
    resolverKind: 'text',
    resolverRef: 'manual'
  };
}

function normalizeBitcoinPrediction(text: string): string {
  const priceMatch = text.match(/(\$?\d+(?:,\d{3})*(?:k|thousand|million)?)/);
  if (priceMatch) {
    let price = priceMatch[1].replace(/[$,]/g, '');
    if (price.endsWith('k') || price.includes('thousand')) {
      price = (parseFloat(price.replace(/k|thousand/g, '')) * 1000).toString();
    }
    if (price.includes('million')) {
      price = (parseFloat(price.replace('million', '')) * 1000000).toString();
    }
    
    const comparator = getComparator(text);
    return `BTC will be ${comparator} $${price} USD`;
  }
  
  return 'BTC will reach new all-time high';
}

function normalizeEthereumPrediction(text: string): string {
  const priceMatch = text.match(/(\$?\d+(?:,\d{3})*(?:k|thousand)?)/);
  if (priceMatch) {
    let price = priceMatch[1].replace(/[$,]/g, '');
    if (price.endsWith('k') || price.includes('thousand')) {
      price = (parseFloat(price.replace(/k|thousand/g, '')) * 1000).toString();
    }
    
    const comparator = getComparator(text);
    return `ETH will be ${comparator} $${price} USD`;
  }
  
  return 'ETH will reach new all-time high';
}

function normalizeUrlPrediction(text: string, url: string): string {
  // Look for text that should appear on the page
  const containsMatch = text.match(/(?:contains?|shows?|mentions?|includes?)\s+"([^"]+)"/);
  if (containsMatch) {
    return `Page ${url} will contain "${containsMatch[1]}"`;
  }
  
  return `Page ${url} will be accessible`;
}

function normalizeGenericPrediction(text: string): string {
  // Remove probability and date specifications for canonical form
  let canonical = text
    .replace(/(?:\d+%|p\s*=\s*[0-1]?\.\d+|probability\s*[=:]\s*[0-1]?\.\d+)/g, '')
    .replace(/(?:by|before|on|until)\s*(?:\d{4}-\d{2}-\d{2}|\d{1,2}\/\d{1,2}\/\d{4})/g, '')
    .trim()
    .replace(/\s+/g, ' ');
    
  // Ensure it's a proper statement
  if (!canonical.endsWith('.') && !canonical.endsWith('?') && !canonical.endsWith('!')) {
    canonical += '.';
  }
  
  return canonical.charAt(0).toUpperCase() + canonical.slice(1);
}

function getComparator(text: string): string {
  if (text.includes('above') || text.includes('over') || text.includes('greater than') || text.includes('>')) {
    return 'above';
  }
  if (text.includes('below') || text.includes('under') || text.includes('less than') || text.includes('<')) {
    return 'below';
  }
  if (text.includes('reach') || text.includes('hit') || text.includes('at least')) {
    return 'above';
  }
  return 'above'; // default
}

/**
 * Creates deterministic hash for prediction
 * Hash = sha256(canonical | deadline_iso | resolver_ref)
 */
export function createPredictionHash(
  canonical: string,
  deadline: Date,
  resolverRef: string
): PredictionHash {
  const deadlineISO = deadline.toISOString();
  const input = `${canonical}|${deadlineISO}|${resolverRef}`;
  const hash = crypto.createHash('sha256').update(input, 'utf8').digest('hex');
  
  return {
    hash,
    input: {
      canonical,
      deadline: deadlineISO,
      resolverRef
    }
  };
}

/**
 * Verifies that a hash matches the given prediction components
 */
export function verifyPredictionHash(
  hash: string,
  canonical: string,
  deadline: Date,
  resolverRef: string
): boolean {
  const computed = createPredictionHash(canonical, deadline, resolverRef);
  return computed.hash === hash;
}
