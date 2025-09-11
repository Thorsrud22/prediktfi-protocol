import { MarketData, IndicatorResults } from './_schemas';

export function calculateSMA(prices: number[], period: number): number {
  if (prices.length < period) return prices[prices.length - 1] || 0;
  
  const slice = prices.slice(-period);
  const sum = slice.reduce((acc, price) => acc + price, 0);
  return sum / period;
}

export function calculateEMA(prices: number[], period: number): number {
  if (prices.length === 0) return 0;
  if (prices.length < period) return prices[prices.length - 1];
  
  const multiplier = 2 / (period + 1);
  let ema = prices[0];
  
  for (let i = 1; i < prices.length; i++) {
    ema = (prices[i] * multiplier) + (ema * (1 - multiplier));
  }
  
  return ema;
}

export function calculateRSI(prices: number[], period: number = 14): number {
  if (prices.length < period + 1) return 50; // Neutral RSI
  
  const changes = [];
  for (let i = 1; i < prices.length; i++) {
    changes.push(prices[i] - prices[i - 1]);
  }
  
  let avgGain = 0;
  let avgLoss = 0;
  
  // Initial average
  for (let i = 0; i < period; i++) {
    if (changes[i] > 0) {
      avgGain += changes[i];
    } else {
      avgLoss += Math.abs(changes[i]);
    }
  }
  
  avgGain /= period;
  avgLoss /= period;
  
  // Smooth subsequent values
  for (let i = period; i < changes.length; i++) {
    const gain = changes[i] > 0 ? changes[i] : 0;
    const loss = changes[i] < 0 ? Math.abs(changes[i]) : 0;
    
    avgGain = (avgGain * (period - 1) + gain) / period;
    avgLoss = (avgLoss * (period - 1) + loss) / period;
  }
  
  if (avgLoss === 0) return 100;
  
  const rs = avgGain / avgLoss;
  return 100 - (100 / (1 + rs));
}

export function calculateATR(
  highs: number[], 
  lows: number[], 
  closes: number[], 
  period: number = 14
): number {
  if (highs.length < 2 || lows.length < 2 || closes.length < 2) {
    return 0;
  }
  
  const trueRanges = [];
  
  for (let i = 1; i < closes.length; i++) {
    const high = highs[i];
    const low = lows[i];
    const prevClose = closes[i - 1];
    
    const tr1 = high - low;
    const tr2 = Math.abs(high - prevClose);
    const tr3 = Math.abs(low - prevClose);
    
    trueRanges.push(Math.max(tr1, tr2, tr3));
  }
  
  return calculateSMA(trueRanges, period);
}

export function findSupportResistance(prices: number[]): { support: number; resistance: number } {
  if (prices.length < 5) {
    return { 
      support: Math.min(...prices), 
      resistance: Math.max(...prices) 
    };
  }
  
  const peaks = [];
  const valleys = [];
  
  // Find local extrema
  for (let i = 2; i < prices.length - 2; i++) {
    const current = prices[i];
    const prev2 = prices[i - 2];
    const prev1 = prices[i - 1];
    const next1 = prices[i + 1];
    const next2 = prices[i + 2];
    
    // Local maximum (peak)
    if (current > prev2 && current > prev1 && current > next1 && current > next2) {
      peaks.push(current);
    }
    
    // Local minimum (valley)
    if (current < prev2 && current < prev1 && current < next1 && current < next2) {
      valleys.push(current);
    }
  }
  
  // If no clear peaks/valleys, use recent highs/lows
  if (peaks.length === 0) {
    peaks.push(Math.max(...prices.slice(-20)));
  }
  if (valleys.length === 0) {
    valleys.push(Math.min(...prices.slice(-20)));
  }
  
  // Average the strongest levels
  const resistance = peaks.sort((a, b) => b - a).slice(0, 3).reduce((sum, p) => sum + p, 0) / Math.min(peaks.length, 3);
  const support = valleys.sort((a, b) => a - b).slice(0, 3).reduce((sum, v) => sum + v, 0) / Math.min(valleys.length, 3);
  
  return { support, resistance };
}

export function determineTrend(
  sma20: number, 
  sma50: number, 
  currentPrice: number,
  rsi: number
): { trend: 'up' | 'down' | 'neutral'; strength: number } {
  let trendScore = 0;
  let signals = 0;
  
  // SMA trend
  if (sma20 > sma50) {
    trendScore += 1;
  } else if (sma20 < sma50) {
    trendScore -= 1;
  }
  signals++;
  
  // Price vs SMA
  if (currentPrice > sma20) {
    trendScore += 1;
  } else if (currentPrice < sma20) {
    trendScore -= 1;
  }
  signals++;
  
  // RSI momentum
  if (rsi > 60) {
    trendScore += 0.5;
  } else if (rsi < 40) {
    trendScore -= 0.5;
  }
  signals++;
  
  const normalizedScore = trendScore / signals;
  const strength = Math.abs(normalizedScore);
  
  let trend: 'up' | 'down' | 'neutral';
  if (normalizedScore > 0.3) {
    trend = 'up';
  } else if (normalizedScore < -0.3) {
    trend = 'down';
  } else {
    trend = 'neutral';
  }
  
  return { trend, strength };
}

export function computeIndicators(marketData: MarketData[]): IndicatorResults {
  if (marketData.length === 0) {
    return {
      rsi: 50,
      sma20: 0,
      sma50: 0,
      ema12: 0,
      ema26: 0,
      atr: 0,
      support: 0,
      resistance: 0,
      trend: 'neutral',
      strength: 0,
    };
  }
  
  // Use the first (primary) market data for calculations
  const primary = marketData[0];
  const prices = primary.prices;
  
  if (prices.length === 0) {
    return {
      rsi: 50,
      sma20: 0,
      sma50: 0,
      ema12: 0,
      ema26: 0,
      atr: 0,
      support: 0,
      resistance: 0,
      trend: 'neutral',
      strength: 0,
    };
  }
  
  const currentPrice = prices[prices.length - 1];
  
  // Calculate indicators
  const rsi = calculateRSI(prices, 14);
  const sma20 = calculateSMA(prices, 20);
  const sma50 = calculateSMA(prices, 50);
  const ema12 = calculateEMA(prices, 12);
  const ema26 = calculateEMA(prices, 26);
  
  // For ATR, we approximate highs/lows from prices (not ideal but workable)
  const highs = prices.map(p => p * 1.01); // Approximate 1% higher
  const lows = prices.map(p => p * 0.99);  // Approximate 1% lower
  const atr = calculateATR(highs, lows, prices, 14);
  
  const { support, resistance } = findSupportResistance(prices);
  const { trend, strength } = determineTrend(sma20, sma50, currentPrice, rsi);
  
  return {
    rsi: Math.round(rsi * 100) / 100,
    sma20: Math.round(sma20 * 100) / 100,
    sma50: Math.round(sma50 * 100) / 100,
    ema12: Math.round(ema12 * 100) / 100,
    ema26: Math.round(ema26 * 100) / 100,
    atr: Math.round(atr * 100) / 100,
    support: Math.round(support * 100) / 100,
    resistance: Math.round(resistance * 100) / 100,
    trend,
    strength: Math.round(strength * 100) / 100,
  };
}
