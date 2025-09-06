import {
  createMemoPayload,
  createMemoInstruction,
  validateMemoPayload,
  parseMemoData,
  MemoPayload
} from '../../lib/memo';

describe('createMemoPayload', () => {
  it('should create valid memo payload', () => {
    const predictionId = 'pred_123';
    const hash = 'abcd1234567890';
    const deadline = new Date('2024-12-31T23:59:59Z');
    const walletAddress = '1A2B3C4D5E';

    const payload = createMemoPayload(predictionId, hash, deadline, walletAddress);

    expect(payload).toEqual({
      t: 'predikt.v1',
      pid: predictionId,
      h: hash,
      d: deadline.toISOString(),
      w: walletAddress
    });
  });
});

describe('createMemoInstruction', () => {
  it('should create memo instruction with correct program ID', () => {
    const payload: MemoPayload = {
      t: 'predikt.v1',
      pid: 'pred_123',
      h: 'hash123',
      d: '2024-12-31T23:59:59.000Z',
      w: 'wallet123'
    };

    const instruction = createMemoInstruction(payload);

    expect(instruction.programId.toBase58()).toBe('MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr');
    expect(instruction.keys).toEqual([]);
    expect(instruction.data.toString('utf8')).toBe(JSON.stringify(payload));
  });
});

describe('validateMemoPayload', () => {
  const validPayload: MemoPayload = {
    t: 'predikt.v1',
    pid: 'pred_123',
    h: 'hash123',
    d: '2024-12-31T23:59:59.000Z',
    w: 'wallet123'
  };

  const deadline = new Date('2024-12-31T23:59:59.000Z');

  it('should validate correct payload', () => {
    const result = validateMemoPayload(
      validPayload,
      'hash123',
      'wallet123',
      deadline
    );

    expect(result.valid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it('should reject invalid payload type', () => {
    const invalidPayload = { ...validPayload, t: 'wrong.v1' };
    
    const result = validateMemoPayload(
      invalidPayload,
      'hash123',
      'wallet123',
      deadline
    );

    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Invalid payload type');
  });

  it('should reject hash mismatch', () => {
    const result = validateMemoPayload(
      validPayload,
      'different-hash',
      'wallet123',
      deadline
    );

    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Hash mismatch');
  });

  it('should reject wallet mismatch', () => {
    const result = validateMemoPayload(
      validPayload,
      'hash123',
      'different-wallet',
      deadline
    );

    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Wallet address mismatch');
  });

  it('should reject deadline mismatch', () => {
    const differentDeadline = new Date('2025-01-01T00:00:00.000Z');
    
    const result = validateMemoPayload(
      validPayload,
      'hash123',
      'wallet123',
      differentDeadline
    );

    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Deadline mismatch');
  });

  it('should reject missing prediction ID', () => {
    const invalidPayload = { ...validPayload, pid: undefined };
    
    const result = validateMemoPayload(
      invalidPayload,
      'hash123',
      'wallet123',
      deadline
    );

    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Missing or invalid prediction ID');
  });

  it('should reject non-object payload', () => {
    const result = validateMemoPayload(
      'not-an-object',
      'hash123',
      'wallet123',
      deadline
    );

    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Invalid payload format');
  });
});

describe('parseMemoData', () => {
  it('should parse valid memo data', () => {
    const payload: MemoPayload = {
      t: 'predikt.v1',
      pid: 'pred_123',
      h: 'hash123',
      d: '2024-12-31T23:59:59.000Z',
      w: 'wallet123'
    };

    const memoData = JSON.stringify(payload);
    const parsed = parseMemoData(memoData);

    expect(parsed).toEqual(payload);
  });

  it('should return null for invalid JSON', () => {
    const parsed = parseMemoData('invalid-json');
    expect(parsed).toBeNull();
  });

  it('should return null for wrong payload type', () => {
    const wrongPayload = {
      t: 'wrong.v1',
      data: 'something'
    };

    const memoData = JSON.stringify(wrongPayload);
    const parsed = parseMemoData(memoData);

    expect(parsed).toBeNull();
  });

  it('should return null for non-predikt payload', () => {
    const otherPayload = {
      type: 'other',
      data: 'something'
    };

    const memoData = JSON.stringify(otherPayload);
    const parsed = parseMemoData(memoData);

    expect(parsed).toBeNull();
  });
});
