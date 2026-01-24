import { NextRequest, NextResponse } from "next/server";
import { openai } from "@/lib/openaiClient";
import { checkRateLimit } from "@/lib/ratelimit";
import { copilotSubmissionSchema } from "@/lib/ideaSchema";
import { COPILOT_BASE_PROMPT, COPILOT_PERSONAS, COPILOT_DEFAULT_PERSONA, COPILOT_MODEL } from "@/lib/ai/prompts";

export const runtime = "nodejs";

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

        const persona = COPILOT_PERSONAS[projectType as string] || COPILOT_DEFAULT_PERSONA;
        const systemPrompt = `${COPILOT_BASE_PROMPT}\n\n${persona}`;

        const response = await openai().chat.completions.create({
            model: COPILOT_MODEL,
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
