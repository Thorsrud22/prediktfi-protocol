import { NextRequest, NextResponse } from 'next/server';
import { ideaSubmissionSchema } from '@/lib/ideaSchema';
import { z } from 'zod';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        // Validate the request body against the schema
        const validatedData = ideaSubmissionSchema.parse(body);

        // Simulate processing delay
        await new Promise((resolve) => setTimeout(resolve, 1000));

        // Return a mock response
        return NextResponse.json({
            evaluationId: `eval_${Date.now()}`,
            data: validatedData,
            message: 'Idea submitted successfully for preview',
        });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { message: 'Validation failed', errors: error.errors },
                { status: 400 }
            );
        }

        return NextResponse.json(
            { message: 'Internal server error' },
            { status: 500 }
        );
    }
}
