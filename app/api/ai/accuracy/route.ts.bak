/**
 * API endpoint for AI accuracy data
 * Keeps database calls on server-side to avoid Prisma browser issues
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const modelVersion = searchParams.get('modelVersion') || 'enhanced-v1';
    const category = searchParams.get('category');

    if (category) {
      // Get accuracy for specific category directly
      const accuracy = await prisma.aIAccuracy.findUnique({
        where: {
          modelVersion_category: {
            modelVersion,
            category
          }
        }
      });

      if (!accuracy) {
        return NextResponse.json({ accuracy: null });
      }

      const result = {
        modelVersion: accuracy.modelVersion,
        category: accuracy.category,
        accuracy: accuracy.accuracy,
        totalPredictions: accuracy.totalPredictions,
        confidenceLevel: accuracy.accuracy > 0.8 ? 'very_high' : 
                        accuracy.accuracy > 0.7 ? 'high' : 
                        accuracy.accuracy > 0.6 ? 'medium' : 'low',
        lastUpdated: accuracy.lastUpdated,
        brierScore: accuracy.brierScore || undefined
      };

      return NextResponse.json({ accuracy: result });
    } else {
      // Get overall performance
      const accuracyRecords = await prisma.aIAccuracy.findMany({
        where: { modelVersion },
        orderBy: { accuracy: 'desc' }
      });

      const totalPredictions = accuracyRecords.reduce((sum, record) => sum + record.totalPredictions, 0);
      const weightedAccuracy = accuracyRecords.reduce(
        (sum, record) => sum + (record.accuracy * record.totalPredictions), 0
      ) / Math.max(totalPredictions, 1);

      const performance = {
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

      return NextResponse.json({ performance });
    }
  } catch (error) {
    console.error('Error fetching AI accuracy:', error);
    return NextResponse.json(
      { error: 'Failed to fetch AI accuracy data' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { modelVersion, category, wasCorrect, actualProbability, predictedProbability } = body;

    // Import or define AIAccuracyTracker if missing
    // Assuming AIAccuracyTracker is not defined, use prisma directly to update accuracy

    // Example: Upsert the accuracy record for the given modelVersion and category
    await prisma.aIAccuracy.upsert({
      where: {
        modelVersion_category: {
          modelVersion,
          category,
        },
      },
      update: {
        // Update logic: increment totalPredictions, recalculate accuracy, update brierScore, etc.
        totalPredictions: { increment: 1 },
        correctPredictions: { increment: wasCorrect ? 1 : 0 },
        brierScore: {
          // If brierScore is tracked, update it as a running average
          // This is a placeholder; actual calculation may differ
          increment: (actualProbability - predictedProbability) ** 2,
        },
        accuracy: {
          // Placeholder: recalculate accuracy as correctPredictions / totalPredictions
          // This may require a separate query or transaction for atomicity
        },
        lastUpdated: new Date(),
      },
      create: {
        modelVersion,
        category,
        totalPredictions: 1,
        correctPredictions: wasCorrect ? 1 : 0,
        brierScore: (actualProbability - predictedProbability) ** 2,
        accuracy: wasCorrect ? 1 : 0,
        lastUpdated: new Date(),
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating AI accuracy:', error);
    return NextResponse.json(
      { error: 'Failed to update AI accuracy' },
      { status: 500 }
    );
  }
}
