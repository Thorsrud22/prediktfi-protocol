
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const address = searchParams.get('address');

        if (!address) {
            return NextResponse.json(
                { error: 'Address is required' },
                { status: 400 }
            );
        }

        // Find wallet first
        const wallet = await prisma.wallet.findUnique({
            where: { address },
        });

        if (!wallet) {
            // Return zero stats for unknown wallet
            return NextResponse.json({
                totalEvaluations: 0,
                averageScore: 0,
                lastActivity: null
            });
        }

        // Aggregate stats
        const aggregations = await prisma.ideaEvaluation.aggregate({
            where: { walletId: wallet.id },
            _count: {
                id: true,
            },
            _avg: {
                score: true,
            },
            _max: {
                createdAt: true, // Latest activity
            }
        });

        const totalEvaluations = aggregations._count.id;
        const averageScore = Math.round(aggregations._avg.score || 0);
        const lastActivity = aggregations._max.createdAt;

        return NextResponse.json({
            totalEvaluations,
            averageScore,
            lastActivity
        });

    } catch (error) {
        console.error('Error fetching account stats:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
