import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';

/**
 * GET /api/admin/daily-challenge
 * Get all insights that can be featured as daily challenges
 */
export async function GET(request: NextRequest) {
  try {
    // In production, add admin auth check here
    // const isAdmin = await checkAdminAuth(request);
    // if (!isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // Get all OPEN insights that could be featured
    const insights = await prisma.insight.findMany({
      where: {
        status: 'OPEN',
        deadline: {
          gte: new Date(), // Only future predictions
        },
      },
      include: {
        creator: {
          select: {
            id: true,
            handle: true,
            score: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 100, // Limit to recent 100
    });

    // Get current and upcoming featured challenges
    const featuredChallenges = await prisma.insight.findMany({
      where: {
        featuredDate: {
          not: null,
        },
      },
      include: {
        creator: {
          select: {
            handle: true,
          },
        },
      },
      orderBy: {
        featuredDate: 'desc',
      },
      take: 30, // Last 30 days
    });

    return NextResponse.json({
      insights: insights.map(insight => ({
        id: insight.id,
        question: insight.question,
        category: insight.category,
        probability: insight.probability,
        confidence: insight.confidence,
        deadline: insight.deadline,
        createdAt: insight.createdAt,
        creator: insight.creator,
        featuredDate: insight.featuredDate,
      })),
      featuredChallenges: featuredChallenges.map(fc => ({
        id: fc.id,
        question: fc.question,
        category: fc.category,
        featuredDate: fc.featuredDate,
        creator: fc.creator,
      })),
    });
  } catch (error) {
    console.error('Admin daily challenge GET error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch insights' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/daily-challenge
 * Set an insight as the daily challenge for a specific date
 * Body: { insightId: string, date: string (ISO date) }
 */
export async function POST(request: NextRequest) {
  try {
    // In production, add admin auth check here
    // const isAdmin = await checkAdminAuth(request);
    // if (!isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const { insightId, date } = body;

    if (!insightId || !date) {
      return NextResponse.json(
        { error: 'Missing insightId or date' },
        { status: 400 }
      );
    }

    // Parse and validate date
    const featuredDate = new Date(date);
    featuredDate.setUTCHours(0, 0, 0, 0);

    if (isNaN(featuredDate.getTime())) {
      return NextResponse.json(
        { error: 'Invalid date format' },
        { status: 400 }
      );
    }

    // Check if insight exists and is OPEN
    const insight = await prisma.insight.findUnique({
      where: { id: insightId },
      include: {
        creator: {
          select: {
            handle: true,
          },
        },
      },
    });

    if (!insight) {
      return NextResponse.json(
        { error: 'Insight not found' },
        { status: 404 }
      );
    }

    if (insight.status !== 'OPEN') {
      return NextResponse.json(
        { error: 'Only OPEN insights can be featured' },
        { status: 400 }
      );
    }

    // Check if there's already a challenge for this date
    const existingChallenge = await prisma.insight.findFirst({
      where: {
        featuredDate,
        id: { not: insightId },
      },
    });

    if (existingChallenge) {
      return NextResponse.json(
        { 
          error: 'A challenge is already set for this date',
          existing: {
            id: existingChallenge.id,
            question: existingChallenge.question,
          }
        },
        { status: 409 }
      );
    }

    // Set the insight as featured
    const updated = await prisma.insight.update({
      where: { id: insightId },
      data: { featuredDate },
      include: {
        creator: {
          select: {
            handle: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: `Successfully set Daily Challenge for ${featuredDate.toISOString().split('T')[0]}`,
      challenge: {
        id: updated.id,
        question: updated.question,
        category: updated.category,
        featuredDate: updated.featuredDate,
        creator: updated.creator,
      },
    });
  } catch (error) {
    console.error('Admin daily challenge POST error:', error);
    return NextResponse.json(
      { error: 'Failed to set daily challenge' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/daily-challenge
 * Remove an insight from being featured
 * Body: { insightId: string }
 */
export async function DELETE(request: NextRequest) {
  try {
    // In production, add admin auth check here
    // const isAdmin = await checkAdminAuth(request);
    // if (!isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const { insightId } = body;

    if (!insightId) {
      return NextResponse.json(
        { error: 'Missing insightId' },
        { status: 400 }
      );
    }

    // Remove featured date
    await prisma.insight.update({
      where: { id: insightId },
      data: { featuredDate: null },
    });

    return NextResponse.json({
      success: true,
      message: 'Successfully removed from featured challenges',
    });
  } catch (error) {
    console.error('Admin daily challenge DELETE error:', error);
    return NextResponse.json(
      { error: 'Failed to remove challenge' },
      { status: 500 }
    );
  }
}
