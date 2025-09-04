import { describe, expect, test, vi, beforeEach } from "vitest";
import { NextRequest, NextResponse } from "next/server";

// Mock the Solana Connection
const mockGetParsedTransaction = vi.fn();
const mockGetTransaction = vi.fn();
vi.mock("@solana/web3.js", () => ({
  Connection: vi.fn().mockImplementation(() => ({
    getParsedTransaction: mockGetParsedTransaction,
    getTransaction: mockGetTransaction,
  })),
  PublicKey: vi.fn().mockImplementation((key) => ({
    toBase58: () => key,
    toString: () => key,
    equals: (other: any) => key === other.toBase58(),
  })),
  clusterApiUrl: vi.fn().mockImplementation((cluster) => `https://api.${cluster}.solana.com`),
}));

// Mock MEMO_PROGRAM_ID
vi.mock("../solana", () => ({
  MEMO_PROGRAM_ID: {
    toBase58: () => "MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr",
    equals: (other: any) => other.toBase58() === "MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr",
  },
}));

// Import the API route after mocking
const TREASURY_KEY = "9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM";
const MEMO_PROGRAM_ID = "MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr";

// Mock environment variables
vi.stubEnv("NEXT_PUBLIC_TREASURY", TREASURY_KEY);
vi.stubEnv("NEXT_PUBLIC_CLUSTER", "devnet");

describe("API verification logic", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Clear the global store
    (globalThis as any).__prediktStore = { bets: [] };
  });

  test("should verify valid transaction with correct memo and transfer", async () => {
    const expectedMemo = {
      marketId: "btc-2024-1",
      side: "YES" as const,
      amount: 0.1,
    };

    // Mock a valid transaction
    const mockTx = {
      meta: {
        err: null,
        preBalances: [1000000000, 500000000], // 1 SOL, 0.5 SOL
        postBalances: [900000000, 600000000], // 0.9 SOL, 0.6 SOL (treasury gained 0.1 SOL)
      },
      transaction: {
        message: {
          accountKeys: [
            { pubkey: { toBase58: () => "userWallet123" } },
            { pubkey: { toBase58: () => TREASURY_KEY } },
          ],
          instructions: [
            {
              programId: MEMO_PROGRAM_ID,
              data: Buffer.from(JSON.stringify(expectedMemo)).toString("base64"),
            },
          ],
        },
      },
    };

    mockGetParsedTransaction.mockResolvedValue(mockTx);

    // Import the POST handler
    const { POST } = await import("../../app/api/bets/route");

    const request = new NextRequest("http://localhost:3000/api/bets", {
      method: "POST",
      body: JSON.stringify({
        signature: "5VfydCssapM7CjYxaK5NjbcCCdV8keeYGGXXBhGrDbQzNZ9EpDFZ4Sh3bBKy3MCNGc1vP7JEKp1mxPDbGP2A9Rkz",
        expectedMemo,
        wallet: "userWallet123",
      }),
      headers: { "Content-Type": "application/json" },
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.ok).toBe(true);
    expect(data.record).toMatchObject({
      wallet: "userWallet123",
      signature: "5VfydCssapM7CjYxaK5NjbcCCdV8keeYGGXXBhGrDbQzNZ9EpDFZ4Sh3bBKy3MCNGc1vP7JEKp1mxPDbGP2A9Rkz",
      marketId: "btc-2024-1",
      side: "YES",
      amount: 0.1,
    });
  });

  test("should reject transaction with wrong memo", async () => {
    const expectedMemo = {
      marketId: "btc-2024-1",
      side: "YES" as const,
      amount: 0.1,
    };

    const wrongMemo = {
      marketId: "eth-2024-1", // Different market
      side: "NO" as const,
      amount: 0.2,
    };

    // Mock transaction with wrong memo
    const mockTx = {
      meta: {
        err: null,
        preBalances: [1000000000, 500000000],
        postBalances: [900000000, 600000000],
      },
      transaction: {
        message: {
          accountKeys: [
            { pubkey: { toBase58: () => "userWallet123" } },
            { pubkey: { toBase58: () => TREASURY_KEY } },
          ],
          instructions: [
            {
              programId: MEMO_PROGRAM_ID,
              data: Buffer.from(JSON.stringify(wrongMemo)).toString("base64"),
            },
          ],
        },
      },
    };

    mockGetParsedTransaction.mockResolvedValue(mockTx);

    const { POST } = await import("../../app/api/bets/route");

    const request = new NextRequest("http://localhost:3000/api/bets", {
      method: "POST",
      body: JSON.stringify({
        signature: "5VfydCssapM7CjYxaK5NjbcCCdV8keeYGGXXBhGrDbQzNZ9EpDFZ4Sh3bBKy3MCNGc1vP7JEKp1mxPDbGP2A9Rkz",
        expectedMemo,
        wallet: "userWallet123",
      }),
      headers: { "Content-Type": "application/json" },
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(422);
    expect(data.ok).toBe(false);
    expect(data.code).toBe("VERIFY_FAIL");
  });

  test("should reject transaction not found or failed", async () => {
    // Mock null transaction (not found)
    mockGetParsedTransaction.mockResolvedValue(null);

    const { POST } = await import("../../app/api/bets/route");

    const request = new NextRequest("http://localhost:3000/api/bets", {
      method: "POST",
      body: JSON.stringify({
        signature: "4VfydCssapM7CjYxaK5NjbcCCdV8keeYGGXXBhGrDbQzNZ9EpDFZ4Sh3bBKy3MCNGc1vP7JEKp1mxPDbGP2A9Rky",
        expectedMemo: { marketId: "btc-2024-1", side: "YES", amount: 0.1 },
        wallet: "userWallet123",
      }),
      headers: { "Content-Type": "application/json" },
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(409);
    expect(data.ok).toBe(false);
    expect(data.code).toBe("TX_NOT_CONFIRMED");
  });

  test("should reject transaction with failed status", async () => {
    // Mock transaction with error
    const mockTx = {
      meta: {
        err: { InstructionError: [0, "InvalidInstruction"] },
        preBalances: [1000000000, 500000000],
        postBalances: [1000000000, 500000000], // No change
      },
      transaction: {
        message: {
          accountKeys: [],
          instructions: [],
        },
      },
    };

    mockGetParsedTransaction.mockResolvedValue(mockTx);

    const { POST } = await import("../../app/api/bets/route");

    const request = new NextRequest("http://localhost:3000/api/bets", {
      method: "POST",
      body: JSON.stringify({
        signature: "3VfydCssapM7CjYxaK5NjbcCCdV8keeYGGXXBhGrDbQzNZ9EpDFZ4Sh3bBKy3MCNGc1vP7JEKp1mxPDbGP2A9Rkx",
        expectedMemo: { marketId: "btc-2024-1", side: "YES", amount: 0.1 },
        wallet: "userWallet123",
      }),
      headers: { "Content-Type": "application/json" },
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(409);
    expect(data.ok).toBe(false);
    expect(data.code).toBe("TX_NOT_CONFIRMED");
  });

  test("should reject request with missing parameters", async () => {
    const { POST } = await import("../../app/api/bets/route");

    const request = new NextRequest("http://localhost:3000/api/bets", {
      method: "POST",
      body: JSON.stringify({
        signature: "2VfydCssapM7CjYxaK5NjbcCCdV8keeYGGXXBhGrDbQzNZ9EpDFZ4Sh3bBKy3MCNGc1vP7JEKp1mxPDbGP2A9Rkw",
        // Missing expectedMemo and wallet
      }),
      headers: { "Content-Type": "application/json" },
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.ok).toBe(false);
    expect(data.code).toBe("BAD_REQUEST");
  });
});

describe("Insights API verification", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("should verify valid insight transaction", async () => {
    const insightMemo = {
      kind: "insight",
      topic: "crypto",
      question: "Will Bitcoin reach 150k USD?",
      horizon: "12months",
      prob: 0.75,
      drivers: ["Market sentiment", "Technical indicators"],
      rationale: "Strong bullish indicators",
      model: "baseline-v0",
      scenarioId: "crypto-btc-150k-12m",
      ts: "2025-09-02T18:43:57.023Z"
    };

    const mockTx = {
      slot: 12345,
      transaction: {
        message: {
          staticAccountKeys: [
            { toBase58: () => "userWallet123" },
            { toBase58: () => "MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr", equals: (other: any) => other.toBase58() === "MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr" },
          ],
          compiledInstructions: [
            {
              programIdIndex: 1,
              data: Buffer.from(JSON.stringify(insightMemo)),
            },
          ],
        },
      },
    };

    mockGetTransaction.mockResolvedValue(mockTx);

    const { GET } = await import("../../app/api/insights/route");
    const request = new NextRequest("http://localhost:3000/api/insights?sig=mockSig123");

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.ok).toBe(true);
    expect(data.signature).toBe("mockSig123");
    expect(data.memo.kind).toBe("insight");
    expect(data.memo.prob).toBe(0.75);
    expect(data.slot).toBe(12345);
  });

  test("should reject transaction without memo instruction", async () => {
    const mockTx = {
      slot: 12345,
      transaction: {
        message: {
          staticAccountKeys: [
            { toBase58: () => "userWallet123" },
            { toBase58: () => "SystemProgram", equals: (other: any) => other.toBase58() === "SystemProgram" },
          ],
          compiledInstructions: [
            {
              programIdIndex: 1,
              data: Buffer.from("not memo"),
            },
          ],
        },
      },
    };

    mockGetTransaction.mockResolvedValue(mockTx);

    const { GET } = await import("../../app/api/insights/route");
    const request = new NextRequest("http://localhost:3000/api/insights?sig=mockSig123");

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(422);
    expect(data.error).toBe("No memo instruction found");
  });

  test("should reject memo without insight kind", async () => {
    const wrongMemo = {
      kind: "bet", // Wrong kind
      marketId: "test-market",
      amount: 0.1,
    };

    const mockTx = {
      slot: 12345,
      transaction: {
        message: {
          staticAccountKeys: [
            { toBase58: () => "userWallet123" },
            { toBase58: () => "MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr", equals: (other: any) => other.toBase58() === "MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr" },
          ],
          compiledInstructions: [
            {
              programIdIndex: 1,
              data: Buffer.from(JSON.stringify(wrongMemo)),
            },
          ],
        },
      },
    };

    mockGetTransaction.mockResolvedValue(mockTx);

    const { GET } = await import("../../app/api/insights/route");
    const request = new NextRequest("http://localhost:3000/api/insights?sig=mockSig123");

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(422);
    expect(data.error).toBe("Memo does not contain insight data");
  });

  test("should reject request without signature", async () => {
    const { GET } = await import("../../app/api/insights/route");
    const request = new NextRequest("http://localhost:3000/api/insights"); // No sig param

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe("Missing signature parameter");
  });

  test("should enforce rate limiting", async () => {
    const insightMemo = {
      kind: "insight",
      topic: "crypto",
      question: "Test question",
      horizon: "1year",
      prob: 0.5,
      drivers: ["Test"],
      rationale: "Test rationale",
      model: "mock-v0",
      scenarioId: "test-scenario",
      ts: "2025-09-02T18:43:57.023Z"
    };

    const mockTx = {
      slot: 12345,
      transaction: {
        message: {
          staticAccountKeys: [
            { toBase58: () => "userWallet123" },
            { toBase58: () => "MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr", equals: (other: any) => other.toBase58() === "MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr" },
          ],
          compiledInstructions: [
            {
              programIdIndex: 1,
              data: Buffer.from(JSON.stringify(insightMemo)),
            },
          ],
        },
      },
    };

    mockGetTransaction.mockResolvedValue(mockTx);

    const { GET } = await import("../../app/api/insights/route");

    // Make 5 successful requests
    for (let i = 0; i < 5; i++) {
      const request = new NextRequest("http://localhost:3000/api/insights?sig=rateLimitSig", {
        headers: { "x-forwarded-for": "192.168.1.1" }
      });
      const response = await GET(request);
      expect(response.status).toBe(200);
    }

    // 6th request should be rate limited
    const request = new NextRequest("http://localhost:3000/api/insights?sig=rateLimitSig", {
      headers: { "x-forwarded-for": "192.168.1.1" }
    });
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(429);
    expect(data.error).toBe("Rate limit exceeded");
  });
});
