/**
 * Price monitoring and auto-re-simulation
 * Monitors price changes and triggers re-simulation when thresholds are exceeded
 */

import { quoteCache } from '../aggregators/quote-cache';
import { getTokenMint } from '../aggregators/jupiter';

interface PriceMonitorConfig {
  thresholdBps: number; // Price change threshold in basis points
  checkIntervalMs: number; // How often to check prices
  maxChecks: number; // Maximum number of checks before giving up
}

interface MonitoredIntent {
  id: string;
  base: string;
  quote: string;
  side: 'BUY' | 'SELL';
  sizeTokens: number;
  originalPrice: number;
  checksRemaining: number;
  onPriceChange: (newPrice: number, oldPrice: number) => void;
}

class PriceMonitor {
  private monitoredIntents = new Map<string, MonitoredIntent>();
  private intervals = new Map<string, NodeJS.Timeout>();
  private readonly defaultConfig: PriceMonitorConfig = {
    thresholdBps: 10, // 0.1% threshold
    checkIntervalMs: 2000, // Check every 2 seconds
    maxChecks: 30 // Check for 1 minute max
  };

  startMonitoring(
    intentId: string,
    base: string,
    quote: string,
    side: 'BUY' | 'SELL',
    sizeTokens: number,
    originalPrice: number,
    onPriceChange: (newPrice: number, oldPrice: number) => void,
    config: Partial<PriceMonitorConfig> = {}
  ): void {
    const finalConfig = { ...this.defaultConfig, ...config };
    
    const monitoredIntent: MonitoredIntent = {
      id: intentId,
      base,
      quote,
      side,
      sizeTokens,
      originalPrice,
      checksRemaining: finalConfig.maxChecks,
      onPriceChange
    };

    this.monitoredIntents.set(intentId, monitoredIntent);

    // Start monitoring interval
    const interval = setInterval(async () => {
      await this.checkPriceChange(intentId, finalConfig);
    }, finalConfig.checkIntervalMs);

    this.intervals.set(intentId, interval);

    console.log(`🔍 Started price monitoring for intent ${intentId} (${base}/${quote})`);
  }

  stopMonitoring(intentId: string): void {
    const interval = this.intervals.get(intentId);
    if (interval) {
      clearInterval(interval);
      this.intervals.delete(intentId);
    }
    
    this.monitoredIntents.delete(intentId);
    console.log(`⏹️ Stopped price monitoring for intent ${intentId}`);
  }

  private async checkPriceChange(intentId: string, config: PriceMonitorConfig): Promise<void> {
    const monitored = this.monitoredIntents.get(intentId);
    if (!monitored) {
      this.stopMonitoring(intentId);
      return;
    }

    // Decrement checks remaining
    monitored.checksRemaining--;
    if (monitored.checksRemaining <= 0) {
      console.log(`⏰ Price monitoring expired for intent ${intentId}`);
      this.stopMonitoring(intentId);
      return;
    }

    try {
      const { base, quote, side, sizeTokens } = monitored;
      const inputMint = side === 'BUY' ? getTokenMint(quote) : getTokenMint(base);
      const outputMint = side === 'BUY' ? getTokenMint(base) : getTokenMint(quote);

      const { changed, oldPrice, newPrice } = await quoteCache.checkPriceChange(
        inputMint,
        outputMint,
        sizeTokens,
        config.thresholdBps
      );

      if (changed && oldPrice && newPrice) {
        console.log(`📈 Price changed for ${base}/${quote}: ${oldPrice.toFixed(6)} → ${newPrice.toFixed(6)}`);
        monitored.onPriceChange(newPrice, oldPrice);
        
        // Update original price for future comparisons
        monitored.originalPrice = newPrice;
      }
    } catch (error) {
      console.warn(`⚠️ Failed to check price change for intent ${intentId}:`, error);
    }
  }

  // Get monitoring stats
  getStats(): { activeMonitors: number; monitoredPairs: string[] } {
    const monitoredPairs = Array.from(this.monitoredIntents.values())
      .map(intent => `${intent.base}/${intent.quote}`)
      .filter((pair, index, arr) => arr.indexOf(pair) === index); // Unique pairs

    return {
      activeMonitors: this.monitoredIntents.size,
      monitoredPairs
    };
  }

  // Stop all monitoring
  stopAll(): void {
    for (const intentId of this.monitoredIntents.keys()) {
      this.stopMonitoring(intentId);
    }
  }
}

// Singleton instance
export const priceMonitor = new PriceMonitor();

// Export types
export type { PriceMonitorConfig, MonitoredIntent };
