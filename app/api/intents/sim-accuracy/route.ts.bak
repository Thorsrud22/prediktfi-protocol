/**
 * Simulation Accuracy API endpoint
 * Returns 30d and 7d simulation accuracy for a wallet/trading pair
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const { walletId, base, quote } = await request.json();

    if (!walletId || !base || !quote) {
      return NextResponse.json({ error: 'Wallet ID, base, and quote are required' }, { status: 400 });
    }

    // Get 7-day cutoff
    const cutoff7d = new Date();
    cutoff7d.setDate(cutoff7d.getDate() - 7);

    // Get 30-day cutoff
    const cutoff30d = new Date();
    cutoff30d.setDate(cutoff30d.getDate() - 30);

    // Get executed receipts for the trading pair
    const receipts30d = await prisma.intentReceipt.findMany({
      where: {
        status: 'executed',
        createdAt: { gte: cutoff30d },
        intent: {
          walletId,
          base,
          quote
        }
      },
      include: {
        intent: true
      },
      orderBy: { createdAt: 'desc' }
    });

    const receipts7d = receipts30d.filter(r => r.createdAt >= cutoff7d);

    // Calculate accuracy for 30 days
    const accuracy30d = calculateAccuracy(receipts30d);
    
    // Calculate accuracy for 7 days
    const accuracy7d = calculateAccuracy(receipts7d);

    // Determine confidence level
    const confidence = receipts30d.length >= 10 ? 'high' : receipts30d.length >= 5 ? 'medium' : 'low';

    return NextResponse.json({
      accuracy30d: Math.round(accuracy30d * 10) / 10,
      accuracy7d: Math.round(accuracy7d * 10) / 10,
      confidence,
      totalExecutions30d: receipts30d.length,
      totalExecutions7d: receipts7d.length
    });

  } catch (error) {
    console.error('Error calculating simulation accuracy:', error);
    return NextResponse.json(
      { error: 'Failed to calculate simulation accuracy' },
      { status: 500 }
    );
  }
}

function calculateAccuracy(receipts: any[]): number {
  if (receipts.length === 0) return 0;

  let accurateCount = 0;
  let totalSlippageBps = 0;

  receipts.forEach(receipt => {
    if (receipt.simJson && receipt.execJson) {
      try {
        const simData = JSON.parse(receipt.simJson);
        const execData = JSON.parse(receipt.execJson);
        
        // Calculate slippage difference
        const slippageDiff = Math.abs((simData.estSlippageBps || 0) - (execData.slippageBps || 0));
        
        // Consider accurate if within 50 bps (0.5%)
        if (slippageDiff <= 50) {
          accurateCount++;
        }
        
        totalSlippageBps += execData.slippageBps || 0;
      } catch (error) {
        console.error('Error parsing receipt data:', error);
      }
    }
  });

  return (accurateCount / receipts.length) * 100;
}
