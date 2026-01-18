import { NextRequest, NextResponse } from "next/server";
import { ideaSubmissionSchema } from "@/lib/ideaSchema";
import { evaluateIdea } from "@/lib/ai/evaluator";
import { getMarketSnapshot } from "@/lib/market/snapshot";
import { checkRateLimit } from "@/app/lib/ratelimit";

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

        // --- Rate Limiting Logic ---
        const walletAddress = parsed.data.tokenAddress || parsed.data.walletAddress || null;
        const isWalletConnected = !!walletAddress && walletAddress.length > 30; // Basic length check

        const rateLimitPlan = isWalletConnected ? 'idea_eval_wallet' : 'idea_eval_ip';
        const identifier = isWalletConnected ? walletAddress : (request.headers.get('x-forwarded-for') || 'unknown');

        const rateLimitResponse = await checkRateLimit(request, {
            identifier,
            plan: rateLimitPlan
        });

        if (rateLimitResponse) {
            return rateLimitResponse;
        }
        // ---------------------------

        // Fetch market context (latencies handled by internal cache/timeout)
        const marketSnapshot = await getMarketSnapshot();

        const result = await evaluateIdea(parsed.data, { market: marketSnapshot });
        return NextResponse.json({ result });
    } catch (error) {
        console.error("Error evaluating idea:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
