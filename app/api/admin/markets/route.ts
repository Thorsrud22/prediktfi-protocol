import { NextRequest, NextResponse } from "next/server";

// LEGACY API: This endpoint is from the old prediction markets admin system.
// Current insights are managed through the Studio interface instead.

// In-memory store for development (in production, use database)
const marketStore = {
  markets: [] as any[],
  nextId: 4, // Starting after existing mock markets
};

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { title, description, endDate, creatorId, creatorName, creatorType } = body;

    // Basic validation
    if (!title || !description || !endDate) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Create new market
    const newMarket = {
      id: marketStore.nextId.toString(),
      title,
      description,
      endDate,
      yesPrice: 0.5, // Start at neutral
      noPrice: 0.5,
      totalVolume: 0,
      isActive: true,
      creatorId,
      creatorName,
      creatorAvatar: creatorId ? `https://api.dicebear.com/7.x/shapes/svg?seed=${creatorId}` : undefined,
      creatorType,
      createdAt: new Date().toISOString(),
    };

    marketStore.markets.push(newMarket);
    marketStore.nextId++;

    console.log("Created market:", newMarket);

    return NextResponse.json({ 
      ok: true, 
      market: newMarket 
    });
  } catch (error) {
    console.error("Error creating market:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({ 
    ok: true, 
    markets: marketStore.markets,
    total: marketStore.markets.length 
  });
}
