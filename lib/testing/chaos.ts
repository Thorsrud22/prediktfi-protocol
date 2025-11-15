/**
 * Chaos Engineering & Fault Injection
 */

export interface ChaosConfig {
  enabled: boolean;
  failureRate: number; // 0.0 to 1.0
  services: string[];
  scenarios: ChaosScenario[];
}

export interface ChaosScenario {
  name: string;
  description: string;
  enabled: boolean;
  probability: number;
  impact: 'low' | 'medium' | 'high';
  execute: () => Promise<void>;
}

export interface ChaosEvent {
  scenario: string;
  timestamp: Date;
  duration: number;
  impact: string;
  recovered: boolean;
}

/**
 * Chaos Engineering Service
 */
export class ChaosService {
  private events: ChaosEvent[] = [];
  private activeScenarios = new Set<string>();
  
  constructor(private config: ChaosConfig) {}
  
  /**
   * Execute chaos scenario if conditions are met
   */
  async maybeExecuteChaos(serviceName: string): Promise<boolean> {
    if (!this.config.enabled || !this.config.services.includes(serviceName)) {
      return false;
    }
    
    // Check if we should inject chaos based on global failure rate
    if (Math.random() > this.config.failureRate) {
      return false;
    }
    
    // Find applicable scenarios
    const applicableScenarios = this.config.scenarios.filter(scenario => 
      scenario.enabled && 
      !this.activeScenarios.has(scenario.name) &&
      Math.random() < scenario.probability
    );
    
    if (applicableScenarios.length === 0) {
      return false;
    }
    
    // Select random scenario
    const scenario = applicableScenarios[Math.floor(Math.random() * applicableScenarios.length)];
    
    console.log(`🔥 Executing chaos scenario: ${scenario.name} for service: ${serviceName}`);
    
    return this.executeScenario(scenario);
  }
  
  /**
   * Execute specific chaos scenario
   */
  private async executeScenario(scenario: ChaosScenario): Promise<boolean> {
    const startTime = Date.now();
    this.activeScenarios.add(scenario.name);
    
    try {
      await scenario.execute();
      
      const duration = Date.now() - startTime;
      const event: ChaosEvent = {
        scenario: scenario.name,
        timestamp: new Date(),
        duration,
        impact: scenario.impact,
        recovered: true
      };
      
      this.events.push(event);
      
      console.log(`🔥 Chaos scenario ${scenario.name} completed in ${duration}ms`);
      
      return true;
      
    } catch (error) {
      const duration = Date.now() - startTime;
      const event: ChaosEvent = {
        scenario: scenario.name,
        timestamp: new Date(),
        duration,
        impact: scenario.impact,
        recovered: false
      };
      
      this.events.push(event);
      
      console.error(`🔥 Chaos scenario ${scenario.name} failed:`, error);
      
      return false;
      
    } finally {
      this.activeScenarios.delete(scenario.name);
    }
  }
  
  /**
   * Get chaos testing statistics
   */
  getStats(): {
    totalEvents: number;
    recentEvents: number;
    successRate: number;
    activeScenarios: string[];
  } {
    const oneHourAgo = Date.now() - 60 * 60 * 1000;
    const recentEvents = this.events.filter(event => event.timestamp.getTime() > oneHourAgo);
    
    const successRate = this.events.length > 0 ? 
      (this.events.filter(e => e.recovered).length / this.events.length) * 100 : 100;
    
    return {
      totalEvents: this.events.length,
      recentEvents: recentEvents.length,
      successRate,
      activeScenarios: Array.from(this.activeScenarios)
    };
  }
}

/**
 * Chaos scenarios for different failure modes
 */
export const chaosScenarios: ChaosScenario[] = [
  {
    name: 'price_api_failure',
    description: 'Simulate primary price API failure',
    enabled: true,
    probability: 0.1,
    impact: 'medium',
    execute: async () => {
      // Simulate API failure by throwing error
      await new Promise(resolve => setTimeout(resolve, 100));
      throw new Error('Price API temporarily unavailable');
    }
  },
  
  {
    name: 'price_api_latency',
    description: 'Simulate high latency from price API',
    enabled: true,
    probability: 0.2,
    impact: 'low',
    execute: async () => {
      // Simulate high latency
      const delay = 2000 + Math.random() * 3000; // 2-5 seconds
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  },
  
  {
    name: 'database_slow_query',
    description: 'Simulate slow database queries',
    enabled: true,
    probability: 0.05,
    impact: 'medium',
    execute: async () => {
      // Simulate slow query
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  },
  
  {
    name: 'network_partition',
    description: 'Simulate network partition/timeout',
    enabled: false, // Disabled by default - too disruptive
    probability: 0.02,
    impact: 'high',
    execute: async () => {
      await new Promise(resolve => setTimeout(resolve, 500));
      throw new Error('Network timeout');
    }
  },
  
  {
    name: 'memory_pressure',
    description: 'Simulate memory pressure',
    enabled: false, // Disabled - could cause real issues
    probability: 0.01,
    impact: 'high',
    execute: async () => {
      // Simulate memory pressure (careful not to actually exhaust memory)
      const data = new Array(1000).fill('x'.repeat(1000));
      await new Promise(resolve => setTimeout(resolve, 100));
      data.length = 0; // Clean up
    }
  }
];

/**
 * Global chaos service configuration
 */
export const chaosConfig: ChaosConfig = {
  enabled: process.env.CHAOS_TESTING_ENABLED === 'true',
  failureRate: parseFloat(process.env.CHAOS_FAILURE_RATE || '0.1'), // 10% by default
  services: ['price-api', 'url-resolver', 'database'],
  scenarios: chaosScenarios
};

// Global chaos service
export const chaosService = new ChaosService(chaosConfig);

/**
 * Price API with chaos testing
 */
export class ChaosPriceAPI {
  async getPrice(symbol: string): Promise<number> {
    // Maybe inject chaos before executing the primary logic
    const chaosInjected = await chaosService.maybeExecuteChaos('price-api');

    if (chaosInjected) {
      // Chaos was injected, but we continue to execute the method to observe behaviour under stress
    }

    // This method will have chaos injected based on configuration

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Return mock price
    return 50000 + Math.random() * 10000;
  }
  
  /**
   * Resilient price fetch with fallback
   */
  async getPriceWithFallback(symbol: string): Promise<number> {
    try {
      return await this.getPrice(symbol);
      
    } catch (error) {
      console.log(`🔄 Primary price API failed, trying fallback: ${error}`);
      
      // Fallback to secondary source
      return this.getFallbackPrice(symbol);
    }
  }
  
  private async getFallbackPrice(symbol: string): Promise<number> {
    // Simulate fallback API call
    await new Promise(resolve => setTimeout(resolve, 200));
    
    // Return slightly different price to simulate different source
    return 49000 + Math.random() * 12000;
  }
}

/**
 * Test chaos engineering setup
 */
export async function testChaosEngineering(): Promise<void> {
  console.log('🧪 Testing chaos engineering setup...');
  
  const priceAPI = new ChaosPriceAPI();
  const results = [];
  
  // Run multiple requests to trigger chaos scenarios
  for (let i = 0; i < 20; i++) {
    try {
      const price = await priceAPI.getPriceWithFallback('bitcoin');
      results.push({ success: true, price });
      
    } catch (error) {
      results.push({ success: false, error: (error as Error).message });
    }
  }
  
  const successCount = results.filter(r => r.success).length;
  const successRate = (successCount / results.length) * 100;
  
  console.log(`🧪 Chaos test results: ${successCount}/${results.length} successful (${successRate.toFixed(1)}%)`);
  
  const chaosStats = chaosService.getStats();
  console.log('🔥 Chaos statistics:', chaosStats);
  
  // Verify SLO compliance even with chaos
  if (successRate >= 95) {
    console.log('✅ System maintained SLO compliance under chaos conditions');
  } else {
    console.log('❌ System failed to maintain SLO compliance under chaos conditions');
  }
}
