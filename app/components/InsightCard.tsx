'use client';

import React from 'react';
import Link from 'next/link';

interface InsightCardProps {
  insight: {
    id: string;
    question: string;
    probability: number;
    status: string;
    outcome?: 'YES' | 'NO' | 'INVALID';
    brierScore?: number;
    createdAt: string;
    resolvedAt?: string;
  };
  showCreator?: boolean;
  creator?: {
    handle: string;
  };
}

export default function InsightCard({ insight, showCreator = true, creator }: InsightCardProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'RESOLVED':
        return 'bg-green-100 text-green-800';
      case 'COMMITTED':
        return 'bg-blue-100 text-blue-800';
      case 'OPEN':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
  
  const getOutcomeColor = (outcome?: string) => {
    switch (outcome) {
      case 'YES':
        return 'text-green-600';
      case 'NO':
        return 'text-red-600';
      case 'INVALID':
        return 'text-gray-600';
      default:
        return 'text-gray-400';
    }
  };
  
  const getBrierScoreColor = (score?: number) => {
    if (!score) return 'text-gray-400';
    if (score < 0.1) return 'text-green-600';
    if (score < 0.25) return 'text-yellow-600';
    return 'text-red-600';
  };
  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: date.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined
    });
  };
  
  const confidenceWidth = Math.round(insight.probability * 100);
  
  return (
    <div className="p-6 hover:bg-gray-50 transition-colors">
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <Link 
            href={`/i/${insight.id}`}
            className="block group"
          >
            <h3 className="text-lg font-medium text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-2">
              {insight.question}
            </h3>
          </Link>
          
          <div className="mt-2 flex items-center space-x-4 text-sm text-gray-600">
            {showCreator && creator && (
              <>
                <Link 
                  href={`/creator/${creator.handle}`}
                  className="font-medium hover:text-blue-600 transition-colors"
                >
                  {creator.handle}
                </Link>
                <span>•</span>
              </>
            )}
            <span>{formatDate(insight.createdAt)}</span>
            {insight.resolvedAt && (
              <>
                <span>•</span>
                <span>Resolved {formatDate(insight.resolvedAt)}</span>
              </>
            )}
          </div>
          
          {/* Confidence Bar */}
          <div className="mt-3">
            <div className="flex items-center justify-between text-sm mb-1">
              <span className="text-gray-600">Confidence</span>
              <span className="font-medium text-gray-900">{confidenceWidth}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${confidenceWidth}%` }}
              />
            </div>
          </div>
        </div>
        
        <div className="ml-6 flex flex-col items-end space-y-2">
          {/* Status Badge */}
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(insight.status)}`}>
            {insight.status}
          </span>
          
          {/* Outcome */}
          {insight.outcome && (
            <div className="text-right">
              <div className={`text-lg font-bold ${getOutcomeColor(insight.outcome)}`}>
                {insight.outcome}
              </div>
              {insight.brierScore !== undefined && (
                <div className={`text-sm ${getBrierScoreColor(insight.brierScore)}`}>
                  Brier: {insight.brierScore.toFixed(3)}
                </div>
              )}
            </div>
          )}
          
          {/* Performance Indicator */}
          {insight.outcome && insight.brierScore !== undefined && (
            <div className="text-right">
              {insight.brierScore < 0.1 && (
                <div className="flex items-center text-green-600 text-xs">
                  <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Excellent
                </div>
              )}
              {insight.brierScore >= 0.1 && insight.brierScore < 0.25 && (
                <div className="flex items-center text-yellow-600 text-xs">
                  <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  Good
                </div>
              )}
              {insight.brierScore >= 0.25 && (
                <div className="flex items-center text-red-600 text-xs">
                  <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                  Needs Work
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
