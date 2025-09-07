/**
 * Confidence Calibrator - Makes AI predictions more accurate over time
 * This is what separates us from basic AI - we learn from our mistakes
 */

import { prisma } from '../prisma';

export interface CalibrationData {
  predictedConfidence: number;
  actualOutcome: boolean;
  category: string;
  modelVersion: string;
  timestamp: Date;
}

export interface CalibratedConfidence {
  originalConfidence: number;
  calibratedConfidence: number;
  calibrationFactor: number;
  reliability: 'low' | 'medium' | 'high';
}

export class ConfidenceCalibrator {
  
  /**
   * Calibrate confidence based on historical performance
   */
  static async calibrateConfidence(
    originalConfidence: number,
    category: string,
    modelVersion: string = 'enhanced-v1'
  ): Promise<CalibratedConfidence> {
    try {
      // Get historical calibration data for this category
      const calibrationData = await prisma.aICalibration.findMany({
        where: {
          modelVersion,
          category
        },
        orderBy: { timestamp: 'desc' },
        take: 100 // Last 100 predictions
      });

      if (calibrationData.length < 10) {
        // Not enough data for calibration
        return {
          originalConfidence,
          calibratedConfidence: originalConfidence,
          calibrationFactor: 1.0,
          reliability: 'low'
        };
      }

      // Calculate calibration curve
      const calibrationCurve = this.calculateCalibrationCurve(calibrationData);
      
      // Apply calibration
      const calibratedConfidence = this.applyCalibration(originalConfidence, calibrationCurve);
      const calibrationFactor = calibratedConfidence / originalConfidence;
      
      // Determine reliability
      const reliability = this.calculateReliability(calibrationData, calibrationCurve);

      return {
        originalConfidence,
        calibratedConfidence,
        calibrationFactor,
        reliability
      };

    } catch (error) {
      console.error('Confidence calibration failed:', error);
      return {
        originalConfidence,
        calibratedConfidence: originalConfidence,
        calibrationFactor: 1.0,
        reliability: 'low'
      };
    }
  }

  /**
   * Record prediction outcome for future calibration
   */
  static async recordOutcome(
    predictedConfidence: number,
    actualOutcome: boolean,
    category: string,
    modelVersion: string = 'enhanced-v1'
  ): Promise<void> {
    try {
      await prisma.aICalibration.create({
        data: {
          predictedConfidence,
          actualOutcome,
          category,
          modelVersion,
          timestamp: new Date()
        }
      });

      console.log(`✅ Recorded calibration data: ${category} - ${actualOutcome ? 'CORRECT' : 'INCORRECT'}`);
    } catch (error) {
      console.error('Failed to record calibration data:', error);
    }
  }

  /**
   * Calculate calibration curve from historical data
   */
  private static calculateCalibrationCurve(calibrationData: any[]): number[] {
    // Group by confidence bins (0-0.2, 0.2-0.4, etc.)
    const bins = Array.from({ length: 5 }, (_, i) => ({
      confidenceRange: [i * 0.2, (i + 1) * 0.2],
      predictions: [] as any[],
      accuracy: 0
    }));

    // Sort data into bins
    calibrationData.forEach(data => {
      const binIndex = Math.min(4, Math.floor(data.predictedConfidence / 0.2));
      bins[binIndex].predictions.push(data);
    });

    // Calculate actual accuracy for each bin
    bins.forEach(bin => {
      if (bin.predictions.length > 0) {
        const correct = bin.predictions.filter(p => p.actualOutcome).length;
        bin.accuracy = correct / bin.predictions.length;
      }
    });

    // Create smooth calibration curve
    return bins.map(bin => bin.accuracy);
  }

  /**
   * Apply calibration to confidence score
   */
  private static applyCalibration(confidence: number, calibrationCurve: number[]): number {
    const binIndex = Math.min(4, Math.floor(confidence / 0.2));
    const binAccuracy = calibrationCurve[binIndex];
    
    // Interpolate between bins for smoother calibration
    const lowerBin = Math.floor(confidence / 0.2);
    const upperBin = Math.min(4, lowerBin + 1);
    
    if (lowerBin === upperBin) {
      return Math.max(0.05, Math.min(0.95, binAccuracy));
    }
    
    const weight = (confidence - lowerBin * 0.2) / 0.2;
    const interpolatedAccuracy = calibrationCurve[lowerBin] * (1 - weight) + calibrationCurve[upperBin] * weight;
    
    return Math.max(0.05, Math.min(0.95, interpolatedAccuracy));
  }

  /**
   * Calculate reliability of calibration
   */
  private static calculateReliability(calibrationData: any[], calibrationCurve: number[]): 'low' | 'medium' | 'high' {
    const sampleSize = calibrationData.length;
    
    if (sampleSize < 20) return 'low';
    if (sampleSize < 50) return 'medium';
    
    // Check calibration quality
    const calibrationQuality = this.assessCalibrationQuality(calibrationData, calibrationCurve);
    
    if (calibrationQuality > 0.8) return 'high';
    if (calibrationQuality > 0.6) return 'medium';
    return 'low';
  }

  /**
   * Assess how well-calibrated our predictions are
   */
  private static assessCalibrationQuality(calibrationData: any[], calibrationCurve: number[]): number {
    // Calculate Brier score for calibration
    let totalBrierScore = 0;
    
    calibrationData.forEach(data => {
      const binIndex = Math.min(4, Math.floor(data.predictedConfidence / 0.2));
      const calibratedConfidence = calibrationCurve[binIndex];
      const actualOutcome = data.actualOutcome ? 1 : 0;
      
      const brierScore = Math.pow(calibratedConfidence - actualOutcome, 2);
      totalBrierScore += brierScore;
    });
    
    const averageBrierScore = totalBrierScore / calibrationData.length;
    
    // Convert Brier score to quality (lower is better)
    return Math.max(0, 1 - averageBrierScore * 2);
  }

  /**
   * Get calibration statistics for a category
   */
  static async getCalibrationStats(category: string, modelVersion: string = 'enhanced-v1') {
    try {
      const calibrationData = await prisma.aICalibration.findMany({
        where: { modelVersion, category },
        orderBy: { timestamp: 'desc' },
        take: 100
      });

      if (calibrationData.length === 0) {
        return {
          totalPredictions: 0,
          averageAccuracy: 0,
          calibrationQuality: 0,
          reliability: 'low' as const
        };
      }

      const correct = calibrationData.filter(d => d.actualOutcome).length;
      const averageAccuracy = correct / calibrationData.length;
      
      const calibrationCurve = this.calculateCalibrationCurve(calibrationData);
      const calibrationQuality = this.assessCalibrationQuality(calibrationData, calibrationCurve);
      const reliability = this.calculateReliability(calibrationData, calibrationCurve);

      return {
        totalPredictions: calibrationData.length,
        averageAccuracy,
        calibrationQuality,
        reliability
      };

    } catch (error) {
      console.error('Failed to get calibration stats:', error);
      return {
        totalPredictions: 0,
        averageAccuracy: 0,
        calibrationQuality: 0,
        reliability: 'low' as const
      };
    }
  }
}
