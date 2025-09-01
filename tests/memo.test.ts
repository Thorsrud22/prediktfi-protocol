import { describe, it, expect } from "vitest";
import { createBetMemoString } from "../app/lib/solana";

describe("memo helpers", () => {
  it("creates valid JSON with expected fields", () => {
    const data = { marketId: "3", side: "YES" as const, amount: 0.5 };
    const str = createBetMemoString(data);
    const parsed = JSON.parse(str);
    
    // Verify all input fields are present
    expect(parsed.marketId).toBe(data.marketId);
    expect(parsed.side).toBe(data.side);
    expect(parsed.amount).toBe(data.amount);
    
    // Verify timestamp is added
    expect(parsed.ts).toBeTypeOf("number");
    expect(parsed.ts).toBeGreaterThan(0);
  });
});
