/**
 * P&L Analytics API endpoint
 * Calculates cumulative simulated and realized P&L for a wallet
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const { walletId } = await request.json();

    if (!walletId) {
      return NextResponse.json({ error: 'Wallet ID is required' }, { status: 400 });
    }

    // Get 7-day cutoff
    const cutoff7d = new Date();
    cutoff7d.setDate(cutoff7d.getDate() - 7);

    // Get 30-day cutoff
    const cutoff30d = new Date();
    cutoff30d.setDate(cutoff30d.getDate() - 30);

    // Get all intents for the wallet with receipts
    const intents = await prisma.intent.findMany({
      where: { walletId },
      include: {
        receipts: {
          where: {
            status: { in: ['simulated', 'executed'] }
          },
          orderBy: { createdAt: 'asc' }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Calculate P&L metrics
    let simulatedPnl7d = 0;
    let simulatedPnl30d = 0;
    let realizedPnl7d = 0;
    let realizedPnl30d = 0;
    let tradeCount7d = 0;
    let tradeCount30d = 0;
    let accuracyData7d: Array<{ simulated: number; realized: number }> = [];
    let accuracyData30d: Array<{ simulated: number; realized: number }> = [];

    for (const intent of intents) {
      const receipts = intent.receipts;
      if (receipts.length === 0) continue;

      // Get the latest simulation and execution receipts
      const simReceipt = receipts.find(r => r.status === 'simulated');
      const execReceipt = receipts.find(r => r.status === 'executed');

      if (!simReceipt || !simReceipt.simJson) continue;

      const simData = JSON.parse(simReceipt.simJson);
      const isWithin7d = new Date(simReceipt.createdAt) >= cutoff7d;
      const isWithin30d = new Date(simReceipt.createdAt) >= cutoff30d;

      // Calculate simulated P&L based on current price vs expected price
      const currentPrice = simData.expectedPrice || 0;
      const sizeUsd = simData.portfolioAfter?.totalValueUsd || 0;
      
      // For simulation, we use a simple price change calculation
      // In a real implementation, you'd track actual price movements
      const simulatedPnl = intent.side === 'BUY' 
        ? (currentPrice - (currentPrice * 0.95)) * (sizeUsd / currentPrice) // Assume 5% gain
        : ((currentPrice * 1.05) - currentPrice) * (sizeUsd / currentPrice); // Assume 5% gain

      if (isWithin7d) {
        simulatedPnl7d += simulatedPnl;
        tradeCount7d++;
        accuracyData7d.push({ simulated: simulatedPnl, realized: 0 });
      }

      if (isWithin30d) {
        simulatedPnl30d += simulatedPnl;
        tradeCount30d++;
        accuracyData30d.push({ simulated: simulatedPnl, realized: 0 });
      }

      // Calculate realized P&L if executed
      if (execReceipt && execReceipt.execJson) {
        const execData = JSON.parse(execReceipt.execJson);
        const realizedPnl = execData.realizedPrice 
          ? (execData.realizedPrice - currentPrice) * (sizeUsd / currentPrice)
          : 0;

        if (isWithin7d) {
          realizedPnl7d += realizedPnl;
          // Update accuracy data with realized P&L
          const dataIndex = accuracyData7d.length - 1;
          if (dataIndex >= 0) {
            accuracyData7d[dataIndex].realized = realizedPnl;
          }
        }

        if (isWithin30d) {
          realizedPnl30d += realizedPnl;
          // Update accuracy data with realized P&L
          const dataIndex = accuracyData30d.length - 1;
          if (dataIndex >= 0) {
            accuracyData30d[dataIndex].realized = realizedPnl;
          }
        }
      }
    }

    // Calculate accuracy based on correlation between simulated and realized P&L
    const calculateAccuracy = (data: Array<{ simulated: number; realized: number }>) => {
      if (data.length === 0) return 0;
      
      let correctDirection = 0;
      data.forEach(({ simulated, realized }) => {
        if ((simulated >= 0 && realized >= 0) || (simulated < 0 && realized < 0)) {
          correctDirection++;
        }
      });
      
      return (correctDirection / data.length) * 100;
    };

    const accuracy7d = calculateAccuracy(accuracyData7d);
    const accuracy30d = calculateAccuracy(accuracyData30d);

    return NextResponse.json({
      simulatedPnl7d: Math.round(simulatedPnl7d * 100) / 100,
      simulatedPnl30d: Math.round(simulatedPnl30d * 100) / 100,
      realizedPnl7d: Math.round(realizedPnl7d * 100) / 100,
      realizedPnl30d: Math.round(realizedPnl30d * 100) / 100,
      tradeCount7d,
      tradeCount30d,
      accuracy7d: Math.round(accuracy7d * 10) / 10,
      accuracy30d: Math.round(accuracy30d * 10) / 10
    });

  } catch (error) {
    console.error('Error calculating P&L data:', error);
    return NextResponse.json(
      { error: 'Failed to calculate P&L data' },
      { status: 500 }
    );
  }
}
