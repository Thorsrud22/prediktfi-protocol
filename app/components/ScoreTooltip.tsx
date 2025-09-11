'use client';

import React, { useState } from 'react';
import { Info } from 'lucide-react';

interface ScoreTooltipProps {
  score: number;
  accuracy: number;
  totalInsights: number;
  resolvedInsights: number;
  averageBrier: number;
  isProvisional?: boolean;
  className?: string;
}

export default function ScoreTooltip({
  score,
  accuracy,
  totalInsights,
  resolvedInsights,
  averageBrier,
  isProvisional = false,
  className = ''
}: ScoreTooltipProps) {
  const [isOpen, setIsOpen] = useState(false);

  const formula = 'Score = (Accuracy × 0.4) + (Volume × 0.3) + (Consistency × 0.3)';
  
  const volumeScore = Math.min(totalInsights / 100, 1); // Normalized volume component
  const consistencyScore = Math.max(0, 1 - averageBrier); // Higher Brier = lower consistency
  const calculatedScore = (accuracy * 0.4) + (volumeScore * 0.3) + (consistencyScore * 0.3);

  return (
    <div className={`relative inline-block ${className}`}>
      <button
        type="button"
        className="inline-flex items-center text-gray-400 hover:text-gray-300 transition-colors"
        onMouseEnter={() => setIsOpen(true)}
        onMouseLeave={() => setIsOpen(false)}
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Score calculation details"
      >
        <Info className="w-4 h-4" />
      </button>

      {isOpen && (
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-80 bg-gray-900 border border-gray-700 rounded-lg shadow-xl z-50 p-4">
          {/* Arrow */}
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-700"></div>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-semibold text-white">Score Calculation</h4>
              {isProvisional && (
                <span className="text-xs bg-yellow-500/20 text-yellow-300 px-2 py-1 rounded">
                  Provisional
                </span>
              )}
            </div>
            
            <div className="text-xs text-gray-300">
              <div className="font-mono bg-gray-800 p-2 rounded mb-3">
                {formula}
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Accuracy:</span>
                  <span className="text-green-400">{(accuracy * 100).toFixed(1)}%</span>
                </div>
                <div className="flex justify-between">
                  <span>Volume (insights):</span>
                  <span className="text-blue-400">{totalInsights}</span>
                </div>
                <div className="flex justify-between">
                  <span>Resolved:</span>
                  <span className="text-purple-400">{resolvedInsights}</span>
                </div>
                <div className="flex justify-between">
                  <span>Avg Brier Score:</span>
                  <span className="text-orange-400">{averageBrier.toFixed(3)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Calculated Score:</span>
                  <span className="text-white font-semibold">{calculatedScore.toFixed(2)}</span>
                </div>
              </div>
              
              {isProvisional && (
                <div className="mt-3 pt-2 border-t border-gray-700 text-yellow-300 text-xs">
                  <strong>Note:</strong> Score is provisional until {totalInsights < 50 ? `${50 - totalInsights} more insights` : 'more data'} are available.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}