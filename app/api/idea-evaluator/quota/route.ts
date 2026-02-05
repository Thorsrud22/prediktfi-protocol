import { NextRequest, NextResponse } from "next/server";
import { getEvalCount, getClientIdentifier, isRedisAvailable, getBonusQuota } from "@/app/lib/ratelimit";

export const dynamic = 'force-dynamic';

// Define limits matching ratelimit.ts
const LIMITS = {
    idea_eval_ip: 3,
    idea_eval_wallet: 5
} as const;

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const walletAddress = searchParams.get('walletAddress');
        const identifier = getClientIdentifier(request, walletAddress);

        const isWallet = !!walletAddress && walletAddress.length > 30;
        const plan = isWallet ? 'idea_eval_wallet' : 'idea_eval_ip';

        // Check if Redis is available for reliable quota tracking
        const redisAvailable = isRedisAvailable();
        
        if (!redisAvailable) {
            console.warn(`[QuotaAPI] Redis unavailable - quota tracking unreliable for ${identifier}`);
            // Return unknown/unlimited state when Redis isn't available
            // This prevents showing misleading "3 left of 3" that never changes
            return NextResponse.json({
                limit: LIMITS[plan],
                remaining: -1, // -1 indicates "unknown/unlimited" in the UI
                used: 0,
                identifier,
                plan,
                reliable: false,
                message: 'Quota tracking unavailable'
            });
        }

        const used = await getEvalCount(identifier, plan);
        const bonus = await getBonusQuota(identifier);
        const baseLimit = LIMITS[plan];
        const effectiveLimit = baseLimit + bonus;
        const remaining = Math.max(0, effectiveLimit - used);

        console.log(`[QuotaAPI] ${identifier}: used=${used}, limit=${baseLimit}, bonus=${bonus}, remaining=${remaining}`);

        return NextResponse.json({
            limit: effectiveLimit,
            remaining,
            used,
            identifier,
            plan,
            reliable: true,
            bonus
        });
    } catch (error) {
        console.error('Error fetching quota:', error);
        return NextResponse.json(
            { error: 'Failed to fetch quota', reliable: false },
            { status: 500 }
        );
    }
}
