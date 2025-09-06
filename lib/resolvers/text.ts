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

/**
 * Normalize text for comparison
 */
function normalizeText(text: string, caseSensitive = false): string {
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
    
    if (!textToCheck) {
      return {
        proposed: null,
        confidence: 0,
        evidence: {
          expectedText: config.expect,
          actualText: '',
          matchType: 'none',
          timestamp: new Date().toISOString()
        },
        reasoning: 'No actual text provided for comparison'
      };
    }
    
    const normalizedExpected = normalizeText(config.expect, config.caseSensitive);
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
    else if (config.caseSensitive ? textToCheck.includes(config.expect) : normalizedActual.includes(normalizedExpected)) {
      proposed = 'YES';
      confidence = 0.95;
      matchType = 'exact';
      reasoning = `Exact substring match found: "${config.expect}"`;
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
            expectedText: config.expect,
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
      
      if (confidence >= 0.7) {
        proposed = 'YES';
        matchType = 'keyword';
        reasoning = `Strong keyword match (${Math.round(confidence * 100)}%): ${matchedKeywords.join(', ')}`;
      } else if (confidence >= 0.4) {
        proposed = null; // Ambiguous
        matchType = 'keyword';
        reasoning = `Moderate keyword match (${Math.round(confidence * 100)}%) - manual review recommended`;
      } else if (confidence > 0.1) {
        proposed = 'NO';
        matchType = 'none';
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
        expectedText: config.expect,
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
        expectedText: config.expect,
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
