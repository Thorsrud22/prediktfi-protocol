// app/api/advisor/portfolio/snapshot/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { HoldingsService } from '../../../../lib/advisor/holdings';
import { RiskAnalyzer } from '../../../../lib/advisor/risk';
import { isFeatureEnabled } from '../../../../lib/flags';
import { prisma } from '../../../../lib/prisma';

export async function GET(request: NextRequest) {
  // Check if advisor feature is enabled
  if (!isFeatureEnabled('ADVISOR')) {
    return NextResponse.json({ error: 'Advisor feature not enabled' }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const walletAddress = searchParams.get('address');
    
    if (!walletAddress) {
      return NextResponse.json({ error: 'Wallet address required' }, { status: 400 });
    }

    // Validate Solana address
    if (!HoldingsService.isValidSolanaAddress(walletAddress)) {
      return NextResponse.json({ error: 'Invalid Solana address' }, { status: 400 });
    }

    // Get or create wallet record
    let wallet = await prisma.wallet.findUnique({
      where: { address: walletAddress }
    });

    if (!wallet) {
      wallet = await prisma.wallet.create({
        data: {
          address: walletAddress,
          chain: 'solana'
        }
      });
    }

    // Get portfolio snapshot
    const snapshot = await HoldingsService.getPortfolioSnapshot(walletAddress);
    
    // Perform risk analysis
    const riskAssessment = RiskAnalyzer.analyzePortfolioRisk(snapshot);
    
    // Save snapshot to database
    await prisma.holdingSnapshot.createMany({
      data: snapshot.holdings.map(holding => ({
        walletId: wallet.id,
        asset: holding.asset,
        amount: holding.amount.toString(),
        valueUsd: holding.valueUsd.toString()
      }))
    });

    return NextResponse.json({
      success: true,
      data: {
        snapshot,
        riskAssessment,
        wallet: {
          id: wallet.id,
          address: wallet.address,
          chain: wallet.chain
        }
      }
    });

  } catch (error) {
    console.error('Error getting portfolio snapshot:', error);
    return NextResponse.json(
      { error: 'Failed to get portfolio snapshot' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  // Check if advisor feature is enabled
  if (!isFeatureEnabled('ADVISOR')) {
    return NextResponse.json({ error: 'Advisor feature not enabled' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { walletAddress } = body;
    
    if (!walletAddress) {
      return NextResponse.json({ error: 'Wallet address required' }, { status: 400 });
    }

    // Validate Solana address
    if (!HoldingsService.isValidSolanaAddress(walletAddress)) {
      return NextResponse.json({ error: 'Invalid Solana address' }, { status: 400 });
    }

    // Get or create wallet record
    let wallet = await prisma.wallet.findUnique({
      where: { address: walletAddress }
    });

    if (!wallet) {
      wallet = await prisma.wallet.create({
        data: {
          address: walletAddress,
          chain: 'solana'
        }
      });
    }

    // Get portfolio snapshot
    const snapshot = await HoldingsService.getPortfolioSnapshot(walletAddress);
    
    // Perform risk analysis
    const riskAssessment = RiskAnalyzer.analyzePortfolioRisk(snapshot);
    
    // Save snapshot to database
    await prisma.holdingSnapshot.createMany({
      data: snapshot.holdings.map(holding => ({
        walletId: wallet.id,
        asset: holding.asset,
        amount: holding.amount.toString(),
        valueUsd: holding.valueUsd.toString()
      }))
    });

    return NextResponse.json({
      success: true,
      data: {
        snapshot,
        riskAssessment,
        wallet: {
          id: wallet.id,
          address: wallet.address,
          chain: wallet.chain
        }
      }
    });

  } catch (error) {
    console.error('Error creating portfolio snapshot:', error);
    return NextResponse.json(
      { error: 'Failed to create portfolio snapshot' },
      { status: 500 }
    );
  }
}
