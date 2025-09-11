import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const walletId = searchParams.get('walletId');

    if (!walletId) {
      return NextResponse.json(
        { error: 'Wallet ID is required' },
        { status: 400 }
      );
    }

    // For now, return mock data since we don't have alert rules in the database yet
    const mockRules = [
      {
        id: 'rule1',
        walletId: walletId,
        name: 'Price Drop Alert',
        ruleJson: {
          type: 'price_drop',
          threshold: 10,
          timeWindow: '1h',
          asset: 'portfolio'
        },
        channel: 'inapp',
        enabled: true,
        createdAt: new Date().toISOString()
      },
      {
        id: 'rule2',
        walletId: walletId,
        name: 'High Volatility Alert',
        ruleJson: {
          type: 'volatility',
          threshold: 25,
          timeWindow: '24h',
          asset: 'SOL'
        },
        channel: 'email',
        enabled: true,
        createdAt: new Date().toISOString()
      }
    ];

    return NextResponse.json({
      success: true,
      data: mockRules
    });

  } catch (error) {
    console.error('Error fetching alert rules:', error);
    return NextResponse.json(
      { error: 'Failed to fetch alert rules' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { walletId, name, ruleJson, channel, target } = await request.json();

    if (!walletId || !name || !ruleJson) {
      return NextResponse.json(
        { error: 'Wallet ID, name, and rule JSON are required' },
        { status: 400 }
      );
    }

    // For now, return mock success since we don't have alert rules in the database yet
    const newRule = {
      id: `rule_${Date.now()}`,
      walletId,
      name,
      ruleJson,
      channel: channel || 'inapp',
      target: target || null,
      enabled: true,
      createdAt: new Date().toISOString()
    };

    return NextResponse.json({
      success: true,
      data: newRule
    });

  } catch (error) {
    console.error('Error creating alert rule:', error);
    return NextResponse.json(
      { error: 'Failed to create alert rule' },
      { status: 500 }
    );
  }
}
