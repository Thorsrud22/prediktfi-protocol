import { NextResponse } from 'next/server';

export async function GET() {
  const status = {
    status: 'healthy',
    environment: process.env.NEXT_PUBLIC_APP_ENV || 'development',
    service: 'predikt-ai-studio',
    version: '2.0.0-ai-studio-e8',
    timestamp: new Date().toISOString(),
    build: {
      commitSha: process.env.VERCEL_GIT_COMMIT_SHA || 'e8_stable',
      branch: process.env.VERCEL_GIT_COMMIT_REF || 'release_e8',
      buildTime: process.env.BUILD_TIME || new Date().toISOString(),
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
