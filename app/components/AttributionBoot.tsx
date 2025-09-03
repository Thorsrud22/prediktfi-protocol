"use client";

import { useEffect } from "react";
import { saveAttributionFromUrl } from "../lib/attribution";

/**
 * Attribution Boot component
 * Automatically saves attribution data from URL parameters on mount
 */
export default function AttributionBoot() {
  useEffect(() => {
    // Save attribution data from URL parameters when component mounts
    saveAttributionFromUrl();
  }, []);

  // This component renders nothing visible
  return null;
}
