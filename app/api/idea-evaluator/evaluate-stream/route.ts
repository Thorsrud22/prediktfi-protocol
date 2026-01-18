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

            // Send reasoning steps with delays
            for (let i = 0; i < steps.length; i++) {
                await sendEvent("step", { step: steps[i], index: i, total: steps.length });

                // Variable delay: faster at start, slower in middle
                const baseDelay = 600;
                const variance = Math.random() * 400;
                const delay = i < 3 ? baseDelay : baseDelay + variance + 200;
                await new Promise(resolve => setTimeout(resolve, delay));
            }

            // Fetch market context
            await sendEvent("step", { step: "Fetching real-time market data...", index: steps.length, total: steps.length + 1 });
            const marketSnapshot = await getMarketSnapshot();

            // Run the actual evaluation
            await sendEvent("step", { step: "Running AI evaluation model...", index: steps.length + 1, total: steps.length + 2 });
            const result = await evaluateIdea(parsed.data, { market: marketSnapshot });

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
    return new Response(stream.readable, {
        headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
        },
    });
}
