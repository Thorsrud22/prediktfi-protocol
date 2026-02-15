/**
 * Streaming Evaluation API
 *
 * Uses Server-Sent Events to stream reasoning steps in real-time
 * before returning the final evaluation result.
 */

import { NextRequest } from "next/server";
import { ideaSubmissionSchema } from "@/lib/ideaSchema";
import { getMarketSnapshotEnvelope } from "@/lib/market/snapshot";
import { checkRateLimit, incrementEvalCount, getClientIdentifier } from "@/app/lib/ratelimit";
import { buildCategoryPreflightSteps, categoryNeedsMarketSnapshot } from "@/lib/ideaCategories";
import type { GroundingEnvelope, MarketSnapshot } from "@/lib/market/types";

// Vercel Serverless Function Config
export const maxDuration = 300; // Max duration (5 minutes)
export const runtime = 'nodejs'; // Ensure Node.js runtime

export async function POST(request: NextRequest) {
    try {
        console.log('[EvaluateStream] Handshake started');
        // Create a TransformStream for SSE
        const encoder = new TextEncoder();
        const stream = new TransformStream();
        const writer = stream.writable.getWriter();

        // Helper to send SSE message
        const sendEvent = async (event: string, data: unknown) => {
            const message = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
            await writer.write(encoder.encode(message));
        };

        // Start the async evaluation process
        (async () => {
            try {
                const body = await request.json();
                const parsed = ideaSubmissionSchema.safeParse(body);

                if (!parsed.success) {
                    await sendEvent("error", { error: "Invalid payload", issues: parsed.error.format() });
                    await writer.close();
                    return;
                }

                // --- Rate Limiting & Identification ---
                // Priority: x-wallet-id header > payload address > client IP
                const walletFromHeader = request.headers.get('x-wallet-id');
                const walletAddress = walletFromHeader || parsed.data.walletAddress || null;
                const identifier = getClientIdentifier(request, walletAddress);

                const isWallet = !!walletAddress && walletAddress.length > 30;
                const rateLimitPlan = isWallet ? 'idea_eval_wallet' : 'idea_eval_ip';

                const rateLimitResponse = await checkRateLimit(request, {
                    identifier,
                    plan: rateLimitPlan
                });

                if (rateLimitResponse) {
                    await sendEvent("error", { error: "Rate limit exceeded" });
                    await writer.close();
                    return;
                }

                // 1. Category-aware preflight + optional market context
                let marketSnapshot: MarketSnapshot | undefined;
                let marketGrounding: GroundingEnvelope<MarketSnapshot> | undefined;
                if (categoryNeedsMarketSnapshot(parsed.data.projectType)) {
                    marketGrounding = await getMarketSnapshotEnvelope();
                    marketSnapshot = marketGrounding.data;
                }

                const preflightSteps = buildCategoryPreflightSteps(parsed.data.projectType, marketSnapshot);
                for (const step of preflightSteps) {
                    await sendEvent("step", { step });
                }

                // 2. AI Inference with real-time committee debate
                const { evaluateWithCommittee } = await import("@/lib/ai/committee");
                const evaluationId = `eval_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
                const res = await evaluateWithCommittee(parsed.data, {
                    evaluationId,
                    market: marketSnapshot,
                    marketGrounding,
                    onProgress: async (step) => {
                        await sendEvent("step", { step });
                    },
                    onThought: async (thought) => {
                        await sendEvent("thought", { thought });
                    }
                });

                if (res.meta?.verifierStatus === 'hard_fail') {
                    await sendEvent("error", {
                        error: "Evaluation failed quality checks",
                        details: res.meta?.verifierIssues || [],
                    });
                    await writer.close();
                    return;
                }

                // 3. Complete - Increment usage counter for accurate quota display
                await incrementEvalCount(identifier, rateLimitPlan as 'idea_eval_ip' | 'idea_eval_wallet');
                await sendEvent("step", { step: "Evaluation complete" });
                await sendEvent("complete", { result: res });
                await writer.close();

            } catch (error) {
                console.error("Streaming evaluation error:", error);

                let errorMessage = "Unknown error";
                if (error instanceof Error) {
                    if (error.message.includes('429') || error.message.includes('quota')) {
                        errorMessage = "Daily limit reached (OpenAI Quota). Please check billing.";
                    } else {
                        errorMessage = error.message;
                    }
                }

                await sendEvent("error", { error: errorMessage });
                await writer.close();
            }
        })();

        // Return the stream as SSE response
        console.log('[EvaluateStream] Stream connected, returning 200');
        return new Response(stream.readable, {
            headers: {
                'Content-Type': 'text/event-stream',
                'Cache-Control': 'no-cache',
                'Connection': 'keep-alive',
            },
        });
    } catch (err) {
        console.error('[EvaluateStream] Synchronous error:', err);
        return new Response(JSON.stringify({ error: 'Internal Server Error', details: String(err) }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
