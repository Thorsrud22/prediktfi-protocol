export type Market = {
  id: string;
  title: string;
  summary: string;
  endsAt: string;        // ISO
  volume: number;        // i SOL (mock)
  kolId?: string;        // valgfritt
  // Creator/KOL attribution
  creatorId?: string;
  creatorName?: string;
  creatorAvatar?: string;
  creatorType?: "KOL" | "EXPERT" | "COMMUNITY" | "PREDIKT";
};

export const MOCK_MARKETS: Market[] = [
  {
    id: "1",
    title: "Will SOL hit $300 by end of 2025?",
    summary: "Solana (SOL) will reach $300 USD by December 31, 2025",
    endsAt: "2025-12-31T23:59:59Z",
    volume: 15420,
    creatorId: "crypto_analyst_sol",
    creatorName: "SolanaMax",
    creatorAvatar: "https://api.dicebear.com/7.x/bottts/svg?seed=solanamax",
    creatorType: "KOL",
  },
  {
    id: "2",
    title: "Will there be a new US President elected in 2028?",
    summary: "A new person will be elected as US President in 2028",
    endsAt: "2028-11-07T23:59:59Z",
    volume: 8930,
    creatorId: "predikt_editorial",
    creatorName: "Predikt Editorial",
    creatorAvatar: "https://api.dicebear.com/7.x/shapes/svg?seed=predikt",
    creatorType: "PREDIKT",
  },
  {
    id: "3",
    title: "Will Bitcoin ETF approval boost price above $100k?",
    summary: "BTC will reach above $100,000 within 6 months of major ETF approval",
    endsAt: "2025-06-30T23:59:59Z",
    volume: 22100,
    creatorId: "btc_expert_2024",
    creatorName: "BitcoinGuru",
    creatorAvatar: "https://api.dicebear.com/7.x/personas/svg?seed=bitcoinguru",
    creatorType: "EXPERT",
  },
];
