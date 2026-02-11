'use client';

import React from 'react';
import { motion } from 'framer-motion';

export default function AnalysisVisual() {
    return (
        <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none select-none">
            {/* Perspective Grid */}
            <div className="absolute inset-0 [perspective:1000px] [transform-style:preserve-3d]">
                <div
                    className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] [transform:rotateX(60deg)] origin-top opacity-20"
                    style={{
                        maskImage: 'linear-gradient(to bottom, transparent, black 10%, black 90%, transparent)'
                    }}
                />
            </div>

            {/* Floating Data Points */}
            <div className="absolute inset-0">
                {[...Array(6)].map((_, i) => (
                    <motion.div
                        key={i}
                        className="absolute w-1 h-1 bg-accent/40 rounded-full"
                        style={{
                            left: `${15 + Math.random() * 70}%`,
                            top: `${20 + Math.random() * 60}%`,
                        }}
                        animate={{
                            y: [0, -20, 0],
                            opacity: [0, 1, 0],
                            scale: [0, 1.5, 0],
                        }}
                        transition={{
                            duration: 3 + Math.random() * 2,
                            repeat: Infinity,
                            delay: Math.random() * 2,
                            ease: "easeInOut",
                        }}
                    />
                ))}
            </div>

            {/* Scanning Line */}
            <motion.div
                className="absolute left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-accent/30 to-transparent"
                style={{ top: '0%' }}
                animate={{
                    top: ['0%', '100%'],
                    opacity: [0, 1, 0],
                }}
                transition={{
                    duration: 3,
                    repeat: Infinity,
                    ease: "linear",
                    repeatDelay: 1
                }}
            />

            {/* Vignette for depth focus */}
            <div className="absolute inset-0 bg-radial-gradient from-transparent via-bg/50 to-bg pointer-events-none" />
        </div>
    );
}
// Forced update for Vercel build sync
