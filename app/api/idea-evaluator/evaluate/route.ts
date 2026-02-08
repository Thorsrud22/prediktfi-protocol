import { NextRequest, NextResponse } from "next/server";
import { ideaSubmissionSchema } from "@/lib/ideaSchema";
import { getMarketSnapshot } from "@/lib/market/snapshot";
import { checkRateLimit, incrementEvalCount, getClientIdentifier } from "@/app/lib/ratelimit";

// Vercel Serverless Function Config
export const maxDuration = 60; // Max duration for Hobby (10s is default, can go up to 60)
export const runtime = 'nodejs'; // Use Node.js runtime (not Edge) for full timeouts

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const parsed = ideaSubmissionSchema.safeParse(body);

        if (!parsed.success) {
            return NextResponse.json(
                { error: "Invalid payload", issues: parsed.error.format() },
                { status: 400 }
            );
        }

        // --- Rate Limiting & Identification ---
        const walletAddress = parsed.data.walletAddress || null;
        const identifier = getClientIdentifier(request, walletAddress);

        const isWallet = !!walletAddress && walletAddress.length > 30;
        const rateLimitPlan = isWallet ? 'idea_eval_wallet' : 'idea_eval_ip';

        const rateLimitResponse = await checkRateLimit(request, {
            identifier,
            plan: rateLimitPlan
        });

        if (process.env.NODE_ENV === 'production' && rateLimitResponse) {
            return rateLimitResponse;
        }
        // ---------------------------


        // Fetch market context (latencies handled by internal cache/timeout)
        const marketSnapshot = await getMarketSnapshot();

        // Use new Investment Committee Protocol
        const { evaluateWithCommittee } = await import("@/lib/ai/committee");
        const result = await evaluateWithCommittee(parsed.data, { market: marketSnapshot });

        // Increment evaluation count for daily quota tracking
        await incrementEvalCount(identifier, rateLimitPlan as 'idea_eval_ip' | 'idea_eval_wallet');

        return NextResponse.json({ result });
    } catch (error) {
        console.error("Error evaluating idea:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
