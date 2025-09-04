import { PredictInput, PredictOutput } from '../kernel';
import { slugify, nowTs } from '../util';
import { mockAdapter } from './mock';

interface CoinGeckoPrice {
  [key: string]: {
    usd: number;
    usd_24h_change: number;
  };
}

async function fetchCryptoPrice(symbol: string): Promise<{ price: number; change24h: number } | null> {
  try {
    // Map common symbols to CoinGecko IDs
    const symbolMap: { [key: string]: string } = {
      'btc': 'bitcoin',
      'bitcoin': 'bitcoin',
      'eth': 'ethereum',
      'ethereum': 'ethereum',
      'sol': 'solana',
      'solana': 'solana',
      'ada': 'cardano',
      'cardano': 'cardano'
    };

    const coinId = symbolMap[symbol.toLowerCase()] || 'bitcoin';
    
    // Add timeout and better error handling
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
    
    const response = await fetch(
      `https://api.coingecko.com/api/v3/simple/price?ids=${coinId}&vs_currencies=usd&include_24hr_change=true`,
      { 
        method: 'GET',
        headers: { 
          'Accept': 'application/json',
          'User-Agent': 'Predikt/1.0'
        },
        signal: controller.signal
      }
    );

    clearTimeout(timeoutId);

    if (!response.ok) {
      console.warn(`CoinGecko API error: ${response.status} ${response.statusText}`);
      return null;
    }

    const data: CoinGeckoPrice = await response.json();
    const coinData = data[coinId];
    
    if (!coinData) {
      console.warn(`No data for ${coinId}`);
      return null;
    }

    return {
      price: coinData.usd,
      change24h: coinData.usd_24h_change || 0
    };
  } catch (error) {
    console.warn(`Crypto price fetch failed for ${symbol}:`, error);
    return null;
  }
}

function calculateProbability(change24h: number, horizon: string): number {
  // Simple heuristic based on 24h change and volatility
  const absChange = Math.abs(change24h);
  
  // Base probability around 0.5
  let prob = 0.5;
  
  // Adjust based on trend direction
  if (change24h > 0) {
    prob += 0.1; // Slight bullish bias for positive trends
  } else if (change24h < 0) {
    prob -= 0.1; // Slight bearish bias for negative trends
  }
  
  // Adjust based on volatility (higher volatility = more uncertainty)
  if (absChange > 10) {
    prob += (Math.random() - 0.5) * 0.3; // High volatility = more random
  } else if (absChange > 5) {
    prob += (Math.random() - 0.5) * 0.2; // Medium volatility
  } else {
    prob += (Math.random() - 0.5) * 0.1; // Low volatility = more predictable
  }
  
  // Horizon adjustment
  if (horizon.includes('24h') || horizon.includes('1d')) {
    // Short term: trend continuation more likely
    prob += change24h > 0 ? 0.05 : -0.05;
  } else if (horizon.includes('week') || horizon.includes('month')) {
    // Longer term: mean reversion tendency
    prob += change24h > 0 ? -0.02 : 0.02;
  }
  
  // Clamp between 0.05 and 0.95
  return Math.max(0.05, Math.min(0.95, prob));
}

export async function baselineAdapter(input: PredictInput): Promise<PredictOutput> {
  const scenarioId = slugify(`${input.topic}-${input.question}-${input.horizon}`);
  
  try {
    // Extract crypto symbol from topic or question
    const text = `${input.topic} ${input.question}`.toLowerCase();
    let symbol = 'bitcoin'; // default
    
    if (text.includes('btc') || text.includes('bitcoin')) symbol = 'bitcoin';
    else if (text.includes('eth') || text.includes('ethereum')) symbol = 'ethereum';
    else if (text.includes('sol') || text.includes('solana')) symbol = 'solana';
    
    const priceData = await fetchCryptoPrice(symbol);
    
    if (!priceData) {
      // Fallback to mock if price fetch fails
      return await mockAdapter(input);
    }
    
    const prob = calculateProbability(priceData.change24h, input.horizon);
    const change24h = priceData.change24h;
    const price = priceData.price;
    
    // Generate drivers based on market data
    const drivers = [
      `24h change: ${change24h > 0 ? '+' : ''}${change24h.toFixed(2)}%`,
      `Current price: $${price.toLocaleString()}`,
      change24h > 5 ? 'High volatility' : change24h < -5 ? 'Market correction' : 'Stable movement'
    ];
    
    // Generate rationale
    const trendWord = change24h > 2 ? 'bullish' : change24h < -2 ? 'bearish' : 'neutral';
    const rationale = `Based on current ${trendWord} trend (${change24h.toFixed(1)}% 24h) and market volatility analysis.`;
    
    return {
      prob: Math.round(prob * 100) / 100,
      drivers,
      rationale,
      model: 'baseline-v0-fallback',
      scenarioId,
      ts: nowTs()
    };
    
  } catch (error) {
    console.warn('Baseline adapter failed, using mock fallback:', error);
    return await mockAdapter(input);
  }
}
