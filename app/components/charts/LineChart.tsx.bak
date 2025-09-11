'use client';

import React from 'react';
import { LineChartData } from '../../../lib/metrics/charts';

interface LineChartProps {
  data: LineChartData;
  width?: number;
  height?: number;
  className?: string;
}

export default function LineChart({ 
  data, 
  width = 600, 
  height = 300, 
  className = '' 
}: LineChartProps) {
  const margin = { top: 20, right: 30, bottom: 40, left: 50 };
  const chartWidth = width - margin.left - margin.right;
  const chartHeight = height - margin.top - margin.bottom;
  
  if (!data.datasets.length) {
    return (
      <div className={`flex items-center justify-center ${className}`} style={{ width, height }}>
        <p className="text-gray-500">No data available</p>
      </div>
    );
  }
  
  // Find data range
  const allDataPoints = data.datasets.flatMap(dataset => dataset.data);
  const yValues = allDataPoints.map(point => point.y);
  const minY = Math.min(...yValues);
  const maxY = Math.max(...yValues);
  const yRange = maxY - minY || 1;
  
  // Scale functions
  const scaleY = (value: number) => chartHeight - ((value - minY) / yRange) * chartHeight;
  const scaleX = (index: number, total: number) => (index / (total - 1)) * chartWidth;
  
  // Generate grid lines
  const gridLines = [];
  const numGridLines = 5;
  for (let i = 0; i <= numGridLines; i++) {
    const y = (i / numGridLines) * chartHeight;
    const value = maxY - (i / numGridLines) * yRange;
    gridLines.push({ y, value });
  }
  
  return (
    <div className={`relative ${className}`}>
      <svg width={width} height={height} className="border border-gray-200 rounded bg-white">
        <g transform={`translate(${margin.left}, ${margin.top})`}>
          {/* Grid lines */}
          {gridLines.map((line, i) => (
            <g key={i}>
              <line
                x1={0}
                y1={line.y}
                x2={chartWidth}
                y2={line.y}
                stroke="#f3f4f6"
                strokeWidth={1}
              />
              <text
                x={-10}
                y={line.y}
                textAnchor="end"
                dominantBaseline="middle"
                fontSize="12"
                fill="#6b7280"
              >
                {Math.round(line.value)}
              </text>
            </g>
          ))}
          
          {/* Data lines */}
          {data.datasets.map((dataset, datasetIndex) => {
            const points = dataset.data;
            if (points.length === 0) return null;
            
            // Create path
            const pathData = points
              .map((point, index) => {
                const x = scaleX(index, points.length);
                const y = scaleY(point.y);
                return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
              })
              .join(' ');
            
            return (
              <g key={datasetIndex}>
                {/* Line */}
                <path
                  d={pathData}
                  fill="none"
                  stroke={dataset.color}
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                
                {/* Data points */}
                {points.map((point, pointIndex) => (
                  <circle
                    key={pointIndex}
                    cx={scaleX(pointIndex, points.length)}
                    cy={scaleY(point.y)}
                    r={3}
                    fill={dataset.color}
                    stroke="white"
                    strokeWidth={2}
                  >
                    <title>{`${dataset.label}: ${point.y} (${point.x})`}</title>
                  </circle>
                ))}
              </g>
            );
          })}
          
          {/* X-axis */}
          <line
            x1={0}
            y1={chartHeight}
            x2={chartWidth}
            y2={chartHeight}
            stroke="#374151"
            strokeWidth={1}
          />
          
          {/* Y-axis */}
          <line
            x1={0}
            y1={0}
            x2={0}
            y2={chartHeight}
            stroke="#374151"
            strokeWidth={1}
          />
          
          {/* X-axis labels */}
          {data.datasets[0]?.data.map((point, index) => {
            if (index % Math.max(1, Math.floor(data.datasets[0].data.length / 6)) === 0) {
              return (
                <text
                  key={index}
                  x={scaleX(index, data.datasets[0].data.length)}
                  y={chartHeight + 15}
                  textAnchor="middle"
                  fontSize="12"
                  fill="#6b7280"
                >
                  {typeof point.x === 'string' ? 
                    new Date(point.x).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) :
                    point.x
                  }
                </text>
              );
            }
            return null;
          })}
          
          {/* Y-axis label */}
          <text
            x={-35}
            y={chartHeight / 2}
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize="14"
            fill="#374151"
            fontWeight="500"
            transform={`rotate(-90, -35, ${chartHeight / 2})`}
          >
            {data.yAxis.label}
          </text>
        </g>
      </svg>
      
      {/* Legend */}
      <div className="flex justify-center mt-4 space-x-6">
        {data.datasets.map((dataset, index) => (
          <div key={index} className="flex items-center space-x-2">
            <div 
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: dataset.color }}
            />
            <span className="text-sm text-gray-700">{dataset.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
