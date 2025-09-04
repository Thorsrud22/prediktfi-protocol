import { describe, it, expect } from 'vitest';

describe('Technical Indicators', () => {
  it('should have RSI calculation function', async () => {
    const rsiModule = await import('../src/lib/indicators/rsi');
    expect(rsiModule).toBeDefined();
  });

  it('should have SMA calculation function', async () => {
    const smaModule = await import('../src/lib/indicators/sma');
    expect(smaModule).toBeDefined();
  });

  it('should have EMA calculation function', async () => {
    const emaModule = await import('../src/lib/indicators/ema');
    expect(emaModule).toBeDefined();
  });

  it('should have ATR calculation function', async () => {
    const atrModule = await import('../src/lib/indicators/atr');
    expect(atrModule).toBeDefined();
  });

  it('should have support/resistance detection', async () => {
    const srModule = await import('../src/lib/indicators/supportResistance');
    expect(srModule).toBeDefined();
  });

  it('should have moving average crossover detection', async () => {
    const maCrossModule = await import('../src/lib/indicators/maCross');
    expect(maCrossModule).toBeDefined();
  });
});
