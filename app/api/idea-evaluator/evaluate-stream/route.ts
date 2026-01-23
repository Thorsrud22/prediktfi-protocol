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

// Vercel Serverless Function Config
export const maxDuration = 300; // Max duration (5 minutes)
export const runtime = 'nodejs'; // Ensure Node.js runtime

// Reasoning step templates based on project type


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

                // 1. Fetch Market Data
                await sendEvent("step", { step: "Fetching real-time market market data (CoinGecko)...", index: 0, total: 3 });
                const marketSnapshot = await getMarketSnapshot();

                // 2. AI Inference
                await sendEvent("step", { step: "AI analyzing submission against market context...", index: 1, total: 3 });
                const res = await evaluateIdea(parsed.data, { market: marketSnapshot });

                // 3. Finalizing
                await sendEvent("step", { step: "Generating final report...", index: 2, total: 3 });

                // Send final result
                await sendEvent("complete", { result: res });
                await writer.close();

            } catch (error) {
                console.error("Streaming evaluation error:", error);
                const errorMessage = error instanceof Error ? error.message : "Unknown error";
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
