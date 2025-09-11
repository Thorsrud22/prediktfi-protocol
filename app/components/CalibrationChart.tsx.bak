'use client';

import React from 'react';
import { CalibrationBin } from '../../lib/score';

interface CalibrationChartProps {
  bins: CalibrationBin[];
  width?: number;
  height?: number;
}

export default function CalibrationChart({ 
  bins, 
  width = 400, 
  height = 300 
}: CalibrationChartProps) {
  const margin = { top: 20, right: 20, bottom: 40, left: 40 };
  const chartWidth = width - margin.left - margin.right;
  const chartHeight = height - margin.top - margin.bottom;
  
  // Filter bins with data
  const activeBins = bins.filter(bin => bin.count > 0);
  
  if (activeBins.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500">
        No calibration data available yet
      </div>
    );
  }
  
  // Create scales
  const xScale = (value: number) => (value * chartWidth);
  const yScale = (value: number) => chartHeight - (value * chartHeight);
  
  // Perfect calibration line (diagonal)
  const perfectLine = `M ${xScale(0)} ${yScale(0)} L ${xScale(1)} ${yScale(1)}`;
  
  // Data points
  const dataPoints = activeBins.map(bin => ({
    x: xScale(bin.predicted),
    y: yScale(bin.actual),
    count: bin.count,
    predicted: bin.predicted,
    actual: bin.actual,
    deviation: bin.deviation
  }));
  
  // Calculate point sizes based on count
  const maxCount = Math.max(...activeBins.map(bin => bin.count));
  const getPointSize = (count: number) => {
    const minSize = 4;
    const maxSize = 12;
    return minSize + (count / maxCount) * (maxSize - minSize);
  };
  
  // Color based on deviation
  const getPointColor = (deviation: number) => {
    if (deviation < 0.1) return '#10b981'; // green-500
    if (deviation < 0.2) return '#f59e0b'; // amber-500
    return '#ef4444'; // red-500
  };
  
  return (
    <div className="w-full">
      <svg width={width} height={height} className="border border-gray-200 rounded">
        <g transform={`translate(${margin.left}, ${margin.top})`}>
          {/* Grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map(tick => (
            <g key={tick}>
              {/* Vertical grid lines */}
              <line
                x1={xScale(tick)}
                y1={0}
                x2={xScale(tick)}
                y2={chartHeight}
                stroke="#f3f4f6"
                strokeWidth={1}
              />
              {/* Horizontal grid lines */}
              <line
                x1={0}
                y1={yScale(tick)}
                x2={chartWidth}
                y2={yScale(tick)}
                stroke="#f3f4f6"
                strokeWidth={1}
              />
            </g>
          ))}
          
          {/* Perfect calibration line */}
          <path
            d={perfectLine}
            stroke="#6b7280"
            strokeWidth={2}
            strokeDasharray="5,5"
            fill="none"
          />
          
          {/* Data points */}
          {dataPoints.map((point, index) => (
            <g key={index}>
              <circle
                cx={point.x}
                cy={point.y}
                r={getPointSize(point.count)}
                fill={getPointColor(point.deviation)}
                stroke="#fff"
                strokeWidth={2}
                opacity={0.8}
              />
              {/* Tooltip on hover - simplified for now */}
              <title>
                {`Predicted: ${(point.predicted * 100).toFixed(1)}%\nActual: ${(point.actual * 100).toFixed(1)}%\nCount: ${point.count}\nDeviation: ${(point.deviation * 100).toFixed(1)}%`}
              </title>
            </g>
          ))}
          
          {/* Axes */}
          <line
            x1={0}
            y1={chartHeight}
            x2={chartWidth}
            y2={chartHeight}
            stroke="#374151"
            strokeWidth={1}
          />
          <line
            x1={0}
            y1={0}
            x2={0}
            y2={chartHeight}
            stroke="#374151"
            strokeWidth={1}
          />
          
          {/* Axis labels */}
          {[0, 0.25, 0.5, 0.75, 1].map(tick => (
            <g key={tick}>
              {/* X-axis labels */}
              <text
                x={xScale(tick)}
                y={chartHeight + 15}
                textAnchor="middle"
                fontSize="12"
                fill="#6b7280"
              >
                {(tick * 100).toFixed(0)}%
              </text>
              {/* Y-axis labels */}
              <text
                x={-10}
                y={yScale(tick)}
                textAnchor="end"
                dominantBaseline="middle"
                fontSize="12"
                fill="#6b7280"
              >
                {(tick * 100).toFixed(0)}%
              </text>
            </g>
          ))}
          
          {/* Axis titles */}
          <text
            x={chartWidth / 2}
            y={chartHeight + 35}
            textAnchor="middle"
            fontSize="14"
            fill="#374151"
            fontWeight="500"
          >
            Predicted Probability
          </text>
          <text
            x={-25}
            y={chartHeight / 2}
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize="14"
            fill="#374151"
            fontWeight="500"
            transform={`rotate(-90, -25, ${chartHeight / 2})`}
          >
            Actual Frequency
          </text>
        </g>
      </svg>
      
      {/* Legend */}
      <div className="mt-4 flex items-center justify-center space-x-6 text-sm">
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 rounded-full bg-green-500"></div>
          <span className="text-gray-600">Well calibrated (&lt;10% deviation)</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 rounded-full bg-amber-500"></div>
          <span className="text-gray-600">Moderate deviation (10-20%)</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 rounded-full bg-red-500"></div>
          <span className="text-gray-600">Poor calibration (&gt;20%)</span>
        </div>
      </div>
      
      {/* Summary stats */}
      <div className="mt-4 grid grid-cols-3 gap-4 text-center text-sm">
        <div>
          <div className="font-medium text-gray-900">
            {activeBins.length}
          </div>
          <div className="text-gray-600">Active Bins</div>
        </div>
        <div>
          <div className="font-medium text-gray-900">
            {activeBins.reduce((sum, bin) => sum + bin.count, 0)}
          </div>
          <div className="text-gray-600">Total Predictions</div>
        </div>
        <div>
          <div className="font-medium text-gray-900">
            {(activeBins.reduce((sum, bin) => sum + bin.deviation * bin.count, 0) / 
              activeBins.reduce((sum, bin) => sum + bin.count, 0) * 100).toFixed(1)}%
          </div>
          <div className="text-gray-600">Avg Deviation</div>
        </div>
      </div>
    </div>
  );
}
