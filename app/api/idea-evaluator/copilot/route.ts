import { NextRequest, NextResponse } from "next/server";
import { openai } from "@/lib/openaiClient";
import { checkRateLimit } from "@/lib/ratelimit";
import { copilotSubmissionSchema } from "@/lib/ideaSchema";

export const runtime = "nodejs";

// ... (PROMPTS remain here) 

const BASE_PROMPT = `
You are an elite expert in Web3. Your goal is to help a founder refine their pitch AS THEY WRITE IT.
You will receive a partial draft of an idea.
Your task:
1. Identify ONE distinct area that is vague, missing, or weak.
2. Provide a single, punchy question or tip to prompt the user to fill that gap.
3. Keep it under 20 words.
4. If the text is too short (< 10 words) or looks complete/solid, return NOTHING (empty string).
`;

const PERSONAS: Record<string, string> = {
    memecoin: `ROLE: Viral Strategist.
    FOCUS: Narrative, community tribes, attention economy, "stickiness", ticker symbols.
    TONE: chaotic good, internet-native.`,

    defi: `ROLE: DeFi Architect.
    FOCUS: Yield sustainability, mechanism design, risk management, liquidity flywheels.
    TONE: technical, precise, security-focused.`,

    ai: `ROLE: AI Research Director.
    FOCUS: Data moats, compute resources, model differentiation, business value vs hype.
    TONE: analytical, forward-thinking.`
};

export async function POST(request: NextRequest) {
    try {
        // Rate Limit Check
        const rateLimitRes = await checkRateLimit(request, { plan: 'copilot' });
        if (rateLimitRes) return rateLimitRes;

        const body = await request.json();
        const parsed = copilotSubmissionSchema.safeParse(body);

        if (!parsed.success) {
            return NextResponse.json({ suggestion: null }, { status: 400 });
        }

        const { text, field, projectType } = parsed.data;

        if (text.length < 15) {
            return NextResponse.json({ suggestion: null });
        }

        const persona = PERSONAS[projectType as string] || "ROLE: General Startup Mentor.\nTONE: Helpful, direct.";
        const systemPrompt = `${BASE_PROMPT}\n\n${persona}`;

        const response = await openai().chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: `Field: ${field}\nDraft: "${text}"` }
            ],
            max_tokens: 60,
            temperature: 0.7,
        });

        const suggestion = response.choices[0]?.message?.content?.trim() || null;

        // Filter out "None" or empty responses
        if (!suggestion || suggestion.toLowerCase().includes("none")) {
            return NextResponse.json({ suggestion: null });
        }

        return NextResponse.json({ suggestion });
    } catch (error) {
        console.error("Co-pilot error:", error);
        return NextResponse.json({ suggestion: null }, { status: 500 });
    }
}
