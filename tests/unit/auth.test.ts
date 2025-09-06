import { 
  createSessionToken,
  verifyWalletSignature,
  createWalletAuthMessage,
  generateNonce
} from '../../lib/auth';

// Mock NextRequest for testing
class MockNextRequest {
  headers: Map<string, string>;
  cookies: Map<string, { value: string }>;

  constructor() {
    this.headers = new Map();
    this.cookies = new Map();
  }

  get(name: string) {
    return this.headers.get(name) || null;
  }
}

describe('auth functionality', () => {
  beforeAll(() => {
    process.env.JWT_SECRET = 'test-jwt-secret-min-32-chars-long-for-testing';
  });

  it('should create and verify JWT session tokens', () => {
    const userId = 'test-user-id';
    const email = 'test@example.com';
    const plan = 'free';
    
    const token = createSessionToken(userId, email, plan);
    expect(token).toBeTruthy();
    expect(typeof token).toBe('string');
  });

  it('should verify wallet signatures (placeholder)', () => {
    const publicKey = '11111111111111111111111111111111111111111111'; // 44 chars
    const signature = 'mock-signature-that-is-long-enough-to-pass-validation';
    const message = 'test message';
    
    expect(verifyWalletSignature(publicKey, signature, message)).toBe(true);
    expect(verifyWalletSignature('short', signature, message)).toBe(false);
    expect(verifyWalletSignature(publicKey, 'short', message)).toBe(false);
    expect(verifyWalletSignature(publicKey, signature, '')).toBe(false);
  });

  it('should create wallet auth messages', () => {
    const nonce = 'test-nonce';
    const message = createWalletAuthMessage(nonce);
    
    expect(message).toContain('Sign this message to authenticate with Predikt');
    expect(message).toContain(nonce);
  });

  it('should generate nonces', () => {
    const nonce1 = generateNonce();
    const nonce2 = generateNonce();
    
    expect(nonce1).toBeTruthy();
    expect(nonce2).toBeTruthy();
    expect(nonce1).not.toBe(nonce2); // Should be unique
    expect(typeof nonce1).toBe('string');
  });
});
