import { PublicKey } from '@solana/web3.js';
import {
  createMemoInstruction,
  createPrediktMemoPayload,
  serializeMemoPayload,
  parseMemoPayload,
  verifyMemoPayload,
  MEMO_PROGRAM_ID
} from '../../lib/memo';

describe('memo functionality', () => {
  const testPublicKey = new PublicKey('11111111111111111111111111111112');
  const testPayload = {
    t: 'predikt.v1' as const,
    pid: 'test-prediction-id',
    h: 'test-hash-value',
    d: '2025-12-31T23:59:59.000Z',
    w: testPublicKey.toBase58()
  };

  it('should create memo instruction correctly', () => {
    const message = 'test message';
    const instruction = createMemoInstruction(testPublicKey, message);
    
    expect(instruction.programId.equals(MEMO_PROGRAM_ID)).toBe(true);
    expect(instruction.keys).toHaveLength(1);
    expect(instruction.keys[0].pubkey.equals(testPublicKey)).toBe(true);
    expect(instruction.keys[0].isSigner).toBe(true);
    expect(instruction.keys[0].isWritable).toBe(false);
    expect(instruction.data.toString('utf8')).toBe(message);
  });

  it('should create Predikt memo payload correctly', () => {
    const deadline = new Date('2025-12-31T23:59:59.000Z');
    const payload = createPrediktMemoPayload(
      'test-id',
      'test-hash',
      deadline,
      testPublicKey.toBase58()
    );
    
    expect(payload.t).toBe('predikt.v1');
    expect(payload.pid).toBe('test-id');
    expect(payload.h).toBe('test-hash');
    expect(payload.d).toBe('2025-12-31T23:59:59.000Z');
    expect(payload.w).toBe(testPublicKey.toBase58());
  });

  it('should serialize and parse memo payload correctly', () => {
    const serialized = serializeMemoPayload(testPayload);
    const parsed = parseMemoPayload(serialized);
    
    expect(parsed).toEqual(testPayload);
  });

  it('should return null for invalid JSON', () => {
    expect(parseMemoPayload('invalid json')).toBeNull();
    expect(parseMemoPayload('{"invalid": "payload"}')).toBeNull();
  });

  it('should verify memo payload correctly', () => {
    const deadline = new Date('2025-12-31T23:59:59.000Z');
    
    expect(verifyMemoPayload(
      testPayload,
      'test-prediction-id',
      'test-hash-value',
      deadline,
      testPublicKey.toBase58()
    )).toBe(true);
    
    expect(verifyMemoPayload(
      testPayload,
      'wrong-id',
      'test-hash-value',
      deadline,
      testPublicKey.toBase58()
    )).toBe(false);
  });
});
