import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { calcFeeNet, formatRelative, roundTo6 } from "./format";

describe("roundTo6", () => {
  it("rounds to 6 decimal places correctly", () => {
    expect(roundTo6(0.1234567890123)).toBe(0.123457);
    expect(roundTo6(0.999999999)).toBe(1);
    expect(roundTo6(1.0000001)).toBe(1.000000);
    expect(roundTo6(0)).toBe(0);
  });

  it("handles very small numbers", () => {
    expect(roundTo6(0.0000001)).toBe(0.000000);
    expect(roundTo6(0.0000009)).toBe(0.000001);
  });

  it("handles negative numbers", () => {
    expect(roundTo6(-0.1234567)).toBe(-0.123457);
    expect(roundTo6(-1.999999999)).toBe(-2);
  });
});

describe("calcFeeNet", () => {
  it("calculates fee and net correctly for standard case", () => {
    const { fee, net } = calcFeeNet(0.5, 200); // 2% fee
    expect(fee).toBe(0.01);
    expect(net).toBe(0.49);
  });

  it("handles zero amount", () => {
    const { fee, net } = calcFeeNet(0, 200);
    expect(fee).toBe(0);
    expect(net).toBe(0);
  });

  it("handles zero fee basis points", () => {
    const { fee, net } = calcFeeNet(1.0, 0);
    expect(fee).toBe(0);
    expect(net).toBe(1.0);
  });

  it("calculates high precision correctly", () => {
    const { fee, net } = calcFeeNet(1.23456789, 150); // 1.5% fee
    expect(fee).toBe(0.018519); // 1.23456789 * 0.015 = 0.018518... rounded to 6dp = 0.018519
    expect(net).toBe(1.216049); // 1.23456789 - 0.018519 = 1.216049
  });

  it("handles large amounts", () => {
    const { fee, net } = calcFeeNet(1000, 100); // 1% fee
    expect(fee).toBe(10);
    expect(net).toBe(990);
  });

  it("handles fractional basis points", () => {
    const { fee, net } = calcFeeNet(1, 1); // 0.01% fee
    expect(fee).toBe(0.0001);
    expect(net).toBe(0.9999);
  });
});

describe("formatRelative", () => {
  const now = new Date("2025-09-01T12:00:00Z");
  
  // Mock Date.now to control relative time calculations
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(now);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("formats future dates correctly", () => {
    const futureDate = new Date("2025-09-02T12:00:00Z"); // 1 day from now
    const result = formatRelative(futureDate);
    expect(result).toBe("in 1 day");
  });

  it("formats past dates correctly", () => {
    const pastDate = new Date("2025-08-31T12:00:00Z"); // 1 day ago
    const result = formatRelative(pastDate);
    expect(result).toBe("1 day ago");
  });

  it("formats dates from string input", () => {
    const result = formatRelative("2025-09-03T12:00:00Z"); // 2 days from now
    expect(result).toBe("in 2 days");
  });

  it("handles hours correctly", () => {
    const futureDate = new Date("2025-09-01T15:00:00Z"); // 3 hours from now
    const result = formatRelative(futureDate);
    expect(result).toBe("in about 3 hours");
  });

  it("handles minutes correctly", () => {
    const futureDate = new Date("2025-09-01T12:30:00Z"); // 30 minutes from now
    const result = formatRelative(futureDate);
    expect(result).toBe("in 30 minutes");
  });

  it("handles invalid date strings", () => {
    const result = formatRelative("invalid-date");
    expect(result).toBe("Invalid date");
  });

  it("handles invalid Date objects", () => {
    const invalidDate = new Date("not-a-date");
    const result = formatRelative(invalidDate);
    expect(result).toBe("Invalid date");
  });

  it("handles very recent dates", () => {
    const recentDate = new Date("2025-09-01T12:00:30Z"); // 30 seconds from now
    const result = formatRelative(recentDate);
    expect(result).toBe("in 1 minute"); // date-fns rounds up to nearest minute
  });
});
