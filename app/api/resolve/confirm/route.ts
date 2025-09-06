/**
 * Confirmation API for Resolution Proposals
 * POST /api/resolve/confirm - Confirm or reject resolution proposals
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '../../../lib/prisma';
import { EVENT_TYPES, createEvent } from '../../../../lib/events';
import { withRateLimit } from '../../../lib/ratelimit';
import { updateProfileAggregates } from '../../../../lib/score';

const ConfirmRequestSchema = z.object({
  insightId: z.string().min(1),
  action: z.enum(['confirm', 'reject']),
  result: z.enum(['YES', 'NO', 'INVALID']).optional(),
  evidenceUrl: z.string().url().optional(),
  reasoning: z.string().max(500).optional(),
});

export async function POST(request: NextRequest) {
  return await withRateLimit(request, async () => {
    try {
      // TODO: Add authentication check
      // For now, we'll allow any request (demo purposes)
      
      const body = await request.json();
      const { insightId, action, result, evidenceUrl, reasoning } = ConfirmRequestSchema.parse(body);
      
      // Fetch insight from database
      const insight = await prisma.insight.findUnique({
        where: { id: insightId },
        select: {
          id: true,
          creatorId: true,
          canonical: true,
          resolverKind: true,
          resolverRef: true,
          status: true,
          outcomes: true
        }
      });
      
      if (!insight) {
        return NextResponse.json(
          { error: 'Insight not found' },
          { status: 404 }
        );
      }
      
      // Check if insight is already resolved
      if (insight.status === 'RESOLVED' || insight.outcomes.length > 0) {
        return NextResponse.json(
          { error: 'Insight is already resolved' },
          { status: 400 }
        );
      }
      
      // Only allow confirmation for URL and TEXT resolvers
      if (!insight.resolverKind || !['URL', 'TEXT'].includes(insight.resolverKind)) {
        return NextResponse.json(
          { error: 'Confirmation only supported for URL and TEXT resolvers' },
          { status: 400 }
        );
      }
      
      if (action === 'reject') {
        // Rejection - no outcome created, just log the event
        await createEvent('proposal_rejected', {
          insightId: insight.id,
          resolverKind: insight.resolverKind,
          reasoning: reasoning || 'User rejected proposal'
        });
        
        return NextResponse.json({
          success: true,
          action: 'rejected',
          message: 'Proposal rejected - insight remains unresolved'
        });
      }
      
      if (action === 'confirm') {
        if (!result) {
          return NextResponse.json(
            { error: 'Result is required when confirming' },
            { status: 400 }
          );
        }
        
        // Create outcome and update insight status in transaction
        await prisma.$transaction(async (tx) => {
          // Create outcome record
          await tx.outcome.create({
            data: {
              insightId: insight.id,
              result: result,
              evidenceUrl: evidenceUrl,
              decidedBy: 'USER', // Manual confirmation
              decidedAt: new Date()
            }
          });
          
          // Update insight status
          await tx.insight.update({
            where: { id: insight.id },
            data: { status: 'RESOLVED' }
          });
        });
        
        // Update creator profile aggregates if insight has a creator
        if (insight.creatorId) {
          try {
            await updateProfileAggregates(insight.creatorId);
          } catch (error) {
            console.error(`Failed to update profile aggregates for creator ${insight.creatorId}:`, error);
            // Don't fail the confirmation if profile update fails
          }
        }
        
        // Log events
        await createEvent(EVENT_TYPES.OUTCOME_RESOLVED, {
          insightId: insight.id,
          result: result,
          decidedBy: 'USER',
          resolverKind: insight.resolverKind,
          confirmed: true
        });
        
        await createEvent('proposal_confirmed', {
          insightId: insight.id,
          result: result,
          evidenceUrl: evidenceUrl,
          reasoning: reasoning
        });
        
        return NextResponse.json({
          success: true,
          action: 'confirmed',
          result: result,
          message: 'Proposal confirmed - insight resolved',
          insightId: insight.id
        });
      }
      
      return NextResponse.json(
        { error: 'Invalid action' },
        { status: 400 }
      );
      
    } catch (error) {
      console.error('Confirmation API error:', error);
      
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
