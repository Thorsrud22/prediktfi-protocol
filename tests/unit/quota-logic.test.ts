
import { describe, it, expect } from 'vitest';
import { getClientIdentifier } from '../../app/lib/ratelimit';
import { NextRequest } from 'next/server';

describe('Quota Logic - getClientIdentifier', () => {
    it('normalizes wallet address to lowercase', () => {
        const req = new NextRequest('http://localhost');
        const mixedCaseWallet = '0xAbCdEf1234567890AbCdEf1234567890AbCdEf12';

        const id = getClientIdentifier(req, mixedCaseWallet);

        expect(id).toBe(mixedCaseWallet.toLowerCase());
        expect(id).not.toBe(mixedCaseWallet);
    });

    it('falls back to IP if wallet is missing or too short', () => {
        const req = new NextRequest('http://localhost', {
            headers: { 'x-forwarded-for': '1.2.3.4' }
        });

        const id = getClientIdentifier(req, null);
        // Note: getClientIdentifier logic for IP parsing depends on headers. 
        // In test environment, request.ip might be undefined, so it falls back to x-forwarded-for logic if present
        expect(id).toBe('1.2.3.4');
    });

    it('ignores short wallet strings (likely invalid)', () => {
        const req = new NextRequest('http://localhost', {
            headers: { 'x-forwarded-for': '1.2.3.4' }
        });
        const shortWallet = '0x123'; // < 30 chars

        const id = getClientIdentifier(req, shortWallet);
        expect(id).toBe('1.2.3.4');
    });
});
