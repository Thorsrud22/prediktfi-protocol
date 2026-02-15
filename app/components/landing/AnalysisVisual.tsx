'use client';

import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';

export default function AnalysisVisual() {
    const reduceMotion = useReducedMotion();

    return (
        <div
            className="absolute inset-0 z-0 overflow-hidden pointer-events-none select-none"
            aria-hidden="true"
        >
            {/* Perspective Grid */}
            <div className="absolute inset-0 [perspective:1000px] [transform-style:preserve-3d]">
                <div
                    className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] [transform:rotateX(60deg)] origin-top opacity-20"
                    style={{
                        maskImage: 'linear-gradient(to bottom, transparent, black 10%, black 90%, transparent)',
                        WebkitMaskImage:
                            'linear-gradient(to bottom, transparent, black 10%, black 90%, transparent)',
                    }}
                />
            </div>

            {/* Floating Data Points */}
            <div className="absolute inset-0">
                {[
                    { left: '20%', top: '25%', duration: 4.5, delay: 0.2 },
                    { left: '75%', top: '30%', duration: 3.2, delay: 1.5 },
                    { left: '45%', top: '55%', duration: 3.8, delay: 0.8 },
                    { left: '25%', top: '75%', duration: 4.2, delay: 1.8 },
                    { left: '65%', top: '65%', duration: 3.5, delay: 0.5 },
                    { left: '50%', top: '35%', duration: 4.8, delay: 1.2 },
                ].map((point, i) => (
                    <motion.div
                        key={i}
                        className="absolute w-1 h-1 bg-accent/40 rounded-full"
                        style={{
                            left: point.left,
                            top: point.top,
                        }}
                        animate={
                            reduceMotion
                                ? undefined
                                : {
                                      y: [0, -20, 0],
                                      opacity: [0, 1, 0],
                                      scale: [0, 1.5, 0],
                                  }
                        }
                        transition={
                            reduceMotion
                                ? undefined
                                : {
                                      duration: point.duration,
                                      repeat: Infinity,
                                      delay: point.delay,
                                      ease: 'easeInOut',
                                  }
                        }
                    />
                ))}
            </div>

            {/* Scanning Line */}
            <motion.div
                className="absolute left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-accent/30 to-transparent"
                style={{
                    top: 0,
                    willChange: 'transform, opacity',
                }}
                animate={
                    reduceMotion
                        ? undefined
                        : {
                              transform: [
                                  'translate3d(0, 0, 0)',
                                  'translate3d(0, calc(100vh - 1px), 0)',
                              ],
                              opacity: [0, 1, 0],
                          }
                }
                transition={
                    reduceMotion
                        ? undefined
                        : {
                              duration: 3,
                              repeat: Infinity,
                              ease: 'linear',
                              repeatDelay: 1,
                          }
                }
            />

            {/* Vignette for depth focus */}
            <div
                className="absolute inset-0 pointer-events-none"
                style={{
                    background:
                        'radial-gradient(ellipse at 50% 50%, transparent 55%, rgba(10, 15, 30, 0.5) 78%, rgba(10, 15, 30, 0.92) 100%)',
                }}
            />
        </div>
    );
}
