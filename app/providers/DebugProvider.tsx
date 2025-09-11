"use client";

import { useEffect } from "react";
import { installJsonGuards } from "../../src/debug/jsonGuards";

export default function DebugProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Only install guards in development with explicit flag
    if (process.env.NEXT_PUBLIC_DEBUG_JSON === "1") {
      console.log('[DEBUG-PROVIDER] Installing JSON guards...');
      installJsonGuards();
    }
  }, []);

  return <>{children}</>;
}
