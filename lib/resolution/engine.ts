/**
 * Resolution Engine
 * Automatically resolves insights based on their resolver configuration
 */

import { getPriceAtCloseUTC, parsePriceConfig } from '../resolvers/price';
import { prisma } from '../../app/lib/prisma';
import { EVENT_TYPES, createEvent } from '../events';
import { updateProfileAggregates } from '../score';

export interface ResolutionResult {
  result: 'YES' | 'NO' | 'INVALID';
  evidenceUrl?: string;
  evidenceMeta?: Record<string, any>;
  decidedBy: 'AGENT' | 'USER';
  confidence?: number;
}

export interface Insight {
  id: string;
  canonical: string;
  p: number;
  deadline: Date;
  resolverKind: 'PRICE' | 'URL' | 'TEXT';
  resolverRef: string;
  status: 'OPEN' | 'COMMITTED' | 'RESOLVED';
}

/**
 * Main resolution function - determines outcome of an insight
 */
export async function resolveInsight(insight: Insight): Promise<ResolutionResult> {
  const startTime = Date.now();
  
  try {
    console.log(`🔍 Resolving insight ${insight.id}: ${insight.canonical}`);
    
    let result: ResolutionResult;
    
    switch (insight.resolverKind) {
      case 'PRICE':
        result = await resolvePriceInsight(insight);
        break;
      case 'URL':
        result = await resolveUrlInsight(insight);
        break;
      case 'TEXT':
        result = await resolveTextInsight(insight);
        break;
      default:
        throw new Error(`Unknown resolver kind: ${insight.resolverKind}`);
    }
    
    const tookMs = Date.now() - startTime;
    console.log(`✅ Resolved ${insight.id} as ${result.result} in ${tookMs}ms`);
    
    return result;
    
  } catch (error) {
    const tookMs = Date.now() - startTime;
    console.error(`❌ Failed to resolve ${insight.id} after ${tookMs}ms:`, error);
    
    return {
      result: 'INVALID',
      evidenceMeta: { 
        error: error instanceof Error ? error.message : 'Unknown error',
        tookMs 
      },
      decidedBy: 'AGENT'
    };
  }
}

/**
 * Resolve price-based insights
 */
async function resolvePriceInsight(insight: Insight): Promise<ResolutionResult> {
  const config = parsePriceConfig(insight.resolverRef);
  
  // Extract comparison from canonical statement
  const comparison = parseCanonicalComparison(insight.canonical);
  if (!comparison) {
    return {
      result: 'INVALID',
      evidenceMeta: { error: 'Could not parse comparison from canonical statement' },
      decidedBy: 'AGENT'
    };
  }
  
  // Get price at deadline
  const priceResult = await getPriceAtCloseUTC(config.asset, insight.deadline, config);
  if (!priceResult) {
    return {
      result: 'INVALID',
      evidenceMeta: { error: 'Could not fetch price data' },
      decidedBy: 'AGENT'
    };
  }
  
  // Evaluate comparison
  const actualPrice = priceResult.price;
  const targetPrice = comparison.value;
  const operator = comparison.operator;
  
  let isTrue = false;
  switch (operator) {
    case '>':
      isTrue = actualPrice > targetPrice;
      break;
    case '>=':
      isTrue = actualPrice >= targetPrice;
      break;
    case '<':
      isTrue = actualPrice < targetPrice;
      break;
    case '<=':
      isTrue = actualPrice <= targetPrice;
      break;
    case '=':
    case '==':
      isTrue = Math.abs(actualPrice - targetPrice) < 0.01; // Allow small rounding differences
      break;
    default:
      return {
        result: 'INVALID',
        evidenceMeta: { error: `Unknown operator: ${operator}` },
        decidedBy: 'AGENT'
      };
  }
  
  return {
    result: isTrue ? 'YES' : 'NO',
    evidenceUrl: `https://www.coingecko.com/en/coins/${config.asset.toLowerCase()}`,
    evidenceMeta: {
      actualPrice,
      targetPrice,
      operator,
      asset: config.asset,
      source: priceResult.source,
      timestamp: priceResult.timestamp.toISOString(),
      comparison: `${actualPrice} ${operator} ${targetPrice} = ${isTrue}`
    },
    decidedBy: 'AGENT',
    confidence: 0.95 // High confidence for price data
  };
}

/**
 * Resolve URL-based insights using propose-first approach
 */
async function resolveUrlInsight(insight: Insight): Promise<ResolutionResult> {
  // Import here to avoid circular dependencies
  const { resolveUrlInsight: urlResolver, parseUrlConfig } = await import('../resolvers/url');
  
  try {
    const config = parseUrlConfig(insight.resolverRef);
    const urlResult = await urlResolver(insight.canonical, config);
    
    // For automatic resolution, we only auto-resolve high confidence cases
    if (urlResult.proposed && urlResult.confidence >= 0.9) {
      return {
        result: urlResult.proposed,
        evidenceUrl: urlResult.evidence.url,
        evidenceMeta: {
          confidence: urlResult.confidence,
          reasoning: urlResult.reasoning,
          extractedText: urlResult.evidence.extractedText,
          matchedText: urlResult.evidence.matchedText,
          method: urlResult.evidence.method
        },
        decidedBy: 'AGENT',
        confidence: urlResult.confidence
      };
    } else {
      // Low confidence or ambiguous - mark as requiring manual review
      return {
        result: 'INVALID',
        evidenceMeta: { 
          error: 'Requires manual review',
          confidence: urlResult.confidence,
          reasoning: urlResult.reasoning,
          proposed: urlResult.proposed,
          requiresManualReview: true
        },
        decidedBy: 'AGENT'
      };
    }
  } catch (error) {
    return {
      result: 'INVALID',
      evidenceMeta: { 
        error: error instanceof Error ? error.message : 'URL resolution failed',
        requiresManualReview: true
      },
      decidedBy: 'AGENT'
    };
  }
}

/**
 * Resolve text-based insights using propose-first approach
 */
async function resolveTextInsight(insight: Insight): Promise<ResolutionResult> {
  // Import here to avoid circular dependencies
  const { resolveTextInsight: textResolver, parseTextConfig } = await import('../resolvers/text');
  
  try {
    const config = parseTextConfig(insight.resolverRef);
    
    // For text resolution, we need actual text input - this would come from user input
    // For automatic resolution, we mark as requiring manual review
    const textResult = await textResolver(insight.canonical, config);
    
    return {
      result: 'INVALID',
      evidenceMeta: { 
        error: 'Text resolution requires manual input',
        expectedText: config.expect,
        requiresManualReview: true
      },
      decidedBy: 'AGENT'
    };
  } catch (error) {
    return {
      result: 'INVALID',
      evidenceMeta: { 
        error: error instanceof Error ? error.message : 'Text resolution failed',
        requiresManualReview: true
      },
      decidedBy: 'AGENT'
    };
  }
}

/**
 * Parse comparison operator and value from canonical statement
 * Examples: 
 * "BTC close >= 100000 USD on 2025-12-31" -> { operator: ">=", value: 100000 }
 * "ETH close < 5000 USD on 2025-06-30" -> { operator: "<", value: 5000 }
 */
function parseCanonicalComparison(canonical: string): { operator: string; value: number } | null {
  const patterns = [
    /(\w+)\s+(\w+)\s+(>=?|<=?|==?)\s+(\d+(?:\.\d+)?)/,
    /(\w+)\s+(>=?|<=?|==?)\s+(\d+(?:\.\d+)?)/
  ];
  
  for (const pattern of patterns) {
    const match = canonical.match(pattern);
    if (match) {
      const operator = match[match.length - 2];
      const value = parseFloat(match[match.length - 1]);
      
      if (!isNaN(value)) {
        return { operator, value };
      }
    }
  }
  
  return null;
}

/**
 * Process a single insight resolution and save to database
 */
export async function processInsightResolution(insightId: string): Promise<void> {
  const startTime = Date.now();
  
  try {
    // Fetch insight from database
    const insight = await prisma.insight.findUnique({
      where: { id: insightId },
      select: {
        id: true,
        creatorId: true,
        canonical: true,
        p: true,
        deadline: true,
        resolverKind: true,
        resolverRef: true,
        status: true
      }
    });
    
    if (!insight) {
      throw new Error(`Insight not found: ${insightId}`);
    }
    
    if (insight.status === 'RESOLVED') {
      console.log(`⏭️ Insight ${insightId} already resolved`);
      return;
    }
    
    if (!insight.canonical || !insight.p || !insight.deadline || !insight.resolverKind || !insight.resolverRef) {
      throw new Error(`Insight ${insightId} missing required fields for resolution`);
    }
    
    // Convert to engine format
    const engineInsight: Insight = {
      id: insight.id,
      canonical: insight.canonical,
      p: typeof insight.p === 'number' ? insight.p : insight.p.toNumber(),
      deadline: insight.deadline,
      resolverKind: insight.resolverKind as 'PRICE' | 'URL' | 'TEXT',
      resolverRef: insight.resolverRef,
      status: insight.status as 'OPEN' | 'COMMITTED' | 'RESOLVED'
    };
    
    // Resolve the insight
    const resolution = await resolveInsight(engineInsight);
    
    // Save outcome to database
    await prisma.$transaction(async (tx) => {
      // Create outcome record
      await tx.outcome.create({
        data: {
          insightId: insight.id,
          result: resolution.result,
          evidenceUrl: resolution.evidenceUrl,
          decidedBy: resolution.decidedBy,
          decidedAt: new Date()
        }
      });
      
      // Update insight status
      await tx.insight.update({
        where: { id: insight.id },
        data: { status: 'RESOLVED' }
      });
    });
    
    // Update creator profile aggregates if insight has a creator
    if (insight.creatorId) {
      try {
        await updateProfileAggregates(insight.creatorId);
      } catch (error) {
        console.error(`Failed to update profile aggregates for creator ${insight.creatorId}:`, error);
        // Don't fail the resolution if profile update fails
      }
    }
    
    // Log event
    const tookMs = Date.now() - startTime;
    createEvent(EVENT_TYPES.OUTCOME_RESOLVED, {
      insightId: insight.id,
      result: resolution.result,
      decidedBy: resolution.decidedBy,
      tookMs,
      confidence: resolution.confidence
    });
    
    console.log(`✅ Processed resolution for ${insightId}: ${resolution.result} (${tookMs}ms)`);
    
  } catch (error) {
    const tookMs = Date.now() - startTime;
    console.error(`❌ Failed to process resolution for ${insightId} (${tookMs}ms):`, error);
    
    // Log error event
    createEvent(EVENT_TYPES.SYSTEM_ERROR, {
      insightId,
      error: error instanceof Error ? error.message : 'Unknown error',
      tookMs
    });
    
    throw error;
  }
}

/**
 * Find insights ready for resolution
 */
export async function findInsightsReadyForResolution(): Promise<string[]> {
  const now = new Date();
  
  const insights = await prisma.insight.findMany({
    where: {
      status: {
        in: ['OPEN', 'COMMITTED']
      },
      deadline: {
        lte: now
      },
      // Only resolve insights with required fields
      canonical: { not: null },
      p: { not: null },
      resolverKind: { not: null },
      resolverRef: { not: null }
    },
    select: {
      id: true,
      canonical: true,
      deadline: true,
      resolverKind: true
    },
    orderBy: {
      deadline: 'asc'
    }
  });
  
  console.log(`Found ${insights.length} insights ready for resolution`);
  
  return insights.map(i => i.id);
}
