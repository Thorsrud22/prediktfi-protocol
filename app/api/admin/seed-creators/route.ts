/**
 * Admin API - Seed Demo Creators
 * POST /api/admin/seed-creators - Seed demo creators for development
 */

import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export async function POST(request: NextRequest) {
  // Only allow in development
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json(
      { error: 'Not available in production' },
      { status: 403 }
    );
  }

  try {
    // Run the seed script
    const { stdout, stderr } = await execAsync('npm run db:seed:creators');
    
    if (stderr) {
      console.error('Seed script stderr:', stderr);
    }
    
    console.log('Seed script output:', stdout);
    
    return NextResponse.json({
      success: true,
      message: 'Demo creators seeded successfully',
      output: stdout
    });
    
  } catch (error) {
    console.error('Failed to seed creators:', error);
    return NextResponse.json(
      { 
        error: 'Failed to seed creators',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
