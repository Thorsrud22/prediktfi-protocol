// Simple manual test without vitest
function testRSI() {
  console.log('Testing RSI...');
  
  // Load RSI function
  const fs = require('fs');
  const path = require('path');
  
  // Read and eval the TypeScript source
  const rsiPath = path.join(__dirname, '../src/lib/indicators/rsi.ts');
  let rsiSource = fs.readFileSync(rsiPath, 'utf8');
  
  // Simple conversion: remove types and export statements
  rsiSource = rsiSource
    .replace(/: number\[\]/g, '')
    .replace(/: number/g, '')
    .replace(/export function/g, 'function')
    .replace(/\/\*\*[\s\S]*?\*\//g, ''); // Remove JSDoc
  
  // Execute the code
  eval(rsiSource);
  
  // Test data
  const prices = [100, 102, 101, 103, 105, 104, 106, 108, 107, 109, 111, 110, 112, 114, 113, 115, 114, 116];
  
  console.log('Test data:', prices);
  console.log('RSI result:', rsi(prices, 14));
  console.log('Should be between 0-100:', rsi(prices, 14) >= 0 && rsi(prices, 14) <= 100);
  console.log('Too few data points (NaN):', isNaN(rsi([100, 105], 14)));
  console.log('Flat series (100):', rsi(new Array(20).fill(100), 14));
}

testRSI();
