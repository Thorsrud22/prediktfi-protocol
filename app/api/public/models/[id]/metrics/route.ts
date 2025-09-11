/**
 * Model Metrics API
 * GET /api/public/models/:id/metrics
 * 
 * Returns calibrated probabilities and model performance metrics
 */

export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { loadModel } from '@/src/models/logistic';
import { loadPlattScaling, calibrateProbabilities } from '@/src/models/platt';
import { createFeatureVector } from '@/src/models/features';

interface ModelMetricsResponse {
  modelId: string;
  calibratedProbability: number;
  rawProbability: number;
  calibrationNote?: string;
  modelMetadata: {
    trainedAt: string;
    trainingSamples: number;
    convergenceIterations: number;
  };
  plattMetadata: {
    trainedAt: string;
    holdoutSamples: number;
    originalBrierScore: number;
    calibratedBrierScore: number;
    improvement: number;
  };
  featureImportance: Record<string, number>;
  evaluation?: {
    brierScore: number;
    logLoss: number;
    accuracy: number;
    reliability: number;
    samples: number;
    evaluationDate: string;
  };
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: modelId } = await params;
    
    // Load model and Platt scaling
    const modelPath = join(process.cwd(), 'models', `${modelId}.json`);
    const plattPath = join(process.cwd(), 'models', `${modelId}-platt.json`);
    
    if (!existsSync(modelPath) || !existsSync(plattPath)) {
      return NextResponse.json(
        { error: 'Model not found' },
        { status: 404 }
      );
    }
    
    const modelData = readFileSync(modelPath, 'utf-8');
    const model = loadModel(modelData);
    
    const plattData = readFileSync(plattPath, 'utf-8');
    const plattScaling = loadPlattScaling(plattData);
    
    // Extract market data from request (simplified - in production, get from real sources)
    const { searchParams } = new URL(request.url);
    const marketData = {
      oddsMid: parseFloat(searchParams.get('oddsMid') || '0.5'),
      oddsSpread: parseFloat(searchParams.get('oddsSpread') || '0.05'),
      liquidity: parseFloat(searchParams.get('liquidity') || '100000'),
      funding8h: parseFloat(searchParams.get('funding8h') || '0'),
      funding1d: parseFloat(searchParams.get('funding1d') || '0'),
      fgi: parseFloat(searchParams.get('fgi') || '50'),
      pnl30d: parseFloat(searchParams.get('pnl30d') || '0'),
      vol30d: parseFloat(searchParams.get('vol30d') || '0.1'),
    };
    
    // Create feature vector
    const features = createFeatureVector(marketData);
    
    // Get raw prediction
    const rawProbability = model.coefficients.reduce((sum, coef, i) => {
      return sum + coef * Object.values(features)[i];
    }, model.bias);
    
    // Apply sigmoid to get probability
    const sigmoid = (z: number) => 1 / (1 + Math.exp(-Math.max(-500, Math.min(500, z))));
    const rawProb = sigmoid(rawProbability);
    
    // Apply Platt scaling
    const calibratedProb = calibrateProbabilities([rawProb], plattScaling)[0];
    
    // Load evaluation results if available
    let evaluation;
    const evalPath = join(process.cwd(), 'eval', `${modelId}-eval.json`);
    if (existsSync(evalPath)) {
      try {
        const evalData = JSON.parse(readFileSync(evalPath, 'utf-8'));
        evaluation = {
          brierScore: evalData.metrics.brierScore,
          logLoss: evalData.metrics.logLoss,
          accuracy: evalData.metrics.accuracy,
          reliability: evalData.metrics.reliability,
          samples: evalData.samples,
          evaluationDate: evalData.evaluationDate,
        };
      } catch (error) {
        console.warn('Failed to load evaluation data:', error);
      }
    }
    
    // Generate calibration note if holdout samples are low
    let calibrationNote;
    if (plattScaling.metadata.holdoutSamples < 50) {
      calibrationNote = `Calibration based on limited data (${plattScaling.metadata.holdoutSamples} samples). Use with caution.`;
    }
    
    // Calculate feature importance
    const featureImportance: Record<string, number> = {};
    for (let i = 0; i < model.coefficients.length; i++) {
      const featureName = model.featureNames[i];
      featureImportance[featureName] = Math.abs(model.coefficients[i]);
    }
    
    const response: ModelMetricsResponse = {
      modelId,
      calibratedProbability: calibratedProb,
      rawProbability: rawProb,
      calibrationNote,
      modelMetadata: {
        trainedAt: model.metadata.trainedAt.toISOString(),
        trainingSamples: model.metadata.trainingSamples,
        convergenceIterations: model.metadata.convergenceIterations,
      },
      plattMetadata: {
        trainedAt: plattScaling.metadata.trainedAt.toISOString(),
        holdoutSamples: plattScaling.metadata.holdoutSamples,
        originalBrierScore: plattScaling.metadata.originalBrierScore,
        calibratedBrierScore: plattScaling.metadata.calibratedBrierScore,
        improvement: plattScaling.metadata.improvement,
      },
      featureImportance,
      evaluation,
    };
    
    return NextResponse.json(response, {
      headers: {
        'Cache-Control': 'public, max-age=300, stale-while-revalidate=600',
        'X-Model-Version': modelId,
        'X-Calibration-Status': plattScaling.metadata.holdoutSamples >= 50 ? 'calibrated' : 'limited',
      }
    });
    
  } catch (error) {
    console.error('Model metrics API error:', error);
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
