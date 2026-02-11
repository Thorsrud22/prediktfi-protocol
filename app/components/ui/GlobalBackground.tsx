'use client';

import React from 'react';

export default function GlobalBackground() {
    return (
        <div className="fixed inset-0 -z-10 h-full w-full pointer-events-none">
            {/* Subtle Grid Texture */}
            <div
                className="absolute inset-0 h-full w-full bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"
                style={{
                    maskImage: 'radial-gradient(ellipse 80% 80% at 50% 0%, black 60%, transparent 100%)',
                    WebkitMaskImage: 'radial-gradient(ellipse 80% 80% at 50% 0%, black 60%, transparent 100%)'
                }}
            />
        </div>
    );
}
