'use client';

/**
 * Market Integration Component
 * Shows suggested markets and allows connecting insights to external markets
 */

import React, { useState, useEffect } from 'react';
import { ExternalMarket, MarketMatchScore } from '../lib/markets/types';

interface MarketIntegrationProps {
  insightId: string;
  question: string;
  probability: number;
  className?: string;
}

interface MarketData {
  suggestedMarkets: MarketMatchScore[];
  connectedMarkets: ExternalMarket[];
  tradingEnabled: boolean;
}

export default function MarketIntegration({ 
  insightId, 
  question, 
  probability,
  className = '' 
}: MarketIntegrationProps) {
  const [marketData, setMarketData] = useState<MarketData | null>(null);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState<string | null>(null);

  useEffect(() => {
    loadMarketData();
  }, [insightId]);

  const loadMarketData = async () => {
    try {
      const response = await fetch(`/api/insights/${insightId}/markets`);
      if (response.ok) {
        const data = await response.json();
        setMarketData(data);
      }
    } catch (error) {
      console.error('Failed to load market data:', error);
    } finally {
      setLoading(false);
    }
  };

  const connectMarket = async (marketId: string, platform: string) => {
    setConnecting(marketId);
    try {
      const response = await fetch(`/api/insights/${insightId}/markets`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          marketIds: [marketId],
          platform,
        }),
      });

      if (response.ok) {
        await loadMarketData(); // Refresh data
      } else {
        console.error('Failed to connect market');
      }
    } catch (error) {
      console.error('Market connection error:', error);
    } finally {
      setConnecting(null);
    }
  };

  if (loading) {
    return (
      <div className={`p-4 border border-gray-200 rounded-lg ${className}`}>
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
          <div className="h-3 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  if (!marketData || marketData.suggestedMarkets.length === 0) {
    return (
      <div className={`p-4 border border-gray-100 rounded-lg bg-gray-50 ${className}`}>
        <p className="text-sm text-gray-600">
          No matching prediction markets found for this insight.
        </p>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Connected Markets */}
      {marketData.connectedMarkets.length > 0 && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
          <h4 className="font-medium text-green-900 mb-2 flex items-center">
            <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
            Connected Markets
          </h4>
          {marketData.connectedMarkets.map((market, index) => (
            <div key={index} className="text-sm text-green-700">
              <a 
                href={market.url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="hover:underline"
              >
                {market.platform}: {market.question}
              </a>
            </div>
          ))}
        </div>
      )}

      {/* Suggested Markets */}
      <div className="space-y-3">
        <h4 className="font-medium text-gray-900">
          Suggested Prediction Markets
        </h4>
        {marketData.suggestedMarkets.map((match, index) => (
          <MarketCard
            key={match.market.marketId}
            match={match}
            onConnect={connectMarket}
            isConnecting={connecting === match.market.marketId}
            ourProbability={probability}
          />
        ))}
      </div>
    </div>
  );
}

interface MarketCardProps {
  match: MarketMatchScore;
  onConnect: (marketId: string, platform: string) => void;
  isConnecting: boolean;
  ourProbability: number;
}

function MarketCard({ match, onConnect, isConnecting, ourProbability }: MarketCardProps) {
  const { market, similarity, reasons } = match;
  
  // Calculate probability difference
  const probDiff = Math.abs(ourProbability - market.yesPrice);
  const probDiffPercent = (probDiff * 100).toFixed(1);
  
  return (
    <div className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors">
      <div className="flex justify-between items-start mb-2">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-medium px-2 py-1 bg-blue-100 text-blue-800 rounded">
              {market.platform}
            </span>
            <span className="text-xs text-gray-500">
              {(similarity * 100).toFixed(0)}% match
            </span>
          </div>
          <h5 className="font-medium text-gray-900 text-sm leading-tight">
            {market.question}
          </h5>
        </div>
      </div>

      {/* Market Stats */}
      <div className="grid grid-cols-2 gap-4 mb-3 text-xs text-gray-600">
        <div>
          <span className="font-medium">Market Price:</span>
          <div className="text-lg font-bold text-gray-900">
            {(market.yesPrice * 100).toFixed(1)}%
          </div>
        </div>
        <div>
          <span className="font-medium">Our Prediction:</span>
          <div className="text-lg font-bold text-blue-600">
            {(ourProbability * 100).toFixed(1)}%
          </div>
        </div>
      </div>

      {/* Probability Difference */}
      {probDiff > 0.05 && (
        <div className="mb-3 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs">
          <span className="font-medium text-yellow-800">
            Arbitrage Opportunity: 
          </span>
          <span className="text-yellow-700">
            {probDiffPercent}% difference in probability
          </span>
        </div>
      )}

      {/* Match Reasons */}
      <div className="mb-3">
        <div className="flex flex-wrap gap-1">
          {reasons.map((reason, index) => (
            <span 
              key={index}
              className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded"
            >
              {reason}
            </span>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-between items-center">
        <a
          href={market.url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-blue-600 hover:underline"
        >
          View Market →
        </a>
        
        <button
          onClick={() => onConnect(market.marketId, market.platform)}
          disabled={isConnecting}
          className="text-xs bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {isConnecting ? 'Connecting...' : 'Connect Market'}
        </button>
      </div>
    </div>
  );
}
