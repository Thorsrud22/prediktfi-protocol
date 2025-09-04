import { type Insight } from "./ai/types";

export function pushInsightLocal(item: Insight & { signature?: string }) {
  if (typeof window === "undefined") return;
  
  try {
    const existing = localStorage.getItem("predikt:insights");
    const insights = existing ? JSON.parse(existing) : [];
    
    // De-duplicate by signature if present
    const filteredInsights = insights.filter((insight: any) => {
      if (item.signature && insight.signature) {
        return insight.signature !== item.signature;
      }
      // If no signature, allow duplicates (local insights)
      return true;
    });
    
    // Add to beginning (newest first)
    filteredInsights.unshift(item);
    
    // Keep only last 5 (FIFO)
    if (filteredInsights.length > 5) {
      filteredInsights.splice(5);
    }
    
    localStorage.setItem("predikt:insights", JSON.stringify(filteredInsights));
  } catch (error) {
    console.warn("Failed to save insight to localStorage:", error);
  }
}
