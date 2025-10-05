/**
 * Text Resolution System
 * String matching for simple text-based claims
 */

export interface TextResolverConfig {
  expect: string;
  source?: string;
  caseSensitive?: boolean;
  exactMatch?: boolean;
  keywords?: string[];
}

export interface TextResolutionResult {
  proposed: 'YES' | 'NO' | null;
  confidence: number;
  evidence: {
    expectedText: string;
    actualText: string;
    matchedKeywords?: string[];
    matchType: 'exact' | 'partial' | 'keyword' | 'none';
    timestamp: string;
  };
  reasoning: string;
}

const CONTRADICTION_KEYWORDS = new Set([
  'fail',
  'failed',
  'failing',
  'cancel',
  'cancelled',
  'canceled',
  'halted',
  'stopped',
  'deny',
  'denied',
  'rejected',
  'reject',
  'no',
  'not',
  'never',
  'false',
  'void'
]);

/**
 * Normalize text for comparison
 */
function normalizeText(text: string, caseSensitive = false): string {
  if (typeof text !== 'string') {
    return '';
  }

  let normalized = text.trim();

  if (!caseSensitive) {
    normalized = normalized.toLowerCase();
  }
  
  // Normalize whitespace
  normalized = normalized.replace(/\s+/g, ' ');
  
  return normalized;
}

/**
 * Extract keywords from text
 */
function extractKeywords(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 2) // Filter out short words
    .filter(word => !['the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by'].includes(word)); // Filter common words
}

/**
 * Perform keyword matching
 */
function keywordMatch(expected: string[], actual: string[]): {
  matchedKeywords: string[];
  confidence: number;
} {
  const matchedKeywords = expected.filter(expectedWord =>
    actual.some(actualWord => 
      actualWord.includes(expectedWord) || expectedWord.includes(actualWord)
    )
  );
  
  const confidence = expected.length > 0 ? matchedKeywords.length / expected.length : 0;
  
  return { matchedKeywords, confidence };
}

/**
 * Resolve text-based insight
 */
export async function resolveTextInsight(
  canonical: string,
  config: TextResolverConfig,
  actualText?: string
): Promise<TextResolutionResult> {
  const startTime = Date.now();

  try {
    console.log(`📝 Resolving text insight: "${canonical}"`);
    console.log(`   Expected: "${config.expect}"`);

    // For now, we'll use a simple approach where actualText is provided
    // In a real implementation, this might come from external sources
    const textToCheck = actualText || '';

    const expectedRaw = typeof config.expect === 'string' ? config.expect : '';
    const hasExpectedText = expectedRaw.trim().length > 0;

    if (!textToCheck) {
      return {
        proposed: null,
        confidence: 0,
        evidence: {
          expectedText: expectedRaw,
          actualText: '',
          matchType: 'none',
          timestamp: new Date().toISOString()
        },
        reasoning: 'No actual text provided for comparison'
      };
    }

    if (!hasExpectedText) {
      return {
        proposed: null,
        confidence: 0,
        evidence: {
          expectedText: expectedRaw,
          actualText: textToCheck,
          matchType: 'none',
          timestamp: new Date().toISOString()
        },
        reasoning: 'No meaningful keywords found in expected text'
      };
    }

    const normalizedExpected = normalizeText(expectedRaw, config.caseSensitive);
    const normalizedActual = normalizeText(textToCheck, config.caseSensitive);

    let proposed: 'YES' | 'NO' | null = null;
    let confidence = 0;
    let matchType: 'exact' | 'partial' | 'keyword' | 'none' = 'none';
    let reasoning = '';
    let matchedKeywords: string[] = [];
    
    // Exact match
    if (config.exactMatch) {
      if (normalizedActual === normalizedExpected) {
        proposed = 'YES';
        confidence = 1.0;
        matchType = 'exact';
        reasoning = 'Exact match found';
      } else {
        proposed = 'NO';
        confidence = 0.9; // High confidence NO for exact match requirement
        matchType = 'none';
        reasoning = 'No exact match found (exact match required)';
      }
    }
    // Substring match (case sensitive check)
    else if (config.caseSensitive) {
      if (expectedRaw.length > 0 && textToCheck.includes(expectedRaw)) {
        proposed = 'YES';
        confidence = 0.95;
        matchType = 'exact';
        reasoning = `Exact substring match found: "${expectedRaw}"`;
      } else {
        proposed = 'NO';
        confidence = 0.2;
        matchType = 'none';
        reasoning = 'Case-sensitive match not found';
      }
    }
    else if (normalizedExpected.length > 0 && normalizedActual.includes(normalizedExpected)) {
      proposed = 'YES';
      confidence = 0.95;
      matchType = 'exact';
      reasoning = `Exact substring match found: "${normalizedExpected}"`;
    }
    // Partial match (expected text contains actual text)
    else if (normalizedExpected.includes(normalizedActual) && normalizedActual.length > 3) {
      proposed = 'YES';
      confidence = 0.8;
      matchType = 'partial';
      reasoning = `Partial match found: "${textToCheck}" is contained in expected text`;
    }
    // Keyword-based matching
    else if (config.keywords && config.keywords.length > 0) {
      const actualKeywords = extractKeywords(normalizedActual);
      const keywordResult = keywordMatch(config.keywords, actualKeywords);

      matchedKeywords = keywordResult.matchedKeywords;
      confidence = keywordResult.confidence;

      if (confidence >= 0.8) {
        proposed = 'YES';
        matchType = 'keyword';
        reasoning = `High keyword match (${Math.round(confidence * 100)}%): ${matchedKeywords.join(', ')}`;
      } else if (confidence >= 0.5) {
        proposed = 'YES';
        matchType = 'keyword';
        reasoning = `Moderate keyword match (${Math.round(confidence * 100)}%): ${matchedKeywords.join(', ')}`;
      } else if (confidence > 0) {
        proposed = null; // Ambiguous
        matchType = 'keyword';
        reasoning = `Low keyword match (${Math.round(confidence * 100)}%) - manual review recommended`;
      } else {
        proposed = 'NO';
        matchType = 'none';
        reasoning = 'No keyword matches found';
      }
    }
    // Auto keyword extraction and matching
    else {
      const expectedKeywords = extractKeywords(normalizedExpected);
      const actualKeywords = extractKeywords(normalizedActual);

      if (expectedKeywords.length === 0) {
        return {
          proposed: null,
          confidence: 0,
          evidence: {
            expectedText: expectedRaw,
            actualText: textToCheck,
            matchType: 'none',
            timestamp: new Date().toISOString()
          },
          reasoning: 'No meaningful keywords found in expected text'
        };
      }

      const keywordResult = keywordMatch(expectedKeywords, actualKeywords);
      matchedKeywords = keywordResult.matchedKeywords;
      confidence = keywordResult.confidence;
      const contradictionKeywords = Array.from(new Set(actualKeywords.filter(word => CONTRADICTION_KEYWORDS.has(word))));

      if (contradictionKeywords.length > 0 && confidence < 0.5) {
        proposed = 'NO';
        matchType = 'none';
        confidence = Math.max(0.2, Math.min(confidence || 0.2, 0.25));
        reasoning = `Contradictory keywords found: ${contradictionKeywords.join(', ')}`;
      } else if (confidence >= 0.7) {
        proposed = 'YES';
        matchType = 'keyword';
        reasoning = `Strong keyword match (${Math.round(confidence * 100)}%): ${matchedKeywords.join(', ')}`;
      } else if (confidence >= 0.2) {
        proposed = null; // Ambiguous
        matchType = 'keyword';
        reasoning = `Moderate keyword match (${Math.round(confidence * 100)}%) - manual review recommended`;
      } else if (confidence > 0.1) {
        proposed = 'NO';
        matchType = 'none';
        confidence = Math.min(confidence, 0.25);
        reasoning = `Weak keyword match (${Math.round(confidence * 100)}%)`;
      } else {
        proposed = 'NO';
        matchType = 'none';
        reasoning = 'No meaningful keywords found in expected text';
      }
    }
    
    const tookMs = Date.now() - startTime;
    console.log(`✅ Text resolution completed in ${tookMs}ms: ${proposed || 'NO_PROPOSAL'}`);
    
    return {
      proposed,
      confidence,
      evidence: {
        expectedText: expectedRaw,
        actualText: textToCheck,
        matchedKeywords: matchedKeywords.length > 0 ? matchedKeywords : undefined,
        matchType,
        timestamp: new Date().toISOString()
      },
      reasoning
    };
    
  } catch (error) {
    const tookMs = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    console.error(`❌ Text resolution failed after ${tookMs}ms:`, errorMessage);
    
    return {
      proposed: null,
      confidence: 0,
      evidence: {
        expectedText: expectedRaw,
        actualText: actualText || '',
        matchType: 'none',
        timestamp: new Date().toISOString()
      },
      reasoning: `Text resolution error: ${errorMessage}`
    };
  }
}

/**
 * Parse text resolver configuration from resolverRef
 */
export function parseTextConfig(resolverRef: string): TextResolverConfig {
  try {
    const config = JSON.parse(resolverRef);
    return {
      expect: config.expect || config.text || config.expectedText,
      source: config.source,
      caseSensitive: config.caseSensitive || false,
      exactMatch: config.exactMatch || false,
      keywords: config.keywords
    };
  } catch (error) {
    throw new Error(`Invalid text resolver configuration: ${resolverRef}`);
  }
}

/**
 * Simple text-based resolution for manual input
 * This is a helper for cases where we have direct text input to check
 */
export function simpleTextMatch(expected: string, actual: string, exactMatch = false): {
  matches: boolean;
  confidence: number;
  reasoning: string;
} {
  const normalizedExpected = normalizeText(expected);
  const normalizedActual = normalizeText(actual);
  
  if (exactMatch) {
    const matches = normalizedActual === normalizedExpected;
    return {
      matches,
      confidence: matches ? 1.0 : 0.0,
      reasoning: matches ? 'Exact match' : 'No exact match'
    };
  }
  
  if (normalizedActual.includes(normalizedExpected)) {
    return {
      matches: true,
      confidence: 0.95,
      reasoning: 'Substring match found'
    };
  }
  
  const expectedKeywords = extractKeywords(normalizedExpected);
  const actualKeywords = extractKeywords(normalizedActual);
  const keywordResult = keywordMatch(expectedKeywords, actualKeywords);
  
  return {
    matches: keywordResult.confidence >= 0.5,
    confidence: keywordResult.confidence,
    reasoning: keywordResult.confidence >= 0.5 
      ? `Keyword match (${Math.round(keywordResult.confidence * 100)}%): ${keywordResult.matchedKeywords.join(', ')}`
      : 'No significant matches found'
  };
}
