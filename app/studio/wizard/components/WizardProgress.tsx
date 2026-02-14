import React from 'react';
import { cn } from '@/lib/utils';
import { STEPS } from '../constants';

interface WizardProgressProps {
    currentStep: number;
    showSavedMsg: boolean;
}

export function WizardProgress({ currentStep, showSavedMsg }: WizardProgressProps) {
    const progress = ((currentStep + 1) / STEPS.length) * 100;

    return (
        <div className="flex flex-col mb-6 space-y-4">
            <div className="flex items-center justify-between gap-6">
                <div className="flex-1 h-1 bg-white/5 rounded-full overflow-hidden relative">
                    <div
                        className="h-full bg-blue-500 transition-all duration-500 ease-out"
                        style={{ width: `${progress}%` }}
                    />
                </div>
                <div className="flex items-center gap-4">
                    {showSavedMsg && (
                        <span className="text-[10px] font-mono text-emerald-400/60 uppercase tracking-widest animate-in fade-in duration-300">
                            Draft Auto-saved
                        </span>
                    )}
                    <div className="text-[10px] font-mono text-white/30 whitespace-nowrap tracking-widest">
                        STEP {currentStep + 1} / {STEPS.length}
                    </div>
                </div>
            </div>

            {/* Step Indicators - aria-hidden to avoid duplicate text during tests */}
            <div className="hidden sm:flex justify-between items-start" aria-hidden="true">
                {STEPS.map((step, idx) => (
                    <div
                        key={step.id}
                        className={cn(
                            "flex flex-col gap-1 transition-opacity duration-300",
                            idx === currentStep ? "opacity-100" : idx < currentStep ? "opacity-40" : "opacity-20"
                        )}
                        style={{ width: `${100 / STEPS.length}%` }}
                    >
                        <span className="text-[9px] font-mono uppercase tracking-tighter text-white">
                            {idx + 1}. {step.id === 'sector' ? 'Area' : step.id === 'details' ? 'Name' : step.id === 'pitch' ? 'The Pitch' : step.id === 'insights' ? 'Context' : 'Final'}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
}
