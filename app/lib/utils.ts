import { type ClassValue, clsx } from "clsx";

// Fallback function if twMerge is not available
export function cn(...inputs: ClassValue[]) {
  try {
    const { twMerge } = require("tailwind-merge");
    return twMerge(clsx(inputs));
  } catch {
    // Fallback: just use clsx if tailwind-merge is not available
    return clsx(inputs);
  }
}
