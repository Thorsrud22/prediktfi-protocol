
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const walletAddress = searchParams.get('address');

        if (!walletAddress) {
            return NextResponse.json({ ideas: [] });
        }

        const wallet = await prisma.wallet.findUnique({
            where: { address: walletAddress }
        });

        if (!wallet) {
            return NextResponse.json({ ideas: [] });
        }

        const ideas = await prisma.ideaEvaluation.findMany({
            where: { walletId: wallet.id },
            orderBy: { createdAt: 'desc' },
            select: {
                id: true,
                title: true,
                score: true,
                projectType: true,
                createdAt: true,
            }
        });

        return NextResponse.json({ ideas });
    } catch (error) {
        console.error('Error listing ideas:', error);
        return NextResponse.json(
            { error: 'Failed to list ideas' },
            { status: 500 }
        );
    }
}
