import { describe, it, expect, vi } from "vitest";
import { verifyBetTransaction } from "./solana";

// Mock fetch
global.fetch = vi.fn();

describe("Bet Verification", () => {
  it("should verify a valid transaction", async () => {
    const mockResponse = {
      ok: true,
      memo: { marketId: "test", side: "YES", amount: 1 },
      amountLamports: 1000000000,
      slot: 123456
    };

    (fetch as any).mockResolvedValueOnce({
      json: () => Promise.resolve(mockResponse)
    });

    const result = await verifyBetTransaction("test-signature");
    
    expect(result.ok).toBe(true);
    expect(result.memo).toEqual({ marketId: "test", side: "YES", amount: 1 });
    expect(result.amountLamports).toBe(1000000000);
  });

  it("should handle verification errors", async () => {
    const mockResponse = {
      ok: false,
      error: "TX_NOT_CONFIRMED"
    };

    (fetch as any).mockResolvedValueOnce({
      json: () => Promise.resolve(mockResponse)
    });

    const result = await verifyBetTransaction("invalid-signature");
    
    expect(result.ok).toBe(false);
    expect(result.error).toBe("TX_NOT_CONFIRMED");
  });

  it("should handle network errors", async () => {
    (fetch as any).mockRejectedValueOnce(new Error("Network error"));

    const result = await verifyBetTransaction("test-signature");
    
    expect(result.ok).toBe(false);
    expect(result.error).toBe("NETWORK_ERROR");
  });
});
