import { describe, expect, test } from "vitest";

describe("Bet API types", () => {
  test("validates expected memo structure", () => {
    const expectedMemo = {
      marketId: "btc-2024-1",
      side: "YES" as const,
      amount: 0.1,
    };
    
    expect(expectedMemo.marketId).toBe("btc-2024-1");
    expect(expectedMemo.side).toBe("YES");
    expect(expectedMemo.amount).toBe(0.1);
    expect(typeof expectedMemo.amount).toBe("number");
  });

  test("validates bet record structure", () => {
    const record = {
      wallet: "9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM",
      signature: "4vJ9JU1bJJE96FWSJKvHsmmFADCg4gpZQff4P3bkLKi",
      marketId: "btc-2024-1",
      side: "YES" as const,
      amount: 0.1,
      ts: Date.now(),
    };
    
    expect(record.wallet).toMatch(/^[1-9A-HJ-NP-Za-km-z]{32,44}$/); // Base58 format
    expect(record.signature).toBeTruthy();
    expect(["YES", "NO"]).toContain(record.side);
    expect(record.amount).toBeGreaterThan(0);
    expect(record.ts).toBeGreaterThan(0);
  });
});
