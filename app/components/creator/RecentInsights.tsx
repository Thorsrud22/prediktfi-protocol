'use client';

import { forwardRef, useEffect, useState } from 'react';
import Link from 'next/link';
import { CreatorInsightLite } from '@/src/lib/creatorClient';

interface RecentInsightsProps {
  insights: CreatorInsightLite[];
  onInsightClick?: (insightId: string) => void;
  filter?: 'last90d' | null;
  onFilterChange?: (filter: 'last90d' | null) => void;
}

interface InsightItemProps {
  insight: CreatorInsightLite;
  onInsightClick?: (insightId: string) => void;
}

function InsightItem({ insight, onInsightClick }: InsightItemProps) {
  const handleClick = () => {
    onInsightClick?.(insight.id);
  };
  
  const getStatusBadge = () => {
    if (insight.status === 'RESOLVED') {
      const isCorrect = insight.resolved === 'YES' ? insight.predicted > 0.5 : insight.predicted <= 0.5;
      return (
        <span className={`px-2 py-1 text-xs rounded-full font-medium ${
          isCorrect 
            ? 'bg-green-900/30 text-green-300' 
            : 'bg-red-900/30 text-red-300'
        }`}>
          {insight.resolved}
        </span>
      );
    }
    
    return (
      <span className="px-2 py-1 text-xs rounded-full font-medium bg-blue-900/30 text-blue-300">
        {insight.status}
      </span>
    );
  };
  
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  };
  
  return (
    <div className="border border-slate-700 rounded-lg p-4 hover:border-slate-600 transition-colors">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h4 className="text-white font-medium text-sm leading-snug mb-2 line-clamp-2">
            {insight.title}
          </h4>
          
          <div className="flex items-center gap-3 text-xs text-slate-400">
            <span>{insight.category}</span>
            <span>•</span>
            <span>{(insight.predicted * 100).toFixed(0)}% predicted</span>
            <span>•</span>
            <span>{formatDate(insight.createdAt)}</span>
          </div>
        </div>
        
        <div className="flex items-center gap-2 flex-shrink-0">
          {getStatusBadge()}
          <Link
            href={`/i/${insight.id}`}
            onClick={handleClick}
            className="px-3 py-1 text-xs bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-md transition-colors"
          >
            View
          </Link>
        </div>
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="text-center py-12">
      <div className="text-slate-400 mb-4">
        <svg className="w-12 h-12 mx-auto mb-3 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <p className="text-sm font-medium">No insights yet</p>
        <p className="text-xs mt-1">Insights will appear here once created</p>
      </div>
      <Link
        href="/studio"
        className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition-colors"
      >
        Create Insight
      </Link>
    </div>
  );
}

const RecentInsights = forwardRef<HTMLDivElement, RecentInsightsProps>(
  ({ insights, onInsightClick, filter, onFilterChange }, ref) => {
    const [filteredInsights, setFilteredInsights] = useState<CreatorInsightLite[]>(insights);
    const [showFilter, setShowFilter] = useState(false);

    // Filter insights based on the filter prop
    useEffect(() => {
      if (filter === 'last90d') {
        const ninetyDaysAgo = new Date();
        ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
        
        const filtered = insights.filter(insight => 
          new Date(insight.createdAt) >= ninetyDaysAgo
        );
        setFilteredInsights(filtered);
        setShowFilter(true);
        
        // Auto-clear filter after 3 seconds
        const timer = setTimeout(() => {
          setShowFilter(false);
          onFilterChange?.(null);
        }, 3000);
        
        return () => clearTimeout(timer);
      } else {
        setFilteredInsights(insights);
        setShowFilter(false);
      }
    }, [insights, filter, onFilterChange]);

    if (insights.length === 0) {
      return (
        <div className="bg-slate-800 rounded-2xl p-6" ref={ref}>
          <h2 className="text-xl font-bold text-white mb-6">Recent Insights</h2>
          <EmptyState />
        </div>
      );
    }
    
    return (
      <div className="bg-slate-800 rounded-2xl p-6" ref={ref}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white">Recent Insights</h2>
          <div className="flex items-center gap-3">
            {showFilter && (
              <div className="px-3 py-1 bg-blue-600/20 text-blue-300 text-sm rounded-full border border-blue-600/30">
                Last 90 days filter active
              </div>
            )}
            <div className="text-sm text-slate-400">
              {filteredInsights.length} insight{filteredInsights.length !== 1 ? 's' : ''}
            </div>
          </div>
        </div>
        
        <div className="space-y-3">
          {filteredInsights.map((insight) => (
            <InsightItem
              key={insight.id}
              insight={insight}
              onInsightClick={onInsightClick}
            />
          ))}
        </div>
        
        {filteredInsights.length === 0 && filter === 'last90d' && (
          <div className="text-center py-8">
            <div className="text-slate-400 mb-2">
              <svg className="w-12 h-12 mx-auto mb-3 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="text-sm font-medium">No insights in the last 90 days</p>
              <p className="text-xs mt-1">Try a different time period</p>
            </div>
          </div>
        )}
        
        {insights.length === 10 && !filter && (
          <div className="text-center mt-6">
            <div className="text-xs text-slate-400">
              Showing latest 10 insights
            </div>
          </div>
        )}
      </div>
    );
  }
);

RecentInsights.displayName = 'RecentInsights';

export default RecentInsights;
