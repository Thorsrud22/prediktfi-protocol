/**
 * Enhanced Synthetic tests for Predikt Prediction-to-Action v1
 * Runs every 10 minutes to verify system health with comprehensive monitoring
 */

import { prisma } from '../app/lib/prisma';
import { isFeatureEnabled } from '../app/lib/flags';

interface SyntheticTestResult {
  test: string;
  status: 'pass' | 'fail';
  duration: number;
  error?: string;
  timestamp: Date;
  intentId?: string;
  pair?: string;
  reason?: string;
}

interface SyntheticMetrics {
  totalTests: number;
  passedTests: number;
  failedTests: number;
  totalDuration: number;
  averageLatency: number;
  p95Latency: number;
  consecutiveFailures: number;
  lastFailureTime?: Date;
}

class SyntheticTester {
  private results: SyntheticTestResult[] = [];
  private baseUrl: string;

  constructor() {
    this.baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  }

  // Helper to support timeouts with fetch using AbortController
  private async fetchWithTimeout(url: string, init: RequestInit, timeoutMs: number): Promise<Response> {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeoutMs);
    try {
      return await fetch(url, { ...init, signal: controller.signal });
    } finally {
      clearTimeout(id);
    }
  }

  async runAllTests(): Promise<SyntheticTestResult[]> {
    console.log('🧪 Starting enhanced synthetic tests for P2A v1...');
    
    // Check if features are enabled
    if (!isFeatureEnabled('ACTIONS')) {
      console.log('⚠️  ACTIONS feature disabled, skipping tests');
      return [];
    }

    const tests = [
      this.testDummyIntentCreation.bind(this),
      this.testIntentSimulation.bind(this),
      this.testIntentExecution.bind(this),
      this.testPublicAPI.bind(this),
      this.testEmbedFunctionality.bind(this),
      this.testHealthEndpoints.bind(this)
    ];

    for (const test of tests) {
      try {
        await test();
      } catch (error) {
        console.error(`❌ Test failed: ${test.name}`, error);
        this.results.push({
          test: test.name,
          status: 'fail',
          duration: 0,
          error: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date(),
          reason: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    console.log(`✅ Synthetic tests completed: ${this.results.length} tests`);
    return this.results;
  }

  private async testDummyIntentCreation(): Promise<void> {
    const start = Date.now();
    const pair = 'SOL/USDC';
    
    try {
      // Create a dummy test intent with realistic data
      const testIntent = await prisma.intent.create({
        data: {
          walletId: 'synthetic_test_wallet_' + Date.now(),
          chain: 'solana',
          base: 'SOL',
          quote: 'USDC',
          side: 'BUY',
          sizeJson: JSON.stringify({ type: 'pct', value: 0.1 }), // 0.1% of portfolio
          rationale: 'Synthetic test intent for monitoring',
          confidence: 0.6,
          expectedDur: '1d',
          guardsJson: JSON.stringify({
            dailyLossCapPct: 0.5,
            posLimitPct: 2,
            minLiqUsd: 50000,
            maxSlippageBps: 50,
            expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString() // 30 minutes
          }),
          venuePref: 'jupiter',
          simOnly: true
        }
      });

      this.results.push({
        test: 'testDummyIntentCreation',
        status: 'pass',
        duration: Date.now() - start,
        timestamp: new Date(),
        intentId: testIntent.id,
        pair: pair
      });

      console.log(`✅ Dummy intent creation test passed - IntentId: ${testIntent.id}, Pair: ${pair}`);
      
      // Store intent ID for cleanup
      (this as any).testIntentId = testIntent.id;
    } catch (error) {
      this.results.push({
        test: 'testDummyIntentCreation',
        status: 'fail',
        duration: Date.now() - start,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date(),
        pair: pair,
        reason: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  private async testIntentSimulation(): Promise<void> {
    const start = Date.now();
    const pair = 'SOL/USDC';
    
    try {
      // Use existing test intent or create new one
      let testIntentId = (this as any).testIntentId;
      
      if (!testIntentId) {
        const testIntent = await prisma.intent.create({
          data: {
            walletId: 'synthetic_test_wallet_' + Date.now(),
            chain: 'solana',
            base: 'SOL',
            quote: 'USDC',
            side: 'BUY',
            sizeJson: JSON.stringify({ type: 'pct', value: 0.1 }),
            rationale: 'Synthetic simulation test',
            confidence: 0.6,
            expectedDur: '1d',
            guardsJson: JSON.stringify({
              dailyLossCapPct: 0.5,
              posLimitPct: 2,
              minLiqUsd: 50000,
              maxSlippageBps: 50,
              expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString()
            }),
            venuePref: 'jupiter',
            simOnly: true
          }
        });
        testIntentId = testIntent.id;
      }

      // Test simulation API call with proper error handling
      const response = await this.fetchWithTimeout(`${this.baseUrl}/api/intents/simulate`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'User-Agent': 'SyntheticTester/1.0'
        },
        body: JSON.stringify({ intentId: testIntentId })
      }, 10000);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Simulation API returned ${response.status}: ${errorText}`);
      }

      const simulationResult = await response.json();
      
      // Verify simulation response structure
      if (!simulationResult.success && simulationResult.error) {
        throw new Error(`Simulation failed: ${simulationResult.error}`);
      }

      this.results.push({
        test: 'testIntentSimulation',
        status: 'pass',
        duration: Date.now() - start,
        timestamp: new Date(),
        intentId: testIntentId,
        pair: pair
      });

      console.log(`✅ Intent simulation test passed - IntentId: ${testIntentId}, Pair: ${pair}, Duration: ${Date.now() - start}ms`);
    } catch (error) {
      this.results.push({
        test: 'testIntentSimulation',
        status: 'fail',
        duration: Date.now() - start,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date(),
        pair: pair,
        reason: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  private async testIntentExecution(): Promise<void> {
    const start = Date.now();
    const pair = 'SOL/USDC';
    
    try {
      // Use existing test intent or create new one
      let testIntentId = (this as any).testIntentId;
      
      if (!testIntentId) {
        const testIntent = await prisma.intent.create({
          data: {
            walletId: 'synthetic_test_wallet_' + Date.now(),
            chain: 'solana',
            base: 'SOL',
            quote: 'USDC',
            side: 'BUY',
            sizeJson: JSON.stringify({ type: 'pct', value: 0.1 }),
            rationale: 'Synthetic execution test',
            confidence: 0.6,
            expectedDur: '1d',
            guardsJson: JSON.stringify({
              dailyLossCapPct: 0.5,
              posLimitPct: 2,
              minLiqUsd: 50000,
              maxSlippageBps: 50,
              expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString()
            }),
            venuePref: 'jupiter',
            simOnly: true
          }
        });
        testIntentId = testIntent.id;
      }

      // Test execution API call (simulation only)
      const response = await this.fetchWithTimeout(`${this.baseUrl}/api/intents/execute`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'User-Agent': 'SyntheticTester/1.0'
        },
        body: JSON.stringify({ 
          intentId: testIntentId,
          simulate: true // Force simulation mode
        })
      }, 15000);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Execution API returned ${response.status}: ${errorText}`);
      }

      const executionResult = await response.json();
      
      // Verify execution response structure
      if (!executionResult.success && executionResult.error) {
        throw new Error(`Execution failed: ${executionResult.error}`);
      }

      this.results.push({
        test: 'testIntentExecution',
        status: 'pass',
        duration: Date.now() - start,
        timestamp: new Date(),
        intentId: testIntentId,
        pair: pair
      });

      console.log(`✅ Intent execution test passed - IntentId: ${testIntentId}, Pair: ${pair}, Duration: ${Date.now() - start}ms`);
    } catch (error) {
      this.results.push({
        test: 'testIntentExecution',
        status: 'fail',
        duration: Date.now() - start,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date(),
        pair: pair,
        reason: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  private async testPublicAPI(): Promise<void> {
    const start = Date.now();
    const pair = 'SOL/USDC';
    
    try {
      // Use existing test intent or create new one
      let testIntentId = (this as any).testIntentId;
      
      if (!testIntentId) {
        const testIntent = await prisma.intent.create({
          data: {
            walletId: 'synthetic_test_wallet_' + Date.now(),
            chain: 'solana',
            base: 'SOL',
            quote: 'USDC',
            side: 'BUY',
            sizeJson: JSON.stringify({ type: 'pct', value: 0.1 }),
            rationale: 'Synthetic public API test',
            confidence: 0.6,
            expectedDur: '1d',
            guardsJson: JSON.stringify({
              dailyLossCapPct: 0.5,
              posLimitPct: 2,
              minLiqUsd: 50000,
              maxSlippageBps: 50,
              expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString()
            }),
            venuePref: 'jupiter',
            simOnly: true
          }
        });
        testIntentId = testIntent.id;
      }

      // Test public API
      const response = await this.fetchWithTimeout(`${this.baseUrl}/api/public/intents/${testIntentId}`, {
        headers: { 'User-Agent': 'SyntheticTester/1.0' }
      }, 5000);
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Public API returned ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      if (!data.id || data.id !== testIntentId) {
        throw new Error('Public API returned invalid data');
      }

      this.results.push({
        test: 'testPublicAPI',
        status: 'pass',
        duration: Date.now() - start,
        timestamp: new Date(),
        intentId: testIntentId,
        pair: pair
      });

      console.log(`✅ Public API test passed - IntentId: ${testIntentId}, Pair: ${pair}, Duration: ${Date.now() - start}ms`);
    } catch (error) {
      this.results.push({
        test: 'testPublicAPI',
        status: 'fail',
        duration: Date.now() - start,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date(),
        pair: pair,
        reason: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  private async testEmbedFunctionality(): Promise<void> {
    const start = Date.now();
    const pair = 'SOL/USDC';
    
    try {
      // Use existing test intent or create new one
      let testIntentId = (this as any).testIntentId;
      
      if (!testIntentId) {
        const testIntent = await prisma.intent.create({
          data: {
            walletId: 'synthetic_test_wallet_' + Date.now(),
            chain: 'solana',
            base: 'SOL',
            quote: 'USDC',
            side: 'BUY',
            sizeJson: JSON.stringify({ type: 'pct', value: 0.1 }),
            rationale: 'Synthetic embed test',
            confidence: 0.6,
            expectedDur: '1d',
            guardsJson: JSON.stringify({
              dailyLossCapPct: 0.5,
              posLimitPct: 2,
              minLiqUsd: 50000,
              maxSlippageBps: 50,
              expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString()
            }),
            venuePref: 'jupiter',
            simOnly: true
          }
        });
        testIntentId = testIntent.id;
      }

      // Test embed page
      const response = await this.fetchWithTimeout(`${this.baseUrl}/embed/intent/${testIntentId}`, {
        headers: { 'User-Agent': 'SyntheticTester/1.0' }
      }, 10000);
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Embed page returned ${response.status}: ${errorText}`);
      }

      const html = await response.text();
      if (!html.includes('Predikt Trade') && !html.includes('Trade')) {
        throw new Error('Embed page missing expected content');
      }

      this.results.push({
        test: 'testEmbedFunctionality',
        status: 'pass',
        duration: Date.now() - start,
        timestamp: new Date(),
        intentId: testIntentId,
        pair: pair
      });

      console.log(`✅ Embed functionality test passed - IntentId: ${testIntentId}, Pair: ${pair}, Duration: ${Date.now() - start}ms`);
    } catch (error) {
      this.results.push({
        test: 'testEmbedFunctionality',
        status: 'fail',
        duration: Date.now() - start,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date(),
        pair: pair,
        reason: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  private async testHealthEndpoints(): Promise<void> {
    const start = Date.now();
    
    try {
      // Test P2A health endpoint
      const p2aResponse = await this.fetchWithTimeout(`${this.baseUrl}/api/health/p2a`, {
        headers: { 'User-Agent': 'SyntheticTester/1.0' }
      }, 5000);
      
      if (!p2aResponse.ok) {
        throw new Error(`P2A health endpoint returned ${p2aResponse.status}`);
      }

      // Test alerts health endpoint
      const alertsResponse = await this.fetchWithTimeout(`${this.baseUrl}/api/health/alerts`, {
        headers: { 'User-Agent': 'SyntheticTester/1.0' }
      }, 5000);
      
      if (!alertsResponse.ok) {
        throw new Error(`Alerts health endpoint returned ${alertsResponse.status}`);
      }

      // Test actions page
      const actionsResponse = await this.fetchWithTimeout(`${this.baseUrl}/advisor/actions`, {
        headers: { 'User-Agent': 'SyntheticTester/1.0' }
      }, 10000);
      
      if (!actionsResponse.ok) {
        throw new Error(`Actions page returned ${actionsResponse.status}`);
      }

      this.results.push({
        test: 'testHealthEndpoints',
        status: 'pass',
        duration: Date.now() - start,
        timestamp: new Date()
      });

      console.log(`✅ Health endpoints test passed - Duration: ${Date.now() - start}ms`);
    } catch (error) {
      this.results.push({
        test: 'testHealthEndpoints',
        status: 'fail',
        duration: Date.now() - start,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date(),
        reason: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  async reportResults(): Promise<void> {
    const passed = this.results.filter(r => r.status === 'pass').length;
    const failed = this.results.filter(r => r.status === 'fail').length;
    const totalDuration = this.results.reduce((sum, r) => sum + r.duration, 0);
    const averageLatency = this.results.length > 0 ? totalDuration / this.results.length : 0;
    
    // Calculate P95 latency
    const latencies = this.results.map(r => r.duration).sort((a, b) => a - b);
    const p95Index = Math.ceil(latencies.length * 0.95) - 1;
    const p95Latency = latencies[p95Index] || 0;

    // Calculate consecutive failures
    const consecutiveFailures = this.calculateConsecutiveFailures();
    const lastFailureTime = this.getLastFailureTime();

    const metrics: SyntheticMetrics = {
      totalTests: this.results.length,
      passedTests: passed,
      failedTests: failed,
      totalDuration,
      averageLatency,
      p95Latency,
      consecutiveFailures,
      lastFailureTime
    };

    console.log('\n📊 Enhanced Synthetic Test Results:');
    console.log(`✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`⏱️  Total Duration: ${totalDuration}ms`);
    console.log(`📈 Average Latency: ${averageLatency.toFixed(2)}ms`);
    console.log(`📊 P95 Latency: ${p95Latency}ms`);
    console.log(`🔄 Consecutive Failures: ${consecutiveFailures}`);

    if (failed > 0) {
      console.log('\n❌ Failed Tests:');
      this.results
        .filter(r => r.status === 'fail')
        .forEach(r => {
          console.log(`  - ${r.test}: ${r.error}`);
          if (r.intentId) console.log(`    IntentId: ${r.intentId}`);
          if (r.pair) console.log(`    Pair: ${r.pair}`);
          if (r.reason) console.log(`    Reason: ${r.reason}`);
        });
    }

    // Check for alert conditions
    await this.checkAlertConditions(metrics);

    // Store results in database for monitoring
    try {
      await prisma.intentReceipt.create({
        data: {
          intentId: 'synthetic_test_' + Date.now(),
          status: failed === 0 ? 'simulated' : 'failed',
          simJson: JSON.stringify({
            test: 'synthetic_tests',
            metrics: metrics,
            results: this.results,
            timestamp: new Date().toISOString()
          }),
          notes: `Synthetic tests: ${passed} passed, ${failed} failed, P95: ${p95Latency}ms`
        }
      });
    } catch (error) {
      console.error('Failed to store synthetic test results:', error);
    }

    // Cleanup test intents
    await this.cleanupTestIntents();
  }

  private calculateConsecutiveFailures(): number {
    let consecutive = 0;
    for (let i = this.results.length - 1; i >= 0; i--) {
      if (this.results[i].status === 'fail') {
        consecutive++;
      } else {
        break;
      }
    }
    return consecutive;
  }

  private getLastFailureTime(): Date | undefined {
    const lastFailure = this.results
      .filter(r => r.status === 'fail')
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())[0];
    return lastFailure?.timestamp;
  }

  private async checkAlertConditions(metrics: SyntheticMetrics): Promise<void> {
    const alerts: string[] = [];

    // P95 latency > 1.5s
    if (metrics.p95Latency > 1500) {
      alerts.push(`P95 latency ${metrics.p95Latency}ms exceeds 1.5s threshold`);
    }

    // Consecutive failures >= 2
    if (metrics.consecutiveFailures >= 2) {
      alerts.push(`${metrics.consecutiveFailures} consecutive synthetic test failures`);
    }

    // High failure rate
    const failureRate = (metrics.failedTests / metrics.totalTests) * 100;
    if (failureRate > 50) {
      alerts.push(`High failure rate: ${failureRate.toFixed(1)}%`);
    }

    if (alerts.length > 0) {
      console.log('\n🚨 Alert Conditions Detected:');
      alerts.forEach(alert => console.log(`  - ${alert}`));
      
      // In a real implementation, this would trigger alerts
      await this.triggerAlerts(alerts, metrics);
    }
  }

  private async triggerAlerts(alerts: string[], metrics: SyntheticMetrics): Promise<void> {
    // This would integrate with Slack/Webhook system
    console.log('📢 Alert triggers would be sent here:', alerts);
    
    // Store alert in database for tracking
    try {
      await prisma.intentReceipt.create({
        data: {
          intentId: 'synthetic_alert_' + Date.now(),
          status: 'failed',
          simJson: JSON.stringify({
            type: 'synthetic_alert',
            alerts: alerts,
            metrics: metrics,
            timestamp: new Date().toISOString()
          }),
          notes: `Synthetic alerts: ${alerts.join(', ')}`
        }
      });
    } catch (error) {
      console.error('Failed to store synthetic alert:', error);
    }
  }

  private async cleanupTestIntents(): Promise<void> {
    try {
      const testIntentId = (this as any).testIntentId;
      if (testIntentId) {
        // Clean up the test intent
        await prisma.intent.delete({
          where: { id: testIntentId }
        });
        console.log(`🧹 Cleaned up test intent: ${testIntentId}`);
      }

      // Clean up any other synthetic test intents older than 1 hour
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
      const deletedCount = await prisma.intent.deleteMany({
        where: {
          walletId: {
            startsWith: 'synthetic_test_wallet_'
          },
          createdAt: {
            lt: oneHourAgo
          }
        }
      });

      if (deletedCount.count > 0) {
        console.log(`🧹 Cleaned up ${deletedCount.count} old synthetic test intents`);
      }
    } catch (error) {
      console.error('Failed to cleanup test intents:', error);
    }
  }
}

// Run tests if called directly
if (require.main === module) {
  const tester = new SyntheticTester();
  
  tester.runAllTests()
    .then(() => tester.reportResults())
    .then(() => {
      console.log('🎉 Synthetic tests completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Synthetic tests failed:', error);
      process.exit(1);
    });
}

export default SyntheticTester;
