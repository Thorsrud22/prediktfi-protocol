import { MarketData, NewsData } from './_schemas';

const DEFAULT_COINGECKO_URL = 'https://api.coingecko.com/api/v3';

interface CoinGeckoPrice {
  prices: [number, number][]; // [timestamp, price]
  total_volumes: [number, number][]; // [timestamp, volume]
}

export async function getMarketSnapshot(
  symbol: string, 
  days: number = 30
): Promise<MarketData | null> {
  try {
    const baseUrl = process.env.COINGECKO_API_URL || DEFAULT_COINGECKO_URL;
    
    // Map common symbols to CoinGecko IDs
    const symbolMap: Record<string, string> = {
      'BTC': 'bitcoin',
      'SOL': 'solana',
      'ETH': 'ethereum',
      'USDC': 'usd-coin',
    };
    
    const coinId = symbolMap[symbol.toUpperCase()] || symbol.toLowerCase();
    const url = `${baseUrl}/coins/${coinId}/market_chart?vs_currency=usd&days=${days}&interval=daily`;
    
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
      },
      // 10 second timeout
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      console.warn(`CoinGecko API error for ${symbol}:`, response.status);
      return null;
    }

    const data: CoinGeckoPrice = await response.json();
    
    if (!data.prices || data.prices.length === 0) {
      return null;
    }

    return {
      symbol: symbol.toUpperCase(),
      prices: data.prices.map(([, price]) => price),
      volumes: data.total_volumes?.map(([, volume]) => volume) || [],
      timestamps: data.prices.map(([timestamp]) => timestamp),
    };

  } catch (error) {
    console.warn(`Error fetching market data for ${symbol}:`, error);
    return null;
  }
}

export async function getNewsData(
  keywords: string[] = ['bitcoin', 'solana', 'crypto'],
  limit: number = 10
): Promise<NewsData[]> {
  try {
    const apiKey = process.env.CRYPTOPANIC_API_KEY;
    
    if (!apiKey) {
      // Return empty array if no API key configured
      return [];
    }

    const keywordQuery = keywords.join(',');
    const url = `https://cryptopanic.com/api/v1/posts/?auth_token=${apiKey}&public=true&kind=news&filter=hot&page=1&limit=${limit}`;
    
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
      },
      // 5 second timeout for news
      signal: AbortSignal.timeout(5000),
    });

    if (!response.ok) {
      console.warn('CryptoPanic API error:', response.status);
      return [];
    }

    const data = await response.json();
    
    if (!data.results || !Array.isArray(data.results)) {
      return [];
    }

    return data.results.map((article: any) => ({
      title: article.title || '',
      score: calculateSentimentScore(article.title || ''),
      url: article.url,
    })).filter((item: NewsData) => item.title.length > 0);

  } catch (error) {
    console.warn('Error fetching news data:', error);
    return [];
  }
}

function calculateSentimentScore(title: string): number {
  const text = title.toLowerCase();
  
  // Simple keyword-based sentiment scoring
  const positiveWords = [
    'bull', 'bullish', 'surge', 'pump', 'moon', 'gain', 'profit', 'up', 'rise',
    'breakthrough', 'adoption', 'partnership', 'upgrade', 'success', 'positive',
    'growth', 'rally', 'boom', 'high', 'record', 'milestone'
  ];
  
  const negativeWords = [
    'bear', 'bearish', 'crash', 'dump', 'fall', 'drop', 'loss', 'down', 'decline',
    'hack', 'scam', 'regulation', 'ban', 'concern', 'warning', 'risk', 'fear',
    'sell-off', 'correction', 'low', 'bottom', 'crisis'
  ];
  
  let score = 0;
  let wordCount = 0;
  
  const words = text.split(/\s+/);
  
  for (const word of words) {
    if (positiveWords.includes(word)) {
      score += 1;
      wordCount++;
    } else if (negativeWords.includes(word)) {
      score -= 1;
      wordCount++;
    }
  }
  
  // Normalize to -1 to 1 range
  if (wordCount === 0) return 0;
  
  const normalizedScore = score / Math.max(wordCount, 3); // Avoid extreme scores
  return Math.max(-1, Math.min(1, normalizedScore));
}

export async function fetchMultipleMarketData(
  symbols: string[] = ['BTC', 'SOL'],
  days: number = 30
): Promise<{ data: MarketData[]; dataQuality: number }> {
  const promises = symbols.map(symbol => getMarketSnapshot(symbol, days));
  const results = await Promise.allSettled(promises);
  
  const data: MarketData[] = [];
  let successCount = 0;
  
  for (const result of results) {
    if (result.status === 'fulfilled' && result.value) {
      data.push(result.value);
      successCount++;
    }
  }
  
  const dataQuality = symbols.length > 0 ? successCount / symbols.length : 0;
  
  return { data, dataQuality };
}
