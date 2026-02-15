import React from 'react';
import { ArrowRight, ChevronRight, CornerDownLeft, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { STEP_INDEX } from '../constants';

interface WizardNavigationProps {
    currentStep: number;
    isSubmitting: boolean;
    onNext: () => void;
    onBack: () => void;
    canGoNext: boolean;
    nextLabel: 'Continue' | 'Review';
}

export function WizardNavigation({
    currentStep,
    isSubmitting,
    onNext,
    onBack,
    canGoNext,
    nextLabel,
}: WizardNavigationProps) {
    const isFirstStep = currentStep === STEP_INDEX.SECTOR;
    const isLastStep = currentStep === STEP_INDEX.REVIEW;
    const isNextDisabled = !canGoNext;

    return (
        <nav
            aria-label="Wizard navigation"
            className="mt-4 flex flex-col sm:flex-row items-center gap-6 animate-in fade-in duration-300 relative z-[110] pointer-events-auto"
        >
            <div className={cn(
                "flex items-center gap-4 w-full",
                isFirstStep ? 'sm:w-full justify-center' : 'sm:w-auto'
            )}>
                {!isFirstStep && (
                    <button
                        type="button"
                        onClick={onBack}
                        aria-label="Go back to previous step"
                        className="flex-1 sm:flex-none px-6 py-3 rounded-xl border border-white/10 text-white/60 hover:text-white hover:bg-white/5 transition-colors font-mono uppercase text-xs tracking-widest flex items-center justify-center gap-2"
                    >
                        <ChevronRight size={14} className="rotate-180" />
                        Back
                    </button>
                )}
                {!isLastStep ? (
                    <button
                        type="button"
                        onClick={onNext}
                        disabled={isNextDisabled}
                        aria-disabled={isNextDisabled}
                        aria-label={nextLabel === 'Review' ? 'Continue to review step' : 'Continue to next step'}
                        className="flex-1 sm:flex-none group px-10 py-4 bg-white text-black rounded-xl font-bold flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-200 transition-all font-mono uppercase text-xs tracking-widest relative z-[111] cursor-pointer pointer-events-auto select-none"
                    >
                        {nextLabel}
                        <CornerDownLeft size={14} className="group-hover:translate-x-1 transition-transform pointer-events-none" />
                    </button>
                ) : (
                    <button
                        type="button"
                        onClick={onNext}
                        disabled={isSubmitting}
                        aria-disabled={isSubmitting}
                        aria-label={isSubmitting ? 'Analysis in progress' : 'Generate report'}
                        className="flex-1 sm:flex-none px-10 py-4 bg-white text-black rounded-xl font-bold flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-200 transition-all font-mono uppercase text-xs tracking-widest shadow-lg shadow-white/5 relative z-[111] pointer-events-auto select-none"
                    >
                        <Sparkles size={16} className="pointer-events-none" />
                        {isSubmitting ? 'Analyzing...' : 'Generate Report'}
                        <ArrowRight size={16} className="pointer-events-none" />
                    </button>
                )}
            </div>

            <div className="hidden sm:flex items-center gap-4 ml-auto text-xs font-mono text-white/30">
                <span className="flex items-center gap-1"><span className="bg-white/10 px-1.5 py-0.5 rounded text-white/60">Tab</span> to navigate</span>
                {currentStep === STEP_INDEX.SECTOR && <span className="flex items-center gap-1"><span className="bg-white/10 px-1.5 py-0.5 rounded text-white/60">Click</span> to select</span>}
                {currentStep === STEP_INDEX.SECTOR && <span className="flex items-center gap-1"><span className="bg-white/10 px-1.5 py-0.5 rounded text-white/60">Enter</span> to continue</span>}
                {currentStep === STEP_INDEX.DETAILS && <span className="flex items-center gap-1"><span className="bg-white/10 px-1.5 py-0.5 rounded text-white/60">Enter</span> to proceed</span>}
                {currentStep === STEP_INDEX.PITCH && <span className="flex items-center gap-1"><span className="bg-white/10 px-1.5 py-0.5 rounded text-white/60">Cmd/Ctrl + Enter</span> to proceed</span>}
                {currentStep === STEP_INDEX.INSIGHTS && <span className="flex items-center gap-1"><span className="bg-white/10 px-1.5 py-0.5 rounded text-white/60">Enter</span> to review</span>}
                {currentStep === STEP_INDEX.REVIEW && <span className="flex items-center gap-1"><span className="bg-white/10 px-1.5 py-0.5 rounded text-white/60">Enter</span> to launch</span>}
            </div>
        </nav>
    );
}
