'use client';

import React from 'react';
import { DonutChartData } from '../../../lib/metrics/charts';

interface DonutChartProps {
  data: DonutChartData;
  size?: number;
  className?: string;
}

export default function DonutChart({ 
  data, 
  size = 200, 
  className = '' 
}: DonutChartProps) {
  const radius = size / 2 - 10;
  const innerRadius = radius * 0.6;
  const centerX = size / 2;
  const centerY = size / 2;
  
  if (data.total === 0) {
    return (
      <div className={`flex items-center justify-center ${className}`} style={{ width: size, height: size }}>
        <p className="text-gray-500 text-sm">No data</p>
      </div>
    );
  }
  
  // Calculate angles for each segment
  let currentAngle = -90; // Start from top
  const segments = data.data.map((value, index) => {
    const percentage = (value / data.total) * 100;
    const angle = (value / data.total) * 360;
    const startAngle = currentAngle;
    const endAngle = currentAngle + angle;
    
    currentAngle += angle;
    
    // Calculate path for arc
    const startAngleRad = (startAngle * Math.PI) / 180;
    const endAngleRad = (endAngle * Math.PI) / 180;
    
    const x1 = centerX + radius * Math.cos(startAngleRad);
    const y1 = centerY + radius * Math.sin(startAngleRad);
    const x2 = centerX + radius * Math.cos(endAngleRad);
    const y2 = centerY + radius * Math.sin(endAngleRad);
    
    const x3 = centerX + innerRadius * Math.cos(endAngleRad);
    const y3 = centerY + innerRadius * Math.sin(endAngleRad);
    const x4 = centerX + innerRadius * Math.cos(startAngleRad);
    const y4 = centerY + innerRadius * Math.sin(startAngleRad);
    
    const largeArc = angle > 180 ? 1 : 0;
    
    const pathData = [
      `M ${x1} ${y1}`,
      `A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2}`,
      `L ${x3} ${y3}`,
      `A ${innerRadius} ${innerRadius} 0 ${largeArc} 0 ${x4} ${y4}`,
      'Z'
    ].join(' ');
    
    return {
      path: pathData,
      color: data.colors[index],
      label: data.labels[index],
      value,
      percentage: Math.round(percentage * 10) / 10
    };
  });
  
  return (
    <div className={`relative ${className}`}>
      <svg width={size} height={size} className="drop-shadow-sm">
        {segments.map((segment, index) => (
          <path
            key={index}
            d={segment.path}
            fill={segment.color}
            stroke="white"
            strokeWidth={2}
            className="hover:opacity-80 transition-opacity cursor-pointer"
          >
            <title>{`${segment.label}: ${segment.value} (${segment.percentage}%)`}</title>
          </path>
        ))}
        
        {/* Center text */}
        <text
          x={centerX}
          y={centerY - 5}
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize="24"
          fontWeight="bold"
          fill="#374151"
        >
          {data.total}
        </text>
        <text
          x={centerX}
          y={centerY + 15}
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize="12"
          fill="#6b7280"
        >
          Total
        </text>
      </svg>
      
      {/* Legend */}
      <div className="mt-4 space-y-2">
        {segments.map((segment, index) => (
          <div key={index} className="flex items-center justify-between text-sm">
            <div className="flex items-center space-x-2">
              <div 
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: segment.color }}
              />
              <span className="text-gray-700">{segment.label}</span>
            </div>
            <div className="text-right">
              <span className="font-medium text-gray-900">{segment.value}</span>
              <span className="text-gray-500 ml-1">({segment.percentage}%)</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
