#!/usr/bin/env node
/**
 * Script to reset evaluation counts in Redis
 * Usage: node scripts/reset-evals.mjs [identifier]
 * If no identifier provided, it will scan and list all eval_count keys
 * Use --all to reset ALL eval counts
 */

import { Redis } from '@upstash/redis';
import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Load .env from project root
const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: join(__dirname, '..', '.env') });

const redisUrl = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;

if (!redisUrl || !redisToken) {
    console.error('❌ Missing Redis credentials. Set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN in .env');
    process.exit(1);
}

const redis = new Redis({
    url: redisUrl,
    token: redisToken,
});

async function resetEvals(identifier) {
    const plans = ['idea_eval_ip', 'idea_eval_wallet'];

    for (const plan of plans) {
        const key = `eval_count:${plan}:${identifier}`;
        const currentCount = await redis.get(key);

        if (currentCount !== null) {
            await redis.del(key);
            console.log(`✅ Deleted ${key} (was ${currentCount})`);
        } else {
            console.log(`ℹ️  ${key} not found`);
        }
    }
}

async function listAllEvalKeys() {
    console.log('🔍 Scanning for all eval_count keys...\n');

    // Upstash Redis uses SCAN with pattern matching
    let cursor = 0;
    const allKeys = [];

    do {
        const [newCursor, keys] = await redis.scan(cursor, { match: 'eval_count:*', count: 100 });
        cursor = Number(newCursor);
        allKeys.push(...keys);
    } while (cursor !== 0);

    if (allKeys.length === 0) {
        console.log('No eval_count keys found.');
        return;
    }

    console.log(`Found ${allKeys.length} key(s):\n`);

    for (const key of allKeys) {
        const value = await redis.get(key);
        const ttl = await redis.ttl(key);
        const hours = Math.floor(ttl / 3600);
        const mins = Math.floor((ttl % 3600) / 60);
        console.log(`  ${key} = ${value} (TTL: ${hours}h ${mins}m)`);
    }
}

async function resetAllEvalKeys() {
    console.log('🗑️  Resetting ALL eval_count keys...\n');

    let cursor = 0;
    let deletedCount = 0;

    do {
        const [newCursor, keys] = await redis.scan(cursor, { match: 'eval_count:*', count: 100 });
        cursor = Number(newCursor);

        for (const key of keys) {
            await redis.del(key);
            console.log(`  ✅ Deleted ${key}`);
            deletedCount++;
        }
    } while (cursor !== 0);

    console.log(`\n✅ Done! Deleted ${deletedCount} key(s).`);
}

// Main
const args = process.argv.slice(2);

if (args.length === 0) {
    await listAllEvalKeys();
} else if (args[0] === '--all') {
    await resetAllEvalKeys();
} else {
    await resetEvals(args[0]);
}

process.exit(0);
