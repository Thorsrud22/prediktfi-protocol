import React from 'react';
import { cn } from '@/lib/utils';
import { STEPS, type StepId } from '../constants';

const STEP_LABELS: Record<StepId, string> = {
    sector: 'Area',
    details: 'Name',
    pitch: 'The Pitch',
    insights: 'Context',
    review: 'Final',
};

function getStepLabel(stepId: StepId): string {
    return STEP_LABELS[stepId];
}

interface WizardProgressProps {
    currentStep: number;
    showSavedMsg: boolean;
}

export function WizardProgress({ currentStep, showSavedMsg }: WizardProgressProps) {
    const progress = ((currentStep + 1) / STEPS.length) * 100;

    return (
        <div className="flex flex-col mb-6 space-y-4">
            <div className="flex items-center justify-between gap-6">
                <div
                    role="progressbar"
                    aria-valuenow={currentStep + 1}
                    aria-valuemin={1}
                    aria-valuemax={STEPS.length}
                    aria-valuetext={`Step ${currentStep + 1} of ${STEPS.length}`}
                    className="flex-1 h-1 bg-white/5 rounded-full overflow-hidden relative"
                >
                    <div
                        className="h-full bg-blue-500 transition-all duration-500 ease-out"
                        style={{ width: `${progress}%` }}
                    />
                </div>
                <div className="flex items-center gap-4">
                    <div aria-live="polite" aria-atomic="true">
                        {showSavedMsg && (
                            <span className="text-[11px] font-mono text-emerald-400/70 uppercase tracking-widest animate-in fade-in duration-300">
                                Draft Auto-saved
                            </span>
                        )}
                    </div>
                    <div className="text-[11px] font-mono text-white/40 whitespace-nowrap tracking-widest">
                        STEP {currentStep + 1} / {STEPS.length}
                    </div>
                </div>
            </div>

            {/* Step indicators are decorative; progress info is conveyed by role="progressbar". */}
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
                        <span className="text-[11px] font-mono uppercase tracking-tight text-white">
                            {idx + 1}. {getStepLabel(step.id)}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
}
