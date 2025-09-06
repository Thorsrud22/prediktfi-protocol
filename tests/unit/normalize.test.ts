import { 
  normalizePrediction, 
  createPredictionHash, 
  verifyPredictionHash 
} from '../../lib/normalize';

describe('normalizePrediction', () => {
  it('should normalize BTC price predictions correctly', () => {
    const result = normalizePrediction('BTC will be above $80000 by end of year');
    
    expect(result.statement).toContain('BTC spot price closes above 80000 USD');
    expect(result.probability).toBe(0.6);
    expect(result.resolver.kind).toBe('price');
    expect(result.resolver.ref).toBe('btc_usd');
    expect(result.topic).toBe('Cryptocurrency');
    expect(result.hash).toBeTruthy();
  });

  it('should normalize ETH price predictions correctly', () => {
    const result = normalizePrediction('Ethereum will go below $3000');
    
    expect(result.statement).toContain('ETH spot price closes below 3000 USD');
    expect(result.resolver.kind).toBe('price');
    expect(result.resolver.ref).toBe('eth_usd');
  });

  it('should handle URL-based predictions', () => {
    const result = normalizePrediction('This event will happen https://example.com/event');
    
    expect(result.statement).toBe('This event will happen');
    expect(result.resolver.kind).toBe('url');
    expect(result.resolver.ref).toBe('https://example.com/event');
  });

  it('should fallback to generic predictions', () => {
    const result = normalizePrediction('It will rain tomorrow');
    
    expect(result.statement).toBe('It will rain tomorrow');
    expect(result.probability).toBe(0.5);
    expect(result.resolver.kind).toBe('text');
    expect(result.resolver.ref).toBe('manual_verification');
  });

  it('should create deterministic hashes', () => {
    const statement = 'BTC spot price closes above 80000 USD on 2025-12-31';
    const deadline = new Date('2025-12-31T23:59:59.000Z');
    const resolverRef = 'btc_usd';
    
    const hash1 = createPredictionHash(statement, deadline, resolverRef);
    const hash2 = createPredictionHash(statement, deadline, resolverRef);
    
    expect(hash1).toBe(hash2);
    expect(hash1).toHaveLength(64); // SHA-256 hex string
  });

  it('should verify hashes correctly', () => {
    const statement = 'Test statement';
    const deadline = new Date('2025-12-31T23:59:59.000Z');
    const resolverRef = 'test_ref';
    
    const hash = createPredictionHash(statement, deadline, resolverRef);
    
    expect(verifyPredictionHash(statement, deadline, resolverRef, hash)).toBe(true);
    expect(verifyPredictionHash('Different statement', deadline, resolverRef, hash)).toBe(false);
  });
});
