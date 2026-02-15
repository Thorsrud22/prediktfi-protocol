import React, { forwardRef, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { WizardFormData, WizardErrors } from '../types';
import { WIZARD_CONSTANTS } from '../constants';

interface PitchStepProps {
    formData: WizardFormData;
    updateField: <K extends keyof WizardFormData>(field: K, value: WizardFormData[K]) => void;
    errors: WizardErrors;
    onKeyDown: (e: React.KeyboardEvent) => void;
}

export const PitchStep = forwardRef<HTMLTextAreaElement, PitchStepProps>(
    ({ formData, updateField, errors, onKeyDown }, ref) => {
        const meaningfulLength = useMemo(
            () => formData.description.replace(/\s/g, '').length,
            [formData.description]
        );

        return (
            <div className="animate-in fade-in slide-in-from-right-8 duration-500">
                <div className="relative space-y-3">
                    <label
                        htmlFor="project-pitch"
                        className="text-[10px] font-mono text-white/50 uppercase tracking-widest block"
                    >
                        The Pitch
                    </label>
                    <textarea
                        ref={ref}
                        id="project-pitch"
                        value={formData.description}
                        onChange={(e) => updateField('description', e.target.value)}
                        onKeyDown={onKeyDown}
                        placeholder={
                            formData.projectType === 'memecoin'
                                ? "Explain the viral potential, community vibe, and core narrative..."
                                : formData.projectType === 'ai'
                                    ? "Describe the model architecture, data source, and agent behavior..."
                                    : "Explain your mechanism, unique selling point, or narrative..."
                        }
                        className={cn(
                            "w-full min-h-[300px] bg-white/5 rounded-xl border border-white/10",
                            "p-6 text-xl sm:text-2xl font-medium text-white",
                            "placeholder:text-white/40 resize-y outline-none",
                            "focus:border-blue-500 focus:bg-white/10 transition-all leading-relaxed"
                        )}
                        aria-describedby={[errors.description ? 'pitch-error' : undefined, 'pitch-counter'].filter(Boolean).join(' ')}
                        aria-invalid={!!errors.description}
                    />
                    <div className="flex items-center justify-between gap-4 pt-1">
                        <div className="min-h-[20px]">
                            {errors.description && (
                                <div
                                    id="pitch-error"
                                    role="alert"
                                    className="text-sm text-red-400 font-mono animate-in fade-in slide-in-from-top-1 duration-300"
                                >
                                    {errors.description}
                                </div>
                            )}
                        </div>

                        <div className="flex items-center gap-4 shrink-0 pointer-events-none">
                            <span
                                id="pitch-counter"
                                className={cn(
                                    "text-xs font-mono transition-colors",
                                    meaningfulLength >= WIZARD_CONSTANTS.MIN_PITCH_CHARS ? "text-emerald-400" : "text-white/50"
                                )}
                            >
                                {meaningfulLength} characters excl. spaces (min {WIZARD_CONSTANTS.MIN_PITCH_CHARS})
                            </span>
                            <span className="text-xs font-mono text-white/50 bg-white/5 px-2 py-1 rounded hidden sm:inline-block">
                                Cmd/Ctrl + Enter ↵
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        );
    }
);

PitchStep.displayName = 'PitchStep';
