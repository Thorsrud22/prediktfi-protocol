import { NextRequest, NextResponse } from "next/server";
import { getEvalCount, getClientIdentifier } from "@/app/lib/ratelimit";

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

        console.log(`[QuotaAPI] Request from: ${identifier} (isWallet=${isWallet}) -> Plan: ${plan}`);

        const used = await getEvalCount(identifier, plan);
        const limit = LIMITS[plan];
        const remaining = Math.max(0, limit - used);

        console.log(`[QuotaAPI] ${identifier}: used=${used}, limit=${limit}, remaining=${remaining}`);

        return NextResponse.json({
            limit,
            remaining,
            used,
            identifier,
            plan
        });
    } catch (error) {
        console.error('Error fetching quota:', error);
        return NextResponse.json(
            { error: 'Failed to fetch quota' },
            { status: 500 }
        );
    }
}
