import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const secret = searchParams.get('secret');

    if (secret !== 'predikt-seed-2026') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const codes = await prisma.inviteCode.findMany();
        return NextResponse.json({
            success: true,
            count: codes.length,
            codes: codes.map(c => ({
                code: c.code,
                isActive: c.isActive,
                used: c.usedCount,
                max: c.maxUses
            })),
            env: process.env.NODE_ENV,
            dbUrl: process.env.DATABASE_URL
        });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
