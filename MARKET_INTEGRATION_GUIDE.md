# 🚀 Market Integration Guide

> Note: Polymarket integration is currently paused/removed. Keep the references below for future re-enablement; Kalshi details remain valid.

## Overview
PrediktFi supports real-time integration with external prediction markets. Polymarket integration is currently disabled; Kalshi integration remains available for live data.

## Features Implemented

### ⏸️ **Polymarket Integration (paused)**
- Integration code removed for now (mock-only reference)
- Keep these notes for future reactivation

### ✅ **Kalshi Integration** 
- Real API integration with fallback to mock data
- Market search and matching
- Price and volume data
- Automatic market discovery

### ✅ **Smart Market Matching**
- Text similarity analysis
- Date proximity matching
- Probability alignment scoring
- Market quality indicators

### ✅ **Robust Error Handling**
- API timeout protection (5s)
- Graceful fallback to mock data
- Parallel API calls with Promise.allSettled
- Comprehensive error logging

## Setup Instructions

### 1. Get API Keys

#### Polymarket API
1. Visit [Polymarket API Documentation](https://docs.polymarket.com/)
2. Sign up for API access
3. Generate your API key
4. Add to environment variables

#### Kalshi API
1. Visit [Kalshi API Documentation](https://trading-api.kalshi.co/)
2. Sign up for API access
3. Generate your API key
4. Add to environment variables

### 2. Environment Configuration

Add these variables to your `.env` file:

```bash
# External Market API Keys
POLYMARKET_API_KEY=your_polymarket_api_key_here
KALSHI_API_KEY=your_kalshi_api_key_here
```

### 3. Test the Integration

```bash
# Test trending markets API
curl "http://localhost:3000/api/markets/trending?limit=6"

# Test market matching for a specific insight
curl "http://localhost:3000/api/insights/{insight_id}/markets"
```

## How It Works

### Market Discovery
1. **User creates prediction** → AI analyzes the question
2. **Market matcher searches** → Queries both Polymarket and Kalshi APIs
3. **Similarity scoring** → Calculates match scores based on:
   - Text similarity (60% weight)
   - Date proximity (20% weight) 
   - Probability alignment (20% weight)
4. **Results returned** → Top matches shown to user

### Data Flow
```
User Prediction → Market Matcher → [Polymarket API, Kalshi API] → Similarity Analysis → Matched Markets
```

### Fallback System
- **No API keys** → Uses mock data
- **API failure** → Falls back to mock data
- **Timeout** → Falls back to mock data
- **Rate limiting** → Falls back to mock data

## API Endpoints

### GET `/api/markets/trending`
Returns trending markets from all platforms.

**Query Parameters:**
- `limit` (optional): Number of markets to return (default: 6)

**Response:**
```json
{
  "markets": [
    {
      "id": "market_id",
      "type": "POLYMARKET" | "KALSHI" | "PREDIKT",
      "title": "Market question",
      "probability": 0.65,
      "volume": 125000,
      "deadline": "2024-12-31T23:59:59Z",
      "creator": "creator_name",
      "creatorScore": 85.5,
      "status": "ACTIVE",
      "url": "https://market-url.com"
    }
  ],
  "totalCount": 6,
  "timestamp": "2024-09-06T20:00:00Z"
}
```

### GET `/api/insights/{id}/markets`
Returns suggested markets for a specific insight.

**Response:**
```json
{
  "insight": {
    "id": "insight_id",
    "question": "Will it rain tomorrow?",
    "probability": 0.72,
    "deadline": "2024-09-07T23:59:59Z"
  },
  "suggestedMarkets": [
    {
      "market": {
        "platform": "POLYMARKET",
        "marketId": "market_id",
        "question": "Will it rain tomorrow?",
        "yesPrice": 0.68,
        "noPrice": 0.32,
        "volume": 15000,
        "liquidity": 3000,
        "endDate": "2024-09-07T23:59:59Z",
        "active": true,
        "url": "https://polymarket.com/market/rain-tomorrow",
        "lastUpdated": "2024-09-06T20:00:00Z"
      },
      "similarity": 0.85,
      "reasons": [
        "High text similarity (95%)",
        "Similar timeline",
        "Similar probability assessment",
        "High volume market"
      ]
    }
  ],
  "connectedMarkets": []
}
```

## Mock Data

When API keys are not available or APIs fail, the system uses realistic mock data:

### Polymarket Mock Markets
- Bitcoin $100k prediction
- Weather predictions
- Fed interest rates
- AI singularity
- Tesla stock predictions

### Kalshi Mock Markets
- S&P 500 predictions
- Inflation forecasts
- Recession predictions
- Oil price predictions
- Unemployment rate predictions

## Performance Considerations

### Rate Limiting
- **Polymarket**: 100 requests/minute
- **Kalshi**: 60 requests/minute
- **Fallback**: Mock data when limits exceeded

### Caching
- Market data cached for 5 minutes
- Trending markets refreshed every 30 seconds
- Similarity scores cached per insight

### Timeouts
- API calls timeout after 5 seconds
- Parallel requests for better performance
- Graceful degradation on failures

## Future Enhancements

### Planned Features
1. **Real-time Updates** - WebSocket integration for live prices
2. **Semantic Search** - AI-powered market matching
3. **More Platforms** - Manifold, PredictIt, etc.
4. **Trading Integration** - Direct trading from PrediktFi
5. **Portfolio Tracking** - Track performance across platforms

### Advanced Matching
1. **NLP Analysis** - Better text understanding
2. **Sentiment Analysis** - Market sentiment scoring
3. **Historical Data** - Price trend analysis
4. **Cross-platform Arbitrage** - Find price differences

## Troubleshooting

### Common Issues

#### API Key Not Working
```bash
# Check if keys are loaded
curl "http://localhost:3000/api/markets/trending" | jq '.markets[0].type'
# Should return "POLYMARKET" or "KALSHI" for real data
```

#### No Markets Found
- Check API key validity
- Verify network connectivity
- Check API rate limits
- Review error logs

#### Mock Data Only
- Ensure API keys are set in `.env`
- Restart the development server
- Check API key format

### Debug Mode
Enable debug logging by setting:
```bash
DEBUG_MARKETS=true
```

## Security Considerations

### API Key Protection
- Never commit API keys to version control
- Use environment variables only
- Rotate keys regularly
- Monitor usage and costs

### Rate Limiting
- Implement client-side rate limiting
- Cache responses appropriately
- Monitor API usage
- Set up alerts for high usage

## Cost Management

### API Pricing
- **Polymarket**: Free tier available
- **Kalshi**: Free tier available
- Monitor usage to avoid overages

### Optimization
- Cache responses aggressively
- Use mock data in development
- Implement smart caching strategies
- Monitor and optimize API calls

---

## 🎉 Success!

Your PrediktFi platform now has real market integration! Users can:
- Discover relevant external markets
- See live prices and volumes
- Connect their predictions to real trading
- Access a comprehensive prediction ecosystem

The system gracefully handles API failures and provides a seamless experience whether using real or mock data.
