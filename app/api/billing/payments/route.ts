import { NextRequest, NextResponse } from 'next/server';
import { getWalletIdentifier } from '@/lib/rate-limit-wallet';
import { prisma } from '@/app/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const walletId = getWalletIdentifier(request);
    if (!walletId) {
      return NextResponse.json({ error: 'Wallet not connected' }, { status: 401 });
    }

    const payments = await prisma.payment.findMany({
      where: { userId: walletId },
      orderBy: { receivedAt: 'desc' },
      take: 10, // Last 10 payments
    });

    return NextResponse.json({ payments });
  } catch (error) {
    console.error('Error fetching payments:', error);
    return NextResponse.json({ error: 'Failed to fetch payments' }, { status: 500 });
  }
}
