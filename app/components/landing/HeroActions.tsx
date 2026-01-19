'use client';

import React, { useState } from 'react';
import AccessRequestModal from './AccessRequestModal';

export default function HeroActions() {
    const [isModalOpen, setIsModalOpen] = useState(false);

    return (
        <>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6 pt-8">
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="group relative px-8 py-4 rounded-full bg-gradient-to-r from-blue-600 to-sky-500 text-white font-semibold text-lg shadow-lg shadow-blue-500/25 hover:shadow-sky-500/40 transition-all duration-300 transform hover:-translate-y-0.5 overflow-hidden"
                >
                    <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                    <span className="relative flex items-center gap-2">
                        Request Access
                        <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                        </svg>
                    </span>
                </button>
            </div>

            <AccessRequestModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
            />
        </>
    );
}
