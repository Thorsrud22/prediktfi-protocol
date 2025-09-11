'use client';

import React, { useState, useMemo } from 'react';

interface HistoryItem {
  day: string;
  score: number;
  accuracy: number;
  consistency: number;
  volume: number;
  recency: number;
  maturedN: number;
}

interface CreatorHistoryChartProps {
  items: HistoryItem[];
  className?: string;
}

export default function CreatorHistoryChart({ items, className = '' }: CreatorHistoryChartProps) {
  const [visibleSeries, setVisibleSeries] = useState({
    score: true,
    accuracy: false,
    consistency: false,
    volume: false,
    recency: false
  });

  const chartData = useMemo(() => {
    if (items.length < 3) return null;

    const width = 800;
    const height = 300;
    const margin = { top: 20, right: 80, bottom: 40, left: 60 };
    const chartWidth = width - margin.left - margin.right;
    const chartHeight = height - margin.top - margin.bottom;

    // Find min/max values for scaling
    const allValues = items.flatMap(item => [
      visibleSeries.score ? item.score : 0,
      visibleSeries.accuracy ? item.accuracy : 0,
      visibleSeries.consistency ? item.consistency : 0,
      visibleSeries.volume ? item.volume : 0,
      visibleSeries.recency ? item.recency : 0
    ]).filter(v => v > 0);

    const minValue = Math.min(...allValues);
    const maxValue = Math.max(...allValues);
    const padding = (maxValue - minValue) * 0.1;

    const yScale = (value: number) => 
      chartHeight - ((value - minValue + padding) / (maxValue - minValue + padding * 2)) * chartHeight;

    const xScale = (index: number) => (index / (items.length - 1)) * chartWidth;

    return {
      width,
      height,
      margin,
      chartWidth,
      chartHeight,
      yScale,
      xScale,
      minValue: minValue - padding,
      maxValue: maxValue + padding
    };
  }, [items, visibleSeries]);

  const toggleSeries = (series: keyof typeof visibleSeries) => {
    setVisibleSeries(prev => ({
      ...prev,
      [series]: !prev[series]
    }));
  };

  if (items.length < 3) {
    return (
      <div className={`flex items-center justify-center h-64 bg-gray-900/50 rounded-lg ${className}`}>
        <div className="text-center text-gray-400">
          <div className="text-4xl mb-2">📊</div>
          <p>Not enough data points for chart</p>
          <p className="text-sm">Need at least 3 data points</p>
        </div>
      </div>
    );
  }

  if (!chartData) return null;

  const { width, height, margin, chartWidth, chartHeight, yScale, xScale, minValue, maxValue } = chartData;

  // Generate path data for each series
  const generatePath = (series: keyof typeof visibleSeries, getValue: (item: HistoryItem) => number) => {
    if (!visibleSeries[series]) return '';
    
    const points = items
      .map((item, index) => {
        const x = xScale(index);
        const y = yScale(getValue(item));
        return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
      })
      .join(' ');

    return points;
  };

  const series = [
    { key: 'score' as const, label: 'Score', color: '#3b82f6', getValue: (item: HistoryItem) => item.score },
    { key: 'accuracy' as const, label: 'Accuracy', color: '#10b981', getValue: (item: HistoryItem) => item.accuracy },
    { key: 'consistency' as const, label: 'Consistency', color: '#f59e0b', getValue: (item: HistoryItem) => item.consistency },
    { key: 'volume' as const, label: 'Volume', color: '#8b5cf6', getValue: (item: HistoryItem) => item.volume },
    { key: 'recency' as const, label: 'Recency', color: '#ef4444', getValue: (item: HistoryItem) => item.recency }
  ];

  return (
    <div className={`bg-gray-900/50 rounded-lg p-6 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white">90-Day Performance</h3>
        <div className="flex flex-wrap gap-2">
          {series.map(({ key, label, color }) => (
            <button
              key={key}
              onClick={() => toggleSeries(key)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                visibleSeries[key]
                  ? 'text-white'
                  : 'text-gray-400 hover:text-gray-300'
              }`}
              style={{
                backgroundColor: visibleSeries[key] ? color : 'transparent',
                border: `1px solid ${visibleSeries[key] ? color : '#374151'}`
              }}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="relative">
        <svg width={width} height={height} className="overflow-visible">
          <g transform={`translate(${margin.left}, ${margin.top})`}>
            {/* Grid lines */}
            {[0, 0.25, 0.5, 0.75, 1].map(tick => (
              <g key={tick}>
                <line
                  x1={0}
                  y1={tick * chartHeight}
                  x2={chartWidth}
                  y2={tick * chartHeight}
                  stroke="#374151"
                  strokeWidth={1}
                  opacity={0.3}
                />
                <text
                  x={-10}
                  y={tick * chartHeight + 4}
                  textAnchor="end"
                  className="text-xs fill-gray-400"
                >
                  {(minValue + (1 - tick) * (maxValue - minValue)).toFixed(2)}
                </text>
              </g>
            ))}

            {/* Y-axis */}
            <line
              x1={0}
              y1={0}
              x2={0}
              y2={chartHeight}
              stroke="#6b7280"
              strokeWidth={2}
            />

            {/* X-axis */}
            <line
              x1={0}
              y1={chartHeight}
              x2={chartWidth}
              y2={chartHeight}
              stroke="#6b7280"
              strokeWidth={2}
            />

            {/* Data series */}
            {series.map(({ key, color, getValue }) => {
              const pathData = generatePath(key, getValue);
              if (!pathData) return null;

              return (
                <g key={key}>
                  <path
                    d={pathData}
                    fill="none"
                    stroke={color}
                    strokeWidth={2}
                    opacity={0.8}
                  />
                  {/* Data points */}
                  {items.map((item, index) => (
                    <circle
                      key={`${key}-${index}`}
                      cx={xScale(index)}
                      cy={yScale(getValue(item))}
                      r={3}
                      fill={color}
                      stroke="#1f2937"
                      strokeWidth={1}
                    />
                  ))}
                </g>
              );
            })}
          </g>
        </svg>
      </div>

      <div className="mt-4 text-xs text-gray-400">
        <p>Showing {items.length} data points from {items[0]?.day} to {items[items.length - 1]?.day}</p>
      </div>
    </div>
  );
}
