import { describe, it, expect } from "vitest";
import { calcFeeNet, formatRelative } from "./format";

describe("calcFeeNet", () => {
  it("fee 2% of 0.5 is 0.01 and net 0.49 (rounded to 6 dp)", () => {
    const { fee, net } = calcFeeNet(0.5, 200);
    expect(fee).toBe(0.01);
    expect(net).toBe(0.49);
  });
});

describe("formatRelative", () => {
  it("formats future dates correctly", () => {
    const futureDate = new Date(Date.now() + 1000 * 60 * 60 * 24); // 1 day from now
    const result = formatRelative(futureDate);
    expect(result).toContain("1 day");
    expect(result).toContain("in");
  });
});
