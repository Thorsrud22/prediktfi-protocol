import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const secret = searchParams.get('secret');

    // Hardcoded temporary secret for the user to use
    if (secret !== 'predikt-seed-2026') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const codes = [
        { code: 'PREDIKT-BETA', maxUses: 1000 },
        { code: 'ALPHA-ALPHA', maxUses: 100 },
    ];

    try {
        const results = [];
        for (const item of codes) {
            const existing = await prisma.inviteCode.findUnique({
                where: { code: item.code },
            });

            if (!existing) {
                await prisma.inviteCode.create({
                    data: {
                        id: `prod-seed-${item.code.toLowerCase()}`,
                        code: item.code,
                        maxUses: item.maxUses,
                        isActive: true,
                    },
                });
                results.push(`Created ${item.code}`);
            } else {
                results.push(`Skipped ${item.code} (exists)`);
            }
        }

        return NextResponse.json({ success: true, results });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
