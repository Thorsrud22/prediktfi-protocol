/**
 * Creator Data Quality Sentinel API
 * GET /api/ops/creator-dq - Validate CreatorDaily data quality invariants
 */

import { NextRequest, NextResponse } from 'next/server';
import { createHmac } from 'crypto';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface DataQualityViolation {
  creatorId: string;
  creatorIdHashed: string;
  field: string;
  value: any;
  expected: any;
  day: string;
  severity: 'error' | 'warning';
  message: string;
}

export interface DataQualityReport {
  ok: boolean;
  violations: DataQualityViolation[];
  summary: {
    totalRecords: number;
    violationCount: number;
    errorCount: number;
    warningCount: number;
  };
  checkedAt: string;
}

// Score component weights (should match the scoring system)
const SCORE_WEIGHTS = {
  W_ACC: 0.4,    // Accuracy weight
  W_CONS: 0.3,   // Consistency weight  
  W_VOL: 0.2,    // Volume weight
  W_REC: 0.1     // Recency weight
};

/**
 * Verify HMAC signature for operations endpoint
 */
function verifyHMACSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  try {
    const expectedSignature = createHmac('sha256', secret)
      .update(payload)
      .digest('hex');
    
    return signature === expectedSignature;
  } catch (error) {
    console.error('HMAC verification error:', error);
    return false;
  }
}

/**
 * Hash creator ID for privacy
 */
function hashCreatorId(creatorId: string): string {
  const crypto = require('crypto');
  return crypto.createHash('sha256').update(creatorId).digest('hex').substring(0, 8);
}

/**
 * Check if value is within expected range with tolerance
 */
function isWithinTolerance(actual: number, expected: number, tolerance: number = 1e-6): boolean {
  return Math.abs(actual - expected) <= tolerance;
}

/**
 * Validate component values are in [0,1] range
 */
function validateComponentRange(
  value: number, 
  field: string, 
  creatorId: string, 
  day: string
): DataQualityViolation | null {
  if (value < 0 || value > 1) {
    return {
      creatorId,
      creatorIdHashed: hashCreatorId(creatorId),
      field,
      value,
      expected: '[0,1]',
      day,
      severity: 'error',
      message: `${field} must be in range [0,1], got ${value}`
    };
  }
  return null;
}

/**
 * Validate accuracy calculation: accuracy ≈ 1 - brierMean
 */
function validateAccuracyCalculation(
  accuracy: number,
  brierMean: number,
  creatorId: string,
  day: string
): DataQualityViolation | null {
  const expectedAccuracy = Math.max(0, Math.min(1, 1 - brierMean));
  
  if (!isWithinTolerance(accuracy, expectedAccuracy)) {
    return {
      creatorId,
      creatorIdHashed: hashCreatorId(creatorId),
      field: 'accuracy',
      value: accuracy,
      expected: expectedAccuracy,
      day,
      severity: 'error',
      message: `accuracy (${accuracy}) should equal 1 - brierMean (${expectedAccuracy})`
    };
  }
  return null;
}

/**
 * Validate score calculation: score = W_ACC*acc + W_CONS*cons + W_VOL*vol + W_REC*rec
 */
function validateScoreCalculation(
  score: number,
  accuracy: number,
  consistency: number,
  volumeScore: number,
  recencyScore: number,
  creatorId: string,
  day: string
): DataQualityViolation | null {
  const expectedScore = 
    SCORE_WEIGHTS.W_ACC * accuracy +
    SCORE_WEIGHTS.W_CONS * consistency +
    SCORE_WEIGHTS.W_VOL * volumeScore +
    SCORE_WEIGHTS.W_REC * recencyScore;
  
  if (!isWithinTolerance(score, expectedScore)) {
    return {
      creatorId,
      creatorIdHashed: hashCreatorId(creatorId),
      field: 'score',
      value: score,
      expected: expectedScore,
      day,
      severity: 'error',
      message: `score (${score}) should equal weighted sum of components (${expectedScore})`
    };
  }
  return null;
}

/**
 * Validate maturedN is non-negative
 */
function validateMaturedN(
  maturedN: number,
  creatorId: string,
  day: string
): DataQualityViolation | null {
  if (maturedN < 0) {
    return {
      creatorId,
      creatorIdHashed: hashCreatorId(creatorId),
      field: 'maturedN',
      value: maturedN,
      expected: '>= 0',
      day,
      severity: 'error',
      message: `maturedN must be non-negative, got ${maturedN}`
    };
  }
  return null;
}

/**
 * Validate retStd30d is non-negative or null
 */
function validateRetStd30d(
  retStd30d: number | null,
  creatorId: string,
  day: string
): DataQualityViolation | null {
  if (retStd30d !== null && retStd30d < 0) {
    return {
      creatorId,
      creatorIdHashed: hashCreatorId(creatorId),
      field: 'retStd30d',
      value: retStd30d,
      expected: '>= 0 or null',
      day,
      severity: 'error',
      message: `retStd30d must be non-negative or null, got ${retStd30d}`
    };
  }
  return null;
}

/**
 * Validate notional30d is non-negative
 */
function validateNotional30d(
  notional30d: number,
  creatorId: string,
  day: string
): DataQualityViolation | null {
  if (notional30d < 0) {
    return {
      creatorId,
      creatorIdHashed: hashCreatorId(creatorId),
      field: 'notional30d',
      value: notional30d,
      expected: '>= 0',
      day,
      severity: 'error',
      message: `notional30d must be non-negative, got ${notional30d}`
    };
  }
  return null;
}

/**
 * Run data quality checks on CreatorDaily records
 */
async function runDataQualityChecks(days: number = 7): Promise<DataQualityReport> {
  const violations: DataQualityViolation[] = [];
  
  // Get records from the last N days
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);
  
  console.log(`🔍 Running data quality checks on CreatorDaily records from last ${days} days`);
  
  const records = await prisma.creatorDaily.findMany({
    where: {
      day: {
        gte: cutoffDate
      }
    },
    orderBy: {
      day: 'desc'
    }
  });
  
  console.log(`📊 Found ${records.length} CreatorDaily records to validate`);
  
  for (const record of records) {
    const dayStr = record.day.toISOString().split('T')[0];
    
    // Check component ranges [0,1]
    const componentViolations = [
      validateComponentRange(record.accuracy, 'accuracy', record.creatorId, dayStr),
      validateComponentRange(record.consistency, 'consistency', record.creatorId, dayStr),
      validateComponentRange(record.volumeScore, 'volumeScore', record.creatorId, dayStr),
      validateComponentRange(record.recencyScore, 'recencyScore', record.creatorId, dayStr)
    ].filter(Boolean) as DataQualityViolation[];
    
    violations.push(...componentViolations);
    
    // Check accuracy calculation
    const accuracyViolation = validateAccuracyCalculation(
      record.accuracy,
      record.brierMean,
      record.creatorId,
      dayStr
    );
    if (accuracyViolation) violations.push(accuracyViolation);
    
    // Check score calculation
    const scoreViolation = validateScoreCalculation(
      record.score,
      record.accuracy,
      record.consistency,
      record.volumeScore,
      record.recencyScore,
      record.creatorId,
      dayStr
    );
    if (scoreViolation) violations.push(scoreViolation);
    
    // Check maturedN
    const maturedViolation = validateMaturedN(record.maturedN, record.creatorId, dayStr);
    if (maturedViolation) violations.push(maturedViolation);
    
    // Check retStd30d
    const retStdViolation = validateRetStd30d(record.retStd30d, record.creatorId, dayStr);
    if (retStdViolation) violations.push(retStdViolation);
    
    // Check notional30d
    const notionalViolation = validateNotional30d(record.notional30d, record.creatorId, dayStr);
    if (notionalViolation) violations.push(notionalViolation);
  }
  
  const errorCount = violations.filter(v => v.severity === 'error').length;
  const warningCount = violations.filter(v => v.severity === 'warning').length;
  
  return {
    ok: violations.length === 0,
    violations,
    summary: {
      totalRecords: records.length,
      violationCount: violations.length,
      errorCount,
      warningCount
    },
    checkedAt: new Date().toISOString()
  };
}

export async function GET(request: NextRequest) {
  try {
    // Check for HMAC signature
    const signature = request.headers.get('x-ops-signature');
    const opsSecret = process.env.OPS_SECRET;
    
    if (!opsSecret) {
      console.error('OPS_SECRET not configured');
      return NextResponse.json(
        { error: 'Operations secret not configured' },
        { status: 500 }
      );
    }
    
    if (!signature) {
      return NextResponse.json(
        { error: 'Missing x-ops-signature header' },
        { status: 401 }
      );
    }
    
    // Get request body for signature verification (empty for GET)
    const body = '';
    
    if (!verifyHMACSignature(body, signature, opsSecret)) {
      console.error('Invalid HMAC signature');
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 401 }
      );
    }
    
    // Parse query parameters
    const url = new URL(request.url);
    const daysParam = url.searchParams.get('days');
    const days = daysParam ? parseInt(daysParam, 10) : 7;
    
    if (days < 1 || days > 30) {
      return NextResponse.json(
        { error: 'days parameter must be between 1 and 30' },
        { status: 400 }
      );
    }
    
    // Run data quality checks
    const report = await runDataQualityChecks(days);
    
    console.log(`📊 Data quality check completed: ${report.summary.violationCount} violations found`);
    
    return NextResponse.json(report, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
  } catch (error) {
    console.error('Data quality check error:', error);
    
    return NextResponse.json(
      { 
        ok: false,
        error: `Data quality check failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        checkedAt: new Date().toISOString()
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// Health check endpoint
export async function HEAD(request: NextRequest) {
  try {
    return new NextResponse(null, { 
      status: 200,
      headers: {
        'Cache-Control': 'no-cache'
      }
    });
  } catch (error) {
    console.error('Creator DQ health check failed:', error);
    return new NextResponse(null, { status: 503 });
  }
}
