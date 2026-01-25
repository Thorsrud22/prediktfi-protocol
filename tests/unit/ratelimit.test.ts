import { describe, it, expect, beforeEach, vi } from 'vitest';
import { checkRateLimit, getEvalCount, incrementEvalCount, getRateLimitInfo } from '../../app/lib/ratelimit';
import { NextRequest } from 'next/server';

// Mock request helper
function createReq(ip: string) {
    return new NextRequest('http://localhost', {
        headers: { 'x-forwarded-for': ip }
    });
}

describe('Rate Limiting Logic (Memory Fallback) - Burst vs Quota', () => {
    it('enforces Daily Quota (Completions-based)', async () => {
        const ip = '10.0.0.10';
        const req = createReq(ip);

        // Success 1
        expect(await checkRateLimit(req, { plan: 'idea_eval_ip' })).toBeNull();
        await incrementEvalCount(ip, 'idea_eval_ip');

        // Success 2
        expect(await checkRateLimit(req, { plan: 'idea_eval_ip' })).toBeNull();
        await incrementEvalCount(ip, 'idea_eval_ip');

        // Success 3
        expect(await checkRateLimit(req, { plan: 'idea_eval_ip' })).toBeNull();
        await incrementEvalCount(ip, 'idea_eval_ip');

        // 4th request blocked by Daily Quota
        const blocked = await checkRateLimit(req, { plan: 'idea_eval_ip' });
        expect(blocked).not.toBeNull();
        expect(blocked?.status).toBe(429);
        const body = await blocked?.json();
        expect(body.message).toContain('Daily limit of 3 reached');
    });

    it('enforces Burst Spam Protection (Attempt-based)', async () => {
        const ip = '10.0.0.11';
        const req = createReq(ip);

        // IP Burst limit is now 3 per minute
        await checkRateLimit(req, { plan: 'idea_eval_ip' });
        await checkRateLimit(req, { plan: 'idea_eval_ip' });
        await checkRateLimit(req, { plan: 'idea_eval_ip' });

        // 4th attempt within same minute blocked by Burst protection
        const blocked = await checkRateLimit(req, { plan: 'idea_eval_ip' });
        expect(blocked).not.toBeNull();
        expect(blocked?.status).toBe(429);
        const body = await blocked?.json();
        expect(body.message).toContain('Too many requests');
    });

    it('is fair: failures do not consume daily quota', async () => {
        const ip = '10.0.0.12';
        const req = createReq(ip);

        // User attempts 3 times but they fail
        await checkRateLimit(req, { plan: 'idea_eval_ip' });
        await checkRateLimit(req, { plan: 'idea_eval_ip' });
        await checkRateLimit(req, { plan: 'idea_eval_ip' });

        // Daily quota remains 0 used
        expect(await getEvalCount(ip, 'idea_eval_ip')).toBe(0);

        // Quota API still shows 3 remaining (prioritizing daily credits)
        const info = await getRateLimitInfo(ip, 'idea_eval_ip');
        expect(info.remaining).toBe(3);

        // But the next checkRateLimit will block due to burst
        const burstBlocked = await checkRateLimit(req, { plan: 'idea_eval_ip' });
        expect(burstBlocked).not.toBeNull();
    });
});
