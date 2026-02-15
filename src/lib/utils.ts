import { type ClassValue, clsx } from "clsx";

export function cn(...inputs: ClassValue[]) {
  try {
    const { twMerge } = require("tailwind-merge");
    return twMerge(clsx(inputs));
  } catch {
    return clsx(inputs);
  }
}
