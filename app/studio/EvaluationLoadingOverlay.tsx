import React, { useEffect, useState } from 'react';

const STEPS = [
    "Parsing your idea",
    "Checking market and risk signals",
    "Preparing investor memo"
];

export default function EvaluationLoadingOverlay() {
    const [stepIndex, setStepIndex] = useState(0);

    useEffect(() => {
        const timer = setInterval(() => {
            setStepIndex((prev) => (prev + 1) % STEPS.length);
        }, 2000);
        return () => clearInterval(timer);
    }, []);

    return (
        <div className="flex flex-col items-center justify-center min-h-[400px] w-full bg-slate-900/50 rounded-xl border border-white/10 backdrop-blur-sm p-12 text-center animate-in fade-in duration-700">
            {/* Simple tech spinner */}
            <div className="relative w-16 h-16 mb-8">
                <div className="absolute inset-0 border-2 border-white/5 rounded-full"></div>
                <div className="absolute inset-0 border-t-2 border-blue-500 rounded-full animate-spin"></div>
            </div>

            <h3 className="text-2xl font-bold text-white mb-6 tracking-tight">Evaluating your idea</h3>

            <div className="h-6">
                <p key={stepIndex} className="text-blue-200/60 font-medium animate-in fade-in slide-in-from-bottom-2 duration-500">
                    {STEPS[stepIndex]}...
                </p>
            </div>
        </div>
    );
}
