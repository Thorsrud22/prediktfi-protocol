import { describe, it, expect } from "vitest";
import { calcFeeNet } from "./format";

describe("calcFeeNet", () => {
  it("fee 2% of 0.5 is 0.01 and net 0.49 (rounded to 6 dp)", () => {
    const { fee, net } = calcFeeNet(0.5, 200);
    expect(fee).toBe(0.01);
    expect(net).toBe(0.49);
  });
});
