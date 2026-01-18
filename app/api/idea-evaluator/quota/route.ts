import { NextRequest, NextResponse } from "next/server";
import { getRateLimitInfo } from "@/app/lib/ratelimit";

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const walletAddress = searchParams.get('walletAddress');

        const isWallet = !!walletAddress && walletAddress.length > 30;
        const identifier = isWallet ? walletAddress : (request.headers.get('x-forwarded-for') || 'unknown');
        const plan = isWallet ? 'idea_eval_wallet' : 'idea_eval_ip';

        const info = await getRateLimitInfo(identifier, plan);

        return NextResponse.json({
            ...info,
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
