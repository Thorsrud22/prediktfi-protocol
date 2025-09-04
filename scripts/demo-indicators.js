// Demo script for manual QA of indicators
const { rsi } = require('../dist/indicators/rsi.js');
const { sma, seriesSma } = require('../dist/indicators/sma.js');
const { ema } = require('../dist/indicators/ema.js');
const { atr } = require('../dist/indicators/atr.js');
const { supportResistance } = require('../dist/indicators/supportResistance.js');
const { maCross } = require('../dist/indicators/maCross.js');

// Test data
const prices = [100, 102, 101, 103, 105, 104, 106, 108, 107, 109, 111, 110, 112, 114, 113];
const candles = prices.map((price, i) => ({
  high: price + 1,
  low: price - 1,
  close: price
}));

console.log('=== INDICATOR DEMO ===');
console.log('Prices:', prices);

console.log('\nRSI (14):', rsi(prices, 14));
console.log('SMA (5):', sma(prices, 5));
console.log('EMA (5):', ema(prices, 5));
console.log('ATR (5):', atr(candles, 5));

const srLevels = supportResistance(prices, 2, 0.05);
console.log('Support levels:', srLevels.support);
console.log('Resistance levels:', srLevels.resistance);

console.log('MA Cross (5,10):', maCross(prices, 5, 10));
