import { NextRequest, NextResponse } from "next/server";
import { ideaSubmissionSchema } from "@/lib/ideaSchema";
import { evaluateIdea } from "@/lib/ai/evaluator";

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

        const result = await evaluateIdea(parsed.data);
        return NextResponse.json({ result });
    } catch (error) {
        console.error("Error evaluating idea:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
