'use client';

import { useState } from 'react';
import Link from 'next/link';
import { CreatorHistory, CreatorHistoryItem } from '@/src/lib/creatorClient';

interface ScoreSparklineProps {
  history: CreatorHistory;
  onPeriodChange?: (period: '30d' | '90d') => void;
}

interface TooltipData {
  x: number;
  y: number;
  date: string;
  score: number;
  delta7d?: number;
  delta30d?: number;
  delta90d?: number;
}

function generateSparklinePath(data: CreatorHistoryItem[], width: number, height: number): string {
  if (data.length === 0) return '';
  
  const scores = data.map(d => d.score);
  const minScore = Math.min(...scores);
  const maxScore = Math.max(...scores);
  const scoreRange = maxScore - minScore || 0.1; // Avoid division by zero
  
  const points = data.map((item, index) => {
    const x = (index / (data.length - 1)) * width;
    const y = height - ((item.score - minScore) / scoreRange) * height;
    return `${x},${y}`;
  }).join(' ');
  
  return `M ${points.replace(/,/g, ' L ')}`;
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center h-32 text-slate-400">
      <div className="text-sm font-medium mb-2">No score history yet</div>
      <div className="text-xs mb-4">Create your first insight to start building your score</div>
      <Link
        href="/studio"
        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition-colors"
      >
        Create Insight
      </Link>
    </div>
  );
}

export default function ScoreSparkline({ history, onPeriodChange }: ScoreSparklineProps) {
  const [selectedPeriod, setSelectedPeriod] = useState<'30d' | '90d'>(history.period);
  const [tooltip, setTooltip] = useState<TooltipData | null>(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  
  const handlePeriodChange = (period: '30d' | '90d') => {
    setSelectedPeriod(period);
    onPeriodChange?.(period);
  };
  
  const sparklineWidth = 300;
  const sparklineHeight = 60;
  
  // Calculate deltas for tooltip
  const calculateDeltas = (items: CreatorHistoryItem[], currentIndex: number) => {
    const current = items[currentIndex];
    const deltas: { delta7d?: number; delta30d?: number; delta90d?: number } = {};
    
    // 7d delta
    const sevenDaysAgo = new Date(current.day);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const sevenDaysAgoItem = items.find(item => new Date(item.day) <= sevenDaysAgo);
    if (sevenDaysAgoItem) {
      deltas.delta7d = current.score - sevenDaysAgoItem.score;
    }
    
    // 30d delta
    const thirtyDaysAgo = new Date(current.day);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const thirtyDaysAgoItem = items.find(item => new Date(item.day) <= thirtyDaysAgo);
    if (thirtyDaysAgoItem) {
      deltas.delta30d = current.score - thirtyDaysAgoItem.score;
    }
    
    // 90d delta
    const ninetyDaysAgo = new Date(current.day);
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
    const ninetyDaysAgoItem = items.find(item => new Date(item.day) <= ninetyDaysAgo);
    if (ninetyDaysAgoItem) {
      deltas.delta90d = current.score - ninetyDaysAgoItem.score;
    }
    
    return deltas;
  };
  
  const handleMouseMove = (event: React.MouseEvent<SVGCircleElement>, item: CreatorHistoryItem, index: number) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    const deltas = calculateDeltas(history.items, index);
    
    setTooltip({
      x,
      y,
      date: new Date(item.day).toLocaleDateString(),
      score: item.score,
      ...deltas
    });
    setMousePosition({ x: event.clientX, y: event.clientY });
  };
  
  const handleMouseLeave = () => {
    setTooltip(null);
  };
  
  if (history.items.length < 3) {
    return (
      <div className="bg-slate-800 rounded-xl p-4 md:p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">Score History</h3>
          
          {/* Period toggle */}
          <div className="flex bg-slate-700 rounded-lg p-1">
            <button
              onClick={() => handlePeriodChange('30d')}
              className={`px-3 py-1 text-xs rounded-md transition-colors ${
                selectedPeriod === '30d'
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              30d
            </button>
            <button
              onClick={() => handlePeriodChange('90d')}
              className={`px-3 py-1 text-xs rounded-md transition-colors ${
                selectedPeriod === '90d'
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              90d
            </button>
          </div>
        </div>
        
        <EmptyState />
      </div>
    );
  }
  
  const sparklinePath = generateSparklinePath(history.items, sparklineWidth, sparklineHeight);
  const currentScore = history.items[history.items.length - 1]?.score || 0;
  const firstScore = history.items[0]?.score || 0;
  const scoreChange = currentScore - firstScore;
  const scoreChangePercent = firstScore !== 0 ? (scoreChange / firstScore) * 100 : 0;
  
  const scores = history.items.map(d => d.score);
  const minScore = Math.min(...scores);
  const maxScore = Math.max(...scores);
  const scoreRange = maxScore - minScore || 0.1;
  
  return (
    <div className="bg-slate-800 rounded-xl p-4 md:p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white">Score History</h3>
        
        {/* Period toggle */}
        <div className="flex bg-slate-700 rounded-lg p-1">
          <button
            onClick={() => handlePeriodChange('30d')}
            className={`px-3 py-1 text-xs rounded-md transition-colors ${
              selectedPeriod === '30d'
                ? 'bg-blue-600 text-white'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            30d
          </button>
          <button
            onClick={() => handlePeriodChange('90d')}
            className={`px-3 py-1 text-xs rounded-md transition-colors ${
              selectedPeriod === '90d'
                ? 'bg-blue-600 text-white'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            90d
          </button>
        </div>
      </div>
      
      {/* Sparkline container */}
      <div className="relative">
        <svg
          width="100%"
          height={sparklineHeight}
          viewBox={`0 0 ${sparklineWidth} ${sparklineHeight}`}
          className="overflow-visible"
          onMouseLeave={handleMouseLeave}
        >
          {/* Background grid with improved contrast */}
          <defs>
            <pattern id="grid" width="20" height="10" patternUnits="userSpaceOnUse">
              <path d="M 20 0 L 0 0 0 10" fill="none" stroke="#4B5563" strokeWidth="0.5" opacity="0.4"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
          
          {/* Y-axis lines for better contrast */}
          <line x1="0" y1="0" x2="0" y2={sparklineHeight} stroke="#6B7280" strokeWidth="1" opacity="0.6"/>
          <line x1="0" y1={sparklineHeight} x2={sparklineWidth} y2={sparklineHeight} stroke="#6B7280" strokeWidth="1" opacity="0.6"/>
          
          {/* Sparkline with improved contrast */}
          <path
            d={sparklinePath}
            fill="none"
            stroke="#60A5FA"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          
          {/* Gradient fill under line */}
          <defs>
            <linearGradient id="sparklineGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#60A5FA" stopOpacity="0.3"/>
              <stop offset="100%" stopColor="#60A5FA" stopOpacity="0"/>
            </linearGradient>
          </defs>
          <path
            d={`${sparklinePath} L ${sparklineWidth},${sparklineHeight} L 0,${sparklineHeight} Z`}
            fill="url(#sparklineGradient)"
          />
          
          {/* Interactive points */}
          {history.items.map((item, index) => {
            const x = (index / (history.items.length - 1)) * sparklineWidth;
            const y = sparklineHeight - ((item.score - minScore) / scoreRange) * sparklineHeight;
            const isLast = index === history.items.length - 1;
            
            return (
              <circle
                key={index}
                cx={x}
                cy={y}
                r={isLast ? "4" : "2"}
                fill={isLast ? "#60A5FA" : "#3B82F6"}
                stroke={isLast ? "#1E40AF" : "#1E3A8A"}
                strokeWidth={isLast ? "2" : "1"}
                className="cursor-pointer hover:r-3 transition-all"
                onMouseMove={(e) => handleMouseMove(e, item, index)}
              />
            );
          })}
        </svg>
        
        {/* Tooltip */}
        {tooltip && (
          <div
            className="absolute z-10 bg-slate-900 text-white text-xs rounded-lg p-3 shadow-xl border border-slate-700 pointer-events-none"
            style={{
              left: `${Math.min(tooltip.x + 10, sparklineWidth - 120)}px`,
              top: `${Math.max(tooltip.y - 10, 10)}px`,
            }}
          >
            <div className="font-medium mb-1">{tooltip.date}</div>
            <div className="text-blue-300 mb-2">Score: {tooltip.score.toFixed(3)}</div>
            <div className="space-y-1">
              {tooltip.delta7d !== undefined && (
                <div className="text-slate-300">
                  7d: <span className={tooltip.delta7d >= 0 ? 'text-green-400' : 'text-red-400'}>
                    {tooltip.delta7d >= 0 ? '+' : ''}{tooltip.delta7d.toFixed(3)}
                  </span>
                </div>
              )}
              {tooltip.delta30d !== undefined && (
                <div className="text-slate-300">
                  30d: <span className={tooltip.delta30d >= 0 ? 'text-green-400' : 'text-red-400'}>
                    {tooltip.delta30d >= 0 ? '+' : ''}{tooltip.delta30d.toFixed(3)}
                  </span>
                </div>
              )}
              {tooltip.delta90d !== undefined && (
                <div className="text-slate-300">
                  90d: <span className={tooltip.delta90d >= 0 ? 'text-green-400' : 'text-red-400'}>
                    {tooltip.delta90d >= 0 ? '+' : ''}{tooltip.delta90d.toFixed(3)}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}
        
        {/* Score change indicator */}
        <div className="flex items-center justify-between mt-3 text-sm">
          <div className="text-slate-400">
            {history.items.length} data points
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-slate-300">
              {scoreChange >= 0 ? '+' : ''}{scoreChange.toFixed(3)}
            </span>
            <span className={`text-xs px-2 py-1 rounded ${
              scoreChange >= 0 
                ? 'bg-green-900/30 text-green-300' 
                : 'bg-red-900/30 text-red-300'
            }`}>
              {scoreChangePercent >= 0 ? '+' : ''}{scoreChangePercent.toFixed(1)}%
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
