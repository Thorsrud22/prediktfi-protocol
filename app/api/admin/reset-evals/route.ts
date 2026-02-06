/**
 * POST /api/admin/reset-evals
 * 
 * Reset evaluation counts for testing.
 * Requires HMAC authentication.
 * 
 * Body: { identifier?: string } - specific identifier, or omit to reset all
 */

import { NextRequest, NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';

const redisUrl = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;

const redis = redisUrl && redisToken
    ? new Redis({ url: redisUrl, token: redisToken })
    : null;

export async function POST(request: NextRequest) {
    // Simple auth check - require admin secret
    const adminSecret = process.env.ADMIN_SECRET || process.env.SITE_PASSWORD;
    const authHeader = request.headers.get('x-admin-secret');

    if (!authHeader || authHeader !== adminSecret) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!redis) {
        return NextResponse.json({ error: 'Redis not configured' }, { status: 500 });
    }

    try {
        const body = await request.json().catch(() => ({}));
        const { identifier } = body as { identifier?: string };

        if (identifier) {
            // Reset specific identifier
            const plans = ['idea_eval_ip', 'idea_eval_wallet'] as const;
            const deleted: string[] = [];

            for (const plan of plans) {
                const key = `eval_count:${plan}:${identifier}`;
                const result = await redis.del(key);
                if (result > 0) {
                    deleted.push(key);
                }
            }

            return NextResponse.json({
                success: true,
                message: `Deleted ${deleted.length} key(s)`,
                deleted
            });
        }

        // Reset ALL eval_count keys
        let cursor = 0;
        const deleted: string[] = [];

        do {
            const [newCursor, keys] = await redis.scan(cursor, { match: 'eval_count:*', count: 100 });
            cursor = Number(newCursor);

            for (const key of keys) {
                await redis.del(key);
                deleted.push(key);
            }
        } while (cursor !== 0);

        return NextResponse.json({
            success: true,
            message: `Reset ${deleted.length} evaluation count(s)`,
            deleted
        });
    } catch (error) {
        console.error('Error resetting evals:', error);
        return NextResponse.json(
            { error: 'Failed to reset evals' },
            { status: 500 }
        );
    }
}

export async function GET(request: NextRequest) {
    // Simple auth check
    const adminSecret = process.env.ADMIN_SECRET || process.env.SITE_PASSWORD;
    const authHeader = request.headers.get('x-admin-secret');

    if (!authHeader || authHeader !== adminSecret) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!redis) {
        return NextResponse.json({ error: 'Redis not configured' }, { status: 500 });
    }

    try {
        // List all eval_count keys
        let cursor = 0;
        const keys: { key: string; count: number; ttl: number }[] = [];

        do {
            const [newCursor, foundKeys] = await redis.scan(cursor, { match: 'eval_count:*', count: 100 });
            cursor = Number(newCursor);

            for (const key of foundKeys) {
                const count = await redis.get<number>(key) || 0;
                const ttl = await redis.ttl(key);
                keys.push({ key, count, ttl });
            }
        } while (cursor !== 0);

        return NextResponse.json({
            count: keys.length,
            keys
        });
    } catch (error) {
        console.error('Error listing evals:', error);
        return NextResponse.json(
            { error: 'Failed to list evals' },
            { status: 500 }
        );
    }
}
