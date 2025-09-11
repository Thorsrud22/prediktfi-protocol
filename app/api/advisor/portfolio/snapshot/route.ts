import { NextRequest, NextResponse } from 'next/server';

interface PortfolioSnapshot {
  walletId: string;
  timestamp: string;
  totalValueUsd: number;
  holdings: Array<{
    asset: string;
    symbol: string;
    amount: number;
    valueUsd: number;
  }>;
  topPositions: Array<{
    asset: string;
    symbol: string;
    amount: number;
    valueUsd: number;
  }>;
  concentration: {
    hhi: number;
    top5Percent: number;
    stablecoinPercent: number;
  };
  risk: {
    drawdownFromAth: number;
    volatility: number;
    diversification: 'low' | 'medium' | 'high';
  };
}

interface RiskAssessment {
  overallRisk: 'low' | 'medium' | 'high' | 'critical';
  riskScore: number;
  riskFactors: Array<{
    type: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    description: string;
    impact: string;
    mitigation: string;
  }>;
  recommendations: Array<{
    priority: 'low' | 'medium' | 'high';
    action: string;
    description: string;
    expectedImpact: string;
  }>;
}

export async function POST(request: NextRequest) {
  try {
    const { walletAddress } = await request.json();

    if (!walletAddress) {
      return NextResponse.json(
        { error: 'Wallet address is required' },
        { status: 400 }
      );
    }

    // For now, return mock data since we don't have real portfolio data
    // In a real implementation, this would fetch from Solana RPC or a portfolio service
    const mockSnapshot: PortfolioSnapshot = {
      walletId: walletAddress,
      timestamp: new Date().toISOString(),
      totalValueUsd: 125000,
      holdings: [
        {
          asset: 'So11111111111111111111111111111111111111112',
          symbol: 'SOL',
          amount: 500,
          valueUsd: 75000
        },
        {
          asset: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
          symbol: 'USDC',
          amount: 30000,
          valueUsd: 30000
        },
        {
          asset: 'mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So',
          symbol: 'mSOL',
          amount: 100,
          valueUsd: 15000
        },
        {
          asset: 'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263',
          symbol: 'BONK',
          amount: 1000000,
          valueUsd: 5000
        }
      ],
      topPositions: [
        {
          asset: 'So11111111111111111111111111111111111111112',
          symbol: 'SOL',
          amount: 500,
          valueUsd: 75000
        },
        {
          asset: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
          symbol: 'USDC',
          amount: 30000,
          valueUsd: 30000
        },
        {
          asset: 'mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So',
          symbol: 'mSOL',
          amount: 100,
          valueUsd: 15000
        }
      ],
      concentration: {
        hhi: 0.45, // Herfindahl-Hirschman Index (0-1, higher = more concentrated)
        top5Percent: 85.0, // Top 5 assets as % of portfolio
        stablecoinPercent: 24.0 // Stablecoins as % of portfolio
      },
      risk: {
        drawdownFromAth: -15.2, // % drawdown from all-time high
        volatility: 0.35, // Annualized volatility
        diversification: 'medium' // low/medium/high
      }
    };

    const mockRiskAssessment: RiskAssessment = {
      overallRisk: 'medium',
      riskScore: 65,
      riskFactors: [
        {
          type: 'concentration',
          severity: 'medium',
          description: 'High concentration in SOL (60% of portfolio)',
          impact: 'Portfolio value highly correlated with SOL price movements',
          mitigation: 'Consider diversifying into other major cryptocurrencies'
        },
        {
          type: 'volatility',
          severity: 'medium',
          description: 'Above-average portfolio volatility (35% annualized)',
          impact: 'Higher risk of significant short-term losses',
          mitigation: 'Increase stablecoin allocation or add hedging strategies'
        },
        {
          type: 'liquidity',
          severity: 'low',
          description: 'Good liquidity with major tokens',
          impact: 'Easy to rebalance or exit positions if needed',
          mitigation: 'Maintain current liquidity profile'
        }
      ],
      recommendations: [
        {
          priority: 'high',
          action: 'Diversify SOL position',
          description: 'Reduce SOL allocation from 60% to 40% and spread across other major cryptocurrencies',
          expectedImpact: 'Reduce concentration risk by 20-30%'
        },
        {
          priority: 'medium',
          action: 'Add hedging strategy',
          description: 'Consider adding put options or inverse positions for downside protection',
          expectedImpact: 'Reduce portfolio volatility by 10-15%'
        },
        {
          priority: 'low',
          action: 'Optimize stablecoin allocation',
          description: 'Increase USDC allocation to 30-35% for better risk management',
          expectedImpact: 'Improve portfolio stability during market downturns'
        }
      ]
    };

    return NextResponse.json({
      success: true,
      data: {
        snapshot: mockSnapshot,
        riskAssessment: mockRiskAssessment
      }
    });

  } catch (error) {
    console.error('Portfolio snapshot error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch portfolio snapshot' },
      { status: 500 }
    );
  }
}
