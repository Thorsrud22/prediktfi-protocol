import React from 'react';
import { ArrowRight, ChevronRight, CornerDownLeft, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ProjectType, WizardFormData } from '../types';
import { getCategoryContextualFields } from '@/lib/ideaCategories';

interface WizardNavigationProps {
    currentStep: number;
    projectType: ProjectType;
    isSubmitting: boolean;
    onNext: () => void;
    onBack: () => void;
    canGoNext: boolean;
}

export function WizardNavigation({
    currentStep,
    projectType,
    isSubmitting,
    onNext,
    onBack,
    canGoNext
}: WizardNavigationProps) {

    const hasContextualFields = (type: ProjectType) => {
        return getCategoryContextualFields(type).length > 0;
    };

    return (
        <div className="mt-4 flex flex-col sm:flex-row items-center gap-6 animate-in fade-in duration-300 relative z-[110] pointer-events-auto">
            <div className={cn(
                "flex items-center gap-4 w-full",
                currentStep === 0 ? "sm:w-full justify-center" : "sm:w-auto"
            )}>
                {currentStep > 0 && (
                    <button
                        onClick={onBack}
                        className="flex-1 sm:flex-none px-6 py-3 rounded-xl border border-white/10 text-white/60 hover:text-white hover:bg-white/5 transition-colors font-mono uppercase text-xs tracking-widest flex items-center justify-center gap-2"
                    >
                        <ChevronRight size={14} className="rotate-180" />
                        Back
                    </button>
                )}
                {currentStep < 4 ? (
                    <button
                        onClick={onNext}
                        disabled={!canGoNext}
                        className="flex-1 sm:flex-none group px-10 py-4 bg-white text-black rounded-xl font-bold flex items-center justify-center gap-2 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-gray-200 transition-all font-mono uppercase text-xs tracking-widest relative z-[111] cursor-pointer pointer-events-auto select-none"
                    >
                        {currentStep === 3 || (currentStep === 2 && !hasContextualFields(projectType)) ? 'Review' : 'Continue'}
                        <CornerDownLeft size={14} className="group-hover:translate-x-1 transition-transform pointer-events-none" />
                    </button>
                ) : (
                    <button
                        onClick={onNext}
                        disabled={isSubmitting}
                        className="flex-1 sm:flex-none px-10 py-4 bg-white text-black rounded-xl font-bold flex items-center justify-center gap-3 disabled:opacity-50 hover:bg-gray-200 transition-all font-mono uppercase text-xs tracking-widest shadow-lg shadow-white/5 relative z-[111] pointer-events-auto select-none"
                    >
                        <Sparkles size={16} className="pointer-events-none" />
                        {isSubmitting ? 'Analyzing...' : 'Generate Report'}
                        <ArrowRight size={16} className="pointer-events-none" />
                    </button>
                )}
            </div>

            <div className="hidden sm:flex items-center gap-4 ml-auto text-xs font-mono text-white/30">
                <span className="flex items-center gap-1"><span className="bg-white/10 px-1.5 py-0.5 rounded text-white/60">Tab</span> to navigate</span>
                {currentStep === 0 && <span className="flex items-center gap-1"><span className="bg-white/10 px-1.5 py-0.5 rounded text-white/60">Click</span> to select</span>}
                {currentStep === 0 && <span className="flex items-center gap-1"><span className="bg-white/10 px-1.5 py-0.5 rounded text-white/60">Enter</span> to continue</span>}
                {currentStep === 1 && <span className="flex items-center gap-1"><span className="bg-white/10 px-1.5 py-0.5 rounded text-white/60">Enter</span> to proceed</span>}
                {currentStep === 2 && <span className="flex items-center gap-1"><span className="bg-white/10 px-1.5 py-0.5 rounded text-white/60">Cmd + Enter</span> to proceed</span>}
                {currentStep === 3 && <span className="flex items-center gap-1"><span className="bg-white/10 px-1.5 py-0.5 rounded text-white/60">Enter</span> to review</span>}
                {currentStep === 4 && <span className="flex items-center gap-1"><span className="bg-white/10 px-1.5 py-0.5 rounded text-white/60">Enter</span> to launch</span>}
            </div>
        </div>
    );
}
