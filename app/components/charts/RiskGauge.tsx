'use client';

import React from 'react';

interface RiskGaugeProps {
    /** Risk score 0-100 (higher = more risky) */
    score: number;
    /** Size of the gauge in pixels */
    size?: number;
    /** Optional CSS class */
    className?: string;
}

/**
 * Cyberpunk-style semicircular risk gauge.
 * Uses thin lines & neon colors (green -> amber -> red).
 */
export default function RiskGauge({ score, size = 180, className = '' }: RiskGaugeProps) {
    // Clamp score between 0-100
    const clampedScore = Math.max(0, Math.min(100, score));

    // SVG dimensions
    const strokeWidth = 6;
    const radius = (size - strokeWidth * 2) / 2;
    const centerX = size / 2;
    const centerY = size / 2 + 10; // Offset slightly down for semicircle

    // Arc calculations (180 degrees = semicircle)
    const startAngle = Math.PI; // Left (180 deg)
    const endAngle = 0; // Right (0 deg)
    const totalAngle = Math.PI; // 180 degrees

    // Score to angle mapping
    const scoreAngle = startAngle - (clampedScore / 100) * totalAngle;

    // Helper to convert polar to cartesian
    const polarToCartesian = (angle: number) => ({
        x: centerX + radius * Math.cos(angle),
        y: centerY - radius * Math.sin(angle),
    });

    // Arc path (for the background track)
    const arcStart = polarToCartesian(startAngle);
    const arcEnd = polarToCartesian(endAngle);
    const trackPath = `M ${arcStart.x} ${arcStart.y} A ${radius} ${radius} 0 0 1 ${arcEnd.x} ${arcEnd.y}`;

    // Needle endpoint
    const needleEnd = polarToCartesian(scoreAngle);

    // Get color based on score
    const getColor = (s: number) => {
        if (s <= 30) return { main: '#10B981', glow: 'rgba(16, 185, 129, 0.6)' }; // Emerald
        if (s <= 60) return { main: '#F59E0B', glow: 'rgba(245, 158, 11, 0.6)' }; // Amber
        return { main: '#EF4444', glow: 'rgba(239, 68, 68, 0.6)' }; // Red
    };

    const color = getColor(clampedScore);

    // Risk label
    const getRiskLabel = (s: number) => {
        if (s <= 30) return 'LOW';
        if (s <= 60) return 'MODERATE';
        return 'HIGH';
    };

    return (
        <div className={`relative ${className}`} style={{ width: size, height: size * 0.65 }}>
            <svg
                width={size}
                height={size * 0.65}
                viewBox={`0 0 ${size} ${size * 0.65}`}
                className="overflow-visible"
            >
                {/* Background track - thin arc */}
                <path
                    d={trackPath}
                    fill="none"
                    stroke="rgba(255, 255, 255, 0.1)"
                    strokeWidth={strokeWidth}
                    strokeLinecap="round"
                />

                {/* Tick marks */}
                {[0, 25, 50, 75, 100].map((tick) => {
                    const tickAngle = startAngle - (tick / 100) * totalAngle;
                    const innerR = radius - 12;
                    const outerR = radius + 4;
                    const inner = {
                        x: centerX + innerR * Math.cos(tickAngle),
                        y: centerY - innerR * Math.sin(tickAngle),
                    };
                    const outer = {
                        x: centerX + outerR * Math.cos(tickAngle),
                        y: centerY - outerR * Math.sin(tickAngle),
                    };
                    return (
                        <line
                            key={tick}
                            x1={inner.x}
                            y1={inner.y}
                            x2={outer.x}
                            y2={outer.y}
                            stroke="rgba(255, 255, 255, 0.2)"
                            strokeWidth={1}
                        />
                    );
                })}

                {/* Colored arc segment up to the score */}
                {clampedScore > 0 && (
                    <path
                        d={`M ${arcStart.x} ${arcStart.y} A ${radius} ${radius} 0 0 1 ${needleEnd.x} ${needleEnd.y}`}
                        fill="none"
                        stroke={color.main}
                        strokeWidth={strokeWidth}
                        strokeLinecap="round"
                        style={{
                            filter: `drop-shadow(0 0 8px ${color.glow})`,
                        }}
                    >
                        <animate attributeName="stroke-dashoffset" from="300" to="0" dur="0.8s" fill="freeze" />
                    </path>
                )}

                {/* Needle - thin line with glow */}
                <line
                    x1={centerX}
                    y1={centerY}
                    x2={needleEnd.x}
                    y2={needleEnd.y}
                    stroke={color.main}
                    strokeWidth={2}
                    strokeLinecap="round"
                    style={{
                        filter: `drop-shadow(0 0 6px ${color.glow})`,
                    }}
                />

                {/* Center dot */}
                <circle
                    cx={centerX}
                    cy={centerY}
                    r={6}
                    fill="#1E293B"
                    stroke={color.main}
                    strokeWidth={2}
                    style={{
                        filter: `drop-shadow(0 0 4px ${color.glow})`,
                    }}
                />

                {/* Score value */}
                <text
                    x={centerX}
                    y={centerY - 25}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    className="font-mono font-black"
                    style={{
                        fill: color.main,
                        fontSize: size * 0.18,
                        filter: `drop-shadow(0 0 8px ${color.glow})`,
                    }}
                >
                    {Math.round(clampedScore)}
                </text>

                {/* Risk label */}
                <text
                    x={centerX}
                    y={centerY + 20}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    style={{
                        fill: 'rgba(255, 255, 255, 0.4)',
                        fontSize: 10,
                        fontWeight: 700,
                        letterSpacing: '0.15em',
                    }}
                >
                    {getRiskLabel(clampedScore)} RISK
                </text>
            </svg>
        </div>
    );
}
