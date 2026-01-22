import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const { walletId } = await request.json();

    if (!walletId) {
      return NextResponse.json(
        { error: 'Wallet ID is required' },
        { status: 400 }
      );
    }

    // Calculate P&L data for the wallet
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Get receipts for the wallet
    const receipts = await prisma.intentReceipt.findMany({
      where: {
        intent: {
          walletId: walletId
        },
        status: {
          in: ['simulated', 'executed']
        }
      },
      include: {
        intent: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Calculate 7-day metrics
    const receipts7d = receipts.filter(r => new Date(r.createdAt) >= sevenDaysAgo);
    const receipts30d = receipts.filter(r => new Date(r.createdAt) >= thirtyDaysAgo);

    // Calculate simulated P&L (based on current prices vs entry prices)
    const simulatedPnl7d = receipts7d.reduce((sum, receipt) => {
      if (receipt.realizedPx && receipt.intent.sizeJson) {
        const size = parseFloat(receipt.intent.sizeJson.toString());
        const pnl = receipt.intent.side === 'BUY'
          ? (receipt.realizedPx - parseFloat(receipt.intent.sizeJson.toString())) * size
          : (parseFloat(receipt.intent.sizeJson.toString()) - receipt.realizedPx) * size;
        return sum + pnl;
      }
      return sum;
    }, 0);

    const simulatedPnl30d = receipts30d.reduce((sum, receipt) => {
      if (receipt.realizedPx && receipt.intent.sizeJson) {
        const size = parseFloat(receipt.intent.sizeJson.toString());
        const pnl = receipt.intent.side === 'BUY'
          ? (receipt.realizedPx - parseFloat(receipt.intent.sizeJson.toString())) * size
          : (parseFloat(receipt.intent.sizeJson.toString()) - receipt.realizedPx) * size;
        return sum + pnl;
      }
      return sum;
    }, 0);

    // Calculate realized P&L (actual executed trades)
    const realizedPnl7d = receipts7d
      .filter(r => r.status === 'executed')
      .reduce((sum, receipt) => {
        if (receipt.realizedPx && receipt.intent.sizeJson) {
          const size = parseFloat(receipt.intent.sizeJson.toString());
          const pnl = receipt.intent.side === 'BUY'
            ? (receipt.realizedPx - parseFloat(receipt.intent.sizeJson.toString())) * size
            : (parseFloat(receipt.intent.sizeJson.toString()) - receipt.realizedPx) * size;
          return sum + pnl;
        }
        return sum;
      }, 0);

    const realizedPnl30d = receipts30d
      .filter(r => r.status === 'executed')
      .reduce((sum, receipt) => {
        if (receipt.realizedPx && receipt.intent.sizeJson) {
          const size = parseFloat(receipt.intent.sizeJson.toString());
          const pnl = receipt.intent.side === 'BUY'
            ? (receipt.realizedPx - parseFloat(receipt.intent.sizeJson.toString())) * size
            : (parseFloat(receipt.intent.sizeJson.toString()) - receipt.realizedPx) * size;
          return sum + pnl;
        }
        return sum;
      }, 0);

    // Calculate accuracy (simplified - based on profitable trades)
    const calculateAccuracy = (receipts: any[]) => {
      if (receipts.length === 0) return 0;
      const profitableTrades = receipts.filter(receipt => {
        if (receipt.realizedPx && receipt.intent.sizeJson) {
          const size = parseFloat(receipt.intent.sizeJson.toString());
          const pnl = receipt.intent.side === 'BUY'
            ? (receipt.realizedPx - parseFloat(receipt.intent.sizeJson.toString())) * size
            : (parseFloat(receipt.intent.sizeJson.toString()) - receipt.realizedPx) * size;
          return pnl > 0;
        }
        return false;
      }).length;
      return (profitableTrades / receipts.length) * 100;
    };

    const accuracy7d = calculateAccuracy(receipts7d);
    const accuracy30d = calculateAccuracy(receipts30d);

    const pnlData = {
      simulatedPnl7d,
      simulatedPnl30d,
      realizedPnl7d,
      realizedPnl30d,
      tradeCount7d: receipts7d.length,
      tradeCount30d: receipts30d.length,
      accuracy7d,
      accuracy30d
    };

    return NextResponse.json(pnlData);

  } catch (error) {
    console.error('Error fetching P&L data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch P&L data' },
      { status: 500 }
    );
  }
}
