/**
 * Market Matching Service
 * Automatically finds and matches external markets to our insights
 */

import { ExternalMarket, MarketMatchScore } from './types';
import { kalshiClient } from './kalshi';

interface MatcherInsight {
  question: string;
  deadline?: Date;
  probability: number;
}

export class MarketMatcher {
  /**
   * Find matching external markets for an insight
   */
  async findMatchingMarkets(insight: MatcherInsight): Promise<MarketMatchScore[]> {
    const matches: MarketMatchScore[] = [];

    try {
      const kalshiResults = await kalshiClient.searchMarkets(insight.question, 5);

      for (const market of kalshiResults.markets) {
        const score = this.calculateSimilarity(insight, market);
        if (score.similarity > 0.3) { // Only include decent matches
          matches.push(score);
        }
      }

      // Sort by similarity score
      matches.sort((a, b) => b.similarity - a.similarity);

      return matches.slice(0, 5); // Return top 5 matches
    } catch (error) {
      console.error('Market matching error:', error);
      return [];
    }
  }

  /**
   * Calculate similarity score between insight and market
   */
  private calculateSimilarity(insight: MatcherInsight, market: ExternalMarket): MarketMatchScore {
    let similarity = 0;
    const reasons: string[] = [];

    // Text similarity (basic keyword matching)
    const textScore = this.calculateTextSimilarity(insight.question, market.question);
    similarity += textScore * 0.6; // 60% weight
    if (textScore > 0.5) {
      reasons.push(`High text similarity (${(textScore * 100).toFixed(0)}%)`);
    }

    // Date proximity (if both have deadlines)
    if (insight.deadline) {
      const dateScore = this.calculateDateSimilarity(insight.deadline, new Date(market.endDate));
      similarity += dateScore * 0.2; // 20% weight
      if (dateScore > 0.7) {
        reasons.push(`Similar timeline`);
      }
    }

    // Probability alignment
    const probScore = this.calculateProbabilitySimilarity(insight.probability, market.yesPrice);
    similarity += probScore * 0.2; // 20% weight
    if (probScore > 0.8) {
      reasons.push(`Similar probability assessment`);
    }

    // Market quality indicators
    if (market.volume > 10000) {
      similarity += 0.05;
      reasons.push(`High volume market`);
    }
    if (market.liquidity > 1000) {
      similarity += 0.05;
      reasons.push(`Good liquidity`);
    }

    return {
      market,
      similarity: Math.min(similarity, 1), // Cap at 1.0
      reasons,
    };
  }

  /**
   * Calculate text similarity using simple keyword matching
   * TODO: Enhance with semantic embeddings
   */
  private calculateTextSimilarity(text1: string, text2: string): number {
    const words1 = this.extractKeywords(text1);
    const words2 = this.extractKeywords(text2);

    const intersection = words1.filter(word => words2.includes(word));
    const union = [...new Set([...words1, ...words2])];

    return union.length > 0 ? intersection.length / union.length : 0;
  }

  /**
   * Extract meaningful keywords from text
   */
  private extractKeywords(text: string): string[] {
    const stopWords = new Set([
      'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by',
      'will', 'be', 'is', 'are', 'was', 'were', 'have', 'has', 'had', 'do', 'does', 'did',
      'what', 'when', 'where', 'who', 'why', 'how', 'this', 'that', 'these', 'those'
    ]);

    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 2 && !stopWords.has(word))
      .slice(0, 10); // Limit to top 10 keywords
  }

  /**
   * Calculate date similarity (closer dates = higher score)
   */
  private calculateDateSimilarity(date1: Date, date2: Date): number {
    const diffMs = Math.abs(date1.getTime() - date2.getTime());
    const diffDays = diffMs / (1000 * 60 * 60 * 24);

    // Score decreases as dates get further apart
    if (diffDays <= 1) return 1.0;
    if (diffDays <= 7) return 0.9;
    if (diffDays <= 30) return 0.7;
    if (diffDays <= 90) return 0.5;
    return 0.2;
  }

  /**
   * Calculate probability similarity
   */
  private calculateProbabilitySimilarity(prob1: number, prob2: number): number {
    const diff = Math.abs(prob1 - prob2);
    return Math.max(0, 1 - diff * 2); // Linear decrease, max diff of 0.5 = score 0
  }
}

export const marketMatcher = new MarketMatcher();
