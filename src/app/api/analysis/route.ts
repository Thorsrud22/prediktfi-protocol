import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { assetId, vsCurrency, horizon } = body;

    // Basic validation
    if (!assetId || !vsCurrency) {
      return NextResponse.json(
        { error: 'Missing required fields: assetId and vsCurrency' },
        { status: 422 },
      );
    }

    // Echo input and return not implemented
    return NextResponse.json(
      {
        error: 'not implemented',
        input: { assetId, vsCurrency, horizon },
      },
      {
        status: 501,
        headers: {
          'Cache-Control': 'no-store',
        },
      },
    );
  } catch (error) {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }
}
