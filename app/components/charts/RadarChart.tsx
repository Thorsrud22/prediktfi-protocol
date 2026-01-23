'use client';

import React from 'react';

interface RadarChartProps {
    data: {
        label: string;
        value: number; // 0-100
        fullMark: number;
    }[];
    width?: number;
    height?: number;
    className?: string;
}

export default function RadarChart({ data, width = 300, height = 300, className = '' }: RadarChartProps) {
    const padding = 40;
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(centerX, centerY) - padding;
    const sides = data.length;
    const angleStep = (Math.PI * 2) / sides;

    // Calculate points for the polygon - direct calculation (no memoization for stability)
    const points = data.map((item, i) => {
        const angle = i * angleStep - Math.PI / 2; // Start from top (-90 deg)
        // Clamp value to min 5% to prevent chart from collapsing, max 100% to keep in bounds
        const safeValue = Math.max(Math.min(item.value, item.fullMark), 5);
        const normalizedValue = safeValue / item.fullMark;

        const x = centerX + radius * normalizedValue * Math.cos(angle);
        const y = centerY + radius * normalizedValue * Math.sin(angle);
        return { x, y, angle, value: item.value, label: item.label };
    });

    // Calculate grid polygons (concentric webs)
    const gridLevels = [0.2, 0.4, 0.6, 0.8, 1];
    const gridPolygons = gridLevels.map(level => {
        return data.map((_, i) => {
            const angle = i * angleStep - Math.PI / 2;
            const x = centerX + radius * level * Math.cos(angle);
            const y = centerY + radius * level * Math.sin(angle);
            return `${x},${y}`;
        }).join(' ');
    });

    const polygonPoints = points.map(p => `${p.x},${p.y}`).join(' ');

    return (
        <div className={`relative flex items-center justify-center ${className}`}>
            <svg width="100%" height="100%" viewBox={`0 0 ${width} ${height}`} className="overflow-visible">
                {/* Background Grid */}
                {gridPolygons.map((pointsStr, i) => (
                    <polygon
                        key={i}
                        points={pointsStr}
                        fill="none"
                        stroke="rgba(255, 255, 255, 0.1)"
                        strokeWidth="1"
                        strokeDasharray={i === 4 ? "0" : "4 4"}
                    />
                ))}

                {/* Axes Lines */}
                {points.map((p, i) => (
                    <line
                        key={i}
                        x1={centerX}
                        y1={centerY}
                        x2={centerX + radius * Math.cos(p.angle)}
                        y2={centerY + radius * Math.sin(p.angle)}
                        stroke="rgba(255, 255, 255, 0.1)"
                        strokeWidth="1"
                    />
                ))}

                {/* Data Polygon */}
                <polygon
                    points={polygonPoints}
                    fill="rgba(59, 130, 246, 0.25)" // Increased opacity slightly for visibility
                    stroke="#3B82F6"
                    strokeWidth="2"
                    strokeLinejoin="round"
                    className="drop-shadow-[0_0_10px_rgba(59,130,246,0.3)]"
                >
                    <animate attributeName="opacity" from="0" to="1" dur="0.6s" fill="freeze" />
                </polygon>

                {/* Data Points */}
                {points.map((p, i) => (
                    <g key={i} className="group/point cursor-pointer" transform="translate(0,0)">
                        <circle
                            cx={p.x}
                            cy={p.y}
                            r="4"
                            fill="#60A5FA" // Blue-400
                            stroke="#1E293B" // Slate-800
                            strokeWidth="2"
                            className="transition-transform duration-300 group-hover/point:scale-150 origin-center"
                            style={{ transformBox: 'fill-box', transformOrigin: 'center' }}
                        />
                        {/* Tooltip on hover (SVG title) */}
                        <title>{`${p.label}: ${p.value}`}</title>
                    </g>
                ))}

                {/* Labels */}
                {points.map((p, i) => {
                    const labelRadius = radius + 25;
                    const x = centerX + labelRadius * Math.cos(p.angle);
                    const y = centerY + labelRadius * Math.sin(p.angle);
                    const isLeft = x < centerX;

                    return (
                        <text
                            key={i}
                            x={x}
                            y={y}
                            textAnchor={Math.abs(x - centerX) < 5 ? 'middle' : isLeft ? 'end' : 'start'}
                            dominantBaseline="middle"
                            className="text-[10px] fill-slate-400 font-sans uppercase tracking-wider font-bold"
                            style={{ textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}
                        >
                            {p.label}
                        </text>
                    );
                })}
            </svg>
        </div>
    );
}
