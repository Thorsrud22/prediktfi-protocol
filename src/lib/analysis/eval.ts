/**
 * Evaluation metrics for analysis engine performance
 * Measures coverage, direction accuracy, and consistency
 */

export interface EvaluationMetrics {
  coverage: number;      // % of actual prices within predicted intervals
  direction: number;     // % of correct direction predictions
  consistency: number;   // Correlation between technical and sentiment signals
}

export interface HistoricalDataPoint {
  date: string;
  price: number;
  prediction: {
    probability: number;
    interval: { low: number; high: number };
    technical_signal: number;  // -1 to 1
    sentiment_signal: number;  // -1 to 1
  };
}

export interface MockMarketData {
  dates: string[];
  prices: number[];
}

/**
 * Calculate interval coverage rate
 * Returns the percentage of actual end prices that fell within predicted intervals
 */
export function calculateCoverage(historicalData: HistoricalDataPoint[]): number {
  if (historicalData.length === 0) return 0;

  let withinInterval = 0;
  
  for (const point of historicalData) {
    const { price, prediction } = point;
    if (price >= prediction.interval.low && price <= prediction.interval.high) {
      withinInterval++;
    }
  }

  return (withinInterval / historicalData.length) * 100;
}

/**
 * Calculate direction accuracy
 * Returns percentage of correct directional predictions (when probability > 0.5)
 */
export function calculateDirection(historicalData: HistoricalDataPoint[]): number {
  if (historicalData.length < 2) return 0;

  let correctDirections = 0;
  let validPredictions = 0;

  for (let i = 1; i < historicalData.length; i++) {
    const current = historicalData[i];
    const previous = historicalData[i - 1];
    
    // Only count predictions with confidence > 0.5
    if (current.prediction.probability > 0.5) {
      validPredictions++;
      
      const actualDirection = current.price > previous.price;
      const predictedDirection = current.prediction.probability > 0.5;
      
      if (actualDirection === predictedDirection) {
        correctDirections++;
      }
    }
  }

  return validPredictions > 0 ? (correctDirections / validPredictions) * 100 : 0;
}

/**
 * Calculate consistency between technical and sentiment signals
 * Returns correlation coefficient between technical and sentiment directional signals
 */
export function calculateConsistency(historicalData: HistoricalDataPoint[]): number {
  if (historicalData.length < 2) return 0;

  const technicalSignals = historicalData.map(d => d.prediction.technical_signal);
  const sentimentSignals = historicalData.map(d => d.prediction.sentiment_signal);

  return calculateCorrelation(technicalSignals, sentimentSignals);
}

/**
 * Calculate Pearson correlation coefficient
 */
function calculateCorrelation(x: number[], y: number[]): number {
  if (x.length !== y.length || x.length === 0) return 0;

  const n = x.length;
  const sumX = x.reduce((a, b) => a + b, 0);
  const sumY = y.reduce((a, b) => a + b, 0);
  const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
  const sumX2 = x.reduce((sum, xi) => sum + xi * xi, 0);
  const sumY2 = y.reduce((sum, yi) => sum + yi * yi, 0);

  const numerator = n * sumXY - sumX * sumY;
  const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));

  return denominator === 0 ? 0 : numerator / denominator;
}

/**
 * Generate mock market data for testing
 */
export function generateMockMarketData(
  startPrice: number = 50000,
  days: number = 26 * 7, // 26 weeks
  volatility: number = 0.02
): MockMarketData {
  const dates: string[] = [];
  const prices: number[] = [];
  
  let currentPrice = startPrice;
  const startDate = new Date('2024-01-01');
  
  for (let i = 0; i < days; i++) {
    const date = new Date(startDate);
    date.setDate(startDate.getDate() + i);
    dates.push(date.toISOString().split('T')[0]);
    
    // Add initial price without modification
    if (i === 0) {
      prices.push(startPrice);
      continue;
    }
    
    // Random walk with drift for subsequent prices
    const randomChange = (Math.random() - 0.5) * 2 * volatility;
    const drift = 0.0002; // Small upward drift
    currentPrice *= (1 + drift + randomChange);
    
    prices.push(Math.round(currentPrice * 100) / 100);
  }
  
  return { dates, prices };
}

/**
 * Create synthetic historical data for testing evaluation metrics
 */
export function createSyntheticHistoricalData(
  mockData: MockMarketData,
  horizon: '24h' | '7d' | '30d'
): HistoricalDataPoint[] {
  const historicalData: HistoricalDataPoint[] = [];
  const horizonDays = horizon === '24h' ? 1 : horizon === '7d' ? 7 : 30;
  
  for (let i = 0; i < mockData.prices.length - horizonDays; i++) {
    const currentPrice = mockData.prices[i];
    const futurePrice = mockData.prices[i + horizonDays];
    
    // Generate synthetic prediction
    const priceChange = (futurePrice - currentPrice) / currentPrice;
    const probability = 0.5 + Math.tanh(priceChange * 10) * 0.3; // Sigmoid-like
    
    // Create reasonable interval around current price
    const intervalWidth = currentPrice * 0.1; // 10% width
    const interval = {
      low: currentPrice - intervalWidth,
      high: currentPrice + intervalWidth,
    };
    
    // Generate correlated technical and sentiment signals
    const baseSignal = priceChange > 0 ? 0.3 : -0.3;
    const technical_signal = baseSignal + (Math.random() - 0.5) * 0.4;
    const sentiment_signal = baseSignal * 0.8 + (Math.random() - 0.5) * 0.3; // Correlated but noisy
    
    historicalData.push({
      date: mockData.dates[i],
      price: futurePrice, // The actual outcome price
      prediction: {
        probability,
        interval,
        technical_signal,
        sentiment_signal,
      },
    });
  }
  
  return historicalData;
}

/**
 * Run comprehensive evaluation
 */
export function evaluateEngine(horizon: '24h' | '7d' | '30d' = '7d'): EvaluationMetrics {
  // Generate mock data and create synthetic predictions
  const mockData = generateMockMarketData(50000, 26 * 7, 0.02);
  const historicalData = createSyntheticHistoricalData(mockData, horizon);
  
  return {
    coverage: calculateCoverage(historicalData),
    direction: calculateDirection(historicalData),
    consistency: calculateConsistency(historicalData),
  };
}
