/**
 * AI Accuracy Tracker - Makes Predikt AI smarter over time
 * This is what makes us different from ChatGPT - we remember and learn
 */

import { prisma } from '../prisma';

export interface AIAccuracyMetrics {
  modelVersion: string;
  category: string;
  accuracy: number;
  totalPredictions: number;
  confidenceLevel: 'low' | 'medium' | 'high' | 'very_high';
  lastUpdated: Date;
  brierScore?: number;
}

export interface EnhancedPredictionContext {
  question: string;
  category: string;
  modelVersion: string;
  historicalAccuracy?: AIAccuracyMetrics;
  confidenceFactors: {
    dataQuality: number;
    historicalPerformance: number;
    categoryExpertise: number;
    uncertaintyFactors: string[];
  };
}

export class AIAccuracyTracker {
  
  /**
   * Get AI's historical accuracy for a specific category
   */
  static async getAccuracyForCategory(
    modelVersion: string, 
    category: string
  ): Promise<AIAccuracyMetrics | null> {
    try {
      const accuracy = await prisma.aIAccuracy.findUnique({
        where: {
          modelVersion_category: {
            modelVersion,
            category
          }
        }
      });

      if (!accuracy) return null;

      return {
        modelVersion: accuracy.modelVersion,
        category: accuracy.category,
        accuracy: accuracy.accuracy,
        totalPredictions: accuracy.totalPredictions,
        confidenceLevel: this.getConfidenceLevel(accuracy.accuracy, accuracy.totalPredictions),
        lastUpdated: accuracy.lastUpdated,
        brierScore: accuracy.brierScore || undefined
      };
    } catch (error) {
      console.error('Error fetching AI accuracy:', error);
      return null;
    }
  }

  /**
   * Update AI accuracy when a prediction is resolved
   */
  static async updateAccuracy(
    modelVersion: string,
    category: string,
    wasCorrect: boolean,
    actualProbability: number,
    predictedProbability: number
  ): Promise<void> {
    try {
      // Calculate Brier score for this prediction
      const brierScore = Math.pow(predictedProbability - (wasCorrect ? 1 : 0), 2);

      await prisma.aIAccuracy.upsert({
        where: {
          modelVersion_category: {
            modelVersion,
            category
          }
        },
        update: {
          totalPredictions: { increment: 1 },
          correctPredictions: wasCorrect ? { increment: 1 } : undefined,
          lastUpdated: new Date()
        },
        create: {
          modelVersion,
          category,
          totalPredictions: 1,
          correctPredictions: wasCorrect ? 1 : 0,
          accuracy: wasCorrect ? 1.0 : 0.0,
          brierScore: brierScore,
          lastUpdated: new Date()
        }
      });

      // Recalculate accuracy and brier score after the update
      const updated = await prisma.aIAccuracy.findUnique({
        where: {
          modelVersion_category: {
            modelVersion,
            category
          }
        }
      });

      if (updated) {
        const newAccuracy = updated.correctPredictions / updated.totalPredictions;
        const newBrierScore = updated.brierScore 
          ? (updated.brierScore * (updated.totalPredictions - 1) + brierScore) / updated.totalPredictions
          : brierScore;

        await prisma.aIAccuracy.update({
          where: {
            modelVersion_category: {
              modelVersion,
              category
            }
          },
          data: {
            accuracy: newAccuracy,
            brierScore: newBrierScore
          }
        });
      }

      console.log(`✅ Updated AI accuracy for ${modelVersion}/${category}: ${wasCorrect ? 'CORRECT' : 'INCORRECT'}`);
    } catch (error) {
      console.error('Error updating AI accuracy:', error);
    }
  }

  /**
   * Get confidence level based on accuracy and sample size
   */
  static getConfidenceLevel(
    accuracy: number, 
    totalPredictions: number
  ): 'low' | 'medium' | 'high' | 'very_high' {
    // Need sufficient sample size for confidence
    if (totalPredictions < 5) return 'low';
    if (totalPredictions < 20) return accuracy > 0.7 ? 'medium' : 'low';
    if (totalPredictions < 50) return accuracy > 0.75 ? 'high' : accuracy > 0.6 ? 'medium' : 'low';
    
    // Large sample size
    if (accuracy > 0.8) return 'very_high';
    if (accuracy > 0.7) return 'high';
    if (accuracy > 0.6) return 'medium';
    return 'low';
  }

  /**
   * Enhance prediction context with historical performance
   */
  static async enhancePredictionContext(
    question: string,
    category: string,
    modelVersion: string = "enhanced-v1"
  ): Promise<EnhancedPredictionContext> {
    const historicalAccuracy = await this.getAccuracyForCategory(modelVersion, category);
    
    // Calculate confidence factors
    const confidenceFactors = {
      dataQuality: 0.8, // TODO: Calculate based on available data sources
      historicalPerformance: historicalAccuracy ? 
        Math.min(historicalAccuracy.accuracy * 1.2, 1.0) : 0.5,
      categoryExpertise: historicalAccuracy ? 
        Math.min(historicalAccuracy.totalPredictions / 20, 1.0) : 0.3,
      uncertaintyFactors: this.identifyUncertaintyFactors(question, category)
    };

    return {
      question,
      category,
      modelVersion,
      historicalAccuracy: historicalAccuracy || undefined,
      confidenceFactors
    };
  }

  /**
   * Identify factors that increase uncertainty
   */
  static identifyUncertaintyFactors(question: string, category: string): string[] {
    const factors: string[] = [];
    const questionLower = question.toLowerCase();

    // Time-based uncertainty
    if (questionLower.includes('next week') || questionLower.includes('tomorrow')) {
      factors.push('Short-term predictions are more volatile');
    }
    if (questionLower.includes('next year') || questionLower.includes('2025') || questionLower.includes('2026')) {
      factors.push('Long-term predictions have higher uncertainty');
    }

    // Category-specific uncertainty
    if (category === 'crypto') {
      factors.push('Crypto markets are highly volatile');
    }
    if (category === 'politics') {
      factors.push('Political events can be unpredictable');
    }
    if (category === 'technology') {
      factors.push('Tech developments can have unexpected breakthroughs');
    }

    // Question complexity
    if (questionLower.includes('and') || questionLower.includes('or')) {
      factors.push('Multi-part questions increase complexity');
    }
    if (questionLower.includes('exactly') || questionLower.includes('precisely')) {
      factors.push('Precise predictions are harder to get right');
    }

    return factors;
  }

  /**
   * Get overall AI performance summary
   */
  static async getOverallPerformance(modelVersion: string = "enhanced-v1"): Promise<{
    totalPredictions: number;
    averageAccuracy: number;
    strongestCategories: Array<{category: string, accuracy: number}>;
    weakestCategories: Array<{category: string, accuracy: number}>;
  }> {
    try {
      const accuracyRecords = await prisma.aIAccuracy.findMany({
        where: { modelVersion },
        orderBy: { accuracy: 'desc' }
      });

      const totalPredictions = accuracyRecords.reduce((sum, record) => sum + record.totalPredictions, 0);
      const weightedAccuracy = accuracyRecords.reduce(
        (sum, record) => sum + (record.accuracy * record.totalPredictions), 0
      ) / Math.max(totalPredictions, 1);

      return {
        totalPredictions,
        averageAccuracy: weightedAccuracy,
        strongestCategories: accuracyRecords
          .filter(r => r.totalPredictions >= 3)
          .slice(0, 3)
          .map(r => ({ category: r.category, accuracy: r.accuracy })),
        weakestCategories: accuracyRecords
          .filter(r => r.totalPredictions >= 3)
          .slice(-3)
          .reverse()
          .map(r => ({ category: r.category, accuracy: r.accuracy }))
      };
    } catch (error) {
      console.error('Error getting overall performance:', error);
      return {
        totalPredictions: 0,
        averageAccuracy: 0,
        strongestCategories: [],
        weakestCategories: []
      };
    }
  }
}

/**
 * Initialize some demo accuracy data for testing
 */
export async function seedDemoAccuracy() {
  const demoData = [
    { modelVersion: 'enhanced-v1', category: 'crypto', accuracy: 0.72, total: 25, correct: 18 },
    { modelVersion: 'enhanced-v1', category: 'technology', accuracy: 0.85, total: 20, correct: 17 },
    { modelVersion: 'enhanced-v1', category: 'politics', accuracy: 0.65, total: 15, correct: 10 },
    { modelVersion: 'enhanced-v1', category: 'sports', accuracy: 0.78, total: 18, correct: 14 },
    { modelVersion: 'enhanced-v1', category: 'business', accuracy: 0.82, total: 22, correct: 18 },
  ];

  for (const data of demoData) {
    await prisma.aIAccuracy.upsert({
      where: {
        modelVersion_category: {
          modelVersion: data.modelVersion,
          category: data.category
        }
      },
      update: {
        totalPredictions: data.total,
        correctPredictions: data.correct,
        accuracy: data.accuracy,
        brierScore: 0.25 - (data.accuracy * 0.2), // Rough Brier score estimate
        lastUpdated: new Date()
      },
      create: {
        modelVersion: data.modelVersion,
        category: data.category,
        totalPredictions: data.total,
        correctPredictions: data.correct,
        accuracy: data.accuracy,
        brierScore: 0.25 - (data.accuracy * 0.2),
        lastUpdated: new Date()
      }
    });
  }

  console.log('✅ Demo accuracy data seeded');
}
