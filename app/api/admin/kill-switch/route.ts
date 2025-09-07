/**
 * Kill switch admin API
 * GET /api/admin/kill-switch - Get status
 * POST /api/admin/kill-switch - Activate/deactivate
 */

import { NextRequest, NextResponse } from 'next/server';
import { killSwitchService } from '../../../lib/kill-switch';

export async function GET(request: NextRequest) {
  try {
    // In production, add admin authentication here
    const status = killSwitchService.getStatus();
    const uiConfig = killSwitchService.getUIConfig();
    const healthCheck = killSwitchService.healthCheck();

    return NextResponse.json({
      success: true,
      data: {
        status,
        uiConfig,
        healthCheck
      }
    });

  } catch (error) {
    console.error('Kill switch status error:', error);
    return NextResponse.json(
      { error: 'Failed to get kill switch status' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // In production, add admin authentication here
    const body = await request.json();
    const { action, reason, scope, activatedBy } = body;

    if (action === 'activate') {
      if (!reason) {
        return NextResponse.json({
          error: 'Reason is required for activation'
        }, { status: 400 });
      }

      killSwitchService.activate(
        reason,
        scope || 'all',
        activatedBy || 'admin'
      );

      return NextResponse.json({
        success: true,
        message: 'Kill switch activated',
        status: killSwitchService.getStatus()
      });

    } else if (action === 'deactivate') {
      killSwitchService.deactivate(activatedBy || 'admin');

      return NextResponse.json({
        success: true,
        message: 'Kill switch deactivated',
        status: killSwitchService.getStatus()
      });

    } else if (action === 'emergency') {
      if (!reason) {
        return NextResponse.json({
          error: 'Reason is required for emergency shutdown'
        }, { status: 400 });
      }

      killSwitchService.emergencyShutdown(
        reason,
        activatedBy || 'emergency'
      );

      return NextResponse.json({
        success: true,
        message: 'Emergency shutdown activated',
        status: killSwitchService.getStatus()
      });

    } else {
      return NextResponse.json({
        error: 'Invalid action. Use: activate, deactivate, or emergency'
      }, { status: 400 });
    }

  } catch (error) {
    console.error('Kill switch action error:', error);
    return NextResponse.json(
      { error: 'Failed to perform kill switch action' },
      { status: 500 }
    );
  }
}
