/**
 * Proposal API for URL/TEXT Resolution
 * POST /api/resolve/propose - Generate resolution proposals for manual review
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '../../../lib/prisma';
import { resolveUrlInsight, parseUrlConfig } from '../../../../lib/resolvers/url';
import { resolveTextInsight, parseTextConfig } from '../../../../lib/resolvers/text';
import { withRateLimit } from '../../../lib/ratelimit';

const ProposeRequestSchema = z.object({
  insightId: z.string().min(1),
  actualText: z.string().optional(), // For text resolution
});

export interface ProposalResponse {
  insightId: string;
  canonical: string;
  resolverKind: 'URL' | 'TEXT';
  proposal: {
    result: 'YES' | 'NO' | null;
    confidence: number;
    reasoning: string;
    evidence: Record<string, any>;
  };
  requiresManualReview: boolean;
  createdAt: string;
}

export async function POST(request: NextRequest) {
  return await withRateLimit(request, async () => {
    try {
      const body = await request.json();
      const { insightId, actualText } = ProposeRequestSchema.parse(body);
      
      // Fetch insight from database
      const insight = await prisma.insight.findUnique({
        where: { id: insightId },
        select: {
          id: true,
          canonical: true,
          resolverKind: true,
          resolverRef: true,
          status: true,
          deadline: true
        }
      });
      
      if (!insight) {
        return NextResponse.json(
          { error: 'Insight not found' },
          { status: 404 }
        );
      }
      
      // Only allow proposals for URL and TEXT resolvers
      if (!insight.resolverKind || !['URL', 'TEXT'].includes(insight.resolverKind)) {
        return NextResponse.json(
          { error: 'Proposals only supported for URL and TEXT resolvers' },
          { status: 400 }
        );
      }
      
      // Check if insight is eligible for resolution
      if (insight.status === 'RESOLVED') {
        return NextResponse.json(
          { error: 'Insight is already resolved' },
          { status: 400 }
        );
      }
      
      if (!insight.canonical || !insight.resolverRef) {
        return NextResponse.json(
          { error: 'Insight missing required fields for resolution' },
          { status: 400 }
        );
      }
      
      let proposalResult;
      
      try {
        if (insight.resolverKind === 'URL') {
          const config = parseUrlConfig(insight.resolverRef);
          proposalResult = await resolveUrlInsight(insight.canonical, config);
        } else if (insight.resolverKind === 'TEXT') {
          const config = parseTextConfig(insight.resolverRef);
          proposalResult = await resolveTextInsight(insight.canonical, config, actualText);
        } else {
          throw new Error(`Unsupported resolver kind: ${insight.resolverKind}`);
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        return NextResponse.json(
          { error: `Resolution failed: ${errorMessage}` },
          { status: 422 }
        );
      }
      
      // Determine if manual review is required
      const requiresManualReview = proposalResult.proposed === null || proposalResult.confidence < 0.8;
      
      const response: ProposalResponse = {
        insightId: insight.id,
        canonical: insight.canonical,
        resolverKind: insight.resolverKind as 'URL' | 'TEXT',
        proposal: {
          result: proposalResult.proposed,
          confidence: proposalResult.confidence,
          reasoning: proposalResult.reasoning,
          evidence: proposalResult.evidence
        },
        requiresManualReview,
        createdAt: new Date().toISOString()
      };
      
      return NextResponse.json(response);
      
    } catch (error) {
      console.error('Proposal API error:', error);
      
      if (error instanceof z.ZodError) {
        return NextResponse.json(
          { error: 'Invalid request payload', details: error.errors },
          { status: 400 }
        );
      }
      
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  }, { plan: 'free', skipForDevelopment: true });
}

export async function GET(request: NextRequest) {
  // Get proposal status for an insight
  try {
    const { searchParams } = new URL(request.url);
    const insightId = searchParams.get('insightId');
    
    if (!insightId) {
      return NextResponse.json(
        { error: 'Missing insightId parameter' },
        { status: 400 }
      );
    }
    
    const insight = await prisma.insight.findUnique({
      where: { id: insightId },
      select: {
        id: true,
        canonical: true,
        resolverKind: true,
        resolverRef: true,
        status: true,
        deadline: true,
        outcomes: {
          orderBy: { decidedAt: 'desc' },
          take: 1
        }
      }
    });
    
    if (!insight) {
      return NextResponse.json(
        { error: 'Insight not found' },
        { status: 404 }
      );
    }
    
    const canPropose = insight.resolverKind && ['URL', 'TEXT'].includes(insight.resolverKind) && 
                      insight.status !== 'RESOLVED';
    
    const response = {
      insightId: insight.id,
      canonical: insight.canonical,
      resolverKind: insight.resolverKind,
      status: insight.status,
      canPropose,
      hasOutcome: insight.outcomes.length > 0,
      outcome: insight.outcomes.length > 0 ? {
        result: insight.outcomes[0].result,
        decidedBy: insight.outcomes[0].decidedBy,
        decidedAt: insight.outcomes[0].decidedAt.toISOString()
      } : null
    };
    
    return NextResponse.json(response);
    
  } catch (error) {
    console.error('Get proposal status error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
