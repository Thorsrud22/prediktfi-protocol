import { describe, it, expect } from 'vitest';
import { computeFromChargeId, parseAndVerify, __test__ } from '../app/lib/license';

describe('license utils', () => {
  it('computes and verifies license', () => {
    process.env.PREDIKT_LICENSE_SECRET = 'test_secret_1234567890_abcdefghij';
    const lic = computeFromChargeId('ch_123');
    const res = parseAndVerify(lic);
    expect(res.ok).toBe(true);
    expect(res.chargeId).toBe('ch_123');
  });

  it('rejects tampered license', () => {
    process.env.PREDIKT_LICENSE_SECRET = 'test_secret_1234567890_abcdefghij';
    const lic = computeFromChargeId('ch_123');
    const bad = lic.slice(0, -1) + (lic.endsWith('1') ? '2' : '1');
    const res = parseAndVerify(bad);
    expect(res.ok).toBe(false);
  });
});
