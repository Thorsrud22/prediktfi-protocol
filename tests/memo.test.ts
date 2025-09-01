import { describe, it, expect } from "vitest";
import { createBetMemoString } from "../app/lib/solana";

describe("memo helpers", () => {
  it("creates valid JSON with expected fields", () => {
    const data = { marketId: "3", side: "YES" as const, amount: 0.5 };
    const str = createBetMemoString(data);
    const parsed = JSON.parse(str);
    expect(parsed).toEqual(data);
  });
});
