"use client";

import { useMemo } from 'react';

interface ProbabilityGaugeProps {
  probability: number; // 0-1
  size?: 'small' | 'medium' | 'large';
  showLabel?: boolean;
  verified?: boolean;
  className?: string;
}

export default function ProbabilityGauge({ 
  probability, 
  size = 'medium', 
  showLabel = true,
  verified,
  className = ''
}: ProbabilityGaugeProps) {
  const percentage = Math.round(probability * 100);
  
  // Color rules: 0–39 red, 40–59 amber, 60–79 green, 80–100 deep-green
  const color = useMemo(() => {
    if (percentage < 40) return 'text-red-600';
    if (percentage < 60) return 'text-amber-600';
    if (percentage < 80) return 'text-green-600';
    return 'text-emerald-700';
  }, [percentage]);

  const strokeColor = useMemo(() => {
    if (percentage < 40) return '#dc2626'; // red-600
    if (percentage < 60) return '#d97706'; // amber-600
    if (percentage < 80) return '#16a34a'; // green-600
    return '#047857'; // emerald-700
  }, [percentage]);

  const sizeClasses = {
    small: { 
      container: 'w-7 h-7', 
      text: 'text-xs font-semibold',
      svg: 24
    },
    medium: { 
      container: 'w-16 h-16', 
      text: 'text-lg font-bold',
      svg: 64
    },
    large: { 
      container: 'w-24 h-24', 
      text: 'text-2xl font-bold',
      svg: 96
    }
  };

  const { container, text, svg } = sizeClasses[size];
  const radius = svg * 0.35;
  const circumference = 2 * Math.PI * radius;
  const strokeDasharray = `${(percentage / 100) * circumference} ${circumference}`;

  // Accessibility label
  const colorDescription = percentage < 40 ? 'low' : 
                          percentage < 60 ? 'moderate' : 
                          percentage < 80 ? 'high' : 'very high';
  const verifiedText = verified !== undefined ? (verified ? 'verified' : 'unverified') : '';
  const ariaLabel = `${percentage} percent probability, ${colorDescription} confidence${verifiedText ? `, ${verifiedText}` : ''}`;

  return (
    <div 
      className={`relative flex items-center justify-center ${container} ${className}`}
      aria-label={ariaLabel}
      role="img"
    >
      <svg
        width={svg}
        height={svg}
        className="transform -rotate-90"
        aria-hidden="true"
      >
        {/* Background circle */}
        <circle
          cx={svg / 2}
          cy={svg / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={size === 'small' ? 2 : 3}
          className="text-gray-200"
        />
        {/* Progress circle */}
        <circle
          cx={svg / 2}
          cy={svg / 2}
          r={radius}
          fill="none"
          stroke={strokeColor}
          strokeWidth={size === 'small' ? 2 : 3}
          strokeDasharray={strokeDasharray}
          strokeLinecap="round"
          className="transition-all duration-300"
        />
      </svg>
      
      {/* Percentage text */}
      <div className={`absolute inset-0 flex items-center justify-center ${color} ${text}`}>
        {showLabel ? `${percentage}%` : percentage}
      </div>
    </div>
  );
}
