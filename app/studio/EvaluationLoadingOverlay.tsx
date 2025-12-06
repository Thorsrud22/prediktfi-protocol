import React, { useEffect, useState } from 'react';

const STEPS = [
    { label: "Parsing your idea", threshold: 30 },
    { label: "Checking market and risk signals", threshold: 70 },
    { label: "Preparing investor memo", threshold: 100 }
];

export default function EvaluationLoadingOverlay() {
    const [progress, setProgress] = useState(0);

    // Derive current step based on progress
    const currentStepIndex = STEPS.findIndex(step => progress < step.threshold);
    const activeStepIndex = currentStepIndex === -1 ? STEPS.length - 1 : currentStepIndex;
    const activeStep = STEPS[activeStepIndex];

    useEffect(() => {
        const startTime = Date.now();
        const duration = 12000; // 12 seconds to reach 90%

        const timer = setInterval(() => {
            const elapsed = Date.now() - startTime;
            // Logarithmic-ish ease out or just linear to 90
            let newProgress = (elapsed / duration) * 90;

            // Cap at 95% so it never finishes until the parent component unmounts (API done)
            if (newProgress > 95) newProgress = 95;

            setProgress(newProgress);
        }, 50);

        return () => clearInterval(timer);
    }, []);

    return (
        <div className="flex flex-col items-center justify-center min-h-[400px] w-full bg-slate-900/50 rounded-xl border border-white/10 backdrop-blur-sm p-12 text-center animate-in fade-in duration-700">
            {/* Simple tech spinner */}
            <div className="relative w-16 h-16 mb-8 opacity-80">
                <div className="absolute inset-0 border-2 border-white/5 rounded-full"></div>
                <div className="absolute inset-0 border-t-2 border-blue-500 rounded-full animate-spin"></div>
            </div>

            <h3 className="text-2xl font-bold text-white mb-8 tracking-tight">Evaluating your idea</h3>

            {/* Step Text */}
            <div className="h-16 flex flex-col items-center justify-center gap-2 mb-6">
                <p className="text-blue-400 font-mono text-xs uppercase tracking-widest bg-blue-500/10 px-3 py-1 rounded-full border border-blue-500/20">
                    Step {activeStepIndex + 1} of {STEPS.length}
                </p>
                <p key={activeStepIndex} className="text-lg text-blue-100/80 font-medium animate-in fade-in slide-in-from-bottom-2 duration-500">
                    {activeStep.label}...
                </p>
            </div>

            {/* Progress Bar */}
            <div className="w-full max-w-sm h-1.5 bg-white/5 rounded-full overflow-hidden relative">
                <div
                    className="absolute inset-y-0 left-0 bg-gradient-to-r from-blue-600 to-cyan-400 transition-all duration-100 ease-out"
                    style={{ width: `${progress}%` }}
                >
                    {/* Glow effect at the tip of the bar */}
                    <div className="absolute right-0 top-1/2 -translate-y-1/2 w-8 h-8 bg-cyan-400/50 blur-md rounded-full translate-x-1/2"></div>
                </div>
            </div>
        </div>
    );
}
