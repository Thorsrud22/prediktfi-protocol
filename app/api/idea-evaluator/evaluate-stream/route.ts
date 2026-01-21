/**
 * Streaming Evaluation API
 *
 * Uses Server-Sent Events to stream reasoning steps in real-time
 * before returning the final evaluation result.
 */

import { NextRequest } from "next/server";
import { ideaSubmissionSchema } from "@/lib/ideaSchema";
import { evaluateIdea } from "@/lib/ai/evaluator";
import { getMarketSnapshot } from "@/lib/market/snapshot";
import { checkRateLimit } from "@/app/lib/ratelimit";

// Reasoning step templates based on project type
const REASONING_STEPS: Record<string, string[]> = {
    memecoin: [
        "Analyzing memecoin narrative strength...",
        "Checking Solana chain for similar tickers...",
        "Evaluating viral coefficient potential...",
        "Scanning liquidity lock patterns...",
        "Analyzing community building strategy...",
        "Checking rug risk indicators...",
        "Evaluating launch timing vs market conditions...",
    ],
    defi: [
        "Analyzing protocol architecture...",
        "Checking yield sustainability model...",
        "Scanning audit registry for similar protocols...",
        "Evaluating impermanent loss exposure...",
        "Analyzing smart contract risk factors...",
        "Checking admin key centralization...",
        "Stress-testing economic assumptions...",
    ],
    ai: [
        "Analyzing AI/ML architecture choices...",
        "Evaluating data moat defensibility...",
        "Checking compute requirements...",
        "Analyzing wrapper vs proprietary tech...",
        "Evaluating inference cost structure...",
        "Checking competitive landscape...",
        "Analyzing go-to-market strategy...",
    ],
    default: [
        "Parsing submission metadata...",
        "Analyzing technical architecture...",
        "Evaluating market fit signals...",
        "Checking competitive landscape...",
        "Analyzing execution complexity...",
        "Evaluating team composition...",
        "Generating investment thesis...",
    ],
};

const FINAL_STEPS = [
    "Synthesizing market intelligence...",
    "Calibrating confidence scores...",
    "Generating institutional report...",
];

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

                // --- Rate Limiting Logic ---
                const walletAddress = parsed.data.tokenAddress || parsed.data.walletAddress || null;
                const isWalletConnected = !!walletAddress && walletAddress.length > 30;
                const rateLimitPlan = isWalletConnected ? 'idea_eval_wallet' : 'idea_eval_ip';
                const identifier = isWalletConnected ? walletAddress : (request.headers.get('x-forwarded-for') || 'unknown');

                const rateLimitResponse = await checkRateLimit(request, {
                    identifier,
                    plan: rateLimitPlan
                });

                if (rateLimitResponse) {
                    await sendEvent("error", { error: "Rate limit exceeded" });
                    await writer.close();
                    return;
                }

                // Get steps for this project type
                const projectType = parsed.data.projectType?.toLowerCase() || 'default';
                const steps = [
                    "Initializing PrediktFi Evaluator...",
                    "Secure connection established...",
                    ...(REASONING_STEPS[projectType] || REASONING_STEPS.default),
                    ...FINAL_STEPS,
                ];

                // 1. Start Actual Work (Background)
                // We start this IMMEDIATELY so it runs in parallel with the animation
                const evaluationPromise = (async () => {
                    const marketSnapshot = await getMarketSnapshot();
                    const res = await evaluateIdea(parsed.data, { market: marketSnapshot });
                    return res;
                })();

                // 2. Run Animation Loop (Foreground)
                // We ensure this runs for at least some time so the user sees the steps
                const animationPromise = (async () => {
                    for (let i = 0; i < steps.length; i++) {
                        await sendEvent("step", { step: steps[i], index: i, total: steps.length });

                        // Variable delay: slightly faster now to ensure we don't block if eval is fast
                        // But 'evaluationPromise' usually takes 15-20s, so we have time.
                        const baseDelay = 500;
                        const variance = Math.random() * 300;
                        const delay = i < 3 ? baseDelay : baseDelay + variance;
                        await new Promise(resolve => setTimeout(resolve, delay));
                    }
                })();

                // 3. Wait for BOTH to finish
                // This ensures the animation completes (good UX) AND the result is ready
                const [_, result] = await Promise.all([animationPromise, evaluationPromise]);

                // Send final result
                await sendEvent("complete", { result });
                await writer.close();

            } catch (error) {
                console.error("Streaming evaluation error:", error);
                await sendEvent("error", { error: "Internal server error" });
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
