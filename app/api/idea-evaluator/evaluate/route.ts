import { NextRequest, NextResponse } from "next/server";
import { ideaSubmissionSchema } from "@/lib/ideaSchema";
import { getMarketSnapshotEnvelope } from "@/lib/market/snapshot";
import { checkRateLimit, incrementEvalCount, getClientIdentifier } from "@/app/lib/ratelimit";
import { categoryNeedsMarketSnapshot } from "@/lib/ideaCategories";
import type { GroundingEnvelope, MarketSnapshot } from "@/lib/market/types";

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


        // Category-aware market context fetch
        let marketSnapshot: MarketSnapshot | undefined;
        let marketGrounding: GroundingEnvelope<MarketSnapshot> | undefined;
        if (categoryNeedsMarketSnapshot(parsed.data.projectType)) {
            marketGrounding = await getMarketSnapshotEnvelope();
            marketSnapshot = marketGrounding.data;
        }

        // Use new Investment Committee Protocol
        const { evaluateWithCommittee } = await import("@/lib/ai/committee");
        const evaluationId = `eval_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
        const result = await evaluateWithCommittee(parsed.data, {
            evaluationId,
            market: marketSnapshot,
            marketGrounding,
        });

        if (result.meta?.verifierStatus === 'hard_fail') {
            return NextResponse.json(
                {
                    error: 'Evaluation failed quality checks',
                    details: result.meta?.verifierIssues || [],
                },
                { status: 422 }
            );
        }

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
