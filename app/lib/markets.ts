export interface Market {
  id: string;
  title: string;
  description: string;
  endDate: string; // ISO date string
  yesPrice: number;
  noPrice: number;
  totalVolume: number; // in SOL (mock)
  isActive: boolean;
  // Creator/KOL attribution
  creatorId?: string;
  creatorName?: string;
  creatorAvatar?: string;
  creatorType?: "KOL" | "EXPERT" | "COMMUNITY" | "PREDIKT";
  creatorXLink?: string;
  // Category for filtering
  category: "KOL" | "Expert" | "Sports" | "Crypto" | "Culture" | "Predikt";
  // Additional data for MarketCard
  poolLamports: number;
  participants: number;
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
    creatorId: "crypto_analyst_sol",
    creatorName: "SolanaMax",
    creatorAvatar: "https://api.dicebear.com/7.x/bottts/svg?seed=solanamax",
    creatorType: "KOL",
    creatorXLink: "https://x.com/solanamax",
    category: "Crypto",
    poolLamports: 15420000000000, // 15,420 SOL in lamports
    participants: 1247,
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
    creatorId: "predikt_editorial",
    creatorName: "Predikt Editorial",
    creatorAvatar: "https://api.dicebear.com/7.x/shapes/svg?seed=predikt",
    creatorType: "PREDIKT",
    category: "Predikt",
    poolLamports: 8930000000000, // 8,930 SOL in lamports
    participants: 892,
  },
  {
    id: "3",
    title: "Will Bitcoin ETF approval boost price above $100k?",
    description: "Bitcoin will reach above $100,000 within 6 months of major ETF approval",
    endDate: "2025-06-30",
    yesPrice: 0.42,
    noPrice: 0.58,
    totalVolume: 22100,
    isActive: true,
    creatorId: "btc_expert_2024",
    creatorName: "BitcoinGuru",
    creatorAvatar: "https://api.dicebear.com/7.x/personas/svg?seed=bitcoinguru",
    creatorType: "EXPERT",
    category: "Expert",
    poolLamports: 22100000000000, // 22,100 SOL in lamports
    participants: 1834,
  },
  {
    id: "4",
    title: "Will Manchester City win Premier League 2025?",
    description: "Manchester City will be crowned Premier League champions for 2024-25 season",
    endDate: "2025-05-25",
    yesPrice: 0.73,
    noPrice: 0.27,
    totalVolume: 12450,
    isActive: true,
    creatorId: "football_expert",
    creatorName: "FootyGuru",
    creatorAvatar: "https://api.dicebear.com/7.x/personas/svg?seed=footyguru",
    creatorType: "EXPERT",
    category: "Sports",
    poolLamports: 12450000000000,
    participants: 967,
  },
  {
    id: "5",
    title: "Will Taylor Swift announce new album in Q1 2025?",
    description: "Taylor Swift will officially announce a new studio album between Jan-Mar 2025",
    endDate: "2025-03-31",
    yesPrice: 0.38,
    noPrice: 0.62,
    totalVolume: 7890,
    isActive: true,
    creatorId: "pop_culture_kol",
    creatorName: "PopCulturePro",
    creatorAvatar: "https://api.dicebear.com/7.x/personas/svg?seed=popculture",
    creatorType: "KOL",
    category: "Culture",
    poolLamports: 7890000000000,
    participants: 654,
  },
  {
    id: "6",
    title: "Will Ethereum reach $5000 before 2026?",
    description: "Ethereum (ETH) will reach $5,000 USD before January 1, 2026",
    endDate: "2025-12-31",
    yesPrice: 0.56,
    noPrice: 0.44,
    totalVolume: 18750,
    isActive: true,
    creatorId: "eth_maximalist",
    creatorName: "EthereumMax",
    creatorAvatar: "https://api.dicebear.com/7.x/bottts/svg?seed=ethereummax",
    creatorType: "KOL",
    category: "KOL",
    poolLamports: 18750000000000,
    participants: 1523,
  },
  {
    id: "7",
    title: "Will Super Bowl 2025 have over 60 points?",
    description: "Combined score of both teams in Super Bowl LIX will exceed 60 points",
    endDate: "2025-02-09",
    yesPrice: 0.51,
    noPrice: 0.49,
    totalVolume: 9340,
    isActive: true,
    creatorId: "nfl_analyst",
    creatorName: "NFLInsider",
    creatorAvatar: "https://api.dicebear.com/7.x/personas/svg?seed=nflinsider",
    creatorType: "EXPERT",
    category: "Sports",
    poolLamports: 9340000000000,
    participants: 743,
  },
  {
    id: "8",
    title: "Will Netflix stock hit $700 by end of 2025?",
    description: "Netflix (NFLX) stock price will reach $700 per share by December 31, 2025",
    endDate: "2025-12-31",
    yesPrice: 0.29,
    noPrice: 0.71,
    totalVolume: 5670,
    isActive: true,
    creatorId: "streaming_expert",
    creatorName: "StreamAnalyst",
    creatorAvatar: "https://api.dicebear.com/7.x/personas/svg?seed=streamanalyst",
    creatorType: "EXPERT",
    category: "Culture",
    poolLamports: 5670000000000,
    participants: 423,
  },
];

export function getMarketById(id: string): Market | undefined {
  return markets.find((m) => m.id === id);
}
