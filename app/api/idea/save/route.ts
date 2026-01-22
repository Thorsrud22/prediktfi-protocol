
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { z } from 'zod';

const saveSchema = z.object({
    submission: z.any(),
    result: z.any(),
    walletAddress: z.string().optional(),
});

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        console.log("Saving Idea - Body:", JSON.stringify(body, null, 2));

        const parsed = saveSchema.safeParse(body);
        if (!parsed.success) {
            console.error("Validation failed:", parsed.error);
            return NextResponse.json(
                { error: 'Invalid payload', issues: parsed.error },
                { status: 400 }
            );
        }

        const { submission, result, walletAddress } = parsed.data;

        let dbWalletId: string | undefined;

        // If walletAddress is provided, find or create the wallet in DB
        if (walletAddress) {
            try {
                const wallet = await prisma.wallet.upsert({
                    where: { address: walletAddress },
                    update: {},
                    create: {
                        address: walletAddress,
                    },
                });
                dbWalletId = wallet.id;
            } catch (err) {
                console.error("Error upserting wallet:", err);
                // Continue without wallet link if this fails? Or fail?
                // Let's fail for now to be safe
                throw err;
            }
        }

        const savedIdea = await prisma.ideaEvaluation.create({
            data: {
                walletId: dbWalletId,
                submissionJson: JSON.stringify(submission),
                resultJson: JSON.stringify(result),
                score: result.overallScore,
                title: result.summary.title,
                projectType: submission.projectType,
            },
        });

        console.log("Idea saved successfully:", savedIdea.id);
        return NextResponse.json({ success: true, id: savedIdea.id });
    } catch (error) {
        console.error('Error saving idea:', error);
        return NextResponse.json(
            { error: 'Failed to save idea' },
            { status: 500 }
        );
    }
}
