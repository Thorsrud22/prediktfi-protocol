import { 
  normalizePrediction,
  createPredictionHash,
  verifyPredictionHash
} from '../../lib/normalize';

describe('normalizePrediction', () => {
  it('should normalize BTC price predictions correctly', () => {
    const result = normalizePrediction('BTC will reach $100k by 2024-12-31');
    
    expect(result.canonical).toBe('BTC will be above $100000 USD');
    expect(result.resolverKind).toBe('price');
    expect(result.resolverRef).toBe('btc-usd');
    expect(result.topic).toBe('crypto');
    expect(result.p).toBe(0.60);
    expect(result.deadline).toEqual(new Date('2024-12-31T23:59:59Z'));
  });

  it('should normalize ETH price predictions correctly', () => {
    const result = normalizePrediction('ETH will hit $5000 by 12/25/2024');
    
    expect(result.canonical).toBe('ETH will be above $5000 USD');
    expect(result.resolverKind).toBe('price');
    expect(result.resolverRef).toBe('eth-usd');
    expect(result.topic).toBe('crypto');
    expect(result.deadline).toEqual(new Date('2024-12-25T23:59:59Z'));
  });

  it('should handle URL-based predictions', () => {
    const result = normalizePrediction('https://example.com will contain "success"');
    
    expect(result.canonical).toBe('Page https://example.com will contain "success"');
    expect(result.resolverKind).toBe('url');
    expect(result.resolverRef).toBe('https://example.com');
    expect(result.topic).toBe('url');
  });

  it('should fallback to generic predictions', () => {
    const result = normalizePrediction('It will rain tomorrow');
    
    expect(result.canonical).toBe('It will rain tomorrow.');
    expect(result.resolverKind).toBe('text');
    expect(result.resolverRef).toBe('manual');
  });

  it('should extract probability from text', () => {
    const result1 = normalizePrediction('75% chance BTC reaches $100k');
    expect(result1.p).toBe(0.75);

    const result2 = normalizePrediction('p=0.8 ETH hits $5k');
    expect(result2.p).toBe(0.8);

    const result3 = normalizePrediction('probability: 0.9 that it rains');
    expect(result3.p).toBe(0.9);
  });

  it('should use default values when not specified', () => {
    const result = normalizePrediction('BTC will moon');
    
    expect(result.p).toBe(0.60);
    expect(result.deadline.getTime()).toBeGreaterThan(Date.now());
    expect(result.deadline.getTime()).toBeLessThan(Date.now() + 31 * 24 * 60 * 60 * 1000);
  });
});

describe('createPredictionHash', () => {
  it('should create deterministic hashes', () => {
    const canonical = 'BTC will be above $100000 USD';
    const deadline = new Date('2024-12-31T23:59:59Z');
    const resolverRef = 'btc-usd';

    const hash1 = createPredictionHash(canonical, deadline, resolverRef);
    const hash2 = createPredictionHash(canonical, deadline, resolverRef);

    expect(hash1.hash).toBe(hash2.hash);
    expect(hash1.hash).toHaveLength(64); // SHA-256 hex length
  });

  it('should create different hashes for different inputs', () => {
    const deadline = new Date('2024-12-31T23:59:59Z');
    const resolverRef = 'btc-usd';

    const hash1 = createPredictionHash('BTC will be above $100000 USD', deadline, resolverRef);
    const hash2 = createPredictionHash('BTC will be above $200000 USD', deadline, resolverRef);

    expect(hash1.hash).not.toBe(hash2.hash);
  });

  it('should include all components in hash', () => {
    const canonical = 'BTC will be above $100000 USD';
    const deadline1 = new Date('2024-12-31T23:59:59Z');
    const deadline2 = new Date('2025-01-01T23:59:59Z');
    const resolverRef = 'btc-usd';

    const hash1 = createPredictionHash(canonical, deadline1, resolverRef);
    const hash2 = createPredictionHash(canonical, deadline2, resolverRef);

    expect(hash1.hash).not.toBe(hash2.hash);
    expect(hash1.input.deadline).toBe(deadline1.toISOString());
    expect(hash2.input.deadline).toBe(deadline2.toISOString());
  });
});

describe('verifyPredictionHash', () => {
  it('should verify hashes correctly', () => {
    const canonical = 'BTC will be above $100000 USD';
    const deadline = new Date('2024-12-31T23:59:59Z');
    const resolverRef = 'btc-usd';

    const { hash } = createPredictionHash(canonical, deadline, resolverRef);
    const isValid = verifyPredictionHash(hash, canonical, deadline, resolverRef);

    expect(isValid).toBe(true);
  });

  it('should reject invalid hashes', () => {
    const canonical = 'BTC will be above $100000 USD';
    const deadline = new Date('2024-12-31T23:59:59Z');
    const resolverRef = 'btc-usd';

    const isValid = verifyPredictionHash('invalid-hash', canonical, deadline, resolverRef);
    expect(isValid).toBe(false);
  });
});
