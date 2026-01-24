
import { NextRequest, NextResponse } from 'next/server';
import { generateIdeaImage } from '@/lib/ai/imageGenerator';

export const runtime = 'nodejs'; // Image generation might take longer or use specific node APIs

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { prompt, projectType } = body;

        if (!prompt) {
            return NextResponse.json(
                { error: 'Prompt is required' },
                { status: 400 }
            );
        }

        // Enhance prompt for professional, non-generic results
        // We want to avoid the "glowing brain/neon network" AI trope.
        const styleGuide = "Style: Minimalist, premium, abstract geometric, high-end corporate identity. Use negative space, flat vector keys (or subtle gradient), and heavy professional typography concepts. NO glowing neon lines, NO complex neural networks, NO generic robot hands. Think: Stripe, Vercel, Linear, or top-tier crypto protocol branding.";

        const enhancedPrompt = `Design a professional brand identity visualization for a ${projectType || 'crypto'} project. 
        
        Project Context: ${prompt}
        
        ${styleGuide}
        
        Output: A single, clean, high-impact visual center-composed on a solid or subtle gradient background. Professional grade only.`;

        const { imageData, error: genError } = await generateIdeaImage(enhancedPrompt);

        if (genError || !imageData) {
            return NextResponse.json(
                { error: genError || 'Failed to generate image' },
                { status: genError?.includes('Quota') ? 429 : 500 }
            );
        }

        return NextResponse.json({ imageData });

    } catch (error) {
        console.error("Image generation API error:", error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
