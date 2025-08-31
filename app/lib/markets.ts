export interface Market {
  id: string;
  title: string;
  description: string;
  endDate: string; // ISO date string
  yesPrice: number;
  noPrice: number;
  totalVolume: number; // in SOL (mock)
  isActive: boolean;
}

export const markets: Market[] = [
  {
    id: "1",
    title: "Will SOL hit $300 by end of 2025?",
    description: "Solana (SOL) will reach $300 USD by December 31, 2025",
    endDate: "2025-12-31",
    yesPrice: 0.65,
    noPrice: 0.35,
    totalVolume: 15420,
    isActive: true,
  },
  {
    id: "2",
    title: "Will there be a new US President elected in 2028?",
    description: "A new person will be elected as US President in 2028",
    endDate: "2028-11-07",
    yesPrice: 0.95,
    noPrice: 0.05,
    totalVolume: 8930,
    isActive: true,
  },
  {
    id: "3",
    title: "Will Bitcoin ETF approval boost price above $100k?",
    description:
      "Bitcoin will reach above $100,000 within 6 months of major ETF approval",
    endDate: "2025-06-30",
    yesPrice: 0.42,
    noPrice: 0.58,
    totalVolume: 22100,
    isActive: true,
  },
];

export function getMarketById(id: string): Market | undefined {
  return markets.find((m) => m.id === id);
}
