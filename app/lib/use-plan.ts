"use client";

import { useEffect, useState } from "react";

export type Plan = "free" | "pro";

/**
 * Client-side hook to get the user's plan
 * Reads from the x-plan header set by middleware
 */
export function usePlan(): Plan {
  const [plan, setPlan] = useState<Plan>("free");

  useEffect(() => {
    // Try to read from a meta tag that we can set server-side
    const metaTag = document.querySelector('meta[name="x-plan"]');
    if (metaTag) {
      const planValue = metaTag.getAttribute("content") as Plan;
      if (planValue === "pro" || planValue === "free") {
        setPlan(planValue);
      }
    }
    
    // Also try to read from document.cookie as fallback
    try {
      if (document.cookie.includes('predikt_plan=pro')) {
        setPlan('pro');
      }
    } catch (error) {
      console.warn('Failed to read plan from cookie:', error);
    }
  }, []);

  return plan;
}

/**
 * Check if user has Pro plan
 */
export function useIsPro(): boolean {
  const plan = usePlan();
  return plan === "pro";
}
