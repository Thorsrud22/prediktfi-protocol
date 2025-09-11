/**
 * Creator Backfill Operations API
 * POST /api/ops/creator-backfill - Start creator daily metrics backfill
 */

import { NextRequest, NextResponse } from 'next/server';
import { createHmac } from 'crypto';
import { spawn } from 'child_process';
import { join } from 'path';

export interface BackfillRequest {
  since: string;
  until: string;
  batchDays?: number;
  concurrency?: number;
}

export interface BackfillResponse {
  success: boolean;
  jobId: string;
  message: string;
  config: {
    since: string;
    until: string;
    batchDays: number;
    concurrency: number;
  };
  startedAt: string;
}

export interface BackfillStatus {
  jobId: string;
  status: 'running' | 'completed' | 'failed';
  progress: {
    batchesCompleted: number;
    totalBatches: number;
    recordsProcessed: number;
    errors: number;
  };
  startedAt: string;
  completedAt?: string;
  logs: string[];
}

// In-memory job tracking (in production, use Redis or database)
const activeJobs = new Map<string, BackfillStatus>();

/**
 * Verify HMAC signature for operations endpoint
 */
function verifyHMACSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  try {
    const expectedSignature = createHmac('sha256', secret)
      .update(payload)
      .digest('hex');
    
    return signature === expectedSignature;
  } catch (error) {
    console.error('HMAC verification error:', error);
    return false;
  }
}

/**
 * Generate unique job ID
 */
function generateJobId(): string {
  return `backfill_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Calculate number of batches for given date range and batch size
 */
function calculateBatchCount(since: Date, until: Date, batchDays: number): number {
  const diffTime = until.getTime() - since.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return Math.ceil(diffDays / batchDays);
}

/**
 * Start backfill job in background
 */
function startBackfillJob(
  jobId: string,
  config: BackfillRequest
): Promise<void> {
  return new Promise((resolve, reject) => {
    const scriptPath = join(process.cwd(), 'scripts', 'backfill-creator-daily.ts');
    
    // Build command arguments
    const args = [
      'tsx',
      scriptPath,
      `--since=${config.since}`,
      `--until=${config.until}`,
      `--batchDays=${config.batchDays || 3}`,
      `--concurrency=${config.concurrency || 3}`
    ];

    console.log(`🚀 Starting backfill job ${jobId}:`, args.join(' '));

    // Spawn the backfill script
    const child = spawn('pnpm', args, {
      cwd: process.cwd(),
      stdio: ['pipe', 'pipe', 'pipe'],
      env: { ...process.env }
    });

    const logs: string[] = [];
    let batchesCompleted = 0;
    let recordsProcessed = 0;
    let errors = 0;

    // Track job status
    const jobStatus: BackfillStatus = {
      jobId,
      status: 'running',
      progress: {
        batchesCompleted: 0,
        totalBatches: calculateBatchCount(
          new Date(config.since), 
          new Date(config.until), 
          config.batchDays || 3
        ),
        recordsProcessed: 0,
        errors: 0
      },
      startedAt: new Date().toISOString(),
      logs: []
    };

    activeJobs.set(jobId, jobStatus);

    // Handle stdout
    child.stdout?.on('data', (data) => {
      const output = data.toString();
      logs.push(output);
      jobStatus.logs.push(output);

      // Parse progress from output
      if (output.includes('Batch completed:')) {
        batchesCompleted++;
        jobStatus.progress.batchesCompleted = batchesCompleted;
        
        // Extract records processed and errors from log
        const recordsMatch = output.match(/(\d+) processed/);
        const errorsMatch = output.match(/(\d+) errors/);
        
        if (recordsMatch) {
          recordsProcessed += parseInt(recordsMatch[1], 10);
          jobStatus.progress.recordsProcessed = recordsProcessed;
        }
        
        if (errorsMatch) {
          errors += parseInt(errorsMatch[1], 10);
          jobStatus.progress.errors = errors;
        }
      }

      console.log(`[${jobId}] ${output.trim()}`);
    });

    // Handle stderr
    child.stderr?.on('data', (data) => {
      const error = data.toString();
      logs.push(error);
      jobStatus.logs.push(error);
      console.error(`[${jobId}] ${error.trim()}`);
    });

    // Handle process completion
    child.on('close', (code) => {
      jobStatus.status = code === 0 ? 'completed' : 'failed';
      jobStatus.completedAt = new Date().toISOString();
      
      if (code === 0) {
        console.log(`✅ Backfill job ${jobId} completed successfully`);
        resolve();
      } else {
        console.error(`❌ Backfill job ${jobId} failed with code ${code}`);
        reject(new Error(`Backfill job failed with exit code ${code}`));
      }
    });

    // Handle process errors
    child.on('error', (error) => {
      jobStatus.status = 'failed';
      jobStatus.completedAt = new Date().toISOString();
      console.error(`❌ Backfill job ${jobId} error:`, error);
      reject(error);
    });

    // Timeout after 1 hour
    setTimeout(() => {
      if (jobStatus.status === 'running') {
        console.error(`⏰ Backfill job ${jobId} timed out after 1 hour`);
        child.kill('SIGTERM');
        jobStatus.status = 'failed';
        jobStatus.completedAt = new Date().toISOString();
        reject(new Error('Backfill job timed out'));
      }
    }, 60 * 60 * 1000);
  });
}

export async function POST(request: NextRequest) {
  try {
    // Check for HMAC signature
    const signature = request.headers.get('x-ops-signature');
    const opsSecret = process.env.OPS_SECRET;
    
    if (!opsSecret) {
      console.error('OPS_SECRET not configured');
      return NextResponse.json(
        { error: 'Operations secret not configured' },
        { status: 500 }
      );
    }
    
    if (!signature) {
      return NextResponse.json(
        { error: 'Missing x-ops-signature header' },
        { status: 401 }
      );
    }
    
    // Get request body for signature verification
    const body = await request.text();
    
    if (!verifyHMACSignature(body, signature, opsSecret)) {
      console.error('Invalid HMAC signature');
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 401 }
      );
    }
    
    // Parse request body
    let requestData: BackfillRequest;
    try {
      requestData = JSON.parse(body);
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      );
    }
    
    // Validate required fields
    if (!requestData.since || !requestData.until) {
      return NextResponse.json(
        { error: 'Missing required fields: since, until' },
        { status: 400 }
      );
    }
    
    // Validate dates
    const since = new Date(requestData.since);
    const until = new Date(requestData.until);
    
    if (isNaN(since.getTime()) || isNaN(until.getTime())) {
      return NextResponse.json(
        { error: 'Invalid date format. Use YYYY-MM-DD' },
        { status: 400 }
      );
    }
    
    if (since >= until) {
      return NextResponse.json(
        { error: 'since date must be before until date' },
        { status: 400 }
      );
    }
    
    // Set defaults
    const batchDays = requestData.batchDays || 3;
    const concurrency = requestData.concurrency || 3;
    
    // Validate parameters
    if (batchDays < 1 || batchDays > 30) {
      return NextResponse.json(
        { error: 'batchDays must be between 1 and 30' },
        { status: 400 }
      );
    }
    
    if (concurrency < 1 || concurrency > 10) {
      return NextResponse.json(
        { error: 'concurrency must be between 1 and 10' },
        { status: 400 }
      );
    }
    
    // Generate job ID
    const jobId = generateJobId();
    
    // Start backfill job in background
    startBackfillJob(jobId, {
      since: requestData.since,
      until: requestData.until,
      batchDays,
      concurrency
    }).catch(error => {
      console.error(`Background job ${jobId} failed:`, error);
    });
    
    const response: BackfillResponse = {
      success: true,
      jobId,
      message: `Backfill job started for ${requestData.since} to ${requestData.until}`,
      config: {
        since: requestData.since,
        until: requestData.until,
        batchDays,
        concurrency
      },
      startedAt: new Date().toISOString()
    };
    
    console.log(`✅ Creator backfill job ${jobId} started`);
    
    return NextResponse.json(response, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
  } catch (error) {
    console.error('Creator backfill error:', error);
    
    return NextResponse.json(
      { 
        success: false,
        error: `Backfill failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        startedAt: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

/**
 * Get backfill job status
 */
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const jobId = url.searchParams.get('jobId');
    
    if (!jobId) {
      return NextResponse.json(
        { error: 'Missing jobId parameter' },
        { status: 400 }
      );
    }
    
    const jobStatus = activeJobs.get(jobId);
    
    if (!jobStatus) {
      return NextResponse.json(
        { error: 'Job not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(jobStatus, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
  } catch (error) {
    console.error('Get backfill status error:', error);
    
    return NextResponse.json(
      { error: 'Failed to get job status' },
      { status: 500 }
    );
  }
}

// Health check endpoint
export async function HEAD(request: NextRequest) {
  try {
    return new NextResponse(null, { 
      status: 200,
      headers: {
        'Cache-Control': 'no-cache'
      }
    });
  } catch (error) {
    console.error('Creator backfill health check failed:', error);
    return new NextResponse(null, { status: 503 });
  }
}
