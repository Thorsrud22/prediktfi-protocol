'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface FeedInsight {
  id: string;
  question: string;
  canonical?: string;
  category: string;
  probability: number;
  p?: number;
  confidence: number;
  stamped: boolean;
  status?: 'OPEN' | 'COMMITTED' | 'RESOLVED';
  createdAt: string;
  creator?: {
    handle: string;
    score: number;
  };
}

interface FeedResponse {
  insights: FeedInsight[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
  filters: {
    current: string;
    available: string[];
  };
}

export default function FeedPage() {
  const [feedData, setFeedData] = useState<FeedResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentFilter, setCurrentFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);

  // Load feed data from API
  const loadFeedData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '20',
        filter: currentFilter,
        sort: 'recent',
      });
      
      const response = await fetch(`/api/feed?${params}`);
      if (response.ok) {
        const data = await response.json();
        setFeedData(data);
      } else {
        console.error('Failed to load feed data:', response.status);
      }
    } catch (error) {
      console.error('Failed to load feed data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFeedData();
  }, [currentFilter, currentPage]);

  const handleFilterChange = (filter: string) => {
    setCurrentFilter(filter);
    setCurrentPage(1); // Reset to first page when changing filter
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const timeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return `${Math.floor(diffInSeconds / 86400)}d ago`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      {/* Header */}
      <div className="bg-[#0B1426]/50 border-b border-blue-800/30">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-white">Insights Feed</h1>
              <p className="text-blue-300 mt-1">Latest predictions from the community</p>
            </div>
            <Link
              href="/studio"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Create Insight
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Filters */}
        <div className="mb-8">
          <div className="flex flex-wrap gap-2">
            {['all', 'KOL', 'EXPERT', 'COMMUNITY', 'PREDIKT'].map((filter) => (
              <button
                key={filter}
                onClick={() => handleFilterChange(filter)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  currentFilter === filter
                    ? 'bg-blue-600 text-white'
                    : 'bg-white/10 text-blue-200 hover:bg-white/20'
                }`}
              >
                {filter === 'all' ? 'All' : filter}
              </button>
            ))}
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            <p className="text-blue-300 mt-2">Loading insights...</p>
          </div>
        )}

        {/* Empty State */}
        {!loading && feedData && feedData.insights.length === 0 && (
          <div className="text-center py-12">
            <svg className="w-16 h-16 mx-auto mb-4 text-blue-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <h3 className="text-xl font-semibold text-white mb-2">No insights found</h3>
            <p className="text-blue-300 mb-4">
              {currentFilter === 'all' 
                ? 'No insights have been created yet.' 
                : `No insights found for ${currentFilter} filter.`}
            </p>
            <Link
              href="/studio"
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Create First Insight
            </Link>
          </div>
        )}

        {/* Insights List */}
        {!loading && feedData && feedData.insights.length > 0 && (
          <div className="space-y-4">
            {feedData.insights.map((insight) => (
              <Link
                key={insight.id}
                href={`/i/${insight.id}`}
                className="block bg-[color:var(--surface)] rounded-xl shadow-lg border border-[var(--border)] p-6 hover:shadow-xl transition-all duration-200 hover:scale-[1.02]"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="font-semibold text-[color:var(--text)] mb-2 line-clamp-2">
                      {insight.canonical || insight.question}
                    </h3>
                    <div className="flex items-center space-x-4 text-sm text-[color:var(--muted)]">
                      <span className="font-semibold text-blue-400">
                        {Math.round((insight.p || insight.probability) * 100)}%
                      </span>
                      <span>Confidence: {Math.round(insight.confidence * 100)}%</span>
                      <span className="capitalize">{insight.category}</span>
                      {(insight.stamped || insight.status === 'COMMITTED' || insight.status === 'RESOLVED') && (
                        <span className="inline-flex items-center px-2 py-1 bg-green-500/20 text-green-300 text-xs rounded-full border border-green-500/30">
                          <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                          {insight.status === 'RESOLVED' ? 'Resolved' : 'Verified'}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-right ml-4">
                    <div className="text-3xl font-bold text-blue-400 mb-1">
                      {Math.round((insight.p || insight.probability) * 100)}%
                    </div>
                    <div className="text-xs text-[color:var(--muted)]">
                      {timeAgo(insight.createdAt)}
                    </div>
                  </div>
                </div>
                
                {insight.creator && (
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center space-x-2">
                      <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs font-semibold">
                        {insight.creator.handle.charAt(0).toUpperCase()}
                      </div>
                      <span className="text-[color:var(--text)]">@{insight.creator.handle}</span>
                      <span className="text-[color:var(--muted)]">•</span>
                      <span className="text-[color:var(--muted)]">Score: {insight.creator.score.toFixed(1)}</span>
                    </div>
                  </div>
                )}
              </Link>
            ))}
          </div>
        )}

        {/* Pagination */}
        {!loading && feedData && feedData.pagination.pages > 1 && (
          <div className="mt-8 flex items-center justify-center space-x-2">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={!feedData.pagination.hasPrev}
              className="px-3 py-2 bg-[color:var(--surface-2)] text-[color:var(--text)] rounded-lg hover:bg-[color:var(--surface)] disabled:opacity-50 disabled:cursor-not-allowed border border-[var(--border)] transition-colors"
            >
              Previous
            </button>
            
            <div className="flex items-center space-x-1">
              {Array.from({ length: Math.min(5, feedData.pagination.pages) }, (_, i) => {
                const pageNum = i + 1;
                return (
                  <button
                    key={pageNum}
                    onClick={() => handlePageChange(pageNum)}
                    className={`px-3 py-2 rounded-lg text-sm transition-colors ${
                      currentPage === pageNum
                        ? 'bg-blue-500 text-white'
                        : 'bg-[color:var(--surface-2)] text-[color:var(--text)] hover:bg-[color:var(--surface)] border border-[var(--border)]'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>
            
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={!feedData.pagination.hasNext}
              className="px-3 py-2 bg-[color:var(--surface-2)] text-[color:var(--text)] rounded-lg hover:bg-[color:var(--surface)] disabled:opacity-50 disabled:cursor-not-allowed border border-[var(--border)] transition-colors"
            >
              Next
            </button>
          </div>
        )}

        {/* Stats */}
        {!loading && feedData && (
          <div className="mt-8 text-center text-sm text-blue-300">
            Showing {feedData.insights.length} of {feedData.pagination.total} insights
          </div>
        )}
      </div>
    </div>
  );
}