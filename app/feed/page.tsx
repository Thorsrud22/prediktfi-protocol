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
  const [searchQuery, setSearchQuery] = useState('');

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

  const getCategoryIcon = (category: string) => {
    const icons: { [key: string]: string } = {
      'crypto': '₿',
      'stocks': '📈',
      'tech': '💻',
      'politics': '🏛️',
      'sports': '⚽',
      'general': '💭'
    };
    return icons[category.toLowerCase()] || '💭';
  };

  const getCategoryColor = (category: string) => {
    const colors: { [key: string]: string } = {
      'crypto': 'from-orange-500 to-yellow-500',
      'stocks': 'from-green-500 to-emerald-500',
      'tech': 'from-blue-500 to-cyan-500',
      'politics': 'from-red-500 to-pink-500',
      'sports': 'from-purple-500 to-violet-500',
      'general': 'from-gray-500 to-slate-500'
    };
    return colors[category.toLowerCase()] || 'from-gray-500 to-slate-500';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      {/* Enhanced Header */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 via-purple-600/20 to-cyan-600/20"></div>
        <div className="relative bg-[#0B1426]/80 border-b border-blue-800/30 backdrop-blur-sm">
          <div className="max-w-7xl mx-auto px-4 py-8">
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
              <div className="flex-1">
                <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-300 via-purple-300 to-cyan-300 bg-clip-text text-transparent">
                  Insights Feed
                </h1>
                <p className="text-blue-200/80 mt-2 text-lg">
                  Discover predictions from the community and track market sentiment
                </p>
                
                {/* Search Bar */}
                <div className="mt-6 max-w-md">
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Search insights..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full px-4 py-3 pl-10 bg-white/10 border border-white/20 rounded-xl text-white placeholder-blue-200/60 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent backdrop-blur-sm"
                    />
                    <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-blue-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-3">
                <Link
                  href="/studio"
                  className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold rounded-xl hover:shadow-lg hover:scale-105 transition-all duration-200"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Create Insight
                </Link>
                <button className="inline-flex items-center px-4 py-3 bg-white/10 text-white font-medium rounded-xl hover:bg-white/20 transition-colors border border-white/20">
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                  </svg>
                  Filters
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Enhanced Filters */}
        <div className="mb-8">
          <div className="flex flex-wrap gap-3">
            {['all', 'crypto', 'stocks', 'tech', 'politics', 'sports', 'general'].map((filter) => (
              <button
                key={filter}
                onClick={() => handleFilterChange(filter)}
                className={`inline-flex items-center px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                  currentFilter === filter
                    ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg'
                    : 'bg-white/10 text-blue-200 hover:bg-white/20 hover:scale-105'
                }`}
              >
                {filter !== 'all' && (
                  <span className="mr-2 text-lg">{getCategoryIcon(filter)}</span>
                )}
                {filter === 'all' ? 'All Categories' : filter.charAt(0).toUpperCase() + filter.slice(1)}
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

        {/* Enhanced Insights List */}
        {!loading && feedData && feedData.insights.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {feedData.insights.map((insight) => (
              <Link
                key={insight.id}
                href={`/i/${insight.id}`}
                className="group block bg-gradient-to-br from-white/5 to-white/10 rounded-2xl shadow-xl border border-white/10 p-6 hover:shadow-2xl hover:scale-105 transition-all duration-200 backdrop-blur-sm hover:border-white/20"
              >
                {/* Header with category and status */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-2">
                    <div className={`w-8 h-8 rounded-lg bg-gradient-to-r ${getCategoryColor(insight.category)} flex items-center justify-center text-white text-sm font-bold`}>
                      {getCategoryIcon(insight.category)}
                    </div>
                    <span className="text-sm font-medium text-blue-200 capitalize">
                      {insight.category}
                    </span>
                  </div>
                  
                  {(insight.stamped || insight.status === 'COMMITTED' || insight.status === 'RESOLVED') && (
                    <div className="inline-flex items-center px-2 py-1 bg-green-500/20 text-green-300 text-xs rounded-full border border-green-500/30">
                      <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      {insight.status === 'RESOLVED' ? 'Resolved' : 'Verified'}
                    </div>
                  )}
                </div>

                {/* Question */}
                <h3 className="font-semibold text-white mb-4 line-clamp-3 group-hover:text-blue-200 transition-colors">
                  {insight.canonical || insight.question}
                </h3>

                {/* Probability Display */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                      {Math.round((insight.p || insight.probability) * 100)}%
                    </div>
                    <div className="text-sm text-blue-200">
                      Confidence: {Math.round(insight.confidence * 100)}%
                    </div>
                  </div>
                  <div className="text-xs text-blue-300/60">
                    {timeAgo(insight.createdAt)}
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="mb-4">
                  <div className="w-full bg-white/10 rounded-full h-2">
                    <div 
                      className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${(insight.p || insight.probability) * 100}%` }}
                    ></div>
                  </div>
                </div>

                {/* Creator Info */}
                {insight.creator && (
                  <div className="flex items-center justify-between pt-4 border-t border-white/10">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white text-sm font-semibold">
                        {insight.creator.handle.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="text-sm font-medium text-white">@{insight.creator.handle}</div>
                        <div className="text-xs text-blue-300">Score: {insight.creator.score.toFixed(1)}</div>
                      </div>
                    </div>
                    <div className="text-blue-300/60">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                )}
              </Link>
            ))}
          </div>
        )}

        {/* Enhanced Pagination */}
        {!loading && feedData && feedData.pagination.pages > 1 && (
          <div className="mt-12 flex items-center justify-center space-x-3">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={!feedData.pagination.hasPrev}
              className="inline-flex items-center px-4 py-2 bg-white/10 text-white rounded-xl hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed border border-white/20 transition-all duration-200 hover:scale-105"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Previous
            </button>
            
            <div className="flex items-center space-x-2">
              {Array.from({ length: Math.min(5, feedData.pagination.pages) }, (_, i) => {
                const pageNum = i + 1;
                return (
                  <button
                    key={pageNum}
                    onClick={() => handlePageChange(pageNum)}
                    className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 hover:scale-105 ${
                      currentPage === pageNum
                        ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg'
                        : 'bg-white/10 text-blue-200 hover:bg-white/20 border border-white/20'
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
              className="inline-flex items-center px-4 py-2 bg-white/10 text-white rounded-xl hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed border border-white/20 transition-all duration-200 hover:scale-105"
            >
              Next
              <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        )}

        {/* Enhanced Stats */}
        {!loading && feedData && (
          <div className="mt-8 text-center">
            <div className="inline-flex items-center px-6 py-3 bg-white/5 rounded-xl border border-white/10 backdrop-blur-sm">
              <svg className="w-5 h-5 mr-2 text-blue-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              <span className="text-blue-200 font-medium">
                Showing <span className="text-white font-bold">{feedData.insights.length}</span> of <span className="text-white font-bold">{feedData.pagination.total}</span> insights
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}