"use client";

import { memo } from "react";

interface ProbabilityGaugeProps {
  probability: number; // 0 to 1
  size?: "sm" | "md" | "lg";
}

function ProbabilityGauge({ probability, size = "md" }: ProbabilityGaugeProps) {
  const percentage = Math.round(probability * 100);
  
  // Size configurations
  const sizeConfig = {
    sm: { width: 80, height: 80, strokeWidth: 6, fontSize: "text-sm" },
    md: { width: 120, height: 120, strokeWidth: 8, fontSize: "text-lg" },
    lg: { width: 160, height: 160, strokeWidth: 10, fontSize: "text-xl" },
  };
  
  const config = sizeConfig[size];
  const radius = (config.width - config.strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDasharray = circumference;
  const strokeDashoffset = circumference - (probability * circumference);
  
  // Color based on probability thresholds - consistent across app
  const getColor = () => {
    if (probability < 0.25) return "#ef4444"; // red - very unlikely
    if (probability < 0.50) return "#f97316"; // orange - unlikely  
    if (probability < 0.75) return "#eab308"; // yellow - likely
    return "#22c55e"; // green - very likely
  };

  // Accessibility labels based on probability ranges
  const getAriaLabel = () => {
    const desc = probability < 0.25 ? "very unlikely" : 
                 probability < 0.50 ? "unlikely" :
                 probability < 0.75 ? "likely" : "very likely";
    return `${percentage}% probability, ${desc}`;
  };

  return (
    <div className="flex flex-col items-center">
      <div className="relative">
        <svg 
          width={config.width} 
          height={config.height} 
          className="transform -rotate-90"
          aria-label={getAriaLabel()}
          role="img"
        >
          {/* Background circle */}
          <circle
            cx={config.width / 2}
            cy={config.height / 2}
            r={radius}
            fill="none"
            stroke="#e5e7eb"
            strokeWidth={config.strokeWidth}
          />
          {/* Progress circle */}
          <circle
            cx={config.width / 2}
            cy={config.height / 2}
            r={radius}
            fill="none"
            stroke={getColor()}
            strokeWidth={config.strokeWidth}
            strokeLinecap="round"
            strokeDasharray={strokeDasharray}
            strokeDashoffset={strokeDashoffset}
            className="transition-all duration-1000 ease-out"
          />
        </svg>
        {/* Percentage text */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={`font-bold text-[color:var(--text)] ${config.fontSize}`}>
            {percentage}%
          </span>
        </div>
      </div>
      <p className="text-sm text-[color:var(--muted)] mt-2 font-medium">Probability</p>
    </div>
  );
}

export default memo(ProbabilityGauge);
