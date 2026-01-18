import { NextRequest, NextResponse } from "next/server";
import { openai } from "@/lib/openaiClient";

export const runtime = "edge";

const COACH_SYSTEM_PROMPT = `
You are an elite startup mentor and DeFi architect. Your goal is to help a founder refine their pitch AS THEY WRITE IT.
You will receive a partial draft of a Web3/DeFi idea.
Your task:
1. Identify ONE distinct area that is vague, missing, or weak (e.g., revenue model, token utility, technical feasibility).
2. Provide a single, punchy question or tip to prompt the user to fill that gap.
3. Keep it under 20 words.
4. Tone: Helpful, smart, "institutional degen".
5. If the text is too short (< 10 words) or looks complete/solid, return NOTHING (empty string).
`;

export async function POST(request: NextRequest) {
    try {
        const { text, field } = await request.json();

        if (!text || text.length < 15) {
            return NextResponse.json({ suggestion: null });
        }

        const response = await openai().chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
                { role: "system", content: COACH_SYSTEM_PROMPT },
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
