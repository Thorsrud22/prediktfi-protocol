'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { timeAgo } from '../lib/time';

interface LocalInsight {
  kind: 'insight';
  topic: string;
  question: string;
  horizon: string;
  prob: number;
  drivers: string[];
  rationale: string;
  model: string;
  scenarioId: string;
  ts: string;
  signature?: string;
  ref?: string;
  creatorId?: string;
}

interface TrendingInsight {
  id: string;
  question: string;
  prob: number;
  topic: string;
  horizon: string;
  ts: string;
  verified?: boolean;
}

export default function FeedPage() {
  const [localInsights, setLocalInsights] = useState<LocalInsight[]>([]);
  const [trendingInsights, setTrendingInsights] = useState<TrendingInsight[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load local insights from localStorage (FIFO 5)
    try {
      const stored = localStorage.getItem('predikt:insights');
      if (stored) {
        const insights = JSON.parse(stored);
        setLocalInsights(insights.slice(0, 5)); // Max 5
      }
    } catch (error) {
      console.warn('Failed to load local insights:', error);
    }

    // Load trending insights
    loadTrendingInsights();
  }, []);

  const loadTrendingInsights = async () => {
    try {
      const response = await fetch('/api/feed');
      if (response.ok) {
        const data = await response.json();
        setTrendingInsights(data.insights || []);
      } else {
        // Fallback to demo data
        setTrendingInsights([
          {
            id: '1',
            question: 'Will Bitcoin reach $100k by end of 2025?',
            prob: 0.75,
            topic: 'crypto',
            horizon: '12m',
            ts: new Date(Date.now() - 86400000).toISOString(),
            verified: true
          },
          {
            id: '2', 
            question: 'Will AI achieve AGI breakthrough in 2025?',
            prob: 0.25,
            topic: 'tech',
            horizon: '12m',
            ts: new Date(Date.now() - 172800000).toISOString()
          },
          {
            id: '3',
            question: 'Will Tesla stock hit $300 this quarter?',
            prob: 0.45,
            topic: 'stocks',
            horizon: '3m',
            ts: new Date(Date.now() - 259200000).toISOString()
          }
        ]);
      }
    } catch (error) {
      console.warn('Failed to load trending insights:', error);
      // Use demo data as fallback
      setTrendingInsights([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[--background]">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-[--text] mb-2">Insight Feed</h1>
          <p className="text-gray-600">Discover trending predictions and your recent insights</p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Your Recent Insights */}
          <div>
            <h2 className="text-xl font-semibold text-[--text] mb-4">Your Recent</h2>
            
            {localInsights.length === 0 ? (
              <div className="bg-[--surface] border border-[--border] rounded-lg p-8 text-center">
                <div className="max-w-sm mx-auto">
                  <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                    <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-[--text] mb-2">No insights yet</h3>
                  <p className="text-gray-600 mb-4">
                    Create your first insight in Studio
                  </p>
                  <Link 
                    href="/studio"
                    className="inline-flex items-center px-4 py-2 bg-[--accent] text-white rounded-lg hover:bg-[--accent]/90 transition-colors"
                  >
                    Get Started
                  </Link>
                  <p className="text-sm text-gray-500 mt-3">
                    Upgrade for unlimited insights
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {localInsights.map((insight, index) => (
                  <div key={index} className="bg-[--surface] border border-[--border] rounded-lg p-4">
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="font-medium text-[--text] line-clamp-2 flex-1 mr-4">
                        {insight.question}
                      </h3>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-[--accent]">
                          {Math.round(insight.prob * 100)}%
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                      <span className="bg-gray-100 px-2 py-1 rounded text-xs capitalize">
                        {insight.topic}
                      </span>
                      <span>{insight.horizon}</span>
                      <span>•</span>
                      <span>{timeAgo(insight.ts)}</span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <button className="text-sm text-gray-500 hover:text-[--accent]">
                        Copy link
                      </button>
                      <span className="text-gray-300">•</span>
                      <button className="text-sm text-gray-500 hover:text-[--accent]">
                        Share
                      </button>
                      {insight.signature && (
                        <>
                          <span className="text-gray-300">•</span>
                          <span className="text-sm text-green-600 flex items-center">
                            <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                            Verified
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Trending Now */}
          <div>
            <h2 className="text-xl font-semibold text-[--text] mb-4">Trending Now</h2>
            
            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="bg-[--surface] border border-[--border] rounded-lg p-4">
                    <div className="animate-pulse">
                      <div className="h-4 bg-gray-200 rounded w-3/4 mb-3"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2 mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/4"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : trendingInsights.length === 0 ? (
              <div className="bg-[--surface] border border-[--border] rounded-lg p-8 text-center">
                <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <p className="text-gray-600">No trending insights available</p>
              </div>
            ) : (
              <div className="space-y-4">
                {trendingInsights.map((insight) => (
                  <div key={insight.id} className="bg-[--surface] border border-[--border] rounded-lg p-4">
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="font-medium text-[--text] line-clamp-2 flex-1 mr-4">
                        {insight.question}
                      </h3>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-[--accent]">
                          {Math.round(insight.prob * 100)}%
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                      <span className="bg-gray-100 px-2 py-1 rounded text-xs capitalize">
                        {insight.topic}
                      </span>
                      <span>{insight.horizon}</span>
                      <span>•</span>
                      <span>{timeAgo(insight.ts)}</span>
                      {insight.verified && (
                        <>
                          <span>•</span>
                          <span className="text-green-600 flex items-center">
                            <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                            Verified
                          </span>
                        </>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <button className="text-sm text-gray-500 hover:text-[--accent]">
                        View details
                      </button>
                      <span className="text-gray-300">•</span>
                      <button className="text-sm text-gray-500 hover:text-[--accent]">
                        Share
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
