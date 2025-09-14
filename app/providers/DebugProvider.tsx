"use client";

import { useEffect } from "react";

export default function DebugProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Only install guards in development with explicit flag
    if (process.env.NEXT_PUBLIC_DEBUG_JSON === "1") {
      console.log('[DEBUG-PROVIDER] JSON guards not available in production');
    }
  }, []);

  return <>{children}</>;
}