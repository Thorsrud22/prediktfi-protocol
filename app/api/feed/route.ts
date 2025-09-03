import { NextResponse } from "next/server";
import demoInsights from "../../data/demo-insights.json";
import { type Insight } from "../../lib/ai/types";

export async function GET() {
  try {
    // Parse and validate the demo insights
    const insights = demoInsights as Insight[];
    
    // Sort by timestamp descending (newest first)
    const sortedInsights = insights.sort((a, b) => 
      new Date(b.ts).getTime() - new Date(a.ts).getTime()
    );

    return NextResponse.json({
      items: sortedInsights
    }, {
      headers: {
        "Content-Type": "application/json"
      }
    });

  } catch (error) {
    console.error("Feed API error:", error);
    
    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { error: "BAD_DATA" },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: "SERVER_ERROR" },
      { status: 500 }
    );
  }
}
