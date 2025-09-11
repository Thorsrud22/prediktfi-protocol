/**
 * Unit tests for CreatorDaily data quality sentinel
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { PrismaClient } from '@prisma/client';

// Mock Prisma client
const mockPrisma = {
  creatorDaily: {
    findMany: vi.fn(),
    upsert: vi.fn(),
    count: vi.fn()
  },
  $disconnect: vi.fn()
} as any;

// Mock the Prisma client
vi.mock('@prisma/client', () => ({
  PrismaClient: vi.fn(() => mockPrisma)
}));

// Import the validation functions (we'll need to extract them to a separate module)
// For now, we'll test the logic inline

describe('CreatorDaily Data Quality Sentinel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Component Range Validation', () => {
    it('should pass for valid component values in [0,1]', () => {
      const validValues = [0, 0.5, 1, 0.25, 0.75];
      
      for (const value of validValues) {
        const result = validateComponentRange(value, 'accuracy', 'creator123', '2024-01-15');
        expect(result).toBeNull();
      }
    });

    it('should fail for values outside [0,1] range', () => {
      const invalidValues = [-0.1, 1.1, -1, 2, 0.5];
      
      for (const value of invalidValues) {
        if (value < 0 || value > 1) {
          const result = validateComponentRange(value, 'accuracy', 'creator123', '2024-01-15');
          expect(result).not.toBeNull();
          expect(result?.severity).toBe('error');
          expect(result?.field).toBe('accuracy');
          expect(result?.value).toBe(value);
        }
      }
    });
  });

  describe('Accuracy Calculation Validation', () => {
    it('should pass for correct accuracy calculation', () => {
      const testCases = [
        { brierMean: 0.2, expectedAccuracy: 0.8 },
        { brierMean: 0.5, expectedAccuracy: 0.5 },
        { brierMean: 0.0, expectedAccuracy: 1.0 },
        { brierMean: 1.0, expectedAccuracy: 0.0 }
      ];

      for (const testCase of testCases) {
        const result = validateAccuracyCalculation(
          testCase.expectedAccuracy,
          testCase.brierMean,
          'creator123',
          '2024-01-15'
        );
        expect(result).toBeNull();
      }
    });

    it('should fail for incorrect accuracy calculation', () => {
      const result = validateAccuracyCalculation(
        0.7, // incorrect accuracy
        0.2, // brierMean
        'creator123',
        '2024-01-15'
      );
      
      expect(result).not.toBeNull();
      expect(result?.severity).toBe('error');
      expect(result?.field).toBe('accuracy');
      expect(result?.value).toBe(0.7);
      expect(result?.expected).toBe(0.8);
    });

    it('should handle edge cases with tolerance', () => {
      const result = validateAccuracyCalculation(
        0.8000001, // slightly off due to floating point
        0.2,
        'creator123',
        '2024-01-15'
      );
      
      // Should pass due to tolerance
      expect(result).toBeNull();
    });
  });

  describe('Score Calculation Validation', () => {
    it('should pass for correct score calculation', () => {
      const accuracy = 0.8;
      const consistency = 0.7;
      const volumeScore = 0.6;
      const recencyScore = 0.9;
      
      const expectedScore = 
        0.4 * accuracy +    // W_ACC = 0.4
        0.3 * consistency + // W_CONS = 0.3
        0.2 * volumeScore + // W_VOL = 0.2
        0.1 * recencyScore; // W_REC = 0.1
      
      const result = validateScoreCalculation(
        expectedScore,
        accuracy,
        consistency,
        volumeScore,
        recencyScore,
        'creator123',
        '2024-01-15'
      );
      
      expect(result).toBeNull();
    });

    it('should fail for incorrect score calculation', () => {
      const accuracy = 0.8;
      const consistency = 0.7;
      const volumeScore = 0.6;
      const recencyScore = 0.9;
      
      const correctScore = 
        0.4 * accuracy + 0.3 * consistency + 0.2 * volumeScore + 0.1 * recencyScore;
      
      const result = validateScoreCalculation(
        correctScore + 0.1, // incorrect score
        accuracy,
        consistency,
        volumeScore,
        recencyScore,
        'creator123',
        '2024-01-15'
      );
      
      expect(result).not.toBeNull();
      expect(result?.severity).toBe('error');
      expect(result?.field).toBe('score');
    });
  });

  describe('MaturedN Validation', () => {
    it('should pass for non-negative maturedN', () => {
      const validValues = [0, 1, 10, 100];
      
      for (const value of validValues) {
        const result = validateMaturedN(value, 'creator123', '2024-01-15');
        expect(result).toBeNull();
      }
    });

    it('should fail for negative maturedN', () => {
      const result = validateMaturedN(-1, 'creator123', '2024-01-15');
      
      expect(result).not.toBeNull();
      expect(result?.severity).toBe('error');
      expect(result?.field).toBe('maturedN');
      expect(result?.value).toBe(-1);
    });
  });

  describe('RetStd30d Validation', () => {
    it('should pass for null retStd30d', () => {
      const result = validateRetStd30d(null, 'creator123', '2024-01-15');
      expect(result).toBeNull();
    });

    it('should pass for non-negative retStd30d', () => {
      const validValues = [0, 0.1, 0.5, 1.0];
      
      for (const value of validValues) {
        const result = validateRetStd30d(value, 'creator123', '2024-01-15');
        expect(result).toBeNull();
      }
    });

    it('should fail for negative retStd30d', () => {
      const result = validateRetStd30d(-0.1, 'creator123', '2024-01-15');
      
      expect(result).not.toBeNull();
      expect(result?.severity).toBe('error');
      expect(result?.field).toBe('retStd30d');
      expect(result?.value).toBe(-0.1);
    });
  });

  describe('Notional30d Validation', () => {
    it('should pass for non-negative notional30d', () => {
      const validValues = [0, 100, 1000, 10000];
      
      for (const value of validValues) {
        const result = validateNotional30d(value, 'creator123', '2024-01-15');
        expect(result).toBeNull();
      }
    });

    it('should fail for negative notional30d', () => {
      const result = validateNotional30d(-100, 'creator123', '2024-01-15');
      
      expect(result).not.toBeNull();
      expect(result?.severity).toBe('error');
      expect(result?.field).toBe('notional30d');
      expect(result?.value).toBe(-100);
    });
  });

  describe('Data Quality Report Generation', () => {
    it('should generate correct report for clean data', async () => {
      // Mock clean data
      mockPrisma.creatorDaily.findMany.mockResolvedValue([
        {
          creatorId: 'creator1',
          day: new Date('2024-01-15'),
          maturedN: 5,
          brierMean: 0.2,
          retStd30d: 0.1,
          notional30d: 1000,
          accuracy: 0.8,
          consistency: 0.7,
          volumeScore: 0.6,
          recencyScore: 0.9,
          score: 0.4 * 0.8 + 0.3 * 0.7 + 0.2 * 0.6 + 0.1 * 0.9
        }
      ]);

      const report = await runDataQualityChecks(7);
      
      expect(report.ok).toBe(true);
      expect(report.violations).toHaveLength(0);
      expect(report.summary.totalRecords).toBe(1);
      expect(report.summary.violationCount).toBe(0);
    });

    it('should detect violations in dirty data', async () => {
      // Mock data with violations
      mockPrisma.creatorDaily.findMany.mockResolvedValue([
        {
          creatorId: 'creator1',
          day: new Date('2024-01-15'),
          maturedN: -1, // violation
          brierMean: 0.2,
          retStd30d: -0.1, // violation
          notional30d: -100, // violation
          accuracy: 1.5, // violation
          consistency: 0.7,
          volumeScore: 0.6,
          recencyScore: 0.9,
          score: 0.4 * 0.8 + 0.3 * 0.7 + 0.2 * 0.6 + 0.1 * 0.9 // correct calculation
        }
      ]);

      const report = await runDataQualityChecks(7);
      
      expect(report.ok).toBe(false);
      expect(report.violations.length).toBeGreaterThan(0);
      expect(report.summary.violationCount).toBeGreaterThan(0);
    });
  });
});

// Helper functions (these would be extracted to a separate module in production)
function validateComponentRange(
  value: number, 
  field: string, 
  creatorId: string, 
  day: string
): any {
  if (value < 0 || value > 1) {
    return {
      creatorId,
      creatorIdHashed: hashCreatorId(creatorId),
      field,
      value,
      expected: '[0,1]',
      day,
      severity: 'error' as const,
      message: `${field} must be in range [0,1], got ${value}`
    };
  }
  return null;
}

function validateAccuracyCalculation(
  accuracy: number,
  brierMean: number,
  creatorId: string,
  day: string
): any {
  const expectedAccuracy = Math.max(0, Math.min(1, 1 - brierMean));
  
  if (!isWithinTolerance(accuracy, expectedAccuracy)) {
    return {
      creatorId,
      creatorIdHashed: hashCreatorId(creatorId),
      field: 'accuracy',
      value: accuracy,
      expected: expectedAccuracy,
      day,
      severity: 'error' as const,
      message: `accuracy (${accuracy}) should equal 1 - brierMean (${expectedAccuracy})`
    };
  }
  return null;
}

function validateScoreCalculation(
  score: number,
  accuracy: number,
  consistency: number,
  volumeScore: number,
  recencyScore: number,
  creatorId: string,
  day: string
): any {
  const expectedScore = 
    0.4 * accuracy + 0.3 * consistency + 0.2 * volumeScore + 0.1 * recencyScore;
  
  if (!isWithinTolerance(score, expectedScore)) {
    return {
      creatorId,
      creatorIdHashed: hashCreatorId(creatorId),
      field: 'score',
      value: score,
      expected: expectedScore,
      day,
      severity: 'error' as const,
      message: `score (${score}) should equal weighted sum of components (${expectedScore})`
    };
  }
  return null;
}

function validateMaturedN(
  maturedN: number,
  creatorId: string,
  day: string
): any {
  if (maturedN < 0) {
    return {
      creatorId,
      creatorIdHashed: hashCreatorId(creatorId),
      field: 'maturedN',
      value: maturedN,
      expected: '>= 0',
      day,
      severity: 'error' as const,
      message: `maturedN must be non-negative, got ${maturedN}`
    };
  }
  return null;
}

function validateRetStd30d(
  retStd30d: number | null,
  creatorId: string,
  day: string
): any {
  if (retStd30d !== null && retStd30d < 0) {
    return {
      creatorId,
      creatorIdHashed: hashCreatorId(creatorId),
      field: 'retStd30d',
      value: retStd30d,
      expected: '>= 0 or null',
      day,
      severity: 'error' as const,
      message: `retStd30d must be non-negative or null, got ${retStd30d}`
    };
  }
  return null;
}

function validateNotional30d(
  notional30d: number,
  creatorId: string,
  day: string
): any {
  if (notional30d < 0) {
    return {
      creatorId,
      creatorIdHashed: hashCreatorId(creatorId),
      field: 'notional30d',
      value: notional30d,
      expected: '>= 0',
      day,
      severity: 'error' as const,
      message: `notional30d must be non-negative, got ${notional30d}`
    };
  }
  return null;
}

function isWithinTolerance(actual: number, expected: number, tolerance: number = 1e-6): boolean {
  return Math.abs(actual - expected) <= tolerance;
}

function hashCreatorId(creatorId: string): string {
  const crypto = require('crypto');
  return crypto.createHash('sha256').update(creatorId).digest('hex').substring(0, 8);
}

async function runDataQualityChecks(days: number = 7): Promise<any> {
  const violations: any[] = [];
  
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);
  
  const records = await mockPrisma.creatorDaily.findMany({
    where: {
      day: {
        gte: cutoffDate
      }
    },
    orderBy: {
      day: 'desc'
    }
  });
  
  for (const record of records) {
    const dayStr = record.day.toISOString().split('T')[0];
    
    // Check component ranges [0,1]
    const componentViolations = [
      validateComponentRange(record.accuracy, 'accuracy', record.creatorId, dayStr),
      validateComponentRange(record.consistency, 'consistency', record.creatorId, dayStr),
      validateComponentRange(record.volumeScore, 'volumeScore', record.creatorId, dayStr),
      validateComponentRange(record.recencyScore, 'recencyScore', record.creatorId, dayStr)
    ].filter(Boolean);
    
    violations.push(...componentViolations);
    
    // Check other validations
    const otherViolations = [
      validateAccuracyCalculation(record.accuracy, record.brierMean, record.creatorId, dayStr),
      validateScoreCalculation(record.score, record.accuracy, record.consistency, record.volumeScore, record.recencyScore, record.creatorId, dayStr),
      validateMaturedN(record.maturedN, record.creatorId, dayStr),
      validateRetStd30d(record.retStd30d, record.creatorId, dayStr),
      validateNotional30d(record.notional30d, record.creatorId, dayStr)
    ].filter(Boolean);
    
    violations.push(...otherViolations);
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
