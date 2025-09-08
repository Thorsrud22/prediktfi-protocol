import 'server-only';

export interface ChaosTest {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  startTime?: Date;
  endTime?: Date;
  config: any;
}

export interface ChaosTestResult {
  testId: string;
  success: boolean;
  message: string;
  timestamp: Date;
  details?: any;
}

// In-memory chaos test state (in production, this would be in Redis)
const chaosTests = new Map<string, ChaosTest>();
const testResults = new Map<string, ChaosTestResult[]>();

/**
 * Register a chaos test
 */
export function registerChaosTest(test: Omit<ChaosTest, 'enabled'>): void {
  chaosTests.set(test.id, {
    ...test,
    enabled: false,
  });
}

/**
 * Enable a chaos test
 */
export function enableChaosTest(testId: string, config?: any): boolean {
  const test = chaosTests.get(testId);
  if (!test) {
    console.error(`Chaos test ${testId} not found`);
    return false;
  }

  test.enabled = true;
  test.startTime = new Date();
  test.config = config || test.config;

  console.log(`🧪 Chaos test enabled: ${test.name}`);
  return true;
}

/**
 * Disable a chaos test
 */
export function disableChaosTest(testId: string): boolean {
  const test = chaosTests.get(testId);
  if (!test) {
    console.error(`Chaos test ${testId} not found`);
    return false;
  }

  test.enabled = false;
  test.endTime = new Date();

  console.log(`🧪 Chaos test disabled: ${test.name}`);
  return true;
}

/**
 * Check if a chaos test is active
 */
export function isChaosTestActive(testId: string): boolean {
  const test = chaosTests.get(testId);
  return test?.enabled || false;
}

/**
 * Get all active chaos tests
 */
export function getActiveChaosTests(): ChaosTest[] {
  return Array.from(chaosTests.values()).filter(test => test.enabled);
}

/**
 * Record a chaos test result
 */
export function recordChaosTestResult(result: ChaosTestResult): void {
  const results = testResults.get(result.testId) || [];
  results.push(result);
  testResults.set(result.testId, results);
}

/**
 * Get chaos test results
 */
export function getChaosTestResults(testId: string): ChaosTestResult[] {
  return testResults.get(testId) || [];
}

/**
 * Check if aggregator should be disabled (chaos test)
 */
export function shouldDisableAggregator(): boolean {
  return isChaosTestActive('disable_aggregator');
}

/**
 * Check if simulation should be forced (chaos test)
 */
export function shouldForceSimulationOnly(): boolean {
  return isChaosTestActive('force_simulation_only');
}

/**
 * Check if idempotency should be tested (chaos test)
 */
export function shouldTestIdempotency(): boolean {
  return isChaosTestActive('test_idempotency');
}

// Register default chaos tests
registerChaosTest({
  id: 'disable_aggregator',
  name: 'Disable Aggregator',
  description: 'Disable Jupiter aggregator to test fallback behavior',
  config: {
    duration: 300000, // 5 minutes
    fallbackMessage: 'Aggregator temporarily disabled for testing',
  },
});

registerChaosTest({
  id: 'force_simulation_only',
  name: 'Force Simulation Only',
  description: 'Force all intents to simulation-only mode',
  config: {
    duration: 600000, // 10 minutes
    message: 'System in simulation-only mode for testing',
  },
});

registerChaosTest({
  id: 'test_idempotency',
  name: 'Test Idempotency',
  description: 'Test idempotency by allowing duplicate requests',
  config: {
    duration: 180000, // 3 minutes
    allowDuplicates: true,
  },
});

/**
 * Run chaos test cleanup (disable expired tests)
 */
export function cleanupExpiredChaosTests(): void {
  const now = new Date();
  
  for (const [testId, test] of chaosTests.entries()) {
    if (test.enabled && test.startTime && test.config?.duration) {
      const elapsed = now.getTime() - test.startTime.getTime();
      if (elapsed >= test.config.duration) {
        disableChaosTest(testId);
        
        recordChaosTestResult({
          testId,
          success: true,
          message: `Test completed after ${test.config.duration}ms`,
          timestamp: now,
        });
      }
    }
  }
}

// Run cleanup every minute
setInterval(cleanupExpiredChaosTests, 60000);
