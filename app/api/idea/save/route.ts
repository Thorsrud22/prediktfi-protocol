
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const saveSchema = z.object({
    submission: z.any(),
    result: z.any(),
    walletAddress: z.string().optional(),
});

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { submission, result, walletAddress } = saveSchema.parse(body);

        let dbWalletId: string | undefined;

        // If walletAddress is provided, find or create the wallet in DB
        if (walletAddress) {
            const wallet = await prisma.wallet.upsert({
                where: { address: walletAddress },
                update: {},
                create: {
                    address: walletAddress,
                    // Only required fields based on schema, assuming defaults handle the rest
                },
            });
            dbWalletId = wallet.id;
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

        return NextResponse.json({ success: true, id: savedIdea.id });
    } catch (error) {
        console.error('Error saving idea:', error);
        return NextResponse.json(
            { error: 'Failed to save idea' },
            { status: 500 }
        );
    }
}
