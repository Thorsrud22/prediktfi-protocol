import { NextResponse } from 'next/server';

export async function GET() {
  const commitSha = process.env.VERCEL_GIT_COMMIT_SHA || process.env.LOCAL_GIT_SHA || 'local-dev';
  const branch = process.env.VERCEL_GIT_COMMIT_REF || process.env.LOCAL_GIT_REF || 'local';
  const buildTime = process.env.BUILD_TIME || process.env.LOCAL_BUILD_TIME || 'local-dev';

  const status = {
    status: 'healthy',
    environment: process.env.NEXT_PUBLIC_APP_ENV || 'development',
    service: 'predikt-ai-studio',
    version: '2.0.0-ai-studio-e8',
    timestamp: new Date().toISOString(),
    build: {
      commitSha,
      branch,
      buildTime,
    },
    features: {
      aiAnalysis: true,
      predictionStudio: true,
      freemiumQuotas: true,
      proSubscription: true,
    }
  };

  return NextResponse.json(status);
}
