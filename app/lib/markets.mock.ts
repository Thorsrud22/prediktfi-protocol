export type Market = {
  id: string;
  title: string;
  summary: string;
  endsAt: string;        // ISO
  volume: number;        // i SOL (mock)
  kolId?: string;        // valgfritt
};

export const MOCK_MARKETS: Market[] = [
  {
    id: "1",
    title: "Will SOL hit $300 by end of 2025?",
    summary: "Solana (SOL) will reach $300 USD by December 31, 2025",
    endsAt: "2025-12-31T23:59:59Z",
    volume: 15420,
  },
  {
    id: "2",
    title: "Will there be a new US President elected in 2028?",
    summary: "A new person will be elected as US President in 2028",
    endsAt: "2028-11-07T23:59:59Z",
    volume: 8930,
  },
  {
    id: "3",
    title: "Will Bitcoin ETF approval boost price above $100k?",
    summary: "BTC will reach above $100,000 within 6 months of major ETF approval",
    endsAt: "2025-06-30T23:59:59Z",
    volume: 22100,
  },
];
